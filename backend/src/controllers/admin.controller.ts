import bcrypt from "bcryptjs";
import { z } from "zod";
import { User } from "../models/User";
import { Destination } from "../models/Destination";
import { Hotel } from "../models/Hotel";
import { Guide } from "../models/Guide";
import { Itinerary } from "../models/Itinerary";
import { Review } from "../models/Review";
import { Contact } from "../models/Contact";
import { ActivityLog } from "../models/ActivityLog";
import { AiUsage } from "../models/AiUsage";
import { RefreshToken } from "../models/RefreshToken";
import { getSettings, Setting, DEFAULT_SETTINGS } from "../models/Setting";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { pageMeta, pageSchema } from "../utils/pagination";
import { escapeRegex } from "../utils/text";
import { logActivity } from "../services/activity.service";
import { recomputeRating, TargetType } from "../services/review.service";
import { PERMISSIONS } from "../types";
import { password } from "../validators/auth.validators";

const DAY = 86_400_000;
const since = (days: number) => new Date(Date.now() - days * DAY);

async function perDay(model: { aggregate: (p: object[]) => Promise<{ _id: string; n: number }[]> }, days = 30) {
  const rows = await model.aggregate([{ $match: { createdAt: { $gte: since(days) } } }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
  return rows.map((r) => ({ date: r._id, count: r.n }));
}

export const dashboard = asyncHandler(async (_req, res) => {
  const [users, destinations, hotels, guides, itineraries, pendingGuides, newContacts, pendingReviews, recentUsers, recentActivity] = await Promise.all([
    User.countDocuments(), Destination.countDocuments(), Hotel.countDocuments(), Guide.countDocuments(), Itinerary.countDocuments(),
    Guide.countDocuments({ status: "PENDING" }), Contact.countDocuments({ status: "NEW" }), Review.countDocuments({ status: "PENDING" }),
    User.find().sort({ createdAt: -1 }).limit(6),
    ActivityLog.find().sort({ createdAt: -1 }).limit(10).populate("actor", "name email"),
  ]);
  ok(res, { counts: { users, destinations, hotels, guides, itineraries, pendingGuides, newContacts, pendingReviews }, recentUsers, recentActivity });
});

export const analytics = asyncHandler(async (_req, res) => {
  const [registrations, itinerariesPerDay, topDestinations, byStyle, byRole] = await Promise.all([
    perDay(User as never), perDay(Itinerary as never),
    Destination.find().sort({ viewCount: -1 }).limit(5).select("name viewCount avgRating"),
    Itinerary.aggregate([{ $group: { _id: "$travelStyle", n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    User.aggregate([{ $group: { _id: "$role", n: { $sum: 1 } } }]),
  ]);
  ok(res, { registrations, itinerariesPerDay, topDestinations, byStyle: byStyle.map((r) => ({ style: r._id || "Unspecified", count: r.n })), byRole: byRole.map((r) => ({ role: r._id, count: r.n })) });
});

// ---- Users ----
const userListSchema = pageSchema.extend({ q: z.string().trim().max(80).optional(), role: z.enum(["SUPER_ADMIN", "ADMIN", "USER", "GUIDE"]).optional(), status: z.enum(["ACTIVE", "PENDING_APPROVAL", "DISABLED"]).optional() });
export const listUsers = asyncHandler(async (req, res) => {
  const q = userListSchema.parse(req.query);
  const f: Record<string, unknown> = {};
  if (q.q) f.$or = [{ name: new RegExp(escapeRegex(q.q), "i") }, { email: new RegExp(escapeRegex(q.q), "i") }];
  if (q.role) f.role = q.role;
  if (q.status) f.accountStatus = q.status;
  const [items, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit), User.countDocuments(f)]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});

export const setUserStatus = asyncHandler(async (req, res) => {
  const accountStatus = z.enum(["ACTIVE", "DISABLED"]).parse(req.body.accountStatus);
  const target = await User.findById(req.params.id);
  if (!target) throw new AppError(404, "User not found", "NOT_FOUND");
  if (target.id === req.user!.id) throw new AppError(400, "You cannot change your own status", "SELF_ACTION");
  // Admins manage only USER/GUIDE accounts. Touching ADMIN/SUPER_ADMIN needs SUPER_ADMIN.
  if (target.role !== "USER" && target.role !== "GUIDE" && req.user!.role !== "SUPER_ADMIN") throw new AppError(403, "Forbidden", "FORBIDDEN");
  if (target.role === "SUPER_ADMIN") throw new AppError(403, "Super admin accounts cannot be disabled via API", "FORBIDDEN");
  target.accountStatus = accountStatus;
  await target.save();
  if (accountStatus === "DISABLED") await RefreshToken.updateMany({ user: target._id }, { revoked: true });
  logActivity(req.user!.id, `user.${accountStatus.toLowerCase()}`, "User", target.id);
  ok(res, target);
});

// ---- Guides approval ----
export const listGuides = asyncHandler(async (req, res) => {
  const status = z.enum(["ACTIVE", "PENDING", "INACTIVE"]).optional().parse(req.query.status);
  ok(res, await Guide.find(status ? { status } : {}).sort({ createdAt: -1 }).limit(200));
});
export const createGuide = asyncHandler(async (req, res) => ok(res, await Guide.create({ status: "ACTIVE", ...req.body }), 201));
export const updateGuide = asyncHandler(async (req, res) => {
  const g = await Guide.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!g) throw new AppError(404, "Guide not found", "NOT_FOUND");
  if (req.body.status && g.user) {
    await User.updateOne({ _id: g.user }, { accountStatus: req.body.status === "ACTIVE" ? "ACTIVE" : req.body.status === "PENDING" ? "PENDING_APPROVAL" : "DISABLED" });
    logActivity(req.user!.id, `guide.${String(req.body.status).toLowerCase()}`, "Guide", g.id);
  }
  ok(res, g);
});
export const deleteGuide = asyncHandler(async (req, res) => {
  const g = await Guide.findByIdAndDelete(req.params.id);
  if (!g) throw new AppError(404, "Guide not found", "NOT_FOUND");
  if (g.user) await User.updateOne({ _id: g.user }, { accountStatus: "DISABLED" });
  ok(res, { message: "Deleted" });
});

// ---- Reviews moderation ----
export const listReviews = asyncHandler(async (req, res) => {
  const q = pageSchema.extend({ status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional() }).parse(req.query);
  const f = q.status ? { status: q.status } : {};
  const [items, total] = await Promise.all([Review.find(f).populate("user", "name email").populate("target", "name").sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit), Review.countDocuments(f)]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});
export const moderateReview = asyncHandler(async (req, res) => {
  const status = z.enum(["PENDING", "APPROVED", "REJECTED"]).parse(req.body.status);
  const r = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!r) throw new AppError(404, "Review not found", "NOT_FOUND");
  await recomputeRating(r.targetType as TargetType, r.target);
  ok(res, r);
});
export const deleteReview = asyncHandler(async (req, res) => {
  const r = await Review.findByIdAndDelete(req.params.id);
  if (!r) throw new AppError(404, "Review not found", "NOT_FOUND");
  await recomputeRating(r.targetType as TargetType, r.target);
  ok(res, { message: "Deleted" });
});

// ---- Contacts ----
export const listContacts = asyncHandler(async (req, res) => {
  const q = pageSchema.extend({ status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).optional() }).parse(req.query);
  const f = q.status ? { status: q.status } : {};
  const [items, total] = await Promise.all([Contact.find(f).populate("guide", "name").sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit), Contact.countDocuments(f)]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});
export const updateContact = asyncHandler(async (req, res) => {
  const body = z.object({ status: z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).optional(), adminNote: z.string().max(1000).optional() }).strict().parse(req.body);
  const c = await Contact.findByIdAndUpdate(req.params.id, { $set: body }, { new: true });
  if (!c) throw new AppError(404, "Inquiry not found", "NOT_FOUND");
  ok(res, c);
});
export const deleteContact = asyncHandler(async (req, res) => {
  if (!(await Contact.findByIdAndDelete(req.params.id))) throw new AppError(404, "Inquiry not found", "NOT_FOUND");
  ok(res, { message: "Deleted" });
});

// ================= SUPER ADMIN =================
export const createAdmin = asyncHandler(async (req, res) => {
  const b = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().email(), password, permissions: z.array(z.enum(PERMISSIONS)).default([]) }).strict().parse(req.body);
  if (await User.exists({ email: b.email })) throw new AppError(409, "Email already registered", "EMAIL_TAKEN");
  const u = await User.create({ name: b.name, email: b.email, passwordHash: await bcrypt.hash(b.password, 12), role: "ADMIN", permissions: b.permissions, isEmailVerified: true });
  logActivity(req.user!.id, "admin.create", "User", u.id, { permissions: b.permissions }, req.ip);
  ok(res, u, 201);
});
export const listAdmins = asyncHandler(async (_req, res) => ok(res, await User.find({ role: { $in: ["ADMIN", "SUPER_ADMIN"] } }).sort({ createdAt: -1 })));

/** Only SUPER_ADMIN reaches this. SUPER_ADMIN itself can never be created or edited here (seed script only). */
export const setRoleAndPermissions = asyncHandler(async (req, res) => {
  const b = z.object({ role: z.enum(["ADMIN", "USER", "GUIDE"]).optional(), permissions: z.array(z.enum(PERMISSIONS)).optional() }).strict().parse(req.body);
  const t = await User.findById(req.params.id);
  if (!t) throw new AppError(404, "User not found", "NOT_FOUND");
  if (t.role === "SUPER_ADMIN" || t.id === req.user!.id) throw new AppError(403, "This account cannot be modified here", "FORBIDDEN");
  if (b.role) t.role = b.role;
  if (b.permissions) t.permissions = b.permissions;
  if (t.role !== "ADMIN") t.permissions = [];
  await t.save();
  await RefreshToken.updateMany({ user: t._id }, { revoked: true }); // force re-login so new role/permissions apply
  logActivity(req.user!.id, "user.role_change", "User", t.id, { role: t.role, permissions: t.permissions }, req.ip);
  ok(res, t);
});

export const activityLogs = asyncHandler(async (req, res) => {
  const q = pageSchema.extend({ action: z.string().max(60).optional() }).parse(req.query);
  const f = q.action ? { action: new RegExp(`^${escapeRegex(q.action)}`) } : {};
  const [items, total] = await Promise.all([ActivityLog.find(f).populate("actor", "name email role").sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit), ActivityLog.countDocuments(f)]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});

export const aiUsage = asyncHandler(async (_req, res) => {
  const [total, success, byKind, perDayRows, avg] = await Promise.all([
    AiUsage.countDocuments(), AiUsage.countDocuments({ success: true }),
    AiUsage.aggregate([{ $group: { _id: "$kind", n: { $sum: 1 } } }]),
    perDay(AiUsage as never), AiUsage.aggregate([{ $group: { _id: null, ms: { $avg: "$durationMs" } } }]),
  ]);
  ok(res, { total, success, failed: total - success, avgDurationMs: Math.round(avg[0]?.ms ?? 0), byKind: byKind.map((r) => ({ kind: r._id, count: r.n })), perDay: perDayRows });
});

export const security = asyncHandler(async (_req, res) => {
  const [failedLogins24h, disabledAccounts, revokedTokens24h, recentFailures, adminActions] = await Promise.all([
    ActivityLog.countDocuments({ action: "auth.login_failed", createdAt: { $gte: since(1) } }),
    User.countDocuments({ accountStatus: "DISABLED" }),
    RefreshToken.countDocuments({ revoked: true, updatedAt: { $gte: since(1) } }),
    ActivityLog.find({ action: "auth.login_failed" }).sort({ createdAt: -1 }).limit(20),
    ActivityLog.find({ action: /^(user\.role_change|admin\.create)/ }).sort({ createdAt: -1 }).limit(20).populate("actor", "name email"),
  ]);
  ok(res, { failedLogins24h, disabledAccounts, revokedTokens24h, recentFailures, adminActions });
});

export const getSystemSettings = asyncHandler(async (_req, res) => ok(res, await getSettings()));
export const updateSystemSettings = asyncHandler(async (req, res) => {
  const b = z.object({ aiEnabled: z.boolean(), registrationOpen: z.boolean(), guideRegistrationOpen: z.boolean(), maintenanceMessage: z.string().max(300) }).partial().strict().parse(req.body);
  for (const [key, value] of Object.entries(b)) if (key in DEFAULT_SETTINGS) await Setting.updateOne({ key }, { value }, { upsert: true });
  logActivity(req.user!.id, "settings.update", "Setting", undefined, b);
  ok(res, await getSettings());
});

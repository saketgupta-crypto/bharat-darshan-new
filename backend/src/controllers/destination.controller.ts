import { Request } from "express";
import { z } from "zod";
import { Destination } from "../models/Destination";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { pageMeta, pageSchema } from "../utils/pagination";
import { escapeRegex, slugify } from "../utils/text";
import { uploadImage } from "../services/cloudinary.service";
import { logActivity } from "../services/activity.service";
import { CATEGORIES } from "../validators/content.validators";

const listSchema = pageSchema.extend({
  q: z.string().trim().max(80).optional(),
  state: z.string().trim().max(60).optional(),
  category: z.enum(CATEGORIES).optional(),
  minBudget: z.coerce.number().min(0).optional(),
  maxBudget: z.coerce.number().min(0).optional(),
  featured: z.enum(["true", "false"]).optional(),
  sort: z.enum(["popular", "rating", "budget_asc", "budget_desc", "newest"]).default("newest"),
});

const canSeeInactive = (req: Request) => req.user?.role === "SUPER_ADMIN" || (req.user?.role === "ADMIN" && req.user.permissions.includes("destinations:write"));

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "destination";
  let slug = base, i = 1;
  while (await Destination.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) slug = `${base}-${++i}`;
  return slug;
}

export const list = asyncHandler(async (req, res) => {
  const q = listSchema.parse(req.query);
  const filter: Record<string, unknown> = {};
  if (!canSeeInactive(req)) filter.status = "ACTIVE";
  if (q.q) { const rx = new RegExp(escapeRegex(q.q), "i"); filter.$or = [{ name: rx }, { state: rx }, { description: rx }]; }
  if (q.state) filter.state = new RegExp(`^${escapeRegex(q.state)}$`, "i");
  if (q.category) filter.category = q.category;
  if (q.featured) filter.featured = q.featured === "true";
  if (q.minBudget !== undefined || q.maxBudget !== undefined) {
    filter.averageBudget = { ...(q.minBudget !== undefined ? { $gte: q.minBudget } : {}), ...(q.maxBudget !== undefined ? { $lte: q.maxBudget } : {}) };
  }
  // const sort = ({ popular: { viewCount: -1 }, rating: { avgRating: -1 }, budget_asc: { averageBudget: 1 }, budget_desc: { averageBudget: -1 }, newest: { createdAt: -1 } } as const)[q.sort];
  const sortOptions: Record<string, Record<string, 1 | -1>> = {
  popular: { viewCount: -1 },
  rating: { avgRating: -1 },
  budget_asc: { averageBudget: 1 },
  budget_desc: { averageBudget: -1 },
  newest: { createdAt: -1 },
};

const sort = sortOptions[q.sort];

  const [items, total] = await Promise.all([
    Destination.find(filter).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit),
    Destination.countDocuments(filter),
  ]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});

export const featured = asyncHandler(async (_req, res) => {
  ok(res, await Destination.find({ status: "ACTIVE", featured: true }).sort({ viewCount: -1 }).limit(8));
});
export const popular = asyncHandler(async (_req, res) => {
  ok(res, await Destination.find({ status: "ACTIVE" }).sort({ viewCount: -1, avgRating: -1 }).limit(8));
});
export const states = asyncHandler(async (_req, res) => {
  ok(res, (await Destination.distinct("state", { status: "ACTIVE" })).sort());
});

export const getBySlug = asyncHandler(async (req, res) => {
  const d = await Destination.findOneAndUpdate({ slug: req.params.slug, ...(canSeeInactive(req) ? {} : { status: "ACTIVE" }) }, { $inc: { viewCount: 1 } }, { new: true });
  if (!d) throw new AppError(404, "Destination not found", "NOT_FOUND");
  if (req.user) {
    await User.updateOne({ _id: req.user.id }, { $pull: { recentlyViewed: d._id } });
    await User.updateOne({ _id: req.user.id }, { $push: { recentlyViewed: { $each: [d._id], $slice: -10 } } });
  }
  ok(res, d);
});

export const related = asyncHandler(async (req, res) => {
  const d = await Destination.findOne({ slug: req.params.slug });
  if (!d) throw new AppError(404, "Destination not found", "NOT_FOUND");
  ok(res, await Destination.find({ status: "ACTIVE", _id: { $ne: d._id }, $or: [{ category: d.category }, { state: d.state }] }).sort({ viewCount: -1 }).limit(4));
});

export const create = asyncHandler(async (req, res) => {
  const d = await Destination.create({ ...req.body, slug: await uniqueSlug(req.body.name) });
  logActivity(req.user!.id, "destination.create", "Destination", d.id, undefined, req.ip);
  ok(res, d, 201);
});

export const update = asyncHandler(async (req, res) => {
  const patch = { ...req.body } as Record<string, unknown>;
  if (typeof patch.name === "string") patch.slug = await uniqueSlug(patch.name, req.params.id);
  const d = await Destination.findByIdAndUpdate(req.params.id, { $set: patch }, { new: true, runValidators: true });
  if (!d) throw new AppError(404, "Destination not found", "NOT_FOUND");
  logActivity(req.user!.id, "destination.update", "Destination", d.id, undefined, req.ip);
  ok(res, d);
});

export const setStatus = asyncHandler(async (req, res) => {
  const status = z.enum(["ACTIVE", "INACTIVE"]).parse(req.body.status);
  const d = await Destination.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!d) throw new AppError(404, "Destination not found", "NOT_FOUND");
  ok(res, d);
});

export const remove = asyncHandler(async (req, res) => {
  const d = await Destination.findByIdAndDelete(req.params.id);
  if (!d) throw new AppError(404, "Destination not found", "NOT_FOUND");
  logActivity(req.user!.id, "destination.delete", "Destination", d.id, undefined, req.ip);
  ok(res, { message: "Deleted" });
});

export const uploadImages = asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new AppError(400, "No images provided", "BAD_FILE");
  const urls = await Promise.all(files.map((f) => uploadImage(f.buffer, "destinations")));
  const d = await Destination.findByIdAndUpdate(req.params.id, { $push: { images: { $each: urls } } }, { new: true });
  if (!d) throw new AppError(404, "Destination not found", "NOT_FOUND");
  ok(res, d);
});

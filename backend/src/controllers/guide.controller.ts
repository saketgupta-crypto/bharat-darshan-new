import { z } from "zod";
import { Guide } from "../models/Guide";
import { Contact } from "../models/Contact";
import { Review } from "../models/Review";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { pageMeta, pageSchema } from "../utils/pagination";
import { escapeRegex } from "../utils/text";
import { uploadImage } from "../services/cloudinary.service";

const listSchema = pageSchema.extend({
  q: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  destination: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  language: z.string().trim().max(30).optional(),
  minExperience: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  available: z.enum(["true", "false"]).optional(),
  sort: z.enum(["rating", "experience", "price_asc", "price_desc"]).default("rating"),
});

export const list = asyncHandler(async (req, res) => {
  const q = listSchema.parse(req.query);
  const f: Record<string, unknown> = { status: "ACTIVE" };
  if (q.q) f.$or = [{ name: new RegExp(escapeRegex(q.q), "i") }, { location: new RegExp(escapeRegex(q.q), "i") }];
  if (q.location) f.location = new RegExp(escapeRegex(q.location), "i");
  if (q.destination) f.destinations = q.destination;
  if (q.language) f.languages = new RegExp(`^${escapeRegex(q.language)}$`, "i");
  if (q.minExperience !== undefined) f.experienceYears = { $gte: q.minExperience };
  if (q.maxPrice !== undefined) f.pricePerDay = { $lte: q.maxPrice };
  if (q.available === "true") f.availability = "AVAILABLE";
  // const sort = ({ rating: { rating: -1 }, experience: { experienceYears: -1 }, price_asc: { pricePerDay: 1 }, price_desc: { pricePerDay: -1 } } as const)[q.sort];
  const sortOptions: Record<string, Record<string, 1 | -1>> = {
  rating: { rating: -1 },
  experience: { experienceYears: -1 },
  price_asc: { pricePerDay: 1 },
  price_desc: { pricePerDay: -1 },
};

const sort = sortOptions[q.sort];
  const [items, total] = await Promise.all([Guide.find(f).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit), Guide.countDocuments(f)]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});

export const getOne = asyncHandler(async (req, res) => {
  const g = await Guide.findOne({ _id: req.params.id, status: "ACTIVE" }).populate("destinations", "name slug");
  if (!g) throw new AppError(404, "Guide not found", "NOT_FOUND");
  ok(res, g);
});

// ---- Guide panel (role GUIDE) ----
async function myGuide(userId: string) {
  const g = await Guide.findOne({ user: userId });
  if (!g) throw new AppError(404, "Guide profile not found", "NOT_FOUND");
  return g;
}
export const getMine = asyncHandler(async (req, res) => ok(res, await myGuide(req.user!.id)));
export const updateMine = asyncHandler(async (req, res) => {
  const g = await myGuide(req.user!.id);
  Object.assign(g, req.body);
  await g.save();
  if (req.body.name) await User.updateOne({ _id: req.user!.id }, { name: req.body.name });
  ok(res, g);
});
export const myInquiries = asyncHandler(async (req, res) => {
  const g = await myGuide(req.user!.id);
  ok(res, await Contact.find({ guide: g._id }).sort({ createdAt: -1 }).limit(100));
});
export const updateMyInquiry = asyncHandler(async (req, res) => {
  const g = await myGuide(req.user!.id);
  const status = z.enum(["NEW", "IN_PROGRESS", "RESOLVED"]).parse(req.body.status);
  const c = await Contact.findOneAndUpdate({ _id: req.params.id, guide: g._id }, { status }, { new: true });
  if (!c) throw new AppError(404, "Inquiry not found", "NOT_FOUND");
  ok(res, c);
});
export const myReviews = asyncHandler(async (req, res) => {
  const g = await myGuide(req.user!.id);
  ok(res, await Review.find({ targetType: "Guide", target: g._id, status: "APPROVED" }).populate("user", "name profileImage").sort({ createdAt: -1 }).limit(100));
});
export const myStats = asyncHandler(async (req, res) => {
  const g = await myGuide(req.user!.id);
  const [newInq, totalInq] = await Promise.all([Contact.countDocuments({ guide: g._id, status: "NEW" }), Contact.countDocuments({ guide: g._id })]);
  ok(res, { rating: g.rating, reviewCount: g.reviewCount, newInquiries: newInq, totalInquiries: totalInq, availability: g.availability, status: g.status });
});
export const uploadMyPhoto = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError(400, "No image provided", "BAD_FILE");
  const g = await myGuide(req.user!.id);
  g.profileImage = await uploadImage(req.file.buffer, "guides");
  await g.save();
  await User.updateOne({ _id: req.user!.id }, { profileImage: g.profileImage });
  ok(res, g);
});

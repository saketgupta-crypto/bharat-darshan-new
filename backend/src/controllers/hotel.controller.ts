import { Request } from "express";
import { z } from "zod";
import { Hotel } from "../models/Hotel";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { pageMeta, pageSchema } from "../utils/pagination";
import { escapeRegex } from "../utils/text";
import { uploadImage } from "../services/cloudinary.service";
import { logActivity } from "../services/activity.service";

const listSchema = pageSchema.extend({
  q: z.string().trim().max(80).optional(),
  location: z.string().trim().max(80).optional(),
  destination: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  amenities: z.string().max(300).optional(),
  sort: z.enum(["rating", "price_asc", "price_desc", "newest"]).default("rating"),
});
const isManager = (req: Request) => req.user?.role === "SUPER_ADMIN" || (req.user?.role === "ADMIN" && req.user.permissions.includes("hotels:write"));

export const list = asyncHandler(async (req, res) => {
  const q = listSchema.parse(req.query);
  const f: Record<string, unknown> = {};
  if (!isManager(req)) f.status = "ACTIVE";
  if (q.q) f.$or = [{ name: new RegExp(escapeRegex(q.q), "i") }, { location: new RegExp(escapeRegex(q.q), "i") }];
  if (q.location) f.location = new RegExp(escapeRegex(q.location), "i");
  if (q.destination) f.destination = q.destination;
  if (q.minPrice !== undefined || q.maxPrice !== undefined) f.pricePerNight = { ...(q.minPrice !== undefined ? { $gte: q.minPrice } : {}), ...(q.maxPrice !== undefined ? { $lte: q.maxPrice } : {}) };
  if (q.minRating !== undefined) f.rating = { $gte: q.minRating };
  if (q.amenities) f.amenities = { $all: q.amenities.split(",").map((a) => new RegExp(`^${escapeRegex(a.trim())}$`, "i")).filter((_, i, arr) => arr.length > 0 && i < 10) };
  // const sort = ({ rating: { rating: -1 }, price_asc: { pricePerNight: 1 }, price_desc: { pricePerNight: -1 }, newest: { createdAt: -1 } } as const)[q.sort];

  const sortOptions: Record<string, Record<string, 1 | -1>> = {
  rating: { rating: -1 },
  price_asc: { pricePerNight: 1 },
  price_desc: { pricePerNight: -1 },
  newest: { createdAt: -1 },
};

const sort = sortOptions[q.sort];
  const [items, total] = await Promise.all([Hotel.find(f).sort(sort).skip((q.page - 1) * q.limit).limit(q.limit), Hotel.countDocuments(f)]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});

export const getOne = asyncHandler(async (req, res) => {
  const h = await Hotel.findOne({ _id: req.params.id, ...(isManager(req) ? {} : { status: "ACTIVE" }) }).populate("destination", "name slug");
  if (!h) throw new AppError(404, "Hotel not found", "NOT_FOUND");
  ok(res, h);
});
export const create = asyncHandler(async (req, res) => {
  const h = await Hotel.create(req.body);
  logActivity(req.user!.id, "hotel.create", "Hotel", h.id, undefined, req.ip);
  ok(res, h, 201);
});
export const update = asyncHandler(async (req, res) => {
  const h = await Hotel.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true });
  if (!h) throw new AppError(404, "Hotel not found", "NOT_FOUND");
  ok(res, h);
});
export const remove = asyncHandler(async (req, res) => {
  const h = await Hotel.findByIdAndDelete(req.params.id);
  if (!h) throw new AppError(404, "Hotel not found", "NOT_FOUND");
  logActivity(req.user!.id, "hotel.delete", "Hotel", h.id, undefined, req.ip);
  ok(res, { message: "Deleted" });
});
export const uploadImages = asyncHandler(async (req, res) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (!files.length) throw new AppError(400, "No images provided", "BAD_FILE");
  const urls = await Promise.all(files.map((f) => uploadImage(f.buffer, "hotels")));
  const h = await Hotel.findByIdAndUpdate(req.params.id, { $push: { images: { $each: urls } } }, { new: true });
  if (!h) throw new AppError(404, "Hotel not found", "NOT_FOUND");
  ok(res, h);
});

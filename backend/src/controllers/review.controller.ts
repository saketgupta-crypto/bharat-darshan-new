import { z } from "zod";
import { Review } from "../models/Review";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { pageMeta, pageSchema } from "../utils/pagination";
import { recomputeRating, targetExists, TargetType } from "../services/review.service";

const listSchema = pageSchema.extend({
  targetType: z.enum(["Destination", "Hotel", "Guide"]),
  target: z.string().regex(/^[a-f\d]{24}$/i),
});

export const list = asyncHandler(async (req, res) => {
  const q = listSchema.parse(req.query);
  const f = { targetType: q.targetType, target: q.target, status: "APPROVED" };
  const [items, total] = await Promise.all([
    Review.find(f).populate("user", "name profileImage").sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit),
    Review.countDocuments(f),
  ]);
  ok(res, items, 200, pageMeta(q.page, q.limit, total));
});

export const mine = asyncHandler(async (req, res) => {
  ok(res, await Review.find({ user: req.user!.id }).populate("target", "name").sort({ createdAt: -1 }));
});

export const create = asyncHandler(async (req, res) => {
  const { targetType, target, rating, comment } = req.body as { targetType: TargetType; target: string; rating: number; comment: string };
  if (!(await targetExists(targetType, target))) throw new AppError(404, "Target not found", "NOT_FOUND");
  if (await Review.exists({ user: req.user!.id, targetType, target })) throw new AppError(409, "You have already reviewed this", "DUPLICATE_REVIEW");
  const r = await Review.create({ user: req.user!.id, targetType, target, rating, comment });
  await recomputeRating(targetType, target);
  ok(res, r, 201);
});

export const update = asyncHandler(async (req, res) => {
  const r = await Review.findOneAndUpdate({ _id: req.params.id, user: req.user!.id }, { $set: req.body }, { new: true });
  if (!r) throw new AppError(404, "Review not found", "NOT_FOUND");
  await recomputeRating(r.targetType as TargetType, r.target);
  ok(res, r);
});

export const remove = asyncHandler(async (req, res) => {
  const r = await Review.findOneAndDelete({ _id: req.params.id, user: req.user!.id });
  if (!r) throw new AppError(404, "Review not found", "NOT_FOUND");
  await recomputeRating(r.targetType as TargetType, r.target);
  ok(res, { message: "Deleted" });
});

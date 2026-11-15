import { Types } from "mongoose";
import { Review } from "../models/Review";
import { Destination } from "../models/Destination";
import { Hotel } from "../models/Hotel";
import { Guide } from "../models/Guide";

export type TargetType = "Destination" | "Hotel" | "Guide";

export async function recomputeRating(type: TargetType, id: string | Types.ObjectId) {
  const [agg] = await Review.aggregate([
    { $match: { targetType: type, target: new Types.ObjectId(String(id)), status: "APPROVED" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, n: { $sum: 1 } } },
  ]);
  const avg = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const n = agg?.n ?? 0;
  if (type === "Destination") await Destination.updateOne({ _id: id }, { avgRating: avg, reviewCount: n });
  else if (type === "Hotel") await Hotel.updateOne({ _id: id }, { rating: avg, reviewCount: n });
  else await Guide.updateOne({ _id: id }, { rating: avg, reviewCount: n });
}

export async function targetExists(type: TargetType, id: string) {
  if (!Types.ObjectId.isValid(id)) return false;
  const Model = type === "Destination" ? Destination : type === "Hotel" ? Hotel : Guide;
  return !!(await Model.exists({ _id: id }));
}

import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: ["Destination", "Hotel", "Guide"], required: true },
    target: { type: Schema.Types.ObjectId, required: true, refPath: "targetType" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "APPROVED", index: true },
  },
  { timestamps: true }
);
schema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });
schema.index({ targetType: 1, target: 1, status: 1 });

export const Review = model("Review", schema);

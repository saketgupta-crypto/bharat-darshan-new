import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, trim: true },
    profileImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, required: true, index: true },
    destinations: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    languages: { type: [String], default: [] },
    experienceYears: { type: Number, default: 0, min: 0 },
    specialization: { type: [String], default: [] },
    pricePerDay: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    availability: { type: String, enum: ["AVAILABLE", "BUSY", "UNAVAILABLE"], default: "AVAILABLE" },
    unavailableDates: [Date],
    status: { type: String, enum: ["ACTIVE", "PENDING", "INACTIVE"], default: "PENDING", index: true },
  },
  { timestamps: true }
);
schema.index({ name: "text", location: "text" });

export const Guide = model("Guide", schema);

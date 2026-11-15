import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    state: { type: String, required: true, index: true },
    region: { type: String, default: "" },
    category: {
      type: String,
      enum: ["Heritage", "Adventure", "Cultural", "Nature", "Spiritual", "Beach", "Wildlife"],
      required: true,
      index: true,
    },
    images: { type: [String], default: [] },
    attractions: { type: [String], default: [] },
    bestTimeToVisit: { type: String, default: "" },
    averageBudget: { type: Number, default: 0, min: 0 },
    recommendedDuration: { type: String, default: "" },
    coordinates: { lat: Number, lng: Number },
    featured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);
schema.index({ name: "text", description: "text", state: "text" });

export const Destination = model("Destination", schema);

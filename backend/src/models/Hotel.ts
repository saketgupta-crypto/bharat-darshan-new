import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    location: { type: String, required: true, index: true },
    destination: { type: Schema.Types.ObjectId, ref: "Destination", index: true },
    images: { type: [String], default: [] },
    pricePerNight: { type: Number, required: true, min: 0 },
    amenities: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    contactDetails: { phone: String, email: String, website: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE", index: true },
  },
  { timestamps: true }
);
schema.index({ name: "text", location: "text" });

export const Hotel = model("Hotel", schema);

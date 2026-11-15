import { Schema, model } from "mongoose";

const activitySchema = new Schema(
  { time: String, title: String, description: String, estimatedCost: Number, estimatedTravelTime: String },
  { _id: false }
);

const dailyPlanSchema = new Schema(
  {
    day: Number,
    title: String,
    morning: [activitySchema],
    afternoon: [activitySchema],
    evening: [activitySchema],
    places: [String],
    food: [String],
    transport: String,
    estimatedDailyCost: Number,
  },
  { _id: false }
);

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    startingLocation: { type: String, default: "" },
    duration: { type: Number, required: true, min: 1, max: 30 },
    travelDates: { start: Date, end: Date },
    travellers: { adults: { type: Number, default: 1 }, children: { type: Number, default: 0 } },
    budget: { type: Number, default: 0 },
    travelStyle: { type: String, default: "" },
    transportation: { type: String, default: "" },
    accommodation: { type: String, default: "" },
    interests: { type: [String], default: [] },
    dietary: { type: String, default: "" },
    specialRequirements: { type: String, default: "" },
    overview: String,
    destinationSummary: String,
    dailyPlans: [dailyPlanSchema],
    accommodationSuggestions: [String],
    estimatedTotalBudget: Number,
    tips: [String],
    safety: [String],
    aiGenerated: { type: Boolean, default: true },
    aiModel: String,
    disclaimer: {
      type: String,
      default: "Prices and travel times are AI-generated estimates. Verify before booking.",
    },
    shareToken: { type: String, index: true, sparse: true },
    isShared: { type: Boolean, default: false },
    status: { type: String, enum: ["DRAFT", "SAVED", "COMPLETED"], default: "SAVED", index: true },
  },
  { timestamps: true }
);

export const Itinerary = model("Itinerary", schema);

import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    kind: { type: String, enum: ["generate", "regenerate", "modify"], required: true },
    model: String,
    success: Boolean,
    durationMs: Number,
    error: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const AiUsage = model("AiUsage", schema);

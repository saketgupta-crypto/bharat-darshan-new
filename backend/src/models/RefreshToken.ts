import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    jti: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    revoked: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    userAgent: String,
  },
  { timestamps: true }
);
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model("RefreshToken", schema);

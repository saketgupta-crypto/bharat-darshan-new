import { Schema, model, InferSchemaType, HydratedDocument } from "mongoose";
import { PERMISSIONS, ROLES } from "../types";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    profileImage: { type: String, default: "" },
    phone: { type: String, default: "" },
    role: { type: String, enum: ROLES, default: "USER", index: true },
    permissions: { type: [String], enum: PERMISSIONS, default: [] },
    isEmailVerified: { type: Boolean, default: false },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "PENDING_APPROVAL", "DISABLED"],
      default: "ACTIVE",
    },
    preferences: {
      travelStyles: { type: [String], default: [] },
      budgetRange: { type: String, default: "" },
      dietary: { type: String, default: "" },
    },
    favoriteDestinations: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    recentlyViewed: [{ type: Schema.Types.ObjectId, ref: "Destination" }],
    guideProfile: { type: Schema.Types.ObjectId, ref: "Guide" },
    emailOtpHash: { type: String, select: false },
    emailOtpExpires: { type: Date, select: false },
    emailOtpAttempts: { type: Number, default: 0, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.set("toJSON", {
  transform: (_d, ret) => {
    const r = ret as Record<string, unknown>;
    delete r.passwordHash;
    delete r.emailOtpHash;
    delete r.emailOtpExpires;
    delete r.emailOtpAttempts;
    delete r.resetTokenHash;
    delete r.resetTokenExpires;
    delete r.__v;
    return r;
  },
});

export type IUser = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<IUser>;
export const User = model("User", userSchema);

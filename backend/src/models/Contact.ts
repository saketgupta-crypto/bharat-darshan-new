import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    subject: { type: String, default: "" },
    message: { type: String, required: true, maxlength: 3000 },
    guide: { type: Schema.Types.ObjectId, ref: "Guide", index: true },
    status: { type: String, enum: ["NEW", "IN_PROGRESS", "RESOLVED"], default: "NEW", index: true },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Contact = model("Contact", schema);

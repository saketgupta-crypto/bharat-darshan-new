import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", index: true },
    action: { type: String, required: true, index: true },
    entity: String,
    entityId: String,
    meta: Schema.Types.Mixed,
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const ActivityLog = model("ActivityLog", schema);

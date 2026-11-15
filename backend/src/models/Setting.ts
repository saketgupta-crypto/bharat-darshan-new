import { Schema, model } from "mongoose";

const schema = new Schema({ key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed }, { timestamps: true });
export const Setting = model("Setting", schema);

export const DEFAULT_SETTINGS = { aiEnabled: true, registrationOpen: true, guideRegistrationOpen: true, maintenanceMessage: "" };
export async function getSettings() {
  const rows = await Setting.find();
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) } as typeof DEFAULT_SETTINGS;
}

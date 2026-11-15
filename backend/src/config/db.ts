import mongoose from "mongoose";
import { env } from "./env";

export async function connectDB(uri: string = env.MONGODB_URI) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
  await mongoose.syncIndexes();
}

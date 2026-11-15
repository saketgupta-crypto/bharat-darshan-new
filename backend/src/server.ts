import { env } from "./config/env";
import { connectDB } from "./config/db";
import { createApp } from "./app";

(async () => {
  await connectDB();
  createApp().listen(env.PORT, () => console.log(`API listening on :${env.PORT} (${env.NODE_ENV})`));
})().catch((e) => {
  console.error("Failed to start", e);
  process.exit(1);
});

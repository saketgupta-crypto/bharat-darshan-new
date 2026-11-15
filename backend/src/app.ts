import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler, notFound } from "./middleware/error";
import { globalLimiter } from "./middleware/rateLimit";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // Render sits behind a proxy
  app.use(helmet());
  app.use(cors({ origin: env.FRONTEND_URL.split(",").map((s) => s.trim()), credentials: true }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(globalLimiter);
  app.use("/api/v1", routes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}

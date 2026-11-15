import multer from "multer";
import { AppError } from "../utils/AppError";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new AppError(400, "Only JPEG, PNG or WebP images allowed", "BAD_FILE")),
});

import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

let configured = false;
function configure() {
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    throw new AppError(503, "Image uploads are not configured on the server", "UPLOAD_NOT_CONFIGURED");
  }
  if (!configured) {
    cloudinary.config({ cloud_name: env.CLOUDINARY_CLOUD_NAME, api_key: env.CLOUDINARY_API_KEY, api_secret: env.CLOUDINARY_API_SECRET, secure: true });
    configured = true;
  }
}

/** multer's mimetype is client-supplied, so verify the real file signature too. */
export function isRealImage(b: Buffer) {
  if (b.length < 12) return false;
  const jpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const png = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  const webp = b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP";
  return jpeg || png || webp;
}

export async function uploadImage(buf: Buffer, folder: string): Promise<string> {
  configure();
  if (!isRealImage(buf)) throw new AppError(400, "File is not a valid image", "BAD_FILE");
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: `bharat-darshan/${folder}`, resource_type: "image" }, (err, res) =>
        err || !res ? reject(err ?? new Error("Upload failed")) : resolve(res.secure_url)
      )
      .end(buf);
  });
}

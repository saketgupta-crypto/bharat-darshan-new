import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { Permission, Role } from "../types";

export interface AccessPayload {
  sub: string;
  role: Role;
  permissions: Permission[];
}

export const signAccessToken = (p: AccessPayload) =>
  jwt.sign(p, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });

export const verifyAccessToken = (t: string) => jwt.verify(t, env.JWT_ACCESS_SECRET) as AccessPayload;

export const signRefreshToken = (sub: string, jti: string) =>
  jwt.sign({ sub, jti }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });

export const verifyRefreshToken = (t: string) =>
  jwt.verify(t, env.JWT_REFRESH_SECRET) as { sub: string; jti: string };

export const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");
export const randomOtp = () => crypto.randomInt(100000, 1000000).toString();
export const randomToken = () => crypto.randomBytes(32).toString("hex");

import { CookieOptions, Request, Response } from "express";
import * as auth from "../services/auth.service";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { isProd } from "../config/env";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { logActivity } from "../services/activity.service";

const COOKIE = "bd_refresh";
const cookieOpts = (maxAge?: number): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax", // frontend (Vercel) and API (Render) are cross-site in production
  path: "/api/v1/auth",
  ...(maxAge ? { maxAge } : {}),
});

const sendSession = (res: Response, s: { user: unknown; accessToken: string; refreshToken: string; refreshMaxAgeMs: number }) => {
  res.cookie(COOKIE, s.refreshToken, cookieOpts(s.refreshMaxAgeMs));
  return ok(res, { user: s.user, accessToken: s.accessToken });
};

export const register = asyncHandler(async (req, res) => {
  const r = await auth.register(req.body);
  ok(res, { ...r, message: "Verification code sent to your email" }, 201);
});
export const verifyEmail = asyncHandler(async (req, res) => {
  await auth.verifyEmail(req.body.email, req.body.otp);
  ok(res, { message: "Email verified" });
});
export const resendOtp = asyncHandler(async (req, res) => {
  await auth.resendOtp(req.body.email);
  ok(res, { message: "If the account exists, a new code was sent" });
});
export const login = asyncHandler(async (req, res) => {
  const s = await auth.login(req.body.email, req.body.password, req.headers["user-agent"]).catch((e) => {
    logActivity(undefined, "auth.login_failed", "User", undefined, { email: req.body.email, reason: (e as { code?: string }).code }, req.ip);
    throw e;
  });
  logActivity(s.user.id, "auth.login", "User", s.user.id, undefined, req.ip);
  sendSession(res, s);
});
export const refresh = asyncHandler(async (req, res) => {
  const s = await auth.refresh(req.cookies?.[COOKIE], req.headers["user-agent"]);
  sendSession(res, s);
});
export const logout = asyncHandler(async (req, res) => {
  await auth.logout(req.cookies?.[COOKIE]);
  res.clearCookie(COOKIE, cookieOpts());
  ok(res, { message: "Logged out" });
});
export const forgotPassword = asyncHandler(async (req, res) => {
  await auth.forgotPassword(req.body.email);
  ok(res, { message: "If the account exists, a reset link was sent" });
});
export const resetPassword = asyncHandler(async (req, res) => {
  await auth.resetPassword(req.body.email, req.body.token, req.body.password);
  ok(res, { message: "Password reset. Please log in." });
});
export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.id);
  if (!user) throw new AppError(404, "User not found", "NOT_FOUND");
  ok(res, { user });
});

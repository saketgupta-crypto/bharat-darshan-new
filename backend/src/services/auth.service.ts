import bcrypt from "bcryptjs";
import crypto from "crypto";
import { env } from "../config/env";
import { User, UserDoc } from "../models/User";
import { Guide } from "../models/Guide";
import { RefreshToken } from "../models/RefreshToken";
import { AppError } from "../utils/AppError";
import { randomOtp, randomToken, sha256, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/tokens";
import { sendOtpEmail, sendResetEmail } from "./email.service";
import { Permission, Role } from "../types";
import { getSettings } from "../models/Setting";

const OTP_TTL_MS = 10 * 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 12);

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
  asGuide?: boolean;
  guide?: { location: string; languages: string[]; experienceYears: number; pricePerDay: number };
}

async function issueOtp(user: UserDoc) {
  const otp = randomOtp();
  user.emailOtpHash = sha256(otp);
  user.emailOtpExpires = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  await user.save();
  await sendOtpEmail(user.email, user.name, otp);
}

export async function register(input: RegisterInput) {
  const settings = await getSettings();
  if (!settings.registrationOpen || (input.asGuide && !settings.guideRegistrationOpen)) throw new AppError(403, "Registration is currently closed", "REGISTRATION_CLOSED");
  const existing = await User.findOne({ email: input.email });
  if (existing) throw new AppError(409, "Email already registered", "EMAIL_TAKEN");

  const passwordHash = await bcrypt.hash(input.password, 12);
  // Role is decided server-side: only USER or GUIDE are self-service. Never taken from arbitrary input.
  const role: Role = input.asGuide ? "GUIDE" : "USER";
  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    phone: input.phone ?? "",
    role,
    accountStatus: role === "GUIDE" ? "PENDING_APPROVAL" : "ACTIVE",
  });

  if (role === "GUIDE" && input.guide) {
    const guide = await Guide.create({ user: user._id, name: user.name, status: "PENDING", ...input.guide });
    user.guideProfile = guide._id;
    await user.save();
  }
  await issueOtp(user);
  return { email: user.email };
}

export async function verifyEmail(email: string, otp: string) {
  const user = await User.findOne({ email }).select("+emailOtpHash +emailOtpExpires +emailOtpAttempts");
  if (!user || !user.emailOtpHash || !user.emailOtpExpires) throw new AppError(400, "Invalid or expired code", "BAD_OTP");
  if (user.emailOtpExpires < new Date() || (user.emailOtpAttempts ?? 0) >= 5) {
    throw new AppError(400, "Invalid or expired code", "BAD_OTP");
  }
  const a = Buffer.from(sha256(otp));
  const b = Buffer.from(user.emailOtpHash);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    user.emailOtpAttempts = (user.emailOtpAttempts ?? 0) + 1;
    await user.save();
    throw new AppError(400, "Invalid or expired code", "BAD_OTP");
  }
  user.isEmailVerified = true;
  user.emailOtpHash = undefined;
  user.emailOtpExpires = undefined;
  await user.save();
}

export async function resendOtp(email: string) {
  const user = await User.findOne({ email });
  if (user && !user.isEmailVerified) await issueOtp(user); // silent when unknown: no account enumeration
}

async function createSession(user: UserDoc, userAgent?: string, family: string = crypto.randomUUID()) {
  const jti = crypto.randomUUID();
  await RefreshToken.create({ user: user._id, jti, family, expiresAt: new Date(Date.now() + REFRESH_TTL_MS), userAgent });
  const accessToken = signAccessToken({ sub: user.id, role: user.role as Role, permissions: user.permissions as Permission[] });
  return { accessToken, refreshToken: signRefreshToken(user.id, jti), refreshMaxAgeMs: REFRESH_TTL_MS };
}

export async function login(email: string, password: string, userAgent?: string) {
  const user = await User.findOne({ email }).select("+passwordHash");
  const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw new AppError(401, "Invalid email or password", "BAD_CREDENTIALS");
  if (user.accountStatus === "DISABLED") throw new AppError(403, "Account disabled", "ACCOUNT_DISABLED");
  if (!user.isEmailVerified) throw new AppError(403, "Please verify your email first", "EMAIL_NOT_VERIFIED");
  if (user.accountStatus === "PENDING_APPROVAL") throw new AppError(403, "Your guide account is awaiting admin approval", "PENDING_APPROVAL");
  const session = await createSession(user, userAgent);
  return { user, ...session };
}

/** Rotation: each refresh token is single-use. Re-use of a rotated token revokes the whole family (theft detection). */
export async function refresh(token: string | undefined, userAgent?: string) {
  if (!token) throw new AppError(401, "No session", "NO_SESSION");
  let payload: { sub: string; jti: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new AppError(401, "Invalid session", "INVALID_SESSION");
  }
  const record = await RefreshToken.findOne({ jti: payload.jti });
  if (!record) throw new AppError(401, "Invalid session", "INVALID_SESSION");
  if (record.revoked) {
    await RefreshToken.updateMany({ family: record.family }, { revoked: true });
    throw new AppError(401, "Session revoked", "INVALID_SESSION");
  }
  const user = await User.findById(payload.sub);
  if (!user || user.accountStatus !== "ACTIVE") throw new AppError(401, "Account unavailable", "INVALID_SESSION");
  record.revoked = true;
  await record.save();
  const session = await createSession(user, userAgent, record.family);
  return { user, ...session };
}

export async function logout(token: string | undefined) {
  if (!token) return;
  try {
    const { jti } = verifyRefreshToken(token);
    const rec = await RefreshToken.findOne({ jti });
    if (rec) await RefreshToken.updateMany({ family: rec.family }, { revoked: true });
  } catch {
    /* already invalid */
  }
}

export async function forgotPassword(email: string) {
  const user = await User.findOne({ email });
  if (!user || user.accountStatus === "DISABLED") return; // never reveal whether the account exists
  const token = randomToken();
  user.resetTokenHash = sha256(token);
  user.resetTokenExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  await sendResetEmail(user.email, user.name, `${env.FRONTEND_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`);
}

export async function resetPassword(email: string, token: string, newPassword: string) {
  const user = await User.findOne({ email, resetTokenHash: sha256(token), resetTokenExpires: { $gt: new Date() } }).select("+resetTokenHash +resetTokenExpires");
  if (!user) throw new AppError(400, "Invalid or expired reset link", "BAD_RESET");
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { revoked: true }); // sign out everywhere
}

export async function changePassword(userId: string, current: string, next: string) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user || !(await bcrypt.compare(current, user.passwordHash))) throw new AppError(400, "Current password is incorrect", "BAD_PASSWORD");
  user.passwordHash = await bcrypt.hash(next, 12);
  await user.save();
  await RefreshToken.updateMany({ user: user._id }, { revoked: true });
}

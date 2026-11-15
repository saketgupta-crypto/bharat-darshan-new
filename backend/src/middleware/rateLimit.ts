import rateLimit from "express-rate-limit";

// Limiters are bypassed only under NODE_ENV=test so the integration suite can make many calls from one IP.
const base = { standardHeaders: true, legacyHeaders: false, skip: () => process.env.NODE_ENV === "test" } as const;
const msg = (m: string) => ({ success: false, error: { code: "RATE_LIMITED", message: m } });

export const globalLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 600, message: msg("Too many requests") });
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 20, message: msg("Too many attempts, try again later") });
export const otpLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 8, message: msg("Too many OTP requests") });
export const contactLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 5, message: msg("Too many messages, try later") });
export const aiLimiter = rateLimit({ ...base, windowMs: 60 * 60 * 1000, limit: 15, message: msg("AI generation limit reached, try later") });

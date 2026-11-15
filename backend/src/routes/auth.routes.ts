import { Router } from "express";
import * as c from "../controllers/auth.controller";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authLimiter, otpLimiter } from "../middleware/rateLimit";
import { emailOnlySchema, loginSchema, registerSchema, resetPasswordSchema, verifyEmailSchema } from "../validators/auth.validators";

const r = Router();
r.post("/register", authLimiter, validate(registerSchema), c.register);
r.post("/verify-email", otpLimiter, validate(verifyEmailSchema), c.verifyEmail);
r.post("/resend-otp", otpLimiter, validate(emailOnlySchema), c.resendOtp);
r.post("/login", authLimiter, validate(loginSchema), c.login);
r.post("/refresh", c.refresh);
r.post("/logout", c.logout);
r.post("/forgot-password", otpLimiter, validate(emailOnlySchema), c.forgotPassword);
r.post("/reset-password", authLimiter, validate(resetPasswordSchema), c.resetPassword);
r.get("/me", authenticate, c.me);
export default r;

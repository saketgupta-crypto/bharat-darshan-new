import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(120);
export const password = z
  .string()
  .min(8, "At least 8 characters")
  .max(72)
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/[0-9]/, "Must contain a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  phone: z.string().trim().max(20).optional(),
  asGuide: z.boolean().optional(),
  guide: z
    .object({
      location: z.string().trim().min(2).max(100),
      languages: z.array(z.string().trim().min(2)).min(1).max(10),
      experienceYears: z.number().min(0).max(60),
      pricePerDay: z.number().min(0).max(1_000_000),
    })
    .optional(),
}).refine((d) => !d.asGuide || !!d.guide, { message: "Guide details required", path: ["guide"] });

export const verifyEmailSchema = z.object({ email, otp: z.string().regex(/^\d{6}$/) });
export const emailOnlySchema = z.object({ email });
export const loginSchema = z.object({ email, password: z.string().min(1).max(72) });
export const resetPasswordSchema = z.object({ email, token: z.string().min(20).max(200), password });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });
export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    phone: z.string().trim().max(20).optional(),
    profileImage: z.string().url().max(500).optional(),
    preferences: z
      .object({
        travelStyles: z.array(z.string().max(30)).max(10).optional(),
        budgetRange: z.string().max(30).optional(),
        dietary: z.string().max(60).optional(),
      })
      .optional(),
  })
  .strict(); // rejects role/permissions/etc. → no privilege escalation via profile

import { z } from "zod";

const url = z.string().max(500);
export const CATEGORIES = ["Heritage", "Adventure", "Cultural", "Nature", "Spiritual", "Beach", "Wildlife"] as const;

export const destinationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(5000),
  state: z.string().trim().min(2).max(60),
  region: z.string().trim().max(40).optional(),
  category: z.enum(CATEGORIES),
  images: z.array(url).max(12).optional(),
  attractions: z.array(z.string().trim().max(100)).max(30).optional(),
  bestTimeToVisit: z.string().trim().max(100).optional(),
  averageBudget: z.number().min(0).max(10_000_000).optional(),
  recommendedDuration: z.string().trim().max(50).optional(),
  coordinates: z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }).optional(),
  featured: z.boolean().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export const destinationUpdateSchema = destinationSchema.partial().strict();

export const hotelSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(3000).optional(),
  location: z.string().trim().min(2).max(120),
  destination: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  images: z.array(url).max(12).optional(),
  pricePerNight: z.number().min(0).max(10_000_000),
  amenities: z.array(z.string().trim().max(60)).max(30).optional(),
  contactDetails: z.object({ phone: z.string().max(30).optional(), email: z.string().email().optional(), website: z.string().url().optional() }).optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export const hotelUpdateSchema = hotelSchema.partial().strict();

export const guideSelfSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(2000),
  profileImage: url,
  location: z.string().trim().min(2).max(100),
  languages: z.array(z.string().trim().min(2).max(30)).min(1).max(10),
  experienceYears: z.number().min(0).max(60),
  specialization: z.array(z.string().trim().max(40)).max(10),
  pricePerDay: z.number().min(0).max(1_000_000),
  availability: z.enum(["AVAILABLE", "BUSY", "UNAVAILABLE"]),
  unavailableDates: z.array(z.coerce.date()).max(366),
}).partial().strict();

export const guideAdminSchema = guideSelfSchema.extend({
  destinations: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).optional(),
  status: z.enum(["ACTIVE", "PENDING", "INACTIVE"]).optional(),
}).partial().strict();

export const reviewCreateSchema = z.object({
  targetType: z.enum(["Destination", "Hotel", "Guide"]),
  target: z.string().regex(/^[a-f\d]{24}$/i),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2000),
});
export const reviewUpdateSchema = z.object({ rating: z.number().int().min(1).max(5).optional(), comment: z.string().trim().min(3).max(2000).optional() }).strict();

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(120),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(150).optional(),
  message: z.string().trim().min(10).max(3000),
  guide: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  website: z.string().max(500).optional(), // honeypot: real users leave it empty; controller silently drops non-empty
});

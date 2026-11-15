import { Router } from "express";
import * as dest from "../controllers/destination.controller";
import * as hotel from "../controllers/hotel.controller";
import * as guide from "../controllers/guide.controller";
import * as review from "../controllers/review.controller";
import * as contact from "../controllers/contact.controller";
import { authenticate, optionalAuth, requirePermission, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { imageUpload } from "../middleware/upload";
import { contactLimiter } from "../middleware/rateLimit";
import { contactSchema, destinationSchema, destinationUpdateSchema, guideSelfSchema, hotelSchema, hotelUpdateSchema, reviewCreateSchema, reviewUpdateSchema } from "../validators/content.validators";

export const destinations = Router();
destinations.get("/", optionalAuth, dest.list);
destinations.get("/featured", dest.featured);
destinations.get("/popular", dest.popular);
destinations.get("/states", dest.states);
destinations.get("/:slug/related", dest.related);
destinations.get("/:slug", optionalAuth, dest.getBySlug);
destinations.post("/", authenticate, requirePermission("destinations:write"), validate(destinationSchema), dest.create);
destinations.patch("/:id", authenticate, requirePermission("destinations:write"), validate(destinationUpdateSchema), dest.update);
destinations.patch("/:id/status", authenticate, requirePermission("destinations:write"), dest.setStatus);
destinations.post("/:id/images", authenticate, requirePermission("destinations:write"), imageUpload.array("images", 6), dest.uploadImages);
destinations.delete("/:id", authenticate, requirePermission("destinations:write"), dest.remove);

export const hotels = Router();
hotels.get("/", optionalAuth, hotel.list);
hotels.get("/:id", optionalAuth, hotel.getOne);
hotels.post("/", authenticate, requirePermission("hotels:write"), validate(hotelSchema), hotel.create);
hotels.patch("/:id", authenticate, requirePermission("hotels:write"), validate(hotelUpdateSchema), hotel.update);
hotels.post("/:id/images", authenticate, requirePermission("hotels:write"), imageUpload.array("images", 6), hotel.uploadImages);
hotels.delete("/:id", authenticate, requirePermission("hotels:write"), hotel.remove);

export const guides = Router();
guides.get("/", guide.list);
guides.use("/me", authenticate, requireRole("GUIDE"));
guides.get("/me/profile", guide.getMine);
guides.patch("/me/profile", validate(guideSelfSchema), guide.updateMine);
guides.post("/me/photo", imageUpload.single("image"), guide.uploadMyPhoto);
guides.get("/me/stats", guide.myStats);
guides.get("/me/inquiries", guide.myInquiries);
guides.patch("/me/inquiries/:id", guide.updateMyInquiry);
guides.get("/me/reviews", guide.myReviews);
guides.get("/:id", guide.getOne);

export const reviews = Router();
reviews.get("/", review.list);
reviews.get("/mine", authenticate, review.mine);
reviews.post("/", authenticate, validate(reviewCreateSchema), review.create);
reviews.patch("/:id", authenticate, validate(reviewUpdateSchema), review.update);
reviews.delete("/:id", authenticate, review.remove);

export const contacts = Router();
contacts.post("/", contactLimiter, validate(contactSchema), contact.submit);

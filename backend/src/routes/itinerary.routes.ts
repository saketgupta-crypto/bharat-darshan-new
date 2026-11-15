import { Router } from "express";
import { z } from "zod";
import * as c from "../controllers/itinerary.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { aiLimiter } from "../middleware/rateLimit";

const id = z.string().regex(/^[a-f\d]{24}$/i);
export const itineraries = Router();
itineraries.get("/shared/:token", c.getShared);
itineraries.use(authenticate);
itineraries.get("/", c.list);
itineraries.get("/:id", validate(z.object({ id }), "params"), c.getOne);
itineraries.get("/:id/pdf", validate(z.object({ id }), "params"), c.pdf);
itineraries.patch("/:id", validate(z.object({ id }), "params"), validate(c.itineraryUpdateSchema), c.update);
itineraries.post("/:id/share", validate(z.object({ id }), "params"), c.share);
itineraries.delete("/:id", validate(z.object({ id }), "params"), c.remove);

export const ai = Router();
ai.use(authenticate, aiLimiter);
ai.post("/generate-itinerary", validate(c.planInputSchema), c.generate);
ai.post("/regenerate-itinerary", validate(z.object({ itineraryId: id, day: z.number().int().min(1).max(30).optional() })), c.regenerate);
ai.post("/modify-itinerary", validate(z.object({ itineraryId: id, instruction: z.string().trim().min(3).max(500) })), c.modify);

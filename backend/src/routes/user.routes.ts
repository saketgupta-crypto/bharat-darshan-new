import { Router } from "express";
import * as c from "../controllers/user.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { changePasswordSchema, updateProfileSchema } from "../validators/auth.validators";

const r = Router();
r.use(authenticate);
r.get("/profile", c.getProfile);
r.get("/dashboard", c.dashboard);
r.patch("/profile", validate(updateProfileSchema), c.updateProfile);
r.patch("/change-password", validate(changePasswordSchema), c.changePasswordHandler);
r.post("/favorites/:destinationId", c.toggleFavorite);
export default r;

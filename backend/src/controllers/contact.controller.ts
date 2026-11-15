import { Guide } from "../models/Guide";
import { Contact } from "../models/Contact";
import { asyncHandler } from "../utils/asyncHandler";
import { ok } from "../utils/response";
import { AppError } from "../utils/AppError";
import { sendContactConfirmation } from "../services/email.service";

export const submit = asyncHandler(async (req, res) => {
  const { website, ...data } = req.body as { website?: string; guide?: string; [k: string]: unknown };
  if (website) return ok(res, { message: "Message received" }, 201); // honeypot hit: pretend success, store nothing
  if (data.guide && !(await Guide.exists({ _id: data.guide, status: "ACTIVE" }))) throw new AppError(404, "Guide not found", "NOT_FOUND");
  const c = await Contact.create(data);
  sendContactConfirmation(c.email, c.name).catch((e) => console.error("confirmation email failed", e)); // never fail the request on email errors
  ok(res, { message: "Message received. We will get back to you soon." }, 201);
});

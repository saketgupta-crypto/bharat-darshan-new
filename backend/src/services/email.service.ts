import { Resend } from "resend";
import { env } from "../config/env";

let client: Resend | null = null;
const getClient = () => (client ??= new Resend(env.RESEND_API_KEY));

/** Sends via Resend. In dev/test without a key it logs instead of failing, so local flows keep working. */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    if (env.NODE_ENV === "production") throw new Error("Email provider not configured");
    if (env.NODE_ENV !== "test") console.warn(`[email:dev] to=${to} subject="${subject}"\n${html.replace(/<[^>]+>/g, " ")}`);
    return;
  }
  const { error } = await getClient().emails.send({ from: env.EMAIL_FROM, to, subject, html });
  if (error) throw new Error(`Resend error: ${error.message}`);
}

const wrap = (title: string, body: string) =>
  `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px"><h2 style="color:#c2410c">Bharat Darshan</h2><h3>${title}</h3>${body}</div>`;

export const sendOtpEmail = (to: string, name: string, otp: string) =>
  sendEmail(to, "Verify your email", wrap("Verify your email", `<p>Hi ${escapeHtml(name)},</p><p>Your verification code is:</p><p style="font-size:28px;letter-spacing:6px"><b>${otp}</b></p><p>It expires in 10 minutes.</p>`));

export const sendResetEmail = (to: string, name: string, link: string) =>
  sendEmail(to, "Reset your password", wrap("Reset your password", `<p>Hi ${escapeHtml(name)},</p><p><a href="${link}">Click here to reset your password</a>. This link expires in 30 minutes.</p><p>If you did not request this, ignore this email.</p>`));

export const sendContactConfirmation = (to: string, name: string) =>
  sendEmail(to, "We received your message", wrap("Thanks for reaching out", `<p>Hi ${escapeHtml(name)}, we have received your message and will reply soon.</p>`));

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

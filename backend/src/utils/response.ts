import { Response } from "express";

export const ok = (res: Response, data: unknown, status = 200, meta?: unknown) =>
  res.status(status).json({ success: true, data, ...(meta ? { meta } : {}) });

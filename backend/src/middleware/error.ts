import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { AppError } from "../utils/AppError";
import { isProd } from "../config/env";

export const notFound = (_req: Request, _res: Response, next: NextFunction) =>
  next(new AppError(404, "Route not found", "NOT_FOUND"));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  let status = 500;
  let message = "Internal server error";
  let code = "INTERNAL_ERROR";
  let details: unknown;

  if (err instanceof AppError) {
    ({ statusCode: status, message, code, details } = err);
  } else if (err instanceof ZodError) {
    status = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = err.flatten().fieldErrors;
  } else if (err instanceof jwt.JsonWebTokenError) {
    status = 401;
    message = "Invalid or expired token";
    code = "INVALID_TOKEN";
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, [v.message]]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Invalid identifier";
    code = "BAD_ID";
  } else if ((err as { code?: number })?.code === 11000) {
    status = 409;
    message = "Resource already exists";
    code = "DUPLICATE";
  } else if ((err as { name?: string })?.name === "MulterError") {
    status = 400;
    message = (err as Error).message;
    code = "UPLOAD_ERROR";
  }

  if (status >= 500) console.error(err);
  res.status(status).json({
    success: false,
    error: { code, message, ...(details ? { details } : {}), ...(!isProd && status >= 500 ? { stack: (err as Error)?.stack } : {}) },
  });
};

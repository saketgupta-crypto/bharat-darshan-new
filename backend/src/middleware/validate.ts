import { NextFunction, Request, Response } from "express";
import { ZodSchema } from "zod";

type Part = "body" | "query" | "params";
export const validate =
  (schema: ZodSchema, part: Part = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    if (part === "query") Object.defineProperty(req, "query", { value: result.data, writable: true });
    else (req as unknown as Record<string, unknown>)[part] = result.data;
    next();
  };

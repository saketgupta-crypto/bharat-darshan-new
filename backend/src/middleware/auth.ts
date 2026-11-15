import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../utils/tokens";
import { Permission, Role } from "../types";
import { User } from "../models/User";

/** Requires a valid access token AND an ACTIVE account (checked against the DB so disabled users lose access immediately). */
export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new AppError(401, "Authentication required", "UNAUTHENTICATED");
    const payload = verifyAccessToken(header.slice(7));
    const user = await User.findById(payload.sub).select("role permissions accountStatus");
    if (!user || user.accountStatus === "DISABLED") throw new AppError(401, "Account unavailable", "UNAUTHENTICATED");
    req.user = { id: user.id, role: user.role as Role, permissions: user.permissions as Permission[] };
    next();
  } catch (e) {
    next(e instanceof AppError ? e : new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, () => next());
};

export const requireRole =
  (...roles: Role[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
    if (!roles.includes(req.user.role)) return next(new AppError(403, "Forbidden", "FORBIDDEN"));
    next();
  };

/** SUPER_ADMIN passes always; ADMIN needs the granular permission granted by a SUPER_ADMIN. */
export const requirePermission =
  (perm: Permission) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const u = req.user;
    if (!u) return next(new AppError(401, "Authentication required", "UNAUTHENTICATED"));
    if (u.role === "SUPER_ADMIN") return next();
    if (u.role === "ADMIN" && u.permissions.includes(perm)) return next();
    next(new AppError(403, `Missing permission: ${perm}`, "FORBIDDEN"));
  };

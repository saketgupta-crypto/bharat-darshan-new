export const ROLES = ["SUPER_ADMIN", "ADMIN", "USER", "GUIDE"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "users:manage",
  "destinations:write",
  "hotels:write",
  "guides:manage",
  "reviews:moderate",
  "contacts:manage",
  "analytics:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export interface AuthUser {
  id: string;
  role: Role;
  permissions: Permission[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

import { ActivityLog } from "../models/ActivityLog";

export const logActivity = (actor: string | undefined, action: string, entity?: string, entityId?: string, meta?: unknown, ip?: string) =>
  ActivityLog.create({ actor, action, entity, entityId, meta, ip }).catch((e) => console.error("activity log failed", e));

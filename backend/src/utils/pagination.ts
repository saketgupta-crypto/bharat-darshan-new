import { z } from "zod";

export const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
export const pageMeta = (page: number, limit: number, total: number) => ({
  page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)),
});

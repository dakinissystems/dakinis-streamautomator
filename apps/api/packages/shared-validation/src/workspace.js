import { z } from "zod";

export const addonDataKeySchema = z.enum(["kanban", "calendar", "notes", "code-editor"]);

export const addonDataPutSchema = z.object({
  data: z.record(z.string(), z.unknown()),
  revision: z.number().int().nonnegative().optional(),
  email: z.string().email().optional(),
});

export const desktopLayoutPutSchema = z.object({
  profileKey: z.string().min(1).max(64).optional(),
  windows: z.array(
    z.object({
      id: z.string().min(1),
      x: z.number().optional(),
      y: z.number().optional(),
      w: z.number().optional(),
      h: z.number().optional(),
      z: z.number().optional(),
      minimized: z.boolean().optional(),
      maximized: z.boolean().optional(),
    })
  ),
});

export const featureFlagsEvaluateQuerySchema = z.object({
  keys: z.string().min(1),
  workspaceId: z.string().uuid().optional(),
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  plan: z.string().optional(),
});

/**
 * @param {z.ZodType} schema
 * @param {unknown} input
 */
export function parseOrThrow(schema, input) {
  const parsed = schema.safeParse(input);
  if (parsed.success) return parsed.data;
  const message = parsed.error.issues.map((i) => i.message).join("; ") || "validation_error";
  const err = new Error("validation_error");
  err.details = parsed.error.flatten();
  err.validationMessage = message;
  throw err;
}

export { z };

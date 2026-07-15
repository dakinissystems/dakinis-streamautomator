import { z } from "zod";

export const domainEventEnvelopeSchema = z.object({
  event: z.string().min(1),
  schemaVersion: z.number().int().positive().default(1),
  timestamp: z.string(),
  payload: z.record(z.unknown()),
  metadata: z
    .object({
      correlationId: z.string().optional(),
      causationId: z.string().optional(),
      workspaceId: z.string().optional(),
      tenantId: z.string().optional(),
      actorId: z.string().optional(),
      source: z.string().min(1),
    })
    .passthrough(),
});

export const eventSchemas = {
  envelope: domainEventEnvelopeSchema,
};

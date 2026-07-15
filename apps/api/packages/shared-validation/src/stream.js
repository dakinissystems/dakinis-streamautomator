import { z } from "zod";
import { parseOrThrow } from "./workspace.js";

export const AUTOMATION_TRIGGER_TYPES = [
  "stream.started",
  "stream.scheduled",
  "stream.ended",
];

export const automationActionSchema = z.object({
  type: z.string().min(1).max(64),
  params: z.record(z.string(), z.unknown()).optional(),
});

export const automationRuleCreateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  triggerType: z.enum(AUTOMATION_TRIGGER_TYPES),
  triggerConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  actions: z.array(automationActionSchema).optional(),
});

export const automationRuleUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  enabled: z.boolean().optional(),
  triggerType: z.enum(AUTOMATION_TRIGGER_TYPES).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  actions: z.array(automationActionSchema).optional(),
});

export { z, parseOrThrow };

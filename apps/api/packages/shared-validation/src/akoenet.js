import { z } from "zod";

export const akoenetModuleToggleSchema = z.object({
  moduleKey: z.enum(["guardian", "assistant", "streamer", "welcome", "knowledge", "translator", "support"]),
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional(),
});

export const akoenetEventSchema = z.object({
  type: z.enum(["message.created", "member.joined", "stream.started", "addon.opened", "command.executed"]),
  payload: z.record(z.unknown()),
  serverId: z.string().optional(),
  userId: z.union([z.string(), z.number()]).optional(),
});

export const akoenetSchemas = {
  moduleToggle: akoenetModuleToggleSchema,
  event: akoenetEventSchema,
};

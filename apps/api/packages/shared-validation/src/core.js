import { z } from "zod";

export const coreTenantSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  plan: z.enum(["starter", "growth", "pro"]).default("starter"),
});

export const coreContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export const coreSchemas = {
  tenant: coreTenantSchema,
  contact: coreContactSchema,
};

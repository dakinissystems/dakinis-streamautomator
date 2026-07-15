import { z } from "zod";

export const addonManifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string().regex(/^\d+\.\d+\.\d+/),
  tier: z
    .enum(["core", "productivity", "developer", "stream", "media", "entertainment", "system"])
    .optional(),
  route: z.string().startsWith("/").optional(),
  capabilities: z.array(
    z.object({
      id: z.string().min(1),
      version: z.string().min(1),
    }),
  ),
  permissions: z.array(z.string()).default([]),
  windows: z.array(z.string()).min(1),
  syncData: z.boolean().optional(),
  i18n: z
    .object({
      name: z.object({ en: z.string(), es: z.string() }),
      description: z.object({ en: z.string(), es: z.string() }),
    })
    .optional(),
});

/** @typedef {z.infer<typeof addonManifestSchema>} AddonManifestDto */

/**
 * @param {unknown} manifest
 * @returns {AddonManifestDto}
 */
export function parseAddonManifest(manifest) {
  return addonManifestSchema.parse(manifest);
}

export const addonSchemas = {
  manifest: addonManifestSchema,
  parse: parseAddonManifest,
};

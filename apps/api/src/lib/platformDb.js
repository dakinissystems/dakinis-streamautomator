import { createPool, query as poolQuery } from "@dakinis/shared-db/pool";

/** @type {import('pg').Pool | null} */
let pool = null;

function databaseUrl() {
  return String(process.env.DATABASE_URL || "").trim();
}

export function isPlatformPgConfigured() {
  return Boolean(databaseUrl());
}

export function getPlatformPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (!pool) {
    const ssl =
      process.env.DATABASE_SSL === "true" ||
      url.includes("supabase.com") ||
      url.includes("sslmode=require");
    pool = createPool(url, {
      ssl,
      key: "streamautomator-platform",
      max: Number(process.env.DATABASE_POOL_MAX) || 8,
    });
  }
  return pool;
}

/**
 * @param {string} text
 * @param {unknown[]} [params]
 */
export async function platformQuery(text, params = []) {
  const p = getPlatformPool();
  if (!p) throw new Error("database_not_configured");
  return poolQuery(p, text, params);
}

import { BaseRepository } from "../base.js";

/**
 * @typedef {{
 *   tenantId?: string | null,
 *   workspaceId?: string | null,
 *   userId?: string | null,
 *   plan?: string | null,
 * }} FlagContext
 */

function stableBucket(seed, key) {
  const raw = `${seed}:${key}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash % 100;
}

/**
 * @param {import('../base.js').QueryFn} queryFn
 */
export function createFeatureFlagRepository(queryFn) {
  return new FeatureFlagRepository(queryFn);
}

export class FeatureFlagRepository extends BaseRepository {
  constructor(queryFn) {
    super(queryFn, "meta", "feature_flags");
  }

  /**
   * @param {string[]} keys
   * @param {FlagContext} [ctx]
   */
  async evaluate(keys, ctx = {}) {
    const unique = [...new Set(keys.map((k) => String(k || "").trim()).filter(Boolean))];
    if (unique.length === 0) return {};

    const { rows } = await this.query(
      `SELECT flag_key, enabled, scope, tenant_id, rollout_percentage,
              target_workspaces, target_plans
       FROM ${this.qualified}
       WHERE flag_key = ANY($1::text[])`,
      [unique]
    );

    /** @type {Record<string, boolean>} */
    const result = {};
    for (const key of unique) result[key] = false;

    for (const row of rows) {
      result[row.flag_key] = this.#resolveRow(row, ctx);
    }
    return result;
  }

  /**
   * @param {object} row
   * @param {FlagContext} ctx
   */
  #resolveRow(row, ctx) {
    if (!row.enabled) return false;

    const scope = String(row.scope || "global");
    if (scope === "tenant" && row.tenant_id) {
      if (!ctx.tenantId || String(row.tenant_id) !== String(ctx.tenantId)) return false;
    }

    const targets = Array.isArray(row.target_workspaces) ? row.target_workspaces : [];
    if (targets.length > 0) {
      if (!ctx.workspaceId || !targets.includes(String(ctx.workspaceId))) return false;
    }

    const plans = Array.isArray(row.target_plans) ? row.target_plans : [];
    if (plans.length > 0) {
      if (!ctx.plan || !plans.includes(String(ctx.plan))) return false;
    }

    const pct = Number(row.rollout_percentage) || 0;
    if (pct >= 100) return true;
    if (pct <= 0) return false;

    const seed = ctx.userId || ctx.workspaceId || ctx.tenantId || "global";
    return stableBucket(seed, row.flag_key) < pct;
  }
}

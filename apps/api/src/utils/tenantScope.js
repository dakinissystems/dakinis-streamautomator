import { Op } from 'sequelize';

/** @param {unknown} tenantId */
export function normalizeTenantId(tenantId) {
  if (tenantId === undefined || tenantId === null || tenantId === '') return null;
  const n = Number(tenantId);
  return Number.isFinite(n) ? n : null;
}

/**
 * Read scope: user's rows plus legacy rows without tenant_id.
 * Writes should set tenantId when active so new data is partitioned.
 *
 * @param {number} userId
 * @param {number|null} tenantNumeric
 * @param {Record<string, unknown>} [extra]
 */
export function scopedUserTenantWhere(userId, tenantNumeric, extra = {}) {
  const base = { userId, ...extra };
  if (tenantNumeric != null) {
    return {
      ...base,
      [Op.or]: [{ tenantId: tenantNumeric }, { tenantId: null }],
    };
  }
  return base;
}

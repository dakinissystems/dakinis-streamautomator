import { Sequelize } from 'sequelize';
import { sequelize } from '../../../config/database.js';
import logger from '../../../utils/logger.js';
import User from '../../users/infrastructure/User.model.js';
import Tenant from '../infrastructure/Tenant.model.js';
import Membership from '../infrastructure/Membership.model.js';

function slugifyUsernamePart(raw) {
  let s = String(raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!s) s = 'workspace';
  return s.slice(0, 80);
}

/**
 * Postgres session-scoped advisory lock (no-op on SQLite).
 * Blocks concurrent provisioning of duplicate default tenants for one user row.
 */
async function lockUserTenantProvision(userId, transaction) {
  if (sequelize.getDialect() !== 'postgres') return;
  const uid = Number(userId);
  if (!Number.isFinite(uid)) return;
  const lockKey = ((Math.floor(uid) % 2147483646) + 2147483646) % 2147483646 + 1;
  await sequelize.query('SELECT pg_advisory_xact_lock(:lockKey)', {
    replacements: { lockKey },
    transaction,
  });
}

async function createDefaultTenantRow(userId, transaction) {
  const user = await User.findByPk(userId, {
    transaction,
    attributes: ['id', 'username'],
  });
  if (!user) return null;

  const slugBase = slugifyUsernamePart(user.username || `user${user.id}`);
  const slug = `${slugBase}-${user.id}`.slice(0, 190);

  let tenant;
  try {
    tenant = await Tenant.create(
      {
        name: String(user.username || `User ${user.id}`).slice(0, 240),
        slug,
        plan: 'free',
      },
      { transaction }
    );
  } catch (err) {
    const slugConflict =
      err?.name === 'SequelizeUniqueConstraintError' || /slug|unique/i.test(String(err.message || ''));
    if (!slugConflict) throw err;
    tenant = await Tenant.create(
      {
        name: String(user.username || `User ${user.id}`).slice(0, 240),
        slug: `w-${user.id}-${process.hrtime.bigint()}`.slice(0, 190),
        plan: 'free',
      },
      { transaction }
    );
  }

  await Membership.create(
    {
      userId: user.id,
      tenantId: tenant.id,
      role: 'owner',
    },
    { transaction }
  );

  return Number(tenant.id);
}

/** @returns {Promise<boolean>} */
export async function verifyUserTenantMembership(userId, tenantId) {
  if (!userId || tenantId === undefined || tenantId === null) return false;
  const tid = Number(tenantId);
  if (!Number.isFinite(tid)) return false;
  const row = await Membership.findOne({
    where: { userId, tenantId: tid },
    attributes: ['tenantId'],
  });
  return !!row;
}

/** First membership by created_at (stable default workspace). */
export async function getPrimaryTenantIdForUser(userId) {
  if (!userId) return null;
  try {
    const row = await Membership.findOne({
      where: { userId },
      order: [['createdAt', 'ASC']],
      attributes: ['tenantId'],
    });
    if (!row?.tenantId) return null;
    const n = Number(row.tenantId);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Ensures user has ≥1 tenant (personal workspace) and memberships row as owner.
 * Idempotent and safe under Postgres concurrent logins via advisory transaction lock.
 * @returns {Promise<number|null>} tenant id created or existing primary
 */
export async function ensureDefaultTenantForUser(userId) {
  if (!userId) return null;
  try {
    const quick = await getPrimaryTenantIdForUser(userId);
    if (quick != null) return quick;

    return await sequelize.transaction(
      {
        isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
      },
      async (t) => {
        await lockUserTenantProvision(userId, t);

        const again = await Membership.findOne({
          where: { userId },
          order: [['createdAt', 'ASC']],
          attributes: ['tenantId'],
          transaction: t,
        });
        if (again?.tenantId != null) return Number(again.tenantId);

        const createdTenantId = await createDefaultTenantRow(userId, t);
        return createdTenantId;
      }
    );
  } catch (err) {
    logger.warn('ensureDefaultTenantForUser failed', {
      userId,
      error: err.message,
    });
    return getPrimaryTenantIdForUser(userId);
  }
}

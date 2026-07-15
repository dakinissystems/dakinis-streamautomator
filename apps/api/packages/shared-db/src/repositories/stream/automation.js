import { BaseRepository } from "../base.js";
import { mapAutomationStreamRowToLegacy } from "./legacy-mapper.js";

/**
 * @typedef {{
 *   id: number,
 *   userId: number,
 *   name: string,
 *   enabled?: boolean,
 *   triggerType: string,
 *   triggerConfig?: object | null,
 *   actions?: unknown[],
 *   createdAt?: Date | string | null,
 *   updatedAt?: Date | string | null,
 * }} LegacyAutomationRule
 */

/**
 * @param {import('../base.js').QueryFn} queryFn
 */
export function createAutomationRuleRepository(queryFn) {
  return new AutomationRuleRepository(queryFn);
}

export class AutomationRuleRepository extends BaseRepository {
  constructor(queryFn) {
    super(queryFn, "stream", "automation_rules");
  }

  /**
   * @param {number} legacyUserId
   */
  async resolveUserUuid(legacyUserId) {
    const { rows } = await this.query(
      `SELECT stream._resolve_user_uuid($1::int) AS user_id`,
      [legacyUserId],
    );
    return rows[0]?.user_id ? String(rows[0].user_id) : null;
  }

  /**
   * @param {number} legacyUserId
   */
  async listByLegacyUserId(legacyUserId) {
    const userUuid = await this.resolveUserUuid(legacyUserId);
    if (!userUuid) return [];
    const { rows } = await this.query(
      `SELECT id, legacy_id, user_id, name, enabled, trigger_type, trigger_config,
              actions, created_at, updated_at
       FROM ${this.qualified}
       WHERE user_id = $1::uuid
       ORDER BY updated_at DESC`,
      [userUuid],
    );
    return rows;
  }

  /**
   * @param {number} legacyUserId
   * @param {string} triggerType
   */
  async listEnabledByLegacyUserAndTrigger(legacyUserId, triggerType) {
    const userUuid = await this.resolveUserUuid(legacyUserId);
    if (!userUuid) return [];
    const { rows } = await this.query(
      `SELECT id, legacy_id, user_id, name, enabled, trigger_type, trigger_config,
              actions, created_at, updated_at
       FROM ${this.qualified}
       WHERE user_id = $1::uuid AND enabled = true AND trigger_type = $2
       ORDER BY legacy_id ASC`,
      [userUuid, triggerType],
    );
    return rows;
  }

  /**
   * @param {number} legacyId
   */
  async findByLegacyId(legacyId) {
    const { rows } = await this.query(
      `SELECT id, legacy_id, user_id, name, enabled, trigger_type, trigger_config,
              actions, created_at, updated_at
       FROM ${this.qualified}
       WHERE legacy_id = $1
       LIMIT 1`,
      [legacyId],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {number} legacyUserId
   */
  async listLegacyRulesForUser(legacyUserId) {
    const rows = await this.listByLegacyUserId(legacyUserId);
    return rows
      .map((row) => mapAutomationStreamRowToLegacy(row, legacyUserId))
      .filter(Boolean);
  }

  /**
   * @param {number} legacyUserId
   * @param {string} triggerType
   */
  async listLegacyRulesForTrigger(legacyUserId, triggerType) {
    const rows = await this.listEnabledByLegacyUserAndTrigger(legacyUserId, triggerType);
    return rows
      .map((row) => mapAutomationStreamRowToLegacy(row, legacyUserId))
      .filter(Boolean);
  }

  /**
   * @param {LegacyAutomationRule} legacyRow
   */
  async upsertFromLegacyRule(legacyRow) {
    if (!legacyRow?.id || legacyRow.userId == null) return null;

    const userUuid = await this.resolveUserUuid(legacyRow.userId);
    if (!userUuid) return null;

    const actionsJson = JSON.stringify(
      Array.isArray(legacyRow.actions) ? legacyRow.actions : [],
    );
    const triggerConfigJson =
      legacyRow.triggerConfig != null
        ? JSON.stringify(legacyRow.triggerConfig)
        : null;

    const { rows } = await this.query(
      `INSERT INTO ${this.qualified} (
         user_id, name, enabled, trigger_type, trigger_config, actions,
         legacy_id, created_at, updated_at
       )
       VALUES (
         $1::uuid, $2, $3, $4, $5::jsonb, $6::jsonb,
         $7, coalesce($8, now()), coalesce($9, now())
       )
       ON CONFLICT (legacy_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         name = EXCLUDED.name,
         enabled = EXCLUDED.enabled,
         trigger_type = EXCLUDED.trigger_type,
         trigger_config = EXCLUDED.trigger_config,
         actions = EXCLUDED.actions,
         updated_at = now()
       RETURNING id, legacy_id, enabled, updated_at`,
      [
        userUuid,
        String(legacyRow.name || "Automation").slice(0, 120),
        legacyRow.enabled !== false,
        legacyRow.triggerType,
        triggerConfigJson,
        actionsJson,
        legacyRow.id,
        legacyRow.createdAt ?? null,
        legacyRow.updatedAt ?? null,
      ],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {number} legacyUserId
   * @param {number} ruleId — legacy AutomationRules.id o stream.automation_rules.id
   */
  async findRuleRefForDelete(legacyUserId, ruleId) {
    const userUuid = await this.resolveUserUuid(legacyUserId);
    if (!userUuid) return null;
    const { rows } = await this.query(
      `SELECT id, legacy_id
       FROM ${this.qualified}
       WHERE user_id = $1::uuid
         AND (legacy_id = $2 OR id = $2)
       LIMIT 1`,
      [userUuid, ruleId],
    );
    return rows[0] ?? null;
  }

  async deleteByStreamId(streamId) {
    const { rowCount } = await this.query(
      `DELETE FROM ${this.qualified} WHERE id = $1`,
      [streamId],
    );
    return rowCount > 0;
  }

  /**
   * @param {number} legacyId
   */
  async deleteByLegacyId(legacyId) {
    const { rowCount } = await this.query(
      `DELETE FROM ${this.qualified} WHERE legacy_id = $1`,
      [legacyId],
    );
    return rowCount > 0;
  }
}

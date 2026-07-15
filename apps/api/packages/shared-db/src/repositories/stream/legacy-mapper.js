/**
 * Map stream.director_sessions row → Sequelize-shaped plain object.
 * @param {object} row
 * @param {number} legacyUserId
 */
export function mapDirectorStreamRowToLegacy(row, legacyUserId) {
  if (!row) return null;
  return {
    id: row.legacy_id ?? row.id,
    userId: legacyUserId,
    contentId: row.content_legacy_id ?? null,
    title: row.title,
    status: row.status,
    platform: row.platform,
    steps: Array.isArray(row.steps) ? row.steps : row.steps ?? [],
    startedAt: row.started_at,
    endedAt: row.ended_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _source: "stream",
  };
}

/**
 * Map stream.automation_rules row → Sequelize-shaped plain object.
 * @param {object} row
 * @param {number} legacyUserId
 */
export function mapAutomationStreamRowToLegacy(row, legacyUserId) {
  if (!row) return null;
  return {
    id: row.legacy_id ?? row.id,
    userId: legacyUserId,
    name: row.name,
    enabled: row.enabled,
    triggerType: row.trigger_type,
    triggerConfig: row.trigger_config,
    actions: Array.isArray(row.actions) ? row.actions : row.actions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    _source: "stream",
  };
}

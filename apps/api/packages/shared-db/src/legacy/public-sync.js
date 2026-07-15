/**
 * Reverse sync stream.* → public.* for convivencia phase (when triggers are off or failed).
 * Used by outbox worker when LEGACY_SYNC_MODE=true.
 */

/**
 * @param {import('../repositories/base.js').QueryFn} queryFn
 * @param {string} userUuid
 */
async function resolveLegacyUserId(queryFn, userUuid) {
  const { rows } = await queryFn(
    `SELECT legacy_id FROM dakinis_auth.legacy_id_map
     WHERE legacy_schema = 'stream'
       AND legacy_table = 'Users'
       AND user_id = $1::uuid
     LIMIT 1`,
    [userUuid],
  );
  return rows[0]?.legacy_id != null ? Number(rows[0].legacy_id) : null;
}

/**
 * @param {import('../repositories/base.js').QueryFn} queryFn
 * @param {number} legacySessionId
 */
export async function reconcileDirectorSessionToPublic(queryFn, legacySessionId) {
  const { rows } = await queryFn(
    `SELECT legacy_id, user_id, content_legacy_id, title, status, platform,
            steps, started_at, ended_at, created_at, updated_at
     FROM stream.director_sessions
     WHERE legacy_id = $1
     LIMIT 1`,
    [legacySessionId],
  );
  const s = rows[0];
  if (!s?.legacy_id) return { synced: false, reason: "stream_row_not_found" };

  const legacyUserId = await resolveLegacyUserId(queryFn, s.user_id);
  if (!legacyUserId) return { synced: false, reason: "legacy_user_not_mapped" };

  await queryFn(
    `INSERT INTO public."StreamDirectorSessions" (
       id, "userId", "contentId", title, status, platform, steps,
       "startedAt", "endedAt", "createdAt", "updatedAt"
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       "userId" = EXCLUDED."userId",
       "contentId" = EXCLUDED."contentId",
       title = EXCLUDED.title,
       status = EXCLUDED.status,
       platform = EXCLUDED.platform,
       steps = EXCLUDED.steps,
       "startedAt" = EXCLUDED."startedAt",
       "endedAt" = EXCLUDED."endedAt",
       "updatedAt" = now()`,
    [
      s.legacy_id,
      legacyUserId,
      s.content_legacy_id,
      s.title,
      s.status,
      s.platform,
      JSON.stringify(Array.isArray(s.steps) ? s.steps : s.steps || []),
      s.started_at,
      s.ended_at,
      s.created_at ?? new Date(),
      s.updated_at ?? new Date(),
    ],
  );
  return { synced: true, legacyId: s.legacy_id };
}

/**
 * @param {import('../repositories/base.js').QueryFn} queryFn
 * @param {number} legacyRuleId
 */
export async function reconcileAutomationRuleToPublic(queryFn, legacyRuleId) {
  const { rows } = await queryFn(
    `SELECT legacy_id, user_id, name, enabled, trigger_type, trigger_config,
            actions, created_at, updated_at
     FROM stream.automation_rules
     WHERE legacy_id = $1
     LIMIT 1`,
    [legacyRuleId],
  );
  const r = rows[0];
  if (!r?.legacy_id) return { synced: false, reason: "stream_row_not_found" };

  const legacyUserId = await resolveLegacyUserId(queryFn, r.user_id);
  if (!legacyUserId) return { synced: false, reason: "legacy_user_not_mapped" };

  await queryFn(
    `INSERT INTO public."AutomationRules" (
       id, "userId", name, enabled, "triggerType", "triggerConfig", actions,
       "createdAt", "updatedAt"
     )
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       "userId" = EXCLUDED."userId",
       name = EXCLUDED.name,
       enabled = EXCLUDED.enabled,
       "triggerType" = EXCLUDED."triggerType",
       "triggerConfig" = EXCLUDED."triggerConfig",
       actions = EXCLUDED.actions,
       "updatedAt" = now()`,
    [
      r.legacy_id,
      legacyUserId,
      r.name,
      r.enabled,
      r.trigger_type,
      r.trigger_config != null ? JSON.stringify(r.trigger_config) : null,
      JSON.stringify(Array.isArray(r.actions) ? r.actions : r.actions || []),
      r.created_at ?? new Date(),
      r.updated_at ?? new Date(),
    ],
  );
  return { synced: true, legacyId: r.legacy_id };
}

/**
 * @param {import('../repositories/base.js').QueryFn} queryFn
 * @param {number} legacyRuleId
 */
export async function deleteAutomationRuleFromPublic(queryFn, legacyRuleId) {
  const { rowCount } = await queryFn(
    `DELETE FROM public."AutomationRules" WHERE id = $1`,
    [legacyRuleId],
  );
  return rowCount > 0;
}

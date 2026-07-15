import { BaseRepository } from "../base.js";
import { mapDirectorStreamRowToLegacy } from "./legacy-mapper.js";

/**
 * @typedef {{
 *   id: number,
 *   userId: number,
 *   contentId?: number | null,
 *   title: string,
 *   status: string,
 *   platform?: string | null,
 *   steps?: unknown[],
 *   startedAt?: Date | string | null,
 *   endedAt?: Date | string | null,
 *   createdAt?: Date | string | null,
 *   updatedAt?: Date | string | null,
 * }} LegacyDirectorSession
 */

/**
 * @param {import('../base.js').QueryFn} queryFn
 */
export function createDirectorSessionRepository(queryFn) {
  return new DirectorSessionRepository(queryFn);
}

export class DirectorSessionRepository extends BaseRepository {
  constructor(queryFn) {
    super(queryFn, "stream", "director_sessions");
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
   * @param {number | null | undefined} legacyContentId
   */
  async resolveStreamContentId(legacyContentId) {
    if (legacyContentId == null) return null;
    const { rows } = await this.query(
      `SELECT id FROM stream.contents WHERE legacy_id = $1 LIMIT 1`,
      [legacyContentId],
    );
    return rows[0]?.id != null ? Number(rows[0].id) : null;
  }

  /**
   * @param {number} legacyUserId
   */
  async findActiveByLegacyUserId(legacyUserId) {
    const userUuid = await this.resolveUserUuid(legacyUserId);
    if (!userUuid) return null;
    const { rows } = await this.query(
      `SELECT id, legacy_id, user_id, content_id, content_legacy_id, title, status,
              platform, steps, started_at, ended_at, created_at, updated_at
       FROM ${this.qualified}
       WHERE user_id = $1::uuid AND status = 'live'
       ORDER BY started_at DESC NULLS LAST
       LIMIT 1`,
      [userUuid],
    );
    return rows[0] ?? null;
  }

  /**
   * @param {number} legacyUserId
   * @returns {Promise<ReturnType<typeof mapDirectorStreamRowToLegacy>>}
   */
  async findActiveLegacySession(legacyUserId) {
    const row = await this.findActiveByLegacyUserId(legacyUserId);
    return mapDirectorStreamRowToLegacy(row, legacyUserId);
  }

  /**
   * Upsert stream.director_sessions from Sequelize public row (Phase A dual-write).
   * @param {LegacyDirectorSession} legacyRow
   */
  async upsertFromLegacySession(legacyRow) {
    if (!legacyRow?.id || legacyRow.userId == null) return null;

    const userUuid = await this.resolveUserUuid(legacyRow.userId);
    if (!userUuid) return null;

    const streamContentId = await this.resolveStreamContentId(legacyRow.contentId);
    const stepsJson = JSON.stringify(
      Array.isArray(legacyRow.steps) ? legacyRow.steps : [],
    );

    const { rows } = await this.query(
      `INSERT INTO ${this.qualified} (
         user_id, content_id, content_legacy_id, title, status, platform,
         steps, started_at, ended_at, legacy_id, created_at, updated_at
       )
       VALUES (
         $1::uuid, $2, $3, $4, $5, $6,
         $7::jsonb, $8, $9, $10, coalesce($11, now()), coalesce($12, now())
       )
       ON CONFLICT (legacy_id) DO UPDATE SET
         user_id = EXCLUDED.user_id,
         content_id = EXCLUDED.content_id,
         content_legacy_id = EXCLUDED.content_legacy_id,
         title = EXCLUDED.title,
         status = EXCLUDED.status,
         platform = EXCLUDED.platform,
         steps = EXCLUDED.steps,
         started_at = EXCLUDED.started_at,
         ended_at = EXCLUDED.ended_at,
         updated_at = now()
       RETURNING id, legacy_id, status, updated_at`,
      [
        userUuid,
        streamContentId,
        legacyRow.contentId ?? null,
        String(legacyRow.title || "Live session").slice(0, 500),
        legacyRow.status || "live",
        legacyRow.platform ?? null,
        stepsJson,
        legacyRow.startedAt ?? null,
        legacyRow.endedAt ?? null,
        legacyRow.id,
        legacyRow.createdAt ?? null,
        legacyRow.updatedAt ?? null,
      ],
    );
    return rows[0] ?? null;
  }
}

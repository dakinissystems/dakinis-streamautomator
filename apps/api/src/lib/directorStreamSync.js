import { createDirectorSessionRepository } from "@dakinis/shared-db/repositories/director";
import { createDirectorSessionFacade } from "@dakinis/shared-db/repositories/director-facade";
import { isPlatformPgConfigured, platformQuery } from "./platformDb.js";
import { publishPlatformOutbox } from "./platformOutbox.js";
import logger from "../utils/logger.js";

let repo = null;
let facade = null;

function getRepo() {
  if (!isPlatformPgConfigured()) return null;
  if (!repo) repo = createDirectorSessionRepository(platformQuery);
  return repo;
}

function getFacade(legacyReader) {
  const repository = getRepo();
  if (!repository) return null;
  if (!facade || legacyReader) {
    facade = createDirectorSessionFacade(repository, {
      readFromStream: process.env.DIRECTOR_READ_FROM_STREAM === "true",
      legacyReader,
    });
  }
  return facade;
}

/**
 * Read active session from stream.* (Phase 1B). Enable with DIRECTOR_READ_FROM_STREAM=true.
 * @param {number} legacyUserId
 * @param {import('@dakinis/shared-db/repositories/director-facade').LegacyDirectorReader} [legacyReader]
 */
export async function readActiveDirectorFromStream(legacyUserId, legacyReader) {
  const directorFacade = getFacade(legacyReader);
  if (!directorFacade) return null;
  try {
    return await directorFacade.getActiveSession(legacyUserId);
  } catch (err) {
    logger.debug("director stream read failed, fallback sequelize", {
      userId: legacyUserId,
      error: err instanceof Error ? err.message : String(err),
    });
    return legacyReader ? legacyReader(legacyUserId) : null;
  }
}

/**
 * Phase A: dual-write Sequelize session → stream.director_sessions + outbox event.
 * @param {object} session
 * @param {string} eventType
 */
export async function syncDirectorSessionToStream(session, eventType) {
  const repository = getRepo();
  if (!repository || !session) return null;

  const plain =
    typeof session.get === "function" ? session.get({ plain: true }) : session;

  try {
    const row = await repository.upsertFromLegacySession(plain);
    if (row) {
      await publishPlatformOutbox({
        aggregateType: "director_session",
        aggregateId: String(plain.id),
        eventType,
        idempotencyKey: `director:${eventType}:${plain.id}`,
        payload: {
          legacyId: plain.id,
          streamId: row.id,
          status: plain.status,
          userId: plain.userId,
          title: plain.title,
          platform: plain.platform,
        },
      });
    }
    return row;
  } catch (err) {
    logger.warn("director stream sync failed (non-fatal)", {
      legacyId: plain.id,
      eventType,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

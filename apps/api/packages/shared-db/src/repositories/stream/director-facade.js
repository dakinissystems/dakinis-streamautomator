/**
 * Unified director read path: stream first, optional Sequelize fallback.
 */

/**
 * @typedef {(legacyUserId: number) => Promise<object | null>} LegacyDirectorReader
 */

export class DirectorSessionFacade {
  /**
   * @param {{
   *   streamRepo: import('./director.js').DirectorSessionRepository,
   *   readFromStream?: boolean,
   *   legacyReader?: LegacyDirectorReader,
   * }} options
   */
  constructor(options) {
    this.streamRepo = options.streamRepo;
    this.readFromStream = options.readFromStream ?? false;
    this.legacyReader = options.legacyReader;
  }

  /**
   * @param {number} legacyUserId
   */
  async getActiveSession(legacyUserId) {
    if (this.readFromStream) {
      const fromStream = await this.streamRepo.findActiveLegacySession(legacyUserId);
      if (fromStream) return fromStream;
    }
    if (this.legacyReader) {
      return this.legacyReader(legacyUserId);
    }
    return null;
  }

  /**
   * Dual-write: always upsert stream schema from legacy session row.
   * @param {object} legacySession
   */
  async upsert(legacySession) {
    return this.streamRepo.upsertFromLegacySession(legacySession);
  }
}

/**
 * @param {import('./director.js').DirectorSessionRepository} streamRepo
 * @param {{ readFromStream?: boolean; legacyReader?: LegacyDirectorReader }} [options]
 */
export function createDirectorSessionFacade(streamRepo, options = {}) {
  return new DirectorSessionFacade({ streamRepo, ...options });
}

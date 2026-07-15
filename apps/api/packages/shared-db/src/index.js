export { createPool, query, closeAllPools } from "./pool.js";
export { withTransaction, txQuery } from "./transaction.js";
export { TransactionManager } from "./transaction-manager.js";
export { DbError, NotFoundError, ConflictError } from "./errors.js";
export { BaseRepository } from "./repositories/base.js";
export {
  FeatureFlagRepository,
  createFeatureFlagRepository,
} from "./repositories/meta/feature-flags.js";
export { OutboxPublisher } from "./outbox/publisher.js";
export { processOutboxBatch, startOutboxPoller } from "./outbox/processor.js";
export {
  DirectorSessionRepository,
  createDirectorSessionRepository,
} from "./repositories/stream/director.js";
export {
  DirectorSessionFacade,
  createDirectorSessionFacade,
} from "./repositories/stream/director-facade.js";
export { mapDirectorStreamRowToLegacy, mapAutomationStreamRowToLegacy } from "./repositories/stream/legacy-mapper.js";
export {
  AutomationRuleRepository,
  createAutomationRuleRepository,
} from "./repositories/stream/automation.js";
export {
  reconcileDirectorSessionToPublic,
  reconcileAutomationRuleToPublic,
  deleteAutomationRuleFromPublic,
} from "./legacy/public-sync.js";

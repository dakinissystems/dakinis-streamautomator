/**
 * CLI: npm run migrate
 */
import { runPendingMigrations } from './migrationRunner.js';
import logger from '../utils/logger.js';

try {
  await runPendingMigrations({ closeConnection: true });
} catch (error) {
  logger.error('Migration failed', {
    error: error.original?.message || error.message,
    stack: error.stack,
  });
  process.exit(1);
}

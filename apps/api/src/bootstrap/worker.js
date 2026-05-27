import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
import { sequelize } from '../platform/db/index.js';
import { startWorker } from '../modules/integrations/application/publicationWorker.js';
import { startDiscordSyncWorker } from '../services/discordQueueService.js';
import { startDiscordGateway } from '../services/discordGatewayService.js';
import { startReminderWorker } from '../services/reminderQueueService.js';
import { handleReminderJob } from '../services/reminderWorker.js';
import { dakinisInitSentry } from '../utils/sentry.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env consistently with app entrypoint.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });
dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';

async function initDatabase() {
  try {
    await sequelize.authenticate();
    const dbType = process.env.DATABASE_URL ? 'PostgreSQL (Supabase)' : 'SQLite';
    logger.info('Worker DB connection established', { dbType, environment: nodeEnv });
  } catch (err) {
    logger.error('Worker database initialization failed', {
      error: err.message,
      stack: err.stack,
    });
    process.exit(1);
  }
}

export async function startWorkerProcess() {
  await dakinisInitSentry('streamautomator-worker');
  await initDatabase();

  if (process.env.ENABLE_PUBLICATION_WORKER !== 'false') {
    await startWorker();
  } else {
    logger.warn('Publication worker disabled by ENABLE_PUBLICATION_WORKER=false');
  }

  startDiscordSyncWorker().catch((err) =>
    logger.debug('Discord sync worker not started', { error: err.message })
  );
  startDiscordGateway().catch((err) =>
    logger.debug('Discord Gateway not started', { error: err.message })
  );

  if (process.env.ENABLE_REMINDER_WORKER !== 'false') {
    startReminderWorker(handleReminderJob).catch((err) =>
      logger.debug('Reminder worker not started', { error: err.message })
    );
  }

  const publicationOn = process.env.ENABLE_PUBLICATION_WORKER !== 'false';
  const remindersOn = process.env.ENABLE_REMINDER_WORKER !== 'false';
  const redisUrl = Boolean(String(process.env.REDIS_URL || '').trim());

  logger.info('Worker server started', {
    environment: nodeEnv,
    publicationWorker: publicationOn,
    reminderWorker: remindersOn,
    redisConfigured: redisUrl,
  });
  console.log(
    `[StreamAutomator] Worker ready — env=${nodeEnv} publication=${publicationOn} reminders=${remindersOn} redis=${redisUrl}`
  );
}

export default startWorkerProcess;

/**
 * Shared migration runner (CLI + API startup).
 */
import { readdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import path from 'path';
import { sequelize, usePostgres, nodeEnv } from '../config/database.js';
import logger from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '../../migrations');

async function ensureMetaTable() {
  const queryInterface = sequelize.getQueryInterface();
  try {
    await queryInterface.describeTable('SequelizeMeta');
  } catch {
    await queryInterface.createTable('SequelizeMeta', {
      name: {
        type: sequelize.constructor.DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
      },
    });
    logger.info('Created SequelizeMeta table');
  }
}

async function getExecutedMigrations() {
  await ensureMetaTable();
  const tableName = usePostgres ? '"SequelizeMeta"' : 'SequelizeMeta';
  const results = await sequelize.query(`SELECT name FROM ${tableName} ORDER BY name`, {
    type: sequelize.QueryTypes.SELECT,
  });
  return Array.isArray(results) ? results.map((r) => r.name) : [];
}

async function executeMigration(filename) {
  const migrationPath = path.join(migrationsDir, filename);
  let migration;
  if (filename.endsWith('.cjs')) {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    migration = require(migrationPath);
    migration = migration.default || migration;
  } else {
    const fileUrl = `file://${migrationPath.replace(/\\/g, '/')}`;
    const module = await import(fileUrl);
    migration = module.default || module;
  }
  if (!migration?.up) {
    throw new Error(`Invalid migration file: ${filename}`);
  }

  const queryInterface = sequelize.getQueryInterface();
  try {
    await migration.up(queryInterface, sequelize.constructor);
  } catch (error) {
    if (
      error.message?.includes('already exists') ||
      error.message?.includes('duplicate') ||
      error.code === '42701' ||
      error.code === '23505'
    ) {
      logger.warn(`Skipped (already exists): ${filename}`);
    } else {
      throw error;
    }
  }

  const tableName = usePostgres ? '"SequelizeMeta"' : 'SequelizeMeta';
  const escapedFilename = filename.replace(/'/g, "''");
  if (usePostgres) {
    await sequelize.query(
      `INSERT INTO ${tableName} (name) VALUES ('${escapedFilename}') ON CONFLICT (name) DO NOTHING`,
      { type: sequelize.QueryTypes.INSERT }
    );
  } else {
    await sequelize.query(
      `INSERT OR IGNORE INTO ${tableName} (name) VALUES ('${escapedFilename}')`,
      { type: sequelize.QueryTypes.INSERT }
    );
  }
  logger.info(`Executed: ${filename}`);
}

const AUTH_RETRIES = 5;
const AUTH_RETRY_DELAY_MS = 5000;

async function authenticateWithRetry() {
  let lastError;
  for (let attempt = 1; attempt <= AUTH_RETRIES; attempt++) {
    try {
      await sequelize.authenticate();
      return;
    } catch (err) {
      lastError = err;
      if (attempt < AUTH_RETRIES) {
        await new Promise((r) => setTimeout(r, AUTH_RETRY_DELAY_MS));
      }
    }
  }
  throw lastError;
}

/**
 * @param {{ closeConnection?: boolean, skipAuthenticate?: boolean }} [options]
 */
export async function runPendingMigrations(options = {}) {
  const { closeConnection = true, skipAuthenticate = false } = options;
  logger.info(`Running migrations in ${nodeEnv}`, {
    database: usePostgres ? 'PostgreSQL' : 'SQLite',
  });

  if (!skipAuthenticate) {
    await authenticateWithRetry();
  }

  const files = await readdir(migrationsDir);
  const migrationFiles = files.filter((f) => f.endsWith('.js') || f.endsWith('.cjs')).sort();
  const executed = await getExecutedMigrations();
  const pending = migrationFiles.filter((f) => !executed.includes(f));

  if (pending.length === 0) {
    logger.info('All migrations are up to date');
    if (closeConnection) await sequelize.close();
    return { executed: 0, pending: [] };
  }

  logger.info(`Found ${pending.length} pending migration(s)`, { pending });
  for (const file of pending) {
    await executeMigration(file);
  }
  logger.info(`Successfully executed ${pending.length} migration(s)`);
  if (closeConnection) await sequelize.close();
  return { executed: pending.length, pending };
}

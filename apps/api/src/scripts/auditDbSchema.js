/**
 * Compare Sequelize models vs live DB. Run: npm run audit:schema
 * Requires DATABASE_URL (and DATABASE_SSL=true for Supabase).
 */
import dotenv from 'dotenv';
import { readdir } from 'fs/promises';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const SKIP_ATTRS = new Set(['id', 'createdAt', 'updatedAt']);

function modelColumnName(attr) {
  return attr.field || attr.name;
}

async function loadModelsFromModules() {
  const modulesRoot = path.join(__dirname, '../modules');
  const models = [];

  async function walk(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.model.js')) {
        const mod = await import(pathToFileURL(fullPath).href);
        if (mod.default?.getTableName) {
          models.push(mod.default);
        }
      }
    }
  }

  await walk(modulesRoot);
  return models;
}

async function audit() {
  const { sequelize } = await import('../config/database.js');
  await sequelize.authenticate();
  const qi = sequelize.getQueryInterface();
  const missingTables = [];
  const missingColumns = [];

  const models = await loadModelsFromModules();

  for (const model of models) {
    const modelName = model.name;
    const tableName = typeof model.getTableName() === 'string'
      ? model.getTableName()
      : model.tableName;

    let dbCols;
    try {
      dbCols = await qi.describeTable(tableName);
    } catch {
      missingTables.push({ model: modelName, table: tableName });
      continue;
    }

    for (const [attrName, attr] of Object.entries(model.rawAttributes)) {
      if (SKIP_ATTRS.has(attrName)) continue;
      const col = modelColumnName(attr);
      if (dbCols[col] || dbCols[attrName]) continue;
      missingColumns.push({ model: modelName, table: tableName, column: col, attribute: attrName });
    }
  }

  console.log('\n=== Schema audit ===\n');
  if (missingTables.length) {
    console.log('Missing tables:', missingTables.length);
    for (const t of missingTables) {
      console.log(`  - ${t.table} (model ${t.model})`);
    }
  } else {
    console.log('All model tables exist.');
  }

  if (missingColumns.length) {
    console.log('\nMissing columns:', missingColumns.length);
    const byTable = {};
    for (const c of missingColumns) {
      byTable[c.table] = byTable[c.table] || [];
      byTable[c.table].push(c.column);
    }
    for (const [table, cols] of Object.entries(byTable)) {
      console.log(`\n  ${table}:`);
      for (const col of cols.sort()) console.log(`    - ${col}`);
    }
  } else {
    console.log('\nAll model columns present.');
  }

  await sequelize.close();
  process.exit(missingTables.length || missingColumns.length ? 1 : 0);
}

audit().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * CLI: npm run search:reindex [--limit=500] [--userId=123]
 */
import dotenv from "dotenv";
import { sequelize } from "../config/database.js";
import { isSearchPlatformConfigured } from "../lib/search-platform-index.js";
import { reindexAllContentForSearch } from "../lib/workspace-search.js";
import logger from "../utils/logger.js";

dotenv.config();

function parseArg(name) {
  const raw = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!raw) return undefined;
  const val = raw.split("=")[1];
  if (name === "userId" || name === "limit") return Number(val);
  return val;
}

async function main() {
  if (!isSearchPlatformConfigured()) {
    console.error("❌ Search not configured. Set DAKINIS_SEARCH_URL or DAKINIS_GATEWAY_URL.");
    process.exit(1);
  }

  await sequelize.authenticate();
  const limit = parseArg("limit") || 500;
  const userId = parseArg("userId");

  console.log(`🔍 Reindexing up to ${limit} content rows${userId ? ` for user ${userId}` : ""}…`);
  const result = await reindexAllContentForSearch({ limit, userId });
  console.log("✅ Done:", result);
  await sequelize.close();
}

main().catch((err) => {
  logger.error("search reindex failed", { error: err.message, stack: err.stack });
  process.exit(1);
});

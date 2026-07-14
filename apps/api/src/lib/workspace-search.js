import { Op } from "sequelize";
import Content from "../modules/content/infrastructure/Content.model.js";
import User from "../modules/users/infrastructure/User.model.js";
import logger from "../utils/logger.js";
import { isSearchPlatformConfigured } from "./search-platform-index.js";

const SCOPE_MAP = {
  customers: "clients",
  documents: "documentation",
  orders: "global",
  streams: "events",
  knowledge: "knowledge",
  ai: "knowledge",
};

const STREAM_FRONTEND =
  String(process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || "https://streamautomator.com").replace(
    /\/$/,
    ""
  );

function searchBaseUrl() {
  const direct = String(process.env.DAKINIS_SEARCH_URL || "").trim().replace(/\/$/, "");
  if (direct) return direct;
  const gateway = String(process.env.DAKINIS_GATEWAY_URL || "").trim().replace(/\/$/, "");
  if (gateway) return `${gateway}/search`;
  return "";
}

function mapScope(scope) {
  return SCOPE_MAP[scope] || scope || "all";
}

function wantsScope(scopeRaw, names) {
  const scope = scopeRaw || "all";
  return scope === "all" || names.includes(scope);
}

function mergeHits(lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const hit of list) {
      const key = `${hit.scope || ""}:${hit.id || hit.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(hit);
    }
  }
  merged.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return merged.slice(0, 24);
}

/**
 * @param {string} q
 * @param {string} scopeRaw
 */
async function remotePlatformSearch(q, scopeRaw) {
  const base = searchBaseUrl();
  if (!base) return [];

  const scope = mapScope(scopeRaw);
  try {
    const params = new URLSearchParams({ q: String(q || "").trim(), scope });
    const res = await fetch(`${base}/v1/query?${params}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return [];
    const payload = await res.json().catch(() => ({}));
    const hits = payload.hits || payload.data?.hits || [];
    return hits.slice(0, 15).map((hit) => ({
      scope: hit.scope || scope,
      id: hit.id,
      title: hit.title || hit.label || "Resultado",
      snippet: String(hit.snippet || hit.body || "").slice(0, 120),
      score: hit.score ?? 0.8,
      path: hit.path || hit.metadata?.path || null,
      product: hit.product || hit.metadata?.product || null,
      metadata: hit.metadata || {},
    }));
  } catch (err) {
    logger.warn("workspace remote search failed", { err: err.message, q, scope });
    return [];
  }
}

/**
 * @param {number} userId
 * @param {string} q
 * @param {string} scopeRaw
 */
async function localContentSearch(userId, q, scopeRaw) {
  if (!wantsScope(scopeRaw, ["events", "streams", "all", "documents"])) return [];
  const needle = String(q || "").trim();
  if (needle.length < 2) return [];

  const where = {
    userId,
    [Op.or]: [
      { title: { [Op.iLike]: `%${needle}%` } },
      { content: { [Op.iLike]: `%${needle}%` } },
    ],
  };

  let rows = [];
  try {
    rows = await Content.findAll({
      where: { ...where, deletedAt: null },
      limit: 12,
      order: [["scheduledFor", "DESC"]],
      attributes: ["id", "title", "content", "contentType", "status", "scheduledFor", "platforms"],
    });
  } catch {
    rows = await Content.findAll({
      where,
      limit: 12,
      order: [["scheduledFor", "DESC"]],
      attributes: ["id", "title", "content", "contentType", "status", "scheduledFor", "platforms"],
    });
  }

  return rows.map((row) => {
    const platforms = Array.isArray(row.platforms) ? row.platforms.join(", ") : "";
    return {
      scope: "events",
      id: `streamautomator:content:${row.id}`,
      title: row.title || "Publicación",
      snippet: [row.contentType, row.status, platforms].filter(Boolean).join(" · ").slice(0, 120),
      score: 0.92,
      path: `${STREAM_FRONTEND}/schedule?content=${row.id}`,
      product: "streamautomator",
      metadata: {
        product: "streamautomator",
        contentId: row.id,
        path: `${STREAM_FRONTEND}/schedule?content=${row.id}`,
      },
    };
  });
}

/**
 * @param {string} q
 * @param {string} scopeRaw
 */
function ecosystemShortcutHits(q, scopeRaw) {
  if (scopeRaw !== "all" && scopeRaw) return [];
  const needle = String(q || "").trim().toLowerCase();
  if (needle.length < 2) return [];

  const hub = String(process.env.DAKINIS_CORPORATE_URL || "https://dakinissystems.com").replace(/\/$/, "");
  const shortcuts = [
    {
      match: ["hub", "mi día", "midia"],
      title: "Hub Dakinis",
      path: `${hub}/hub`,
      product: "hub",
      scope: "global",
    },
    {
      match: ["factura", "pedido", "cliente", "core", "erp"],
      title: "Dakinis One",
      path: `${hub}/core`,
      product: "core",
      scope: "clients",
    },
    {
      match: ["akoenet", "discord", "comunidad"],
      title: "AkoeNet",
      path: "https://akoenet.dakinissystems.com",
      product: "akoenet",
      scope: "chats",
    },
    {
      match: ["lifeflow", "finanzas", "coach"],
      title: "LifeFlow",
      path: "https://finance.dakinissystems.com",
      product: "lifeflow",
      scope: "events",
    },
  ];

  const hits = [];
  for (const item of shortcuts) {
    if (!item.match.some((m) => needle.includes(m))) continue;
    hits.push({
      scope: item.scope,
      id: `product:${item.product}`,
      title: `Abrir ${item.title}`,
      snippet: "Producto del ecosistema Dakinis",
      score: 0.72,
      path: item.path,
      product: item.product,
      external: true,
    });
  }
  return hits;
}

/**
 * @param {number} userId
 * @param {string} q
 * @param {string} [scopeRaw="all"]
 */
export async function fetchWorkspaceSearch(userId, q, scopeRaw = "all") {
  const needle = String(q || "").trim();
  if (needle.length < 2) {
    return { hits: [], stub: true, reason: "query_too_short" };
  }

  const scope = scopeRaw || "all";
  const [remote, localContent, shortcuts] = await Promise.all([
    remotePlatformSearch(needle, scope),
    localContentSearch(userId, needle, scope),
    Promise.resolve(ecosystemShortcutHits(needle, scope)),
  ]);

  const hits = mergeHits([localContent, remote, shortcuts]);
  return {
    hits,
    stub: hits.length === 0,
    sources: {
      remote: remote.length,
      localContent: localContent.length,
      shortcuts: shortcuts.length,
    },
    searchConfigured: isSearchPlatformConfigured(),
  };
}

/**
 * Bulk reindex helper — used by CLI script.
 * @param {{ limit?: number; userId?: number }} [opts]
 */
export async function reindexAllContentForSearch(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 500, 1), 5000);
  const where = opts.userId ? { userId: opts.userId } : {};

  let rows = [];
  try {
    rows = await Content.findAll({
      where: { ...where, deletedAt: null },
      limit,
      order: [["updatedAt", "DESC"]],
    });
  } catch {
    rows = await Content.findAll({
      where,
      limit,
      order: [["id", "DESC"]],
    });
  }

  const { indexStreamContentInSearch } = await import("./search-platform-index.js");
  let indexed = 0;
  let failed = 0;

  for (const content of rows) {
    const user = await User.findByPk(content.userId, { attributes: ["id", "username"] });
    const result = await indexStreamContentInSearch(content, user);
    if (result.indexed) indexed += 1;
    else failed += 1;
  }

  return { total: rows.length, indexed, failed };
}

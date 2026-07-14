import logger from "../utils/logger.js";

function searchBaseUrl() {
  const direct = String(process.env.DAKINIS_SEARCH_URL || "").trim().replace(/\/$/, "");
  if (direct) return direct;
  const gateway = String(process.env.DAKINIS_GATEWAY_URL || "").trim().replace(/\/$/, "");
  if (gateway) return `${gateway}/search`;
  return "";
}

export function isSearchPlatformConfigured() {
  return Boolean(searchBaseUrl());
}

/**
 * @param {{ scope: string; id: string; title?: string; body?: string; metadata?: object }} doc
 */
export async function indexSearchDocument(doc) {
  const base = searchBaseUrl();
  if (!base || !doc?.scope || !doc?.id) return { indexed: false, reason: "not_configured" };

  try {
    const res = await fetch(`${base}/v1/index`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        scope: doc.scope,
        id: doc.id,
        title: doc.title || "",
        body: doc.body || "",
        metadata: doc.metadata || {},
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      logger.warn("Platform search index failed", {
        id: doc.id,
        status: res.status,
        text: text.slice(0, 120),
      });
    }
    return { indexed: res.ok, status: res.status };
  } catch (err) {
    logger.warn("Platform search index error", { id: doc.id, error: err.message });
    return { indexed: false, error: err.message };
  }
}

/**
 * @param {string} scope
 * @param {string} id
 */
export async function removeSearchDocument(scope, id) {
  const base = searchBaseUrl();
  if (!base || !scope || !id) return { removed: false };
  try {
    const res = await fetch(`${base}/v1/index/${encodeURIComponent(scope)}/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    return { removed: res.ok, status: res.status };
  } catch (err) {
    logger.warn("Platform search remove error", { scope, id, error: err.message });
    return { removed: false };
  }
}

const STREAM_FRONTEND =
  String(process.env.FRONTEND_URL || process.env.PUBLIC_FRONTEND_URL || "https://streamautomator.com").replace(
    /\/$/,
    ""
  );

/**
 * @param {object} content — Sequelize model or plain object
 * @param {object} [user]
 */
export async function indexStreamContentInSearch(content, user) {
  if (!content?.id) return { indexed: false, reason: "no_content" };

  const row = typeof content.toJSON === "function" ? content.toJSON() : content;
  const platforms = Array.isArray(row.platforms) ? row.platforms.join(", ") : "";
  const docId = `streamautomator:content:${row.id}`;

  return indexSearchDocument({
    scope: "events",
    id: docId,
    title: row.title || "Publicación programada",
    body: [row.content, platforms, row.contentType, row.status, row.scheduledFor]
      .filter(Boolean)
      .join(" ")
      .slice(0, 2000),
    metadata: {
      product: "streamautomator",
      contentId: row.id,
      userId: row.userId || user?.id || null,
      streamer: user?.username || null,
      scheduledFor: row.scheduledFor,
      status: row.status,
      path: `${STREAM_FRONTEND}/schedule?content=${row.id}`,
    },
  });
}

/**
 * @param {number|string} contentId
 */
export async function removeStreamContentFromSearch(contentId) {
  if (!contentId) return { removed: false };
  return removeSearchDocument("events", `streamautomator:content:${contentId}`);
}

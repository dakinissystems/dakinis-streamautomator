/** @typedef {import('./types.js').ErrorCode} ErrorCode */

const DEFAULT_STATUS = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  database_not_configured: 503,
  service_unavailable: 503,
  internal_error: 500,
};

class AppError extends Error {
  /**
   * @param {string} code
   * @param {string} [message]
   * @param {{ statusCode?: number; details?: unknown; cause?: unknown }} [opts]
   */
  constructor(code, message, opts = {}) {
    super(message || code);
    this.name = "AppError";
    /** @type {string} */
    this.code = code;
    /** @type {number} */
    this.statusCode = opts.statusCode ?? DEFAULT_STATUS[code] ?? 500;
    /** @type {unknown} */
    this.details = opts.details;
    /** @type {boolean} */
    this.isOperational = true;
    if (opts.cause) this.cause = opts.cause;
  }
}

/**
 * @param {unknown} err
 * @returns {{ status: number; body: { error: string; code?: string; details?: unknown } }}
 */
function mapToHttp(err) {
  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code };
    if (err.details !== undefined) body.details = err.details;
    return { status: err.statusCode, body };
  }

  if (err instanceof Error) {
    const code = err.message;
    const status = DEFAULT_STATUS[code] ?? 500;
    if (status !== 500) {
      const body = { error: code, code };
      if (err.details !== undefined) body.details = err.details;
      return { status, body };
    }
  }

  return { status: 500, body: { error: "internal_error", code: "internal_error" } };
}

/**
 * @param {import('http').IncomingMessage & { url?: string }} req
 * @param {import('http').ServerResponse} res
 * @param {unknown} err
 * @param {{ log?: (payload: object, msg: string) => void }} [opts]
 */
function sendHttpError(req, res, err, opts = {}) {
  const mapped = mapToHttp(err);
  if (opts.log) {
    opts.log(
      {
        err: err instanceof Error ? { message: err.message, code: err.code, stack: err.stack } : err,
        method: req.method,
        path: req.url,
      },
      "request_error"
    );
  }
  const payload = JSON.stringify(mapped.body);
  res.writeHead(mapped.status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
  return mapped;
}

module.exports = {
  AppError,
  mapToHttp,
  sendHttpError,
  DEFAULT_STATUS,
};

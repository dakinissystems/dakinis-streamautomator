const { mapToHttp } = require("./index.js");

/**
 * Express error middleware using shared AppError mapping.
 * @param {(err: unknown, req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void} [onError]
 */
function createExpressErrorHandler(onError) {
  return function expressErrorHandler(err, req, res, next) {
    if (onError) onError(err, req, res, next);
    if (res.headersSent) return next(err);
    const mapped = mapToHttp(err);
    res.status(mapped.status).json(mapped.body);
  };
}

module.exports = { createExpressErrorHandler };

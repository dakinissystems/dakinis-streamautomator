/**
 * Domain-level errors (pure business rules). Map to HTTP in adapters.
 */
export class DomainError extends Error {
  /**
   * @param {string} code
   * @param {string} [message]
   * @param {{ details?: unknown }} [opts]
   */
  constructor(code, message, opts = {}) {
    super(message || code);
    this.name = "DomainError";
    this.code = code;
    this.details = opts.details;
  }
}

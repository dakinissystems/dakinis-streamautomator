export class DbError extends Error {
  /**
   * @param {string} code
   * @param {string} [message]
   */
  constructor(code, message) {
    super(message || code);
    this.name = "DbError";
    this.code = code;
  }
}

export class NotFoundError extends DbError {
  constructor(resource = "resource") {
    super("not_found", `${resource}_not_found`);
  }
}

export class ConflictError extends DbError {
  constructor(reason = "conflict") {
    super("conflict", reason);
  }
}

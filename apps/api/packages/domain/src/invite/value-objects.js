import { DomainError } from "../shared/domain-error.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class Email {
  /** @param {string} raw */
  static from(raw) {
    return new Email(raw);
  }

  /** @param {string} raw */
  constructor(raw) {
    const norm = String(raw || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm)) {
      throw new DomainError("invalid_email", `Invalid email: ${raw}`);
    }
    this._value = norm;
  }

  get value() {
    return this._value;
  }

  /** @param {Email} other */
  equals(other) {
    return other instanceof Email && this._value === other._value;
  }
}

export class WorkspaceId {
  /** @param {string} raw */
  static from(raw) {
    return new WorkspaceId(raw);
  }

  /** @param {string} raw */
  constructor(raw) {
    const s = String(raw || "").trim();
    if (!UUID_RE.test(s)) {
      throw new DomainError("invalid_workspace_id", `Invalid workspace id: ${raw}`);
    }
    this._value = s;
  }

  get value() {
    return this._value;
  }
}

export class UserId {
  /** @param {string} raw */
  static from(raw) {
    return new UserId(raw);
  }

  /** @param {string} raw */
  constructor(raw) {
    const s = String(raw || "").trim();
    if (!UUID_RE.test(s)) {
      throw new DomainError("invalid_user_id", `Invalid user id: ${raw}`);
    }
    this._value = s;
  }

  get value() {
    return this._value;
  }
}

export const INVITE_ROLES = /** @type {const} */ (["owner", "admin", "member", "viewer"]);

/** @typedef {(typeof INVITE_ROLES)[number]} InviteRoleValue */

export class InviteRole {
  /** @param {string} raw */
  static from(raw) {
    return new InviteRole(raw);
  }

  /** @param {string} raw */
  constructor(raw) {
    const role = String(raw || "").trim().toLowerCase();
    if (!INVITE_ROLES.includes(/** @type {InviteRoleValue} */ (role))) {
      throw new DomainError("invalid_invite_role", `Invalid invite role: ${raw}`);
    }
    this._value = /** @type {InviteRoleValue} */ (role);
  }

  get value() {
    return this._value;
  }
}

export const INVITE_STATUSES = /** @type {const} */ ([
  "pending",
  "opened",
  "accepted",
  "expired",
]);

/** @typedef {(typeof INVITE_STATUSES)[number]} InviteStatusValue */

export class InviteStatus {
  /** @param {InviteStatusValue} value */
  static from(value) {
    return new InviteStatus(value);
  }

  /** @param {InviteStatusValue} value */
  constructor(value) {
    if (!INVITE_STATUSES.includes(value)) {
      throw new DomainError("invalid_invite_status", `Invalid invite status: ${value}`);
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }
}

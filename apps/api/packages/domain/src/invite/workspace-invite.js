import { DomainError } from "../shared/domain-error.js";
import { AggregateRoot } from "../shared/aggregate-root.js";
import { StateMachine } from "../shared/state-machine.js";
import {
  Email,
  InviteRole,
  InviteStatus,
  UserId,
  WorkspaceId,
} from "./value-objects.js";
import {
  inviteAcceptedEvent,
  inviteCreatedEvent,
  inviteExpiredEvent,
  inviteOpenedEvent,
} from "./events.js";

/** @typedef {'open' | 'accept' | 'expire'} InviteTransitionEvent */

const inviteMachineConfig = {
  initialState: /** @type {const} */ ("pending"),
  states: {
    pending: { on: { open: "opened", accept: "accepted", expire: "expired" } },
    opened: { on: { accept: "accepted", expire: "expired" } },
    accepted: { on: {} },
    expired: { on: {} },
  },
};

/**
 * Workspace invite aggregate — business rules for invite lifecycle.
 */
export class WorkspaceInvite extends AggregateRoot {
  /**
   * @param {{
   *   id: string;
   *   token: string;
   *   workspaceId: WorkspaceId;
   *   email: Email;
   *   role: InviteRole;
   *   invitedBy: UserId | null;
   *   expiresAt: Date;
   *   usedAt?: Date | null;
   *   status: InviteStatus;
   * }} props
   */
  constructor(props) {
    super();
    this.id = props.id;
    this.token = props.token;
    this.workspaceId = props.workspaceId;
    this.email = props.email;
    this.role = props.role;
    this.invitedBy = props.invitedBy;
    this.expiresAt = props.expiresAt;
    this.usedAt = props.usedAt ?? null;
    this._sm = new StateMachine(inviteMachineConfig, props.status.value);
  }

  /**
   * @param {{
   *   workspaceId: string;
   *   email: string;
   *   role: string;
   *   invitedBy: string;
   *   expiresInDays?: number;
   *   id?: string;
   *   token?: string;
   *   generateToken?: () => string;
   * }} params
   */
  static create(params) {
    const id = params.id ?? crypto.randomUUID();
    const token = params.token ?? (params.generateToken ? params.generateToken() : crypto.randomUUID().replace(/-/g, ""));
    const days = params.expiresInDays ?? 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const invite = new WorkspaceInvite({
      id,
      token,
      workspaceId: WorkspaceId.from(params.workspaceId),
      email: Email.from(params.email),
      role: InviteRole.from(params.role),
      invitedBy: params.invitedBy ? UserId.from(params.invitedBy) : null,
      expiresAt,
      status: InviteStatus.from("pending"),
    });

    invite._raise(
      inviteCreatedEvent({
        inviteId: id,
        workspaceId: invite.workspaceId.value,
        email: invite.email.value,
        invitedBy: invite.invitedBy?.value ?? "",
        role: invite.role.value,
      })
    );

    return invite;
  }

  /**
   * Reconstitute from persistence (no domain events raised).
   * @param {{
   *   id: string;
   *   token: string;
   *   workspaceId: string;
   *   email: string;
   *   role: string;
   *   invitedBy?: string | null;
   *   expiresAt: Date | string;
   *   usedAt?: Date | string | null;
   * }} row
   */
  static reconstitute(row) {
    const expiresAt = row.expiresAt instanceof Date ? row.expiresAt : new Date(row.expiresAt);
    const usedAt = row.usedAt
      ? row.usedAt instanceof Date
        ? row.usedAt
        : new Date(row.usedAt)
      : null;

    let status = "pending";
    if (usedAt) status = "accepted";
    else if (expiresAt.getTime() < Date.now()) status = "expired";

    return new WorkspaceInvite({
      id: row.id,
      token: row.token,
      workspaceId: WorkspaceId.from(row.workspaceId),
      email: Email.from(row.email),
      role: InviteRole.from(row.role),
      invitedBy: row.invitedBy ? UserId.from(row.invitedBy) : null,
      expiresAt,
      usedAt,
      status: InviteStatus.from(/** @type {import('./value-objects.js').InviteStatusValue} */ (status)),
    });
  }

  get status() {
    return InviteStatus.from(this._sm.state);
  }

  get isExpired() {
    return this.expiresAt.getTime() < Date.now();
  }

  get canAccept() {
    return (this._sm.state === "pending" || this._sm.state === "opened") && !this.isExpired;
  }

  /** Mark invite link as opened (optional tracking). */
  open() {
    if (this.isExpired) {
      this._transition("expire");
      throw new DomainError("invite_expired", "Invite has expired");
    }
    if (!this._sm.can("open")) {
      throw new DomainError("invite_invalid_state", `Cannot open invite in state ${this._sm.state}`);
    }
    this._transition("open");
    this._raise(
      inviteOpenedEvent({
        inviteId: this.id,
        workspaceId: this.workspaceId.value,
      })
    );
  }

  /**
   * @param {UserId} userId
   * @param {Email} userEmail
   */
  accept(userId, userEmail) {
    if (this._sm.state === "accepted") {
      throw new DomainError("invite_already_used", "Invite already accepted");
    }
    if (this.isExpired) {
      this._transition("expire");
      throw new DomainError("invite_expired", "Invite has expired");
    }
    if (!userEmail.equals(this.email)) {
      throw new DomainError("email_mismatch", "Invite email does not match user");
    }
    if (!this._sm.can("accept")) {
      throw new DomainError("invite_invalid_state", `Cannot accept invite in state ${this._sm.state}`);
    }

    this._transition("accept");
    this.usedAt = new Date();

    this._raise(
      inviteAcceptedEvent({
        inviteId: this.id,
        workspaceId: this.workspaceId.value,
        userId: userId.value,
        email: userEmail.value,
        role: this.role.value,
      })
    );
  }

  expire() {
    if (this._sm.state === "accepted") return;
    if (this._sm.can("expire")) {
      this._transition("expire");
      this._raise(
        inviteExpiredEvent({
          inviteId: this.id,
          workspaceId: this.workspaceId.value,
        })
      );
    }
  }

  /**
   * @param {InviteTransitionEvent} event
   * @private
   */
  _transition(event) {
    const ok = this._sm.transition(event);
    if (!ok) {
      throw new DomainError("invite_invalid_transition", `Invalid transition ${event} from ${this._sm.state}`);
    }
  }

  /** Snapshot for adapters (no events). */
  toPersistence() {
    return {
      id: this.id,
      token: this.token,
      workspaceId: this.workspaceId.value,
      email: this.email.value,
      role: this.role.value,
      invitedBy: this.invitedBy?.value ?? null,
      expiresAt: this.expiresAt,
      usedAt: this.usedAt,
      status: this._sm.state,
    };
  }
}

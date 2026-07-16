import { DomainError } from "../shared/domain-error.js";
import { AggregateRoot } from "../shared/aggregate-root.js";
import { StateMachine } from "../shared/state-machine.js";
import { createDomainEvent } from "../shared/domain-event.js";

export const DIRECTOR_CREATED = "director.created";
export const DIRECTOR_PREPARED = "director.prepared";
export const DIRECTOR_READY = "director.ready";
export const DIRECTOR_STARTED = "director.started";
export const DIRECTOR_ENDED = "director.ended";
export const DIRECTOR_COMPLETED = "director.completed";

const directorMachine = {
  initialState: /** @type {const} */ ("draft"),
  states: {
    draft: { on: { prepare: "preparing" } },
    preparing: { on: { ready: "ready", cancel: "draft" } },
    ready: { on: { start: "live", cancel: "draft" } },
    live: { on: { end: "post" } },
    post: { on: { complete: "completed" } },
    completed: { on: {} },
  },
};

/**
 * Director session aggregate — enforces real transitions (no jump to live).
 */
export class DirectorSession extends AggregateRoot {
  /**
   * @param {{
   *   id: string;
   *   workspaceId?: string | null;
   *   userId?: string | null;
   *   status?: string;
   * }} props
   */
  constructor(props) {
    super();
    this.id = props.id;
    this.workspaceId = props.workspaceId ?? null;
    this.userId = props.userId ?? null;
    this._sm = new StateMachine(directorMachine, props.status || "draft");
  }

  /**
   * @param {{ id?: string; workspaceId?: string | null; userId?: string | null }} params
   */
  static create(params = {}) {
    const id = params.id ?? crypto.randomUUID();
    const session = new DirectorSession({
      id,
      workspaceId: params.workspaceId ?? null,
      userId: params.userId ?? null,
      status: "draft",
    });
    session._raise(
      createDomainEvent({
        type: DIRECTOR_CREATED,
        aggregateId: id,
        aggregateType: "DirectorSession",
        workspaceId: session.workspaceId,
        actorId: session.userId,
        payload: { sessionId: id, status: "draft" },
      })
    );
    return session;
  }

  /**
   * @param {{ id: string; workspaceId?: string | null; userId?: string | null; status: string }} row
   */
  static reconstitute(row) {
    return new DirectorSession({
      id: row.id,
      workspaceId: row.workspaceId ?? null,
      userId: row.userId ?? null,
      status: mapLegacyDirectorStatus(row.status),
    });
  }

  get status() {
    return this._sm.state;
  }

  prepare() {
    this._transition("prepare", DIRECTOR_PREPARED);
  }

  ready() {
    this._transition("ready", DIRECTOR_READY);
  }

  start() {
    this._transition("start", DIRECTOR_STARTED);
  }

  end() {
    this._transition("end", DIRECTOR_ENDED);
  }

  complete() {
    this._transition("complete", DIRECTOR_COMPLETED);
  }

  cancel() {
    if (!this._sm.can("cancel")) {
      throw new DomainError("director_invalid_state", `Cannot cancel from ${this._sm.state}`);
    }
    this._sm.transition("cancel");
  }

  /**
   * @param {string} event
   * @param {string} domainEventType
   * @private
   */
  _transition(event, domainEventType) {
    if (!this._sm.can(event)) {
      throw new DomainError(
        "director_invalid_transition",
        `Invalid transition ${event} from ${this._sm.state}`
      );
    }
    this._sm.transition(event);
    this._raise(
      createDomainEvent({
        type: domainEventType,
        aggregateId: this.id,
        aggregateType: "DirectorSession",
        workspaceId: this.workspaceId,
        actorId: this.userId,
        payload: { sessionId: this.id, status: this._sm.state },
      })
    );
  }

  toPersistence() {
    return {
      id: this.id,
      workspaceId: this.workspaceId,
      userId: this.userId,
      status: this._sm.state,
    };
  }
}

/**
 * @param {string} status
 */
export function mapLegacyDirectorStatus(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "live") return "live";
  if (normalized === "completed" || normalized === "ended") return "completed";
  if (normalized === "ready") return "ready";
  if (normalized === "preparing") return "preparing";
  if (normalized === "post") return "post";
  return "draft";
}

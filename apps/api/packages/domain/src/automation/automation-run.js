import { DomainError } from "../shared/domain-error.js";
import { AggregateRoot } from "../shared/aggregate-root.js";
import { StateMachine } from "../shared/state-machine.js";
import { createDomainEvent } from "../shared/domain-event.js";

export const AUTOMATION_RUN_STARTED = "automation.run.started";
export const AUTOMATION_RUN_COMPLETED = "automation.run.completed";
export const AUTOMATION_RUN_FAILED = "automation.run.failed";

const runMachine = {
  initialState: /** @type {const} */ ("started"),
  states: {
    started: { on: { run: "running" } },
    running: { on: { succeed: "ok", fail: "error" } },
    ok: { on: {} },
    error: { on: {} },
  },
};

/**
 * Automation run aggregate — started → running → ok|error.
 */
export class AutomationRun extends AggregateRoot {
  /**
   * @param {{
   *   id: string;
   *   ruleId: string | number;
   *   userId?: string | number | null;
   *   triggerType: string;
   *   status?: string;
   *   result?: object | null;
   *   error?: string | null;
   * }} props
   */
  constructor(props) {
    super();
    this.id = props.id;
    this.ruleId = props.ruleId;
    this.userId = props.userId ?? null;
    this.triggerType = props.triggerType;
    this.result = props.result ?? null;
    this.error = props.error ?? null;
    this._sm = new StateMachine(runMachine, props.status || "started");
  }

  /**
   * @param {{
   *   id?: string;
   *   ruleId: string | number;
   *   userId?: string | number | null;
   *   triggerType: string;
   * }} params
   */
  static start(params) {
    const id = params.id ?? crypto.randomUUID();
    const run = new AutomationRun({
      id,
      ruleId: params.ruleId,
      userId: params.userId ?? null,
      triggerType: params.triggerType,
      status: "started",
    });
    run._raise(
      createDomainEvent({
        type: AUTOMATION_RUN_STARTED,
        aggregateId: String(id),
        aggregateType: "AutomationRun",
        actorId: params.userId != null ? String(params.userId) : null,
        payload: {
          runId: id,
          ruleId: params.ruleId,
          triggerType: params.triggerType,
          status: "started",
        },
      })
    );
    run.begin();
    return run;
  }

  /**
   * @param {{
   *   id: string;
   *   ruleId: string | number;
   *   userId?: string | number | null;
   *   triggerType: string;
   *   status: string;
   *   result?: object | null;
   *   error?: string | null;
   * }} row
   */
  static reconstitute(row) {
    return new AutomationRun(row);
  }

  get status() {
    return this._sm.state;
  }

  begin() {
    if (this._sm.state === "running") return;
    if (!this._sm.can("run")) {
      throw new DomainError("automation_run_invalid_state", `Cannot run from ${this._sm.state}`);
    }
    this._sm.transition("run");
  }

  /**
   * @param {object} [result]
   */
  succeed(result = {}) {
    if (!this._sm.can("succeed")) {
      throw new DomainError("automation_run_invalid_state", `Cannot succeed from ${this._sm.state}`);
    }
    this._sm.transition("succeed");
    this.result = result;
    this.error = null;
    this._raise(
      createDomainEvent({
        type: AUTOMATION_RUN_COMPLETED,
        aggregateId: String(this.id),
        aggregateType: "AutomationRun",
        actorId: this.userId != null ? String(this.userId) : null,
        payload: {
          runId: this.id,
          ruleId: this.ruleId,
          triggerType: this.triggerType,
          status: "ok",
          result,
        },
      })
    );
  }

  /**
   * @param {string} message
   * @param {object} [result]
   */
  fail(message, result = {}) {
    if (!this._sm.can("fail")) {
      throw new DomainError("automation_run_invalid_state", `Cannot fail from ${this._sm.state}`);
    }
    this._sm.transition("fail");
    this.error = message;
    this.result = result;
    this._raise(
      createDomainEvent({
        type: AUTOMATION_RUN_FAILED,
        aggregateId: String(this.id),
        aggregateType: "AutomationRun",
        actorId: this.userId != null ? String(this.userId) : null,
        payload: {
          runId: this.id,
          ruleId: this.ruleId,
          triggerType: this.triggerType,
          status: "error",
          error: message,
          result,
        },
      })
    );
  }

  toPersistence() {
    return {
      id: this.id,
      ruleId: this.ruleId,
      userId: this.userId,
      triggerType: this.triggerType,
      status: this._sm.state === "running" ? "started" : this._sm.state,
      result: this.result,
      error: this.error,
    };
  }
}

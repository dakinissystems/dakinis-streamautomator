import { DomainError } from "../shared/domain-error.js";
import { AggregateRoot } from "../shared/aggregate-root.js";
import { createDomainEvent } from "../shared/domain-event.js";

export const AUTOMATION_RULE_CREATED = "automation.rule.created";
export const AUTOMATION_RULE_ENABLED = "automation.rule.enabled";
export const AUTOMATION_RULE_DISABLED = "automation.rule.disabled";

/**
 * Automation rule aggregate — enable/disable + basic invariants (IF/THEN flat).
 */
export class AutomationRule extends AggregateRoot {
  /**
   * @param {{
   *   id: string | number;
   *   userId?: string | number | null;
   *   triggerType: string;
   *   actions?: object[];
   *   enabled?: boolean;
   * }} props
   */
  constructor(props) {
    super();
    this.id = props.id;
    this.userId = props.userId ?? null;
    this.triggerType = String(props.triggerType || "").trim();
    this.actions = Array.isArray(props.actions) ? props.actions : [];
    this.enabled = props.enabled !== false;
  }

  /**
   * @param {{
   *   id?: string | number;
   *   userId?: string | number | null;
   *   triggerType: string;
   *   actions?: object[];
   *   enabled?: boolean;
   * }} params
   */
  static create(params) {
    if (!params.triggerType) {
      throw new DomainError("trigger_required", "Automation rule requires triggerType");
    }
    const id = params.id ?? crypto.randomUUID();
    const rule = new AutomationRule({
      id,
      userId: params.userId ?? null,
      triggerType: params.triggerType,
      actions: params.actions || [],
      enabled: params.enabled !== false,
    });
    rule._raise(
      createDomainEvent({
        type: AUTOMATION_RULE_CREATED,
        aggregateId: String(id),
        aggregateType: "AutomationRule",
        actorId: params.userId != null ? String(params.userId) : null,
        payload: {
          ruleId: id,
          triggerType: rule.triggerType,
          enabled: rule.enabled,
          actionCount: rule.actions.length,
        },
      })
    );
    return rule;
  }

  /**
   * @param {{
   *   id: string | number;
   *   userId?: string | number | null;
   *   triggerType: string;
   *   actions?: object[];
   *   enabled?: boolean;
   * }} row
   */
  static reconstitute(row) {
    return new AutomationRule(row);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this._raise(
      createDomainEvent({
        type: AUTOMATION_RULE_ENABLED,
        aggregateId: String(this.id),
        aggregateType: "AutomationRule",
        actorId: this.userId != null ? String(this.userId) : null,
        payload: { ruleId: this.id, enabled: true },
      })
    );
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this._raise(
      createDomainEvent({
        type: AUTOMATION_RULE_DISABLED,
        aggregateId: String(this.id),
        aggregateType: "AutomationRule",
        actorId: this.userId != null ? String(this.userId) : null,
        payload: { ruleId: this.id, enabled: false },
      })
    );
  }

  /**
   * Flat IF/THEN only — nodes deferred until branches exist in prod.
   * @param {object[]} actions
   */
  setActions(actions) {
    if (!Array.isArray(actions)) {
      throw new DomainError("invalid_actions", "actions must be an array");
    }
    this.actions = actions;
  }

  toPersistence() {
    return {
      id: this.id,
      userId: this.userId,
      triggerType: this.triggerType,
      actions: this.actions,
      enabled: this.enabled,
    };
  }
}

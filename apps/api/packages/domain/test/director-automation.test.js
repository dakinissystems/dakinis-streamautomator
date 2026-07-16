import assert from "node:assert/strict";
import test from "node:test";
import {
  DirectorSession,
  AutomationRun,
  AutomationRule,
} from "../src/index.js";
import { DomainError } from "../src/shared/domain-error.js";

test("DirectorSession enforces prepare → ready → start → end → complete", () => {
  const session = DirectorSession.create({
    id: "a1000088-0000-4000-8000-000000000011",
    userId: "a1000088-0000-4000-8000-000000000088",
  });
  assert.equal(session.status, "draft");
  session.prepare();
  session.ready();
  session.start();
  assert.equal(session.status, "live");
  session.end();
  session.complete();
  assert.equal(session.status, "completed");
  const types = session.pullDomainEvents().map((e) => e.type);
  assert.ok(types.includes("director.created"));
  assert.ok(types.includes("director.started"));
  assert.ok(types.includes("director.completed"));
});

test("DirectorSession rejects jump to start from draft", () => {
  const session = DirectorSession.create({ id: "a1000088-0000-4000-8000-000000000012" });
  assert.throws(() => session.start(), (err) => err instanceof DomainError);
});

test("AutomationRun started → running → ok", () => {
  const run = AutomationRun.start({
    id: "run-1",
    ruleId: 7,
    userId: 20,
    triggerType: "stream.started",
  });
  assert.equal(run.status, "running");
  run.succeed({ actions: [] });
  assert.equal(run.status, "ok");
  const events = run.pullDomainEvents();
  assert.equal(events.some((e) => e.type === "automation.run.started"), true);
  assert.equal(events.some((e) => e.type === "automation.run.completed"), true);
});

test("AutomationRun fail path", () => {
  const run = AutomationRun.start({
    id: "run-2",
    ruleId: 7,
    triggerType: "stream.started",
  });
  run.fail("action_failed", { actions: [{ error: "action_failed" }] });
  assert.equal(run.status, "error");
  assert.equal(run.error, "action_failed");
});

test("AutomationRule enable/disable emits events", () => {
  const rule = AutomationRule.create({
    id: 1,
    userId: 20,
    triggerType: "stream.started",
    actions: [{ type: "timeline.log" }],
  });
  rule.disable();
  rule.enable();
  const types = rule.pullDomainEvents().map((e) => e.type);
  assert.ok(types.includes("automation.rule.created"));
  assert.ok(types.includes("automation.rule.disabled"));
  assert.ok(types.includes("automation.rule.enabled"));
});

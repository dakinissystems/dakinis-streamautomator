import assert from "node:assert/strict";
import test from "node:test";
import { WorkspaceInvite, Email, UserId, canAcceptInvite, canInviteMembers } from "../src/index.js";
import { DomainError } from "../src/shared/domain-error.js";

test("WorkspaceInvite.create raises invite.created", () => {
  const invite = WorkspaceInvite.create({
    id: "a1000088-0000-4000-8000-000000000099",
    token: "abc123",
    workspaceId: "1518afe5-028b-4c41-aa66-393094f58225",
    email: "guest@test.com",
    role: "member",
    invitedBy: "a1000088-0000-4000-8000-000000000088",
    expiresInDays: 7,
  });
  const events = invite.pullDomainEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "invite.created");
  assert.equal(events[0].eventVersion, "v1");
  assert.equal(invite.canAccept, true);
});

test("WorkspaceInvite.accept succeeds when email matches", () => {
  const invite = WorkspaceInvite.reconstitute({
    id: "a1000088-0000-4000-8000-000000000099",
    token: "tok",
    workspaceId: "1518afe5-028b-4c41-aa66-393094f58225",
    email: "guest@test.com",
    role: "member",
    invitedBy: "a1000088-0000-4000-8000-000000000088",
    expiresAt: new Date(Date.now() + 86400000),
    usedAt: null,
  });
  invite.accept(UserId.from("a1000088-0000-4000-8000-000000000077"), Email.from("guest@test.com"));
  assert.equal(invite.status.value, "accepted");
  const events = invite.pullDomainEvents();
  assert.equal(events[0].type, "invite.accepted");
});

test("WorkspaceInvite.accept rejects email mismatch", () => {
  const invite = WorkspaceInvite.reconstitute({
    id: "a1000088-0000-4000-8000-000000000099",
    token: "tok",
    workspaceId: "1518afe5-028b-4c41-aa66-393094f58225",
    email: "guest@test.com",
    role: "member",
    expiresAt: new Date(Date.now() + 86400000),
  });
  assert.throws(
    () =>
      invite.accept(
        UserId.from("a1000088-0000-4000-8000-000000000077"),
        Email.from("other@test.com")
      ),
    (err) => err instanceof DomainError && err.code === "email_mismatch"
  );
});

test("WorkspaceInvite.reconstitute marks expired invites", () => {
  const invite = WorkspaceInvite.reconstitute({
    id: "a1000088-0000-4000-8000-000000000099",
    token: "tok",
    workspaceId: "1518afe5-028b-4c41-aa66-393094f58225",
    email: "guest@test.com",
    role: "member",
    expiresAt: new Date(Date.now() - 1000),
  });
  assert.equal(invite.status.value, "expired");
  assert.equal(invite.canAccept, false);
});

test("Email value object normalizes and validates", () => {
  const e = Email.from("  Guest@Test.COM ");
  assert.equal(e.value, "guest@test.com");
  assert.throws(() => Email.from("not-an-email"), DomainError);
});

test("canAcceptInvite policy lives in domain", () => {
  assert.equal(canAcceptInvite({ inviteEmail: "a@b.com", userEmail: "A@B.com" }), true);
  assert.equal(canAcceptInvite({ inviteEmail: "a@b.com", userEmail: "x@y.com" }), false);
});

test("canInviteMembers policy requires owner/admin", () => {
  assert.equal(canInviteMembers({ actorRole: "member" }), false);
  assert.equal(canInviteMembers({ actorRole: "admin" }), true);
  assert.equal(canInviteMembers({ isPlatformAdmin: true }), true);
});

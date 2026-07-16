import { createDomainEvent } from "../shared/domain-event.js";

export const INVITE_CREATED = "invite.created";
export const INVITE_OPENED = "invite.opened";
export const INVITE_ACCEPTED = "invite.accepted";
export const INVITE_EXPIRED = "invite.expired";

/**
 * @param {{ inviteId: string; workspaceId: string; email: string; invitedBy: string; role: string }} data
 */
export function inviteCreatedEvent(data) {
  return createDomainEvent({
    type: INVITE_CREATED,
    aggregateId: data.inviteId,
    aggregateType: "WorkspaceInvite",
    workspaceId: data.workspaceId,
    actorId: data.invitedBy,
    payload: data,
  });
}

/**
 * @param {{ inviteId: string; workspaceId: string }} data
 */
export function inviteOpenedEvent(data) {
  return createDomainEvent({
    type: INVITE_OPENED,
    aggregateId: data.inviteId,
    aggregateType: "WorkspaceInvite",
    workspaceId: data.workspaceId,
    payload: data,
  });
}

/**
 * @param {{ inviteId: string; workspaceId: string; userId: string; email: string; role: string }} data
 */
export function inviteAcceptedEvent(data) {
  return createDomainEvent({
    type: INVITE_ACCEPTED,
    aggregateId: data.inviteId,
    aggregateType: "WorkspaceInvite",
    workspaceId: data.workspaceId,
    actorId: data.userId,
    payload: data,
  });
}

/**
 * @param {{ inviteId: string; workspaceId: string }} data
 */
export function inviteExpiredEvent(data) {
  return createDomainEvent({
    type: INVITE_EXPIRED,
    aggregateId: data.inviteId,
    aggregateType: "WorkspaceInvite",
    workspaceId: data.workspaceId,
    payload: data,
  });
}

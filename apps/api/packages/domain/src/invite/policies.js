/**
 * Workspace invite business policies (beyond coarse permissions).
 */

/**
 * @param {{ actorRole?: string; isPlatformAdmin?: boolean }} ctx
 */
export function canInviteMembers(ctx) {
  const role = String(ctx.actorRole || "").toLowerCase();
  if (ctx.isPlatformAdmin) return true;
  return ["owner", "admin"].includes(role);
}

/**
 * @param {{ inviteEmail: string; userEmail: string }} ctx
 */
export function canAcceptInvite(ctx) {
  return String(ctx.inviteEmail || "").trim().toLowerCase() === String(ctx.userEmail || "").trim().toLowerCase();
}

/**
 * @param {{ actorRole?: string; isPlatformAdmin?: boolean }} ctx
 */
export function canManageWorkspaceMembers(ctx) {
  return canInviteMembers(ctx);
}

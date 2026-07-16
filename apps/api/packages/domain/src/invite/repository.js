/**
 * @typedef {import('./workspace-invite.js').WorkspaceInvite} WorkspaceInvite
 */

/**
 * Persistence port — implemented in shared-db / internal adapters.
 * @typedef {object} WorkspaceInviteRepository
 * @property {(invite: WorkspaceInvite) => Promise<void>} save
 * @property {(token: string) => Promise<WorkspaceInvite | null>} findByToken
 * @property {(workspaceId: string) => Promise<WorkspaceInvite[]>} findPendingByWorkspace
 */

export {};

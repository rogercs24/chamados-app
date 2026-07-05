/** Ações auditadas. Centralizadas para consistência e busca. */
export const AuditAction = {
  LOGIN: 'auth.login',
  LOGIN_FAILED: 'auth.login_failed',
  LOGOUT: 'auth.logout',
  TOKEN_REFRESH: 'auth.token_refresh',
  TOKEN_REUSE_DETECTED: 'auth.token_reuse_detected',
  TENANT_CREATED: 'tenant.created',
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  PERMISSION_CHANGED: 'user.permission_changed',
  MFA_ENABLED: 'auth.mfa_enabled',
  MFA_DISABLED: 'auth.mfa_disabled',
  OAUTH_LOGIN: 'auth.oauth_login',
  CLIENT_CREATED: 'client.created',
  CLIENT_UPDATED: 'client.updated',
  CLIENT_DELETED: 'client.deleted',
  TICKET_CREATED: 'ticket.created',
  TICKET_TRIAGED: 'ticket.triaged',
  TICKET_STATUS_CHANGED: 'ticket.status_changed',
  TICKET_ANSWERED: 'ticket.answered',
} as const;

export type AuditActionType = (typeof AuditAction)[keyof typeof AuditAction];

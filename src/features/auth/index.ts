export type {
  CoreTaskerStatus,
  MockSession,
  MockSessionState,
  ProStatus,
  ProviderCapabilities,
  WorkspaceAccess,
} from '@/src/lib/auth/mockAuth';
export { mockAuth, mockSessions } from '@/src/lib/auth/mockAuth';
export {
  canAccessCustomerWorkspace,
  canAccessProviderWorkspace,
  getProviderModeSummary,
  getRecommendedProviderNextAction,
} from '@/src/lib/auth/workspaceAccess';

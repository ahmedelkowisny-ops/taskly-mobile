import type { UserSession } from '../api/types';
import type { MockSession } from './mockAuth';

type WorkspaceSession = Pick<UserSession | MockSession, 'providerCapabilities' | 'workspaceAccess'> &
  Partial<Pick<UserSession, 'nextAction'>>;

function hasBackendNextAction(session: WorkspaceSession): session is WorkspaceSession & Pick<UserSession, 'nextAction'> {
  return 'nextAction' in session && Boolean(session.nextAction);
}

export function canAccessCustomerWorkspace(session: WorkspaceSession | null | undefined) {
  return Boolean(session?.workspaceAccess.customer);
}

export function canAccessProviderWorkspace(session: WorkspaceSession | null | undefined) {
  return Boolean(session?.workspaceAccess.provider);
}

export function getProviderModeSummary(session: WorkspaceSession | null | undefined) {
  if (!session) {
    return 'No session loaded';
  }

  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  const hasCore = coreTaskerStatus === 'approved' || coreTaskerStatus === 'needsStripe';
  const hasPro = proStatus === 'approved';

  if (hasCore && hasPro) {
    return 'Core Tasker and Taskly Pro';
  }

  if (hasCore) {
    return 'Core Tasker';
  }

  if (hasPro) {
    return 'Taskly Pro';
  }

  if (coreTaskerStatus === 'applicant') {
    return 'Core Tasker applicant';
  }

  if (proStatus === 'draft' || proStatus === 'pending') {
    return 'Taskly Pro application';
  }

  return 'No provider mode active';
}

export function getRecommendedProviderNextAction(session: WorkspaceSession | null | undefined) {
  if (!session) {
    return 'Check your Taskly session';
  }

  if (hasBackendNextAction(session)) {
    if (session.nextAction.type !== 'none' && session.nextAction.label) {
      return session.nextAction.label;
    }

    return 'No provider action required';
  }

  const { coreTaskerStatus, proStatus } = session.providerCapabilities;

  if ((coreTaskerStatus === 'approved' || coreTaskerStatus === 'needsStripe') && proStatus === 'approved') {
    return 'Manage Core tasks and Pro requests';
  }

  if (proStatus === 'draft') {
    return 'Continue Pro application';
  }

  if (proStatus === 'pending') {
    return 'Pro application under review';
  }

  if (coreTaskerStatus === 'applicant') {
    return 'Continue Core Tasker onboarding';
  }

  if (coreTaskerStatus === 'needsStripe') {
    return 'Check Core payout status';
  }

  if (coreTaskerStatus === 'approved') {
    return 'View matching Core tasks';
  }

  if (proStatus === 'approved') {
    return 'View matching Pro requests';
  }

  return 'Start as a Tasker or apply as Taskly Pro';
}

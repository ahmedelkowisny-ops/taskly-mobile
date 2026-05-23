import type { UserSession } from '../api/types';
import type { MockSession } from './mockAuth';

type WorkspaceSession = Pick<UserSession | MockSession, 'providerCapabilities' | 'workspaceAccess'> &
  Partial<Pick<UserSession, 'nextAction' | 'permissions'>>;

export type WorkspaceName = 'customer' | 'provider';
export type WorkspaceEntryState = {
  actionLabel: string;
  description: string;
  state: 'available' | 'demo' | 'loginRequired' | 'unavailable';
};

function hasBackendNextAction(session: WorkspaceSession): session is WorkspaceSession & Pick<UserSession, 'nextAction'> {
  return 'nextAction' in session && Boolean(session.nextAction);
}

export function canAccessCustomerWorkspace(session: WorkspaceSession | null | undefined) {
  return Boolean(session?.workspaceAccess.customer);
}

export function canAccessProviderWorkspace(session: WorkspaceSession | null | undefined) {
  return Boolean(session?.workspaceAccess.provider);
}

export function getCustomerWorkspaceSummary(session: WorkspaceSession | null | undefined) {
  if (!session) {
    return 'Login to post tasks, Pro requests, and manage messages.';
  }

  if (session.workspaceAccess.customer) {
    return 'Customer Workspace available';
  }

  return 'Customer Workspace is not available for this account yet.';
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

export function getWorkspaceEntryState(
  session: WorkspaceSession | null | undefined,
  workspace: WorkspaceName,
  authStatus: 'authenticated' | 'demo' | 'error' | 'loading' | 'unauthenticated',
): WorkspaceEntryState {
  if (authStatus === 'loading') {
    return {
      actionLabel: 'Checking session',
      description: 'Checking your Taskly session...',
      state: 'unavailable',
    };
  }

  if (authStatus === 'demo') {
    return {
      actionLabel: workspace === 'customer' ? 'Enter Customer Workspace' : 'Enter Provider Workspace',
      description: 'Demo workspace mode is active.',
      state: 'demo',
    };
  }

  if (!session || authStatus === 'unauthenticated' || authStatus === 'error') {
    return {
      actionLabel: 'Login',
      description: 'Login required to use this workspace with your real Taskly account.',
      state: 'loginRequired',
    };
  }

  const allowed = workspace === 'customer' ? canAccessCustomerWorkspace(session) : canAccessProviderWorkspace(session);

  if (allowed) {
    return {
      actionLabel: workspace === 'customer' ? 'Enter Customer Workspace' : 'Enter Provider Workspace',
      description: workspace === 'customer' ? getCustomerWorkspaceSummary(session) : getProviderModeSummary(session),
      state: 'available',
    };
  }

  if (workspace === 'provider') {
    return {
      actionLabel: 'Start provider setup',
      description: getRecommendedProviderNextAction(session),
      state: 'unavailable',
    };
  }

  return {
    actionLabel: 'Back to Taskly',
    description: getCustomerWorkspaceSummary(session),
    state: 'unavailable',
  };
}

export function getCoreTaskerStatusLabel(status: WorkspaceSession['providerCapabilities']['coreTaskerStatus']) {
  switch (status) {
    case 'applicant':
      return 'Core Tasker onboarding in progress';
    case 'approved':
      return 'Core Tasker approved';
    case 'needsStripe':
      return 'Stripe verification required for Core payouts';
    case 'none':
    default:
      return 'Core Tasker not started';
  }
}

export function getProStatusLabel(status: WorkspaceSession['providerCapabilities']['proStatus']) {
  switch (status) {
    case 'draft':
      return 'Pro application draft';
    case 'pending':
      return 'Pro application under review';
    case 'approved':
      return 'Taskly Pro approved';
    case 'none':
    default:
      return 'Taskly Pro not started';
  }
}

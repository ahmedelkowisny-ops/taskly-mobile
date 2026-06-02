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

const CUSTOMER_HOME_ROUTE = '/customer/home';
const PROVIDER_DASHBOARD_ROUTE = '/provider/dashboard';
const PROVIDER_START_ROUTE = '/provider/start';

function hasBackendNextAction(session: WorkspaceSession): session is WorkspaceSession & Pick<UserSession, 'nextAction'> {
  return 'nextAction' in session && Boolean(session.nextAction);
}

export function canAccessCustomerWorkspace(session: WorkspaceSession | null | undefined) {
  return Boolean(session?.workspaceAccess.customer);
}

export function canAccessProviderWorkspace(session: WorkspaceSession | null | undefined) {
  return Boolean(session?.workspaceAccess.provider);
}

export function hasCoreTaskerMode(session: WorkspaceSession | null | undefined) {
  if (!session) return false;

  const { coreTaskerStatus } = session.providerCapabilities;
  return coreTaskerStatus === 'approved' || coreTaskerStatus === 'needsStripe';
}

export function hasApprovedProMode(session: WorkspaceSession | null | undefined) {
  return session?.providerCapabilities.proStatus === 'approved';
}

export function hasApprovedProviderMode(session: WorkspaceSession | null | undefined) {
  return hasCoreTaskerMode(session) || hasApprovedProMode(session);
}

export function isTaskerOnlyProvider(session: WorkspaceSession | null | undefined) {
  return hasCoreTaskerMode(session) && !hasApprovedProMode(session);
}

export function hasPendingProviderMode(session: WorkspaceSession | null | undefined) {
  if (!session) return false;

  const { coreTaskerStatus, proStatus } = session.providerCapabilities;
  return coreTaskerStatus === 'applicant' || proStatus === 'draft' || proStatus === 'pending';
}

export function getDefaultAuthenticatedRoute(session: WorkspaceSession | null | undefined) {
  if (!session) return null;

  if (canAccessProviderWorkspace(session) && hasApprovedProviderMode(session)) {
    return hasBackendNextAction(session) && session.nextAction.type !== 'none'
      ? PROVIDER_START_ROUTE
      : PROVIDER_DASHBOARD_ROUTE;
  }

  if (hasPendingProviderMode(session)) {
    return PROVIDER_START_ROUTE;
  }

  if (canAccessCustomerWorkspace(session)) {
    return CUSTOMER_HOME_ROUTE;
  }

  if (canAccessProviderWorkspace(session)) {
    return PROVIDER_START_ROUTE;
  }

  return null;
}

export function getCustomerWorkspaceSummary(session: WorkspaceSession | null | undefined) {
  if (!session) {
    return 'Login to post Taskly tasks, Taskly Pro projects, and manage messages.';
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
    return 'Taskly Tasker and Taskly Pro';
  }

  if (hasCore) {
    return 'Taskly Tasker';
  }

  if (hasPro) {
    return 'Taskly Pro';
  }

  if (coreTaskerStatus === 'applicant') {
    return 'Taskly Tasker applicant';
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
    return 'Manage Taskly tasks and Taskly Pro projects';
  }

  if (proStatus === 'draft') {
    return 'Continue Pro application';
  }

  if (proStatus === 'pending') {
    return 'Pro application under review';
  }

  if (coreTaskerStatus === 'applicant') {
    return 'Continue Taskly Tasker onboarding';
  }

  if (coreTaskerStatus === 'needsStripe') {
    return 'Check Taskly task payout status';
  }

  if (coreTaskerStatus === 'approved') {
    return 'View matching Taskly tasks';
  }

  if (proStatus === 'approved') {
    return 'View matching Taskly Pro projects';
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
      actionLabel: workspace === 'customer' ? 'Enter Customer Workspace' : 'Open Taskly work',
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
      actionLabel: workspace === 'customer' ? 'Enter Customer Workspace' : 'Open Taskly work',
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
    return 'Taskly Tasker onboarding in progress';
    case 'approved':
    return 'Taskly Tasker approved';
    case 'needsStripe':
    return 'Stripe verification required for Taskly task payouts';
    case 'none':
    default:
    return 'Taskly Tasker not started';
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

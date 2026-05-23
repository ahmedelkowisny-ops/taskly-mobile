import { MockSession } from './mockAuth';

export function canAccessCustomerWorkspace(session: MockSession) {
  return session.workspaceAccess.customer;
}

export function canAccessProviderWorkspace(session: MockSession) {
  return session.workspaceAccess.provider;
}

export function getProviderModeSummary(session: MockSession) {
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

export function getRecommendedProviderNextAction(session: MockSession) {
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

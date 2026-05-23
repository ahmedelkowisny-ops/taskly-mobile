import { mockAuth } from '@/src/lib/auth/mockAuth';

import { CustomerHomeSummary, ProviderDashboardSummary } from './domain';
import { UserSession } from './types';

export function getMockUserSession(): UserSession {
  const session = mockAuth.currentSession;

  return {
    nextAction: {
      href: null,
      label: null,
      type: 'none',
    },
    permissions: {
      canPostProRequest: session.workspaceAccess.customer,
      canPostTask: session.workspaceAccess.customer,
      canViewCoreTasks: session.providerCapabilities.coreTaskerStatus === 'approved',
      canViewProRequests: session.providerCapabilities.proStatus === 'approved',
    },
    providerCapabilities: session.providerCapabilities,
    user: {
      displayName: session.displayName,
      email: 'demo@taskly.bg',
      id: session.id,
      preferredLocale: session.preferredLocale,
    },
    workspaceAccess: session.workspaceAccess,
  };
}

export function getMockCustomerHomeSummary(): CustomerHomeSummary {
  return {
    activeProRequestsCount: 0,
    activeTasksCount: 0,
    nextActions: [
      {
        href: '/customer/onboarding',
        id: 'setup-customer-workspace',
        label: 'Set up your Customer Workspace',
        tone: 'core',
      },
    ],
    unreadMessagesCount: 0,
  };
}

export function getMockProviderDashboardSummary(): ProviderDashboardSummary {
  const session = mockAuth.currentSession;

  return {
    coreTasksCount: 0,
    nextActions: [
      {
        href: '/provider/start',
        id: 'review-provider-status',
        label: 'Review provider setup',
        tone: 'pro',
      },
    ],
    profileStrengthLabel: 'Demo profile status',
    providerCapabilities: session.providerCapabilities,
    proRequestsCount: 0,
    unreadMessagesCount: 0,
  };
}

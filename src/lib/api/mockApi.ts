import { mockAuth } from '@/src/lib/auth/mockAuth';

import {
  CustomerHomeResponse,
  CustomerHomeSummary,
  CustomerProRequestsResponse,
  CustomerTasksResponse,
  ProviderCoreTasksResponse,
  ProviderDashboardResponse,
  ProviderDashboardSummary,
  ProviderProfileResponse,
  ProviderProRequestsResponse,
} from './domain';
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
    activeTasksCount: 0,
    completedTasksCount: 0,
    displayName: mockAuth.currentSession.displayName,
    openTasksCount: 0,
    pendingCompletionCount: 0,
    proRequestsCount: 0,
    proResponsesAvailableCount: 0,
    unreadMessagesCount: 0,
  };
}

export function getMockCustomerHomeResponse(): CustomerHomeResponse {
  return {
    highlights: [
      {
        accent: 'core',
        description: 'Demo Core task placeholder',
        href: '/customer/tasks',
        id: 'demo-core-empty',
        kind: 'task',
        statusLabel: 'Demo',
        title: 'Core tasks will appear here',
      },
      {
        accent: 'pro',
        description: 'Demo Pro request placeholder',
        href: '/customer/pro-requests',
        id: 'demo-pro-empty',
        kind: 'proRequest',
        statusLabel: 'Demo',
        title: 'Pro requests will appear here',
      },
    ],
    nextActions: [
      {
        accent: 'core',
        href: '/customer/onboarding',
        label: 'Post a task',
        type: 'post_task_placeholder',
      },
      {
        accent: 'pro',
        href: '/customer/onboarding',
        label: 'Post a Pro request',
        type: 'post_pro_request_placeholder',
      },
    ],
    summary: getMockCustomerHomeSummary(),
  };
}

export function getMockCustomerTasksResponse(): CustomerTasksResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Core tasks will load after login and backend data are available.',
      title: 'No demo Core tasks',
    },
    tasks: [],
  };
}

export function getMockCustomerProRequestsResponse(): CustomerProRequestsResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Pro requests will load after login and backend data are available.',
      title: 'No demo Pro requests',
    },
    proRequests: [],
  };
}

export function getMockProviderDashboardSummary(): ProviderDashboardSummary {
  const session = mockAuth.currentSession;

  return {
    activeCoreTasksCount: 0,
    availableCoreTasksCount: 0,
    coreTaskerStatus: session.providerCapabilities.coreTaskerStatus,
    displayName: session.displayName,
    matchingProRequestsCount: 0,
    pendingCompletionCount: 0,
    proStatus: session.providerCapabilities.proStatus,
    reservedCoreTasksCount: 0,
    submittedProResponsesCount: 0,
    unreadMessagesCount: 0,
  };
}

export function getMockProviderDashboardResponse(): ProviderDashboardResponse {
  const summary = getMockProviderDashboardSummary();

  return {
    cards: [
      {
        accent: 'core',
        description: 'Demo Core task status card.',
        href: '/provider/core-tasks',
        id: 'demo-core',
        kind: 'core',
        statusLabel: 'Demo Core',
        title: 'Core Tasks',
      },
      {
        accent: 'pro',
        description: 'Demo Pro request status card.',
        href: '/provider/pro-requests',
        id: 'demo-pro',
        kind: 'pro',
        statusLabel: 'Demo Pro',
        title: 'Pro Requests',
      },
    ],
    nextActions: [
      {
        accent: 'pro',
        href: '/provider/start',
        label: 'Review provider setup',
        type: 'review_provider_setup',
      },
    ],
    summary,
  };
}

export function getMockProviderCoreTasksResponse(): ProviderCoreTasksResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Core task previews load after login and backend data are available.',
      title: 'No demo Core tasks',
    },
    tasks: [],
  };
}

export function getMockProviderProRequestsResponse(): ProviderProRequestsResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Pro request previews load after login and backend data are available.',
      title: 'No demo Pro requests',
    },
    proRequests: [],
  };
}

export function getMockProviderProfileResponse(): ProviderProfileResponse {
  const session = mockAuth.currentSession;

  return {
    nextActions: [
      {
        accent: 'pro',
        href: '/provider/start',
        label: 'Review provider setup',
        type: 'review_provider_setup',
      },
    ],
    profile: {
      coreCategories: [],
      coreCities: [],
      coreTaskerStatus: session.providerCapabilities.coreTaskerStatus,
      displayName: session.displayName,
      portfolioProjectsCount: 0,
      proCategories: [],
      proCities: [],
      proStatus: session.providerCapabilities.proStatus,
      profileStrengthLabel: 'Demo provider profile',
      stripeStatusLabel: 'Demo Core payout status',
    },
  };
}

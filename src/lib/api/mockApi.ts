import { mockAuth } from '@/src/lib/auth/mockAuth';

import {
  CatalogCategoriesResponse,
  CitiesCatalogResponse,
  CustomerHomeResponse,
  CustomerProRequestDetailResponse,
  CustomerHomeSummary,
  CustomerProRequestsResponse,
  CustomerTaskDetailResponse,
  CustomerTasksResponse,
  PostingRulesResponse,
  ProviderCoreTasksResponse,
  ProviderCoreTaskDetailResponse,
  ProviderDashboardResponse,
  ProviderDashboardSummary,
  ProviderProfileResponse,
  ProviderProRequestDetailResponse,
  ProviderProRequestsResponse,
  MessageThreadDetailResponse,
  MessageThreadsResponse,
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

export function getMockCitiesCatalogResponse(): CitiesCatalogResponse {
  return {
    cities: [
      { id: 'demo-sofia', isActive: true, nameBg: 'Sofia', nameEn: 'Sofia', slug: 'sofia' },
      { id: 'demo-plovdiv', isActive: true, nameBg: 'Plovdiv', nameEn: 'Plovdiv', slug: 'plovdiv' },
      { id: 'demo-varna', isActive: true, nameBg: 'Varna', nameEn: 'Varna', slug: 'varna' },
    ],
  };
}

export function getMockCoreCategoriesResponse(): CatalogCategoriesResponse {
  return {
    categories: [
      {
        descriptionBg: null,
        descriptionEn: 'Small fixed-scope assembly jobs.',
        id: 'furniture_assembly',
        isActive: true,
        nameBg: 'Furniture Assembly',
        nameEn: 'Furniture Assembly',
        slug: 'furniture_assembly',
      },
      {
        descriptionBg: null,
        descriptionEn: 'Mounting shelves, mirrors, rods, frames, and similar items.',
        id: 'general_mounting',
        isActive: true,
        nameBg: 'General Mounting',
        nameEn: 'General Mounting',
        slug: 'general_mounting',
      },
      {
        descriptionBg: null,
        descriptionEn: 'Replacement-only work at existing electrical points.',
        id: 'light_electrical',
        isActive: true,
        nameBg: 'Light Electrical',
        nameEn: 'Light Electrical',
        slug: 'light_electrical',
      },
    ],
  };
}

export function getMockProCategoriesResponse(): CatalogCategoriesResponse {
  return {
    categories: [
      {
        descriptionBg: 'Demo Pro category',
        descriptionEn: 'Larger renovation projects with professional quotes.',
        id: 'bathroom_renovation',
        isActive: true,
        nameBg: 'Bathroom Renovation',
        nameEn: 'Bathroom Renovation',
        requiresPortfolio: true,
        slug: 'bathroom_renovation',
      },
      {
        descriptionBg: 'Demo Pro category',
        descriptionEn: 'Kitchen renovation, fitting, custom work, and appliance integration.',
        id: 'kitchen_projects',
        isActive: true,
        nameBg: 'Kitchen Projects',
        nameEn: 'Kitchen Projects',
        requiresPortfolio: true,
        slug: 'kitchen_projects',
      },
    ],
  };
}

export function getMockPostingRulesResponse(): PostingRulesResponse {
  return {
    coreTask: {
      acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
      maxDescriptionLength: 2000,
      maxImages: 10,
      minDescriptionLength: 20,
      paymentProtectionCopy: 'Payment is protected through Taskly/Stripe when the task is confirmed.',
      requiresAddress: true,
      requiresCity: true,
      requiresSchedule: true,
    },
    proRequest: {
      acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
      maxDescriptionLength: 3000,
      maxImages: 10,
      minDescriptionLength: 30,
      postingIsFreeCopy:
        'Posting a Pro request is free. You only unlock comparison details after meaningful Pro responses exist.',
      requiresCity: true,
      requiresDistrictOrArea: true,
    },
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

export function getMockCustomerTaskDetailResponse(taskId = 'demo-task'): CustomerTaskDetailResponse {
  return {
    task: {
      addressPreviewLabel: 'Demo address preview',
      categoryLabel: 'Furniture Assembly',
      cityLabel: 'Sofia',
      description: 'Demo read-only Core task detail. Actions stay disabled until a later mutation phase.',
      id: taskId,
      images: [],
      nextActions: [{ accent: 'core', href: '/customer/tasks', label: 'Review task status', type: 'demo_review_task' }],
      paymentStatusLabel: 'Payment protected',
      priceLabel: 'EUR 40',
      scheduledEndAt: null,
      scheduledStartAt: null,
      status: 'OPEN',
      statusLabel: 'Open',
      taskerPreview: null,
      timeline: [
        { description: 'Demo task posted.', id: 'posted', label: 'Posted', status: 'done' },
        { description: 'Payment state is shown by backend data.', id: 'payment', label: 'Payment protected', status: 'current' },
      ],
      title: 'Demo Core task',
    },
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

export function getMockCustomerProRequestDetailResponse(proRequestId = 'demo-pro-request'): CustomerProRequestDetailResponse {
  return {
    proRequest: {
      budgetLabel: 'Budget not set',
      categoryLabel: 'Renovation',
      cityLabel: 'Sofia',
      createdAt: new Date().toISOString(),
      description: 'Demo read-only Pro request detail. Unlock and contact actions stay backend-owned.',
      id: proRequestId,
      images: [],
      isUnlocked: false,
      nextActions: [{ accent: 'pro', href: '/customer/pro-requests', label: 'Unlock and compare Pros', type: 'demo_unlock' }],
      responsePreviews: [
        {
          headline: 'Pro response available',
          id: 'demo-response',
          isLocked: true,
          proDisplayName: 'Taskly Pro',
          roughQuoteLabel: 'Locked until comparison is available',
          statusLabel: 'Submitted',
        },
      ],
      responsesCount: 1,
      status: 'RESPONSES_RECEIVED',
      statusLabel: 'Responses received',
      timelineLabel: 'Flexible',
      title: 'Demo Pro request',
      unlockStatusLabel: 'Pro responses available to unlock',
    },
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

export function getMockProviderCoreTaskDetailResponse(taskId = 'demo-provider-task'): ProviderCoreTaskDetailResponse {
  return {
    task: {
      addressPreviewLabel: 'Address shared after selection',
      categoryLabel: 'Furniture Assembly',
      cityLabel: 'Sofia',
      customerPreviewLabel: 'Customer preview',
      description: 'Demo provider Core task detail. Accept/start/completion actions are not connected yet.',
      id: taskId,
      images: [],
      nextActions: {
        canCancelOrReportIssue: false,
        canChat: false,
        canExpressInterest: true,
        canMarkOnTheWay: false,
        canRequestCompletion: false,
        canStart: false,
        primary: { label: 'Express interest', method: 'POST', type: 'express_interest' },
      },
      paymentStatusLabel: 'Not paid yet',
      priceLabel: 'EUR 40',
      scheduledEndAt: null,
      scheduledStartAt: null,
      status: 'OPEN',
      statusLabel: 'Available',
      timeline: [
        { description: 'Visible according to demo matching.', id: 'visible', label: 'Visible to you', status: 'done' },
        { description: 'Provider actions come later.', id: 'next', label: 'Next step', status: 'current' },
      ],
      title: 'Demo provider Core task',
    },
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

export function getMockProviderProRequestDetailResponse(proRequestId = 'demo-provider-pro'): ProviderProRequestDetailResponse {
  return {
    proRequest: {
      budgetLabel: 'Budget not set',
      categoryLabel: 'Renovation',
      cityLabel: 'Sofia',
      createdAt: new Date().toISOString(),
      description: 'Demo provider Pro request detail. Respond/edit actions are not connected yet.',
      eligibility: { isEligibleToRespond: true, reasonLabel: 'Eligible to respond later' },
      id: proRequestId,
      images: [],
      myResponse: null,
      nextActions: [{ accent: 'pro', href: '/provider/pro-requests', label: 'Review Pro request', type: 'demo_review_pro' }],
      status: 'OPEN',
      statusLabel: 'Open',
      timelineLabel: 'Flexible',
      title: 'Demo provider Pro request',
    },
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

export function getMockMessageThreadsResponse(): MessageThreadsResponse {
  const now = new Date().toISOString();

  return {
    threads: [
      {
        accent: 'core',
        capabilities: {
          canRead: true,
          canSendAttachments: false,
          canSendText: true,
        },
        contextId: 'demo-task',
        contextType: 'CORE_TASK',
        id: 'booking:demo-core-thread',
        lastMessageAt: now,
        lastMessagePreview: 'Demo read-only Core task conversation.',
        otherParticipantName: 'Taskly demo user',
        roleLabel: 'Participant',
        statusLabel: 'Core task',
        subtitle: 'Taskly demo user',
        title: 'Demo Core task conversation',
        unreadCount: 0,
      },
      {
        accent: 'neutral',
        capabilities: {
          canRead: true,
          canSendAttachments: false,
          canSendText: false,
          readOnlyReason: 'SUPPORT_READ_ONLY',
        },
        contextType: 'SUPPORT',
        id: 'admin:demo-support-thread',
        lastMessageAt: now,
        lastMessagePreview: 'Official Taskly messages will appear here.',
        otherParticipantName: 'Taskly',
        roleLabel: 'Support',
        statusLabel: 'Support',
        subtitle: 'Taskly',
        title: 'Message from Taskly',
        unreadCount: 0,
      },
    ],
  };
}

export function getMockMessageThreadResponse(threadId = 'booking:demo-core-thread'): MessageThreadDetailResponse {
  const isSupport = threadId.startsWith('admin:');

  return {
    messages: [
      {
        attachments: [],
        body: isSupport
          ? 'This is a demo official Taskly message. Sending will be connected later.'
          : 'This is a demo read-only conversation. Sending will be connected later.',
        createdAt: new Date().toISOString(),
        id: `${threadId}:message-1`,
        isMine: false,
        senderId: 'demo-other',
        senderName: isSupport ? 'Taskly' : 'Taskly demo user',
        senderRole: isSupport ? 'SUPPORT' : 'TASKER',
      },
    ],
    thread: {
      accent: isSupport ? 'neutral' : 'core',
      capabilities: {
        canRead: true,
        canSendAttachments: false,
        canSendText: !isSupport,
        readOnlyReason: isSupport ? 'SUPPORT_READ_ONLY' : undefined,
      },
      contextId: isSupport ? undefined : 'demo-task',
      contextType: isSupport ? 'SUPPORT' : 'CORE_TASK',
      id: threadId,
      subtitle: isSupport ? 'Taskly' : 'Taskly demo user',
      title: isSupport ? 'Message from Taskly' : 'Demo Core task conversation',
    },
  };
}

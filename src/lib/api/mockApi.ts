import { mockAuth } from '@/src/lib/auth/mockAuth';

import {
  CatalogCategoriesResponse,
  CitiesCatalogResponse,
  CustomerHomeResponse,
  CustomerProRequestDetailResponse,
  CustomerHomeSummary,
  CustomerProRequestsResponse,
  CustomerCoreTaskNextActions,
  CustomerCorePaymentState,
  CustomerTaskDetailResponse,
  CustomerTasksResponse,
  PostingRulesResponse,
  ProviderCoreTasksResponse,
  ProviderCoreTaskNextActions,
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

function createMockCustomerTaskNextActions(
  overrides: Partial<CustomerCoreTaskNextActions> = {},
): CustomerCoreTaskNextActions {
  return {
    canApproveCompletion: false,
    canCancel: false,
    canChat: false,
    canConfirmPayment: false,
    canPreparePayment: false,
    canRejectCompletion: false,
    canRequestHelp: false,
    canRetryPayment: false,
    canReview: false,
    canSelectTasker: false,
    canViewInvoice: false,
    paymentProtected: false,
    paymentRequired: false,
    primaryAction: 'none',
    ...overrides,
  };
}

function createMockCustomerPaymentState(
  overrides: Partial<CustomerCorePaymentState> = {},
): CustomerCorePaymentState {
  return {
    bookingStatus: null,
    canShowPaymentProtectedBadge: false,
    helperText: 'Payment will be protected through Taskly before the task starts.',
    paymentProtected: false,
    paymentRequired: false,
    paymentStatus: null,
    reservationState: null,
    status: 'tasker_selection_needed',
    statusLabel: 'Tasker selection needed',
    warningCode: null,
    ...overrides,
  };
}

export function getMockCustomerTasksResponse(): CustomerTasksResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Core tasks will load after login and backend data are available.',
      title: 'No demo Core tasks',
    },
    tasks: [
      {
        categoryLabel: 'Furniture Assembly',
        cityLabel: 'Sofia',
        id: 'demo-customer-selecting',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'View task status', type: 'view_task_status' },
        nextActions: createMockCustomerTaskNextActions({ canSelectTasker: true, primaryAction: 'select_tasker' }),
        paymentState: createMockCustomerPaymentState({
          helperText: 'Choose a Tasker before payment is prepared.',
          status: 'tasker_selection_needed',
          statusLabel: 'Tasker selection needed',
        }),
        paymentStatusLabel: 'Not paid yet',
        priceLabel: 'EUR 40',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'OPEN',
        statusLabel: 'Customer choosing Tasker',
        title: 'Demo task waiting for Tasker choice',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'Furniture Assembly',
        cityLabel: 'Sofia',
        id: 'demo-customer-payment-method',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'Review payment status', type: 'review_payment_status' },
        nextActions: createMockCustomerTaskNextActions({
          canPreparePayment: true,
          paymentRequired: true,
          primaryAction: 'prepare_payment',
        }),
        paymentState: createMockCustomerPaymentState({
          bookingStatus: 'RESERVED',
          helperText: 'Enter card details in task detail.',
          paymentRequired: true,
          reservationState: 'RESERVED',
          status: 'payment_method_required',
          statusLabel: 'Payment method required',
        }),
        paymentStatusLabel: 'Payment pending',
        priceLabel: 'EUR 40',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'RESERVED',
        statusLabel: 'Reserved/upcoming',
        title: 'Demo payment method required',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'Furniture Assembly',
        cityLabel: 'Sofia',
        id: 'demo-customer-upcoming',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'Open chat', type: 'chat' },
        nextActions: createMockCustomerTaskNextActions({
          canChat: true,
          paymentProtected: true,
          paymentRequired: true,
          primaryAction: 'chat',
        }),
        paymentState: createMockCustomerPaymentState({
          bookingStatus: 'ACTIVE',
          canShowPaymentProtectedBadge: true,
          helperText: 'Payment protected until you approve completion.',
          paymentProtected: true,
          paymentRequired: true,
          paymentStatus: 'HELD',
          reservationState: 'NONE',
          status: 'held',
          statusLabel: 'Payment held',
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 40',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'RESERVED',
        statusLabel: 'Reserved/upcoming',
        title: 'Demo upcoming Core task',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        id: 'demo-customer-in-progress',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'Open chat', type: 'chat' },
        nextActions: createMockCustomerTaskNextActions({
          blockedReason: 'Waiting for the Tasker to request completion.',
          blockedReasonCode: 'WAITING_FOR_PROVIDER',
          canChat: true,
          paymentProtected: true,
          paymentRequired: true,
          primaryAction: 'chat',
        }),
        paymentState: createMockCustomerPaymentState({
          bookingStatus: 'ACTIVE',
          canShowPaymentProtectedBadge: true,
          helperText: 'Payment protected until you approve completion.',
          paymentProtected: true,
          paymentRequired: true,
          paymentStatus: 'HELD',
          reservationState: 'NONE',
          status: 'held',
          statusLabel: 'Payment held',
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'IN_PROGRESS',
        statusLabel: 'In progress',
        title: 'Demo in-progress Core task',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        id: 'demo-customer-pending-completion',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'Review completion', type: 'review_completion' },
        nextActions: createMockCustomerTaskNextActions({
          canApproveCompletion: true,
          canChat: true,
          canRejectCompletion: true,
          paymentProtected: true,
          paymentRequired: true,
          primaryAction: 'approve_completion',
        }),
        paymentState: createMockCustomerPaymentState({
          bookingStatus: 'ACTIVE',
          canShowPaymentProtectedBadge: true,
          helperText: 'Payment protected until you approve completion.',
          paymentProtected: true,
          paymentRequired: true,
          paymentStatus: 'HELD',
          reservationState: 'NONE',
          status: 'held',
          statusLabel: 'Payment held',
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'PENDING_COMPLETION',
        statusLabel: 'Waiting for customer approval',
        title: 'Demo completion review',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'Light Electrical',
        cityLabel: 'Sofia',
        id: 'demo-customer-completed',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'Review task', type: 'review' },
        nextActions: createMockCustomerTaskNextActions({
          blockedReason: 'This task is already completed.',
          blockedReasonCode: 'ALREADY_COMPLETED',
          canReview: true,
          canViewInvoice: true,
          primaryAction: 'review',
        }),
        paymentState: createMockCustomerPaymentState({
          bookingStatus: 'COMPLETED',
          helperText: "Payment was released through Taskly's protected payment flow.",
          paymentStatus: 'RELEASED',
          reservationState: 'RELEASED',
          status: 'released',
          statusLabel: 'Payment released',
        }),
        paymentStatusLabel: 'Payment released',
        priceLabel: 'EUR 35',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'COMPLETED',
        statusLabel: 'Completed',
        title: 'Demo completed Core task',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'Minor Plumbing Fix',
        cityLabel: 'Sofia',
        id: 'demo-customer-payment-failed',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'Review payment status', type: 'review_payment_status' },
        nextActions: createMockCustomerTaskNextActions({
          canRetryPayment: true,
          paymentRequired: true,
          primaryAction: 'retry_payment',
        }),
        paymentState: createMockCustomerPaymentState({
          bookingStatus: 'RESERVED',
          helperText: 'Payment needs attention. Open task detail to retry payment setup.',
          paymentRequired: true,
          paymentStatus: 'FAILED',
          reservationState: 'RESERVED',
          status: 'failed',
          statusLabel: 'Payment failed',
          warningCode: 'PAYMENT_FAILED',
        }),
        paymentStatusLabel: 'Payment failed',
        priceLabel: 'EUR 45',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'RESERVED',
        statusLabel: 'Reserved/upcoming',
        title: 'Demo payment needs attention',
        unreadMessagesCount: 0,
      },
    ],
  };
}

export function getMockCustomerTaskDetailResponse(taskId = 'demo-task'): CustomerTaskDetailResponse {
  const isInProgress = taskId.includes('in-progress');
  const isUpcoming = taskId.includes('upcoming');
  const isCompleted = taskId.includes('completed');
  const isPaymentFailed = taskId.includes('payment-failed');
  const isPaymentMethodRequired = taskId.includes('payment-method');
  const isSelecting = taskId.includes('selecting');
  const status = isCompleted
    ? 'COMPLETED'
    : isPaymentFailed || isPaymentMethodRequired
      ? 'RESERVED'
    : isInProgress
      ? 'IN_PROGRESS'
      : isUpcoming
        ? 'RESERVED'
        : isSelecting
          ? 'OPEN'
          : 'PENDING_COMPLETION';
  const nextActions = isCompleted
    ? createMockCustomerTaskNextActions({
        blockedReason: 'This task is already completed.',
        blockedReasonCode: 'ALREADY_COMPLETED',
        canReview: true,
        canViewInvoice: true,
        primaryAction: 'review',
      })
    : isInProgress
      ? createMockCustomerTaskNextActions({
          blockedReason: 'Waiting for the Tasker to request completion.',
          blockedReasonCode: 'WAITING_FOR_PROVIDER',
          canChat: true,
          paymentProtected: true,
          paymentRequired: true,
          primaryAction: 'chat',
        })
      : isPaymentFailed
        ? createMockCustomerTaskNextActions({
            canRetryPayment: true,
            paymentRequired: true,
            primaryAction: 'retry_payment',
          })
        : isPaymentMethodRequired
          ? createMockCustomerTaskNextActions({
              canPreparePayment: true,
              paymentRequired: true,
              primaryAction: 'prepare_payment',
            })
      : isUpcoming
        ? createMockCustomerTaskNextActions({
            canChat: true,
            paymentProtected: true,
            paymentRequired: true,
            primaryAction: 'chat',
          })
        : isSelecting
          ? createMockCustomerTaskNextActions({ canSelectTasker: true, primaryAction: 'select_tasker' })
          : createMockCustomerTaskNextActions({
              canApproveCompletion: true,
              canCancel: false,
              canChat: true,
              canPreparePayment: false,
              canRejectCompletion: true,
              paymentProtected: true,
              paymentRequired: true,
              primaryAction: 'approve_completion',
            });
  const statusLabel = isCompleted
    ? 'Completed'
    : isPaymentFailed || isPaymentMethodRequired
      ? 'Reserved/upcoming'
    : isInProgress
      ? 'In progress'
      : isUpcoming
        ? 'Reserved/upcoming'
        : isSelecting
          ? 'Customer choosing Tasker'
          : 'Waiting for customer approval';
  const paymentState = isCompleted
    ? createMockCustomerPaymentState({
        bookingStatus: 'COMPLETED',
        helperText: "Payment was released through Taskly's protected payment flow.",
        paymentStatus: 'RELEASED',
        reservationState: 'RELEASED',
        status: 'released',
        statusLabel: 'Payment released',
      })
    : isPaymentFailed
      ? createMockCustomerPaymentState({
          bookingStatus: 'RESERVED',
          helperText: 'Payment needs attention. Open task detail to retry payment setup.',
          paymentRequired: true,
          paymentStatus: 'FAILED',
          reservationState: 'RESERVED',
          status: 'failed',
          statusLabel: 'Payment failed',
          warningCode: 'PAYMENT_FAILED',
        })
      : isPaymentMethodRequired
        ? createMockCustomerPaymentState({
            bookingStatus: 'RESERVED',
            helperText: 'Enter card details in task detail.',
            paymentRequired: true,
            reservationState: 'RESERVED',
            status: 'payment_method_required',
            statusLabel: 'Payment method required',
          })
        : isSelecting
          ? createMockCustomerPaymentState({
              helperText: 'Choose a Tasker before payment is prepared.',
              status: 'tasker_selection_needed',
              statusLabel: 'Tasker selection needed',
            })
          : createMockCustomerPaymentState({
              bookingStatus: 'ACTIVE',
              canShowPaymentProtectedBadge: true,
              helperText: 'Payment protected until you approve completion.',
              paymentProtected: true,
              paymentRequired: true,
              paymentStatus: 'HELD',
              reservationState: 'NONE',
              status: 'held',
              statusLabel: 'Payment held',
            });

  return {
    task: {
      addressPreviewLabel: 'Demo address preview',
      categoryLabel: 'Furniture Assembly',
      cityLabel: 'Sofia',
      description: 'Demo Core task detail with backend-style next action wording.',
      displayActions: [{ accent: 'core', href: '/customer/tasks', label: 'Review completion', type: 'review_completion' }],
      id: taskId,
      images: [],
      interestedTaskers: isSelecting
        ? [
            {
              bioPreview: 'Careful Core Tasker with demo availability for fixed-scope work.',
              completedTasksLabel: '12 completed tasks',
              displayName: 'Demo Tasker',
              id: 'demo-interest-1',
              interestId: 'demo-interest-1',
              profileImageUrl: null,
              ratingLabel: '5.0 rating',
              statusLabel: 'Verified',
              taskerId: 'demo-tasker-1',
              toolsConfirmed: true,
            },
            {
              bioPreview: 'Available for the selected city and category.',
              completedTasksLabel: '4 completed tasks',
              displayName: 'Taskly Helper',
              id: 'demo-interest-2',
              interestId: 'demo-interest-2',
              profileImageUrl: null,
              ratingLabel: '4.8 rating',
              statusLabel: 'Verified',
              taskerId: 'demo-tasker-2',
              toolsConfirmed: false,
            },
          ]
        : [],
      nextActions,
      paymentState,
      paymentStatusLabel: paymentState.statusLabel,
      priceLabel: 'EUR 40',
      scheduledEndAt: null,
      scheduledStartAt: null,
      status,
      statusLabel,
      taskerPreview: isSelecting
        ? null
        : {
            displayName: 'Demo Tasker',
            ratingLabel: '5.0 rating',
            statusLabel: 'Verified',
          },
      timeline: [
        { description: 'Demo task posted.', id: 'posted', label: 'Posted', status: 'done' },
        { description: 'Payment state is shown by backend data.', id: 'payment', label: 'Payment protected', status: 'done' },
        {
          description: isCompleted
            ? 'Completion was approved through the protected payment flow.'
            : isInProgress
              ? 'Work is in progress. The Tasker can request completion when ready.'
              : isUpcoming
                ? 'The task is reserved for the selected Tasker.'
                : isSelecting
                  ? 'The customer chooses a Tasker after interest is sent.'
                  : 'Tasker requested completion. The customer can approve or ask for changes.',
          id: 'completion',
          label: 'Completion review',
          status: isCompleted ? 'done' : 'current',
        },
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

function createMockProviderCoreTaskNextActions(
  overrides: Partial<ProviderCoreTaskNextActions> = {},
): ProviderCoreTaskNextActions {
  return {
    canCancelOrReportIssue: false,
    canChat: false,
    canExpressInterest: false,
    canMarkOnTheWay: false,
    canRequestCompletion: false,
    canStart: false,
    ...overrides,
  };
}

export function getMockProviderCoreTasksResponse(): ProviderCoreTasksResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Core task previews load after login and backend data are available.',
      title: 'No demo Core tasks',
    },
    tasks: [
      {
        categoryLabel: 'Furniture Assembly',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        id: 'demo-provider-available',
        nextAction: { accent: 'core', href: '/provider/core-tasks', label: 'Express interest', type: 'express_interest' },
        nextActions: createMockProviderCoreTaskNextActions({
          canExpressInterest: true,
          primary: { label: 'Express interest', method: 'POST', type: 'express_interest' },
        }),
        paymentStatusLabel: 'Not paid yet',
        priceLabel: 'EUR 40',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'OPEN',
        statusLabel: 'Available',
        title: 'Demo available Core task',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'Furniture Assembly',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        id: 'demo-provider-interested',
        nextAction: { accent: 'core', href: '/provider/core-tasks', label: 'Interest sent', type: 'interest_sent' },
        nextActions: createMockProviderCoreTaskNextActions({
          blockedReason: 'You already expressed interest.',
          blockedReasonCode: 'ALREADY_INTERESTED',
          primary: { label: 'Interest sent', type: 'interest_sent' },
        }),
        paymentStatusLabel: 'Not paid yet',
        priceLabel: 'EUR 40',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'OPEN',
        statusLabel: 'Interest sent',
        title: 'Demo interest sent',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        id: 'demo-provider-upcoming',
        nextAction: { accent: 'core', href: '/provider/core-tasks', label: 'Mark on the way', type: 'mark_on_the_way' },
        nextActions: createMockProviderCoreTaskNextActions({
          canChat: true,
          canMarkOnTheWay: true,
          primary: { label: 'Mark on the way', method: 'POST', type: 'mark_on_the_way' },
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'RESERVED',
        statusLabel: 'Reserved/upcoming',
        title: 'Demo reserved Core task',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        id: 'demo-provider-in-progress',
        nextAction: { accent: 'core', href: '/provider/core-tasks', label: 'Request completion', type: 'request_completion' },
        nextActions: createMockProviderCoreTaskNextActions({
          canChat: true,
          canRequestCompletion: true,
          primary: { label: 'Request completion', method: 'POST', type: 'request_completion' },
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'IN_PROGRESS',
        statusLabel: 'In progress',
        title: 'Demo in-progress Core task',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        id: 'demo-provider-pending-completion',
        nextAction: { accent: 'core', href: '/provider/core-tasks', label: 'Await customer approval', type: 'await_customer_approval' },
        nextActions: createMockProviderCoreTaskNextActions({
          blockedReason: 'Task is already waiting for approval.',
          blockedReasonCode: 'TASK_PENDING_COMPLETION',
          canChat: true,
          primary: { label: 'Await customer approval', type: 'await_customer_approval' },
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'PENDING_COMPLETION',
        statusLabel: 'Waiting for customer approval',
        title: 'Demo awaiting customer approval',
        unreadMessagesCount: 0,
      },
      {
        categoryLabel: 'Light Electrical',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        id: 'demo-provider-completed',
        nextAction: { accent: 'neutral', href: '/provider/core-tasks', label: 'View task', type: 'view_task' },
        nextActions: createMockProviderCoreTaskNextActions({
          blockedReason: 'Task is already completed.',
          blockedReasonCode: 'TASK_COMPLETED',
          primary: { label: 'View task', type: 'view_task' },
        }),
        paymentStatusLabel: 'Payment released',
        priceLabel: 'EUR 35',
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'COMPLETED',
        statusLabel: 'Completed',
        title: 'Demo completed Core task',
        unreadMessagesCount: 0,
      },
    ],
  };
}

export function getMockProviderCoreTaskDetailResponse(taskId = 'demo-provider-task'): ProviderCoreTaskDetailResponse {
  const isInterested = taskId.includes('interested');
  const isUpcoming = taskId.includes('upcoming');
  const isInProgress = taskId.includes('in-progress');
  const isPendingCompletion = taskId.includes('pending-completion');
  const isCompleted = taskId.includes('completed');
  const status = isCompleted
    ? 'COMPLETED'
    : isPendingCompletion
      ? 'PENDING_COMPLETION'
      : isInProgress
        ? 'IN_PROGRESS'
        : isUpcoming
          ? 'RESERVED'
          : 'OPEN';
  const nextActions = isCompleted
    ? createMockProviderCoreTaskNextActions({
        blockedReason: 'Task is already completed.',
        blockedReasonCode: 'TASK_COMPLETED',
        primary: { label: 'View task', type: 'view_task' },
      })
    : isPendingCompletion
      ? createMockProviderCoreTaskNextActions({
          blockedReason: 'Task is already waiting for approval.',
          blockedReasonCode: 'TASK_PENDING_COMPLETION',
          canChat: true,
          primary: { label: 'Await customer approval', type: 'await_customer_approval' },
        })
      : isInProgress
        ? createMockProviderCoreTaskNextActions({
            canChat: true,
            canRequestCompletion: true,
            primary: { label: 'Request completion', method: 'POST', type: 'request_completion' },
          })
        : isUpcoming
          ? createMockProviderCoreTaskNextActions({
              canChat: true,
              canMarkOnTheWay: true,
              primary: { label: 'Mark on the way', method: 'POST', type: 'mark_on_the_way' },
            })
          : isInterested
            ? createMockProviderCoreTaskNextActions({
                blockedReason: 'You already expressed interest.',
                blockedReasonCode: 'ALREADY_INTERESTED',
                primary: { label: 'Interest sent', type: 'interest_sent' },
              })
            : createMockProviderCoreTaskNextActions({
                canExpressInterest: true,
                primary: { label: 'Express interest', method: 'POST', type: 'express_interest' },
              });

  return {
    task: {
      addressPreviewLabel: isUpcoming || isInProgress || isPendingCompletion || isCompleted
        ? 'Demo address preview'
        : 'Address shared after selection',
      categoryLabel: 'Furniture Assembly',
      cityLabel: 'Sofia',
      customerPreviewLabel: 'Customer preview',
      description: 'Demo provider Core task detail. Actions follow backend-authored nextActions.',
      id: taskId,
      images: [],
      nextActions,
      paymentStatusLabel: isUpcoming || isInProgress || isPendingCompletion ? 'Payment protected' : isCompleted ? 'Payment released' : 'Not paid yet',
      priceLabel: 'EUR 40',
      scheduledEndAt: null,
      scheduledStartAt: null,
      status,
      statusLabel: isCompleted
        ? 'Completed'
        : isPendingCompletion
          ? 'Waiting for customer approval'
          : isInProgress
            ? 'In progress'
            : isUpcoming
              ? 'Reserved/upcoming'
              : isInterested
                ? 'Interest sent'
                : 'Available',
      timeline: [
        { description: 'Visible according to demo matching.', id: 'visible', label: 'Visible to you', status: 'done' },
        {
          description: isCompleted
            ? 'The customer approved completion.'
            : isPendingCompletion
              ? 'Waiting for customer approval.'
              : isInProgress
                ? 'Work has begun. You can request completion when ready.'
                : isUpcoming
                  ? 'Notify the customer when you are on the way.'
                  : isInterested
                    ? 'The customer will choose a Tasker later.'
                    : 'Express interest. This does not reserve the task.',
          id: 'next',
          label: 'Next step',
          status: isCompleted ? 'done' : 'current',
        },
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
          ? 'This is a demo official Taskly message.'
          : 'This is a demo Core task conversation.',
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

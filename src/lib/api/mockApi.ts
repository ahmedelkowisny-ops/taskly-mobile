import { mockAuth } from '@/src/lib/auth/mockAuth';

import {
  CatalogCategoriesResponse,
  CitiesCatalogResponse,
  CustomerHomeResponse,
  CustomerProRequestDetailResponse,
  CustomerProAccessSupportRequestPayload,
  CustomerHomeSummary,
  CustomerProRequestsResponse,
  CustomerCoreTaskNextActions,
  CustomerCorePaymentState,
  CustomerTaskDetailResponse,
  CustomerTasksResponse,
  CoreCancellationState,
  CoreDisputeState,
  CoreRefundState,
  CoreSupportState,
  PostingRulesResponse,
  ProviderCoreTasksResponse,
  ProviderCoreIssueState,
  ProviderCoreTaskNextActions,
  ProviderCoreTaskDetailResponse,
  ProviderDashboardResponse,
  ProviderDashboardSummary,
  ProviderProfileResponse,
  ProviderProResponsePayload,
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
        'Posting a Taskly Pro project is free. You only unlock comparison details after meaningful Pro responses exist.',
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
        description: 'Demo Taskly task placeholder',
        href: '/customer/tasks',
        id: 'demo-core-empty',
        kind: 'task',
        statusLabel: 'Demo',
        title: 'Taskly tasks will appear here',
      },
      {
        accent: 'pro',
        description: 'Demo Taskly Pro project placeholder',
        href: '/customer/pro-requests',
        id: 'demo-pro-empty',
        kind: 'proRequest',
        statusLabel: 'Demo',
        title: 'Taskly Pro projects will appear here',
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
        label: 'Post a Taskly Pro project',
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

function createMockCancellationState(
  overrides: Partial<CoreCancellationState> = {},
): CoreCancellationState {
  return {
    blockedReason: 'Cancellation is not available for this task state.',
    blockedReasonCode: 'CANCELLATION_NOT_AVAILABLE',
    estimatedPolicyOutcomeLabel: null,
    feeLabel: null,
    freeCancellationUntil: null,
    helperText: 'Cancellation status is provided by Taskly.',
    policySummary: 'Free cancellation is available until 24 hours before the scheduled start. Taskly decides late-cancellation outcomes.',
    refundLabel: null,
    requiresReason: false,
    status: 'not_available',
    statusLabel: 'Cancellation not available',
    supportReviewLabel: null,
    ...overrides,
  };
}

function createMockSupportState(
  overrides: Partial<CoreSupportState> = {},
): CoreSupportState {
  return {
    blockedReason: 'Support is not needed for this task state.',
    blockedReasonCode: 'SUPPORT_NOT_AVAILABLE',
    helperText: 'Support status appears here when Taskly review is needed.',
    latestRequestCreatedAt: null,
    latestRequestId: null,
    latestRequestType: null,
    status: 'none',
    statusLabel: 'No support request',
    supportReviewLabel: null,
    ...overrides,
  };
}

function createMockRefundState(
  overrides: Partial<CoreRefundState> = {},
): CoreRefundState {
  return {
    helperText: 'Refund status is provided by Taskly payment handling.',
    outcomeLabel: null,
    status: 'not_requested',
    statusLabel: 'No refund request',
    ...overrides,
  };
}

function createMockDisputeState(
  overrides: Partial<CoreDisputeState> = {},
): CoreDisputeState {
  return {
    helperText: 'No support review is open for this task.',
    resolutionLabel: null,
    status: 'none',
    statusLabel: 'No support review',
    supportReviewLabel: null,
    ...overrides,
  };
}

export function getMockCustomerTasksResponse(): CustomerTasksResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Taskly tasks load after sign-in.',
      title: 'No demo Taskly tasks',
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
        statusLabel: 'Scheduled/upcoming',
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
        statusLabel: 'Scheduled/upcoming',
        title: 'Demo upcoming Taskly task',
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
          canCancel: true,
          canCancelFree: true,
          canChat: true,
          estimatedPolicyOutcomeLabel: 'Free cancellation is available before the displayed deadline.',
          paymentProtected: true,
          paymentRequired: true,
          primaryAction: 'chat',
        }),
        cancellationPolicySummary: 'Free cancellation is available until 24 hours before the scheduled start.',
        cancellationState: createMockCancellationState({
          blockedReason: null,
          blockedReasonCode: null,
          estimatedPolicyOutcomeLabel: 'Free cancellation is available before the displayed deadline.',
          freeCancellationUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          helperText: 'Taskly allows free cancellation before the deadline.',
          status: 'free_cancellation_available',
          statusLabel: 'Free cancellation available',
        }),
        disputeState: createMockDisputeState(),
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
        refundState: createMockRefundState(),
        scheduledEndAt: null,
        scheduledStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        status: 'IN_PROGRESS',
        statusLabel: 'In progress',
        supportState: createMockSupportState(),
        title: 'Demo in-progress Taskly task',
        unreadMessagesCount: 0,
      },
      {
        cancellationPolicySummary: 'Direct cancellation is blocked while Taskly support is reviewing the task.',
        cancellationState: createMockCancellationState({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          helperText: 'Taskly support is reviewing this task.',
          status: 'support_review',
          statusLabel: 'Under support review',
          supportReviewLabel: 'Taskly support is reviewing this task.',
        }),
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        disputeState: createMockDisputeState({
          helperText: 'Taskly support is reviewing this task.',
          status: 'under_review',
          statusLabel: 'Under support review',
          supportReviewLabel: 'Taskly support is reviewing this task.',
        }),
        id: 'demo-customer-support-review',
        nextAction: { accent: 'core', href: '/customer/tasks', label: 'View task', type: 'view_task' },
        nextActions: createMockCustomerTaskNextActions({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          canOpenSupport: true,
          canRequestHelp: true,
          primaryAction: 'open_support_status',
        }),
        paymentState: createMockCustomerPaymentState({
          helperText: 'Taskly support is reviewing this task.',
          paymentStatus: 'DISPUTED',
          status: 'disputed',
          statusLabel: 'Under support review',
        }),
        paymentStatusLabel: 'Under support review',
        priceLabel: 'EUR 55',
        refundState: createMockRefundState({
          helperText: 'Refund review is handled by Taskly support.',
          status: 'under_review',
          statusLabel: 'Refund review',
        }),
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'DISPUTED',
        statusLabel: 'Support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
        supportState: createMockSupportState({
          helperText: 'Taskly support is reviewing this task.',
          latestRequestCreatedAt: new Date().toISOString(),
          latestRequestId: 'demo-support-1',
          latestRequestType: 'TASK_HELP',
          status: 'under_review',
          statusLabel: 'Under support review',
          supportReviewLabel: 'Taskly support is reviewing this task.',
        }),
        title: 'Demo support review',
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
        title: 'Demo completed Taskly task',
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
        statusLabel: 'Scheduled/upcoming',
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
  const isStarted = taskId.includes('started');
  const isSupportReview = taskId.includes('support-review');
  const status = isCompleted
    ? 'COMPLETED'
    : isSupportReview
      ? 'DISPUTED'
    : isPaymentFailed || isPaymentMethodRequired
      ? 'RESERVED'
    : isInProgress
      ? 'IN_PROGRESS'
      : isStarted
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
    : isSupportReview
      ? createMockCustomerTaskNextActions({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          canOpenSupport: true,
          canRequestHelp: true,
          primaryAction: 'open_support_status',
        })
    : isStarted
      ? createMockCustomerTaskNextActions({
          blockedReason: 'This task has already started. Request help so Taskly support can review next steps.',
          blockedReasonCode: 'TASK_ALREADY_STARTED',
          canChat: true,
          canOpenSupport: true,
          canRequestHelp: true,
          paymentProtected: true,
          paymentRequired: true,
          primaryAction: 'request_help',
        })
    : isInProgress
      ? createMockCustomerTaskNextActions({
          blockedReason: 'Waiting for the Tasker to request completion.',
          blockedReasonCode: 'WAITING_FOR_PROVIDER',
          canCancel: true,
          canCancelFree: true,
          canChat: true,
          estimatedPolicyOutcomeLabel: 'Free cancellation is available before the displayed deadline.',
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
    : isSupportReview
      ? 'Support review'
    : isPaymentFailed || isPaymentMethodRequired
      ? 'Scheduled/upcoming'
    : isInProgress
      ? 'In progress'
      : isStarted
        ? 'In progress'
      : isUpcoming
        ? 'Scheduled/upcoming'
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
    : isSupportReview
      ? createMockCustomerPaymentState({
          helperText: 'Taskly support is reviewing this task.',
          paymentStatus: 'DISPUTED',
          status: 'disputed',
          statusLabel: 'Under support review',
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
  const cancellationState = isSupportReview
    ? createMockCancellationState({
        blockedReason: 'This task is under support review.',
        blockedReasonCode: 'TASK_DISPUTED',
        helperText: 'Taskly support is reviewing this task.',
        status: 'support_review',
        statusLabel: 'Under support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
      })
    : isStarted
      ? createMockCancellationState({
          blockedReason: 'This task has already started. Request help so Taskly support can review next steps.',
          blockedReasonCode: 'TASK_ALREADY_STARTED',
          helperText: 'Direct cancellation is blocked after work starts.',
          status: 'blocked_after_start',
          statusLabel: 'Support required',
        })
    : isInProgress
      ? createMockCancellationState({
          blockedReason: null,
          blockedReasonCode: null,
          estimatedPolicyOutcomeLabel: 'Free cancellation is available before the displayed deadline.',
          freeCancellationUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          helperText: 'Taskly allows free cancellation before the deadline.',
          status: 'free_cancellation_available',
          statusLabel: 'Free cancellation available',
        })
      : createMockCancellationState();
  const supportState = isSupportReview
    ? createMockSupportState({
        helperText: 'Taskly support is reviewing this task.',
        latestRequestCreatedAt: new Date().toISOString(),
        latestRequestId: 'demo-support-1',
        latestRequestType: 'TASK_HELP',
        status: 'under_review',
        statusLabel: 'Under support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
      })
    : isStarted
      ? createMockSupportState({
          blockedReason: null,
          blockedReasonCode: null,
          helperText: 'Support can review the task after work has started.',
          status: 'help_available',
          statusLabel: 'Help available',
        })
    : createMockSupportState();
  const disputeState = isSupportReview
    ? createMockDisputeState({
        helperText: 'Taskly support is reviewing this task.',
        status: 'under_review',
        statusLabel: 'Under support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
      })
    : createMockDisputeState();
  const refundState = isSupportReview
    ? createMockRefundState({
        helperText: 'Refund review is handled by Taskly support.',
        status: 'under_review',
        statusLabel: 'Refund review',
      })
    : createMockRefundState();

  return {
    task: {
      addressPreviewLabel: 'Demo address preview',
      cancellationBlockedReason: cancellationState.blockedReason,
      cancellationPolicySummary: cancellationState.policySummary,
      cancellationState,
      categoryLabel: 'Furniture Assembly',
      cityLabel: 'Sofia',
      description: 'Demo Taskly task detail with Taskly-style next action wording.',
      displayActions: [{ accent: 'core', href: '/customer/tasks', label: 'Review completion', type: 'review_completion' }],
      disputeState,
      id: taskId,
      images: [],
      interestedTaskers: isSelecting
        ? [
            {
              bioPreview: 'Careful Taskly Tasker with demo availability for fixed-scope work.',
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
      refundState,
      scheduledEndAt: null,
      scheduledStartAt: isInProgress ? new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() : null,
      status,
      statusLabel,
      supportReviewLabel: supportState.supportReviewLabel || disputeState.supportReviewLabel || cancellationState.supportReviewLabel,
      supportState,
      taskerPreview: isSelecting
        ? null
        : {
            displayName: 'Demo Tasker',
            ratingLabel: '5.0 rating',
            statusLabel: 'Verified',
          },
      timeline: [
        { description: 'Demo task posted.', id: 'posted', label: 'Posted', status: 'done' },
        { description: 'Payment state is shown by Taskly data.', id: 'payment', label: 'Payment protected', status: 'done' },
        {
          description: isCompleted
            ? 'Completion was approved through the protected payment flow.'
            : isInProgress
              ? 'Work is in progress. The Tasker can request completion when ready.'
              : isUpcoming
                ? 'The task is scheduled with the selected Tasker.'
                : isSelecting
                  ? 'The customer chooses a Tasker after interest is sent.'
                  : 'Tasker requested completion. The customer can approve or ask for changes.',
          id: 'completion',
          label: 'Completion review',
          status: isCompleted ? 'done' : 'current',
        },
      ],
      title: 'Demo Taskly task',
    },
  };
}

export function getMockCustomerProRequestsResponse(): CustomerProRequestsResponse {
  const now = new Date().toISOString();
  const proRequests: CustomerProRequestsResponse['proRequests'] = [
    {
      categoryLabel: 'Renovation',
      cityLabel: 'Sofia',
      comparisonState: {
        helperText: 'Limited previews remain visible until Pro Access is unlocked.',
        status: 'preview_only',
        statusLabel: 'Limited previews',
      },
      createdAt: now,
      id: 'demo-pro-empty',
      isUnlocked: false,
      meaningfulResponseCount: 0,
      nextAction: { accent: 'neutral', href: '/customer/pro-requests', label: 'Waiting for Pro responses', type: 'wait_for_pro_responses' },
      proAccessBlockedReason: 'Unlock will be available after approved Pros respond.',
      proAccessBlockedReasonCode: 'NO_RESPONSES',
      proAccessFeeAmount: 490,
      proAccessFeeCurrency: 'EUR',
      proAccessFeeLabel: 'EUR 4.90',
      proAccessNextActions: {
        blockedReason: 'Unlock will be available after approved Pros respond.',
        blockedReasonCode: 'NO_RESPONSES',
        canConfirmProAccessPayment: false,
        canOpenProAccessSupport: false,
        canPrepareProAccessPayment: false,
        canRequestProAccessRefund: false,
        canRetryProAccessPayment: false,
        canUnlockProResponses: false,
        canViewProAccessSupportStatus: false,
        canViewUnlockedResponses: false,
      },
      proAccessPaymentState: {
        amountCents: 490,
        amountLabel: 'EUR 4.90',
        currency: 'EUR',
        paidAt: null,
        refundedAt: null,
        retryAvailable: false,
        status: 'not_started',
        statusLabel: 'Not started',
      },
      proAccessState: {
        hiddenResponsesExcluded: true,
        helperText: 'Unlock will be available after approved Pros respond.',
        isUnlocked: false,
        meaningfulResponsesCount: 0,
        status: 'waiting_for_responses',
        statusLabel: 'No responses yet',
        submittedResponsesCount: 0,
        totalResponsesCount: 0,
      },
      proAccessSummary: 'Unlock will be available after approved Pros respond.',
      responsePreviewSummary: 'No response previews yet',
      responsesCount: 0,
      status: 'OPEN',
      statusLabel: 'Open',
      submittedResponseCount: 0,
      timelineLabel: 'Flexible',
      title: 'Demo Taskly Pro project without responses',
      unlockedResponseCount: 0,
      unlockedResponseSummary: 'Unlock to compare full response details',
      unlockStatusLabel: 'Waiting for meaningful Pro responses',
      visiblePreviewResponseCount: 0,
    },
    {
      categoryLabel: 'Renovation',
      cityLabel: 'Sofia',
      comparisonState: {
        helperText: 'Limited previews remain visible until Pro Access is unlocked.',
        status: 'preview_only',
        statusLabel: 'Limited previews',
      },
      createdAt: now,
      id: 'demo-pro-request',
      isUnlocked: false,
      meaningfulResponseCount: 1,
      nextAction: { accent: 'pro', href: '/customer/pro-requests', label: 'Unlock and compare Pros', type: 'unlock_pro_comparison' },
      proAccessBlockedReason: null,
      proAccessBlockedReasonCode: null,
      proAccessFeeAmount: 490,
      proAccessFeeCurrency: 'EUR',
      proAccessFeeLabel: 'EUR 4.90',
      proAccessNextActions: {
        blockedReason: null,
        blockedReasonCode: null,
        canConfirmProAccessPayment: false,
        canOpenProAccessSupport: false,
        canPrepareProAccessPayment: true,
        canRequestProAccessRefund: false,
        canRetryProAccessPayment: false,
        canUnlockProResponses: true,
        canViewProAccessSupportStatus: false,
        canViewUnlockedResponses: false,
      },
      proAccessPaymentState: {
        amountCents: 490,
        amountLabel: 'EUR 4.90',
        currency: 'EUR',
        paidAt: null,
        refundedAt: null,
        retryAvailable: false,
        status: 'not_started',
        statusLabel: 'Not started',
      },
      proAccessState: {
        hiddenResponsesExcluded: true,
        helperText: 'Approved Pros have responded. Pro Access can unlock comparison details.',
        isUnlocked: false,
        meaningfulResponsesCount: 1,
        status: 'available',
        statusLabel: 'Unlock available',
        submittedResponsesCount: 1,
        totalResponsesCount: 1,
      },
      proAccessSummary: 'Approved Pros have responded. Pro Access can unlock comparison details.',
      responsePreviewSummary: '1 response preview available',
      responsesCount: 1,
      status: 'RESPONSES_RECEIVED',
      statusLabel: 'Responses received',
      submittedResponseCount: 1,
      timelineLabel: 'Flexible',
      title: 'Demo Taskly Pro project ready to unlock',
      unlockedResponseCount: 0,
      unlockedResponseSummary: 'Unlock to compare full response details',
      unlockStatusLabel: 'Pro responses available to unlock',
      visiblePreviewResponseCount: 1,
    },
    {
      categoryLabel: 'Interior repair',
      cityLabel: 'Sofia',
      comparisonState: {
        helperText: 'Full comparison is available from Taskly details.',
        status: 'available',
        statusLabel: 'Full comparison available',
      },
      createdAt: now,
      id: 'demo-pro-unlocked',
      isUnlocked: true,
      meaningfulResponseCount: 2,
      nextAction: { accent: 'pro', href: '/customer/pro-requests', label: 'Compare Pro responses', type: 'compare_pro_responses' },
      proAccessBlockedReason: null,
      proAccessBlockedReasonCode: null,
      proAccessFeeAmount: 490,
      proAccessFeeCurrency: 'EUR',
      proAccessFeeLabel: 'EUR 4.90',
      proAccessNextActions: {
        blockedReason: null,
        blockedReasonCode: null,
        canConfirmProAccessPayment: false,
        canOpenProAccessSupport: false,
        canPrepareProAccessPayment: false,
        canRequestProAccessRefund: false,
        canRetryProAccessPayment: false,
        canUnlockProResponses: false,
        canViewProAccessSupportStatus: false,
        canViewUnlockedResponses: true,
      },
      proAccessPaymentState: {
        amountCents: 490,
        amountLabel: 'EUR 4.90',
        currency: 'EUR',
        paidAt: now,
        refundedAt: null,
        retryAvailable: false,
        status: 'paid',
        statusLabel: 'Paid',
      },
      proAccessState: {
        hiddenResponsesExcluded: true,
        helperText: 'Full comparison details from Taskly are available.',
        isUnlocked: true,
        meaningfulResponsesCount: 2,
        status: 'unlocked',
        statusLabel: 'Access unlocked',
        submittedResponsesCount: 2,
        totalResponsesCount: 2,
      },
      proAccessSummary: 'Full comparison details from Taskly are available.',
      responsePreviewSummary: '2 response previews available',
      responsesCount: 2,
      status: 'ACCESS_UNLOCKED',
      statusLabel: 'Comparison unlocked',
      submittedResponseCount: 2,
      timelineLabel: 'This month',
      title: 'Demo unlocked Taskly Pro project',
      unlockedResponseCount: 2,
      unlockedResponseSummary: '2 responses available for comparison',
      unlockStatusLabel: 'Comparison details unlocked',
      visiblePreviewResponseCount: 2,
    },
  ];

  return {
    emptyState: {
      description: 'Demo mode is active. Real Taskly Pro projects load after sign-in.',
      title: 'No demo Taskly Pro projects',
    },
    proRequests: [
      ...proRequests,
      createMockProAccessStateScenario(proRequests[2], now, 'review'),
      createMockProAccessStateScenario(proRequests[2], now, 'refunded'),
      createMockProAccessStateScenario(proRequests[2], now, 'credited'),
      createMockProAccessStateScenario(proRequests[1], now, 'failed'),
    ].map((request) => ({
      ...request,
      ...getMockProAccessSupportFields(request, now),
    })),
  };
}

function createMockProAccessStateScenario(
  base: CustomerProRequestsResponse['proRequests'][number],
  now: string,
  scenario: 'credited' | 'failed' | 'refunded' | 'review',
): CustomerProRequestsResponse['proRequests'][number] {
  const isFailed = scenario === 'failed';
  const isRefunded = scenario === 'refunded';
  const isCredited = scenario === 'credited';
  const paymentState = base.proAccessPaymentState || {
    amountCents: 490,
    amountLabel: 'EUR 4.90',
    currency: 'EUR',
    paidAt: null,
    refundedAt: null,
    retryAvailable: false,
    status: 'not_started',
    statusLabel: 'Not started',
  };
  const accessState = base.proAccessState || {
    hiddenResponsesExcluded: true,
    helperText: 'No Pro Access state is available in demo mode.',
    isUnlocked: false,
    meaningfulResponsesCount: 0,
    status: 'not_available',
    statusLabel: 'Not available',
    submittedResponsesCount: 0,
    totalResponsesCount: 0,
  };

  return {
    ...base,
    id: `demo-pro-${scenario}`,
    isUnlocked: isFailed ? false : base.isUnlocked,
    proAccessPaymentState: {
      ...paymentState,
      paidAt: isFailed ? null : now,
      refundedAt: isRefunded ? now : null,
      retryAvailable: isFailed,
      status: isFailed ? 'failed' : isRefunded ? 'refunded' : isCredited ? 'credited' : 'paid',
      statusLabel: isFailed ? 'Payment failed' : isRefunded ? 'Refunded' : isCredited ? 'Credited' : 'Paid',
    },
    proAccessState: {
      ...accessState,
      helperText: isFailed ? 'Payment failed. Retry when Taskly allows it.' : accessState.helperText,
      isUnlocked: isFailed ? false : accessState.isUnlocked,
      status: isFailed ? 'payment_failed' : isRefunded ? 'refunded' : isCredited ? 'credited' : accessState.status,
      statusLabel: isFailed ? 'Payment failed' : isRefunded ? 'Pro Access refunded' : isCredited ? 'Access credited' : accessState.statusLabel,
    },
    proAccessSummary: isFailed
      ? 'Payment failed. Retry when Taskly allows it.'
      : isRefunded
        ? 'Pro Access payment is marked refunded by Taskly.'
        : isCredited
          ? 'Pro Access is credited for this request.'
          : 'Taskly support is reviewing this Pro Access request.',
    title: scenario === 'review'
      ? 'Demo Pro Access review'
      : scenario === 'refunded'
        ? 'Demo Pro Access refunded'
        : scenario === 'credited'
          ? 'Demo Pro Access credited'
          : 'Demo Pro Access payment failed',
  };
}

function getMockProAccessSupportFields(
  request: CustomerProRequestsResponse['proRequests'][number],
  now: string,
): Partial<CustomerProRequestsResponse['proRequests'][number]> {
  const paymentStatus = request.proAccessPaymentState?.status;
  const isReview = request.id.includes('review');
  const isRefunded = paymentStatus === 'refunded';
  const isCredited = paymentStatus === 'credited';
  const isFailed = paymentStatus === 'failed';
  const blockedReason = isFailed
    ? 'A failed Pro Access payment has no completed charge to refund.'
    : request.isUnlocked
      ? null
      : 'No eligible Pro Access payment is available for support review.';
  const blockedReasonCode = isFailed ? 'PAYMENT_FAILED' : request.isUnlocked ? null : 'NO_ELIGIBLE_PRO_ACCESS_PAYMENT';
  const supportStatus = isReview ? 'under_review' : isRefunded || isCredited ? 'resolved' : isFailed ? 'support_available' : !request.isUnlocked ? 'not_available' : 'refund_review_available';
  const refundStatus = isReview ? 'under_review' : isRefunded ? 'refunded' : isCredited ? 'credited' : isFailed || !request.isUnlocked ? 'not_available' : 'request_available';
  const outcomeLabel = isRefunded ? 'Refunded' : isCredited ? 'Credited' : null;
  const summary = isReview
    ? 'Taskly support is reviewing this Pro Access request.'
    : isRefunded
      ? 'Pro Access payment is marked refunded by Taskly.'
      : isCredited
        ? 'Pro Access is credited for this request.'
        : isFailed
          ? 'Pro Access payment failed. You can request support for a payment problem.'
          : request.isUnlocked
            ? 'No Pro Access support review is open.'
            : 'Pro Access support is available only after an eligible Pro Access payment exists.';

  return {
    proAccessRefundBlockedReason: isReview || isRefunded || isCredited ? null : blockedReason,
    proAccessRefundBlockedReasonCode: isReview || isRefunded || isCredited ? null : blockedReasonCode,
    proAccessRefundOutcomeLabel: outcomeLabel,
    proAccessRefundResolvedAt: isRefunded || isCredited ? now : null,
    proAccessRefundState: {
      helperText: summary,
      outcomeLabel,
      status: refundStatus,
      statusLabel: isReview ? 'Review in progress' : isRefunded ? 'Refunded' : isCredited ? 'Credited' : isFailed ? 'Refund unavailable' : 'No refund review',
    },
    proAccessRefundSubmittedAt: isReview ? now : null,
    proAccessRefundSummary: summary,
    proAccessSupportNextActions: {
      blockedReason: isReview || isRefunded || isCredited ? null : blockedReason,
      blockedReasonCode: isReview || isRefunded || isCredited ? null : blockedReasonCode,
      canOpenProAccessSupport: supportStatus === 'support_available' || supportStatus === 'refund_review_available',
      canRequestProAccessRefund: refundStatus === 'request_available',
      canViewProAccessSupportStatus: isReview || isRefunded || isCredited,
    },
    proAccessSupportReviewLabel: isReview ? 'Support review in progress' : isRefunded ? 'Refund resolved' : isCredited ? 'Credit resolved' : null,
    proAccessSupportState: {
      blockedReason: isReview || isRefunded || isCredited ? null : blockedReason,
      blockedReasonCode: isReview || isRefunded || isCredited ? null : blockedReasonCode,
      helperText: summary,
      latestRequestCreatedAt: isReview ? now : null,
      latestRequestId: isReview ? 'demo-pro-access-support-1' : null,
      latestRequestType: isReview ? 'PRO_ACCESS_SUPPORT_REVIEW' : null,
      status: supportStatus,
      statusLabel: isReview ? 'Review in progress' : isRefunded || isCredited ? 'Support review resolved' : isFailed ? 'Payment failed' : request.isUnlocked ? 'Support review available' : 'Support unavailable',
      supportReviewLabel: isReview ? 'Support review in progress' : isRefunded ? 'Refund resolved' : isCredited ? 'Credit resolved' : null,
    },
  };
}

function getMockCustomerSiteVisitModel(proRequestId: string, isUnlocked: boolean, now: string, forcedStatus?: string) {
  if (!isUnlocked) {
    return {
      addressVisibilityState: {
        accessNotesLabel: null,
        addressLabel: null,
        helperText: 'Exact address is hidden until a site visit flow allows sharing.',
        state: 'hidden',
        stateLabel: 'Address hidden',
      },
      allowedContactFields: [],
      contactVisibilityState: {
        allowedContactFields: [],
        helperText: 'Contact details are hidden until Taskly allows sharing for a site visit.',
        state: 'hidden',
        stateLabel: 'Contact details hidden',
      },
      siteVisitBlockedReason: 'Site visit actions will be available after Pro Access unlock when allowed.',
      siteVisitBlockedReasonCode: 'PRO_ACCESS_NOT_UNLOCKED',
      siteVisitInvites: [],
      siteVisitNextActions: {
        blockedReason: 'Site visit actions will be available after Pro Access unlock when allowed.',
        blockedReasonCode: 'PRO_ACCESS_NOT_UNLOCKED',
        canAcceptSiteVisit: false,
        canCancelSiteVisitInvite: false,
        canDeclineSiteVisit: false,
        canInviteForSiteVisit: false,
        canProposeSiteVisitTime: false,
      },
      siteVisitState: {
        activeInviteCount: 0,
        blockedReason: 'Site visit actions will be available after Pro Access unlock when allowed.',
        blockedReasonCode: 'PRO_ACCESS_NOT_UNLOCKED',
        helperText: 'Site visit actions will be available after Pro Access unlock when allowed.',
        status: 'blocked',
        statusLabel: 'Site visit unavailable',
      },
      siteVisitSummary: 'Site visit actions will be available after Pro Access unlock when allowed.',
    };
  }

  const isAccepted = proRequestId.includes('accepted');
  const isDeclined = proRequestId.includes('declined');
  const isProposed = proRequestId.includes('proposed');
  const isInvited = proRequestId.includes('invited');
  if (!forcedStatus && !isAccepted && !isDeclined && !isProposed && !isInvited) {
    return {
      addressVisibilityState: {
        accessNotesLabel: null,
        addressLabel: null,
        helperText: 'Exact address is hidden until a site visit flow allows sharing.',
        state: 'area_only',
        stateLabel: 'City/area only',
      },
      allowedContactFields: [],
      contactVisibilityState: {
        allowedContactFields: [],
        helperText: 'Contact details are hidden until Taskly allows sharing for a site visit.',
        state: 'allowed_after_site_visit_invite',
        stateLabel: 'Contact details hidden',
      },
      siteVisitBlockedReason: null,
      siteVisitBlockedReasonCode: null,
      siteVisitInvites: [],
      siteVisitNextActions: {
        blockedReason: null,
        blockedReasonCode: null,
        canAcceptSiteVisit: false,
        canCancelSiteVisitInvite: false,
        canDeclineSiteVisit: false,
        canInviteForSiteVisit: true,
        canProposeSiteVisitTime: false,
      },
      siteVisitState: {
        activeInviteCount: 0,
        blockedReason: null,
        blockedReasonCode: null,
        helperText: 'You can review approved Pros first. Invite actions are available in demo mode.',
        status: 'invite_available',
        statusLabel: 'Invite available',
      },
      siteVisitSummary: 'You can invite an approved Pro for a site visit.',
    };
  }
  const status = forcedStatus || (isAccepted ? 'accepted' : isDeclined ? 'declined' : isProposed ? 'alternate_time_proposed' : 'invited');
  const statusLabel =
    status === 'accepted'
      ? 'Site visit accepted'
      : status === 'declined'
        ? 'Site visit declined'
        : status === 'alternate_time_proposed'
          ? 'Another time proposed'
          : 'Invite sent';
  const shared = status === 'accepted';

  return {
    addressVisibilityState: {
      accessNotesLabel: null,
      addressLabel: shared ? 'Address shared for site visit' : null,
      helperText: shared ? 'Address details are shared only for the allowed site visit flow.' : 'Exact address is hidden until a site visit flow allows sharing.',
      state: shared ? 'shared_for_site_visit' : 'area_only',
      stateLabel: shared ? 'Address shared for site visit' : 'City/area only',
    },
    allowedContactFields: shared ? ['address', 'accessNotes'] : [],
    contactVisibilityState: {
      allowedContactFields: shared ? ['address', 'accessNotes'] : [],
      helperText: shared ? 'Contact details are shared only for the allowed site visit flow.' : 'Contact details are hidden until Taskly allows sharing for a site visit.',
      state: shared ? 'shared_for_site_visit' : 'allowed_after_site_visit_invite',
      stateLabel: shared ? 'Contact details shared for site visit' : 'Contact details hidden',
    },
    siteVisitBlockedReason: null,
    siteVisitBlockedReasonCode: null,
    siteVisitInvites: [
      {
        accessNotesPreview: null,
        createdAt: now,
        id: 'demo-site-visit-1',
        messagePreview: 'Demo site visit note. No real contact details are shared.',
        preferredDate: now.slice(0, 10),
        preferredTimeWindow: now,
        proDisplayName: 'Approved Pro Studio',
        proProfileId: 'demo-pro-profile-1',
        proRequestId,
        proResponseId: 'demo-response-1',
        proposedAt: isProposed ? now : null,
        scheduledAt: now,
        status,
        statusLabel,
        updatedAt: now,
      },
    ],
    siteVisitNextActions: {
      blockedReason: null,
      blockedReasonCode: null,
      canAcceptSiteVisit: false,
      canCancelSiteVisitInvite: status === 'invited',
      canDeclineSiteVisit: false,
      canInviteForSiteVisit: false,
      canProposeSiteVisitTime: false,
    },
    siteVisitState: {
      activeInviteCount: status === 'invited' || status === 'accepted' ? 1 : 0,
      blockedReason: null,
      blockedReasonCode: null,
      helperText: 'Site visit state is demo data. This is only a site visit, not a final work agreement.',
      status,
      statusLabel,
    },
    siteVisitSummary: `${statusLabel} with Approved Pro Studio.`,
  };
}

export function getMockCustomerProRequestDetailResponse(proRequestId = 'demo-pro-request'): CustomerProRequestDetailResponse {
  const list = getMockCustomerProRequestsResponse().proRequests;
  const summary = list.find((request) => request.id === proRequestId) || list[1];
  const isUnlocked = Boolean(summary.isUnlocked);
  const siteVisitModel = getMockCustomerSiteVisitModel(proRequestId, isUnlocked, summary.createdAt);
  const unlockedComparison = isUnlocked
    ? {
        canViewFullComparison: true,
        comparisonLabel: 'Full comparison',
        emptyStateLabel: null,
        helperText: 'Compare details from approved independent Pros. Final agreement is between you and the Pro.',
        responseCount: 2,
        responses: [
          {
            assumptions: 'Final price depends on confirmed measurements and hidden installation conditions.',
            availability: 'Next Week',
            categoryLabel: 'Bathroom Renovation',
            cityLabel: 'Sofia',
            contactPolicyLabel: 'Contact details are shared only when Taskly allows it.',
            currency: 'EUR',
            customerPreparationNotes: 'Please prepare photos and approximate measurements before the site visit.',
            displayName: 'Approved Pro Studio',
            earliestStartDate: null,
            excludedNotes: 'Tiles, sanitaryware, and specialty fixtures are quoted after selection.',
            includedNotes: 'Labor, waterproofing, and standard installation materials.',
            independentProLabel: 'Independent Pro',
            materialsIncluded: 'Labor And Materials',
            portfolioCount: 4,
            proProfileId: 'demo-pro-profile-1',
            profileImageUrl: null,
            profileSummary: 'Renovation team focused on compact bathroom upgrades in Sofia.',
            profileVerifiedLabel: 'Reviewed by Taskly',
            responseId: 'demo-response-1',
            responseStatus: 'SUBMITTED',
            roughQuoteLabel: 'EUR 900.00 - EUR 1,200.00',
            roughQuoteMax: 1200,
            roughQuoteMin: 900,
            shortMessage: 'We can handle the project after a quick site visit.',
            siteVisitPolicy: 'Needed',
            submittedAt: summary.createdAt,
            tradeName: 'Approved Pro Studio',
            updatedAt: summary.createdAt,
            visibilityLabel: 'Visible after Pro Access unlock',
            yearsExperienceLabel: '8+ years',
          },
          {
            assumptions: 'Quote assumes no structural changes and normal working-hour access.',
            availability: 'This Month',
            categoryLabel: 'Bathroom Renovation',
            cityLabel: 'Sofia',
            contactPolicyLabel: 'Contact details are shared only when Taskly allows it.',
            currency: 'EUR',
            customerPreparationNotes: 'Share preferred fixtures and target finish level.',
            displayName: 'Urban Bath Pro',
            earliestStartDate: null,
            excludedNotes: 'Custom cabinetry and premium fixtures are separate.',
            includedNotes: 'Labor and standard consumables.',
            independentProLabel: 'Independent Pro',
            materialsIncluded: 'Needs Confirmation',
            portfolioCount: 2,
            proProfileId: 'demo-pro-profile-2',
            profileImageUrl: null,
            profileSummary: 'Independent Pro for bathroom refreshes and tile work.',
            profileVerifiedLabel: 'Reviewed by Taskly',
            responseId: 'demo-response-2',
            responseStatus: 'SUBMITTED',
            roughQuoteLabel: 'EUR 1,100.00 - EUR 1,450.00',
            roughQuoteMax: 1450,
            roughQuoteMin: 1100,
            shortMessage: 'I can provide a detailed estimate after reviewing the site.',
            siteVisitPolicy: 'Depends',
            submittedAt: summary.createdAt,
            tradeName: 'Urban Bath Pro',
            updatedAt: summary.createdAt,
            visibilityLabel: 'Visible after Pro Access unlock',
            yearsExperienceLabel: '6+ years',
          },
        ],
      }
    : null;
  return {
    proRequest: {
      ...siteVisitModel,
      budgetLabel: 'Budget not set',
      categoryLabel: summary.categoryLabel,
      cityLabel: summary.cityLabel,
      comparisonState: summary.comparisonState,
      createdAt: summary.createdAt,
      description: 'Demo Taskly Pro project detail. Unlock and contact actions stay Taskly-owned.',
      id: proRequestId,
      images: [],
      isUnlocked,
      meaningfulResponseCount: summary.meaningfulResponseCount,
      nextActions: [summary.nextAction],
      proAccessBlockedReason: summary.proAccessBlockedReason,
      proAccessBlockedReasonCode: summary.proAccessBlockedReasonCode,
      proAccessFeeAmount: summary.proAccessFeeAmount,
      proAccessFeeCurrency: summary.proAccessFeeCurrency,
      proAccessFeeLabel: summary.proAccessFeeLabel,
      proAccessNextActions: summary.proAccessNextActions,
      proAccessPaymentState: summary.proAccessPaymentState,
      proAccessRefundBlockedReason: summary.proAccessRefundBlockedReason,
      proAccessRefundBlockedReasonCode: summary.proAccessRefundBlockedReasonCode,
      proAccessRefundOutcomeLabel: summary.proAccessRefundOutcomeLabel,
      proAccessRefundResolvedAt: summary.proAccessRefundResolvedAt,
      proAccessRefundState: summary.proAccessRefundState,
      proAccessRefundSubmittedAt: summary.proAccessRefundSubmittedAt,
      proAccessRefundSummary: summary.proAccessRefundSummary,
      proAccessState: summary.proAccessState,
      proAccessSummary: summary.proAccessSummary,
      proAccessSupportNextActions: summary.proAccessSupportNextActions,
      proAccessSupportReviewLabel: summary.proAccessSupportReviewLabel,
      proAccessSupportState: summary.proAccessSupportState,
      proUnlockState: summary.proUnlockState,
      unlockedComparison,
      responsePreviews: summary.responsesCount
        ? [
          {
            headline: isUnlocked ? 'Structured response for the project scope.' : 'Pro response available',
            id: 'demo-response',
            isLocked: !isUnlocked,
            proDisplayName: isUnlocked ? 'Approved Pro Studio' : 'Taskly Pro',
            roughQuoteLabel: isUnlocked ? 'EUR 900.00 - EUR 1,200.00' : 'Locked until comparison is available',
            statusLabel: 'Submitted',
          },
        ]
        : [],
      responsePreviewSummary: summary.responsePreviewSummary,
      responsesCount: summary.responsesCount,
      status: summary.status,
      statusLabel: summary.statusLabel,
      submittedResponseCount: summary.submittedResponseCount,
      timelineLabel: summary.timelineLabel,
      title: summary.title,
      unlockedResponseCount: summary.unlockedResponseCount,
      unlockedResponseSummary: summary.unlockedResponseSummary,
      unlockStatusLabel: summary.unlockStatusLabel,
      visiblePreviewResponseCount: summary.visiblePreviewResponseCount,
    },
  };
}

export function requestMockCustomerProAccessSupport(
  proRequestId: string,
  _payload: CustomerProAccessSupportRequestPayload,
): CustomerProRequestDetailResponse {
  const detail = getMockCustomerProRequestDetailResponse(proRequestId || 'demo-pro-unlocked');
  const now = new Date().toISOString();
  return {
    proRequest: {
      ...detail.proRequest,
      id: proRequestId,
      proAccessRefundBlockedReason: null,
      proAccessRefundBlockedReasonCode: null,
      proAccessRefundOutcomeLabel: null,
      proAccessRefundResolvedAt: null,
      proAccessRefundState: {
        helperText: 'Taskly will review the request. This does not automatically guarantee a refund.',
        outcomeLabel: null,
        status: 'under_review',
        statusLabel: 'Review in progress',
      },
      proAccessRefundSubmittedAt: now,
      proAccessRefundSummary: 'Taskly support is reviewing this Pro Access request.',
      proAccessSupportNextActions: {
        blockedReason: null,
        blockedReasonCode: null,
        canOpenProAccessSupport: false,
        canRequestProAccessRefund: false,
        canViewProAccessSupportStatus: true,
      },
      proAccessSupportReviewLabel: 'Support review in progress',
      proAccessSupportState: {
        blockedReason: null,
        blockedReasonCode: null,
        helperText: 'Taskly support is reviewing this Pro Access request.',
        latestRequestCreatedAt: now,
        latestRequestId: 'demo-pro-access-support-submitted',
        latestRequestType: 'PRO_ACCESS_SUPPORT_REVIEW',
        status: 'under_review',
        statusLabel: 'Review in progress',
        supportReviewLabel: 'Support review in progress',
      },
    },
  };
}

export function createMockCustomerProSiteVisitInvite(
  proRequestId: string,
  proResponseId: string,
): CustomerProRequestDetailResponse {
  const detail = getMockCustomerProRequestDetailResponse('demo-pro-unlocked');
  const now = new Date().toISOString();
  return {
    proRequest: {
      ...detail.proRequest,
      ...getMockCustomerSiteVisitModel(proRequestId, true, now, 'invited'),
      id: proRequestId,
      siteVisitSummary: 'Invite sent with Approved Pro Studio.',
      unlockedComparison: detail.proRequest.unlockedComparison
        ? {
            ...detail.proRequest.unlockedComparison,
            responses: detail.proRequest.unlockedComparison.responses.map((response) => ({
              ...response,
              responseId: response.responseId || proResponseId,
            })),
          }
        : detail.proRequest.unlockedComparison,
    },
  };
}

export function cancelMockCustomerProSiteVisitInvite(proRequestId: string): CustomerProRequestDetailResponse {
  const detail = getMockCustomerProRequestDetailResponse('demo-pro-unlocked');
  const now = new Date().toISOString();
  return {
    proRequest: {
      ...detail.proRequest,
      ...getMockCustomerSiteVisitModel(proRequestId, true, now, 'cancelled'),
      id: proRequestId,
      siteVisitSummary: 'Site visit cancelled with Approved Pro Studio.',
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
        description: 'Demo Taskly task status card.',
        href: '/provider/core-tasks',
        id: 'demo-core',
        kind: 'core',
        statusLabel: 'Demo Taskly',
        title: 'Taskly Tasks',
      },
      {
        accent: 'pro',
        description: 'Demo Taskly Pro project status card.',
        href: '/provider/pro-requests',
        id: 'demo-pro',
        kind: 'pro',
        statusLabel: 'Demo Pro',
        title: 'Taskly Pro',
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
    canDisputeRejection: false,
    canExpressInterest: false,
    canMarkOnTheWay: false,
    canReportCannotAttend: false,
    canReportIssue: false,
    canRequestCompletion: false,
    canRequestProviderSupport: false,
    canStart: false,
    ...overrides,
  };
}

function createMockProviderIssueState(
  overrides: Partial<ProviderCoreIssueState> = {},
): ProviderCoreIssueState {
  return {
    blockedReason: null,
    blockedReasonCode: null,
    helperText: 'Provider issue and support state follows Taskly rules.',
    latestRequestCreatedAt: null,
    latestRequestId: null,
    latestRequestType: null,
    providerIssueSummary: null,
    providerSupportReviewLabel: null,
    status: 'none',
    statusLabel: 'No provider issue',
    ...overrides,
  };
}

export function getMockProviderCoreTasksResponse(): ProviderCoreTasksResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Taskly task previews load after sign-in.',
      title: 'No demo Taskly tasks',
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
        title: 'Demo available Taskly task',
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
          canReportCannotAttend: true,
          canReportIssue: true,
          canRequestProviderSupport: true,
          canCancelOrReportIssue: true,
          primary: { label: 'Mark on the way', method: 'POST', type: 'mark_on_the_way' },
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        providerCancellationState: createMockProviderIssueState({
          helperText: 'Cannot-attend reporting is available only when allowed by Taskly.',
          providerIssueSummary: 'Cannot-attend reporting available',
          status: 'cannot_attend_available',
          statusLabel: 'Provider action unavailable',
        }),
        providerIssueState: createMockProviderIssueState({
          helperText: 'Provider support can be requested when Taskly enables this action.',
          providerIssueSummary: 'Provider support is available when Taskly allows it.',
          status: 'support_available',
          statusLabel: 'Provider support available',
        }),
        providerIssueSummary: 'Provider support is available when Taskly allows it.',
        providerSupportState: createMockProviderIssueState({
          helperText: 'Provider support request is available only when allowed by Taskly.',
          providerIssueSummary: 'Provider support available',
          status: 'support_available',
          statusLabel: 'Provider support available',
        }),
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'RESERVED',
        statusLabel: 'Scheduled/upcoming',
        title: 'Demo scheduled Taskly task',
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
          canReportIssue: true,
          canRequestCompletion: true,
          canRequestProviderSupport: true,
          primary: { label: 'Request completion', method: 'POST', type: 'request_completion' },
        }),
        paymentStatusLabel: 'Payment protected',
        priceLabel: 'EUR 55',
        providerIssueState: createMockProviderIssueState({
          helperText: 'Issue reporting can be requested when Taskly enables this action.',
          providerIssueSummary: 'Issue reporting is available when Taskly allows it.',
          status: 'report_available',
          statusLabel: 'Issue reporting available',
        }),
        providerIssueSummary: 'Issue reporting is available when Taskly allows it.',
        providerSupportState: createMockProviderIssueState({
          helperText: 'Provider support request is available only when allowed by Taskly.',
          providerIssueSummary: 'Provider support available',
          status: 'support_available',
          statusLabel: 'Provider support available',
        }),
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'IN_PROGRESS',
        statusLabel: 'In progress',
        title: 'Demo in-progress Taskly task',
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
        cancellationPolicySummary: 'Cancellation and support outcomes are decided by Taskly policy.',
        cancellationState: createMockCancellationState({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          helperText: 'Taskly support is reviewing this task.',
          status: 'support_review',
          statusLabel: 'Under support review',
          supportReviewLabel: 'Taskly support is reviewing this task.',
        }),
        categoryLabel: 'General Mounting',
        cityLabel: 'Sofia',
        customerPreviewLabel: 'Customer preview',
        disputeState: createMockDisputeState({
          helperText: 'Taskly support is reviewing this task.',
          status: 'under_review',
          statusLabel: 'Under support review',
          supportReviewLabel: 'Taskly support is reviewing this task.',
        }),
        edgeCase: {
          cancellationOutcomeLabel: null,
          cancellationReason: null,
          cancellationSource: null,
          canceledAt: null,
          disputeReason: 'Provider cannot attend',
          disputeResolvedAt: null,
          disputeResolutionType: null,
          status: 'support_review',
          statusLabel: 'Under support review',
        },
        id: 'demo-provider-support-review',
        nextAction: { accent: 'neutral', href: '/provider/core-tasks', label: 'View task', type: 'view_task' },
        nextActions: createMockProviderCoreTaskNextActions({
          blockedReason: 'Task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          canChat: true,
          providerBlockedReason: 'Task is under support review.',
          providerBlockedReasonCode: 'TASK_DISPUTED',
          primary: { label: 'View task', type: 'view_task' },
        }),
        paymentStatusLabel: 'Under support review',
        priceLabel: 'EUR 55',
        providerBlockedReason: 'This task is under support review.',
        providerDisputeState: createMockProviderIssueState({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          helperText: 'This task is in a payment protected review.',
          providerIssueSummary: 'Task under review',
          providerSupportReviewLabel: 'Support review in progress',
          status: 'under_review',
          statusLabel: 'Task under review',
        }),
        providerIssueState: createMockProviderIssueState({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          helperText: 'Taskly support is reviewing this task and the protected payment flow.',
          latestRequestCreatedAt: new Date().toISOString(),
          latestRequestId: 'demo-support-1',
          latestRequestType: 'TASK_HELP',
          providerIssueSummary: 'Task under review',
          providerSupportReviewLabel: 'Support review in progress',
          status: 'under_review',
          statusLabel: 'Task under review',
        }),
        providerIssueSummary: 'Task under review',
        providerSupportReviewLabel: 'Support review in progress',
        providerSupportState: createMockProviderIssueState({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          helperText: 'Taskly support is reviewing this task.',
          latestRequestCreatedAt: new Date().toISOString(),
          latestRequestId: 'demo-support-1',
          latestRequestType: 'TASK_HELP',
          providerIssueSummary: 'Support review in progress',
          providerSupportReviewLabel: 'Support review in progress',
          status: 'under_review',
          statusLabel: 'Support review in progress',
        }),
        refundState: createMockRefundState({
          helperText: 'Refund outcome is under Taskly support review.',
          status: 'under_review',
          statusLabel: 'Under support review',
        }),
        scheduledEndAt: null,
        scheduledStartAt: null,
        status: 'DISPUTED',
        statusLabel: 'Support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
        supportState: createMockSupportState({
          helperText: 'Taskly support is reviewing this task.',
          latestRequestCreatedAt: new Date().toISOString(),
          latestRequestId: 'demo-support-1',
          latestRequestType: 'TASK_HELP',
          status: 'under_review',
          statusLabel: 'Under support review',
          supportReviewLabel: 'Taskly support is reviewing this task.',
        }),
        title: 'Demo support review',
        unreadMessagesCount: 0,
      },
      {
        aftercare: {
          closedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          customerReview: {
            comment: 'Fast, tidy work. Thank you!',
            createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            id: 'demo-review-provider',
            publishedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
            rating: 5,
          },
          invoice: {
            amountLabel: 'EUR 35',
            canOpenPdf: false,
            createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            id: 'demo-invoice-provider',
            invoiceNumber: 'TLY-DEMO-1001',
            isSent: false,
            pdfUrl: null,
            sentAt: null,
            totalLabel: 'EUR 35',
            vatAmountLabel: 'EUR 0',
            vatEnabled: false,
          },
          reviewStatus: 'COMPLETED',
        },
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
        title: 'Demo completed Taskly task',
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
  const isSupportReview = taskId.includes('support-review');
  const status = isCompleted
    ? 'COMPLETED'
    : isSupportReview
      ? 'DISPUTED'
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
    : isSupportReview
      ? createMockProviderCoreTaskNextActions({
          blockedReason: 'Task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          canChat: true,
          providerBlockedReason: 'Task is under support review.',
          providerBlockedReasonCode: 'TASK_DISPUTED',
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
            canReportIssue: true,
            canRequestCompletion: true,
            canRequestProviderSupport: true,
            primary: { label: 'Request completion', method: 'POST', type: 'request_completion' },
          })
        : isUpcoming
          ? createMockProviderCoreTaskNextActions({
              canChat: true,
              canMarkOnTheWay: true,
              canReportCannotAttend: true,
              canReportIssue: true,
              canRequestProviderSupport: true,
              canCancelOrReportIssue: true,
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
  const cancellationState = isSupportReview
    ? createMockCancellationState({
        blockedReason: 'This task is under support review.',
        blockedReasonCode: 'TASK_DISPUTED',
        helperText: 'Taskly support is reviewing this task.',
        status: 'support_review',
        statusLabel: 'Under support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
      })
    : createMockCancellationState();
  const supportState = isSupportReview
    ? createMockSupportState({
        helperText: 'Taskly support is reviewing this task.',
        latestRequestCreatedAt: new Date().toISOString(),
        latestRequestId: 'demo-support-1',
        latestRequestType: 'TASK_HELP',
        status: 'under_review',
        statusLabel: 'Under support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
      })
    : createMockSupportState();
  const disputeState = isSupportReview
    ? createMockDisputeState({
        helperText: 'Taskly support is reviewing this task.',
        status: 'under_review',
        statusLabel: 'Under support review',
        supportReviewLabel: 'Taskly support is reviewing this task.',
      })
    : createMockDisputeState();
  const refundState = isSupportReview
    ? createMockRefundState({
        helperText: 'Refund outcome is under Taskly support review.',
        status: 'under_review',
        statusLabel: 'Under support review',
      })
    : createMockRefundState();
  const providerIssueState = isSupportReview
    ? createMockProviderIssueState({
        blockedReason: 'This task is under support review.',
        blockedReasonCode: 'TASK_DISPUTED',
        helperText: 'Taskly support is reviewing this task and the protected payment flow.',
        latestRequestCreatedAt: new Date().toISOString(),
        latestRequestId: 'demo-support-1',
        latestRequestType: 'TASK_HELP',
        providerIssueSummary: 'Task under review',
        providerSupportReviewLabel: 'Support review in progress',
        status: 'under_review',
        statusLabel: 'Task under review',
      })
    : isUpcoming
      ? createMockProviderIssueState({
          helperText: 'Provider support can be requested when Taskly enables this action.',
          providerIssueSummary: 'Provider support is available when Taskly allows it.',
          status: 'support_available',
          statusLabel: 'Provider support available',
        })
      : isInProgress
        ? createMockProviderIssueState({
            helperText: 'Issue reporting can be requested when Taskly enables this action.',
            providerIssueSummary: 'Issue reporting is available when Taskly allows it.',
            status: 'report_available',
            statusLabel: 'Issue reporting available',
          })
        : createMockProviderIssueState({
            blockedReason: nextActions.providerBlockedReason || nextActions.blockedReason || null,
            blockedReasonCode: nextActions.providerBlockedReasonCode || nextActions.blockedReasonCode || null,
            helperText: nextActions.providerBlockedReason || nextActions.blockedReason || 'Provider issue actions are not available for this task state.',
            status: nextActions.providerBlockedReason || nextActions.blockedReason ? 'not_available' : 'none',
            statusLabel: 'Provider action unavailable',
          });
  const providerSupportState = isSupportReview
    ? createMockProviderIssueState({
        blockedReason: 'This task is under support review.',
        blockedReasonCode: 'TASK_DISPUTED',
        helperText: 'Taskly support is reviewing this task.',
        latestRequestCreatedAt: new Date().toISOString(),
        latestRequestId: 'demo-support-1',
        latestRequestType: 'TASK_HELP',
        providerIssueSummary: 'Support review in progress',
        providerSupportReviewLabel: 'Support review in progress',
        status: 'under_review',
        statusLabel: 'Support review in progress',
      })
    : isUpcoming || isInProgress
      ? createMockProviderIssueState({
          helperText: 'Provider support request is available only when allowed by Taskly.',
          providerIssueSummary: 'Provider support available',
          status: 'support_available',
          statusLabel: 'Provider support available',
        })
      : createMockProviderIssueState();
  const providerCancellationState = isUpcoming
    ? createMockProviderIssueState({
        helperText: 'Cannot-attend reporting is available only when allowed by Taskly.',
        providerIssueSummary: 'Cannot-attend reporting available',
        status: 'cannot_attend_available',
        statusLabel: 'Provider action unavailable',
      })
    : isSupportReview
      ? createMockProviderIssueState({
          blockedReason: 'This task is under support review.',
          blockedReasonCode: 'TASK_DISPUTED',
          helperText: 'Taskly support is reviewing this task before any cancellation outcome is shown.',
          providerIssueSummary: 'Task under review',
          providerSupportReviewLabel: 'Support review in progress',
          status: 'under_review',
          statusLabel: 'Task under review',
        })
      : createMockProviderIssueState();
  const providerDisputeState = isSupportReview
    ? createMockProviderIssueState({
        blockedReason: 'This task is under support review.',
        blockedReasonCode: 'TASK_DISPUTED',
        helperText: 'This task is in a payment protected review.',
        providerIssueSummary: 'Task under review',
        providerSupportReviewLabel: 'Support review in progress',
        status: 'under_review',
        statusLabel: 'Task under review',
      })
    : createMockProviderIssueState();
  const providerSupportReviewLabel =
    providerIssueState.providerSupportReviewLabel ||
    providerSupportState.providerSupportReviewLabel ||
    providerCancellationState.providerSupportReviewLabel ||
    providerDisputeState.providerSupportReviewLabel;
  const providerIssueSummary =
    providerIssueState.providerIssueSummary ||
    providerSupportState.providerIssueSummary ||
    providerCancellationState.providerIssueSummary ||
    providerDisputeState.providerIssueSummary;
  const edgeCase = isSupportReview
    ? {
        cancellationOutcomeLabel: null,
        cancellationReason: null,
        cancellationSource: null,
        canceledAt: null,
        disputeReason: 'Provider support request',
        disputeResolvedAt: null,
        disputeResolutionType: null,
        status: 'support_review' as const,
        statusLabel: 'Under support review',
      }
    : null;
  const completedAftercare = isCompleted
    ? {
        closedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        customerReview: {
          comment: 'Fast, tidy work. Thank you!',
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          id: 'demo-review-provider',
          publishedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
          rating: 5,
        },
        invoice: {
          amountLabel: 'EUR 35',
          canOpenPdf: false,
          createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
          id: 'demo-invoice-provider',
          invoiceNumber: 'TLY-DEMO-1001',
          isSent: false,
          pdfUrl: null,
          sentAt: null,
          totalLabel: 'EUR 35',
          vatAmountLabel: 'EUR 0',
          vatEnabled: false,
        },
        reviewStatus: 'COMPLETED',
      }
    : null;

  return {
    task: {
      addressPreviewLabel: isUpcoming || isInProgress || isPendingCompletion || isCompleted || isSupportReview
        ? 'Demo address preview'
        : 'Address shared after selection',
      aftercare: completedAftercare,
      cancellationBlockedReason: cancellationState.blockedReason,
      cancellationPolicySummary: cancellationState.policySummary,
      cancellationState,
      categoryLabel: 'Furniture Assembly',
      cityLabel: 'Sofia',
      customerPreviewLabel: 'Customer preview',
      description: 'Demo provider Taskly task detail. Actions follow Taskly next actions.',
      disputeState,
      edgeCase,
      id: taskId,
      images: [],
      nextActions,
      paymentStatusLabel: isSupportReview
        ? 'Under support review'
        : isUpcoming || isInProgress || isPendingCompletion
          ? 'Payment protected'
          : isCompleted
            ? 'Payment released'
            : 'Not paid yet',
      priceLabel: 'EUR 40',
      providerBlockedReason: providerIssueState.blockedReason,
      providerCancellationState,
      providerDisputeState,
      providerIssueState,
      providerIssueSummary,
      providerSupportReviewLabel,
      providerSupportState,
      refundState,
      scheduledEndAt: null,
      scheduledStartAt: null,
      status,
      statusLabel: isCompleted
        ? 'Completed'
        : isSupportReview
          ? 'Support review'
        : isPendingCompletion
          ? 'Waiting for customer approval'
          : isInProgress
            ? 'In progress'
            : isUpcoming
              ? 'Scheduled/upcoming'
              : isInterested
                ? 'Interest sent'
                : 'Available',
      supportReviewLabel: supportState.supportReviewLabel || disputeState.supportReviewLabel || cancellationState.supportReviewLabel,
      supportState,
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
      title: 'Demo provider Taskly task',
    },
  };
}

export function getMockProviderProRequestsResponse(): ProviderProRequestsResponse {
  return {
    emptyState: {
      description: 'Demo mode is active. Real Taskly Pro previews load after sign-in.',
      title: 'No demo Taskly Pro projects',
    },
    proRequests: [
      {
        categoryLabel: 'Renovation',
        cityLabel: 'Sofia',
        createdAt: new Date().toISOString(),
        id: 'demo-provider-pro',
        isEligibleToRespond: true,
        nextAction: { accent: 'pro', href: '/provider/pro-requests', label: 'Review Taskly Pro project', type: 'demo_review_pro' },
        proResponseBlockedReason: null,
        proResponseBlockedReasonCode: null,
        proResponseCapabilities: {
          canEditResponse: false,
          canOpenProResponseForm: true,
          canSubmitResponse: true,
          canViewSubmittedResponse: false,
        },
        proResponseState: {
          badgeLabel: 'Can respond',
          blockedReason: null,
          blockedReasonCode: null,
          capabilities: {
            canEditResponse: false,
            canOpenProResponseForm: true,
            canSubmitResponse: true,
            canViewSubmittedResponse: false,
          },
          helperText: 'Taskly validation will run before a response can be submitted.',
          status: 'can_submit',
          statusLabel: 'Can respond',
        },
        proResponseSummary: null,
        responseStatusLabel: 'No response yet',
        status: 'OPEN',
        statusLabel: 'Open',
        timelineLabel: 'Flexible',
        title: 'Demo provider Taskly Pro project',
      },
      {
        categoryLabel: 'Kitchen',
        cityLabel: 'Sofia',
        createdAt: new Date().toISOString(),
        id: 'demo-provider-pro-submitted',
        isEligibleToRespond: false,
        nextAction: { accent: 'pro', href: '/provider/pro-requests', label: 'View response status', type: 'view_pro_response_status' },
        proResponseBlockedReason: null,
        proResponseBlockedReasonCode: null,
        proResponseCapabilities: {
          canEditResponse: true,
          canOpenProResponseForm: true,
          canSubmitResponse: false,
          canViewSubmittedResponse: true,
        },
        proResponseState: {
          badgeLabel: 'Update available',
          blockedReason: null,
          blockedReasonCode: null,
          capabilities: {
            canEditResponse: true,
            canOpenProResponseForm: true,
            canSubmitResponse: false,
            canViewSubmittedResponse: true,
          },
          helperText: 'Your submitted response can be updated when response editing is connected.',
          status: 'can_edit',
          statusLabel: 'Update response',
        },
        proResponseSummary: {
          canEdit: true,
          currency: 'EUR',
          customerPreviewLabel: 'Customer sees a limited preview before access is unlocked.',
          hiddenFromCustomer: false,
          id: 'demo-response-submitted',
          materialsIncluded: 'LABOR_AND_MATERIALS',
          roughQuoteLabel: 'EUR 1200 - EUR 1800',
          roughQuoteMax: 1800,
          roughQuoteMin: 1200,
          shortMessagePreview: 'I can review the project details and prepare a rough quote range.',
          siteVisitPolicy: 'DEPENDS',
          status: 'SUBMITTED',
          statusLabel: 'Response submitted',
          submittedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          visibilityLabel: 'Visible in customer preview rules',
        },
        responseStatusLabel: 'Response submitted',
        status: 'RESPONSES_RECEIVED',
        statusLabel: 'Responses received',
        timelineLabel: 'Next month',
        title: 'Demo submitted Pro response',
      },
    ],
  };
}

function getMockProviderSiteVisitModel(proRequestId: string, hasSubmittedResponse: boolean, now: string, forcedStatus?: string) {
  if (!hasSubmittedResponse) {
    return {
      addressVisibilityState: {
        accessNotesLabel: null,
        addressLabel: null,
        helperText: 'Only city/area context is available before address sharing is allowed.',
        state: 'city_only',
        stateLabel: 'City/area only',
      },
      allowedContactFields: [],
      contactVisibilityState: {
        allowedContactFields: [],
        helperText: 'Customer contact details are hidden until Taskly allows sharing.',
        state: 'hidden',
        stateLabel: 'Contact details hidden',
      },
      siteVisitBlockedReason: 'Submit an approved Pro response before site visit invitations can be received.',
      siteVisitBlockedReasonCode: 'PRO_RESPONSE_REQUIRED',
      siteVisitInvites: [],
      siteVisitNextActions: {
        blockedReason: 'Submit an approved Pro response before site visit invitations can be received.',
        blockedReasonCode: 'PRO_RESPONSE_REQUIRED',
        canAcceptSiteVisit: false,
        canCancelSiteVisitInvite: false,
        canDeclineSiteVisit: false,
        canInviteForSiteVisit: false,
        canProposeSiteVisitTime: false,
      },
      siteVisitState: {
        activeInviteCount: 0,
        blockedReason: 'Submit an approved Pro response before site visit invitations can be received.',
        blockedReasonCode: 'PRO_RESPONSE_REQUIRED',
        helperText: 'Site visit invitations will appear here when a customer sends one.',
        status: 'blocked',
        statusLabel: 'Site visit unavailable',
      },
      siteVisitSummary: 'Site visit invitations will appear here when a customer sends one.',
    };
  }

  const accepted = proRequestId.includes('accepted');
  const proposed = proRequestId.includes('proposed');
  const declined = proRequestId.includes('declined');
  const status = forcedStatus || (accepted ? 'accepted' : proposed ? 'alternate_time_proposed' : declined ? 'declined' : 'invited');
  const statusLabel =
    status === 'accepted'
      ? 'Site visit accepted'
      : status === 'alternate_time_proposed'
        ? 'Another time proposed'
        : status === 'declined'
          ? 'Site visit declined'
          : 'Invite received';

  return {
    addressVisibilityState: {
      accessNotesLabel: accepted ? 'Use building entrance after 18:00.' : null,
      addressLabel: accepted ? 'Demo address shared for site visit' : null,
      helperText: accepted ? 'Address is shown only for the accepted site visit flow.' : 'Only city/area context is available before address sharing is allowed.',
      state: accepted ? 'shared_for_site_visit' : 'city_only',
      stateLabel: accepted ? 'Address shared for site visit' : 'City/area only',
    },
    allowedContactFields: accepted ? ['address', 'accessNotes'] : [],
    contactVisibilityState: {
      allowedContactFields: accepted ? ['address', 'accessNotes'] : [],
      helperText: accepted ? 'Only Taskly-allowed site visit contact details are shown.' : 'Customer contact details are hidden until Taskly allows sharing.',
      state: accepted ? 'shared_for_site_visit' : 'allowed_after_site_visit_invite',
      stateLabel: accepted ? 'Contact details shared for site visit' : 'Contact details hidden',
    },
    siteVisitBlockedReason: null,
    siteVisitBlockedReasonCode: null,
    siteVisitInvites: [
      {
        accessNotesPreview: accepted ? 'Use building entrance after 18:00.' : null,
        createdAt: now,
        id: 'demo-provider-site-visit',
        messagePreview: 'Customer requested a site visit. Demo mode uses safe placeholder details.',
        preferredDate: now.slice(0, 10),
        preferredTimeWindow: now,
        proDisplayName: 'Your Pro profile',
        proProfileId: 'demo-provider-profile',
        proRequestId,
        proResponseId: 'demo-response-submitted',
        proposedAt: proposed ? now : null,
        scheduledAt: now,
        status,
        statusLabel,
        updatedAt: now,
      },
    ],
    siteVisitNextActions: {
      blockedReason: null,
      blockedReasonCode: null,
      canAcceptSiteVisit: status === 'invited',
      canCancelSiteVisitInvite: false,
      canDeclineSiteVisit: status === 'invited',
      canInviteForSiteVisit: false,
      canProposeSiteVisitTime: status === 'invited',
    },
    siteVisitState: {
      activeInviteCount: status === 'invited' || status === 'accepted' ? 1 : 0,
      blockedReason: null,
      blockedReasonCode: null,
      helperText: 'This is only a site visit invitation, not a final work agreement.',
      status,
      statusLabel,
    },
    siteVisitSummary: statusLabel,
  };
}

export function getMockProviderProRequestDetailResponse(proRequestId = 'demo-provider-pro'): ProviderProRequestDetailResponse {
  const hasSubmittedResponse = proRequestId.includes('submitted');
  const now = new Date().toISOString();
  const siteVisitModel = getMockProviderSiteVisitModel(proRequestId, hasSubmittedResponse, now);
  const proResponseCapabilities = hasSubmittedResponse
    ? {
        canEditResponse: true,
        canOpenProResponseForm: true,
        canSubmitResponse: false,
        canViewSubmittedResponse: true,
      }
    : {
        canEditResponse: false,
        canOpenProResponseForm: true,
        canSubmitResponse: true,
        canViewSubmittedResponse: false,
      };
  const proResponseState = hasSubmittedResponse
    ? {
        badgeLabel: 'Update available',
        blockedReason: null,
        blockedReasonCode: null,
        capabilities: proResponseCapabilities,
        helperText: 'Your submitted response can be updated when response editing is connected.',
        status: 'can_edit',
        statusLabel: 'Update response',
      }
    : {
        badgeLabel: 'Can respond',
        blockedReason: null,
        blockedReasonCode: null,
        capabilities: proResponseCapabilities,
        helperText: 'Taskly validation will run before a response can be submitted.',
        status: 'can_submit',
        statusLabel: 'Can respond',
      };
  const proResponseSummary = hasSubmittedResponse
    ? {
        canEdit: true,
        currency: 'EUR',
        customerPreviewLabel: 'Customer sees a limited preview before access is unlocked.',
        hiddenFromCustomer: false,
        id: 'demo-response-submitted',
        materialsIncluded: 'LABOR_AND_MATERIALS',
        roughQuoteLabel: 'EUR 1200 - EUR 1800',
        roughQuoteMax: 1800,
        roughQuoteMin: 1200,
        shortMessagePreview: 'I can review the project details and prepare a rough quote range.',
        siteVisitPolicy: 'DEPENDS',
        status: 'SUBMITTED',
        statusLabel: 'Response submitted',
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        visibilityLabel: 'Visible in customer preview rules',
      }
    : null;

  return {
    proRequest: {
      ...siteVisitModel,
      budgetLabel: 'Budget not set',
      categoryLabel: 'Renovation',
      cityLabel: 'Sofia',
      createdAt: new Date().toISOString(),
      description: 'Demo provider Taskly Pro project detail. Respond/edit actions are not connected yet.',
      eligibility: { isEligibleToRespond: proResponseCapabilities.canSubmitResponse, reasonLabel: proResponseState.statusLabel },
      id: proRequestId,
      images: [],
      myResponse: proResponseSummary,
      nextActions: [{ accent: 'pro', href: '/provider/pro-requests', label: 'Review Taskly Pro project', type: 'demo_review_pro' }],
      proResponseBlockedReason: proResponseState.blockedReason,
      proResponseBlockedReasonCode: proResponseState.blockedReasonCode,
      proResponseCapabilities,
      proResponseState,
      proResponseSummary,
      responseEditDefaults: hasSubmittedResponse
        ? {
            assumptions: 'Demo assumptions stay Taskly-authored.',
            availability: 'NEXT_WEEK',
            currency: 'EUR',
            customerPreparationNotes: 'Customer should confirm measurements.',
            earliestStartDate: null,
            excludedItems: ['FINAL_MEASUREMENTS'],
            excludedNotes: 'Final materials list depends on site visit.',
            estimateConfidence: 'ROUGH_ESTIMATE',
            estimatedDuration: null,
            includedItems: ['LABOR', 'TOOLS', 'MATERIALS'],
            includedNotes: 'Labor and basic materials.',
            materialsIncluded: 'LABOR_AND_MATERIALS',
            responseType: 'CAN_HANDLE',
            roughQuoteMax: 1800,
            roughQuoteMin: 1200,
            shortMessage: 'I can review the project details and prepare a rough quote range.',
            siteVisitPolicy: 'DEPENDS',
          }
        : null,
      status: 'OPEN',
      statusLabel: 'Open',
      timelineLabel: 'Flexible',
      title: 'Demo provider Taskly Pro project',
    },
  };
}

export function acceptMockProviderProSiteVisit(proRequestId: string): ProviderProRequestDetailResponse {
  const detail = getMockProviderProRequestDetailResponse('demo-provider-pro-submitted');
  const now = new Date().toISOString();
  return {
    proRequest: {
      ...detail.proRequest,
      ...getMockProviderSiteVisitModel(proRequestId, true, now, 'accepted'),
      id: proRequestId,
      siteVisitSummary: 'Site visit accepted',
    },
  };
}

export function declineMockProviderProSiteVisit(proRequestId: string): ProviderProRequestDetailResponse {
  const detail = getMockProviderProRequestDetailResponse('demo-provider-pro-submitted');
  const now = new Date().toISOString();
  return {
    proRequest: {
      ...detail.proRequest,
      ...getMockProviderSiteVisitModel(proRequestId, true, now, 'declined'),
      id: proRequestId,
      siteVisitSummary: 'Site visit declined',
    },
  };
}

export function proposeMockProviderProSiteVisitTime(proRequestId: string): ProviderProRequestDetailResponse {
  const detail = getMockProviderProRequestDetailResponse('demo-provider-pro-submitted');
  const now = new Date().toISOString();
  return {
    proRequest: {
      ...detail.proRequest,
      ...getMockProviderSiteVisitModel(proRequestId, true, now, 'alternate_time_proposed'),
      id: proRequestId,
      siteVisitSummary: 'Another time proposed',
    },
  };
}

export function submitOrUpdateMockProviderProResponse(
  proRequestId: string,
  payload: ProviderProResponsePayload,
): ProviderProRequestDetailResponse {
  const now = new Date().toISOString();
  const siteVisitModel = getMockProviderSiteVisitModel(proRequestId, true, now);
  const min = payload.roughQuoteMin ?? null;
  const max = payload.roughQuoteMax ?? null;
  const roughQuoteLabel =
    min !== null && max !== null
      ? `EUR ${min.toFixed(2)} - EUR ${max.toFixed(2)}`
      : min !== null
        ? `From EUR ${min.toFixed(2)}`
        : max !== null
          ? `Up to EUR ${max.toFixed(2)}`
          : 'Rough quote not set';

  return {
    proRequest: {
      ...siteVisitModel,
      budgetLabel: 'Budget not set',
      categoryLabel: 'Renovation',
      cityLabel: 'Sofia',
      createdAt: now,
      description: 'Demo provider Taskly Pro project detail. Demo responses stay local and do not contact Taskly.',
      eligibility: { isEligibleToRespond: false, reasonLabel: 'Update response' },
      id: proRequestId,
      images: [],
      myResponse: {
        canEdit: true,
        currency: 'EUR',
        customerPreviewLabel: 'Customer sees a limited preview before access is unlocked.',
        hiddenFromCustomer: false,
        id: 'demo-response-local',
        materialsIncluded: payload.materialsIncluded || 'LABOR_ONLY',
        roughQuoteLabel,
        roughQuoteMax: max,
        roughQuoteMin: min,
        shortMessagePreview: payload.shortMessage || 'Structured response submitted.',
        siteVisitPolicy: payload.siteVisitPolicy || 'DEPENDS',
        status: 'SUBMITTED',
        statusLabel: 'Response submitted',
        submittedAt: now,
        updatedAt: now,
        visibilityLabel: 'Visible in customer preview rules',
      },
      nextActions: [{ accent: 'pro', href: '/provider/pro-requests', label: 'View response status', type: 'view_pro_response_status' }],
      proResponseBlockedReason: null,
      proResponseBlockedReasonCode: null,
      proResponseCapabilities: {
        canEditResponse: true,
        canOpenProResponseForm: true,
        canSubmitResponse: false,
        canViewSubmittedResponse: true,
      },
      proResponseState: {
        badgeLabel: 'Update available',
        blockedReason: null,
        blockedReasonCode: null,
        capabilities: {
          canEditResponse: true,
          canOpenProResponseForm: true,
          canSubmitResponse: false,
          canViewSubmittedResponse: true,
        },
        helperText: 'Demo response saved locally. Taskly validation will run in real mode.',
        status: 'can_edit',
        statusLabel: 'Update response',
      },
      proResponseSummary: {
        canEdit: true,
        currency: 'EUR',
        customerPreviewLabel: 'Customer sees a limited preview before access is unlocked.',
        hiddenFromCustomer: false,
        id: 'demo-response-local',
        materialsIncluded: payload.materialsIncluded || 'LABOR_ONLY',
        roughQuoteLabel,
        roughQuoteMax: max,
        roughQuoteMin: min,
        shortMessagePreview: payload.shortMessage || 'Structured response submitted.',
        siteVisitPolicy: payload.siteVisitPolicy || 'DEPENDS',
        status: 'SUBMITTED',
        statusLabel: 'Response submitted',
        submittedAt: now,
        updatedAt: now,
        visibilityLabel: 'Visible in customer preview rules',
      },
      responseEditDefaults: {
        assumptions: payload.assumptions || null,
        availability: payload.availability || 'DEPENDS_ON_PROJECT',
        currency: 'EUR',
        customerPreparationNotes: payload.customerPreparationNotes || null,
        earliestStartDate: payload.earliestStartDate || null,
        excludedItems: payload.excludedItems || [],
        excludedNotes: payload.excludedNotes || null,
        estimateConfidence: payload.estimateConfidence || 'ROUGH_ESTIMATE',
        estimatedDuration: payload.estimatedDuration || null,
        includedItems: payload.includedItems || [],
        includedNotes: payload.includedNotes || null,
        materialsIncluded: payload.materialsIncluded || 'LABOR_ONLY',
        responseType: payload.responseType || 'CAN_HANDLE',
        roughQuoteMax: max,
        roughQuoteMin: min,
        shortMessage: payload.shortMessage || null,
        siteVisitPolicy: payload.siteVisitPolicy || 'DEPENDS',
      },
      status: 'RESPONSES_RECEIVED',
      statusLabel: 'Responses received',
      timelineLabel: 'Flexible',
      title: 'Demo provider Taskly Pro project',
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
      stripeStatusLabel: 'Demo Taskly payout status',
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
        lastMessagePreview: 'Demo Taskly task conversation.',
        otherParticipantName: 'Taskly demo user',
        roleLabel: 'Participant',
        statusLabel: 'Taskly task',
        subtitle: 'Taskly demo user',
        title: 'Demo Taskly task conversation',
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
          : 'This is a demo Taskly task conversation.',
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
      title: isSupport ? 'Message from Taskly' : 'Demo Taskly task conversation',
    },
  };
}

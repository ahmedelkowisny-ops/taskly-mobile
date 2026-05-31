import { ProviderCapabilities } from './types';

export type NextAction = {
  href?: string;
  id: string;
  label: string;
  tone?: 'core' | 'neutral' | 'pro' | 'warning';
};

export type PaymentActionState = {
  amount?: number;
  currency?: string;
  label: string;
  nextAction?: NextAction;
  status: 'available' | 'blocked' | 'notRequired' | 'pending';
};

export type EmptyStateContent = {
  description: string;
  title: string;
};

export type CityOption = {
  id: string;
  isActive: boolean;
  nameBg: string;
  nameEn: string;
  slug: string;
};

export type CatalogCategory = {
  descriptionBg: string | null;
  descriptionEn: string | null;
  id: string;
  isActive: boolean;
  nameBg: string;
  nameEn: string;
  requiresPortfolio?: boolean;
  slug: string;
};

export type CitiesCatalogResponse = {
  cities: CityOption[];
};

export type CatalogCategoriesResponse = {
  categories: CatalogCategory[];
};

export type CoreTaskPostingRules = {
  acceptedImageTypes: string[];
  maxDescriptionLength: number;
  maxImages: number;
  minDescriptionLength: number;
  paymentProtectionCopy: string;
  requiresAddress: boolean;
  requiresCity: boolean;
  requiresSchedule: boolean;
};

export type ProRequestPostingRules = {
  acceptedImageTypes: string[];
  maxDescriptionLength: number;
  maxImages: number;
  minDescriptionLength: number;
  postingIsFreeCopy: string;
  requiresCity: boolean;
  requiresDistrictOrArea: boolean;
};

export type PostingRulesResponse = {
  coreTask: CoreTaskPostingRules;
  proRequest: ProRequestPostingRules;
};

export type NotificationPreferences = {
  completionAlertsEnabled: boolean;
  coreAlertsEnabled: boolean;
  marketingAlertsEnabled: boolean;
  messageAlertsEnabled: boolean;
  paymentAlertsEnabled: boolean;
  proAlertsEnabled: boolean;
  pushEnabled: boolean;
  siteVisitAlertsEnabled: boolean;
  soundEnabled: boolean;
  supportAlertsEnabled: boolean;
  vibrationEnabled: boolean;
};

export type NotificationPreferenceUpdatePayload = Partial<NotificationPreferences>;

export type NotificationTokenRegistrationPayload = {
  appVersion?: string | null;
  appWorkspace?: 'both' | 'customer' | 'provider';
  deviceId?: string | null;
  locale?: 'bg' | 'en';
  platform: 'android' | 'ios' | 'unknown' | 'web';
  timezone?: string | null;
  token: string;
  tokenType: 'expo' | 'native';
};

export type NotificationTokenUnregisterPayload = {
  deviceId?: string | null;
  token?: string | null;
};

export type NotificationPreferencesResponse = {
  preferences: NotificationPreferences;
};

export type NotificationTokenRegistrationResponse = NotificationPreferencesResponse & {
  tokenRegistration: {
    appWorkspace?: string | null;
    deactivated?: number;
    id?: string;
    isActive: boolean;
    lastSeenAt?: string;
    platform?: string;
    registeredAt?: string;
    tokenType?: string;
  };
};

export type DetailImage = {
  alt: string;
  id: string;
  url: string;
};

export type DetailTimelineItem = {
  description: string;
  id: string;
  label: string;
  status: 'current' | 'done' | 'upcoming';
};

export type DetailNextAction = {
  accent?: 'core' | 'neutral' | 'pro' | 'warning';
  href: string | null;
  label: string;
  type: string;
};

export type CustomerNextAction = {
  accent?: 'core' | 'neutral' | 'pro';
  href: string | null;
  label: string;
  type: string;
};

export type CoreCancellationState = {
  blockedReason: string | null;
  blockedReasonCode: string | null;
  estimatedPolicyOutcomeLabel: string | null;
  feeLabel: string | null;
  freeCancellationUntil: string | null;
  helperText: string;
  policySummary: string;
  refundLabel: string | null;
  requiresReason: boolean;
  status:
    | 'not_available'
    | 'free_cancellation_available'
    | 'late_cancellation_available'
    | 'blocked_after_start'
    | 'cancelled_free'
    | 'cancelled_late'
    | 'cancelled'
    | 'support_required'
    | 'support_review'
    | 'unknown';
  statusLabel: string;
  supportReviewLabel: string | null;
};

export type CoreSupportState = {
  blockedReason: string | null;
  blockedReasonCode: string | null;
  helperText: string;
  latestRequestCreatedAt: string | null;
  latestRequestId: string | null;
  latestRequestType: string | null;
  status:
    | 'none'
    | 'help_available'
    | 'refund_review_available'
    | 'support_submitted'
    | 'under_review'
    | 'resolved'
    | 'unknown';
  statusLabel: string;
  supportReviewLabel: string | null;
};

export type CoreRefundState = {
  helperText: string;
  outcomeLabel: string | null;
  status:
    | 'not_requested'
    | 'request_available'
    | 'requested'
    | 'under_review'
    | 'refunded'
    | 'rejected'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
};

export type CoreDisputeState = {
  helperText: string;
  resolutionLabel: string | null;
  status:
    | 'none'
    | 'opened'
    | 'under_review'
    | 'resolved_customer_favor'
    | 'resolved_late_cancellation'
    | 'rejected'
    | 'unknown';
  statusLabel: string;
  supportReviewLabel: string | null;
};

export type ProviderCoreIssueState = {
  blockedReason: string | null;
  blockedReasonCode: string | null;
  helperText: string;
  latestRequestCreatedAt: string | null;
  latestRequestId: string | null;
  latestRequestType: string | null;
  providerIssueSummary: string | null;
  providerSupportReviewLabel: string | null;
  status:
    | 'none'
    | 'report_available'
    | 'cannot_attend_available'
    | 'support_available'
    | 'dispute_rejection_available'
    | 'submitted'
    | 'under_review'
    | 'resolved'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
};

export type CustomerCoreTaskNextActions = {
  blockedReason?: string;
  blockedReasonCode?: string;
  canApproveCompletion: boolean;
  canCancel: boolean;
  canCancelFree?: boolean;
  canCancelLate?: boolean;
  canChat: boolean;
  canConfirmPayment: boolean;
  canOpenSupport?: boolean;
  canPreparePayment: boolean;
  canRejectCompletion: boolean;
  canRequestHelp: boolean;
  canRequestRefund?: boolean;
  canRetryPayment: boolean;
  canReview: boolean;
  canSelectTasker: boolean;
  canViewInvoice: boolean;
  cancellationBlockedReason?: string;
  cancellationBlockedReasonCode?: string;
  estimatedPolicyOutcomeLabel?: string;
  paymentProtected: boolean;
  paymentRequired: boolean;
  primaryAction:
    | 'select_tasker'
    | 'prepare_payment'
    | 'confirm_payment'
    | 'retry_payment'
    | 'chat'
    | 'approve_completion'
    | 'reject_completion'
    | 'cancel_task'
    | 'open_support_status'
    | 'request_help'
    | 'request_refund_review'
    | 'view_invoice'
    | 'review'
    | 'none';
};

export type CustomerCorePaymentStateStatus =
  | 'not_required_yet'
  | 'tasker_selection_needed'
  | 'reservation_pending'
  | 'payment_method_required'
  | 'payment_pending'
  | 'payment_initiated'
  | 'hold_scheduled'
  | 'holding'
  | 'held'
  | 'released'
  | 'failed'
  | 'refunded'
  | 'cancelled'
  | 'disputed'
  | 'unknown';

export type CustomerCorePaymentState = {
  bookingStatus: string | null;
  canShowPaymentProtectedBadge: boolean;
  helperText?: string;
  paymentProtected: boolean;
  paymentRequired: boolean;
  paymentStatus: string | null;
  reservationState: string | null;
  status: CustomerCorePaymentStateStatus;
  statusLabel: string;
  warningCode: string | null;
};

export type CustomerHighlight = {
  accent: 'core' | 'neutral' | 'pro' | 'warning';
  description: string;
  href: string | null;
  id: string;
  kind: 'message' | 'payment' | 'proRequest' | 'support' | 'task';
  statusLabel: string;
  title: string;
};

export type CustomerHomeSummary = {
  activeTasksCount: number;
  completedTasksCount: number;
  displayName: string;
  openTasksCount: number;
  pendingCompletionCount: number;
  proRequestsCount: number;
  proResponsesAvailableCount: number;
  unreadMessagesCount: number;
};

export type CustomerHomeResponse = {
  highlights: CustomerHighlight[];
  nextActions: CustomerNextAction[];
  summary: CustomerHomeSummary;
};

export type CustomerTaskSummary = {
  cancellationBlockedReason?: string | null;
  cancellationPolicySummary?: string;
  cancellationState?: CoreCancellationState;
  categoryLabel: string;
  cityLabel: string;
  disputeState?: CoreDisputeState;
  id: string;
  messageThreadId?: string | null;
  nextAction: CustomerNextAction;
  nextActions: CustomerCoreTaskNextActions;
  paymentState: CustomerCorePaymentState;
  paymentStatusLabel: string;
  priceLabel: string;
  refundState?: CoreRefundState;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  status: string;
  statusLabel: string;
  supportReviewLabel?: string | null;
  supportState?: CoreSupportState;
  title: string;
  unreadMessagesCount: number;
};

export type CustomerTasksResponse = {
  emptyState: EmptyStateContent;
  tasks: CustomerTaskSummary[];
};

export type CustomerTaskerPreview = {
  displayName: string;
  ratingLabel: string;
  statusLabel: string;
};

export type CustomerInterestedTaskerPreview = {
  bioPreview: string | null;
  completedTasksLabel: string;
  displayName: string;
  id: string;
  interestId: string;
  profileImageUrl: string | null;
  ratingLabel: string;
  statusLabel: string;
  taskerId: string;
  toolsConfirmed: boolean;
};

export type TaskScopeChecklistItem = {
  checked: boolean;
  code: string;
  label: string;
};

export type CustomerTaskDetail = {
  addressPreviewLabel: string;
  cancellationBlockedReason?: string | null;
  cancellationPolicySummary?: string;
  cancellationState?: CoreCancellationState;
  categoryLabel: string;
  cityLabel: string;
  description: string;
  displayActions?: DetailNextAction[];
  disputeState?: CoreDisputeState;
  id: string;
  images: DetailImage[];
  interestedTaskers: CustomerInterestedTaskerPreview[];
  messageThreadId?: string | null;
  nextActions: CustomerCoreTaskNextActions;
  paymentState: CustomerCorePaymentState;
  paymentStatusLabel: string;
  priceLabel: string;
  refundState?: CoreRefundState;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  scopeChecklist?: TaskScopeChecklistItem[];
  status: string;
  statusLabel: string;
  supportReviewLabel?: string | null;
  supportState?: CoreSupportState;
  taskerPreview: CustomerTaskerPreview | null;
  timeline: DetailTimelineItem[];
  title: string;
};

export type CustomerTaskDetailResponse = {
  task: CustomerTaskDetail;
};

export type TaskScopeData = {
  // furniture_assembly
  assemblyAreaClear?: boolean;
  assemblyInstructionsAvailable?: boolean;
  assemblyItemUnassembled?: boolean;
  assemblyPartsAvailable?: boolean;
  // general_mounting
  mountingType?: 'standard_mounting' | 'tv_mounting';
  wallType?: 'drywall' | 'brick' | 'concrete' | 'unknown';
  itemCount?: number;
  tvSizeBand?: 'up_to_43' | '44_to_65' | '65_plus';
  tvBracketAvailable?: boolean;
  cableConcealmentRequested?: boolean;
  checklistItemReady?: boolean;
  checklistWallSurfaceSelected?: boolean;
  checklistMeasurementsChecked?: boolean;
  // light_electrical
  electricalReplacementAtExistingPoint?: boolean;
  checklistReplacementOnly?: boolean;
  checklistPowerAccess?: boolean;
  checklistNoNewWiring?: boolean;
  // minor_plumbing_fix
  plumbingIssueVisibleLocalized?: boolean;
  plumbingAccessAvailable?: boolean;
  checklistIssueVisible?: boolean;
  checklistShutoffAccess?: boolean;
  checklistPartsReady?: boolean;
  // painting_touchups
  checklistSurfaceReady?: boolean;
  checklistPaintAvailable?: boolean;
  checklistCoverageConfirmed?: boolean;
  // heavy_lifting (itemCount reused from general_mounting)
  heavyWeightBand?: 'up_to_40' | '40_to_80' | '80_to_120' | '120_plus';
  heavyAccessType?: 'elevator' | 'stairs' | 'both' | 'none';
  heavyTwoPersonLikely?: boolean;
  checklistPathClear?: boolean;
  checklistStairsElevatorSet?: boolean;
  checklistSizeWeightSet?: boolean;
};

export type CreateCustomerTaskPayload = {
  address: string;
  budgetEur: number;
  categorySlug: string;
  cityId: string;
  description: string;
  estimatedTime: string;
  localImageCount?: number;
  location: {
    lat: number;
    lng: number;
  };
  scheduledEndAt: string;
  scheduledStartAt: string;
  scopeData?: TaskScopeData;
  title: string;
};

export type CreateCustomerTaskResponse = CustomerTaskDetailResponse & {
  nextActions: CustomerCoreTaskNextActions;
  uploadState?: {
    imageUploadRequired: boolean;
    maxImages: number;
    uploadedImagesCount: number;
  };
};

export type CancelCustomerTaskPayload = {
  confirmationAccepted?: boolean;
  reason?: string;
};

export type CancelCustomerTaskResponse = {
  alreadyCancelled?: boolean;
  cancellationState: CoreCancellationState | null;
  disputeState?: CoreDisputeState | null;
  message?: string;
  nextActions: CustomerCoreTaskNextActions | null;
  paymentState: CustomerCorePaymentState | null;
  refundState?: CoreRefundState | null;
  supportReviewLabel?: string | null;
  supportState?: CoreSupportState | null;
  task: CustomerTaskDetail | null;
};

export type RequestCustomerTaskSupportPayload = {
  details?: string;
  reason: string;
};

export type RequestCustomerTaskSupportResponse = {
  alreadyUnderReview?: boolean;
  disputeState: CoreDisputeState | null;
  message?: string;
  nextActions: CustomerCoreTaskNextActions | null;
  refundState: CoreRefundState | null;
  requestId?: string | null;
  supportReviewLabel?: string | null;
  supportState: CoreSupportState | null;
  task: CustomerTaskDetail | null;
};

export type RejectCustomerTaskCompletionPayload = {
  reason: string;
};

export type RejectCustomerTaskCompletionResponse = {
  message?: string;
  nextActions: CustomerCoreTaskNextActions | null;
  task: CustomerTaskDetail | null;
};

export type ApproveCustomerTaskCompletionResponse = {
  alreadyCompleted?: boolean;
  message?: string;
  nextActions: CustomerCoreTaskNextActions | null;
  payment?: {
    reasonCode?: string | null;
    statusLabel: string;
    warning?: string | null;
  };
  task: CustomerTaskDetail | null;
};

export type SelectCustomerTaskerPayload = {
  taskerId: string;
};

export type SelectCustomerTaskerResponse = {
  message?: string;
  nextActions: CustomerCoreTaskNextActions | null;
  task: CustomerTaskDetail | null;
};

export type CustomerTaskPaymentSetupResponse = {
  fallback: {
    code: 'MOCK_PAYMENTS' | 'PAYMENT_NOT_REQUIRED' | 'SETUP_NOT_AVAILABLE' | 'STRIPE_NOT_CONFIGURED';
    message: string;
  } | null;
  nextActions: CustomerCoreTaskNextActions | null;
  paymentState: CustomerCorePaymentState | null;
  requiresPaymentMethod: boolean;
  setupIntentClientSecret?: string;
  task: CustomerTaskDetail | null;
};

export type FinalizeCustomerTaskPaymentPayload = {
  paymentMethodId?: string;
  setupIntentId?: string;
};

export type CustomerTaskPaymentFinalizeResponse = {
  nextActions: CustomerCoreTaskNextActions | null;
  payment?: {
    reasonCode?: string | null;
    statusLabel: string;
    warning?: string | null;
  };
  paymentState: CustomerCorePaymentState | null;
  task: CustomerTaskDetail | null;
};

export type CustomerImageUploadResponse = {
  image: {
    createdAt: string;
    id: string;
    sortOrder?: number;
    url: string;
  };
  uploadState: {
    maxImages: number;
    remainingSlots: number;
    uploadedCount: number;
  };
};

export type CreateCustomerProRequestPayload = {
  budgetMaxEur: number;
  budgetMinEur: number;
  categoryKey: string;
  cityId: string;
  description: string;
  district: string;
  internalLocationDetails?: string;
  localImageCount?: number;
  locationAddress?: string;
  timeline: string;
  title: string;
};

export type CustomerProRequestSummary = {
  categoryLabel: string;
  cityLabel: string;
  comparisonState?: CustomerProComparisonState;
  createdAt: string;
  id: string;
  isUnlocked: boolean;
  meaningfulResponseCount?: number;
  nextAction: CustomerNextAction;
  proAccessBlockedReason?: string | null;
  proAccessBlockedReasonCode?: string | null;
  proAccessFeeAmount?: number;
  proAccessFeeCurrency?: string;
  proAccessFeeLabel?: string;
  proAccessNextActions?: CustomerProAccessNextActions;
  proAccessPaymentState?: CustomerProAccessPaymentState;
  proAccessRefundBlockedReason?: string | null;
  proAccessRefundBlockedReasonCode?: string | null;
  proAccessRefundOutcomeLabel?: string | null;
  proAccessRefundResolvedAt?: string | null;
  proAccessRefundState?: CustomerProAccessRefundState;
  proAccessRefundSubmittedAt?: string | null;
  proAccessRefundSummary?: string | null;
  proAccessState?: CustomerProAccessState;
  proAccessSummary?: string;
  proAccessSupportNextActions?: CustomerProAccessSupportNextActions;
  proAccessSupportReviewLabel?: string | null;
  proAccessSupportState?: CustomerProAccessSupportState;
  proUnlockState?: CustomerProAccessState;
  responsePreviewSummary?: string;
  responsesCount: number;
  submittedResponseCount?: number;
  status: string;
  statusLabel: string;
  timelineLabel: string;
  title: string;
  unlockedResponseCount?: number;
  unlockedResponseSummary?: string;
  unlockStatusLabel: string;
  visiblePreviewResponseCount?: number;
};

export type CustomerProRequestsResponse = {
  emptyState: EmptyStateContent;
  proRequests: CustomerProRequestSummary[];
};

export type CustomerProAccessState = {
  hiddenResponsesExcluded: boolean;
  helperText: string;
  isUnlocked: boolean;
  meaningfulResponsesCount: number;
  status: string;
  statusLabel: string;
  submittedResponsesCount: number;
  totalResponsesCount: number;
};

export type CustomerProAccessPaymentState = {
  amountCents: number | null;
  amountLabel: string | null;
  currency: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  retryAvailable: boolean;
  status: string;
  statusLabel: string;
};

export type CustomerProAccessSupportState = {
  blockedReason: string | null;
  blockedReasonCode: string | null;
  helperText: string;
  latestRequestCreatedAt: string | null;
  latestRequestId: string | null;
  latestRequestType: string | null;
  status:
    | 'none'
    | 'support_available'
    | 'refund_review_available'
    | 'submitted'
    | 'under_review'
    | 'resolved'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
  supportReviewLabel: string | null;
};

export type CustomerProAccessRefundState = {
  helperText: string;
  outcomeLabel: string | null;
  status:
    | 'not_requested'
    | 'request_available'
    | 'requested'
    | 'under_review'
    | 'refunded'
    | 'credited'
    | 'declined'
    | 'not_available'
    | 'unknown';
  statusLabel: string;
};

export type CustomerProAccessSupportNextActions = {
  blockedReason?: string | null;
  blockedReasonCode?: string | null;
  canOpenProAccessSupport: boolean;
  canRequestProAccessRefund: boolean;
  canViewProAccessSupportStatus: boolean;
};

export type ProAccessSupportIssueType =
  | 'no_useful_responses'
  | 'response_quality_issue'
  | 'pro_cancelled_or_no_show'
  | 'payment_problem'
  | 'accidental_payment'
  | 'other';

export type CustomerProAccessSupportRequestPayload = {
  details?: string;
  issueType?: ProAccessSupportIssueType;
  reason: string;
};

export type CustomerProAccessNextActions = {
  blockedReason?: string | null;
  blockedReasonCode?: string | null;
  canConfirmProAccessPayment: boolean;
  canOpenProAccessSupport?: boolean;
  canPrepareProAccessPayment: boolean;
  canRequestProAccessRefund: boolean;
  canRetryProAccessPayment: boolean;
  canUnlockProResponses: boolean;
  canViewProAccessSupportStatus?: boolean;
  canViewUnlockedResponses: boolean;
};

export type ProSiteVisitState = {
  activeInviteCount: number;
  blockedReason: string | null;
  blockedReasonCode: string | null;
  helperText: string;
  status: string;
  statusLabel: string;
};

export type ProSiteVisitInviteSummary = {
  accessNotesPreview: string | null;
  createdAt: string;
  id: string;
  messagePreview: string | null;
  preferredDate: string | null;
  preferredTimeWindow: string | null;
  proDisplayName: string;
  proProfileId: string;
  proRequestId: string;
  proResponseId: string | null;
  proposedAt: string | null;
  scheduledAt: string | null;
  status: string;
  statusLabel: string;
  updatedAt: string;
};

export type ProSiteVisitNextActions = {
  blockedReason?: string | null;
  blockedReasonCode?: string | null;
  canAcceptSiteVisit: boolean;
  canCancelSiteVisitInvite: boolean;
  canDeclineSiteVisit: boolean;
  canInviteForSiteVisit: boolean;
  canProposeSiteVisitTime: boolean;
};

export type ProContactVisibilityState = {
  allowedContactFields: string[];
  helperText: string;
  state: string;
  stateLabel: string;
};

export type ProAddressVisibilityState = {
  accessNotesLabel: string | null;
  addressLabel: string | null;
  helperText: string;
  selectedAt?: string | null;
  state: string;
  stateLabel: string;
};

export type CustomerProComparisonState = {
  helperText: string;
  status: string;
  statusLabel: string;
};

export type CustomerProResponsePreview = {
  headline: string;
  id: string;
  isLocked: boolean;
  proDisplayName: string;
  roughQuoteLabel: string;
  statusLabel: string;
};

export type CustomerUnlockedProComparisonResponse = {
  assumptions: string | null;
  availability: string | null;
  canSelectPro?: boolean;
  categoryLabel: string;
  cityLabel: string;
  contactPolicyLabel: string;
  currency: string;
  customerPreparationNotes: string | null;
  displayName: string;
  earliestStartDate: string | null;
  excludedNotes: string | null;
  includedNotes: string | null;
  independentProLabel: string;
  materialsIncluded: string | null;
  portfolioCount: number;
  proProfileId: string;
  profileImageUrl: string | null;
  profileSummary: string | null;
  profileVerifiedLabel: string;
  responseId: string;
  responseStatus: string;
  roughQuoteLabel: string;
  roughQuoteMax: number | null;
  roughQuoteMin: number | null;
  isSelected?: boolean;
  selectedAt?: string | null;
  selectProBlockedReason?: string | null;
  selectProBlockedReasonCode?: string | null;
  selectionStatusLabel?: string;
  shortMessage: string | null;
  siteVisitPolicy: string | null;
  submittedAt: string;
  tradeName: string | null;
  updatedAt: string;
  visibilityLabel: string;
  yearsExperienceLabel: string | null;
};

export type CustomerUnlockedProComparison = {
  canViewFullComparison: boolean;
  comparisonLabel: string;
  emptyStateLabel: string | null;
  helperText: string;
  responseCount: number;
  responses: CustomerUnlockedProComparisonResponse[];
};

export type CustomerProSelectionNextActions = {
  blockedReason?: string | null;
  blockedReasonCode?: string | null;
  canSelectPro: boolean;
};

export type CustomerProSelectionState = {
  blockedReason?: string | null;
  blockedReasonCode?: string | null;
  helperText: string;
  selectedProDisplayName?: string | null;
  selectedProProfileId?: string | null;
  selectedProResponseId?: string | null;
  selectedProSelectedAt?: string | null;
  status: string;
  statusLabel: string;
};

export type CustomerProRequestDetail = {
  addressVisibilityState?: ProAddressVisibilityState;
  allowedContactFields?: string[];
  budgetLabel: string;
  categoryLabel: string;
  cityLabel: string;
  comparisonState?: CustomerProComparisonState;
  contactVisibilityState?: ProContactVisibilityState;
  createdAt: string;
  description: string;
  id: string;
  images: DetailImage[];
  isUnlocked: boolean;
  meaningfulResponseCount?: number;
  nextActions: DetailNextAction[];
  proAccessBlockedReason?: string | null;
  proAccessBlockedReasonCode?: string | null;
  proAccessFeeAmount?: number;
  proAccessFeeCurrency?: string;
  proAccessFeeLabel?: string;
  proAccessNextActions?: CustomerProAccessNextActions;
  proAccessPaymentState?: CustomerProAccessPaymentState;
  proAccessRefundBlockedReason?: string | null;
  proAccessRefundBlockedReasonCode?: string | null;
  proAccessRefundOutcomeLabel?: string | null;
  proAccessRefundResolvedAt?: string | null;
  proAccessRefundState?: CustomerProAccessRefundState;
  proAccessRefundSubmittedAt?: string | null;
  proAccessRefundSummary?: string | null;
  proAccessState?: CustomerProAccessState;
  proAccessSummary?: string;
  proAccessSupportNextActions?: CustomerProAccessSupportNextActions;
  proAccessSupportReviewLabel?: string | null;
  proAccessSupportState?: CustomerProAccessSupportState;
  proSelectionNextActions?: CustomerProSelectionNextActions;
  proSelectionState?: CustomerProSelectionState;
  proUnlockState?: CustomerProAccessState;
  responsePreviews: CustomerProResponsePreview[];
  responsePreviewSummary?: string;
  responsesCount: number;
  submittedResponseCount?: number;
  siteVisitBlockedReason?: string | null;
  siteVisitBlockedReasonCode?: string | null;
  siteVisitInvites?: ProSiteVisitInviteSummary[];
  siteVisitNextActions?: ProSiteVisitNextActions;
  siteVisitState?: ProSiteVisitState;
  siteVisitSummary?: string;
  status: string;
  statusLabel: string;
  timelineLabel: string;
  title: string;
  unlockedComparison?: CustomerUnlockedProComparison | null;
  unlockedResponseCount?: number;
  unlockedResponseSummary?: string;
  unlockStatusLabel: string;
  visiblePreviewResponseCount?: number;
};

export type CustomerProRequestDetailResponse = {
  proRequest: CustomerProRequestDetail;
};

export type CustomerProAccessCheckoutResponse = CustomerProRequestDetailResponse & {
  alreadyUnlocked?: boolean;
  checkoutUrl?: string | null;
  sessionId?: string | null;
};

export type CustomerProAccessSupportRequestResponse = CustomerProRequestDetailResponse & {
  alreadyUnderReview?: boolean;
  message?: string;
  proAccessRefundState?: CustomerProAccessRefundState | null;
  proAccessSupportNextActions?: CustomerProAccessSupportNextActions | null;
  proAccessSupportReviewLabel?: string | null;
  proAccessSupportState?: CustomerProAccessSupportState | null;
  requestId?: string | null;
};

export type CustomerProResponseSelectResponse = CustomerProRequestDetailResponse & {
  alreadySelected?: boolean;
  selectedProProfileId?: string;
  selectedProResponseId?: string;
};

export type CustomerProSiteVisitInvitePayload = {
  accessNotes?: string;
  addressConfirmation?: boolean;
  message?: string;
  preferredDate?: string | null;
  preferredTimeWindow?: string;
  proResponseId: string;
};

export type CustomerProSiteVisitCancelPayload = {
  reason?: string;
};

export type CustomerProSiteVisitActionResponse = CustomerProRequestDetailResponse;

export type CreateCustomerProRequestResponse = CustomerProRequestDetailResponse & {
  nextActions: DetailNextAction[];
  uploadState?: {
    imageUploadRequired: boolean;
    maxImages: number;
    uploadedImagesCount: number;
  };
};

export type TaskSummary = {
  city: string;
  id: string;
  paymentState?: PaymentActionState;
  status: string;
  title: string;
};

export type TaskDetail = TaskSummary & {
  description: string;
  nextActions: NextAction[];
  timeline: {
    id: string;
    label: string;
    occurredAt: string;
  }[];
};

export type ProResponsePreview = {
  id: string;
  previewText: string;
  providerDisplayName: string;
  status: string;
};

export type ProRequestSummary = {
  city: string;
  id: string;
  responseCount: number;
  status: string;
  title: string;
  unlockAvailable: boolean;
};

export type ProRequestDetail = ProRequestSummary & {
  description: string;
  nextActions: NextAction[];
  responsePreviews: ProResponsePreview[];
};

export type ProviderCoreTaskSummary = {
  cancellationBlockedReason?: string | null;
  cancellationPolicySummary?: string;
  cancellationState?: CoreCancellationState;
  categoryLabel: string;
  cityLabel: string;
  customerPreviewLabel: string;
  disputeState?: CoreDisputeState;
  hasScheduleConflict?: boolean;
  id: string;
  messageThreadId?: string | null;
  nextAction: ProviderNextAction;
  nextActions: ProviderCoreTaskNextActions;
  paymentStatusLabel: string;
  priceLabel: string;
  providerBlockedReason?: string | null;
  providerCancellationState?: ProviderCoreIssueState;
  providerDisputeState?: ProviderCoreIssueState;
  providerIssueState?: ProviderCoreIssueState;
  providerIssueSummary?: string | null;
  providerSupportReviewLabel?: string | null;
  providerSupportState?: ProviderCoreIssueState;
  refundState?: CoreRefundState;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  status: string;
  statusLabel: string;
  supportReviewLabel?: string | null;
  supportState?: CoreSupportState;
  title: string;
  unreadMessagesCount: number;
};

export type ProviderCoreTasksResponse = {
  emptyState: EmptyStateContent;
  tasks: ProviderCoreTaskSummary[];
};

export type ProviderCoreTaskNextActions = {
  blockedReason?: string;
  blockedReasonCode?: string;
  canCancelOrReportIssue: boolean;
  canChat: boolean;
  canDisputeRejection: boolean;
  canExpressInterest: boolean;
  canMarkOnTheWay: boolean;
  canReportCannotAttend: boolean;
  canReportIssue: boolean;
  canRequestCompletion: boolean;
  canRequestProviderSupport: boolean;
  canStart: boolean;
  providerBlockedReason?: string;
  providerBlockedReasonCode?: string;
  primary?: {
    label: string;
    method?: 'POST';
    type: string;
  };
};

export type ProviderCoreTaskDetail = {
  addressPreviewLabel: string;
  cancellationBlockedReason?: string | null;
  cancellationPolicySummary?: string;
  cancellationState?: CoreCancellationState;
  categoryLabel: string;
  cityLabel: string;
  customerPreviewLabel: string;
  description: string;
  disputeState?: CoreDisputeState;
  hasScheduleConflict?: boolean;
  id: string;
  images: DetailImage[];
  messageThreadId?: string | null;
  nextActions: ProviderCoreTaskNextActions;
  paymentStatusLabel: string;
  priceLabel: string;
  providerBlockedReason?: string | null;
  providerCancellationState?: ProviderCoreIssueState;
  providerDisputeState?: ProviderCoreIssueState;
  providerIssueState?: ProviderCoreIssueState;
  providerIssueSummary?: string | null;
  providerSupportReviewLabel?: string | null;
  providerSupportState?: ProviderCoreIssueState;
  refundState?: CoreRefundState;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  scopeChecklist?: TaskScopeChecklistItem[];
  status: string;
  statusLabel: string;
  supportReviewLabel?: string | null;
  supportState?: CoreSupportState;
  timeline: DetailTimelineItem[];
  title: string;
};

export type ProviderCoreTaskDetailResponse = {
  task: ProviderCoreTaskDetail;
};

export type ExpressInterestInCoreTaskPayload = {
  toolsConfirmed?: boolean;
};

export type ExpressInterestInCoreTaskResponse = {
  alreadyInterested: boolean;
  task: ProviderCoreTaskDetail | null;
};

export type MarkProviderCoreTaskOnTheWayResponse = {
  onTheWayAt: string | null;
  task: ProviderCoreTaskDetail | null;
};

export type StartProviderCoreTaskResponse = {
  startedAt: string | null;
  task: ProviderCoreTaskDetail | null;
};

export type RequestProviderCoreTaskCompletionPayload = {
  note?: string;
};

export type RequestProviderCoreTaskCompletionResponse = {
  alreadyPending: boolean;
  task: ProviderCoreTaskDetail | null;
};

export type ProviderCoreIssueActionPayload = {
  details?: string;
  reason: string;
};

export type ProviderCoreIssueActionResponse = {
  alreadyUnderReview?: boolean;
  message?: string;
  nextActions: ProviderCoreTaskNextActions | null;
  providerBlockedReason?: string | null;
  providerCancellationState?: ProviderCoreIssueState | null;
  providerDisputeState?: ProviderCoreIssueState | null;
  providerIssueState?: ProviderCoreIssueState | null;
  providerIssueSummary?: string | null;
  providerSupportReviewLabel?: string | null;
  providerSupportState?: ProviderCoreIssueState | null;
  requestId?: string | null;
  task: ProviderCoreTaskDetail | null;
};

export type ProviderProRequestSummary = {
  categoryLabel: string;
  cityLabel: string;
  createdAt: string;
  id: string;
  isEligibleToRespond: boolean;
  nextAction: ProviderNextAction;
  proResponseBlockedReason?: string | null;
  proResponseBlockedReasonCode?: string | null;
  proResponseCapabilities?: ProviderProResponseCapabilities;
  proResponseState?: ProviderProResponseState;
  proResponseSummary?: ProviderProResponseSummary | null;
  responseStatusLabel: string;
  status: string;
  statusLabel: string;
  timelineLabel: string;
  title: string;
};

export type ProviderProRequestsResponse = {
  emptyState: EmptyStateContent;
  proRequests: ProviderProRequestSummary[];
};

export type ProviderProResponseSummary = {
  canEdit?: boolean;
  currency?: string;
  customerPreviewLabel?: string;
  hiddenFromCustomer?: boolean;
  id: string;
  materialsIncluded?: string;
  roughQuoteLabel: string;
  roughQuoteMax?: number | null;
  roughQuoteMin?: number | null;
  shortMessagePreview?: string | null;
  siteVisitPolicy?: string;
  status?: string;
  statusLabel: string;
  submittedAt: string;
  updatedAt?: string;
  visibilityLabel?: string;
};

export type ProviderProResponseCapabilities = {
  canEditResponse: boolean;
  canOpenProResponseForm: boolean;
  canSubmitResponse: boolean;
  canViewSubmittedResponse: boolean;
};

export type ProviderProResponseState = {
  badgeLabel: string;
  blockedReason: string | null;
  blockedReasonCode: string | null;
  capabilities: ProviderProResponseCapabilities;
  helperText: string;
  status: string;
  statusLabel: string;
};

export type ProviderProResponseEditDefaults = {
  assumptions: string | null;
  availability: string;
  currency: string;
  customerPreparationNotes: string | null;
  earliestStartDate: string | null;
  excludedNotes: string | null;
  includedNotes: string | null;
  materialsIncluded: string;
  roughQuoteMax: number | null;
  roughQuoteMin: number | null;
  shortMessage: string | null;
  siteVisitPolicy: string;
};

export type ProviderProResponsePayload = {
  assumptions?: string;
  availability?: string;
  currency?: string;
  customerPreparationNotes?: string;
  earliestStartDate?: string | null;
  excludedNotes?: string;
  includedNotes?: string;
  materialsIncluded?: boolean | null;
  roughQuoteMax?: number | null;
  roughQuoteMin?: number | null;
  shortMessage: string;
  siteVisitPolicy?: string;
};

export type ProviderProResponseMutationResponse = ProviderProRequestDetailResponse;

export type ProviderProSiteVisitAcceptPayload = {
  message?: string;
};

export type ProviderProSiteVisitDeclinePayload = {
  message?: string;
  reason?: string;
};

export type ProviderProSiteVisitProposeTimePayload = {
  message?: string;
  proposedDate?: string | null;
  proposedTimeWindow: string;
};

export type ProviderProSiteVisitActionResponse = ProviderProRequestDetailResponse;

export type EligibilitySummary = {
  isEligibleToRespond: boolean;
  reasonLabel: string;
};

export type ProviderProRequestDetail = {
  addressVisibilityState?: ProAddressVisibilityState;
  allowedContactFields?: string[];
  budgetLabel: string;
  categoryLabel: string;
  cityLabel: string;
  contactVisibilityState?: ProContactVisibilityState;
  createdAt: string;
  description: string;
  eligibility: EligibilitySummary;
  id: string;
  images: DetailImage[];
  myResponse: ProviderProResponseSummary | null;
  nextActions: DetailNextAction[];
  proResponseBlockedReason?: string | null;
  proResponseBlockedReasonCode?: string | null;
  proResponseCapabilities?: ProviderProResponseCapabilities;
  proResponseState?: ProviderProResponseState;
  proResponseSummary?: ProviderProResponseSummary | null;
  responseEditDefaults?: ProviderProResponseEditDefaults | null;
  siteVisitBlockedReason?: string | null;
  siteVisitBlockedReasonCode?: string | null;
  siteVisitInvites?: ProSiteVisitInviteSummary[];
  siteVisitNextActions?: ProSiteVisitNextActions;
  siteVisitState?: ProSiteVisitState;
  siteVisitSummary?: string;
  status: string;
  statusLabel: string;
  timelineLabel: string;
  title: string;
};

export type ProviderProRequestDetailResponse = {
  proRequest: ProviderProRequestDetail;
};

export type ProviderNextAction = {
  accent?: 'core' | 'neutral' | 'pro';
  href: string | null;
  label: string;
  type: string;
};

export type ProviderDashboardCard = {
  accent: 'core' | 'neutral' | 'pro' | 'warning';
  description: string;
  href: string | null;
  id: string;
  kind: 'core' | 'message' | 'profile' | 'pro' | 'verification';
  statusLabel: string;
  title: string;
};

export type ProviderDashboardSummary = {
  activeCoreTasksCount: number;
  availableCoreTasksCount: number;
  coreTaskerStatus: ProviderCapabilities['coreTaskerStatus'];
  displayName: string;
  matchingProRequestsCount: number;
  pendingCompletionCount: number;
  proStatus: ProviderCapabilities['proStatus'];
  reservedCoreTasksCount: number;
  submittedProResponsesCount: number;
  unreadMessagesCount: number;
};

export type ProviderDashboardResponse = {
  cards: ProviderDashboardCard[];
  nextActions: ProviderNextAction[];
  summary: ProviderDashboardSummary;
};

export type ProviderProCategoryStatus = {
  label: string;
  status: 'approved' | 'pending' | 'rejected' | string;
};

export type ProviderProfileSummary = {
  coreCategories: string[];
  coreCities: string[];
  coreTaskerStatus: ProviderCapabilities['coreTaskerStatus'];
  displayName: string;
  portfolioProjectsCount: number;
  proCategories: ProviderProCategoryStatus[];
  proCities: string[];
  proStatus: ProviderCapabilities['proStatus'];
  profileStrengthLabel: string;
  stripeStatusLabel: string;
};

export type ProviderProfileResponse = {
  nextActions: ProviderNextAction[];
  profile: ProviderProfileSummary;
};

export type MessageContextType = 'CORE_TASK' | 'OTHER' | 'PRO_REQUEST' | 'SUPPORT';
export type MessageAccent = 'core' | 'neutral' | 'pro';
export type MessageSenderRole = 'ADMIN' | 'CUSTOMER' | 'PRO' | 'SUPPORT' | 'SYSTEM' | 'TASKER';
export type MessageReadOnlyReason =
  | 'NOT_PARTICIPANT'
  | 'PRO_CHAT_NOT_AVAILABLE'
  | 'SUPPORT_READ_ONLY'
  | 'THREAD_CLOSED'
  | 'UNSUPPORTED_THREAD_TYPE';

export type MessageThreadCapabilities = {
  canRead: boolean;
  canSendAttachments: boolean;
  canSendText: boolean;
  readOnlyReason?: MessageReadOnlyReason;
};

export type MessageAttachment = {
  id: string;
  mimeType?: string;
  size?: number;
  type: 'image';
  url: string;
};

export type MessageThreadSummary = {
  accent: MessageAccent;
  capabilities: MessageThreadCapabilities;
  contextId?: string;
  contextType: MessageContextType;
  id: string;
  lastMessageAt?: string | null;
  lastMessagePreview?: string;
  otherParticipantName?: string;
  roleLabel?: string;
  statusLabel?: string;
  subtitle?: string;
  title: string;
  unreadCount?: number;
};

export type MessageThreadsResponse = {
  threads: MessageThreadSummary[];
};

export type MessageThreadMeta = {
  accent: MessageAccent;
  capabilities: MessageThreadCapabilities;
  contextId?: string;
  contextType: MessageContextType;
  id: string;
  subtitle?: string;
  title: string;
};

export type MessageItem = {
  attachments?: MessageAttachment[];
  body: string;
  createdAt: string;
  id: string;
  isMine: boolean;
  senderId: string;
  senderName: string;
  senderRole?: MessageSenderRole;
};

export type MessageThreadDetailResponse = {
  messages: MessageItem[];
  thread: MessageThreadMeta;
};

export type SendMessageResponse = {
  message: MessageItem & {
    attachments: MessageAttachment[];
    isMine: true;
  };
  thread?: {
    id: string;
    lastMessageAt?: string;
    lastMessagePreview?: string;
  };
};

export type NotificationPreferenceSummary = {
  channels: ('email' | 'push' | 'telegram')[];
  coreAlertsEnabled: boolean;
  proAlertsEnabled: boolean;
};

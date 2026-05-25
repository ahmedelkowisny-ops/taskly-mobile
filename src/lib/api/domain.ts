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
  categoryLabel: string;
  cityLabel: string;
  id: string;
  nextAction: CustomerNextAction;
  paymentStatusLabel: string;
  priceLabel: string;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  status: string;
  statusLabel: string;
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

export type CustomerTaskDetail = {
  addressPreviewLabel: string;
  categoryLabel: string;
  cityLabel: string;
  description: string;
  id: string;
  images: DetailImage[];
  nextActions: DetailNextAction[];
  paymentStatusLabel: string;
  priceLabel: string;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  status: string;
  statusLabel: string;
  taskerPreview: CustomerTaskerPreview | null;
  timeline: DetailTimelineItem[];
  title: string;
};

export type CustomerTaskDetailResponse = {
  task: CustomerTaskDetail;
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
  title: string;
};

export type CreateCustomerTaskResponse = CustomerTaskDetailResponse & {
  nextActions: DetailNextAction[];
  uploadState?: {
    imageUploadRequired: boolean;
    maxImages: number;
    uploadedImagesCount: number;
  };
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
  localImageCount?: number;
  timeline: string;
  title: string;
};

export type CustomerProRequestSummary = {
  categoryLabel: string;
  cityLabel: string;
  createdAt: string;
  id: string;
  isUnlocked: boolean;
  nextAction: CustomerNextAction;
  responsesCount: number;
  status: string;
  statusLabel: string;
  timelineLabel: string;
  title: string;
  unlockStatusLabel: string;
};

export type CustomerProRequestsResponse = {
  emptyState: EmptyStateContent;
  proRequests: CustomerProRequestSummary[];
};

export type CustomerProResponsePreview = {
  headline: string;
  id: string;
  isLocked: boolean;
  proDisplayName: string;
  roughQuoteLabel: string;
  statusLabel: string;
};

export type CustomerProRequestDetail = {
  budgetLabel: string;
  categoryLabel: string;
  cityLabel: string;
  createdAt: string;
  description: string;
  id: string;
  images: DetailImage[];
  isUnlocked: boolean;
  nextActions: DetailNextAction[];
  responsePreviews: CustomerProResponsePreview[];
  responsesCount: number;
  status: string;
  statusLabel: string;
  timelineLabel: string;
  title: string;
  unlockStatusLabel: string;
};

export type CustomerProRequestDetailResponse = {
  proRequest: CustomerProRequestDetail;
};

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
  categoryLabel: string;
  cityLabel: string;
  customerPreviewLabel: string;
  id: string;
  nextAction: ProviderNextAction;
  nextActions: ProviderCoreTaskNextActions;
  paymentStatusLabel: string;
  priceLabel: string;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  status: string;
  statusLabel: string;
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
  canExpressInterest: boolean;
  canMarkOnTheWay: boolean;
  canRequestCompletion: boolean;
  canStart: boolean;
  primary?: {
    label: string;
    method?: 'POST';
    type: string;
  };
};

export type ProviderCoreTaskDetail = {
  addressPreviewLabel: string;
  categoryLabel: string;
  cityLabel: string;
  customerPreviewLabel: string;
  description: string;
  id: string;
  images: DetailImage[];
  nextActions: ProviderCoreTaskNextActions;
  paymentStatusLabel: string;
  priceLabel: string;
  scheduledEndAt: string | null;
  scheduledStartAt: string | null;
  status: string;
  statusLabel: string;
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

export type ProviderProRequestSummary = {
  categoryLabel: string;
  cityLabel: string;
  createdAt: string;
  id: string;
  isEligibleToRespond: boolean;
  nextAction: ProviderNextAction;
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
  id: string;
  roughQuoteLabel: string;
  statusLabel: string;
  submittedAt: string;
};

export type EligibilitySummary = {
  isEligibleToRespond: boolean;
  reasonLabel: string;
};

export type ProviderProRequestDetail = {
  budgetLabel: string;
  categoryLabel: string;
  cityLabel: string;
  createdAt: string;
  description: string;
  eligibility: EligibilitySummary;
  id: string;
  images: DetailImage[];
  myResponse: ProviderProResponseSummary | null;
  nextActions: DetailNextAction[];
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

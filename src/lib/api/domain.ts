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
  city: string;
  id: string;
  status: string;
  title: string;
};

export type ProviderProRequestSummary = {
  city: string;
  id: string;
  status: string;
  title: string;
};

export type ProviderDashboardSummary = {
  coreTasksCount: number;
  nextActions: NextAction[];
  profileStrengthLabel: string;
  proRequestsCount: number;
  providerCapabilities: ProviderCapabilities;
  unreadMessagesCount: number;
};

export type MessageThreadSummary = {
  context: 'core' | 'pro';
  id: string;
  lastMessagePreview: string;
  title: string;
  unreadCount: number;
};

export type NotificationPreferenceSummary = {
  channels: ('email' | 'push' | 'telegram')[];
  coreAlertsEnabled: boolean;
  proAlertsEnabled: boolean;
};

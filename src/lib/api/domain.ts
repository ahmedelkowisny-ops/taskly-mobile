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

export type CustomerHomeSummary = {
  activeProRequestsCount: number;
  activeTasksCount: number;
  nextActions: NextAction[];
  unreadMessagesCount: number;
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

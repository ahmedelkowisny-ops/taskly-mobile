import { Locale } from '@/src/lib/i18n';

export type ApiError = {
  code: string;
  details?: unknown;
  message: string;
};

export type ApiResult<T> =
  | {
      data: T;
      ok: true;
      status: number;
    }
  | {
      error: ApiError;
      ok: false;
      status?: number;
    };

export type ApiRequestOptions = {
  authToken?: string;
  body?: unknown;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  signal?: AbortSignal;
  timeoutMs?: number;
};

export type AuthTokens = {
  accessToken: string;
  accessTokenExpiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: string;
};

export type LoginRequest = {
  deviceId?: string;
  deviceName?: string;
  email: string;
  password: string;
};

export type RefreshRequest = {
  deviceId?: string;
  deviceName?: string;
  refreshToken: string;
};

export type LoginResponse = {
  session: UserSession;
  tokens: AuthTokens;
};

export type RefreshResponse = LoginResponse;

export type LogoutResponse = {
  success: boolean;
};

export type WorkspaceAccess = {
  customer: boolean;
  provider: boolean;
};

export type ProviderCapabilities = {
  coreTaskerStatus: 'none' | 'applicant' | 'approved' | 'needsStripe';
  proStatus: 'none' | 'draft' | 'pending' | 'approved';
};

export type PermissionSummary = {
  canPostProRequest: boolean;
  canPostTask: boolean;
  canViewCoreTasks: boolean;
  canViewProRequests: boolean;
};

export type SessionNextActionType =
  | 'none'
  | 'complete_core_onboarding'
  | 'complete_stripe_verification'
  | 'continue_pro_application'
  | 'wait_for_pro_review';

export type SessionNextAction = {
  href: string | null;
  label: string | null;
  type: SessionNextActionType;
};

export type UserSession = {
  nextAction: SessionNextAction;
  permissions: PermissionSummary;
  providerCapabilities: ProviderCapabilities;
  user: {
    displayName: string;
    email: string;
    id: string;
    preferredLocale: Locale;
  };
  workspaceAccess: WorkspaceAccess;
};

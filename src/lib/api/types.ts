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

export type WorkspaceAccess = {
  customer: boolean;
  provider: boolean;
};

export type ProviderCapabilities = {
  coreTaskerStatus: 'none' | 'applicant' | 'approved' | 'needsStripe';
  proStatus: 'none' | 'draft' | 'pending' | 'approved';
};

export type UserSession = {
  providerCapabilities: ProviderCapabilities;
  user: {
    email: string;
    id: string;
    name: string;
    preferredLocale: Locale;
  };
  workspaceAccess: WorkspaceAccess;
};

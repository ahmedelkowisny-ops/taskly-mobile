import { Locale } from '@/src/lib/i18n';

export type ApiError = {
  code: string;
  message: string;
  status?: number;
};

export type ApiResult<T> =
  | {
      data: T;
      error?: never;
      ok: true;
    }
  | {
      data?: never;
      error: ApiError;
      ok: false;
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

import { Locale } from '@/src/lib/i18n';

export type MockSessionState =
  | 'guest'
  | 'customerOnly'
  | 'taskerApplicant'
  | 'taskerApproved'
  | 'proDraft'
  | 'proPending'
  | 'proApproved'
  | 'dualProvider';

export type CoreTaskerStatus = 'none' | 'applicant' | 'approved' | 'needsStripe';
export type ProStatus = 'none' | 'draft' | 'pending' | 'approved';

export type WorkspaceAccess = {
  customer: boolean;
  provider: boolean;
};

export type ProviderCapabilities = {
  coreTaskerStatus: CoreTaskerStatus;
  proStatus: ProStatus;
};

export type MockSession = {
  displayName: string;
  id: string;
  preferredLocale: Locale;
  providerCapabilities: ProviderCapabilities;
  state: MockSessionState;
  workspaceAccess: WorkspaceAccess;
};

export const mockSessions: Record<MockSessionState, MockSession> = {
  guest: {
    id: 'guest',
    displayName: 'Guest',
    state: 'guest',
    workspaceAccess: {
      customer: false,
      provider: false,
    },
    providerCapabilities: {
      coreTaskerStatus: 'none',
      proStatus: 'none',
    },
    preferredLocale: 'en',
  },
  customerOnly: {
    id: 'demo-customer',
    displayName: 'Ahmed',
    state: 'customerOnly',
    workspaceAccess: {
      customer: true,
      provider: false,
    },
    providerCapabilities: {
      coreTaskerStatus: 'none',
      proStatus: 'none',
    },
    preferredLocale: 'en',
  },
  taskerApplicant: {
    id: 'demo-tasker-applicant',
    displayName: 'Ahmed',
    state: 'taskerApplicant',
    workspaceAccess: {
      customer: true,
      provider: true,
    },
    providerCapabilities: {
      coreTaskerStatus: 'applicant',
      proStatus: 'none',
    },
    preferredLocale: 'en',
  },
  taskerApproved: {
    id: 'demo-tasker-approved',
    displayName: 'Ahmed',
    state: 'taskerApproved',
    workspaceAccess: {
      customer: true,
      provider: true,
    },
    providerCapabilities: {
      coreTaskerStatus: 'needsStripe',
      proStatus: 'none',
    },
    preferredLocale: 'en',
  },
  proDraft: {
    id: 'demo-pro-draft',
    displayName: 'Ahmed',
    state: 'proDraft',
    workspaceAccess: {
      customer: true,
      provider: true,
    },
    providerCapabilities: {
      coreTaskerStatus: 'none',
      proStatus: 'draft',
    },
    preferredLocale: 'en',
  },
  proPending: {
    id: 'demo-pro-pending',
    displayName: 'Ahmed',
    state: 'proPending',
    workspaceAccess: {
      customer: true,
      provider: true,
    },
    providerCapabilities: {
      coreTaskerStatus: 'none',
      proStatus: 'pending',
    },
    preferredLocale: 'en',
  },
  proApproved: {
    id: 'demo-pro-approved',
    displayName: 'Ahmed',
    state: 'proApproved',
    workspaceAccess: {
      customer: true,
      provider: true,
    },
    providerCapabilities: {
      coreTaskerStatus: 'none',
      proStatus: 'approved',
    },
    preferredLocale: 'en',
  },
  dualProvider: {
    id: 'demo-dual-provider',
    displayName: 'Ahmed',
    state: 'dualProvider',
    workspaceAccess: {
      customer: true,
      provider: true,
    },
    providerCapabilities: {
      coreTaskerStatus: 'needsStripe',
      proStatus: 'approved',
    },
    preferredLocale: 'en',
  },
};

export const mockAuth = {
  currentSession: mockSessions.dualProvider,
};

export type MockAuthState =
  | 'customer'
  | 'taskerApproved'
  | 'proDraft'
  | 'proPending'
  | 'proApproved'
  | 'dualProvider';

export type MockUser = {
  displayName: string;
  state: MockAuthState;
};

export const mockUsers: Record<MockAuthState, MockUser> = {
  customer: {
    displayName: 'Taskly Customer',
    state: 'customer',
  },
  taskerApproved: {
    displayName: 'Approved Core Tasker',
    state: 'taskerApproved',
  },
  proDraft: {
    displayName: 'Draft Pro Provider',
    state: 'proDraft',
  },
  proPending: {
    displayName: 'Pending Pro Provider',
    state: 'proPending',
  },
  proApproved: {
    displayName: 'Approved Pro Provider',
    state: 'proApproved',
  },
  dualProvider: {
    displayName: 'Dual Provider',
    state: 'dualProvider',
  },
};

export const mockAuth = {
  currentCustomer: mockUsers.customer,
  currentProvider: mockUsers.dualProvider,
};

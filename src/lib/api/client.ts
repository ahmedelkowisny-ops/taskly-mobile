export type ApiClientConfig = {
  baseUrl?: string;
  getAccessToken?: () => Promise<string | null> | string | null;
};

export type TasklyApiClient = {
  baseUrl: string | null;
  getAccessToken?: ApiClientConfig['getAccessToken'];
  status: 'not-connected';
};

export function getApiBaseUrl() {
  return process.env.EXPO_PUBLIC_TASKLY_API_BASE_URL ?? null;
}

export function createApiClient(config: ApiClientConfig = {}): TasklyApiClient {
  return {
    baseUrl: config.baseUrl ?? getApiBaseUrl(),
    getAccessToken: config.getAccessToken,
    status: 'not-connected',
  };
}

// TODO: Add typed request helpers after the mobile API contracts are approved.
// TODO: Add token/session handling without exposing sensitive backend decisions to mobile.

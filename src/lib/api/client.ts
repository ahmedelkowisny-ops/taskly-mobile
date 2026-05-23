import { assertApiBaseUrl, getApiBaseUrl } from './config';
import { ApiError, ApiRequestOptions, ApiResult } from './types';

export type ApiClientConfig = {
  baseUrl?: string | null;
  getAccessToken?: () => Promise<string | null> | string | null;
  timeoutMs?: number;
};

export type TasklyApiClient = {
  baseUrl: string | null;
  request: <T>(path: string, options?: ApiRequestOptions) => Promise<ApiResult<T>>;
};

const DEFAULT_TIMEOUT_MS = 15000;

function buildUrl(baseUrl: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  return `${baseUrl}${normalizedPath}`;
}

async function parseJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function getErrorFromPayload(payload: unknown, fallback: ApiError): ApiError {
  if (payload && typeof payload === 'object') {
    const maybeError = 'error' in payload ? (payload as { error?: unknown }).error : payload;

    if (maybeError && typeof maybeError === 'object') {
      const code = 'code' in maybeError ? String((maybeError as { code?: unknown }).code) : fallback.code;
      const message =
        'message' in maybeError ? String((maybeError as { message?: unknown }).message) : fallback.message;

      return {
        code,
        details: maybeError,
        message,
      };
    }
  }

  return fallback;
}

function createAbortSignal(signal: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs);

  const abortFromParent = () => controller.abort(signal?.reason);
  signal?.addEventListener('abort', abortFromParent, { once: true });

  return {
    cleanup: () => {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromParent);
    },
    signal: controller.signal,
  };
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  config: ApiClientConfig = {},
): Promise<ApiResult<T>> {
  const method = options.method ?? 'GET';
  const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const abort = createAbortSignal(options.signal, timeoutMs);

  try {
    const baseUrl = assertApiBaseUrl(config.baseUrl ?? getApiBaseUrl());
    const token = options.authToken ?? (config.getAccessToken ? await config.getAccessToken() : null);
    const hasBody = options.body !== undefined;

    const response = await fetch(buildUrl(baseUrl, path), {
      body: hasBody ? JSON.stringify(options.body) : undefined,
      headers: {
        Accept: 'application/json',
        ...(hasBody ? { 'Content-Type': 'application/json' } : null),
        ...(token ? { Authorization: `Bearer ${token}` } : null),
        ...options.headers,
      },
      method,
      signal: abort.signal,
    });

    const payload = await parseJsonSafely(response);

    if (response.ok) {
      return {
        data: payload as T,
        ok: true,
        status: response.status,
      };
    }

    const fallbackCode =
      response.status === 401 ? 'UNAUTHORIZED' : response.status === 403 ? 'FORBIDDEN' : 'HTTP_ERROR';

    return {
      error: getErrorFromPayload(payload, {
        code: fallbackCode,
        message: `Request failed with status ${response.status}`,
      }),
      ok: false,
      status: response.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network request failed';
    const isAbort = error instanceof Error && error.name === 'AbortError';
    const missingBaseUrl = error instanceof Error && error.message === 'Missing EXPO_PUBLIC_TASKLY_API_BASE_URL';

    return {
      error: {
        code: missingBaseUrl ? 'API_BASE_URL_MISSING' : isAbort ? 'REQUEST_ABORTED' : 'NETWORK_ERROR',
        details: error,
        message,
      },
      ok: false,
    };
  } finally {
    abort.cleanup();
  }
}

export function createApiClient(config: ApiClientConfig = {}): TasklyApiClient {
  return {
    baseUrl: config.baseUrl ?? getApiBaseUrl(),
    request: <T>(path: string, options?: ApiRequestOptions) => apiRequest<T>(path, options, config),
  };
}

import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import {
  getCurrentSession,
  loginWithEmailPassword,
  logoutMobileSession,
  registerMobileAccount,
  refreshMobileSession,
} from '@/src/lib/api/auth';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { ApiError, ApiResult, RegisterRequest, UserSession } from '@/src/lib/api/types';
import {
  clearAuthTokens,
  getAccessToken,
  getAuthTokens,
  getRefreshToken,
  saveAuthTokens,
} from '@/src/lib/auth/tokenStorage';
import { unregisterStoredNotificationToken } from '@/src/lib/notifications/mobileNotifications';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error' | 'demo';

export type AuthContextValue = {
  clearSession: () => void;
  error: ApiError | null;
  getValidAccessToken: () => Promise<string | null>;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<ApiResult<UserSession>>;
  logout: () => Promise<void>;
  register: (input: Omit<RegisterRequest, 'deviceName'>) => Promise<ApiResult<UserSession>>;
  refreshSession: () => Promise<void>;
  restoreStoredSession: () => Promise<void>;
  session: UserSession | null;
  status: AuthStatus;
  useDemoSession: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

function isUnauthenticatedError(error: ApiError, status?: number) {
  return status === 401 || error.code === 'UNAUTHORIZED';
}

function makeAuthError(code: string, message: string): ApiError {
  return { code, message };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [memoryAccessToken, setMemoryAccessToken] = useState<string | null>(null);

  const restoreStoredSession = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setIsDemoMode(false);

    const tokens = await getAuthTokens();

    if (tokens?.accessToken) {
      const sessionResult = await getCurrentSession({ authToken: tokens.accessToken });

      if (sessionResult.ok) {
        setMemoryAccessToken(tokens.accessToken);
        setSession(sessionResult.data);
        setStatus('authenticated');
        return;
      }
    }

    if (tokens?.refreshToken) {
      const refreshResult = await refreshMobileSession(tokens.refreshToken);

      if (refreshResult.ok) {
        await saveAuthTokens(refreshResult.data.tokens);
        setMemoryAccessToken(refreshResult.data.tokens.accessToken);
        setSession(refreshResult.data.session);
        setStatus('authenticated');
        return;
      }
    }

    if (tokens) {
      await clearAuthTokens();
      setMemoryAccessToken(null);
      setSession(null);
      setStatus('unauthenticated');
      return;
    }

    const cookieResult = await getCurrentSession();

    if (cookieResult.ok) {
      setMemoryAccessToken(null);
      setSession(cookieResult.data);
      setStatus('authenticated');
      return;
    }

    setSession(null);
    setMemoryAccessToken(null);
    setError(cookieResult.error);
    setStatus(isUnauthenticatedError(cookieResult.error, cookieResult.status) ? 'unauthenticated' : 'error');
  }, []);

  const refreshSession = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setIsDemoMode(false);

    const accessToken = await getAccessToken();
    const result = accessToken ? await getCurrentSession({ authToken: accessToken }) : await getCurrentSession();

    if (result.ok) {
      if (accessToken) {
        setMemoryAccessToken(accessToken);
      }
      setSession(result.data);
      setStatus('authenticated');
      return;
    }

    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const refreshResult = await refreshMobileSession(refreshToken);

      if (refreshResult.ok) {
        await saveAuthTokens(refreshResult.data.tokens);
        setMemoryAccessToken(refreshResult.data.tokens.accessToken);
        setSession(refreshResult.data.session);
        setStatus('authenticated');
        return;
      }

      await clearAuthTokens();
    }

    setSession(null);
    setMemoryAccessToken(null);
    setError(result.error);
    setStatus(isUnauthenticatedError(result.error, result.status) ? 'unauthenticated' : 'error');
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<ApiResult<UserSession>> => {
    setStatus('loading');
    setError(null);
    setIsDemoMode(false);

    const result = await loginWithEmailPassword({
      deviceName: 'Taskly mobile',
      email,
      password,
    });

    if (!result.ok) {
      setSession(null);
      setMemoryAccessToken(null);
      setError(result.error);
      setStatus(isUnauthenticatedError(result.error, result.status) ? 'unauthenticated' : 'error');
      return result;
    }

    const stored = await saveAuthTokens(result.data.tokens);

    if (!stored) {
      // Browser previews may not have SecureStore. Keep the authenticated session in memory.
      setError(makeAuthError('TOKEN_STORAGE_UNAVAILABLE', 'Secure token storage is unavailable on this device.'));
    }

    setSession(result.data.session);
    setMemoryAccessToken(result.data.tokens.accessToken);
    setStatus('authenticated');

    return {
      data: result.data.session,
      ok: true,
      status: result.status,
    };
  }, []);

  const register = useCallback(async (input: Omit<RegisterRequest, 'deviceName'>): Promise<ApiResult<UserSession>> => {
    setStatus('loading');
    setError(null);
    setIsDemoMode(false);

    const result = await registerMobileAccount({
      ...input,
      deviceName: 'Taskly mobile',
    });

    if (!result.ok) {
      setSession(null);
      setMemoryAccessToken(null);
      setError(result.error);
      setStatus(isUnauthenticatedError(result.error, result.status) ? 'unauthenticated' : 'error');
      return result;
    }

    const stored = await saveAuthTokens(result.data.tokens);

    if (!stored) {
      setError(makeAuthError('TOKEN_STORAGE_UNAVAILABLE', 'Secure token storage is unavailable on this device.'));
    }

    setSession(result.data.session);
    setMemoryAccessToken(result.data.tokens.accessToken);
    setStatus('authenticated');

    return {
      data: result.data.session,
      ok: true,
      status: result.status,
    };
  }, []);

  const getValidAccessToken = useCallback(async () => {
    const accessToken = memoryAccessToken ?? (await getAccessToken());

    if (accessToken) {
      const sessionResult = await getCurrentSession({ authToken: accessToken });

      if (sessionResult.ok) {
        setSession(sessionResult.data);
        setStatus('authenticated');
        setError(null);
        setIsDemoMode(false);
        setMemoryAccessToken(accessToken);
        return accessToken;
      }

      if (!isUnauthenticatedError(sessionResult.error, sessionResult.status)) {
        setError(sessionResult.error);
        return accessToken;
      }
    }

    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    const refreshResult = await refreshMobileSession(refreshToken);

    if (!refreshResult.ok) {
      await clearAuthTokens();
      setSession(null);
      setError(refreshResult.error);
      setStatus(isUnauthenticatedError(refreshResult.error, refreshResult.status) ? 'unauthenticated' : 'error');
      setIsDemoMode(false);
      return null;
    }

    await saveAuthTokens(refreshResult.data.tokens);
    setSession(refreshResult.data.session);
    setStatus('authenticated');
    setError(null);
    setIsDemoMode(false);
    setMemoryAccessToken(refreshResult.data.tokens.accessToken);

    return refreshResult.data.tokens.accessToken;
  }, [memoryAccessToken]);

  const logout = useCallback(async () => {
    const accessToken = memoryAccessToken ?? (await getAccessToken());
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      await logoutMobileSession(refreshToken);
    }

    await unregisterStoredNotificationToken(accessToken);
    await clearAuthTokens();
    setMemoryAccessToken(null);
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
    setIsDemoMode(false);
  }, [memoryAccessToken]);

  const useDemoSession = useCallback(() => {
    void clearAuthTokens();
    setMemoryAccessToken(null);
    setSession(getMockUserSession());
    setStatus('demo');
    setError(null);
    setIsDemoMode(true);
  }, []);

  const clearSession = useCallback(() => {
    void clearAuthTokens();
    setMemoryAccessToken(null);
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
    setIsDemoMode(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      await restoreStoredSession();

      if (!mounted) {
        return;
      }
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, [restoreStoredSession]);

  const value = useMemo(
    () => ({
      clearSession,
      error,
      getValidAccessToken,
      isDemoMode,
      login,
      logout,
      register,
      refreshSession,
      restoreStoredSession,
      session,
      status,
      useDemoSession,
    }),
    [
      clearSession,
      error,
      getValidAccessToken,
      isDemoMode,
      login,
      logout,
      register,
      refreshSession,
      restoreStoredSession,
      session,
      status,
      useDemoSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

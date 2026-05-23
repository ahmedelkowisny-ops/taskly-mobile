import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import {
  getCurrentSession,
  loginWithEmailPassword,
  logoutMobileSession,
  refreshMobileSession,
} from '@/src/lib/api/auth';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { ApiError, ApiResult, UserSession } from '@/src/lib/api/types';
import {
  clearAuthTokens,
  getAccessToken,
  getAuthTokens,
  getRefreshToken,
  saveAuthTokens,
} from '@/src/lib/auth/tokenStorage';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error' | 'demo';

export type AuthContextValue = {
  clearSession: () => void;
  error: ApiError | null;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<ApiResult<UserSession>>;
  logout: () => Promise<void>;
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

  const restoreStoredSession = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setIsDemoMode(false);

    const tokens = await getAuthTokens();

    if (tokens?.accessToken) {
      const sessionResult = await getCurrentSession({ authToken: tokens.accessToken });

      if (sessionResult.ok) {
        setSession(sessionResult.data);
        setStatus('authenticated');
        return;
      }
    }

    if (tokens?.refreshToken) {
      const refreshResult = await refreshMobileSession(tokens.refreshToken);

      if (refreshResult.ok) {
        await saveAuthTokens(refreshResult.data.tokens);
        setSession(refreshResult.data.session);
        setStatus('authenticated');
        return;
      }
    }

    if (tokens) {
      await clearAuthTokens();
      setSession(null);
      setStatus('unauthenticated');
      return;
    }

    const cookieResult = await getCurrentSession();

    if (cookieResult.ok) {
      setSession(cookieResult.data);
      setStatus('authenticated');
      return;
    }

    setSession(null);
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
      setSession(result.data);
      setStatus('authenticated');
      return;
    }

    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      const refreshResult = await refreshMobileSession(refreshToken);

      if (refreshResult.ok) {
        await saveAuthTokens(refreshResult.data.tokens);
        setSession(refreshResult.data.session);
        setStatus('authenticated');
        return;
      }

      await clearAuthTokens();
    }

    setSession(null);
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
    setStatus('authenticated');

    return {
      data: result.data.session,
      ok: true,
      status: result.status,
    };
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();

    if (refreshToken) {
      await logoutMobileSession(refreshToken);
    }

    await clearAuthTokens();
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
    setIsDemoMode(false);
  }, []);

  const useDemoSession = useCallback(() => {
    void clearAuthTokens();
    setSession(getMockUserSession());
    setStatus('demo');
    setError(null);
    setIsDemoMode(true);
  }, []);

  const clearSession = useCallback(() => {
    void clearAuthTokens();
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
      isDemoMode,
      login,
      logout,
      refreshSession,
      restoreStoredSession,
      session,
      status,
      useDemoSession,
    }),
    [clearSession, error, isDemoMode, login, logout, refreshSession, restoreStoredSession, session, status, useDemoSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

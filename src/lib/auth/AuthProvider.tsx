import { ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { getCurrentSession } from '@/src/lib/api/auth';
import { getMockUserSession } from '@/src/lib/api/mockApi';
import { ApiError, UserSession } from '@/src/lib/api/types';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated' | 'error' | 'demo';

export type AuthContextValue = {
  clearSession: () => void;
  error: ApiError | null;
  isDemoMode: boolean;
  refreshSession: () => Promise<void>;
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<ApiError | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const refreshSession = useCallback(async () => {
    setStatus('loading');
    setError(null);
    setIsDemoMode(false);

    const result = await getCurrentSession();

    if (result.ok) {
      setSession(result.data);
      setStatus('authenticated');
      return;
    }

    setSession(null);
    setError(result.error);
    setStatus(isUnauthenticatedError(result.error, result.status) ? 'unauthenticated' : 'error');
  }, []);

  const useDemoSession = useCallback(() => {
    setSession(getMockUserSession());
    setStatus('demo');
    setError(null);
    setIsDemoMode(true);
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    setStatus('unauthenticated');
    setError(null);
    setIsDemoMode(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const result = await getCurrentSession();

      if (!mounted) {
        return;
      }

      if (result.ok) {
        setSession(result.data);
        setStatus('authenticated');
        setError(null);
        setIsDemoMode(false);
        return;
      }

      setSession(null);
      setError(result.error);
      setStatus(isUnauthenticatedError(result.error, result.status) ? 'unauthenticated' : 'error');
      setIsDemoMode(false);
    }

    void checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      clearSession,
      error,
      isDemoMode,
      refreshSession,
      session,
      status,
      useDemoSession,
    }),
    [clearSession, error, isDemoMode, refreshSession, session, status, useDemoSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

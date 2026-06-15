'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { AuthUserResponse, LoginInput, LoginResponse } from '@gestion-granjas/shared/schemas/seguridad.schemas';
import { apiFetch, getApiErrorMessage } from '@/lib/api-client';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/auth-storage';

type AuthContextValue = {
  user: AuthUserResponse | null;
  isLoading: boolean;
  login: (input: LoginInput, redirectTo?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  setGranjaActiva: (granjaId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const applySession = useCallback((session: LoginResponse) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const session = await apiFetch<LoginResponse>('/auth/refresh', {
        method: 'POST',
        skipAuth: true,
      });
      applySession(session);
      return true;
    } catch {
      clearAccessToken();
      setUser(null);
      return false;
    }
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      await refreshSession();
      if (!cancelled) setIsLoading(false);
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const login = useCallback(
    async (input: LoginInput, redirectTo = '/dashboard') => {
      const session = await apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
        skipAuth: true,
      });
      applySession(session);
      const safePath =
        redirectTo.startsWith('/') && !redirectTo.startsWith('//') ? redirectTo : '/dashboard';
      router.replace(safePath);
    },
    [applySession, router],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore logout errors locally
    } finally {
      clearAccessToken();
      setUser(null);
      router.replace('/login');
    }
  }, [router]);

  const setGranjaActiva = useCallback(
    async (granjaId: string) => {
      const session = await apiFetch<LoginResponse>('/auth/granja-activa', {
        method: 'PATCH',
        body: JSON.stringify({ granjaId }),
      });
      applySession(session);
    },
    [applySession],
  );

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshSession, setGranjaActiva }),
    [user, isLoading, login, logout, refreshSession, setGranjaActiva],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}

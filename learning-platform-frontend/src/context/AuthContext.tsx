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
import { ApiError, apiFetch } from '@/lib/api';
import type { AuthenticatedUser } from '@/lib/diagnostic-types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthenticatedUser>;
  register: (
    name: string,
    email: string,
    password: string,
  ) => Promise<AuthenticatedUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await apiFetch<{ user: AuthenticatedUser }>('/api/auth/me');
      setUser(response.user);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error('Unable to restore the authenticated session.', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const restoreSession = async () => {
      await refreshAuth();
    };
    void restoreSession();
  }, [refreshAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshAuth,
      login: async (email, password) => {
        const response = await apiFetch<{ user: AuthenticatedUser }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setUser(response.user);
        return response.user;
      },
      register: async (name, email, password) => {
        const response = await apiFetch<{ user: AuthenticatedUser }>(
          '/api/auth/register',
          {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
          },
        );
        setUser(response.user);
        return response.user;
      },
      logout: async () => {
        await apiFetch<{ loggedOut: boolean }>('/api/auth/logout', {
          method: 'POST',
        });
        setUser(null);
      },
    }),
    [loading, refreshAuth, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return context;
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiFetch, clearApiMemoryCache } from "@/lib/api";
import type { AuthenticatedUser } from "@/lib/diagnostic-types";

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
    // Only a genuine 401 means "signed out". Transient failures (backend
    // restarting, a network blip) must NOT drop an active session — otherwise
    // a momentary hiccup bounces the learner to /login mid-flow.
    const maxAttempts = 4;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await apiFetch<{ user: AuthenticatedUser }>(
          "/api/auth/me",
        );
        setUser(response.user);
        setLoading(false);
        return;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearApiMemoryCache();
          setUser(null);
          setLoading(false);
          return;
        }
        // Transient (network / 5xx): retry with backoff, keep any existing user.
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 600 * attempt));
          continue;
        }
        console.warn(
          "Auth check failed transiently; keeping current session.",
          error,
        );
        setLoading(false);
      }
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
        clearApiMemoryCache();
        const response = await apiFetch<{ user: AuthenticatedUser }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
          },
        );
        setUser(response.user);
        return response.user;
      },
      register: async (name, email, password) => {
        clearApiMemoryCache();
        const response = await apiFetch<{ user: AuthenticatedUser }>(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
          },
        );
        setUser(response.user);
        return response.user;
      },
      logout: async () => {
        await apiFetch<{ loggedOut: boolean }>("/api/auth/logout", {
          method: "POST",
        });
        clearApiMemoryCache();
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
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}

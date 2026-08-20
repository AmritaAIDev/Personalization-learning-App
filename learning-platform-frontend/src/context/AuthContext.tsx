"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  LEARNING_DATA_UPDATED_EVENT,
  apiFetch,
  clearApiMemoryCache,
} from "@/lib/api";
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
  const [xpToast, setXpToast] = useState<number | null>(null);
  const lastXpRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const updateUser = useCallback((next: AuthenticatedUser | null) => {
    if (next) {
      const previousXp = lastXpRef.current;
      if (previousXp !== null && next.xp > previousXp) {
        setXpToast(next.xp - previousXp);
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => {
          setXpToast(null);
          toastTimerRef.current = null;
        }, 2200);
      }
      lastXpRef.current = next.xp;
    } else {
      lastXpRef.current = null;
      setXpToast(null);
    }
    setUser(next);
  }, []);

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
        updateUser(response.user);
        setLoading(false);
        return;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearApiMemoryCache();
          updateUser(null);
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
  }, [updateUser]);

  useEffect(() => {
    const restoreSession = async () => {
      await refreshAuth();
    };
    void restoreSession();
  }, [refreshAuth]);

  useEffect(() => {
    const refreshUserStats = () => void refreshAuth();
    window.addEventListener(LEARNING_DATA_UPDATED_EVENT, refreshUserStats);
    return () =>
      window.removeEventListener(LEARNING_DATA_UPDATED_EVENT, refreshUserStats);
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
        updateUser(response.user);
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
        updateUser(response.user);
        return response.user;
      },
      logout: async () => {
        await apiFetch<{ loggedOut: boolean }>("/api/auth/logout", {
          method: "POST",
        });
        clearApiMemoryCache();
        updateUser(null);
      },
    }),
    [loading, refreshAuth, updateUser, user],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {xpToast ? (
        <div
          className="fixed right-4 top-4 z-[80] rounded-2xl border border-primary/20 bg-ink-solid px-4 py-3 text-sm font-bold text-white shadow-[0_18px_40px_rgba(20,20,30,0.24)] animate-rise"
          role="status"
          aria-live="polite"
        >
          +{xpToast} XP saved
        </div>
      ) : null}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }
  return context;
}

import { create } from "zustand";
import env from "@/config/env";
import type { User, UserRole } from "@/shared/types";

const AUTH_TOKEN_KEY = "auth_token";
const AUTH_USER_KEY = "auth_user";

interface LoginResponse {
  token: string;
  user: {
    id: string | number;
    email: string;
    role: UserRole;
    full_name?: string;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

function persistSession(token: string, user: User) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
  window.localStorage.removeItem(AUTH_USER_KEY);
}

function mapUser(apiUser: LoginResponse["user"]): User {
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    role: apiUser.role,
    clinicId: "default",
    fullName: apiUser.full_name || "",
  };
}

async function fetchAuth<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload?.success || payload.data === undefined) {
    throw new Error(payload?.error || "Authentication request failed");
  }

  return payload.data;
}

const initialUser = getStoredUser();
const initialToken = getStoredToken();

export const useAuth = create<AuthStore>((set) => ({
  isAuthenticated: Boolean(initialToken && initialUser),
  isLoading: false,
  user: initialUser,
  login: async (email: string, password: string) => {
    if (!email.trim() || !password.trim()) return false;

    set({ isLoading: true });
    try {
      const data = await fetchAuth<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const user = mapUser(data.user);
      persistSession(data.token, user);
      set({ isAuthenticated: true, user, isLoading: false });
      return true;
    } catch {
      clearSession();
      set({ isAuthenticated: false, user: null, isLoading: false });
      return false;
    }
  },
  logout: async () => {
    const token = getStoredToken();

    try {
      await fetch(`${env.apiBaseUrl}/auth/logout`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
    } finally {
      clearSession();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },
  hydrate: async () => {
    const token = getStoredToken();
    if (!token) {
      clearSession();
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const data = await fetchAuth<LoginResponse["user"]>("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user = mapUser(data);
      persistSession(token, user);
      set({ isAuthenticated: true, user, isLoading: false });
    } catch {
      clearSession();
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  },
}));

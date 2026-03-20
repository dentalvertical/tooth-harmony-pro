import { create } from 'zustand';
import env from '@/config/env';
import type { User, UserRole } from '@/shared/types';

interface LoginResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      id: string;
      email: string;
      role: UserRole;
      full_name?: string;
    };
  };
  error?: string;
}

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

function loadStoredUser(): User | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem('auth_user');
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function loadStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('auth_token');
}

function storeAuth(token: string, user: User) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('auth_token', token);
  window.localStorage.setItem('auth_user', JSON.stringify(user));
}

function clearAuth() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('auth_token');
  window.localStorage.removeItem('auth_user');
}

const initialToken = loadStoredToken();
const initialUser = loadStoredUser();

export const useAuth = create<AuthStore>((set) => ({
  isAuthenticated: Boolean(initialToken && initialUser),
  user: initialUser,
  token: initialToken,
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${env.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json().catch(() => null)) as LoginResponse | null;
      if (!response.ok || !payload?.success || !payload.data) {
        return false;
      }

      const user: User = {
        id: payload.data.user.id,
        email: payload.data.user.email,
        role: payload.data.user.role,
        clinicId: 'clinic-1',
        fullName: payload.data.user.full_name,
      };

      storeAuth(payload.data.token, user);
      set({
        isAuthenticated: true,
        user,
        token: payload.data.token,
      });
      return true;
    } catch {
      return false;
    }
  },
  logout: () => {
    clearAuth();
    set({ isAuthenticated: false, user: null, token: null });
  },
}));

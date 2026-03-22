import { create } from 'zustand';
import type { User } from '@/shared/types';

interface AuthStore {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (email: string, _password: string) => {
    if (email && _password) {
      set({
        isAuthenticated: true,
        user: { email, role: 'admin', clinicId: 'clinic-1' },
      });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false, user: null }),
}));
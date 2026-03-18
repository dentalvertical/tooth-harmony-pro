import { create } from 'zustand';

interface AuthStore {
  isAuthenticated: boolean;
  user: { email: string; role: string; clinicId: string } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuth = create<AuthStore>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (email: string, _password: string) => {
    // Mock authentication
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

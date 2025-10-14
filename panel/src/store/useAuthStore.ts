import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';

interface User {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  avatar: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      setUser: (user) => set({ user }),

      login: async (token: string) => {
        localStorage.setItem('token', token);
        set({ token });
        
        try {
          const { data } = await authApi.getMe();
          set({ user: data, isLoading: false });
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
        window.location.href = '/login';
      },

      checkAuth: async () => {
        const token = get().token || localStorage.getItem('token');
        
        if (!token) {
          set({ isLoading: false, user: null, token: null });
          return;
        }

        try {
          const { data } = await authApi.getMe();
          set({ user: data, token, isLoading: false });
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, token: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage', // Clé dans localStorage
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
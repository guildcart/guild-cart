import { create } from 'zustand';
import { authApi } from '../lib/api';

interface User {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
}

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user }),

  login: async (token: string) => {
    localStorage.setItem('token', token);
    try {
      const { data } = await authApi.getMe();
      set({ user: data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const { data } = await authApi.getMe();
      set({ user: data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, isLoading: false });
    }
  },
}));
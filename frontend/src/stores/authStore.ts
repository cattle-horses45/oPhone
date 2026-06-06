import { create } from 'zustand';
import type { User, LoginRequest, RegisterRequest } from '../types/user';
import * as authApi from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  updateProfile: (data: { email?: string; phone?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('ophone_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('ophone_token'),
  isAuthenticated: !!localStorage.getItem('ophone_token'),
  isLoading: false,

  login: async (data: LoginRequest) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(data);
      localStorage.setItem('ophone_token', res.access_token);
      localStorage.setItem('ophone_user', JSON.stringify(res.user));
      set({
        token: res.access_token,
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true });
    try {
      await authApi.register(data);
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('ophone_token');
    localStorage.removeItem('ophone_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    if (!get().token) return;
    set({ isLoading: true });
    try {
      const user = await authApi.getMe();
      localStorage.setItem('ophone_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      // Token might be expired
      get().logout();
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const user = await authApi.updateMe(data);
    localStorage.setItem('ophone_user', JSON.stringify(user));
    set({ user });
  },
}));

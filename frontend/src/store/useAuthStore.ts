import { create } from 'zustand';
import api from '../lib/api';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  status?: string;
  full_name?: string | null;
  mobile?: string | null;
  bio?: string | null;
  created_at?: string;
}

interface AuthState {
  user: UserProfile | null;
  role: string | null;
  token: string | null;
  theme: 'dark' | 'light';
  isLoading: boolean;
  error: string | null;

  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  updateProfile: (data: { full_name?: string; mobile?: string; bio?: string }) => Promise<void>;
  setTheme: (t: 'dark' | 'light') => void;
}

const readStoredUser = (): UserProfile | null => {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) as UserProfile : null;
};

const persistUser = (user: UserProfile | null) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: readStoredUser(),
  role: localStorage.getItem('role'),
  token: localStorage.getItem('token'),
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const body = new URLSearchParams();
      body.set('username', credentials.username);
      body.set('password', credentials.password);

      const response = await api.post('/auth/login', body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      localStorage.setItem('token', response.data.access_token);
      localStorage.setItem('role', response.data.role);

      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${response.data.access_token}` },
      });

      persistUser(meResponse.data);
      set({
        token: response.data.access_token,
        role: response.data.role,
        user: meResponse.data,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Login failed', isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await api.post('/auth/register', data);
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.detail || 'Registration failed', isLoading: false });
      throw err;
    }
  },

  fetchMe: async () => {
    try {
      const response = await api.get('/auth/me');
      persistUser(response.data);
      set({ user: response.data, role: response.data.role, error: null });
    } catch {
      set({ user: readStoredUser() });
    }
  },

  updateProfile: async (data) => {
    const response = await api.put('/auth/me/profile', data);
    persistUser(response.data);
    set({ user: response.data, role: response.data.role, error: null });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    persistUser(null);
    set({ token: null, role: null, user: null });
    window.location.href = '/login';
  },

  setTheme: (t) => {
    localStorage.setItem('theme', t);
    set({ theme: t });
  },
}));

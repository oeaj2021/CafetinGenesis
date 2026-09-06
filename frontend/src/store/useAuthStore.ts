import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => {
  const savedUser = localStorage.getItem('genesis_user');
  const savedToken = localStorage.getItem('genesis_token');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    isAuthenticated: !!savedToken,
    setAuth: (user, token) => {
      localStorage.setItem('genesis_user', JSON.stringify(user));
      localStorage.setItem('genesis_token', token);
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('genesis_user');
      localStorage.removeItem('genesis_token');
      set({ user: null, token: null, isAuthenticated: false });
    }
  };
});

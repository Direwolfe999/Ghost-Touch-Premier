import { create } from 'zustand';

const API = 'http://localhost:3001/api';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('gt_user') || 'null'),
  token: localStorage.getItem('gt_token') || null,

  signup: async ({ name, email, password, role }) => {
    const res = await fetch(`${API}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    localStorage.setItem('gt_token', data.token);
    localStorage.setItem('gt_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    return data.user;
  },

  login: async ({ email, password }) => {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('gt_token', data.token);
    localStorage.setItem('gt_user', JSON.stringify(data.user));
    set({ user: data.user, token: data.token });
    return data.user;
  },

  logout: () => {
    localStorage.removeItem('gt_token');
    localStorage.removeItem('gt_user');
    set({ user: null, token: null });
  },
}));

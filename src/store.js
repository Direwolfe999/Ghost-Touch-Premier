import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      userRole: null,
      userName: '',
      roomCode: '',
      user: null,
      token: null,
      setUser: (role, name) => set({ userRole: role, userName: name }),
      setRoomCode: (code) => set({ roomCode: code }),
      setAuth: (user, token) =>
        set({
          user,
          token,
          userRole: user.role,
          userName: user.name,
        }),
      clearAuth: () =>
        set({ user: null, token: null, userRole: null, userName: '', roomCode: '' }),
      clearStore: () =>
        set({ userRole: null, userName: '', roomCode: '', user: null, token: null }),
    }),
    {
      name: 'gt-auth-storage',
    }
  )
);

import { create } from 'zustand';

export type Role = 'WARGA' | 'RELAWAN' | 'ADMIN';

export interface AuthUser {
  id: string;
  nama: string;
  kontak: string;
  role: Role;
  dusun?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  keahlian?: string[];
  ketersediaan?: string | null;
  tanggalLahir?: string | null;
  kategoriUsia?: 'PEMUDA_18_30' | 'DEWASA' | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean; // sudah dicoba restore sesi via /auth/refresh saat load
  setSession: (user: AuthUser, accessToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  clearSession: () => void;
  setInitialized: () => void;
}

// PENTING: Access Token disimpan di sini (in-memory), BUKAN di localStorage,
// untuk mengurangi risiko pencurian token lewat XSS. Refresh Token sepenuhnya
// dikelola lewat httpOnly cookie oleh backend, tidak pernah terekspos ke JS.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setSession: (user, accessToken) => set({ user, accessToken }),
  updateUser: (user) => set((state) => ({ user: state.user ? { ...state.user, ...user } : null })),
  clearSession: () => set({ user: null, accessToken: null }),
  setInitialized: () => set({ isInitialized: true }),
}));

import { create } from 'zustand';

export type Role = 'PELAJAR' | 'PENGGERAK' | 'ADMIN';
export type ThemePreference = 'LIGHT' | 'DARK';

function applyTheme(theme: ThemePreference) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'DARK');
  try {
    window.localStorage.setItem('guyub-theme', theme);
  } catch {
    // Storage may be disabled by browser policy.
  }
}

export interface AuthUser {
  id: string;
  nama: string;
  email: string;
  role: Role;
  onboardingDone?: boolean;
  dusun?: string | null;
  kabupatenKota?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  keahlian?: string[];
  ketersediaan?: string | null;
  tanggalLahir?: string | null;
  kategoriUsia?: 'PEMUDA_18_30' | 'DEWASA' | null;
  themePreference?: ThemePreference;
  kontak?: string | null;
  bingkaiAktif?: string | null;
  bingkaiDimiliki?: string[];
  bingkaiGaya?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isInitialized: boolean; // sudah dicoba restore sesi via /auth/refresh saat load
  setSession: (user: AuthUser, accessToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setThemePreference: (theme: ThemePreference) => void;
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
  setSession: (user, accessToken) => {
    const themePreference = user.themePreference ?? 'LIGHT';
    applyTheme(themePreference);
    set({ user: { ...user, themePreference }, accessToken });
  },
  updateUser: (user) => set((state) => {
    const updatedUser = state.user ? { ...state.user, ...user } : null;
    if (user.themePreference) applyTheme(user.themePreference);
    return { user: updatedUser };
  }),
  setThemePreference: (themePreference) => {
    applyTheme(themePreference);
    set((state) => ({ user: state.user ? { ...state.user, themePreference } : null }));
  },
  clearSession: () => {
    applyTheme('LIGHT');
    set({ user: null, accessToken: null });
  },
  setInitialized: () => set({ isInitialized: true }),
}));

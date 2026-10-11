'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';

// Karena Access Token hanya hidup di memory, saat halaman di-refresh state-nya hilang.
// Provider ini mencoba memulihkan sesi lewat httpOnly Refresh Token cookie yang masih ada.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setSession = useAuthStore((s) => s.setSession);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    api
      .post('/auth/refresh')
      .then((res) => {
        if (mounted) setSession(res.data.user, res.data.accessToken);
      })
      .catch(() => {
        // tidak ada sesi valid, biarkan user login manual
      })
      .finally(() => {
        if (mounted) {
          setInitialized();
          setChecked(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [setSession, setInitialized]);

  if (!checked && !isInitialized) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-guyub-krem">
        <img src="/logo.png" alt="Logo" className="mb-3 h-16 w-16" />
        <p className="font-body text-guyub-bambuDark">Memuat…</p>
      </div>
    );
  }

  return <>{children}</>;
}

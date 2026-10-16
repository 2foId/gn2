'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      setSession(res.data.user, res.data.accessToken);
      router.push('/dashboard/peta');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal masuk, periksa kembali data Anda');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-guyub-krem px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-guyub-bambuDark">
          Guyub Ngapak
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
        </Link>
        <h1 className="mt-6 font-display text-2xl font-semibold text-guyub-bambuDark">
          Masuk ke akun Anda
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body focus:border-guyub-bambu focus:outline-none focus:ring-1 focus:ring-guyub-bambu"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body focus:border-guyub-bambu focus:outline-none focus:ring-1 focus:ring-guyub-bambu"
            />
          </div>

          {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Masuk'}
          </button>
        </form>

        <p className="mt-4 text-center font-body text-sm text-stone-600">
          Belum punya akun?{' '}
          <Link href="/register" className="font-medium text-guyub-bambuDark underline">
            Daftar di sini
          </Link>
        </p>
        <p className="mt-2 text-center font-body text-sm text-stone-600">
          <Link href="/forgot-password" className="font-medium text-guyub-bambuDark underline">
            Lupa password
          </Link>
        </p>
      </div>
    </main>
  );
}

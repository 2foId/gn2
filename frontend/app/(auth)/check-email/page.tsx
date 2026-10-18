'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function CheckEmailPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleResend(event: React.FormEvent) {
    event.preventDefault();
    setStatus('idle');
    setLoading(true);
    try {
      const response = await api.post('/auth/resend-verification', { email });
      setStatus('sent');
      setMessage(response.data.message);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message ?? 'Email verifikasi gagal dikirim. Coba lagi.');
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
          Cek email kamu
        </h1>
        <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm">
          <p className="font-body text-sm text-stone-600">
            Kami mengirim tautan verifikasi setelah pendaftaran. Kamu bisa meminta tautan baru di sini.
          </p>
          <form onSubmit={handleResend} className="mt-5 space-y-4">
            <div>
              <label htmlFor="email" className="block font-body text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body focus:border-guyub-bambu focus:outline-none focus:ring-1 focus:ring-guyub-bambu"
              />
            </div>
            {status !== 'idle' && (
              <p className={`font-body text-sm ${status === 'error' ? 'text-guyub-merahBata' : 'text-guyub-bambuDark'}`}>
                {message}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
            >
              {loading ? 'Mengirim…' : 'Kirim ulang email verifikasi'}
            </button>
          </form>
          <p className="mt-5 text-center font-body text-sm text-stone-600">
            Sudah verifikasi?{' '}
            <Link href="/login" className="font-medium text-guyub-bambuDark underline">
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
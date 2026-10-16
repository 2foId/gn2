'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token verifikasi tidak ditemukan.');
      return;
    }
    async function verify() {
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message ?? 'Email berhasil diverifikasi.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message ?? 'Verifikasi gagal.');
      }
    }
    void verify();
  }, [token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-guyub-krem px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-guyub-bambuDark">
          Guyub Ngapak
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
        </Link>
        <h1 className="mt-6 font-display text-2xl font-semibold text-guyub-bambuDark">
          Verifikasi Email
        </h1>
        <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm text-center">
          {status === 'idle' && (
            <>
              <p className="font-body text-sm text-stone-600">Memproses verifikasi…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <p className="font-body text-sm text-guyub-bambuDark font-medium">{message}</p>
              <p className="mt-4 font-body text-sm text-stone-500">
                Kamu sekarang bisa masuk ke akun kamu.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-full bg-guyub-bambuDark px-6 py-2 font-body font-medium text-white transition hover:bg-guyub-bambu"
              >
                Masuk ke akun
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="font-body text-sm text-guyub-merahBata">{message}</p>
              <Link
                href="/register"
                className="mt-6 inline-block rounded-full border border-stone-300 px-6 py-2 font-body font-medium text-stone-600 transition hover:bg-stone-50"
              >
                Daftar ulang
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

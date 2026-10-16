'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal mengirim tautan reset.');
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
          Lupa Password
        </h1>
        {!sent ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
    <Field
      label="Email"
      type="email"
      value={email}
      onChange={setEmail}
      placeholder="nama@contoh.com"
      required
    />
            {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
            >
              {loading ? 'Mengirim…' : 'Kirim Tautan Reset'}
            </button>
          </form>
        ) : (
          <div className="mt-6 rounded-2xl bg-white p-8 shadow-sm text-center">
            <p className="font-body text-sm text-stone-600">
              Jika email terdaftar, tautan reset password telah dikirim ke kotak masuk kamu.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-full bg-guyub-bambuDark px-6 py-2 font-body font-medium text-white transition hover:bg-guyub-bambu"
            >
              Kembali ke Masuk
            </Link>
          </div>
        )}
        <p className="mt-6 text-center font-body text-sm text-stone-600">
          Sudah ingat password?{' '}
          <Link href="/login" className="font-medium text-guyub-bambuDark underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-body text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body focus:border-guyub-bambu focus:outline-none focus:ring-1 focus:ring-guyub-bambu"
      />
    </div>
  );
}

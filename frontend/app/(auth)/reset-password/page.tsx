'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';
  const [form, setForm] = useState({ password: '', konfirmasi: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        password: form.password,
      });
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal mengubah password.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-guyub-krem px-6">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">Reset Password</h1>
          <p className="mt-2 font-body text-sm text-stone-600">Token reset tidak valid.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-guyub-krem px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-guyub-bambuDark">
          Guyub Ngapak
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
        </Link>
        <h1 className="mt-6 font-display text-2xl font-semibold text-guyub-bambuDark">
          Reset Password
        </h1>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field
            label="Password Baru"
            type="password"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required
          />
          <Field
            label="Konfirmasi Password Baru"
            type="password"
            value={form.konfirmasi}
            onChange={(v) => setForm({ ...form, konfirmasi: v })}
            required
          />
          {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
          >
            {loading ? 'Mengubah…' : 'Ubah Password'}
          </button>
        </form>
        <p className="mt-6 text-center font-body text-sm text-stone-600">
          Kembali ke{' '}
          <Link href="/login" className="font-medium text-guyub-bambuDark underline">
            Masuk
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
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block font-body text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body focus:border-guyub-bambu focus:outline-none focus:ring-1 focus:ring-guyub-bambu"
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nama: '', email: '', password: '', konfirmasi: '', dusun: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', {
        nama: form.nama,
        email: form.email,
        password: form.password,
        dusun: form.dusun,
      });
      router.push(`/check-email?email=${encodeURIComponent(form.email)}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registrasi gagal, coba lagi');
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
          Daftar sebagai warga
        </h1>
        <form onSubmit={handleRegister} className="mt-6 space-y-4">
          <Field label="Nama Lengkap" value={form.nama} onChange={(v) => setForm({ ...form, nama: v })} required />
          <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="nama@contoh.com" required />
          <Field label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} required />
          <Field label="Konfirmasi Password" type="password" value={form.konfirmasi} onChange={(v) => setForm({ ...form, konfirmasi: v })} required />
          <Field label="Dusun (opsional)" value={form.dusun} onChange={(v) => setForm({ ...form, dusun: v })} />

          {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
          >
            {loading ? 'Memproses…' : 'Daftar'}
          </button>
        </form>

        <p className="mt-6 text-center font-body text-sm text-stone-600">
          Sudah punya akun?{' '}
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

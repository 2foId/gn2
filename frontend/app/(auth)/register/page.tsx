'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'daftar' | 'otp'>('daftar');
  const [form, setForm] = useState({ nama: '', kontak: '', dusun: '', password: '' });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registrasi gagal, coba lagi');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { kontak: form.kontak, code: otp });
      router.push('/login');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Kode OTP tidak valid');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError(null);
    setResendMsg(null);
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { kontak: form.kontak });
      setResendMsg(`Kode OTP baru telah dikirim ke ${form.kontak}`);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal mengirim ulang OTP');
    } finally {
      setResending(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-guyub-krem px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold text-guyub-bambuDark">
          Guyub Ngapak
          <img src="/logo.png" alt="Logo" className="h-6 w-6" />
        </Link>

        {step === 'daftar' ? (
          <>
            <h1 className="mt-6 font-display text-2xl font-semibold text-guyub-bambuDark">
              Daftar sebagai warga
            </h1>
            <form onSubmit={handleRegister} className="mt-6 space-y-4">
              <Field label="Nama Lengkap" value={form.nama} onChange={(v) => setForm({ ...form, nama: v })} required />
              <Field label="Nomor HP" value={form.kontak} onChange={(v) => setForm({ ...form, kontak: v })} placeholder="0812xxxxxxx" required />
              <Field label="Dusun/RT (opsional)" value={form.dusun} onChange={(v) => setForm({ ...form, dusun: v })} />
              <Field
                label="Password"
                type="password"
                value={form.password}
                onChange={(v) => setForm({ ...form, password: v })}
                required
              />

              {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
              >
                {loading ? 'Memproses…' : 'Daftar'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-6 font-display text-2xl font-semibold text-guyub-bambuDark">
              Verifikasi Nomor HP
            </h1>
            <p className="mt-2 font-body text-sm text-stone-600">
              Kode OTP 6 digit telah dikirim ke {form.kontak}.
            </p>
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
              <Field label="Kode OTP" value={otp} onChange={setOtp} maxLength={6} required />

              {error && <p className="font-body text-sm text-guyub-merahBata">{error}</p>}
              {resendMsg && <p className="font-body text-sm text-guyub-bambuDark">{resendMsg}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-guyub-bambuDark py-2.5 font-body font-medium text-white transition hover:bg-guyub-bambu disabled:opacity-60"
              >
                {loading ? 'Memverifikasi…' : 'Verifikasi'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="w-full rounded-full border border-guyub-bambuDark py-2.5 font-body font-medium text-guyub-bambuDark transition hover:bg-guyub-krem disabled:opacity-60"
              >
                {resending ? 'Mengirim ulang…' : 'Kirim ulang OTP'}
              </button>
            </form>
          </>
        )}

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
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="block font-body text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body focus:border-guyub-bambu focus:outline-none focus:ring-1 focus:ring-guyub-bambu"
      />
    </div>
  );
}

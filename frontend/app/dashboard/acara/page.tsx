'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserIdentity } from '@/components/UserIdentity';

interface Logistik {
  id: string;
  itemNama: string;
  jumlah: number;
  penanggungJawab?: string;
  dipenuhi: boolean;
}

interface AcaraItem {
  id: string;
  nama: string;
  deskripsi: string;
  jenis: string;
  lokasi: string;
  waktuMulai: string;
  pembuat: { id: string; nama: string; avatarUrl?: string | null };
  logistik?: Logistik[];
  absensi?: { id: string; user: { id: string; nama: string; avatarUrl?: string | null } }[];
  kodeAbsen?: string | null;
  targetHadir?: number;
  _count?: { logistik: number; absensi: number };
}

export default function AcaraPage() {
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AcaraItem[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [logistikForm, setLogistikForm] = useState({ itemNama: '', jumlah: '1', penanggungJawab: '' });
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [absenErrors, setAbsenErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    jenis: 'Kerja Bakti',
    lokasi: '',
    waktuMulai: '',
    targetHadir: '1',
  });

  const loadData = useCallback(async () => {
    const res = await api.get('/acara');
    setItems(res.data);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await api.post('/acara', {
      ...form,
      targetHadir: parseInt(form.targetHadir, 10) || 1,
      waktuMulai: new Date(form.waktuMulai).toISOString(),
    });
    setShowForm(false);
    setForm({ nama: '', deskripsi: '', jenis: 'Kerja Bakti', lokasi: '', waktuMulai: '', targetHadir: '1' });
    loadData();
  }

  async function toggleExpand(item: AcaraItem) {
    if (expanded === item.id) {
      setExpanded(null);
      return;
    }
    const res = await api.get(`/acara/${item.id}`);
    setItems((prev) => prev.map((i) => (i.id === item.id ? res.data : i)));
    setExpanded(item.id);
  }

  async function handleAddLogistik(acaraId: string) {
    if (!logistikForm.itemNama.trim()) return;
    await api.post(`/acara/${acaraId}/logistik`, {
      itemNama: logistikForm.itemNama,
      jumlah: parseInt(logistikForm.jumlah, 10) || 1,
      penanggungJawab: logistikForm.penanggungJawab || undefined,
    });
    setLogistikForm({ itemNama: '', jumlah: '1', penanggungJawab: '' });
    const res = await api.get(`/acara/${acaraId}`);
    setItems((prev) => prev.map((i) => (i.id === acaraId ? res.data : i)));
  }

  async function toggleLogistik(logistikId: string, acaraId: string) {
    await api.patch(`/acara/logistik/${logistikId}/toggle`);
    const res = await api.get(`/acara/${acaraId}`);
    setItems((prev) => prev.map((i) => (i.id === acaraId ? res.data : i)));
  }

  async function handleAbsen(acaraId: string) {
    const kode = codes[acaraId]?.trim();
    if (!kode) {
      setAbsenErrors((prev) => ({ ...prev, [acaraId]: 'Masukkan kode absen.' }));
      return;
    }
    try {
      await api.post(`/acara/${acaraId}/absen`, { kode });
      setAbsenErrors((prev) => ({ ...prev, [acaraId]: '' }));
      const res = await api.get(`/acara/${acaraId}`);
      setItems((prev) => prev.map((i) => (i.id === acaraId ? res.data : i)));
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Gagal absen.';
      setAbsenErrors((prev) => ({ ...prev, [acaraId]: msg }));
    }
  }

  async function handleGenerateCode(acaraId: string) {
    await api.post(`/acara/${acaraId}/kode-absen`);
    const res = await api.get(`/acara/${acaraId}`);
    setItems((prev) => prev.map((i) => (i.id === acaraId ? res.data : i)));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-guyub-bambuDark">Guyub Acara</h1>
          <p className="font-body text-sm text-stone-600">
            Koordinasi kerja bakti, ronda, dan sedekah bumi — jadwal, logistik, absensi digital.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-medium text-white hover:bg-guyub-bambu"
        >
          {showForm ? 'Batal' : '+ Buat Acara'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Nama Acara</label>
              <input
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Jenis</label>
              <input
                required
                value={form.jenis}
                onChange={(e) => setForm({ ...form, jenis: e.target.value })}
                placeholder="Kerja bakti, ronda, sedekah bumi…"
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-stone-700">Deskripsi</label>
            <textarea
              required
              rows={2}
              value={form.deskripsi}
              onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Lokasi</label>
              <input
                required
                value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
            <div>
              <label className="block font-body text-sm font-medium text-stone-700">Waktu Mulai</label>
              <input
                required
                type="datetime-local"
                value={form.waktuMulai}
                onChange={(e) => setForm({ ...form, waktuMulai: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
              />
            </div>
          </div>
          <div className="max-w-[12rem]">
            <label className="block font-body text-sm font-medium text-stone-700">Target Kehadiran</label>
            <input
              required
              type="number"
              min={1}
              value={form.targetHadir}
              onChange={(e) => setForm({ ...form, targetHadir: e.target.value })}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2 font-body"
            />
          </div>
          <button
            type="submit"
            className="rounded-full bg-guyub-gula px-6 py-2 font-body font-medium text-guyub-bambuDark hover:brightness-95"
          >
            Buat Acara
          </button>
        </form>
      )}

      <div className="mt-6 space-y-4">
        {items.map((item) => {
          const isCreator = item.pembuat.id === user?.id;
          const sudahAbsen = item.absensi?.some((a) => a.user.id === user?.id);
          const attendedCount = item.absensi?.length ?? item._count?.absensi ?? 0;
          const target = item.targetHadir ?? 1;
          const tidakHadir = Math.max(0, target - attendedCount);
          return (
            <div key={item.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="font-body text-xs uppercase tracking-wide text-guyub-tanah">
                    {item.jenis}
                  </span>
                  <p className="font-display font-semibold text-guyub-bambuDark">{item.nama}</p>
                  <UserIdentity user={item.pembuat} />
                  <p className="font-body text-sm text-stone-600">{item.deskripsi}</p>
                  <p className="mt-1 font-body text-xs text-stone-500">
                    {new Date(item.waktuMulai).toLocaleString('id-ID')} · {item.lokasi}
                  </p>
                  <p className="mt-1 font-body text-xs text-stone-600">
                    Hadir {attendedCount}/{target}
                    {tidakHadir > 0 && <span className="ml-1 font-medium text-guyub-merahBata">· {tidakHadir} belum hadir</span>}
                  </p>
                  {isCreator && (
                    <div className="mt-2">
                      {item.kodeAbsen ? (
                        <p className="font-body text-xs text-stone-600">
                          Kode absen: <strong className="font-mono tracking-widest">{item.kodeAbsen}</strong>
                        </p>
                      ) : (
                        <button
                          onClick={() => handleGenerateCode(item.id)}
                          className="rounded-full bg-guyub-gula px-3 py-1 font-body text-xs font-medium text-guyub-bambuDark hover:brightness-95"
                        >
                          Generate access code
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {isCreator ? (
                    <span className="inline-block rounded-full bg-guyub-krem px-4 py-1.5 font-body text-xs font-medium text-stone-600">
                      Penyelenggara · Hadir
                    </span>
                  ) : sudahAbsen ? (
                    <span className="inline-block rounded-full bg-guyub-krem px-4 py-1.5 font-body text-xs font-medium text-stone-600">
                      Sudah Absen
                    </span>
                  ) : (
                    <div className="flex flex-col items-end gap-1">
                      <input
                        value={codes[item.id] ?? ''}
                        onChange={(e) => setCodes((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        placeholder="Kode absen"
                        maxLength={4}
                        className="w-28 rounded-lg border border-stone-300 px-3 py-1.5 text-center font-body text-xs"
                      />
                      <button
                        onClick={() => handleAbsen(item.id)}
                        className="rounded-full bg-guyub-gula px-4 py-1.5 font-body text-xs font-medium text-guyub-bambuDark hover:brightness-95"
                      >
                        Absen Hadir
                      </button>
                    </div>
                  )}
                  {absenErrors[item.id] && <p className="mt-1 font-body text-[11px] text-guyub-merahBata">{absenErrors[item.id]}</p>}
                </div>
              </div>

              <button
                onClick={() => toggleExpand(item)}
                className="mt-3 font-body text-sm font-medium text-guyub-bambuDark underline"
              >
                {expanded === item.id
                  ? 'Sembunyikan detail'
                  : `Lihat logistik (${item.logistik?.length ?? item._count?.logistik ?? 0}) & absensi (${attendedCount})`}
              </button>

              {expanded === item.id && (
                <div className="mt-4 grid gap-4 border-t border-stone-100 pt-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-body text-sm font-semibold text-stone-700">
                      Daftar Logistik
                    </h4>
                    <div className="mt-2 space-y-2">
                      {item.logistik?.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between rounded-lg bg-guyub-krem px-3 py-2"
                        >
                          <div>
                            <p className="font-body text-sm text-stone-800">
                              {l.itemNama} × {l.jumlah}
                            </p>
                            {l.penanggungJawab && (
                              <p className="font-body text-xs text-stone-500">
                                PJ: {l.penanggungJawab}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => toggleLogistik(l.id, item.id)}
                            className={`rounded-full px-3 py-1 font-body text-xs font-medium ${l.dipenuhi
                                ? 'bg-guyub-bambuDark text-white'
                                : 'border border-stone-300 text-stone-500'
                              }`}
                          >
                            {l.dipenuhi ? 'Terpenuhi' : 'Belum'}
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        value={logistikForm.itemNama}
                        onChange={(e) => setLogistikForm({ ...logistikForm, itemNama: e.target.value })}
                        placeholder="Nama item"
                        className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 font-body text-xs"
                      />
                      <input
                        type="number"
                        min={1}
                        value={logistikForm.jumlah}
                        onChange={(e) => setLogistikForm({ ...logistikForm, jumlah: e.target.value })}
                        className="w-16 rounded-lg border border-stone-300 px-3 py-1.5 font-body text-xs"
                      />
                      <button
                        onClick={() => handleAddLogistik(item.id)}
                        className="rounded-full bg-guyub-bambuDark px-4 py-1.5 font-body text-xs text-white"
                      >
                        Tambah
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-body text-sm font-semibold text-stone-700">
                      Absensi Digital
                    </h4>
                    <div className="mt-2 space-y-1">
                      {item.absensi?.length === 0 || !item.absensi ? (
                        <p className="font-body text-xs text-stone-500">Belum ada yang absen.</p>
                      ) : (
                        item.absensi.map((a) => (
                          <p key={a.id} className="font-body text-sm text-stone-700">
                            ✓ <UserIdentity user={a.user} />
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

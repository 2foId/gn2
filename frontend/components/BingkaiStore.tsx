'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserAvatar } from '@/components/UserIdentity';

interface BingkaiItem {
  id: string;
  kode: string;
  nama: string;
  harga: number;
  gaya: string;
  dimiliki: boolean;
  dipasang: boolean;
}

interface BingkaiListResponse {
  items: BingkaiItem[];
  currency: number;
}

export function BingkaiStore({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [items, setItems] = useState<BingkaiItem[]>([]);
  const [currency, setCurrency] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<BingkaiListResponse>('/bingkai');
      setItems(res.data.items);
      setCurrency(res.data.currency);
    } catch {
      setCurrency(0);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  async function handleBeli(id: string, nama: string, harga: number) {
    if (!user) return;
    if (currency < harga) return;
    setLoading(true);
    setBuyingId(id);
    setMessage(null);
    try {
      await api.post(`/bingkai/${id}/beli`);
      setMessage(`Bingkai "${nama}" dibeli.`);
      await load();
      updateUser({ bingkaiAktif: id, bingkaiDimiliki: [...(user.bingkaiDimiliki ?? []), id] });
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setMessage(Array.isArray(msg) ? msg.join('. ') : msg ?? 'Gagal membeli bingkai.');
    } finally {
      setLoading(false);
      setBuyingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end overflow-y-auto px-4 py-4 sm:items-center sm:justify-end sm:px-6 sm:py-8" role="dialog" aria-modal="true" onClick={onClose}>
      <section className="w-full max-w-md min-w-0 rounded-2xl border border-guyub-gula bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">Toko Bingkai</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-stone-400 hover:text-guyub-bambuDark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M18 6 6 18" /><path d="M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex items-center gap-2 mb-4">
          <img src="/icons/segitiga.svg" alt="" className="h-4 w-4 dark:brightness-0 dark:invert" />
          <span className="font-body text-sm font-semibold text-guyub-bambuDark">{currency.toLocaleString('id-ID')}</span>
        </div>
        {message && <div className="mb-4 rounded-lg bg-guyub-gula/10 p-3 font-body text-sm text-guyub-bambuDark">{message}<button type="button" onClick={() => { onClose(); window.dispatchEvent(new CustomEvent('guyub:open-profile', { detail: { userId: user?.id } })); }} className="mt-2 inline-flex items-center gap-1 font-body text-xs text-guyub-bambuDark underline">Lihat di inventory</button></div>}
        <div className="max-h-64 overflow-y-auto space-y-3">
          {items.map((b) => {
            const canBuy = !b.dimiliki && currency >= b.harga;
            const alreadyOwned = b.dimiliki;
            const isEquipped = b.dipasang;
            return (
              <div key={b.id} className="rounded-xl border border-stone-200 p-3 hover:bg-guyub-krem/50 transition">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -top-2 -left-2">
                      <UserAvatar user={{ id: b.id, nama: b.nama, avatarUrl: null, bingkaiGaya: b.gaya }} size="sm" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-sm font-medium text-stone-800 truncate">{b.nama}</p>
                    <p className="font-body text-xs text-stone-500">Harga {b.harga.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-right">
                    {isEquipped ? (
                      <span className="font-body text-xs font-semibold text-guyub-bambuDark">Pasang</span>
                    ) : alreadyOwned ? (
                      <span className="font-body text-xs font-semibold text-stone-500">Dimiliki</span>
                    ) : (
                      <button
                        type="button"
                        disabled={!canBuy || loading || buyingId === b.id}
                        onClick={() => handleBeli(b.id, b.nama, b.harga)}
                        className={`font-body text-xs font-medium py-1 px-2 rounded-full transition ${canBuy ? 'bg-guyub-bambuDark text-white hover:bg-guyub-bambuDark/90' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}
                      >
                        {loading && buyingId === b.id ? 'Memproses…' : canBuy ? 'Beli' : 'Currency belum cukup'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {items.length === 0 && <p className="font-body text-sm text-stone-500">Belum ada bingkai tersedia.</p>}
      </section>
    </div>
  );
}

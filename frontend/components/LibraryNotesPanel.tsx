'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface Note {
  id: string;
  judul: string;
  penulis: string | null;
  tahun: number | null;
  penerbit: string | null;
  tautan: string | null;
  catatan: string | null;
}

interface NoteForm {
  judul: string;
  penulis: string;
  tahun: string;
  penerbit: string;
  tautan: string;
  catatan: string;
}

const emptyForm: NoteForm = { judul: '', penulis: '', tahun: '', penerbit: '', tautan: '', catatan: '' };
const currentYear = new Date().getFullYear();

function responseMessage(error: any) {
  const message = error.response?.data?.message;
  return Array.isArray(message) ? message.join('. ') : message ?? 'Permintaan gagal. Coba lagi.';
}

export function LibraryNotesPanel() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<NoteForm>(emptyForm);
  const [citation, setCitation] = useState<{ apa: string; indonesia: string } | null>(null);
  const [copied, setCopied] = useState<'apa' | 'indonesia' | null>(null);
  const [error, setError] = useState('');

  async function loadNotes(targetPage = page) {
    setLoading(true);
    try {
      const response = await api.get('/pustaka/catatan', { params: { page: targetPage } });
      setNotes(response.data.items);
      setPage(response.data.page);
      setHasMore(response.data.hasMore);
      setError('');
    } catch (requestError) {
      setError(responseMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadNotes(1); }, []);

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setCitation(null);
    setError('');
    setFormOpen(true);
  }

  function editNote(note: Note) {
    setEditingId(note.id);
    setForm({
      judul: note.judul,
      penulis: note.penulis ?? '',
      tahun: note.tahun?.toString() ?? '',
      penerbit: note.penerbit ?? '',
      tautan: note.tautan ?? '',
      catatan: note.catatan ?? '',
    });
    setCitation(null);
    setError('');
    setFormOpen(true);
  }

  function payload() {
    return {
      judul: form.judul.trim(),
      penulis: form.penulis.trim() || undefined,
      tahun: form.tahun ? Number(form.tahun) : undefined,
      penerbit: form.penerbit.trim() || undefined,
      tautan: form.tautan.trim() || undefined,
      catatan: form.catatan.trim() || undefined,
    };
  }

  function citationPayload() {
    return {
      judul: form.judul.trim(),
      ...(form.penulis.trim() ? { penulis: form.penulis.trim() } : {}),
      ...(form.tahun ? { tahun: Number(form.tahun) } : {}),
      ...(form.penerbit.trim() ? { penerbit: form.penerbit.trim() } : {}),
    };
  }

  async function saveNote(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editingId) await api.patch(`/pustaka/catatan/${editingId}`, payload());
      else await api.post('/pustaka/catatan', payload());
      setFormOpen(false);
      setEditingId(null);
      await loadNotes(1);
    } catch (requestError) {
      setError(responseMessage(requestError));
    }
  }

  async function removeNote() {
    if (!deleteId) return;
    try {
      await api.delete(`/pustaka/catatan/${deleteId}`);
      setDeleteId(null);
      await loadNotes(notes.length === 1 && page > 1 ? page - 1 : page);
    } catch (requestError) {
      setError(responseMessage(requestError));
      setDeleteId(null);
    }
  }

  async function makeCitation() {
    try {
      const response = await api.post('/pustaka/sitasi', citationPayload());
      setCitation(response.data);
      setError('');
    } catch (requestError) {
      setError(responseMessage(requestError));
    }
  }

  async function copy(format: 'apa' | 'indonesia', value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(format);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setError('Sitasi tidak dapat disalin. Periksa izin clipboard browser.');
    }
  }

  return (
    <section className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-guyub-bambuDark dark:text-stone-100">Catatan Rujukan</h2>
          <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">Simpan sumber dan buat sitasi dari data yang kamu catat.</p>
        </div>
        {!formOpen && <button type="button" onClick={startNew} className="rounded-full bg-guyub-bambuDark px-5 py-2.5 font-body text-sm font-semibold text-white">Tambah catatan</button>}
      </div>

      {formOpen && <form onSubmit={saveNote} className="mt-5 space-y-4 border-y border-guyub-bambu/25 py-5">
        <h3 className="font-display text-lg font-semibold text-guyub-bambuDark dark:text-stone-100">{editingId ? 'Edit catatan' : 'Catatan baru'}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul" value={form.judul} maxLength={150} required onChange={(judul) => setForm({ ...form, judul })} />
          <Field label="Penulis" value={form.penulis} maxLength={100} onChange={(penulis) => setForm({ ...form, penulis })} />
          <div>
            <label htmlFor="pustaka-note-year" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Tahun</label>
            <input id="pustaka-note-year" type="number" min={1900} max={currentYear} value={form.tahun} onChange={(event) => setForm({ ...form, tahun: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100" />
          </div>
          <Field label="Penerbit" value={form.penerbit} maxLength={100} onChange={(penerbit) => setForm({ ...form, penerbit })} />
        </div>
        <Field label="Tautan (http/https)" type="url" value={form.tautan} onChange={(tautan) => setForm({ ...form, tautan })} />
        <div>
          <label htmlFor="pustaka-note-text" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">Catatan</label>
          <textarea id="pustaka-note-text" rows={3} maxLength={500} value={form.catatan} onChange={(event) => setForm({ ...form, catatan: event.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100" />
          <p className="mt-1 text-right font-body text-xs text-stone-500">{form.catatan.length}/500</p>
        </div>
        {error && <p role="alert" className="font-body text-sm text-red-800 dark:text-red-300">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-full bg-guyub-bambuDark px-5 py-2 font-body text-sm font-semibold text-white">Simpan</button>
          <button type="button" onClick={() => void makeCitation()} className="rounded-full border border-guyub-bambuDark px-5 py-2 font-body text-sm font-semibold text-guyub-bambuDark dark:border-stone-400 dark:text-stone-100">Buat sitasi</button>
          <button type="button" onClick={() => { setFormOpen(false); setError(''); }} className="rounded-full border border-stone-300 px-5 py-2 font-body text-sm text-stone-700 dark:border-stone-500 dark:text-stone-100">Batal</button>
        </div>
        {citation && <div className="grid gap-3 md:grid-cols-2">
          <Citation title="APA" value={citation.apa} copied={copied === 'apa'} onCopy={() => void copy('apa', citation.apa)} />
          <Citation title="Indonesia" value={citation.indonesia} copied={copied === 'indonesia'} onCopy={() => void copy('indonesia', citation.indonesia)} />
        </div>}
      </form>}

      {error && !formOpen && <p role="alert" className="mt-4 font-body text-sm text-red-800 dark:text-red-300">{error}</p>}
      {loading ? <p className="mt-6 font-body text-sm text-stone-700 dark:text-stone-200">Memuat catatan…</p> : notes.length === 0 ? (
        <p className="mt-6 font-body text-sm text-stone-700 dark:text-stone-200">Belum ada catatan rujukan.</p>
      ) : <div className="mt-5 divide-y divide-guyub-bambu/20 border-y border-guyub-bambu/20">
        {notes.map((note) => <article key={note.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
          <div className="min-w-0">
            <h3 className="break-words font-display text-lg font-semibold text-guyub-bambuDark dark:text-stone-100">{note.judul}</h3>
            <p className="mt-1 font-body text-sm text-stone-700 dark:text-stone-200">{note.penulis || 'Penulis tidak dicantumkan'}{note.tahun ? ` · ${note.tahun}` : ''}{note.penerbit ? ` · ${note.penerbit}` : ''}</p>
            {note.catatan && <p className="mt-2 whitespace-pre-line break-words font-body text-sm text-stone-600 dark:text-stone-300">{note.catatan}</p>}
            {note.tautan && <a href={note.tautan} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all font-body text-sm text-guyub-bambuDark underline dark:text-stone-100">Buka tautan</a>}
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => editNote(note)} className="rounded-full border border-stone-300 px-3 py-1.5 font-body text-xs text-stone-700 dark:border-stone-500 dark:text-stone-100">Edit</button>
            <button type="button" onClick={() => setDeleteId(note.id)} className="rounded-full border border-red-800 px-3 py-1.5 font-body text-xs text-red-800 dark:border-red-400 dark:text-red-300">Hapus</button>
          </div>
        </article>)}
      </div>}
      {!loading && (page > 1 || hasMore) && <div className="mt-5 flex justify-between">
        <button type="button" disabled={page <= 1} onClick={() => void loadNotes(page - 1)} className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 disabled:opacity-40 dark:border-stone-500 dark:text-stone-100">Sebelumnya</button>
        <span className="self-center font-body text-sm text-stone-600 dark:text-stone-300">Halaman {page}</span>
        <button type="button" disabled={!hasMore} onClick={() => void loadNotes(page + 1)} className="rounded-full border border-stone-300 px-4 py-2 font-body text-sm text-stone-700 disabled:opacity-40 dark:border-stone-500 dark:text-stone-100">Berikutnya</button>
      </div>}
      {deleteId && <ConfirmDialog title="Hapus catatan rujukan?" message="Catatan ini akan dihapus dari pustaka pribadimu." confirmLabel="Hapus" confirmClassName="rounded-full bg-red-800 px-5 py-2 font-body text-sm font-semibold text-white" onCancel={() => setDeleteId(null)} onConfirm={() => void removeNote()} />}
    </section>
  );
}

function Field({ label, value, onChange, maxLength, required, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; maxLength?: number; required?: boolean; type?: string }) {
  return <div>
    <label className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">{label}</label>
    <input type={type} required={required} maxLength={maxLength} value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-body text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100" />
  </div>;
}

function Citation({ title, value, copied, onCopy }: { title: string; value: string; copied: boolean; onCopy: () => void }) {
  return <section className="rounded-lg border border-guyub-bambu/25 p-4 dark:border-stone-600">
    <div className="flex items-center justify-between gap-3"><h4 className="font-body text-sm font-semibold text-guyub-bambuDark dark:text-stone-100">Sitasi {title}</h4><button type="button" onClick={onCopy} className="rounded-full border border-stone-300 px-3 py-1.5 font-body text-xs text-stone-700 dark:border-stone-500 dark:text-stone-100">{copied ? 'Tersalin' : 'Salin'}</button></div>
    <p className="mt-2 break-words font-body text-sm text-stone-700 dark:text-stone-200">{value}</p>
  </section>;
}
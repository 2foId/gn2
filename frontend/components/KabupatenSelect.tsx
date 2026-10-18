'use client';

import { useMemo, useState } from 'react';

export const KABUPATEN_KOTA_LIST = [
  'Cilacap',
  'Banyumas',
  'Purbalingga',
  'Banjarnegara',
  'Kebumen',
  'Purworejo',
  'Wonosobo',
  'Magelang',
  'Boyolali',
  'Klaten',
  'Sukoharjo',
  'Wonogiri',
  'Karanganyar',
  'Sragen',
  'Grobogan',
  'Blora',
  'Rembang',
  'Pati',
  'Kudus',
  'Jepara',
  'Demak',
  'Semarang',
  'Temanggung',
  'Kendal',
  'Batang',
  'Pekalongan',
  'Pemalang',
  'Tegal',
  'Brebes',
  'Kota Magelang',
  'Kota Surakarta',
  'Kota Salatiga',
  'Kota Semarang',
  'Kota Pekalongan',
  'Kota Tegal',
] as const;

export interface KabupatenSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function KabupatenSelect({
  value,
  onChange,
  onBlur,
  label = 'Kabupaten/Kota',
  required = false,
  placeholder = 'Pilih atau ketik untuk mencari',
  disabled = false,
  error,
}: KabupatenSelectProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const selected = KABUPATEN_KOTA_LIST.find((k) => k === value);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return query
      ? KABUPATEN_KOTA_LIST.filter((k) => k.toLocaleLowerCase('id-ID').includes(query))
      : [...KABUPATEN_KOTA_LIST];
  }, [search]);

  function choose(name: string) {
    onChange(name);
    setSearch('');
    setExpanded(false);
  }

  const visibleValue = expanded ? search : selected ?? '';

  return (
    <div className="relative min-w-0">
      {label && (
        <label htmlFor="kabupaten-select" className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">
          {label}{required && <span className="text-guyub-merahBata"> *</span>}
        </label>
      )}
      <input
        id="kabupaten-select"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls="kabupaten-options"
        value={visibleValue}
        disabled={disabled}
        onFocus={() => { setExpanded(true); setSearch(''); }}
        onChange={(event) => { setSearch(event.target.value); setExpanded(true); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setExpanded(false);
          if (event.key === 'Enter' && expanded && filtered[0]) {
            event.preventDefault();
            choose(filtered[0]);
          }
        }}
        placeholder={placeholder}
        className={`mt-1 w-full min-w-0 rounded-lg border bg-white px-3 py-2 font-body text-sm text-stone-800 outline-none dark:bg-stone-900 dark:text-stone-100 ${
          error ? 'border-red-500' : 'border-stone-300 dark:border-stone-600'
        }`}
      />
      {expanded && (
        <ul id="kabupaten-options" role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-stone-300 bg-white py-1 shadow-sm dark:border-stone-600 dark:bg-stone-900">
          {filtered.map((name) => (
            <li key={name} role="option" aria-selected={name === value}>
              <button type="button" onClick={() => choose(name)} className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left font-body text-sm text-stone-800 hover:bg-guyub-krem dark:text-stone-100 dark:hover:bg-stone-800">
                <span>{name}</span>
                {name === value && <span className="shrink-0 text-xs text-guyub-bambuDark">Terpilih</span>}
              </button>
            </li>
          ))}
          {!filtered.length && <li className="px-4 py-2 font-body text-sm text-stone-600 dark:text-stone-300">Wilayah tidak ditemukan.</li>}
        </ul>
      )}
      {error && <p role="alert" className="mt-1 font-body text-xs text-red-600">{error}</p>}
    </div>
  );
}
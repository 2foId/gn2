'use client';

import { useMemo, useState } from 'react';

export interface RegionOption {
  slug: string;
  nama: string;
  status?: 'AKTIF' | 'SEGERA_HADIR';
}

export function RegionCombobox({
  regions,
  value,
  onChange,
  allLabel,
  label = 'Kabupaten/kota',
  loading = false,
}: {
  regions: RegionOption[];
  value: string;
  onChange: (slug: string) => void;
  allLabel?: string;
  label?: string;
  loading?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const selected = regions.find((region) => region.slug === value);
  const filteredRegions = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('id-ID');
    return query ? regions.filter((region) => region.nama.toLocaleLowerCase('id-ID').includes(query)) : regions;
  }, [regions, search]);

  if (loading) return <p className="font-body text-sm text-stone-700 dark:text-stone-200">Memuat daftar kabupaten…</p>;
  if (regions.length === 0) {
    return <p className="font-body text-sm text-stone-700 dark:text-stone-200">Daftar kabupaten belum tersedia.</p>;
  }

  function choose(slug: string) {
    onChange(slug);
    setSearch('');
    setExpanded(false);
  }

  const visibleValue = expanded ? search : selected?.nama ?? allLabel ?? '';

  return (
    <div className="relative min-w-0">
      <label htmlFor={`region-combobox-${label.replace(/\s+/g, '-').toLowerCase()}`} className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200">{label}</label>
      <input
        id={`region-combobox-${label.replace(/\s+/g, '-').toLowerCase()}`}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={`region-options-${label.replace(/\s+/g, '-').toLowerCase()}`}
        value={visibleValue}
        onFocus={() => { setExpanded(true); setSearch(''); }}
        onChange={(event) => { setSearch(event.target.value); setExpanded(true); }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setExpanded(false);
          if (event.key === 'Enter' && expanded && filteredRegions[0]) {
            event.preventDefault();
            choose(filteredRegions[0].slug);
          }
        }}
        placeholder="Ketik untuk mencari wilayah"
        className="mt-1 w-full min-w-0 rounded-lg border border-stone-300 bg-white px-3 py-2.5 font-body text-sm text-stone-800 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
      />
      {expanded && <ul id={`region-options-${label.replace(/\s+/g, '-').toLowerCase()}`} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-stone-300 bg-white py-1 shadow-sm dark:border-stone-600 dark:bg-stone-900">
        {allLabel && <li role="option" aria-selected={!value}>
          <button type="button" onClick={() => choose('')} className="w-full px-4 py-2 text-left font-body text-sm text-stone-800 hover:bg-guyub-krem dark:text-stone-100 dark:hover:bg-stone-800">{allLabel}</button>
        </li>}
        {filteredRegions.map((region) => <li key={region.slug} role="option" aria-selected={region.slug === value}>
          <button type="button" onClick={() => choose(region.slug)} className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left font-body text-sm text-stone-800 hover:bg-guyub-krem dark:text-stone-100 dark:hover:bg-stone-800">
            <span>{region.nama}</span>
            {region.status && <span className="shrink-0 text-xs text-stone-600 dark:text-stone-300">{region.status === 'AKTIF' ? 'Aktif' : 'Segera hadir'}</span>}
          </button>
        </li>)}
        {!filteredRegions.length && <li className="px-4 py-2 font-body text-sm text-stone-600 dark:text-stone-300">Wilayah tidak ditemukan.</li>}
      </ul>}
    </div>
  );
}
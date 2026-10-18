'use client';

import { KabupatenSelect } from '@/components/KabupatenSelect';

export interface KabupatenFilterProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

export function KabupatenFilter({ value, onChange, label = 'Kabupaten/Kota', disabled = false }: KabupatenFilterProps) {
  const isAll = value === '';
  const displayLabel = isAll ? 'Semua kabupaten/kota' : value;

  return (
    <KabupatenSelect
      value={displayLabel}
      onChange={(selected) => {
        if (selected === 'Semua kabupaten/kota') {
          onChange('');
        } else {
          onChange(selected);
        }
      }}
      label={label}
      disabled={disabled}
      placeholder="Pilih atau ketik untuk mencari"
    />
  );
}

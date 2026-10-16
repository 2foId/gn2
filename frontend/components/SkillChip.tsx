'use client';

const SKILL_LABELS: Record<string, string> = {
  FOTO_PRODUK: 'Foto Produk',
  DESAIN: 'Desain',
  PEMASARAN_MEDSOS: 'Pemasaran Media Sosial',
  MARKETPLACE: 'Marketplace',
  PEMBUKUAN: 'Pembukuan',
  VIDEO_PENDEK: 'Video Pendek',
  LAINNYA: 'Lainnya',
};

export function skillLabel(value: string): string {
  return SKILL_LABELS[value] ?? value;
}

interface SkillChipProps {
  value: string;
  selected?: boolean;
  onToggle?: () => void;
}

export function SkillChip({ value, selected = false, onToggle }: SkillChipProps) {
  const label = skillLabel(value);
  const base = 'inline-flex items-center gap-1 rounded-md border border-stone-300 bg-transparent px-2.5 py-0.5 font-body text-xs tracking-wide uppercase transition';
  const selectedCls = selected
    ? 'border-guyub-gula bg-guyub-gula/10 text-guyub-bambuDark'
    : 'text-stone-600 hover:border-guyub-gula hover:text-guyub-bambuDark';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      className={`${base} ${selectedCls}`}
      onClick={onToggle}
      disabled={!onToggle}
    >
      {label}
    </button>
  );
}

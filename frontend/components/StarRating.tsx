'use client';

interface StarRatingProps {
  value: number;
  onSelect?: (value: number) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function StarRating({ value = 0, onSelect, disabled = false, size = 'md', readOnly = false }: StarRatingProps) {
  const handleSelect = (newValue: number) => {
    if (!disabled && !readOnly && onSelect) {
      onSelect(newValue);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label="Penilaian bintang"
      className="flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value >= star}
          aria-label={`${star} bintang`}
          onClick={() => handleSelect(star)}
          disabled={disabled || readOnly}
          className={`transition duration-200 ${SIZE_CLASSES[size]}`}
        >
          {value >= star ? (
            <img src="/icons/bintang-isi.svg" alt="" className="h-full w-full" />
          ) : (
            <img src="/icons/bintang.svg" alt="" className="h-full w-full" />
          )}
        </button>
      ))}
    </div>
  );
}

'use client';

export function LabelWajib({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block font-body text-sm font-medium text-stone-700 dark:text-stone-200" aria-required="true">
      {children}
      <span className="ml-0.5 text-guyub-merahBata" aria-hidden="true">*</span>
    </label>
  );
}

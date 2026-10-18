'use client';

import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ConfirmDialog';

function formatPhone(phone: string) {
  const nationalNumber = phone.replace(/^\+62/, '');
  const first = nationalNumber.slice(0, 3);
  const second = nationalNumber.slice(3, 7);
  const third = nationalNumber.slice(7);
  return `+62 ${first}${second ? `-${second}` : ''}${third ? `-${third}` : ''}`;
}

export function WhatsAppButton({ phone }: { phone: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [confirming, setConfirming] = useState(false);
  const formattedPhone = formatPhone(phone);

  function closeDialog() {
    setConfirming(false);
    requestAnimationFrame(() => buttonRef.current?.focus());
  }

  function continueToWhatsApp() {
    const digits = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
    closeDialog();
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Hubungi lewat WhatsApp, ${formattedPhone}`}
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 font-body text-sm font-semibold text-black transition hover:bg-[#20bd5b] dark:bg-[#075E37] dark:text-white dark:hover:bg-[#064d2e]"
      >
        <img src="/icons/whatsapp.svg" alt="" aria-hidden="true" className="h-5 w-5 dark:brightness-0 dark:invert" />
        {formattedPhone}
      </button>
      {confirming && (
        <ConfirmDialog
          title="Lanjutkan ke WhatsApp?"
          message="Kamu akan dialihkan ke WhatsApp di tab baru."
          confirmLabel="Lanjut"
          confirmClassName="rounded-full bg-[#25D366] px-5 py-2 font-body text-sm font-semibold text-black dark:bg-[#075E37] dark:text-white"
          onCancel={closeDialog}
          onConfirm={continueToWhatsApp}
        />
      )}
    </>
  );
}
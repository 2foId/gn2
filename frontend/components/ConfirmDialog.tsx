'use client';

export function ConfirmDialog({
    title,
    message,
    confirmLabel = 'Ya',
    confirmClassName,
    onConfirm,
    onCancel,
}: {
    title: string;
    message: string;
    confirmLabel?: string;
    confirmClassName?: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-6" role="alertdialog" aria-modal="true" aria-label={title}>
            <div className="w-full max-w-sm rounded-2xl border-2 border-guyub-gula bg-white p-6 text-center shadow-2xl">
                <h2 className="font-display text-xl font-semibold text-guyub-bambuDark">{title}</h2>
                <p className="mt-2 font-body text-sm text-stone-600">{message}</p>
                <div className="mt-5 flex justify-center gap-3">
                    <button type="button" onClick={onCancel} className="rounded-full border border-stone-300 px-5 py-2 font-body text-sm text-stone-600">Batal</button>
                    <button type="button" onClick={onConfirm} className={confirmClassName ?? 'rounded-full bg-green-300 px-5 py-2 font-body text-sm font-semibold text-guyub-bambuDark'}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

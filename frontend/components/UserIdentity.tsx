'use client';

export interface ProfileSummary {
    id: string;
    nama: string;
    avatarUrl?: string | null;
    bingkaiGaya?: string | null;
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace(/\/api\/?$/, '');

export function UserAvatar({ user, size = 'md' }: { user: ProfileSummary; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-16 w-16 text-xl' : 'h-10 w-10 text-sm';
    const borderClass = user.bingkaiGaya ? `border-${user.bingkaiGaya}` : 'border-yellow-400';
    return user.avatarUrl ? (
        <img src={`${API_ORIGIN}${user.avatarUrl}`} alt="" className={`${sizeClass} rounded-full ${borderClass} object-cover`} />
    ) : (
        <span className={`${sizeClass} flex items-center justify-center rounded-full ${borderClass} bg-guyub-krem font-display font-semibold text-guyub-bambuDark`} aria-hidden="true">
            {user.nama.charAt(0).toUpperCase()}
        </span>
    );
}

export function UserIdentity({ user, size = 'sm' }: { user: ProfileSummary; size?: 'sm' | 'md' }) {
    return (
        <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('guyub:open-profile', { detail: { userId: user.id } }))} className="inline-flex items-center gap-2 align-middle">
            <UserAvatar user={user} size={size} />
            <strong className="font-body text-stone-800 hover:underline">{user.nama}</strong>
        </button>
    );
}

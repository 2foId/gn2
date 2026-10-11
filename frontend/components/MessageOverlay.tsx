'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';
import { UserAvatar } from '@/components/UserIdentity';

interface Sender {
  id: string;
  nama: string;
  avatarUrl?: string | null;
}

interface Conversation {
  sender: Sender;
  lastMessage: string;
  preview: string;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  isi: string;
  createdAt: string;
  sender: Sender;
}

export function MessageOverlay() {
  const me = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'inbox' | 'thread'>('inbox');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [activeUser, setActiveUser] = useState<Sender | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadInbox = useCallback(async () => {
    const res = await api.get('/messages/inbox');
    setConversations(res.data);
  }, []);

  const openThread = useCallback(async (user: Sender) => {
    setActiveUser(user);
    setView('thread');
    setLoading(true);
    try {
      const res = await api.get(`/messages/thread/${user.id}`);
      setMessages(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    function onOpen(event: Event) {
      const detail = (event as CustomEvent<{ userId?: string }>).detail;
      if (detail?.userId) {
        api.get(`/users/${detail.userId}`).then((res) => {
          const u = res.data;
          openThread({ id: u.id, nama: u.nama, avatarUrl: u.avatarUrl });
        });
      } else {
        setView('inbox');
        loadInbox();
      }
      setText('');
      setOpen(true);
    }
    window.addEventListener('guyub:open-messages', onOpen);
    return () => window.removeEventListener('guyub:open-messages', onOpen);
  }, [loadInbox, openThread]);

  async function handleSend() {
    if (!text.trim() || !activeUser) return;
    await api.post('/messages', { receiverId: activeUser.id, isi: text.trim() });
    setText('');
    const res = await api.get(`/messages/thread/${activeUser.id}`);
    setMessages(res.data);
    if (view === 'inbox') loadInbox();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-6"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <section
        className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl border-2 border-guyub-gula bg-white shadow-2xl"
        style={{ maxHeight: '80vh' }}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
          {view === 'thread' ? (
            <button
              type="button"
              onClick={() => {
                setView('inbox');
                setActiveUser(null);
                loadInbox();
              }}
              aria-label="Kembali"
              className="rounded-full p-1 text-guyub-bambuDark hover:bg-guyub-krem"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <h2 className="font-display text-lg font-semibold text-guyub-bambuDark">Pesan</h2>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Tutup"
            className="rounded-full p-1 text-stone-500 hover:bg-guyub-krem"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        {view === 'inbox' ? (
          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <p className="p-6 text-center font-body text-sm text-stone-500">Belum ada pesan masuk.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.sender.id}
                  type="button"
                  onClick={() => openThread(c.sender)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-guyub-krem"
                >
                  <UserAvatar user={c.sender} size="lg" />
                  <div className="min-w-0">
                    <p className="font-body font-semibold text-stone-800">{c.sender.nama}</p>
                    <p className="truncate font-body text-sm text-stone-500">{c.preview}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : (
          <>
            <div className="border-b border-stone-100 px-4 py-2">
              <p className="font-body font-semibold text-stone-800">{activeUser?.nama}</p>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {loading ? (
                <p className="text-center font-body text-sm text-stone-500">Memuat…</p>
              ) : messages.length === 0 ? (
                <p className="text-center font-body text-sm text-stone-500">Belum ada pesan. Tulis pesan pertama.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === me?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <p className={`max-w-[80%] rounded-2xl px-3 py-2 font-body text-sm ${mine ? 'bg-guyub-bambuDark text-white' : 'bg-guyub-krem text-stone-800'}`}>
                        {m.isi}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 border-t border-stone-100 p-3"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tulis pesan…"
                className="flex-1 rounded-full border border-stone-300 px-4 py-2 font-body text-sm"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="rounded-full bg-guyub-bambuDark px-4 py-2 font-body text-sm text-white hover:bg-guyub-bambu disabled:opacity-50"
              >
                Kirim
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

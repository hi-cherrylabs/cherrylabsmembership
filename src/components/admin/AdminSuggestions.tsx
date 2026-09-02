import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send, Trash2 } from 'lucide-react';
import {
  subscribeSuggestionMessages,
  sendSuggestionMessageAsAdmin,
  clearSuggestionInbox,
} from '../../lib/data';
import type { SuggestionThread, SuggestionMessage } from '../../types';

// Mirrors SuggestView.tsx (the member-facing chat) almost exactly, with
// sender roles flipped: the admin's own outgoing messages are the black
// bubble on the right, the member's incoming messages are the white bubble
// on the left.
function ThreadChat({ thread, onBack }: { thread: SuggestionThread; onBack: () => void }) {
  const [messages, setMessages] = useState<SuggestionMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeSuggestionMessages(thread.uid, setMessages);
    return unsub;
  }, [thread.uid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await sendSuggestionMessageAsAdmin(thread.uid, text);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    await clearSuggestionInbox(thread.uid);
    setConfirmingClear(false);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col w-full h-full bg-[var(--surface-70)] backdrop-blur-3xl">
      <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border-50)] bg-[var(--surface-60)] backdrop-blur-2xl">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-all text-[var(--text-80)]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div className="flex-1">
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">{thread.userName || 'Member'}</h2>
          <p className="text-[11px] font-bold text-[var(--text-50)]">Suggestion thread</p>
        </div>
        {confirmingClear ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="text-xs font-bold px-3 py-2 rounded-full bg-red-500 hover:bg-red-600 text-[var(--invert-text)] transition-all"
            >
              Confirm clear
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="text-xs font-bold px-3 py-2 rounded-full bg-[var(--surface-70)] text-[var(--text-60)] border border-[var(--border-60)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingClear(true)}
            className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all text-[var(--text-60)]"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 && (
          <p className="text-center text-xs font-semibold text-[var(--text-40)] mt-10">No messages in this thread yet.</p>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm ${
                msg.sender === 'admin'
                  ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-tr-sm'
                  : 'bg-[var(--surface-80)] text-[var(--text-90)] border border-[var(--border-50)] rounded-tl-sm'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-[var(--surface-40)] backdrop-blur-3xl border-t border-[var(--border-60)]">
        <div className="group relative flex items-center bg-[var(--surface-60)] backdrop-blur-xl border border-[var(--border-70)] rounded-[24px] p-2 hover:bg-[var(--invert-bg)] focus-within:bg-[var(--invert-bg)] transition-colors duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="Reply as Cherry Labs..."
            className="bg-transparent outline-none text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] px-4 py-2 w-full placeholder:text-[var(--text-50)] group-hover:placeholder:text-white/50 group-focus-within:placeholder:text-white/50 font-semibold transition-colors duration-200 text-sm"
          />
          <button
            disabled={!input.trim() || sending}
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center group-hover:bg-[var(--surface-20)] group-focus-within:bg-[var(--surface-20)] text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] transition-all shrink-0 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send size={16} strokeWidth={2.5} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSuggestions({ threads }: { threads: SuggestionThread[] }) {
  const [openUid, setOpenUid] = useState<string | null>(null);
  const openThread = threads.find((t) => t.uid === openUid) || null;

  if (openThread) {
    return <ThreadChat thread={openThread} onBack={() => setOpenUid(null)} />;
  }

  return (
    <div className="p-6 flex flex-col gap-2 max-w-2xl mx-auto">
      {threads.length === 0 && (
        <p className="text-[var(--text-40)] text-sm text-center py-10 font-semibold">No suggestion threads yet.</p>
      )}
      {threads.map((t) => (
        <button
          key={t.uid}
          onClick={() => setOpenUid(t.uid)}
          className="text-left bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex items-center justify-between hover:bg-[var(--surface-60)] transition-all shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
        >
          <div className="min-w-0">
            <p className="font-extrabold text-[var(--text-90)] truncate">{t.userName || 'Member'}</p>
            <p className="text-xs font-semibold text-[var(--text-50)] truncate max-w-[240px]">{t.lastMessageText || 'No messages yet'}</p>
          </div>
          {t.unreadByAdmin && <span className="w-2.5 h-2.5 rounded-full bg-pink-500 shrink-0" />}
        </button>
      ))}
    </div>
  );
}

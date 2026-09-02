import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send } from 'lucide-react';
import {
  subscribeSuggestionThread,
  subscribeSuggestionMessages,
  sendSuggestionMessageAsUser,
} from '../../lib/data';
import { SUGGESTION_DAILY_LIMIT, SUGGESTION_WINDOW_MS } from '../../lib/constants';
import type { SuggestionMessage, SuggestionThread } from '../../types';

const WELCOME_MESSAGE = 'Welcome to Cherry Labs Support! Please feel free to suggest any new features, improvements, or report issues here.';

export default function SuggestView({
  uid,
  userName,
  onBack,
}: {
  uid: string;
  userName: string;
  onBack: () => void;
}) {
  const [thread, setThread] = useState<SuggestionThread | null>(null);
  const [messages, setMessages] = useState<SuggestionMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubThread = subscribeSuggestionThread(uid, setThread);
    const unsubMsgs = subscribeSuggestionMessages(uid, setMessages);
    return () => { unsubThread(); unsubMsgs(); };
  }, [uid]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  let remaining = SUGGESTION_DAILY_LIMIT;
  if (thread?.windowStart) {
    const withinWindow = Date.now() - thread.windowStart.toMillis() < SUGGESTION_WINDOW_MS;
    if (withinWindow) remaining = Math.max(0, SUGGESTION_DAILY_LIMIT - (thread.countInWindow || 0));
  }

  const handleSend = async () => {
    if (!input.trim() || sending || remaining <= 0) return;
    setSending(true);
    setError('');
    const text = input.trim();
    setInput('');
    try {
      await sendSuggestionMessageAsUser(uid, userName || 'Member', text);
    } catch (err) {
      if ((err as Error).message === 'DAILY_LIMIT_REACHED') {
        setError('You\u2019ve reached today\u2019s message limit. Try again tomorrow.');
      } else {
        setError('Could not send your message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      key="dash_suggest"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col w-full h-full bg-[var(--surface-70)] backdrop-blur-3xl"
    >
      <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border-50)] bg-[var(--surface-60)] backdrop-blur-2xl">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-all text-[var(--text-80)]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">Offer a suggestion</h2>
          <p className="text-[11px] font-bold text-[var(--text-50)]">{remaining} messages remaining today</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 [&::-webkit-scrollbar]:hidden">
        <div className="flex justify-start">
          <div className="max-w-[85%] p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm bg-[var(--surface-80)] text-[var(--text-90)] border border-[var(--border-50)] rounded-tl-sm">
            {WELCOME_MESSAGE}
          </div>
        </div>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm ${
                msg.sender === 'user'
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
        {error && <p className="text-center text-xs font-bold text-red-500 mb-2">{error}</p>}
        <div className="group relative flex items-center bg-[var(--surface-60)] backdrop-blur-xl border border-[var(--border-70)] rounded-[24px] p-2 hover:bg-[var(--invert-bg)] focus-within:bg-[var(--invert-bg)] transition-colors duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={remaining <= 0}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={remaining <= 0 ? 'Daily message limit reached' : 'Type your suggestion here...'}
            className="bg-transparent outline-none text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] px-4 py-2 w-full placeholder:text-[var(--text-50)] group-hover:placeholder:text-white/50 group-focus-within:placeholder:text-white/50 font-semibold transition-colors duration-200 text-sm"
          />
          <button
            disabled={remaining <= 0 || !input.trim() || sending}
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center group-hover:bg-[var(--surface-20)] group-focus-within:bg-[var(--surface-20)] text-[var(--text-100)] group-hover:text-[var(--invert-text)] group-focus-within:text-[var(--invert-text)] transition-all shrink-0 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send size={16} strokeWidth={2.5} className="ml-1" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Send } from 'lucide-react';
import { subscribeCommunityMessages, sendCommunityMessage } from '../../lib/data';
import type { CommunityMessage } from '../../types';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';

export default function CommunityView({
  uid,
  userName,
  banned,
  onBack,
}: {
  uid: string;
  userName: string;
  banned: boolean;
  onBack: () => void;
}) {
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeCommunityMessages(setMessages);
    return unsub;
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async () => {
    if (!input.trim() || banned || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      await sendCommunityMessage(uid, userName || 'Member', DEFAULT_AVATAR, text);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      key="dash_community"
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
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">Member Community</h2>
          <p className="text-[11px] font-bold text-[var(--text-50)]">Global shared discussions</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden">
        {messages.length === 0 && (
          <p className="text-center text-xs font-semibold text-[var(--text-40)] mt-10">
            No messages yet — be the first to say hello!
          </p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.uid === uid;
          return (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${isOwn ? 'items-end self-end' : 'items-start'}`}>
              <div className="flex items-center gap-2 mb-1.5 ml-2">
                <img src={msg.avatar || DEFAULT_AVATAR} alt={msg.userName} className="w-5 h-5 rounded-full object-cover shadow-sm" />
                <span className="text-xs font-bold text-[var(--text-70)]">{isOwn ? 'You' : msg.userName}</span>
              </div>
              <div
                className={`p-4 rounded-2xl text-[13px] font-semibold leading-relaxed shadow-sm border ${
                  isOwn
                    ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black rounded-tr-sm'
                    : 'bg-[var(--surface-80)] text-[var(--text-90)] border-[var(--border-50)] rounded-tl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-[var(--surface-40)] backdrop-blur-3xl border-t border-[var(--border-60)]">
        {banned ? (
          <p className="text-center text-xs font-bold text-red-500 py-3">
            Your posting privileges have been restricted. Contact support for details.
          </p>
        ) : (
          <div className="group relative flex items-center bg-[var(--surface-60)] backdrop-blur-xl border border-[var(--border-70)] rounded-[24px] p-2 hover:bg-[var(--invert-bg)] focus-within:bg-[var(--invert-bg)] transition-colors duration-200 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
              placeholder="Share a thought or link with the community..."
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
        )}
      </div>
    </motion.div>
  );
}

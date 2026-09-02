import { Trash2 } from 'lucide-react';
import { deleteCommunityMessage } from '../../lib/data';
import type { CommunityMessage } from '../../types';

export default function AdminChatModeration({ messages }: { messages: CommunityMessage[] }) {
  const reversed = [...messages].reverse();

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this message from the community chat?')) return;
    await deleteCommunityMessage(id);
  };

  return (
    <div className="p-6 flex flex-col gap-2 max-w-2xl mx-auto">
      {reversed.length === 0 && (
        <p className="text-[var(--text-40)] text-sm text-center py-10 font-semibold">No community messages yet.</p>
      )}
      {reversed.map((m) => (
        <div
          key={m.id}
          className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-50)] mb-1">{m.userName}</p>
            <p className="text-sm font-semibold text-[var(--text-90)] truncate">{m.text}</p>
          </div>
          <button
            onClick={() => handleDelete(m.id)}
            className="w-9 h-9 rounded-full bg-[var(--surface-70)] flex items-center justify-center text-[var(--text-60)] hover:bg-red-50 hover:text-red-500 transition-all shrink-0 border border-[var(--border-60)]"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      ))}
    </div>
  );
}

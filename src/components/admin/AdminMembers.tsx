import { useState } from 'react';
import { Search } from 'lucide-react';
import { setMemberBanned, extendMemberVip, adminDeleteMemberDoc } from '../../lib/data';
import { VIP_DURATION_MS } from '../../lib/constants';
import type { UserProfile } from '../../types';

export default function AdminMembers({ members }: { members: UserProfile[] }) {
  const [search, setSearch] = useState('');
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  const filtered = members.filter((m) => {
    if (m.isAdmin) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      m.name?.toLowerCase().includes(q) ||
      m.phoneNumber?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.region?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 flex flex-col gap-4 max-w-2xl mx-auto">
      <div className="group relative flex items-center bg-[var(--surface-50)] backdrop-blur-xl border border-[var(--border-60)] rounded-full px-4 py-1 focus-within:bg-[var(--invert-bg)] transition-colors duration-150 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
        <Search size={16} className="text-[var(--text-40)] group-focus-within:text-white/60 transition-colors shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, phone, email, region..."
          className="w-full bg-transparent outline-none px-3 py-2.5 text-sm font-semibold text-[var(--text-100)] group-focus-within:text-[var(--invert-text)] placeholder:text-[var(--text-40)] group-focus-within:placeholder:text-white/40 transition-colors duration-150"
        />
      </div>

      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-[var(--text-40)] text-sm text-center py-10 font-semibold">No members found.</p>}
        {filtered.map((m) => {
          const vipActive = m.vipExpiresAt ? m.vipExpiresAt.toMillis() > Date.now() : false;
          return (
            <div
              key={m.uid}
              className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)]"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-extrabold text-[var(--text-90)]">{m.name || 'Unnamed member'}</p>
                  <p className="text-xs font-semibold text-[var(--text-50)]">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {vipActive && (
                    <span className="text-[10px] font-extrabold uppercase bg-[var(--invert-bg)] text-[var(--invert-text)] px-2.5 py-1 rounded-full">VIP</span>
                  )}
                  {m.banned && (
                    <span className="text-[10px] font-extrabold uppercase bg-red-100 text-red-600 px-2.5 py-1 rounded-full">Banned</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-[var(--text-60)]">
                <span>{m.countryCode} {m.phoneNumber || '---'}</span>
                <span>{m.region || m.countryName || '---'}</span>
                <span>{m.gender || '---'}</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => extendMemberVip(m.uid, Date.now() + VIP_DURATION_MS)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-70)] border border-[var(--border-60)] transition-all"
                >
                  Extend VIP 90d
                </button>
                <button
                  onClick={() => setMemberBanned(m.uid, !m.banned)}
                  className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-70)] border border-[var(--border-60)] transition-all"
                >
                  {m.banned ? 'Unban' : 'Ban from chat'}
                </button>
                {confirmDeleteUid === m.uid ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { adminDeleteMemberDoc(m.uid); setConfirmDeleteUid(null); }}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-[var(--invert-text)] transition-all"
                    >
                      Confirm delete
                    </button>
                    <button
                      onClick={() => setConfirmDeleteUid(null)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] text-[var(--text-60)] border border-[var(--border-60)]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteUid(m.uid)}
                    className="text-xs font-bold px-3 py-1.5 rounded-full bg-[var(--surface-70)] hover:bg-red-50 text-[var(--text-60)] hover:text-red-500 border border-[var(--border-60)] transition-all"
                  >
                    Delete member data
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

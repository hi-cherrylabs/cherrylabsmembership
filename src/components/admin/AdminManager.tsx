import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KeyRound, Copy, Check, ShieldAlert, ShieldCheck, Clock, Trash2, UserPlus, RefreshCw } from 'lucide-react';
import { createAdminToken, subscribeAdminTokens, revokeAdminToken } from '../../lib/data';
import { useAuth } from '../../context/AuthContext';
import type { AdminToken } from '../../types';

export default function AdminManager() {
  const { isSuperAdmin } = useAuth();
  const [tokens, setTokens] = useState<AdminToken[]>([]);
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'standard' | 'time_based'>('standard');
  const [durationHours, setDurationHours] = useState(24);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [lastGenerated, setLastGenerated] = useState<AdminToken | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    const unsub = subscribeAdminTokens((data) => setTokens(data as AdminToken[]));
    return () => unsub();
  }, [isSuperAdmin]);

  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] text-center text-xs font-bold text-red-500">
        Access restricted. This section is strictly reserved for the Supreme Administrator.
      </div>
    );
  }

  const handleGenerate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Please enter an email address.');
      return;
    }
    setLoading(true);
    try {
      const newToken = await createAdminToken(email.trim(), type, durationHours);
      setLastGenerated(newToken as any);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to generate access token.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2500);
  };

  const handleRevoke = async (token: AdminToken) => {
    if (window.confirm(`Revoke admin privileges for ${token.email}? They will immediately lose access to the Admin Panel.`)) {
      try {
        await revokeAdminToken(token.id, token.email);
      } catch (err: any) {
        alert('Failed to revoke admin privileges. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto pb-12">
      {/* HEADER */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <KeyRound size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[var(--text-100)] tracking-tight">Admin Token Authorization</h2>
            <p className="text-xs font-bold text-[var(--text-60)]">
              Grant single-use administrator tokens to team members. Reserved exclusively for Super Admin.
            </p>
          </div>
        </div>
      </div>

      {/* TOKEN GENERATOR CARD */}
      <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] shadow-sm flex flex-col gap-6">
        <h3 className="text-sm font-extrabold text-[var(--text-90)] flex items-center gap-2">
          <UserPlus size={18} className="text-amber-500" />
          Authorize New Administrator Email
        </h3>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
            <ShieldAlert size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-extrabold text-[var(--text-70)]">Target Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. developer@cherrylabs.inc"
              className="px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-sm font-bold placeholder:text-[var(--text-40)] outline-none focus:border-amber-500/60 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* TYPE SELECTION */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-extrabold text-[var(--text-70)]">Access Privilege Type</label>
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)]">
                <button
                  type="button"
                  onClick={() => setType('standard')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                    type === 'standard'
                      ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] shadow-sm'
                      : 'text-[var(--text-60)] hover:text-[var(--text-100)]'
                  }`}
                >
                  Standard (Permanent)
                </button>
                <button
                  type="button"
                  onClick={() => setType('time_based')}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all ${
                    type === 'time_based'
                      ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] shadow-sm'
                      : 'text-[var(--text-60)] hover:text-[var(--text-100)]'
                  }`}
                >
                  Time-Based (Expiring)
                </button>
              </div>
            </div>

            {/* DURATION SELECTION (IF TIME BASED) */}
            {type === 'time_based' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-[var(--text-70)]">Expiration Duration</label>
                <select
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  className="px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-xs font-bold outline-none focus:border-amber-500/60 transition-colors"
                >
                  <option value={1}>1 Hour (Temporary Access)</option>
                  <option value={12}>12 Hours (1 Shift)</option>
                  <option value={24}>24 Hours (1 Day)</option>
                  <option value={72}>72 Hours (3 Days)</option>
                  <option value={168}>7 Days (1 Week)</option>
                  <option value={720}>30 Days (1 Month)</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 px-6 py-3.5 rounded-2xl bg-amber-500 text-black font-black text-sm hover:bg-amber-400 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <KeyRound size={18} />}
            Generate Single-Use Access Token
          </button>
        </form>

        {/* LAST GENERATED TOKEN CARD */}
        <AnimatePresence>
          {lastGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-600 dark:text-amber-400 tracking-wider uppercase">
                  Token Ready for Copy
                </span>
                <span className="text-[11px] font-bold text-[var(--text-60)]">Single-Use Only</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-[var(--surface-80)] p-3 rounded-xl border border-[var(--border-50)]">
                <span className="font-mono text-lg font-black tracking-widest text-[var(--text-100)]">
                  {lastGenerated.token}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(lastGenerated.token, lastGenerated.id)}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1.5 hover:bg-amber-400 active:scale-95 transition-all"
                >
                  {copiedTokenId === lastGenerated.id ? <Check size={16} /> : <Copy size={16} />}
                  {copiedTokenId === lastGenerated.id ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
              <p className="text-[11px] font-bold text-[var(--text-70)]">
                Send this code to <strong className="text-[var(--text-100)]">{lastGenerated.email}</strong>. They must enter it under "Membership details" to confirm admin role.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* AUTHORIZED TOKENS & ADMIN LIST */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-extrabold text-[var(--text-90)] flex items-center gap-2">
          <ShieldCheck size={18} className="text-emerald-500" />
          Active & Pending Admin Authorizations ({tokens.length})
        </h3>

        {tokens.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] text-center text-xs font-bold text-[var(--text-50)]">
            No admin tokens issued yet. Use the generator above to authorize additional admins.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tokens.map((t) => {
              const isRevoked = t.status === 'revoked';
              const isUsed = t.status === 'used' || t.used || t.status === 'active';
              const isExpired = t.status === 'expired' || (!isUsed && t.expiresAt && typeof t.expiresAt.toMillis === 'function' && t.expiresAt.toMillis() <= Date.now());

              let statusBadgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
              let statusLabel = 'Pending Verification';

              if (isRevoked) {
                statusBadgeClass = 'bg-red-500/10 text-red-500 border-red-500/20';
                statusLabel = 'Revoked';
              } else if (isUsed) {
                statusBadgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
                statusLabel = 'used';
              } else if (isExpired) {
                statusBadgeClass = 'bg-gray-500/10 text-gray-400 border-gray-500/20';
                statusLabel = 'Expired';
              }

              return (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-[var(--surface-50)] border border-[var(--border-70)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[var(--text-100)]">{t.email}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${statusBadgeClass}`}>
                        Status: {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-60)] font-bold">
                      <span className="font-mono font-bold text-[var(--text-90)]">{t.token || 'Key deleted from DB'}</span>
                      <span>•</span>
                      <span>{t.type === 'time_based' ? `Expiring (${t.durationHours}h)` : 'Standard'}</span>
                      {t.expiresAt && typeof t.expiresAt.toMillis === 'function' && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(t.expiresAt.toMillis()).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopy(t.token, t.id)}
                      className="px-3 py-1.5 rounded-xl bg-[var(--surface-20)] hover:bg-[var(--surface-30)] border border-[var(--border-50)] text-xs font-bold text-[var(--text-80)] flex items-center gap-1 transition-all"
                    >
                      {copiedTokenId === t.id ? <Check size={14} /> : <Copy size={14} />}
                      {copiedTokenId === t.id ? 'Copied' : 'Copy'}
                    </button>
                    {!isRevoked && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(t)}
                        className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-extrabold text-red-500 flex items-center gap-1 transition-all"
                      >
                        <Trash2 size={14} />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

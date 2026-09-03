import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, Trash2, ShieldOff, Clock, Shield, RefreshCw } from 'lucide-react';
import {
  createAdminToken,
  subscribeAdminTokens,
  subscribeAdmins,
  revokeAdminToken,
  deleteAdminToken,
  revokeAdminAccess,
} from '../../lib/data';
import { useAuth } from '../../context/AuthContext';
import type { AdminToken, UserProfile } from '../../types';
import { ADMIN_EMAIL } from '../../lib/constants';

const DURATION_OPTIONS = [
  { label: '1 Hour', hours: 1 },
  { label: '6 Hours', hours: 6 },
  { label: '24 Hours', hours: 24 },
  { label: '7 Days', hours: 168 },
  { label: '30 Days', hours: 720 },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function formatExpiry(token: AdminToken): string {
  if (token.tokenType === 'standard') return 'No expiry';
  if (!token.expiresAt) return 'No expiry';
  const ms = token.expiresAt.toMillis();
  if (ms < Date.now()) return 'Expired';
  const diff = ms - Date.now();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return 'Expiring soon';
}

function formatAdminExpiry(profile: UserProfile): string {
  if (profile.adminType === 'super') return 'Permanent (Super)';
  if (profile.adminType === 'standard') return 'Permanent';
  if (!profile.adminExpiresAt) return 'Permanent';
  const ms = profile.adminExpiresAt.toMillis();
  if (ms < Date.now()) return 'Expired';
  const diff = ms - Date.now();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return 'Expiring soon';
}

export default function AdminAdmins() {
  const { user } = useAuth();
  const [tokens, setTokens] = useState<AdminToken[]>([]);
  const [admins, setAdmins] = useState<UserProfile[]>([]);

  // Form state
  const [targetEmail, setTargetEmail] = useState('');
  const [tokenType, setTokenType] = useState<'standard' | 'timebound'>('standard');
  const [durationHours, setDurationHours] = useState(24);
  const [generating, setGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');

  // Per-token copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubs = [
      subscribeAdminTokens(setTokens),
      subscribeAdmins(setAdmins),
    ];
    return () => unsubs.forEach((u) => u());
  }, []);

  const handleGenerate = async () => {
    setFormError('');
    const email = targetEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (email === ADMIN_EMAIL.toLowerCase()) {
      setFormError('The super admin email cannot be granted secondary access.');
      return;
    }
    setGenerating(true);
    try {
      const code = await createAdminToken(
        user!.email!,
        email,
        tokenType,
        tokenType === 'timebound' ? durationHours : undefined
      );
      setGeneratedCode(code);
      setTargetEmail('');
    } catch {
      setFormError('Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyGenerated = () => {
    if (!generatedCode) return;
    copyToClipboard(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyToken = (token: AdminToken) => {
    copyToClipboard(token.tokenCode);
    setCopiedId(token.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const pendingTokens = tokens.filter((t) => !t.used && !t.revoked);
  const usedOrRevokedTokens = tokens.filter((t) => t.used || t.revoked);
  // Filter admins — exclude the super admin from the "managed" list
  const managedAdmins = admins.filter(
    (a) => a.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
  );

  return (
    <div className="p-5 flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Generated Token Banner */}
      <AnimatePresence>
        {generatedCode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 rounded-2xl flex flex-col gap-3"
          >
            <p className="text-xs font-bold text-green-700">
              ✅ Token generated! Copy it and send to the authorized user.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-2.5 bg-white border border-green-300 rounded-xl text-sm font-mono font-bold text-green-800 tracking-widest">
                {generatedCode}
              </code>
              <button
                onClick={handleCopyGenerated}
                className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors shrink-0"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
            <button
              onClick={() => setGeneratedCode(null)}
              className="text-xs font-bold text-green-600 hover:underline text-left"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate New Token */}
      <div className="bg-[var(--surface-40)] border border-[var(--border-60)] rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
        <h3 className="text-sm font-extrabold text-[var(--text-90)] flex items-center gap-2">
          <Shield size={16} className="text-pink-500" />
          Grant Admin Access
        </h3>

        <input
          type="email"
          value={targetEmail}
          onChange={(e) => { setTargetEmail(e.target.value); setFormError(''); }}
          placeholder="Email to authorize..."
          className="w-full px-4 py-3 bg-[var(--surface-60)] border border-[var(--border-70)] rounded-xl outline-none focus:ring-2 focus:ring-pink-400/50 text-sm font-semibold text-[var(--text-100)] placeholder:text-[var(--text-40)]"
        />

        {/* Token Type */}
        <div className="flex gap-2">
          <button
            onClick={() => setTokenType('standard')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all ${
              tokenType === 'standard'
                ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                : 'bg-[var(--surface-60)] border-[var(--border-70)] text-[var(--text-70)]'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setTokenType('timebound')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider border transition-all flex items-center justify-center gap-1 ${
              tokenType === 'timebound'
                ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                : 'bg-[var(--surface-60)] border-[var(--border-70)] text-[var(--text-70)]'
            }`}
          >
            <Clock size={12} /> Time-Based
          </button>
        </div>

        {/* Duration picker */}
        <AnimatePresence>
          {tokenType === 'timebound' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pt-1">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.hours}
                    onClick={() => setDurationHours(opt.hours)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      durationHours === opt.hours
                        ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                        : 'bg-[var(--surface-60)] border-[var(--border-60)] text-[var(--text-70)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {formError && (
          <p className="text-xs font-bold text-red-500">{formError}</p>
        )}

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-xl font-extrabold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-md"
        >
          {generating ? 'Generating…' : 'Generate Access Token'}
        </button>
      </div>

      {/* Active Admins */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-extrabold text-[var(--text-50)] uppercase tracking-widest px-1">
          Active Secondary Admins ({managedAdmins.length})
        </h3>
        {managedAdmins.length === 0 ? (
          <p className="text-xs text-[var(--text-40)] font-semibold py-4 text-center">
            No secondary admins yet.
          </p>
        ) : (
          managedAdmins.map((admin) => (
            <div
              key={admin.uid}
              className="bg-[var(--surface-40)] border border-[var(--border-60)] rounded-2xl p-3.5 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-sm font-extrabold text-[var(--text-90)]">{admin.name || admin.email}</p>
                <p className="text-xs font-medium text-[var(--text-50)]">{admin.email}</p>
                <p className={`text-[10px] font-bold mt-0.5 ${
                  admin.adminExpiresAt && admin.adminExpiresAt.toMillis() < Date.now()
                    ? 'text-red-500'
                    : 'text-green-600'
                }`}>
                  {formatAdminExpiry(admin)}
                </p>
              </div>
              <button
                onClick={() => revokeAdminAccess(admin.uid)}
                className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors shrink-0"
                title="Revoke admin access"
              >
                <ShieldOff size={15} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Pending Tokens */}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-extrabold text-[var(--text-50)] uppercase tracking-widest px-1">
          Pending Tokens ({pendingTokens.length})
        </h3>
        {pendingTokens.length === 0 ? (
          <p className="text-xs text-[var(--text-40)] font-semibold py-4 text-center">
            No pending tokens.
          </p>
        ) : (
          pendingTokens.map((token) => (
            <div
              key={token.id}
              className="bg-[var(--surface-40)] border border-[var(--border-60)] rounded-2xl p-3.5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[var(--text-90)]">{token.targetEmail}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      token.tokenType === 'standard'
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'bg-orange-50 text-orange-600 border border-orange-200'
                    }`}>
                      {token.tokenType === 'standard' ? 'Standard' : 'Time-Based'}
                    </span>
                    <span className="text-[10px] font-semibold text-[var(--text-40)]">
                      {formatExpiry(token)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopyToken(token)}
                    className="w-8 h-8 rounded-xl bg-[var(--surface-70)] border border-[var(--border-60)] flex items-center justify-center text-[var(--text-70)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-colors"
                    title="Copy token code"
                  >
                    {copiedId === token.id ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                  <button
                    onClick={() => revokeAdminToken(token.id)}
                    className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                    title="Revoke token"
                  >
                    <RefreshCw size={13} />
                  </button>
                  <button
                    onClick={() => deleteAdminToken(token.id)}
                    className="w-8 h-8 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors"
                    title="Delete token"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <code className="text-xs font-mono font-bold text-[var(--text-80)] bg-[var(--surface-60)] px-3 py-1.5 rounded-lg tracking-widest">
                {token.tokenCode}
              </code>
            </div>
          ))
        )}
      </div>

      {/* Used/Revoked history */}
      {usedOrRevokedTokens.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-extrabold text-[var(--text-50)] uppercase tracking-widest px-1">
            History ({usedOrRevokedTokens.length})
          </h3>
          {usedOrRevokedTokens.map((token) => (
            <div
              key={token.id}
              className="bg-[var(--surface-25)] border border-[var(--border-50)] rounded-2xl p-3.5 flex items-center justify-between gap-2 opacity-60"
            >
              <div>
                <p className="text-xs font-bold text-[var(--text-80)]">{token.targetEmail}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  token.revoked
                    ? 'bg-red-50 text-red-500 border border-red-200'
                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {token.revoked ? 'Revoked' : `Used by ${token.usedByEmail || 'user'}`}
                </span>
              </div>
              <button
                onClick={() => deleteAdminToken(token.id)}
                className="w-7 h-7 rounded-xl bg-[var(--surface-60)] flex items-center justify-center text-[var(--text-50)] hover:bg-red-100 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

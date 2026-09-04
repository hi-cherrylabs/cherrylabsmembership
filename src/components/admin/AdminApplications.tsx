import { useState } from 'react';
import { KeyRound, Check, ShieldAlert, Clock, Copy, RefreshCw } from 'lucide-react';
import { updateApplicationStatus, updateApplicationNote } from '../../lib/data';
import type { Application, ApplicationStatus } from '../../types';

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  new: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  reviewing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  accepted: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
};

function ApplicationCard({ app }: { app: Application; key?: string }) {
  const [note, setNote] = useState(app.adminNote || '');
  const [savingNote, setSavingNote] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  // Accept configuration state
  const [tokenType, setTokenType] = useState<'standard' | 'time_based'>('standard');
  const [durationHours, setDurationHours] = useState(24);
  const [accepting, setAccepting] = useState(false);

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await updateApplicationNote(app.id, note);
    } finally {
      setSavingNote(false);
    }
  };

  const handleAccept = async () => {
    setAccepting(true);
    try {
      await updateApplicationStatus(app.id, 'accepted', app.role, app.uid, tokenType, durationHours);
    } finally {
      setAccepting(false);
    }
  };

  const handleStatusChange = async (s: ApplicationStatus) => {
    if (s === 'accepted') {
      await handleAccept();
    } else {
      await updateApplicationStatus(app.id, s, app.role, app.uid);
    }
  };

  const copyToken = () => {
    if (app.tokenCode) {
      navigator.clipboard.writeText(app.tokenCode);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  return (
    <div className="bg-[var(--surface-50)] backdrop-blur-2xl border border-[var(--border-70)] rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-black text-base text-[var(--text-100)]">{app.name || 'Unnamed Applicant'}</h3>
          <p className="text-xs font-bold text-[var(--text-60)]">{app.phoneNumber} &middot; {app.region}</p>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${STATUS_STYLES[app.status]}`}>
          {app.status}
        </span>
      </div>

      <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--text-60)]">Applying for Field:</span>
        <span className="text-xs font-black text-[var(--text-100)] uppercase tracking-wider">{app.role}</span>
      </div>

      {/* GENERATED TOKEN INFO IF ACCEPTED */}
      {app.tokenCode && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <KeyRound size={14} /> Generated Access Token
            </span>
            <span className="text-[10px] font-extrabold text-[var(--text-60)] uppercase">
              {app.tokenStatus || 'pending verification'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[var(--surface-80)] p-3 rounded-xl border border-[var(--border-50)]">
            <span className="font-mono text-base font-black tracking-widest text-[var(--text-100)]">
              {app.tokenCode}
            </span>
            <button
              onClick={copyToken}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1 hover:bg-amber-400 transition-all"
            >
              {copiedToken ? <Check size={14} /> : <Copy size={14} />}
              {copiedToken ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}

      {/* ACCEPT CONFIGURATION PANEL FOR PENDING/REVIEWING APPLICATIONS */}
      {app.status !== 'accepted' && (
        <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-3">
          <span className="text-xs font-extrabold text-[var(--text-90)]">Authorize Access Token Type</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTokenType('standard')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                tokenType === 'standard'
                  ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                  : 'bg-[var(--surface-50)] text-[var(--text-60)] border-[var(--border-50)]'
              }`}
            >
              Standard (Permanent)
            </button>
            <button
              type="button"
              onClick={() => setTokenType('time_based')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all border ${
                tokenType === 'time_based'
                  ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                  : 'bg-[var(--surface-50)] text-[var(--text-60)] border-[var(--border-50)]'
              }`}
            >
              Time-Based (Expiring)
            </button>
          </div>

          {tokenType === 'time_based' && (
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="px-3 py-2 rounded-xl bg-[var(--surface-50)] border border-[var(--border-50)] text-xs font-bold text-[var(--text-100)] outline-none"
            >
              <option value={1}>1 Hour Duration</option>
              <option value={12}>12 Hours Duration</option>
              <option value={24}>24 Hours Duration</option>
              <option value={72}>72 Hours (3 Days)</option>
              <option value={168}>7 Days (1 Week)</option>
            </select>
          )}
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-2">
        {(['new', 'reviewing', 'accepted', 'rejected'] as ApplicationStatus[]).map((s) => (
          <button
            key={s}
            disabled={accepting}
            onClick={() => handleStatusChange(s)}
            className={`text-xs font-black px-4 py-2 rounded-xl capitalize transition-all border ${
              app.status === s
                ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                : 'bg-[var(--surface-20)] text-[var(--text-70)] border-[var(--border-50)] hover:bg-[var(--surface-30)]'
            }`}
          >
            {s === 'accepted' ? (accepting ? 'Generating Token...' : 'Approve & Issue Token') : s}
          </button>
        ))}
      </div>

      {/* ADMIN NOTE */}
      <div className="flex items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Internal admin note..."
          className="flex-1 px-4 py-2.5 bg-[var(--surface-20)] border border-[var(--border-50)] rounded-xl outline-none text-xs font-bold text-[var(--text-100)] placeholder:text-[var(--text-40)]"
        />
        <button
          onClick={saveNote}
          disabled={savingNote}
          className="text-xs font-black px-4 py-2.5 rounded-xl bg-[var(--surface-20)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-80)] border border-[var(--border-50)] transition-all disabled:opacity-50"
        >
          {savingNote ? <RefreshCw size={14} className="animate-spin" /> : 'Save Note'}
        </button>
      </div>
    </div>
  );
}

export default function AdminApplications({ applications }: { applications: Application[] }) {
  return (
    <div className="p-6 flex flex-col gap-4 max-w-3xl mx-auto">
      {applications.length === 0 && (
        <p className="text-[var(--text-40)] text-sm text-center py-10 font-bold">No candidate applications received yet.</p>
      )}
      {applications.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </div>
  );
}

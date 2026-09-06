import { useState } from 'react';
import { KeyRound, Check, ShieldAlert, Clock, Copy, RefreshCw, Trash2, Ban } from 'lucide-react';
import {
  updateApplicationStatus,
  updateApplicationNote,
  generateEmployeeTokenForApplication,
  revokeEmployeeToken,
  deleteEmployeeToken,
} from '../../lib/data';
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

  // Accept/Token configuration state
  const [tokenType, setTokenType] = useState<'standard' | 'time_based'>('standard');
  const [durationHours, setDurationHours] = useState(24);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await updateApplicationNote(app.id, note);
    } finally {
      setSavingNote(false);
    }
  };

  const handleGenerateToken = async () => {
    setGenerating(true);
    try {
      await generateEmployeeTokenForApplication(app.id, app.uid, app.role, tokenType, durationHours);
    } catch {
      alert('Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeToken = async () => {
    if (window.confirm(`Revoke token for ${app.name}? Their role access will be removed immediately.`)) {
      setRevoking(true);
      try {
        await revokeEmployeeToken(app.id, app.uid, app.role);
      } finally {
        setRevoking(false);
      }
    }
  };

  const handleDeleteToken = async () => {
    if (window.confirm(`Delete token record for ${app.name}? This removes the generated key from Firebase.`)) {
      setDeleting(true);
      try {
        await deleteEmployeeToken(app.id, app.uid, app.role);
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleStatusChange = async (s: ApplicationStatus) => {
    if (s === 'accepted') {
      await handleGenerateToken();
    } else {
      await updateApplicationStatus(app.id, s);
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
        <span className="text-xs font-bold text-[var(--text-60)]">Applied Field:</span>
        <span className="text-xs font-black text-[var(--text-100)] uppercase tracking-wider">{app.role}</span>
      </div>

      {/* TOKEN MANAGEMENT PANEL IF TOKEN EXISTS OR WAS USED */}
      {app.tokenCode || app.tokenStatus === 'used' || app.tokenStatus === 'redeemed' ? (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <KeyRound size={14} /> Token Key Status
            </span>
            <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              Status: {app.tokenStatus === 'redeemed' ? 'used' : (app.tokenStatus || 'pending')}
            </span>
          </div>

          {app.tokenCode ? (
            <div className="flex items-center justify-between gap-3 bg-[var(--surface-80)] p-3 rounded-xl border border-[var(--border-50)]">
              <span className="font-mono text-base font-black tracking-widest text-[var(--text-100)]">
                {app.tokenCode}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={copyToken}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-extrabold text-xs flex items-center gap-1 hover:bg-amber-400 transition-all"
                >
                  {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                  {copiedToken ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-[var(--surface-80)] border border-[var(--border-50)] text-xs font-bold text-[var(--text-70)]">
              Token authorized & used (token key deleted from database).
            </div>
          )}

          <div className="flex items-center gap-2 justify-end pt-1">
            {app.tokenStatus !== 'revoked' && app.tokenStatus !== 'used' && app.tokenStatus !== 'redeemed' && (
              <button
                type="button"
                disabled={revoking}
                onClick={handleRevokeToken}
                className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-black text-xs flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <Ban size={14} />
                {revoking ? 'Revoking…' : 'Revoke Token'}
              </button>
            )}
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteToken}
              className="px-3 py-1.5 rounded-xl bg-gray-500/10 hover:bg-gray-500/20 text-[var(--text-70)] border border-gray-500/20 font-black text-xs flex items-center gap-1 transition-all disabled:opacity-50"
            >
              <Trash2 size={14} />
              {deleting ? 'Deleting…' : 'Delete Record'}
            </button>
          </div>
        </div>
      ) : (
        /* TOKEN CONFIGURATION & GENERATE BUTTON */
        <div className="p-4 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] flex flex-col gap-3">
          <span className="text-xs font-extrabold text-[var(--text-90)]">Authorize Token Key Privilege</span>
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

          <button
            type="button"
            disabled={generating}
            onClick={handleGenerateToken}
            className="mt-1 px-4 py-3 rounded-xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? <RefreshCw size={16} className="animate-spin" /> : <KeyRound size={16} />}
            Generate Access Token & Approve
          </button>
        </div>
      )}

      {/* STATUS & REJECT BUTTONS */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleStatusChange('reviewing')}
          className={`text-xs font-black px-4 py-2 rounded-xl capitalize transition-all border ${
            app.status === 'reviewing'
              ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
              : 'bg-[var(--surface-20)] text-[var(--text-70)] border-[var(--border-50)] hover:bg-[var(--surface-30)]'
          }`}
        >
          Set Under Review
        </button>
        <button
          onClick={() => handleStatusChange('rejected')}
          className={`text-xs font-black px-4 py-2 rounded-xl capitalize transition-all border ${
            app.status === 'rejected'
              ? 'bg-red-500 text-white border-red-600'
              : 'bg-[var(--surface-20)] text-red-500 border border-red-500/20 hover:bg-red-500/10'
          }`}
        >
          Decline Application
        </button>
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

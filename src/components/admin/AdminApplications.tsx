import { useState } from 'react';
import { updateApplicationStatus, updateApplicationNote } from '../../lib/data';
import type { Application, ApplicationStatus } from '../../types';

const STATUSES: ApplicationStatus[] = ['new', 'reviewing', 'accepted', 'rejected'];

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  new: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  reviewing: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300',
  accepted: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300',
  rejected: 'bg-red-50 text-red-500 dark:bg-red-500/15 dark:text-red-300',
};

function ApplicationCard({ app }: { app: Application; key?: string }) {
  const [note, setNote] = useState(app.adminNote);
  const [savingNote, setSavingNote] = useState(false);

  const saveNote = async () => {
    setSavingNote(true);
    try {
      await updateApplicationNote(app.id, note);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="bg-[var(--surface-40)] backdrop-blur-xl border border-[var(--border-60)] rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_16px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="font-extrabold text-[var(--text-90)]">{app.name || 'Unnamed'}</p>
          <p className="text-xs font-semibold text-[var(--text-50)]">{app.phoneNumber} &middot; {app.region}</p>
        </div>
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[app.status]}`}>
          {app.status}
        </span>
      </div>
      <p className="text-sm font-semibold text-[var(--text-70)]">Applying for: <span className="font-extrabold text-[var(--text-90)]">{app.role}</span></p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => updateApplicationStatus(app.id, s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full capitalize transition-all border ${
              app.status === s
                ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black'
                : 'bg-[var(--surface-70)] text-[var(--text-60)] border-[var(--border-60)] hover:bg-white'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Internal note..."
          className="flex-1 px-3 py-2 bg-[var(--surface-60)] border border-[var(--border-60)] rounded-xl outline-none text-xs font-medium text-[var(--text-80)] placeholder:text-[var(--text-40)]"
        />
        <button
          onClick={saveNote}
          disabled={savingNote}
          className="text-xs font-bold px-3 py-2 rounded-xl bg-[var(--surface-70)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-70)] border border-[var(--border-60)] transition-all disabled:opacity-50"
        >
          {savingNote ? 'Saving\u2026' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function AdminApplications({ applications }: { applications: Application[] }) {
  return (
    <div className="p-6 flex flex-col gap-3 max-w-2xl mx-auto">
      {applications.length === 0 && (
        <p className="text-[var(--text-40)] text-sm text-center py-10 font-semibold">No applications yet.</p>
      )}
      {applications.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </div>
  );
}

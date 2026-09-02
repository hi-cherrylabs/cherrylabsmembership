import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { submitApplication } from '../../lib/data';
import { EMPLOYEE_ROLES } from '../../lib/constants';
import type { UserProfile, Application } from '../../types';

export default function EmployeeView({
  profile,
  onBack,
}: {
  profile: UserProfile;
  onBack: () => void;
}) {
  const [employeeRole, setEmployeeRole] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [latestApplication, setLatestApplication] = useState<Application | null>(null);
  const [checkedExisting, setCheckedExisting] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Restore "already applied" state across refreshes. Deliberately no
  // orderBy here (just the uid filter) so this never needs a Firestore
  // composite index to be deployed - we just sort the handful of results
  // client-side instead.
  useEffect(() => {
    const q = query(collection(db, 'applications'), where('uid', '==', profile.uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Application, 'id'>) }));
          docs.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
          setLatestApplication(docs[0]);
        } else {
          setLatestApplication(null);
        }
        setCheckedExisting(true);
      },
      () => {
        // If this fails for any reason (offline, rules not yet deployed,
        // etc.) fall open to the application form rather than a blank screen.
        setLoadError(true);
        setCheckedExisting(true);
      }
    );
    return unsub;
  }, [profile.uid]);

  const handleSubmit = async () => {
    if (!employeeRole) return;
    setSubmitting(true);
    try {
      await submitApplication(profile.uid, profile.name, profile.phoneNumber, profile.region || profile.countryName, employeeRole);
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = !!latestApplication;

  return (
    <motion.div
      key="dash_employee"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-20 flex flex-col w-full h-full bg-[var(--surface-70)] backdrop-blur-3xl overflow-y-auto"
    >
      <div className="flex items-center gap-4 px-6 py-5 border-b border-[var(--border-50)] bg-[var(--surface-60)] backdrop-blur-2xl shrink-0">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-[var(--surface-80)] flex items-center justify-center hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] transition-all text-[var(--text-80)]"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
        </button>
        <div>
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">Be an Employee</h2>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pt-12 pb-20 px-6">
        {!checkedExisting ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          </div>
        ) : submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center py-20"
          >
            <div className="w-20 h-20 bg-[var(--invert-bg)] rounded-full flex items-center justify-center mb-6 shadow-xl">
              <Check size={40} className="text-[var(--invert-text)]" strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-90)] mb-3">Application Submitted</h2>
            <p className="text-base font-semibold text-[var(--text-60)] leading-relaxed max-w-sm">
              Your details for the <span className="text-[var(--text-100)] font-extrabold">{latestApplication?.role}</span> role have been sent to the admin team.
              {latestApplication?.status && latestApplication.status !== 'new' && (
                <>
                  {' '}Status: <span className="text-[var(--text-100)] font-extrabold capitalize">{latestApplication.status}</span>.
                </>
              )}
            </p>
          </motion.div>
        ) : (
          <>
            {loadError && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-200 text-xs font-semibold text-yellow-700 text-center">
                Couldn't check for a previous application, but you can still apply below.
              </div>
            )}
            <div className="mb-8">
              <p className="text-[15px] font-semibold text-[var(--text-60)] leading-relaxed">Apply for an internal role using your registered membership credentials.</p>
            </div>

            <div className="p-6 rounded-[24px] bg-[var(--surface-40)] border border-[var(--border-60)] flex flex-col gap-4 text-sm mb-8 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-50)] font-bold uppercase tracking-wider text-xs">Applicant</span>
                <span className="text-[var(--text-100)] font-extrabold text-base">{profile.name || 'User'}</span>
              </div>
              <div className="w-full h-[1px] bg-[var(--surface-50)]" />
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-50)] font-bold uppercase tracking-wider text-xs">Contact</span>
                <span className="text-[var(--text-100)] font-extrabold text-base">{profile.phoneNumber || '---'}</span>
              </div>
              <div className="w-full h-[1px] bg-[var(--surface-50)]" />
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-50)] font-bold uppercase tracking-wider text-xs">Region</span>
                <span className="text-[var(--text-100)] font-extrabold text-base">{profile.region || profile.countryName || 'Tanzania'}</span>
              </div>
            </div>

            <div className="mb-10 flex-1">
              <label className="block text-sm font-extrabold text-[var(--text-80)] mb-4 uppercase tracking-wider">Which job do you want to do?</label>
              <div className="flex flex-col gap-3">
                {EMPLOYEE_ROLES.map((role) => (
                  <button
                    key={role}
                    onClick={() => setEmployeeRole(role)}
                    className={`p-5 rounded-2xl font-bold text-left transition-all border ${
                      employeeRole === role
                        ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black shadow-lg scale-[1.02]'
                        : 'bg-[var(--surface-50)] text-[var(--text-70)] border-[var(--border-60)] hover:bg-[var(--surface-80)] hover:scale-[1.01]'
                    }`}
                  >
                    <span className="text-[15px]">{role}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 shrink-0">
              <button
                disabled={!employeeRole || submitting}
                onClick={handleSubmit}
                className="w-full py-5 bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-2xl font-black text-[15px] uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-xl active:scale-[0.98]"
              >
                {submitting ? 'Submitting…' : 'Submit Application'}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Check,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  XCircle,
  Briefcase,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { submitApplication, verifyAndRedeemEmployeeToken } from '../../lib/data';
import { EMPLOYEE_ROLES } from '../../lib/constants';
import type { UserProfile, Application } from '../../types';
import RoleFieldPage from './RoleFieldPage';

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

  // Token redemption state
  const [tokenInput, setTokenInput] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [tokenSuccessRole, setTokenSuccessRole] = useState<string | null>(null);

  // Active role field page view state
  const [openRolePage, setOpenRolePage] = useState<string | null>(null);

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

  const handleRedeemToken = async (e: FormEvent) => {
    e.preventDefault();
    setTokenError('');
    if (!tokenInput.trim()) {
      setTokenError('Please enter your single-use access token.');
      return;
    }
    setTokenLoading(true);
    try {
      const grantedRole = await verifyAndRedeemEmployeeToken(tokenInput, profile);
      setTokenSuccessRole(grantedRole);
      setTokenInput('');
    } catch (err: any) {
      setTokenError(err.message || 'Verification failed. Please check your token.');
    } finally {
      setTokenLoading(false);
    }
  };

  if (openRolePage) {
    return (
      <RoleFieldPage
        role={openRolePage}
        userName={profile.name}
        onBack={() => setOpenRolePage(null)}
      />
    );
  }

  const userRoles = Array.isArray(profile.employeeRoles) ? profile.employeeRoles : [];
  const submitted = !!latestApplication;
  const isAccepted = latestApplication?.status === 'accepted';
  const isRejected = latestApplication?.status === 'rejected';
  const isPending = latestApplication?.status === 'new' || latestApplication?.status === 'reviewing';

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
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">Employment & Role Hub</h2>
          <p className="text-[11px] font-bold text-[var(--text-50)]">Cherry Labs Internal Sectors</p>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col pt-8 pb-20 px-6 gap-6">
        {/* UNLOCKED ROLES SECTION */}
        {userRoles.length > 0 && (
          <div className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] shadow-sm flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-90)] flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              Your Unlocked Workstations ({userRoles.length})
            </h3>

            <div className="flex flex-col gap-2">
              {userRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => setOpenRolePage(r)}
                  className="p-4 rounded-2xl bg-[var(--surface-20)] hover:bg-[var(--surface-30)] border border-[var(--border-50)] flex items-center justify-between text-left transition-all active:scale-[0.98] group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-[var(--text-100)]">{r} Portal</p>
                      <p className="text-[11px] font-bold text-[var(--text-50)]">Tap to open field workstation</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-[var(--text-40)] group-hover:text-[var(--text-100)] group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {!checkedExisting ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-black/20 border-t-black rounded-full animate-spin" />
          </div>
        ) : isAccepted ? (
          /* ACCEPTED APPLICATION & TOKEN ENTRY DOCK */
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] shadow-sm flex flex-col gap-6"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <Check size={28} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  Application Approved
                </span>
                <h3 className="text-xl font-black text-[var(--text-100)]">
                  Welcome to {latestApplication.role}
                </h3>
              </div>
            </div>

            <p className="text-xs font-bold text-[var(--text-70)] leading-relaxed">
              Congratulations! Your application for <strong className="text-[var(--text-100)]">{latestApplication.role}</strong> was accepted by the admin team. Enter your single-use field authorization token code below to unlock your workspace.
            </p>

            {tokenError && (
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold flex items-center gap-2">
                <ShieldAlert size={16} />
                {tokenError}
              </div>
            )}

            {tokenSuccessRole && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex flex-col gap-2">
                <span className="flex items-center gap-2 font-black">
                  <ShieldCheck size={16} /> Workspace Unlocked Successfully!
                </span>
                <button
                  type="button"
                  onClick={() => setOpenRolePage(tokenSuccessRole)}
                  className="mt-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-black font-black text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <ExternalLink size={14} /> Open {tokenSuccessRole} Field Workstation
                </button>
              </div>
            )}

            {!tokenSuccessRole && (
              <form onSubmit={handleRedeemToken} className="flex flex-col gap-3">
                <label className="text-xs font-extrabold text-[var(--text-70)]">Authorization Token Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. EMP-DEV-8K2P"
                    className="flex-1 px-4 py-3 rounded-2xl bg-[var(--surface-20)] border border-[var(--border-50)] text-[var(--text-100)] text-sm font-mono font-bold placeholder:text-[var(--text-40)] outline-none focus:border-amber-500/60 uppercase transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={tokenLoading}
                    className="px-6 py-3 rounded-2xl bg-amber-500 text-black font-black text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {tokenLoading ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                    Verify Token
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        ) : isRejected ? (
          /* REJECTED APPLICATION FLOW */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-red-500/10 border border-red-500/20 text-center flex flex-col items-center gap-4"
          >
            <div className="p-4 rounded-full bg-red-500/20 text-red-500">
              <XCircle size={36} />
            </div>
            <h3 className="text-xl font-black text-[var(--text-100)]">Application Status Update</h3>
            <p className="text-xs font-bold text-[var(--text-70)] max-w-sm leading-relaxed">
              Thank you for applying for <strong className="text-[var(--text-100)]">{latestApplication.role}</strong>. Unfortunately, this position could not be granted at this time. You are welcome to apply for a different field option below!
            </p>
            <button
              type="button"
              onClick={() => setLatestApplication(null)}
              className="mt-2 px-6 py-3 rounded-2xl bg-[var(--invert-bg)] text-[var(--invert-text)] font-extrabold text-xs shadow-md hover:opacity-90 transition-all"
            >
              Apply for a Different Field
            </button>
          </motion.div>
        ) : isPending ? (
          /* PENDING REVIEW STATUS */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-3xl bg-[var(--surface-50)] border border-[var(--border-70)] text-center flex flex-col items-center gap-4 shadow-sm"
          >
            <div className="w-16 h-16 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <RefreshCw size={28} className="animate-spin" />
            </div>
            <h3 className="text-xl font-black text-[var(--text-100)]">Application Under Review</h3>
            <p className="text-xs font-bold text-[var(--text-60)] max-w-sm leading-relaxed">
              Your application for <strong className="text-[var(--text-100)]">{latestApplication.role}</strong> is currently being evaluated by the admin team. Check back here soon for your authorization token!
            </p>
          </motion.div>
        ) : (
          /* APPLICATION FORM */
          <>
            <div className="mb-2">
              <p className="text-[15px] font-semibold text-[var(--text-60)] leading-relaxed">
                Apply for an internal role using your registered membership credentials.
              </p>
            </div>

            <div className="p-6 rounded-[24px] bg-[var(--surface-40)] border border-[var(--border-60)] flex flex-col gap-4 text-sm shadow-sm">
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

            <div className="flex-1">
              <label className="block text-sm font-extrabold text-[var(--text-80)] mb-4 uppercase tracking-wider">
                Which field do you want to join?
              </label>
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

import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Trash2, Edit2, Check } from 'lucide-react';
import { deleteUser } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { updateProfileFields, deleteOwnProfileDoc } from '../../lib/data';
import { useAuth } from '../../context/AuthContext';
import type { UserProfile } from '../../types';

export default function ProfileView({
  profile,
  onBack,
}: {
  profile: UserProfile;
  onBack: () => void;
}) {
  const { logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phoneNumber);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const vipActive = profile.vipExpiresAt ? profile.vipExpiresAt.toMillis() > Date.now() : false;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileFields(profile.uid, { name: name.trim(), phoneNumber: phone.trim() });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOwnProfileDoc(profile.uid);
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
          return;
        } catch {
          // Deleting the auth account can require a recent login; fall back
          // to signing the member out. Their membership data is already gone.
        }
      }
      await logout();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div
      key="dash_profile"
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
          <h2 className="text-[17px] font-extrabold text-[var(--text-90)] leading-tight">Membership Details</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center pt-24 pb-8 px-6 w-full max-w-2xl mx-auto">
        <div className="w-24 h-24 rounded-full overflow-hidden border-[3px] border-white shadow-xl mb-5">
          <img
            src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>

        {editing ? (
          <div className="w-full max-w-xs flex flex-col gap-3 mb-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              className="w-full px-4 py-3 bg-[var(--surface-70)] border border-[var(--border-70)] rounded-xl outline-none focus:ring-2 focus:ring-pink-400/50 text-sm font-bold text-[var(--text-100)] text-center"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full px-4 py-3 bg-[var(--surface-70)] border border-[var(--border-70)] rounded-xl outline-none focus:ring-2 focus:ring-pink-400/50 text-sm font-bold text-[var(--text-100)] text-center"
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Check size={16} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-[var(--text-90)] mb-1">{profile.name || 'Unknown Member'}</h2>
            <p className="text-lg font-bold text-[var(--text-80)] mb-4">{profile.countryCode} {profile.phoneNumber || '---'}</p>
          </>
        )}

        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className={`px-4 py-1.5 rounded-full border font-bold text-xs uppercase tracking-wider shadow-sm ${vipActive ? 'bg-[var(--invert-bg)] text-[var(--invert-text)] border-black' : 'bg-[var(--surface-80)] border-[var(--border-70)] text-[var(--text-70)]'}`}>
            {vipActive ? 'Active VIP' : 'VIP Expired'}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-[var(--surface-80)] border border-[var(--border-70)] text-[var(--text-70)] font-bold text-xs uppercase tracking-wider shadow-sm">
            {profile.region || profile.countryName || 'Tanzania'}
          </span>
          <span className="px-4 py-1.5 rounded-full bg-[var(--surface-80)] border border-[var(--border-70)] text-[var(--text-70)] font-bold text-xs uppercase tracking-wider shadow-sm">
            {profile.gender || 'Not Specified'}
          </span>
        </div>
      </div>

      <div className="w-full p-4 bg-[var(--surface-40)] backdrop-blur-xl border-t border-[var(--border-60)] flex gap-3 shrink-0">
        <div className="w-full max-w-2xl mx-auto flex gap-3">
          {confirmingDelete ? (
            <div className="flex-1 flex flex-col items-center gap-2 py-3 bg-red-50 rounded-2xl border border-red-200 px-4">
              <p className="text-xs font-bold text-red-600 text-center">Delete your account? This can't be undone.</p>
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setConfirmingDelete(false)}
                  className="flex-1 py-2 rounded-xl bg-white text-[var(--text-70)] font-bold text-xs border border-[var(--border-black-10)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-xl bg-red-500 text-[var(--invert-text)] font-bold text-xs disabled:opacity-60"
                >
                  {deleting ? 'Deleting…' : 'Confirm delete'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-[var(--surface-80)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-80)] rounded-2xl transition-all border border-[var(--border-60)] active:scale-[0.98] group shadow-sm"
              >
                <Trash2 size={20} strokeWidth={2.5} className="group-hover:text-red-400 transition-colors" />
                <span className="text-[11px] font-extrabold uppercase tracking-wide">Delete</span>
              </button>
              <button
                onClick={() => { setEditing(!editing); setName(profile.name); setPhone(profile.phoneNumber); }}
                className="flex-1 flex flex-col items-center justify-center gap-2 py-4 bg-[var(--surface-80)] hover:bg-[var(--invert-bg)] hover:text-[var(--invert-text)] text-[var(--text-80)] rounded-2xl transition-all border border-[var(--border-60)] active:scale-[0.98] group shadow-sm"
              >
                <Edit2 size={20} strokeWidth={2.5} />
                <span className="text-[11px] font-extrabold uppercase tracking-wide">{editing ? 'Cancel' : 'Edit'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function friendlyAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const message = (err as Error)?.message || 'Something went wrong. Please try again.';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try logging in instead.';
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/popup-closed-by-user':
      return '';
    default:
      return message;
  }
}

export default function SignInScreen() {
  const { signInWithGoogle, signInWithAppleStub, signUpWithEmail, signInWithEmail } = useAuth();

  const [isEmailSheetOpen, setIsEmailSheetOpen] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleApple = async () => {
    setError('');
    try {
      await signInWithAppleStub();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please fill in your email and password.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      key="signin"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
      transition={{ duration: 0.35 }}
      className="relative z-20 flex flex-col items-center mt-8"
    >
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="flex items-center justify-center gap-3 w-[280px] py-3.5 bg-[var(--surface-30)] backdrop-blur-xl border border-[var(--border-60)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-[18px] text-[var(--text-80)] font-medium hover:bg-[var(--surface-50)] hover:-translate-y-0.5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)] disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>

        <button
          onClick={handleApple}
          className="flex items-center justify-center gap-3 w-[280px] py-3.5 bg-[var(--surface-30)] backdrop-blur-xl border border-[var(--border-60)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-[18px] text-[var(--text-80)] font-medium hover:bg-[var(--surface-50)] hover:-translate-y-0.5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.95.92 3.78 2.29-3.21 1.88-2.66 6.32.55 7.64-.74 1.48-1.57 2.87-2.98 3.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.33 2.45-1.92 4.35-3.74 4.25z" />
          </svg>
          Sign in with Apple
        </button>

        <button
          onClick={() => { setIsEmailSheetOpen(!isEmailSheetOpen); setError(''); }}
          className="flex items-center justify-center gap-3 w-[280px] py-3.5 bg-[var(--surface-30)] backdrop-blur-xl border border-[var(--border-60)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] rounded-[18px] text-[var(--text-80)] font-medium hover:bg-[var(--surface-50)] hover:-translate-y-0.5 transition-all duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.1)]"
        >
          <Mail size={20} />
          Sign in with Email
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs font-semibold text-red-500 max-w-[280px] text-center">{error}</p>
      )}

      <AnimatePresence>
        {isEmailSheetOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, height: 'auto', y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, height: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.3 }}
            className="w-[280px] bg-[var(--surface-40)] backdrop-blur-3xl border border-[var(--border-70)] shadow-[0_16px_40px_rgba(0,0,0,0.12)] rounded-[24px] overflow-hidden mt-3"
          >
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between mb-1 px-1">
                <h3 className="text-[15px] font-semibold text-[var(--text-80)]">
                  {mode === 'signup' ? 'Create an Account' : 'Log In'}
                </h3>
                <button
                  onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
                  className="text-[11px] font-bold text-pink-600 hover:underline"
                >
                  {mode === 'signup' ? 'Have an account?' : 'New here?'}
                </button>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-60)] rounded-xl outline-none focus:ring-2 focus:ring-pink-400/50 text-sm placeholder:text-[var(--text-40)] transition-all shadow-inner text-[var(--text-80)] font-medium"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-60)] rounded-xl outline-none focus:ring-2 focus:ring-pink-400/50 text-sm placeholder:text-[var(--text-40)] transition-all shadow-inner text-[var(--text-80)] font-medium"
              />
              {mode === 'signup' && (
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 bg-[var(--surface-50)] border border-[var(--border-60)] rounded-xl outline-none focus:ring-2 focus:ring-pink-400/50 text-sm placeholder:text-[var(--text-40)] transition-all shadow-inner text-[var(--text-80)] font-medium"
                />
              )}
              <button
                onClick={handleEmailSubmit}
                disabled={busy}
                className="w-full py-3 mt-2 bg-gradient-to-r from-[#FF007F] to-[#8F00FF] text-[var(--invert-text)] rounded-xl shadow-md hover:shadow-lg hover:opacity-90 transition-all font-medium border border-[var(--border-20)] disabled:opacity-60"
              >
                {busy ? 'Please wait…' : mode === 'signup' ? 'Submit Details' : 'Log In'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

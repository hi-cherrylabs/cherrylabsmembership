import { createContext, useContext, useEffect, useState, useRef } from 'react';
import type { ReactNode } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  updateProfile,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, setDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { ADMIN_EMAIL, VIP_DURATION_MS, COUNTRIES } from '../lib/constants';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  authLoading: boolean;
  // True once the first real Firestore snapshot has resolved.
  // The app must NOT make routing decisions until this is true
  // (prevents flashing onboarding for already-onboarded users).
  profileHydrated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithAppleStub: () => Promise<never>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  // Stays false until the first Firestore snapshot returns (success or error).
  // While false the routing effect shows the loading spinner.
  const [profileHydrated, setProfileHydrated] = useState(false);
  const unsubProfileRef = useRef<() => void>();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);

      // Clean up any previous profile listener when auth state changes.
      if (unsubProfileRef.current) {
        unsubProfileRef.current();
        unsubProfileRef.current = undefined;
      }

      if (!firebaseUser) {
        setProfile(null);
        setProfileHydrated(true); // No user = nothing to load, release the gate.
        return;
      }

      const isAdminUser = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      const defaultCountry = COUNTRIES[0];

      // Reset hydration gate for this new auth session.
      setProfileHydrated(false);

      const fallbackProfile: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Member',
        gender: '',
        countryCode: defaultCountry.code,
        countryName: defaultCountry.name,
        countryFlag: defaultCountry.flag,
        phoneNumber: '',
        isTanzanian: null,
        region: '',
        onboarded: false,
        banned: false,
        isAdmin: isAdminUser,
        adminType: isAdminUser ? 'super' : undefined,
        createdAt: null,
        vipExpiresAt: Timestamp.fromMillis(Date.now() + VIP_DURATION_MS),
      };

      const userRef = doc(db, 'users', firebaseUser.uid);

      const unsubProfile = onSnapshot(
        userRef,
        (snap) => {
          if (snap.exists()) {
            // Real Firestore data — includes the correct `onboarded` flag.
            setProfile(snap.data() as UserProfile);
          } else {
            // Brand new user — write the profile doc and use the fallback locally.
            setProfile(fallbackProfile);
            setDoc(userRef, {
              ...fallbackProfile,
              createdAt: serverTimestamp(),
            }).catch((err) => {
              console.error('Error creating user profile in Firestore:', err);
            });
          }
          // Release the gate AFTER we have real data (or after we know the doc
          // doesn't exist yet). This prevents the routing effect from ever
          // sending an already-onboarded user back to the reading screen.
          setProfileHydrated(true);
        },
        (err) => {
          console.error('Error listening to profile snapshot:', err);
          // On error, fall back to the local profile so the app is not
          // stuck on the loading spinner forever.
          setProfile(fallbackProfile);
          setProfileHydrated(true);
        }
      );
      unsubProfileRef.current = unsubProfile;
    });

    return () => {
      unsub();
      if (unsubProfileRef.current) unsubProfileRef.current();
    };
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signInWithAppleStub = async (): Promise<never> => {
    throw new Error('Sign in with Apple isn\u2019t available yet. Please try Google or Email instead.');
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (cred.user && !cred.user.displayName) {
      await updateProfile(cred.user, { displayName: email.split('@')[0] });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isSuperAdmin = !!user && user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Secondary admin: profile.isAdmin true AND (no expiry OR not yet expired)
  const isSecondaryAdmin =
    !!profile?.isAdmin &&
    (!profile.adminExpiresAt || profile.adminExpiresAt.toMillis() > Date.now());

  const isAdmin = isSuperAdmin || isSecondaryAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        isSuperAdmin,
        authLoading,
        profileHydrated,
        signInWithGoogle,
        signInWithAppleStub,
        signUpWithEmail,
        signInWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

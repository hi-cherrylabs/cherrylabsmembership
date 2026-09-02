import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web config. Web API keys are not secret credentials - access is
// controlled by Firestore Security Rules and API key restrictions in the
// Google Cloud Console, not by hiding this file. Values can be overridden
// via .env.local (VITE_FIREBASE_*) for multi-environment setups.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAYisSPPWz4lm8rqVul0xqplw5eDJzMcoQ',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cherry-labs-inc.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cherry-labs-inc',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cherry-labs-inc.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '67572581226',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:67572581226:web:3a214490188a68b9fb1b13',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-4K5WMWQ11Y',
};

// Avoid re-initializing during Vite HMR
export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

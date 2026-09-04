import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { SUGGESTION_DAILY_LIMIT, SUGGESTION_WINDOW_MS } from './constants';
import type {
  CommunityMessage,
  SuggestionThread,
  SuggestionMessage,
  Application,
  ApplicationStatus,
  Post,
  UserProfile,
} from '../types';
import { READING_PARAGRAPHS_FALLBACK } from './constants';

export interface BenefitParagraph {
  id: number;
  title: string;
  content: string;
}

/* ----------------------------- User Profile ----------------------------- */

export async function updateProfileFields(uid: string, fields: Partial<UserProfile>) {
  await updateDoc(doc(db, 'users', uid), fields as Record<string, unknown>);
}

export async function deleteOwnProfileDoc(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

/* --------------------------- Community Chat ------------------------------ */

export function subscribeCommunityMessages(cb: (msgs: CommunityMessage[]) => void) {
  const q = query(collection(db, 'community_messages'), orderBy('createdAt', 'asc'), limit(300));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CommunityMessage, 'id'>) })));
  });
}

export async function sendCommunityMessage(uid: string, userName: string, avatar: string, text: string) {
  await addDoc(collection(db, 'community_messages'), {
    uid,
    userName,
    avatar,
    text,
    createdAt: serverTimestamp(),
  });
}

export async function deleteCommunityMessage(id: string) {
  await deleteDoc(doc(db, 'community_messages', id));
}

/* ------------------------- Suggestion / Support --------------------------- */
// One thread doc per user at suggestions/{uid}, messages in a subcollection.

export function subscribeSuggestionThread(uid: string, cb: (thread: SuggestionThread | null) => void) {
  return onSnapshot(doc(db, 'suggestions', uid), (snap) => {
    cb(snap.exists() ? (snap.data() as SuggestionThread) : null);
  });
}

export function subscribeSuggestionMessages(uid: string, cb: (msgs: SuggestionMessage[]) => void) {
  const q = query(collection(db, 'suggestions', uid, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SuggestionMessage, 'id'>) })));
  });
}

export function subscribeAllSuggestionThreads(cb: (threads: SuggestionThread[]) => void) {
  const q = query(collection(db, 'suggestions'), orderBy('lastMessageAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as SuggestionThread));
  });
}

/**
 * Sends a message from the member. Enforces the 4-messages-per-24h limit
 * client-side using the thread doc's rolling window. Firestore rules also
 * cap the user to writing only their own thread/messages, but true
 * tamper-proof rate limiting would need a Cloud Function (Blaze plan) -
 * this is a reasonable best-effort limit for the Spark plan.
 */
export async function sendSuggestionMessageAsUser(uid: string, userName: string, text: string) {
  const threadRef = doc(db, 'suggestions', uid);
  const threadSnap = await getDoc(threadRef);
  const now = Date.now();

  let windowStartMs = now;
  let countInWindow = 0;

  if (threadSnap.exists()) {
    const data = threadSnap.data() as SuggestionThread;
    const existingWindowStart = data.windowStart ? data.windowStart.toMillis() : null;
    if (existingWindowStart && now - existingWindowStart < SUGGESTION_WINDOW_MS) {
      windowStartMs = existingWindowStart;
      countInWindow = data.countInWindow || 0;
    }
  }

  if (countInWindow >= SUGGESTION_DAILY_LIMIT) {
    throw new Error('DAILY_LIMIT_REACHED');
  }

  await addDoc(collection(db, 'suggestions', uid, 'messages'), {
    sender: 'user',
    text,
    createdAt: serverTimestamp(),
  });

  await setDoc(
    threadRef,
    {
      uid,
      userName,
      windowStart: Timestamp.fromMillis(windowStartMs),
      countInWindow: countInWindow + 1,
      unreadByAdmin: true,
      lastMessageAt: serverTimestamp(),
      lastMessageText: text,
    },
    { merge: true }
  );
}

export async function sendSuggestionMessageAsAdmin(uid: string, text: string) {
  await addDoc(collection(db, 'suggestions', uid, 'messages'), {
    sender: 'admin',
    text,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'suggestions', uid), {
    unreadByAdmin: false,
    lastMessageAt: serverTimestamp(),
    lastMessageText: text,
  });
}

/** Admin "Clear inbox" - wipes the thread on both sides. */
export async function clearSuggestionInbox(uid: string) {
  const msgsSnap = await getDocs(collection(db, 'suggestions', uid, 'messages'));
  const batch = writeBatch(db);
  msgsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.set(
    doc(db, 'suggestions', uid),
    {
      uid,
      windowStart: null,
      countInWindow: 0,
      unreadByAdmin: false,
      lastMessageAt: null,
      lastMessageText: '',
    },
    { merge: true }
  );
  await batch.commit();
}

/* ------------------------------ Applications ------------------------------ */

export async function submitApplication(
  uid: string,
  name: string,
  phoneNumber: string,
  region: string,
  role: string
) {
  await addDoc(collection(db, 'applications'), {
    uid,
    name,
    phoneNumber,
    region,
    role,
    status: 'new' as ApplicationStatus,
    adminNote: '',
    createdAt: serverTimestamp(),
  });
}

export function subscribeApplications(cb: (apps: Application[]) => void) {
  const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Application, 'id'>) })));
  });
}

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  role?: string,
  uid?: string,
  tokenType: 'standard' | 'time_based' = 'standard',
  durationHours: number = 24
) {
  if (status === 'accepted') {
    const rolePrefix = (role || 'EMP').slice(0, 3).toUpperCase();
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
    const tokenCode = `EMP-${rolePrefix}-${rand}`;

    let expiresAt: Timestamp | null = null;
    if (tokenType === 'time_based') {
      expiresAt = Timestamp.fromMillis(Date.now() + durationHours * 60 * 60 * 1000);
    }

    await updateDoc(doc(db, 'applications', id), {
      status,
      tokenCode,
      tokenType,
      tokenDurationHours: tokenType === 'time_based' ? durationHours : null,
      tokenExpiresAt: expiresAt,
      tokenStatus: 'pending',
    });

    if (uid && role) {
      const tokenDocId = `${uid}_${role.replace(/\s+/g, '_')}`;
      const empTokenRef = doc(db, 'employee_tokens', tokenDocId);
      await setDoc(empTokenRef, {
        token: tokenCode,
        applicationId: id,
        uid,
        role,
        type: tokenType,
        durationHours: tokenType === 'time_based' ? durationHours : null,
        expiresAt,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    }
  } else {
    await updateDoc(doc(db, 'applications', id), { status });
  }
}

export async function verifyAndRedeemEmployeeToken(enteredCode: string, user: UserProfile) {
  const cleanCode = enteredCode.trim().toUpperCase();
  if (!cleanCode) throw new Error('Please enter your authorization token code.');

  // Find matching employee application for this user
  const appsQuery = query(collection(db, 'applications'), where('uid', '==', user.uid));
  const appsSnap = await getDocs(appsQuery);
  const matchAppDoc = appsSnap.docs.find((d) => {
    const data = d.data() as Application;
    return (
      data.status === 'accepted' &&
      (data.tokenCode || '').trim().toUpperCase() === cleanCode
    );
  });

  if (!matchAppDoc) {
    throw new Error('Invalid or unassigned authorization token code.');
  }

  const appData = matchAppDoc.data() as Application;

  if (appData.tokenStatus === 'redeemed') {
    throw new Error('This token has already been redeemed for access.');
  }

  // Check time-based token expiration
  if (appData.tokenType === 'time_based' && appData.tokenExpiresAt) {
    const expMs = typeof appData.tokenExpiresAt.toMillis === 'function' ? appData.tokenExpiresAt.toMillis() : 0;
    if (expMs && expMs <= Date.now()) {
      await updateDoc(matchAppDoc.ref, { tokenStatus: 'expired' });
      throw new Error('This access token has expired.');
    }
  }

  // Mark application token redeemed
  await updateDoc(matchAppDoc.ref, { tokenStatus: 'redeemed' });

  // Update employee_tokens
  const tokenDocId = `${user.uid}_${appData.role.replace(/\s+/g, '_')}`;
  const empTokenRef = doc(db, 'employee_tokens', tokenDocId);
  await setDoc(empTokenRef, { status: 'redeemed', usedAt: serverTimestamp() }, { merge: true });

  // Add role to user profile
  const currentRoles = Array.isArray(user.employeeRoles) ? user.employeeRoles : [];
  if (!currentRoles.includes(appData.role)) {
    const updatedRoles = [...currentRoles, appData.role];
    await updateDoc(doc(db, 'users', user.uid), { employeeRoles: updatedRoles });
  }

  return appData.role;
}

/* ---------------------------- Role Content ------------------------------- */
import type { RoleFieldContent } from '../types';

export function subscribeRoleContent(role: string, cb: (content: RoleFieldContent | null) => void) {
  return onSnapshot(doc(db, 'role_contents', role), (snap) => {
    if (snap.exists()) {
      cb(snap.data() as RoleFieldContent);
    } else {
      cb(null);
    }
  });
}

export async function saveRoleContent(role: string, content: Partial<RoleFieldContent>) {
  await setDoc(doc(db, 'role_contents', role), { role, ...content }, { merge: true });
}

export async function updateApplicationNote(id: string, adminNote: string) {
  await updateDoc(doc(db, 'applications', id), { adminNote });
}

/* --------------------------------- Posts ---------------------------------- */
// Powers both the announcement carousel and the "What's new" feed.

export function subscribePosts(cb: (posts: Post[]) => void) {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Post, 'id'>) })));
  });
}

export async function createPost(data: Omit<Post, 'id' | 'createdAt'>) {
  await addDoc(collection(db, 'posts'), { ...data, createdAt: serverTimestamp() });
}

export async function updatePost(id: string, data: Partial<Omit<Post, 'id' | 'createdAt'>>) {
  await updateDoc(doc(db, 'posts', id), data as Record<string, unknown>);
}

export async function deletePost(id: string) {
  await deleteDoc(doc(db, 'posts', id));
}

/* -------------------------------- Members --------------------------------- */

export function subscribeAllMembers(cb: (members: UserProfile[]) => void) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as UserProfile));
  });
}

export async function setMemberBanned(uid: string, banned: boolean) {
  await updateDoc(doc(db, 'users', uid), { banned });
}

export async function extendMemberVip(uid: string, newExpiryMs: number) {
  await updateDoc(doc(db, 'users', uid), { vipExpiresAt: Timestamp.fromMillis(newExpiryMs) });
}

/** Removes the member's Firestore profile. Cannot delete their Firebase Auth
 * account from the client without the Admin SDK (Cloud Functions / Blaze
 * plan) - this revokes their membership data and access, not the login
 * credential itself. */
export async function adminDeleteMemberDoc(uid: string) {
  await deleteDoc(doc(db, 'users', uid));
}

/* -------------------------------- Settings --------------------------------- */
// Admin-editable copy for the pre-signup "membership benefits" reading screen.

export function subscribeBenefitParagraphs(cb: (paragraphs: BenefitParagraph[]) => void) {
  return onSnapshot(doc(db, 'settings', 'content'), (snap) => {
    if (snap.exists() && Array.isArray((snap.data() as any).benefitParagraphs)) {
      cb((snap.data() as any).benefitParagraphs as BenefitParagraph[]);
    } else {
      cb(READING_PARAGRAPHS_FALLBACK);
    }
  });
}

export async function saveBenefitParagraphs(paragraphs: BenefitParagraph[]) {
  await setDoc(doc(db, 'settings', 'content'), { benefitParagraphs: paragraphs }, { merge: true });
}

/* ----------------------------- Admin Tokens ------------------------------- */

/** Generates a readable token code e.g. ADM-7K9P-2M4X */
function generateTokenCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 8; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ADM-${rand.slice(0, 4)}-${rand.slice(4)}`;
}

export async function createAdminToken(
  email: string,
  type: 'standard' | 'time_based',
  durationHours: number = 24,
  createdBy: string = 'hello.cherrylabs@gmail.com'
) {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) throw new Error('Email is required.');

  const tokenCode = generateTokenCode();
  const tokenDocRef = doc(collection(db, 'admin_tokens'));
  const nowMs = Date.now();

  let expiresAt: Timestamp | null = null;
  if (type === 'time_based') {
    expiresAt = Timestamp.fromMillis(nowMs + durationHours * 60 * 60 * 1000);
  }

  const newToken = {
    token: tokenCode,
    email: cleanEmail,
    type,
    durationHours: type === 'time_based' ? durationHours : undefined,
    expiresAt,
    used: false,
    usedByUid: null,
    usedAt: null,
    status: 'pending' as const,
    createdBy,
    createdAt: serverTimestamp(),
  };

  await setDoc(tokenDocRef, newToken);
  return { id: tokenDocRef.id, ...newToken };
}

export function subscribeAdminTokens(cb: (tokens: any[]) => void) {
  const q = query(collection(db, 'admin_tokens'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function revokeAdminToken(tokenId: string, targetEmail: string) {
  const cleanEmail = targetEmail.trim().toLowerCase();
  await updateDoc(doc(db, 'admin_tokens', tokenId), { status: 'revoked' });

  // Find user by email and revoke admin privileges in users collection
  const usersSnap = await getDocs(collection(db, 'users'));
  const targetUserDoc = usersSnap.docs.find((d) => (d.data().email || '').toLowerCase() === cleanEmail);
  if (targetUserDoc) {
    await updateDoc(targetUserDoc.ref, {
      isAdmin: false,
      adminExpiresAt: null,
      adminTokenId: null,
    });
  }
}

export async function verifyAndRedeemAdminToken(
  enteredToken: string,
  user: UserProfile
) {
  const cleanToken = enteredToken.trim().toUpperCase();
  if (!cleanToken) throw new Error('Please enter an access token.');
  if (!user.email) throw new Error('Your account must have a valid email to redeem an admin token.');

  const cleanUserEmail = user.email.toLowerCase();

  // Search admin_tokens collection for matching token code
  const tokensSnap = await getDocs(collection(db, 'admin_tokens'));
  const matchingDoc = tokensSnap.docs.find((d) => {
    const data = d.data();
    return (data.token || '').trim().toUpperCase() === cleanToken;
  });

  if (!matchingDoc) {
    throw new Error('Invalid access token code. Please check and try again.');
  }

  const tokenData = matchingDoc.data();

  if (tokenData.used || tokenData.status === 'active') {
    throw new Error('This access token has already been redeemed.');
  }

  if (tokenData.status === 'revoked') {
    throw new Error('This access token has been revoked by the Super Admin.');
  }

  if ((tokenData.email || '').toLowerCase() !== cleanUserEmail) {
    throw new Error('This access token is not authorized for your account.');
  }

  if (tokenData.type === 'time_based' && tokenData.expiresAt) {
    const expMs = typeof tokenData.expiresAt.toMillis === 'function' ? tokenData.expiresAt.toMillis() : 0;
    if (expMs && expMs <= Date.now()) {
      await updateDoc(matchingDoc.ref, { status: 'expired' });
      throw new Error('This access token has expired.');
    }
  }

  // Redeem token
  await updateDoc(matchingDoc.ref, {
    used: true,
    usedByUid: user.uid,
    usedAt: serverTimestamp(),
    status: 'active',
  });

  // Upgrade user profile
  await updateDoc(doc(db, 'users', user.uid), {
    isAdmin: true,
    adminTokenId: matchingDoc.id,
    adminExpiresAt: tokenData.expiresAt || null,
  });

  return { id: matchingDoc.id, ...tokenData };
}

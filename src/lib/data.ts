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
  where,
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
  AdminToken,
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

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  await updateDoc(doc(db, 'applications', id), { status });
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

/* ----------------------------- Admin Tokens ----------------------------- */

/** Generates a random CHERRY-ADM-XXXX-XXXX token code */
export function generateTokenCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = (n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `CHERRY-ADM-${rand(4)}-${rand(4)}`;
}

export async function createAdminToken(
  createdByEmail: string,
  targetEmail: string,
  tokenType: 'standard' | 'timebound',
  durationHours?: number
): Promise<string> {
  const tokenCode = generateTokenCode();
  const now = Timestamp.now();
  const expiresAt =
    tokenType === 'timebound' && durationHours
      ? Timestamp.fromMillis(Date.now() + durationHours * 3600 * 1000)
      : null;

  await addDoc(collection(db, 'admin_tokens'), {
    tokenCode,
    targetEmail: targetEmail.toLowerCase().trim(),
    tokenType,
    durationHours: durationHours ?? null,
    expiresAt,
    used: false,
    usedByUid: null,
    usedByEmail: null,
    usedAt: null,
    createdByEmail: createdByEmail.toLowerCase(),
    createdAt: now,
    revoked: false,
  });

  return tokenCode;
}

export function subscribeAdminTokens(cb: (tokens: AdminToken[]) => void) {
  const q = query(collection(db, 'admin_tokens'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminToken, 'id'>) })));
  });
}

export async function revokeAdminToken(tokenId: string) {
  await updateDoc(doc(db, 'admin_tokens', tokenId), { revoked: true });
}

export async function deleteAdminToken(tokenId: string) {
  await deleteDoc(doc(db, 'admin_tokens', tokenId));
}

/** Called when a user claims a token. Returns error string or null on success. */
export async function verifyAndRedeemToken(
  uid: string,
  userEmail: string,
  tokenCode: string
): Promise<null | string> {
  // Find token matching this code
  const q = query(
    collection(db, 'admin_tokens'),
    where('tokenCode', '==', tokenCode.trim().toUpperCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return 'Invalid token code. Please check and try again.';

  const tokenDoc = snap.docs[0];
  const token = { id: tokenDoc.id, ...(tokenDoc.data() as Omit<AdminToken, 'id'>) };

  if (token.revoked) return 'This token has been revoked by the admin.';
  if (token.used) return 'This access token has already been used and cannot be reused.';
  if (token.targetEmail !== userEmail.toLowerCase())
    return 'This token is not authorized for your email address.';
  if (
    token.tokenType === 'timebound' &&
    token.expiresAt &&
    token.expiresAt.toMillis() < Date.now()
  )
    return 'This token has expired. Please request a new one from the admin.';

  const now = Timestamp.now();
  const expiresAt =
    token.tokenType === 'timebound' && token.expiresAt ? token.expiresAt : null;

  // Mark token as used (one-time only)
  await updateDoc(doc(db, 'admin_tokens', token.id), {
    used: true,
    usedByUid: uid,
    usedByEmail: userEmail.toLowerCase(),
    usedAt: now,
  });

  // Promote user to admin
  await updateDoc(doc(db, 'users', uid), {
    isAdmin: true,
    adminType: token.tokenType === 'standard' ? 'standard' : 'timebound',
    adminGrantedBy: token.createdByEmail,
    adminGrantedAt: now,
    adminExpiresAt: expiresAt,
  });

  return null;
}

export function subscribeAdmins(cb: (admins: UserProfile[]) => void) {
  const q = query(collection(db, 'users'), where('isAdmin', '==', true), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => d.data() as UserProfile));
  });
}

export async function revokeAdminAccess(uid: string) {
  await updateDoc(doc(db, 'users', uid), {
    isAdmin: false,
    adminType: null,
    adminGrantedBy: null,
    adminGrantedAt: null,
    adminExpiresAt: null,
  });
}


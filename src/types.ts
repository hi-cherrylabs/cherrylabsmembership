import type { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string;
  gender: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  phoneNumber: string;
  isTanzanian: boolean | null;
  region: string;
  onboarded: boolean;
  banned: boolean;
  isAdmin: boolean;
  adminType?: 'super' | 'standard' | 'timebound';
  adminGrantedBy?: string;
  adminGrantedAt?: Timestamp | null;
  adminExpiresAt?: Timestamp | null;
  createdAt: Timestamp | null;
  vipExpiresAt: Timestamp | null;
}

export interface AdminToken {
  id: string;
  tokenCode: string;
  targetEmail: string;
  tokenType: 'standard' | 'timebound';
  durationHours?: number;
  expiresAt?: Timestamp | null;
  used: boolean;
  usedByUid?: string | null;
  usedByEmail?: string | null;
  usedAt?: Timestamp | null;
  createdByEmail: string;
  createdAt: Timestamp | null;
  revoked: boolean;
}

export interface CommunityMessage {
  id: string;
  uid: string;
  userName: string;
  avatar: string;
  text: string;
  createdAt: Timestamp | null;
}

export interface SuggestionThread {
  uid: string;
  userName: string;
  windowStart: Timestamp | null;
  countInWindow: number;
  unreadByAdmin: boolean;
  lastMessageAt: Timestamp | null;
  lastMessageText: string;
}

export interface SuggestionMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: Timestamp | null;
}

export type ApplicationStatus = 'new' | 'reviewing' | 'accepted' | 'rejected';

export interface Application {
  id: string;
  uid: string;
  name: string;
  phoneNumber: string;
  region: string;
  role: string;
  status: ApplicationStatus;
  adminNote: string;
  createdAt: Timestamp | null;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  imageUrl: string;
  tag: string;
  badge: string;
  pinned: boolean;
  createdAt: Timestamp | null;
}

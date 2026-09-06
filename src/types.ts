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
  adminTokenId?: string | null;
  adminExpiresAt?: Timestamp | null;
  employeeRoles?: string[];
  createdAt: Timestamp | null;
  vipExpiresAt: Timestamp | null;
  deletionScheduled?: boolean;
  deletionScheduledAt?: Timestamp | null;
  deletionDueDate?: Timestamp | null;
}

export interface AdminToken {
  id: string;
  token?: string | null;
  email: string;
  type: 'standard' | 'time_based';
  durationHours?: number;
  expiresAt: Timestamp | null;
  used: boolean;
  usedByUid: string | null;
  usedAt: Timestamp | null;
  status: 'pending' | 'active' | 'expired' | 'revoked' | 'used';
  createdBy: string;
  createdAt: Timestamp | null;
}

export interface EmployeeToken {
  id: string;
  token: string;
  applicationId: string;
  uid: string;
  role: string;
  status: 'pending' | 'redeemed' | 'revoked' | 'used';
  usedAt: Timestamp | null;
  createdAt: Timestamp | null;
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
  tokenCode?: string;
  tokenType?: 'standard' | 'time_based';
  tokenDurationHours?: number | null;
  tokenExpiresAt?: Timestamp | null;
  tokenStatus?: 'pending' | 'redeemed' | 'revoked' | 'expired' | 'used';
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

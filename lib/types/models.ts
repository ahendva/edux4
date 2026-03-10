// lib/types/models.ts
// Re-exports schema types and adds utility types for Firestore documents.

export type {
  UserRole,
  ConnectionStatus,
  EventType,
  RSVPStatus,
  BaseEntity,
  UserProfile,
  UserSettings,
  NotificationPreferences,
  Classroom,
  Student,
  Conversation,
  Message,
  CalendarEvent,
  ProgressReport,
  SubjectGrade,
  Announcement,
  ConnectionRequest,
  SyncStatus,
} from '../../services/firebase/schema';

import { Timestamp } from 'firebase/firestore';

/** Adds Firestore Timestamp variants to createdAt / updatedAt. */
export type WithTimestamps<T extends { createdAt?: unknown; updatedAt?: unknown }> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt: number | Timestamp;
  updatedAt: number | Timestamp;
};

/** Strips id, createdAt, updatedAt — suitable for create inputs. */
export type CreateInput<T extends { id?: unknown; createdAt?: unknown; updatedAt?: unknown }> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;

/** Makes listed keys required on T. */
export type Require<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Partial update payload — id is required, everything else optional. */
export type UpdateInput<T extends { id: string }> = Pick<T, 'id'> & Partial<Omit<T, 'id'>>;

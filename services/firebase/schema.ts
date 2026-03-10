// services/firebase/schema.ts
// EduX4 Firestore document interfaces
import { Timestamp } from "firebase/firestore";

// ─── Enums & Constants ───────────────────────────────────────────────────────

export type UserRole = "parent" | "teacher" | "admin";
export type ConnectionStatus = "pending" | "accepted" | "rejected" | "blocked";
export type EventType = "meeting" | "deadline" | "event" | "holiday";
export type RSVPStatus = "going" | "maybe" | "not_going";

// ─── Base ────────────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  createdAt?: number | Timestamp;
  updatedAt?: number | Timestamp;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface UserProfile extends BaseEntity {
  username: string;
  displayName: string;
  email: string;
  role: UserRole;
  language: string; // ISO 639-1 code, e.g. "es", "en"
  schoolId?: string;
  children: string[]; // student IDs (for parents)
  connections: string[]; // connected user IDs
  classrooms: string[]; // classroom IDs
  profilePictureUrl?: string | null;
  bio?: string;
  lastLoginDate: number;
  fcmToken?: string; // Expo push token for notifications
  psStaffId?: string; // PowerSchool staff ID (teachers)
  psGuardianId?: string; // PowerSchool guardian ID (parents)
  settings?: UserSettings;
}

export interface UserSettings {
  darkMode: boolean;
  colorScheme?: string;
  themeMode?: 'light' | 'dark' | 'system';
  notificationPreferences?: NotificationPreferences;
}

export interface NotificationPreferences {
  newMessages: boolean;
  eventReminders: boolean;
  reportPublished: boolean;
  connectionRequests: boolean;
  announcements: boolean;
  // Granular per-type controls (added in Phase 2)
  messages: boolean;
  events: boolean;
  reports: boolean;
}

// ─── Classrooms ──────────────────────────────────────────────────────────────

export interface Classroom extends BaseEntity {
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  gradeLevel?: string; // e.g. "9", "10" (from PS)
  termId?: string; // PS term ID
  teacherId: string; // owner
  participantIds: string[]; // parents + teachers
  studentIds: string[]; // student records
  imageUrl?: string;
  joinCode?: string; // 6-char code for parents to join
  psSectionId?: string; // PowerSchool section ID
  psSchoolId?: string;
  isArchived?: boolean;
}

// ─── Students ────────────────────────────────────────────────────────────────

export interface Student extends BaseEntity {
  firstName: string;
  lastName: string;
  grade?: string;
  parentIds: string[]; // user IDs of parents
  classroomIds: string[];
  attendanceSummary?: AttendanceSummary;
  psStudentId?: string; // PowerSchool student ID
  psEnrollmentId?: string;
  psGuardianId?: string; // matched PS guardian ID
}

export interface AttendanceSummary {
  presentCount: number;
  absentCount: number;
  tardyCount: number;
  excusedCount: number;
  lastUpdated: number;
}

// ─── Conversations & Messages ────────────────────────────────────────────────

export interface Conversation extends BaseEntity {
  participantIds: string[];
  classroomId?: string; // null for direct messages
  subject?: string;
  lastMessage?: string;
  lastMessageAt?: number;
  unreadCounts: Record<string, number>; // userId -> unread count
}

export interface Message extends BaseEntity {
  conversationId: string;
  senderId: string;
  text: string;
  translatedText?: Record<string, string>; // lang code -> translated text
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentType?: string;
  readBy: string[];
  editedAt?: number;
}

export interface Attachment {
  url: string;
  name: string;
  type: string; // 'image' | 'pdf' | 'document'
  sizeBytes?: number;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface CalendarEvent extends BaseEntity {
  title: string;
  description?: string;
  type: EventType;
  startDate: number;
  endDate?: number;
  location?: string;
  classroomId?: string;
  classroomIds?: string[]; // for multi-classroom events
  creatorId: string;
  rsvps: Record<string, RSVPStatus>; // userId -> status
  rsvpCounts?: { yes: number; no: number; maybe: number };
  isRecurring?: boolean;
  recurrenceRule?: string; // iCal RRULE format
  psEventId?: string; // PowerSchool calendar event
  source?: 'manual' | 'powerschool'; // read-only if 'powerschool'
}

// ─── Progress Reports ────────────────────────────────────────────────────────

export interface ProgressReport extends BaseEntity {
  studentId: string;
  classroomId: string;
  teacherId: string;
  term: string; // e.g. "Q1 2024", "Semester 1"
  grades: SubjectGrade[];
  comments?: string;
  isPublished: boolean;
  publishedAt?: number;
  psReportId?: string;
}

export interface SubjectGrade {
  subject: string;
  grade: string; // letter or numeric
  score?: number;
  comments?: string;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export interface Announcement extends BaseEntity {
  classroomId: string;
  authorId: string;
  title: string;
  body: string;
  isPinned: boolean;
  attachmentUrl?: string;
}

// ─── Connection Requests ─────────────────────────────────────────────────────

export interface ConnectionRequest extends BaseEntity {
  fromUserId: string;
  toUserId: string;
  status: ConnectionStatus;
  message?: string;
}

// ─── Sync Status ─────────────────────────────────────────────────────────────

export interface SyncStatus extends BaseEntity {
  collection: string;
  lastSyncAt: number;
  recordsSynced: number;
  status: 'idle' | 'running' | 'success' | 'error';
  errorMessage?: string;
  nextSyncAt?: number;
}

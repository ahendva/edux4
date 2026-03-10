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
  language: string;
  schoolId?: string;
  children: string[]; // student IDs (for parents)
  connections: string[]; // connected user IDs
  classrooms: string[]; // classroom IDs
  profilePictureUrl?: string | null;
  bio?: string;
  lastLoginDate: number;
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
}

// ─── Classrooms ──────────────────────────────────────────────────────────────

export interface Classroom extends BaseEntity {
  name: string;
  description?: string;
  subject?: string;
  grade?: string;
  teacherId: string; // owner
  participantIds: string[]; // parents + teachers
  studentIds: string[]; // student records
  imageUrl?: string;
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
  psStudentId?: string; // PowerSchool student ID
  psEnrollmentId?: string;
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
  attachmentType?: string;
  readBy: string[];
  editedAt?: number;
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
  creatorId: string;
  rsvps: Record<string, RSVPStatus>; // userId -> status
  isRecurring?: boolean;
  recurringPattern?: string;
  psEventId?: string; // PowerSchool calendar event
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
  status: 'success' | 'error' | 'in_progress';
  errorMessage?: string;
}

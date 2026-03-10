# EduX4 Migration Checklist

> Ported from X4X fitness app → EduX4 Parent-Teacher Communication Hub
> Source repo (READ-ONLY): `/home/user/x4x`
> Target repo: `/home/user/edux4`
>
> **Instructions for AI agents:** Read this file before starting work. Check off
> items as you complete them. Only mark `[x]` when fully done and tested.
> Use `[ ]` for not started, `[~]` for in-progress.

---

## Phase 0: Scaffold — Copy Infrastructure, Strip Fitness Code

### 0.1 Project Config
- [ ] Create `package.json` (copy from x4x, rename to edux4, update deps)
- [ ] Create `tsconfig.json` (copy from x4x)
- [ ] Create `app.json` (copy from x4x, rename to EduX4)
- [ ] Create `babel.config.js` (copy from x4x)
- [ ] Create `.gitignore` (copy from x4x)
- [ ] Create `.env.example` with Firebase env vars
- [ ] Run `npm install` successfully

### 0.2 Firebase Infrastructure (copy as-is from x4x)
- [ ] `services/firebase/firebaseConfig.ts` — copy verbatim
- [ ] `services/firebase/firebaseDebug.ts` — copy verbatim
- [ ] `services/firebase/storageService.ts` — copy verbatim
- [ ] `services/monitoring.ts` — copy verbatim

### 0.3 Theme & Style System (copy as-is from x4x)
- [ ] `constants/Colors.ts` — copy, update palette for education (blues/greens)
- [ ] `styles/typography.ts` — copy verbatim
- [ ] `styles/themedStyles.ts` — copy verbatim
- [ ] `styles/commonStyles.ts` — copy verbatim
- [ ] `styles/headerStyles.ts` — copy verbatim
- [ ] `styles/mixins.ts` — copy if exists
- [ ] `styles/index.ts` — copy, update exports (remove fitness styles)

### 0.4 Context Providers (copy + adapt from x4x)
- [ ] `context/AuthContext.tsx` — copy verbatim
- [ ] `context/ThemeContext.tsx` — copy verbatim

### 0.5 Shared UI Components (copy from x4x)
- [ ] `components/ui/LoadingScreen.tsx` — copy verbatim
- [ ] `components/ui/AdvancedLoadingScreen.tsx` — copy verbatim
- [ ] `components/ui/ErrorBoundary.tsx` — copy verbatim
- [ ] `components/Collapsible.tsx` — copy if exists

### 0.6 Root Layout
- [ ] `app/_layout.tsx` — copy from x4x, strip fitness routes, add edux4 routes
- [ ] `app/+not-found.tsx` — copy verbatim

---

## Phase 1: Data Model — Schema, Types, Firestore Structure

### 1.1 Type Definitions
- [ ] `lib/types/models.ts` — Define: UserRole, User, Classroom, Student, Message, Conversation, Event, ProgressReport, Announcement, ConnectionRequest
- [ ] `lib/types/index.ts` — Re-export all types

### 1.2 Firebase Schema
- [ ] `services/firebase/schema.ts` — Full interfaces for all Firestore documents (UserProfile, ClassroomDoc, ConversationDoc, MessageDoc, EventDoc, ProgressReportDoc, AnnouncementDoc, ConnectionRequestDoc)

### 1.3 Utilities
- [ ] `lib/utils/dateUtils.ts` — Date formatting helpers (port from x4x if any exist)
- [ ] `lib/utils/validationUtils.ts` — Input validation (email, name, etc.)

---

## Phase 2: Auth & User Services

### 2.1 Auth Service
- [ ] `services/firebase/authService.ts` — Copy from x4x. Add role selection (parent/teacher) during registration

### 2.2 User Collection Service
- [ ] `services/firebase/collections/users.ts` — Port from x4x. Strip workout stats. Add: role, language, schoolId, children[], connections. Rename friend functions → connection functions

### 2.3 Auth Screens
- [ ] `app/auth/_layout.tsx` — Copy from x4x
- [ ] `app/auth/login.tsx` — Copy from x4x
- [ ] `app/auth/register.tsx` — Copy from x4x, add role picker (Parent / Teacher radio)
- [ ] `app/auth/forgot-password.tsx` — Copy from x4x
- [ ] `app/auth/edit-profile.tsx` — Copy from x4x, strip workout fields, add language picker

### 2.4 Firebase Index
- [ ] `services/firebase/index.ts` — New barrel file exporting all collection functions

---

## Phase 3: Messaging Service (NEW)

### 3.1 Conversation Service
- [ ] `services/firebase/collections/conversations.ts` — createConversation, getConversations (with unread counts), getConversationById, deleteConversation

### 3.2 Message Service
- [ ] `services/firebase/collections/messages.ts` — sendMessage, getMessages (paginated), markAsRead, deleteMessage, editMessage

### 3.3 Translation Service
- [ ] `services/translation.ts` — Google Cloud Translation API wrapper: translateText(text, targetLang), detectLanguage(text). Cache results.

---

## Phase 4: Classroom Service (Port from Groups)

### 4.1 Classroom Collection
- [ ] `services/firebase/collections/classrooms.ts` — Port from x4x groups.ts. Rename: group→classroom, owner→teacher, members→participants. Add: subject, grade, studentIds. Drop: workout fields, challenges, badges

### 4.2 Announcement Service
- [ ] `services/firebase/collections/announcements.ts` — createAnnouncement, getAnnouncements (by classroom), pinAnnouncement, deleteAnnouncement

### 4.3 Connection Request Service
- [ ] `services/firebase/collections/connections.ts` — Port from x4x friend request system. Rename: friend→connection. Keep: send, accept, reject, block logic

---

## Phase 5: Events & Progress Reports

### 5.1 Event Service
- [ ] `services/firebase/collections/events.ts` — Port from x4x schedule.ts. Rename: scheduled workout→event. Add: event types (meeting, deadline, event, holiday), RSVP tracking, recurring events

### 5.2 Progress Report Service
- [ ] `services/firebase/collections/progressReports.ts` — NEW. createReport, getReportsForStudent, getReportsForClassroom, publishReport

---

## Phase 6: Tab Screens (5 Tabs)

### 6.1 Tab Layout
- [ ] `app/(tabs)/_layout.tsx` — 5 tabs: Home, Messages, Classrooms, Calendar, Profile. Education icons.

### 6.2 Home Tab
- [ ] `app/(tabs)/index.tsx` — Dashboard: unread message count, upcoming events (next 3), recent announcements, quick-action buttons (new message, new event, view classrooms)

### 6.3 Messages Tab
- [ ] `app/(tabs)/messages.tsx` — Conversation list with: avatar, name, last message preview, unread badge, timestamp. Pull-to-refresh. FAB for new message. Search bar.

### 6.4 Classrooms Tab
- [ ] `app/(tabs)/classrooms.tsx` — Classroom cards: name, teacher, student count, subject badge. Create button (teachers only). Join button.

### 6.5 Calendar Tab
- [ ] `app/(tabs)/calendar.tsx` — Month calendar view (react-native-calendars). Dots for event days. Event list below calendar. Add event button (teachers).

### 6.6 Profile Tab
- [ ] `app/(tabs)/profile.tsx` — Port from x4x profile. Strip workout stats. Add: role badge, language selector, notification prefs, linked children (parents). Keep: theme toggle, password reset, logout, delete account.

---

## Phase 7: Feature Screens

### 7.1 Messaging Screens
- [ ] `app/messages/[id].tsx` — Conversation thread: message bubbles, sender name/avatar, timestamps, translation toggle per message, attachment support, input bar
- [ ] `app/messages/new.tsx` — New conversation: recipient picker (search connections), subject line, first message

### 7.2 Classroom Screens
- [ ] `app/classrooms/[id].tsx` — Classroom detail: announcements feed, student list, upcoming events, progress reports link. Port from x4x groups/[id].tsx
- [ ] `app/classrooms/[id]/admin.tsx` — Teacher admin: manage students, post announcements, create events. Port from x4x groups/[id]/admin.tsx
- [ ] `app/classrooms/[id]/manage.tsx` — Edit classroom: name, subject, grade, image. Port from x4x groups/[id]/manage.tsx
- [ ] `app/classrooms/[id]/students/[studentId].tsx` — Student detail: grades, attendance, progress chart, parent contact. Port from x4x groups/[id]/members/[memberId].tsx
- [ ] `app/classrooms/create.tsx` — Create classroom: name, subject, grade, description. Port from x4x groups/create.tsx
- [ ] `app/classrooms/index.tsx` — All classrooms list with filters. Port from x4x groups/index.tsx

### 7.3 Event Screens
- [ ] `app/events/[id].tsx` — Event detail: title, description, date/time, location, RSVP button, attendee list
- [ ] `app/events/create.tsx` — Create event: title, date/time picker, type selector, classroom selector, description

### 7.4 Progress Report Screens
- [ ] `app/reports/[id].tsx` — View report: student name, period, grades per subject, teacher comments
- [ ] `app/reports/create.tsx` — Create report (teachers): student picker, subject grades, comments, publish button

### 7.5 Connection Screens
- [ ] `app/connections/requests.tsx` — Pending connection requests. Port from x4x friends/requests.tsx
- [ ] `app/connections/[id].tsx` — Connection profile. Port from x4x friends/[id].tsx
- [ ] `app/connections/index.tsx` — All connections list. Port from x4x friends/index.tsx

---

## Phase 8: Polish & Integration

### 8.1 Theming
- [ ] Update `constants/Colors.ts` — Education palette: blues (#1565C0, #42A5F5), greens (#2E7D32, #66BB6A), warm neutral backgrounds
- [ ] Update app icon and splash screen assets

### 8.2 Notifications
- [ ] Add `expo-notifications` dependency
- [ ] `services/notifications.ts` — Push notification handler: new message, event reminder, report published, connection request
- [ ] Notification permission prompt on first launch

### 8.3 Translation Integration
- [ ] Add translation toggle in message thread UI
- [ ] Auto-translate based on user's language preference
- [ ] Language picker in profile settings

### 8.4 Error Handling & Edge Cases
- [ ] All screens: loading states, empty states, error states
- [ ] Offline support: queue messages for retry
- [ ] FERPA-aware: no PII in logs, data export/delete

### 8.5 Testing
- [ ] Unit tests for message service
- [ ] Unit tests for classroom service
- [ ] Unit tests for event service
- [ ] Integration test: send message → appears in conversation
- [ ] Integration test: create classroom → visible to joined users

### 8.6 Documentation
- [ ] Update CLAUDE.md with final architecture
- [ ] README.md with setup instructions
- [ ] .env.example with all required variables

---

## Summary

| Phase | Description | Files | Status |
|---|---|---|---|
| 0 | Scaffold infra | ~20 | Not started |
| 1 | Data model | ~4 | Not started |
| 2 | Auth & users | ~7 | Not started |
| 3 | Messaging | ~3 | Not started |
| 4 | Classrooms | ~3 | Not started |
| 5 | Events & reports | ~2 | Not started |
| 6 | Tab screens | ~6 | Not started |
| 7 | Feature screens | ~14 | Not started |
| 8 | Polish | ~8 | Not started |
| **Total** | | **~67** | |

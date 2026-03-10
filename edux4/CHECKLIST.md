# EduX4 — Project Completion Checklist

> **For AI agents:** Read `CLAUDE.md` first for architecture context, then use this
> checklist to pick up work. Mark items `[x]` when fully done and tested. Use `[~]`
> for in-progress. Only work on one phase at a time. Run `npx tsc --noEmit` after
> each phase to catch type errors.

---

## Phase 0: Project Bootstrap & Environment Setup
> **Goal:** Repo runs `npx expo start` without errors.

- [x] `package.json` — Expo 53 deps, education-specific packages
- [x] `tsconfig.json` — Strict TS, path alias `@/*`
- [x] `app.json` — EduX4 branding, bundle IDs
- [x] `babel.config.js` — module-resolver, reanimated
- [x] `.gitignore`
- [x] `.env.example` — Firebase + PowerSchool env vars
- [ ] Run `npm install` — verify clean install with no peer dep errors
- [ ] Run `npx expo start` — verify app boots to login screen
- [ ] Set up Firebase project in console, add config to `.env`
- [ ] Enable Firebase Auth (Email/Password provider)
- [ ] Create Firestore database with security rules
- [ ] Deploy initial Firestore security rules (see Phase 9)

---

## Phase 1: Firebase Infrastructure *(done)*
> **Goal:** Firebase SDK initializes, auth works, storage works.

- [x] `services/firebase/firebaseConfig.ts` — Platform-specific config, AsyncStorage persistence
- [x] `services/firebase/firebaseDebug.ts` — Debug utilities
- [x] `services/firebase/storageService.ts` — uploadFile, deleteFile
- [x] `services/firebase/index.ts` — Barrel exports, checkConnectivity, safeFirebaseOperation
- [x] `services/monitoring.ts` — Sentry placeholder

---

## Phase 2: Data Model & Schema *(done)*
> **Goal:** All TypeScript interfaces defined for every Firestore document.

- [x] `services/firebase/schema.ts` — UserProfile, Classroom, Student, Conversation, Message, CalendarEvent, ProgressReport, Announcement, ConnectionRequest, SyncStatus, SubjectGrade
- [ ] `lib/types/models.ts` — Re-export schema types + add utility types (e.g. `WithTimestamps<T>`, `CreateInput<T>`)
- [ ] `lib/types/index.ts` — Barrel re-export

---

## Phase 3: Theme & Styling *(done)*
> **Goal:** Education color palette, light/dark mode, all style utilities.

- [x] `constants/Colors.ts` — Blues (#1565C0, #42A5F5), greens (#2E7D32, #66BB6A), Ocean + Forest schemes
- [x] `styles/typography.ts`
- [x] `styles/themedStyles.ts`
- [x] `styles/commonStyles.ts`
- [x] `styles/headerStyles.ts`
- [x] `styles/mixins.ts`
- [x] `styles/index.ts` — useStyles hook

---

## Phase 4: Auth & User System *(done)*
> **Goal:** Users can register (with role), login, reset password, edit profile.

- [x] `services/firebase/authService.ts` — signUp with role parameter
- [x] `services/firebase/collections/users.ts` — getUserProfile, initializeUserProfile, updateUserProfile, getUsersByRole, addConnection, removeConnection
- [x] `context/AuthContext.tsx` — AuthProvider with role-aware signUp
- [x] `context/ThemeContext.tsx` — Theme persistence with AsyncStorage
- [x] `app/auth/_layout.tsx`
- [x] `app/auth/login.tsx` — EduX4 branding
- [x] `app/auth/register.tsx` — Parent/Teacher role picker
- [x] `app/auth/forgot-password.tsx`
- [x] `app/auth/edit-profile.tsx` — Bio field, no fitness fields

---

## Phase 5: Firestore Collection Services *(done)*
> **Goal:** CRUD operations for every collection, one file per collection.

- [x] `services/firebase/collections/classrooms.ts` — create, get, getUserClassrooms, addParticipant, removeParticipant
- [x] `services/firebase/collections/conversations.ts` — create, get, getConversations, delete
- [x] `services/firebase/collections/messages.ts` — send, getMessages (paginated), markAsRead, delete
- [x] `services/firebase/collections/events.ts` — create, get, getClassroomEvents, getUpcomingEvents, updateRSVP
- [x] `services/firebase/collections/announcements.ts` — create, get, pin, delete
- [x] `services/firebase/collections/connections.ts` — send, getPending, accept, reject
- [x] `services/firebase/collections/progressReports.ts` — create, get, getForStudent, getForClassroom, publish

---

## Phase 6: PowerSchool API Integration *(done — client layer)*
> **Goal:** OAuth client connects to PS, fetches students/sections/grades, syncs to Firestore.

- [x] `services/powerschool/types.ts` — PSStudent, PSSection, PSStaff, PSGradeEntry, PSGPA, PSAttendance, PSSchool, PSTerm
- [x] `services/powerschool/client.ts` — OAuth 2.0 token management, auto-refresh, all REST endpoints
- [x] `services/powerschool/sync.ts` — syncStudents, syncSections, syncSectionStudents, runFullSync
- [ ] `services/powerschool/index.ts` — Barrel export
- [ ] Add PS sync error handling — retry with backoff on 429/5xx
- [ ] Add PS pagination support — handle `page` and `pagesize` query params for large datasets
- [ ] Add PS grade sync — pull final grades per student per section, write to progressReports
- [ ] Add PS attendance sync — pull attendance records, write to student/event records
- [ ] Add PS webhook listener endpoint (optional — for real-time sync via PS plugin)

---

## Phase 7: Tab Screens *(done — basic versions)*
> **Goal:** All 5 tabs render with real data, pull-to-refresh, loading/empty states.

- [x] `app/(tabs)/_layout.tsx` — 5 tabs with education icons
- [x] `app/(tabs)/index.tsx` — Dashboard with welcome card, quick actions, upcoming events
- [x] `app/(tabs)/messages.tsx` — Conversation list with unread badges
- [x] `app/(tabs)/classrooms.tsx` — Classroom cards with student count, teacher FAB
- [x] `app/(tabs)/calendar.tsx` — Event list with type-based icons
- [x] `app/(tabs)/profile.tsx` — Role badge, theme switcher, connections link
- [x] `components/ui/LoadingScreen.tsx`
- [x] `components/ui/ErrorBoundary.tsx`
- [x] `app/+not-found.tsx`

### Tab screen improvements needed:
- [ ] `(tabs)/index.tsx` — Wire up real Firestore queries (unread count, upcoming events, announcements)
- [ ] `(tabs)/messages.tsx` — Add search bar, new conversation FAB, real-time listener
- [ ] `(tabs)/classrooms.tsx` — Add join classroom flow for parents, archive toggle
- [ ] `(tabs)/calendar.tsx` — Integrate `react-native-calendars` month view with event dots
- [ ] `(tabs)/profile.tsx` — Add linked children list (parents), notification preferences, language picker

---

## Phase 8: Feature Screens *(not started)*
> **Goal:** Full detail/create/edit screens for every domain entity.

### 8.1 Messaging
- [ ] `app/messages/_layout.tsx` — Stack navigator for message screens
- [ ] `app/messages/[id].tsx` — Conversation thread: message bubbles, sender avatar, timestamps, translation toggle, attachment support, input bar with send button
- [ ] `app/messages/new.tsx` — New conversation: recipient search (connections), subject line, compose first message

### 8.2 Classrooms
- [ ] `app/classrooms/_layout.tsx` — Stack navigator
- [ ] `app/classrooms/index.tsx` — Full classroom directory with search and filters
- [ ] `app/classrooms/create.tsx` — Create classroom form: name, subject, grade, description, image
- [ ] `app/classrooms/[id].tsx` — Classroom detail: announcements feed, student roster, upcoming events, progress reports link
- [ ] `app/classrooms/[id]/admin.tsx` — Teacher admin panel: manage students, post announcements, create events
- [ ] `app/classrooms/[id]/manage.tsx` — Edit classroom: name, subject, grade, image
- [ ] `app/classrooms/[id]/students/[studentId].tsx` — Student detail: grades, attendance chart, parent contact button

### 8.3 Events
- [ ] `app/events/_layout.tsx` — Stack navigator
- [ ] `app/events/[id].tsx` — Event detail: title, description, date/time, location, RSVP button, attendee list
- [ ] `app/events/create.tsx` — Create event: title, date/time picker, type selector, classroom selector, description, recurring toggle

### 8.4 Progress Reports
- [ ] `app/reports/_layout.tsx` — Stack navigator
- [ ] `app/reports/[id].tsx` — View report: student name, period, subject grades table, teacher comments
- [ ] `app/reports/create.tsx` — Create report (teachers only): student picker, term, subject grades entry, comments, publish button

### 8.5 Connections
- [ ] `app/connections/_layout.tsx` — Stack navigator
- [ ] `app/connections/index.tsx` — All connections list with search
- [ ] `app/connections/requests.tsx` — Pending connection requests (incoming/outgoing)
- [ ] `app/connections/[id].tsx` — Connection profile: name, role, classrooms in common, message button

---

## Phase 9: Translation Service *(not started)*
> **Goal:** Messages can be auto-translated based on user language preference.

- [ ] `services/translation/index.ts` — Translation API wrapper (Google Cloud Translation or LibreTranslate)
- [ ] `services/translation/cache.ts` — Cache translated strings in AsyncStorage to reduce API calls
- [ ] Add translation toggle button in message thread UI (`messages/[id].tsx`)
- [ ] Add language picker to profile settings and user schema
- [ ] Auto-translate incoming messages when user's language differs from sender's

---

## Phase 10: Push Notifications *(not started)*
> **Goal:** Users get notified for messages, events, reports, connection requests.

- [ ] Add `expo-notifications` to `package.json`
- [ ] `services/notifications/index.ts` — Register for push, handle received notification, store FCM token in Firestore user doc
- [ ] `services/notifications/handlers.ts` — Route notification taps to correct screen (message → conversation, event → event detail, etc.)
- [ ] Add notification permission prompt on first login
- [ ] Wire up notification preferences from profile settings
- [ ] Create Firebase Cloud Functions for sending notifications (separate `functions/` directory):
  - [ ] `onMessageCreate` → notify conversation participants
  - [ ] `onEventCreate` → notify classroom participants
  - [ ] `onReportPublish` → notify student's parents
  - [ ] `onConnectionRequest` → notify target user
  - [ ] `onAnnouncementCreate` → notify classroom participants

---

## Phase 11: Firestore Security Rules *(not started)*
> **Goal:** Data access is locked down by role and ownership.

- [ ] `firestore.rules` — Write and deploy rules:
  - [ ] `users/{uid}` — Read: authenticated; Write: owner only
  - [ ] `classrooms/{id}` — Read: participants; Write: teacher/admin
  - [ ] `classrooms/{id}/announcements` — Read: participants; Write: teacher
  - [ ] `conversations/{id}` — Read/write: participants only
  - [ ] `conversations/{id}/messages` — Read/write: conversation participants
  - [ ] `events/{id}` — Read: classroom participants; Write: teacher/admin
  - [ ] `progressReports/{id}` — Read: teacher + student's parents; Write: teacher
  - [ ] `connectionRequests/{id}` — Read/write: fromUser or toUser
  - [ ] `students/{id}` — Read: parents + teachers in shared classroom; Write: admin/sync only
  - [ ] `sync_status/{id}` — Read: admin; Write: admin/sync only
- [ ] Test rules with Firebase emulator

---

## Phase 12: PowerSchool Deep Integration *(not started)*
> **Goal:** Full bidirectional sync, admin dashboard, real-time updates.

### 12.1 Admin Sync Dashboard
- [ ] `app/(tabs)/admin.tsx` or `app/admin/index.tsx` — Admin-only tab/screen: trigger sync, view sync status, see last sync timestamps, error log
- [ ] `app/admin/sync-status.tsx` — Detailed sync status per collection with retry button

### 12.2 Advanced Sync Features
- [ ] Incremental sync — only fetch records modified since last sync (use PS `modified_since` parameter)
- [ ] Conflict resolution — handle cases where local edits conflict with PS data
- [ ] Sync scheduling — auto-sync on configurable interval (daily/hourly)
- [ ] Parent-student linking — match PS guardian records to app parent users by email

### 12.3 PowerSchool Data Expansion
- [ ] Sync teacher assignments — link PS staff to app teacher users
- [ ] Sync school calendar — pull PS school events into calendar
- [ ] Sync report cards — pull PS stored grades into progress reports
- [ ] Display PS attendance summary on student detail screen

---

## Phase 13: Testing *(not started)*
> **Goal:** Core business logic has test coverage. App passes CI checks.

### 13.1 Unit Tests
- [ ] Set up Jest with `jest-expo` preset
- [ ] `__tests__/services/firebase/collections/messages.test.ts` — send, get, markAsRead
- [ ] `__tests__/services/firebase/collections/classrooms.test.ts` — create, join, leave
- [ ] `__tests__/services/firebase/collections/events.test.ts` — create, RSVP, delete
- [ ] `__tests__/services/firebase/collections/connections.test.ts` — send, accept, reject
- [ ] `__tests__/services/powerschool/client.test.ts` — OAuth flow, API calls (mocked)
- [ ] `__tests__/services/powerschool/sync.test.ts` — sync transforms data correctly

### 13.2 Component Tests
- [ ] `__tests__/components/LoadingScreen.test.tsx`
- [ ] `__tests__/components/ErrorBoundary.test.tsx`
- [ ] `__tests__/app/auth/login.test.tsx` — renders, submits credentials
- [ ] `__tests__/app/auth/register.test.tsx` — role picker works, submits

### 13.3 Integration Tests
- [ ] Firebase emulator setup (`firebase.json` with emulator config)
- [ ] Send message → appears in conversation query
- [ ] Create classroom → visible to joined users
- [ ] PowerSchool sync → Firestore documents created correctly

### 13.4 CI Pipeline
- [ ] `.github/workflows/ci.yml` — lint, typecheck, test on push/PR
- [ ] Add `npx tsc --noEmit` to CI
- [ ] Add ESLint config (`.eslintrc.js`)

---

## Phase 14: Polish & Ship *(not started)*
> **Goal:** App is production-ready with proper UX, error handling, and docs.

### 14.1 UX Polish
- [ ] All screens: loading skeleton states (not just spinners)
- [ ] All screens: empty states with helpful illustrations/text
- [ ] All screens: error states with retry buttons
- [ ] Pull-to-refresh on all list screens
- [ ] Haptic feedback on key actions (send message, RSVP, etc.)
- [ ] App icon and splash screen with EduX4 branding

### 14.2 Offline Support
- [ ] Enable Firestore offline persistence
- [ ] Queue outgoing messages when offline, send when reconnected
- [ ] Show offline indicator banner

### 14.3 Privacy & Compliance
- [ ] No PII in console logs or error reports
- [ ] FERPA compliance review — ensure student data access is properly restricted
- [ ] Add data export feature (user can download their data)
- [ ] Add account deletion flow (required by App Store)

### 14.4 Performance
- [ ] Lazy load feature screens with `React.lazy` / dynamic imports
- [ ] Paginate all list queries (messages, events, classrooms)
- [ ] Image optimization — compress uploads, use cached thumbnails
- [ ] Profile Firestore reads with Firebase Performance Monitoring

### 14.5 Documentation
- [ ] `README.md` — Setup instructions, architecture overview, contributing guide
- [ ] Update `CLAUDE.md` with final architecture
- [ ] `.env.example` — All required variables documented
- [ ] `docs/POWERSCHOOL_SETUP.md` — How to configure PS plugin and OAuth credentials
- [ ] `docs/FIREBASE_SETUP.md` — Console setup, security rules deployment, emulator usage

---

## Progress Summary

| Phase | Description | Files | Status |
|-------|-------------|-------|--------|
| 0 | Bootstrap & Environment | 6 | **Done** (needs verify) |
| 1 | Firebase Infrastructure | 5 | **Done** |
| 2 | Data Model & Schema | 1 (+2 todo) | **Done** (core) |
| 3 | Theme & Styling | 7 | **Done** |
| 4 | Auth & User System | 9 | **Done** |
| 5 | Collection Services | 7 | **Done** |
| 6 | PowerSchool Client | 3 (+5 todo) | **Partial** |
| 7 | Tab Screens | 9 | **Done** (needs wiring) |
| 8 | Feature Screens | ~18 | Not started |
| 9 | Translation | ~3 | Not started |
| 10 | Push Notifications | ~6 | Not started |
| 11 | Security Rules | 1 | Not started |
| 12 | PS Deep Integration | ~6 | Not started |
| 13 | Testing | ~12 | Not started |
| 14 | Polish & Ship | ~8 | Not started |

**Estimated total files remaining: ~60**

---

## Recommended Build Order

> Agents should follow this order to minimize blocked work:

1. **Phase 0** — Verify `npm install` and `expo start` work
2. **Phase 8.1–8.2** — Messaging + Classroom screens (core user flows)
3. **Phase 8.3–8.5** — Events, Reports, Connections screens
4. **Phase 7 improvements** — Wire tab screens to real Firestore data
5. **Phase 11** — Firestore security rules (before any real users)
6. **Phase 9** — Translation service
7. **Phase 10** — Push notifications
8. **Phase 12** — PowerSchool deep integration
9. **Phase 13** — Testing
10. **Phase 14** — Polish and ship

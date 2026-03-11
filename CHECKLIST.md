# EduX4 — MVP Build Checklist

> **For AI agents:** Read `CLAUDE.md` first for architecture context, then use this
> checklist to pick up work. Mark items `[x]` when fully done and tested. Use `[~]`
> for in-progress. Work one phase at a time. Run `npx tsc --noEmit` after each phase.

---

## PowerSchool API Reference
> Before building: understand what the PS REST API actually provides.

### Authentication
- **Plugin required** — a plugin ZIP must be installed on the PS server via
  System Management → Server → Plugin Configuration → Install
- Plugin's `plugin.xml` must contain an `<oauth/>` element
- Credentials appear at: System Settings → Plugin Management → [plugin] → Data Provider Configuration
- Token endpoint: `POST /oauth/access_token` with `grant_type=client_credentials` + Basic auth header
- Tokens expire — client must auto-refresh (implemented in `client.ts`)

### Confirmed REST Endpoints (`/ws/v1/`)
| Endpoint | Method | Description |
|---|---|---|
| `/oauth/access_token` | POST | Get OAuth token |
| `/ws/v1/school/{id}` | GET | School details |
| `/ws/v1/school/{id}/student` | GET | All enrolled students (paginated) |
| `/ws/v1/student/{id}` | GET | Single student by PS ID |
| `/ws/v1/section/{id}/student` | GET | Students in a section |
| `/ws/v1/school/{id}/section` | GET | All sections for a school |
| `/ws/v1/section/{id}` | GET | Single section details |
| `/ws/v1/school/{id}/staff` | GET | All staff for a school (paginated) |
| `/ws/v1/staff/{id}` | GET | Single staff member |
| `/ws/v1/student/{id}/gpa` | GET | GPA records by term |
| `/ws/v1/student/{id}/attendance` | GET | Attendance records |

### Student Expansion Fields
Append `?expansions=<list>` to student requests to include nested objects:
- `addresses` — home address
- `contact` — emergency contacts
- `contact_info` — email, phone
- `demographics` — gender, DOB, ethnicity
- `school_enrollment` — grade level, entry/exit dates, enroll status
- `phones` — home/cell/work numbers

### Known Gaps (require workarounds)
| Missing Feature | Workaround |
|---|---|
| Guardian/parent records | Use PowerQuery `com.pearson.core.guardian.student_guardian_detail` via `/ws/v1/powerquery` |
| Stored/final grades per section | Use `FinalGradeSetupService` or PowerQuery for stored grades |
| School calendar events | No public REST endpoint — use PowerQuery or manual input |
| Assignment-level grades | Not in standard REST API — PowerQuery or plugin extension |
| Incremental sync (`modified_since`) | Delta sync is possible via PS plugin API; exact param not public — poll with timestamp comparison |

### Pagination
- `?page=N&pagesize=N` (default: page 1, pagesize 50)
- Response includes: `page`, `pageSize`, `pageCount`, `recordCount`
- Always paginate — large schools can have 1000+ students per section list

### Rate Limiting
- PS returns `429` on rate limit
- Implement exponential backoff: 2s → 4s → 8s → 16s → fail
- Batch Firestore writes to reduce round-trips

---

## Phase 0: Project Bootstrap & Environment Setup
> **Goal:** Repo runs `npx expo start` without errors, env vars set, Firebase project live.

### 0.1 Dependencies
- [x] `package.json` — Expo 53 deps, education-specific packages
- [x] `tsconfig.json` — Strict TS, path alias `@/*`
- [x] `app.json` — EduX4 branding, bundle IDs
- [x] `babel.config.js` — module-resolver, reanimated
- [x] `.gitignore`
- [x] `.env.example` — Firebase + PowerSchool env vars
- [ ] Run `npm install` — verify clean install, no peer dep errors
  - [ ] Check for `expo-notifications` — add if missing
  - [ ] Check for `react-native-calendars` — add if missing
  - [ ] Check for `@react-native-async-storage/async-storage` — required for offline persistence

### 0.2 Runtime Verification
- [ ] Run `npx expo start` — app boots to login screen without JS errors
- [x] Run `npx tsc --noEmit` — zero type errors in clean repo
- [ ] Run `npx expo start --platform ios` — no iOS-specific crash
- [ ] Run `npx expo start --platform android` — no Android-specific crash

### 0.3 Firebase Project
- [ ] Create Firebase project at console.firebase.google.com
  - [ ] Name: `edux4-prod` (or per-environment naming)
  - [ ] Enable Google Analytics (optional but useful)
- [ ] Add iOS app — download `GoogleService-Info.plist` → `assets/`
- [ ] Add Android app — download `google-services.json` → root
- [ ] Enable Firebase Authentication
  - [ ] Enable Email/Password provider
  - [ ] (Optional) Enable Google Sign-In for later
- [ ] Create Firestore database
  - [ ] Region: `us-central1` (or match school geography)
  - [ ] Start in production mode (not test mode)
- [ ] Enable Firebase Storage
  - [ ] Default bucket, standard rules
- [ ] Copy Firebase config values to `.env`:
  - [ ] `EXPO_PUBLIC_FIREBASE_API_KEY`
  - [ ] `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
  - [ ] `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
  - [ ] `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
  - [ ] `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
  - [ ] `EXPO_PUBLIC_FIREBASE_APP_ID`

### 0.4 PowerSchool Plugin Setup
- [ ] Create plugin ZIP with `plugin.xml` containing `<oauth/>` element
  - [ ] Plugin name: `EduX4`
  - [ ] Publisher: your organization
- [ ] Install plugin on PS server: System Management → Server → Plugin Configuration → Install
- [ ] Retrieve credentials: System Settings → Plugin Management → [EduX4] → Data Provider Configuration
- [ ] Copy PS config values to `.env`:
  - [ ] `EXPO_PUBLIC_PS_BASE_URL` (e.g. `https://yourdistrict.powerschool.com`)
  - [ ] `PS_CLIENT_ID`
  - [ ] `PS_CLIENT_SECRET`
  - [ ] `EXPO_PUBLIC_PS_SCHOOL_ID` (numeric PS school ID)

---

## Phase 1: Firebase Infrastructure *(done)*
> **Goal:** Firebase SDK initializes, auth works, storage works.

- [x] `services/firebase/firebaseConfig.ts` — Platform-specific config, AsyncStorage persistence
- [x] `services/firebase/firebaseDebug.ts` — Debug utilities
- [x] `services/firebase/storageService.ts` — uploadFile, deleteFile
- [x] `services/firebase/index.ts` — Barrel exports, checkConnectivity, safeFirebaseOperation
- [x] `services/monitoring.ts` — Sentry placeholder
- [ ] Verify `enableMultiTabIndexedDbPersistence` works on web (Expo Web)
- [ ] Verify `initializeFirestore` with `AsyncStorage` persistence works on iOS/Android

---

## Phase 2: Data Model & Schema *(done)*
> **Goal:** All TypeScript interfaces defined for every Firestore document.

- [x] `services/firebase/schema.ts` — UserProfile, Classroom, Student, Conversation, Message, CalendarEvent, ProgressReport, Announcement, ConnectionRequest, SyncStatus, SubjectGrade
- [x] `lib/types/models.ts` — Re-export schema types + utility types (`WithTimestamps<T>`, `CreateInput<T>`)
- [x] `lib/types/index.ts` — Barrel re-export
- [x] Add `preferredLanguage: string` to `UserProfile` (ISO 639-1 code, e.g. `"es"`)
- [x] Add `fcmToken?: string` to `UserProfile` (for push notifications)
- [x] Add `notificationPreferences` object to `UserProfile`:
  - `messages: boolean`
  - `announcements: boolean`
  - `events: boolean`
  - `reports: boolean`
  - `connectionRequests: boolean`
- [x] Add `linkedStudentIds: string[]` to parent `UserProfile` (PS-matched children)
- [x] Add `psStaffId?: string` to teacher `UserProfile`
- [x] Add `gradeLevel?: string` field to `Classroom` (e.g. `"9"`, `"10"`)
- [x] Add `termId?: string` field to `Classroom`
- [x] Add `isArchived: boolean` to `Classroom`
- [x] Add `rsvpCounts: { yes: number; no: number; maybe: number }` to `CalendarEvent`
- [x] Add `isRecurring: boolean` + `recurrenceRule?: string` to `CalendarEvent`
- [x] Add `attachments?: Attachment[]` to `Message` where `Attachment = { url: string; name: string; type: string }`
- [x] Add `translatedContent?: Record<string, string>` to `Message` (keyed by ISO language code)
- [ ] Add `isRead: boolean` to `Announcement`
- [ ] Add `psGuardianId?: string` to `Student` for guardian matching

---

## Phase 3: Theme & Styling *(done)*
> **Goal:** Education color palette, light/dark mode, all style utilities.

- [x] `constants/Colors.ts` — Blues (#1565C0, #42A5F5), greens (#2E7D32, #66BB6A)
- [x] `styles/typography.ts`
- [x] `styles/themedStyles.ts`
- [x] `styles/commonStyles.ts`
- [x] `styles/headerStyles.ts`
- [x] `styles/mixins.ts`
- [x] `styles/index.ts` — useStyles hook
- [ ] Add skeleton loading style tokens (gray shimmer colors for light/dark)
- [ ] Add `badgeStyle` mixin for unread count badges
- [ ] Add `roleColor(role)` helper — returns distinct color per user role

---

## Phase 4: Auth & User System *(done — needs additions)*
> **Goal:** Users can register (with role), login, reset password, edit profile. Schema additions wired up.

- [x] `services/firebase/authService.ts`
- [x] `services/firebase/collections/users.ts`
- [x] `context/AuthContext.tsx`
- [x] `context/ThemeContext.tsx`
- [x] `app/auth/_layout.tsx`
- [x] `app/auth/login.tsx`
- [x] `app/auth/register.tsx` — Parent/Teacher role picker
- [x] `app/auth/forgot-password.tsx`
- [x] `app/auth/edit-profile.tsx`

### 4.1 Schema-Driven Auth Additions
- [x] `app/auth/register.tsx` — save `preferredLanguage` from device locale on register
- [ ] `app/auth/edit-profile.tsx` — add language picker (select from supported languages)
- [ ] `app/auth/edit-profile.tsx` — add notification preferences toggle section
- [x] `services/firebase/collections/users.ts` — add `updateFcmToken(uid, token)` function
- [x] `services/firebase/collections/users.ts` — add `getTeachersInClassrooms(classroomIds)` helper
- [x] `services/firebase/collections/users.ts` — add `linkStudentToParent(parentUid, studentId)` helper

### 4.2 Admin Role
- [ ] Add `admin` as valid role in `UserProfile.role` type union
- [x] Update `AuthContext` to expose `isAdmin` computed boolean
- [ ] Update `register.tsx` — admin registration requires an invite code (prevent open admin signup)

---

## Phase 5: Firestore Collection Services *(done — needs additions)*
> **Goal:** CRUD operations for every collection.

- [x] `services/firebase/collections/classrooms.ts`
- [x] `services/firebase/collections/conversations.ts`
- [x] `services/firebase/collections/messages.ts`
- [x] `services/firebase/collections/events.ts`
- [x] `services/firebase/collections/announcements.ts`
- [x] `services/firebase/collections/connections.ts`
- [x] `services/firebase/collections/progressReports.ts`

### 5.1 Missing Functions
- [x] `classrooms.ts` — `archiveClassroom(id)` sets `isArchived: true`
- [x] `classrooms.ts` — `getActiveClassrooms(userId)` filters out archived
- [x] `messages.ts` — `getUnreadCount(conversationId, userId)` returns number
- [x] `messages.ts` — `getTotalUnreadCount(userId)` across all conversations
- [x] `messages.ts` — `saveTranslation(messageId, lang, text)` writes to `translatedContent`
- [x] `events.ts` — `getRSVPStatus(eventId, userId)` returns yes/no/maybe/null
- [x] `announcements.ts` — `getUnreadAnnouncements(classroomId, userId)` — unread since last seen
- [x] `progressReports.ts` — `getReportsForParent(parentUid)` — via linked studentIds
- [x] Add `students.ts` collection service:
  - [ ] `getStudent(id)`
  - [ ] `getStudentsInClassroom(classroomId)`
  - [ ] `getStudentsForParent(parentUid)`
  - [ ] `updateStudent(id, data)`

### 5.2 Real-time Listeners
- [x] `messages.ts` — `subscribeToMessages(conversationId, callback)` — Firestore `onSnapshot`
- [x] `conversations.ts` — `subscribeToConversations(userId, callback)` — live unread badges
- [x] `announcements.ts` — `subscribeToAnnouncements(classroomId, callback)`
- [x] `events.ts` — `subscribeToUpcomingEvents(classroomIds, callback)`

---

## Phase 6: PowerSchool API Integration *(partial — client layer done)*
> **Goal:** OAuth client connects to PS, fetches and syncs all needed data to Firestore.

- [x] `services/powerschool/types.ts`
- [x] `services/powerschool/client.ts` — OAuth 2.0, all confirmed REST endpoints
- [x] `services/powerschool/sync.ts` — syncStudents, syncSections, syncSectionStudents, runFullSync
- [x] `services/powerschool/index.ts`

### 6.1 Client Robustness
- [ ] `client.ts` — Add retry with exponential backoff on `429` and `5xx` responses
  - Delays: 2s → 4s → 8s → 16s → throw
- [ ] `client.ts` — Add full pagination support
  - `getStudents()` must loop pages until `page >= pageCount`
  - `getSections()` same
  - `getStaff()` same
  - Helper: `private async fetchAllPages<T>(endpoint, key): Promise<T[]>`
- [ ] `client.ts` — Add `?expansions=contact_info,demographics,school_enrollment` to `getStudents()`
- [ ] `client.ts` — Add `getSchoolStaff(schoolId)`: `GET /ws/v1/school/{id}/staff`
- [ ] `client.ts` — Add `getTerms(schoolId)`: `GET /ws/v1/school/{id}/term`
- [ ] `client.ts` — Add `getStudentGradesBySection(studentId, sectionId)` via PowerQuery fallback

### 6.2 Guardian Sync (PowerQuery path)
> PS does not expose a direct REST guardian endpoint. Use PowerQuery.

- [ ] `client.ts` — Add `runPowerQuery(queryKey, params)` method:
  - `POST /ws/v1/powerquery/{queryKey}` with JSON body `{ "args": [...] }`
  - Query key for guardians: `com.pearson.core.guardian.student_guardian_detail`
- [ ] `types.ts` — Add `PSGuardian` interface:
  - `guardian_id`, `student_id`, `first_name`, `last_name`, `email`, `phone`, `relationship`
- [ ] `sync.ts` — Add `syncGuardians(schoolId)`:
  - Run PowerQuery for all students
  - Match guardian email → existing parent `UserProfile` by email
  - Write `psGuardianId` to student record
  - Write `linkedStudentIds` to matched parent user

### 6.3 Grades Sync
- [ ] `types.ts` — Add `PSStoredGrade` interface:
  - `student_id`, `section_id`, `term_id`, `percent`, `letter_grade`, `comment`
- [ ] `client.ts` — Add `getStoredGrades(studentId)` — attempt `/ws/v1/student/{id}/storedgrades`
  - Fallback: PowerQuery for stored grades if endpoint returns 404
- [ ] `sync.ts` — Add `syncGrades(schoolId)`:
  - For each student, fetch stored grades
  - Create/update `progressReports` documents in Firestore
  - Track sync status in `sync_status/grades`

### 6.4 Attendance Sync
- [ ] `sync.ts` — Add `syncAttendance(schoolId)`:
  - For each student, call `client.getStudentAttendance(studentId)`
  - Write attendance array to `students/{id}` Firestore doc
  - Track sync status in `sync_status/attendance`
  - Only sync last 90 days of attendance (filter by date)

### 6.5 Staff → Teacher User Matching
- [ ] `sync.ts` — Add `syncStaff(schoolId)`:
  - Fetch all staff via `getSchoolStaff(schoolId)`
  - Match PS staff email → existing teacher `UserProfile` by email
  - Write `psStaffId` to matched teacher user
  - Track sync status in `sync_status/staff`

### 6.6 Sync Engine Improvements
- [ ] `sync.ts` — `runFullSync()` should run in order: staff → students → sections → section-students → guardians → grades → attendance
- [ ] `sync.ts` — Add per-collection error capture: don't abort full sync if one collection fails
- [ ] `sync.ts` — Write error detail to `sync_status/{collection}.error` field
- [ ] `sync.ts` — Add `syncStatus` enum: `'idle' | 'running' | 'success' | 'error'`
- [ ] `sync.ts` — Add incremental sync: store `lastSyncAt` per collection, skip records with `updatedAt < lastSyncAt` (PS delta approach pending official param documentation)

---

## Phase 7: Tab Screens *(basic shells done — needs real data)*
> **Goal:** All 5 tabs show live Firestore data, pull-to-refresh, loading/empty states.

- [x] `app/(tabs)/_layout.tsx`
- [x] `app/(tabs)/index.tsx` (Dashboard — static)
- [x] `app/(tabs)/messages.tsx` (static)
- [x] `app/(tabs)/classrooms.tsx` (static)
- [x] `app/(tabs)/calendar.tsx` (static)
- [x] `app/(tabs)/profile.tsx` (static)
- [x] `components/ui/LoadingScreen.tsx`
- [x] `components/ui/ErrorBoundary.tsx`

### 7.1 Dashboard (`(tabs)/index.tsx`)
- [ ] Wire `getTotalUnreadCount(uid)` → show live unread message badge on quick action
- [ ] Wire `getUpcomingEvents(classroomIds)` → show next 3 events in home feed
- [ ] Wire `subscribeToAnnouncements(classroomIds, cb)` → show latest 3 announcements
- [ ] Add pull-to-refresh (`RefreshControl`)
- [ ] Add skeleton loader for feed cards while data loads
- [ ] Add role-conditional quick actions (teacher sees "New Announcement"; parent sees "View Reports")

### 7.2 Messages Tab (`(tabs)/messages.tsx`)
- [ ] Wire `subscribeToConversations(uid, cb)` — live list with real-time unread badge
- [ ] Add search bar that filters conversations by participant name or subject
- [ ] Add FAB (`+`) → navigate to `messages/new`
- [ ] Add swipe-to-delete on conversation rows
- [ ] Show "No messages yet" empty state with illustration
- [ ] Add skeleton loader for conversation list

### 7.3 Classrooms Tab (`(tabs)/classrooms.tsx`)
- [ ] Wire `getUserClassrooms(uid)` → show real classrooms with live student count
- [ ] Add search/filter bar (by subject, grade level)
- [ ] Add archive toggle (hide/show archived classrooms)
- [ ] Teacher: show FAB → navigate to `classrooms/create`
- [ ] Parent: show "Join via code" button → accepts 6-char classroom code
- [ ] Show "No classrooms yet" empty state

### 7.4 Calendar Tab (`(tabs)/calendar.tsx`)
- [ ] Integrate `react-native-calendars` — month view with color-coded event dots
- [ ] Wire `subscribeToUpcomingEvents(classroomIds, cb)` — live event list below calendar
- [ ] Tap event dot → scroll to event in list
- [ ] Teacher FAB: `+` → navigate to `events/create`
- [ ] Event type color coding: meeting=blue, deadline=red, holiday=green, other=gray
- [ ] Add pull-to-refresh

### 7.5 Profile Tab (`(tabs)/profile.tsx`)
- [ ] Show linked children list for parent users (names, grades from student docs)
- [ ] Show classroom list for teacher users (section names)
- [ ] Add notification preferences section (toggle per type)
- [ ] Add language picker (affects message auto-translation)
- [ ] Add "Manage Connections" → navigate to `connections/`
- [ ] Add "Sign Out" with confirmation dialog

---

## Phase 8: Feature Screens *(shells done — needs real data + UX)*
> **Goal:** All detail/create/edit screens use live data, validate input, handle errors.

### 8.1 Messaging
- [x] `app/messages/_layout.tsx`
- [x] `app/messages/[id].tsx` (shell)
- [x] `app/messages/new.tsx` (shell)

- [x] `messages/[id].tsx` — Wire `subscribeToMessages(conversationId, cb)` → live message feed
- [x] `messages/[id].tsx` — Wire `sendMessage()` on submit, clear input on success
- [x] `messages/[id].tsx` — Call `markAsRead()` when screen mounts and on new message
- [ ] `messages/[id].tsx` — Implement translation toggle:
  - Show original / translated toggle button per message
  - Call translation service if `translatedContent[userLang]` not cached
  - Show loading indicator during translation
- [ ] `messages/[id].tsx` — File attachment picker (image/PDF) → upload via `storageService`, send URL in message
- [ ] `messages/[id].tsx` — Keyboard-aware scroll (scroll to bottom on keyboard open)
- [x] `messages/[id].tsx` — Long-press message → delete (own messages only)
- [ ] `messages/new.tsx` — Search connections by name, show role badge
- [ ] `messages/new.tsx` — Disable "Send" if no recipient or empty body
- [ ] `messages/new.tsx` — Navigate to created conversation thread on success

### 8.2 Classrooms
- [x] `app/classrooms/_layout.tsx`
- [x] `app/classrooms/index.tsx`
- [x] `app/classrooms/create.tsx`
- [x] `app/classrooms/[id].tsx`
- [x] `app/classrooms/[id]/admin.tsx`
- [x] `app/classrooms/[id]/manage.tsx`
- [x] `app/classrooms/[id]/students/[studentId].tsx`

- [x] `classrooms/[id].tsx` — Wire live announcements feed via `subscribeToAnnouncements()`
- [ ] `classrooms/[id].tsx` — Wire live student roster from Firestore
- [x] `classrooms/[id].tsx` — Wire upcoming events for this classroom
- [x] `classrooms/[id].tsx` — Parent: show "Contact Teacher" button → opens `messages/new` pre-filled
- [ ] `classrooms/[id]/admin.tsx` — Post announcement form with character limit (500 chars)
- [ ] `classrooms/[id]/admin.tsx` — Create event shortcut with classroom pre-filled
- [ ] `classrooms/[id]/admin.tsx` — Manage student roster: add by PS student ID or name search
- [ ] `classrooms/[id]/admin.tsx` — Remove student with confirmation dialog
- [ ] `classrooms/[id]/manage.tsx` — Save/cancel buttons with dirty-state tracking
- [ ] `classrooms/[id]/manage.tsx` — Image picker for classroom cover photo
- [ ] `classrooms/create.tsx` — Validate required fields before submit
- [ ] `classrooms/create.tsx` — Generate unique 6-char join code on creation
- [ ] `classrooms/[id]/students/[studentId].tsx` — Show grade history from `progressReports`
- [ ] `classrooms/[id]/students/[studentId].tsx` — Show attendance summary (present %, absences, tardies)
- [ ] `classrooms/[id]/students/[studentId].tsx` — Parent contact button (for teachers)
- [ ] `classrooms/[id]/students/[studentId].tsx` — Show linked parent names

### 8.3 Events
- [x] `app/events/_layout.tsx`
- [x] `app/events/[id].tsx`
- [x] `app/events/create.tsx`

- [ ] `events/[id].tsx` — Show live RSVP counts (yes/no/maybe)
- [ ] `events/[id].tsx` — RSVP button updates immediately (optimistic) then syncs
- [ ] `events/[id].tsx` — Show attendee list (names + avatar) for teachers
- [ ] `events/[id].tsx` — Show map link if `location` is a physical address
- [ ] `events/[id].tsx` — Teacher: edit and delete buttons with confirmation
- [ ] `events/create.tsx` — Date/time picker (use `@react-native-community/datetimepicker`)
- [ ] `events/create.tsx` — Classroom multi-select (teacher's classrooms)
- [ ] `events/create.tsx` — Recurring event toggle → select frequency (daily/weekly/monthly)
- [ ] `events/create.tsx` — Save navigates back to calendar, highlights new event

### 8.4 Progress Reports
- [x] `app/reports/_layout.tsx`
- [x] `app/reports/[id].tsx`
- [x] `app/reports/create.tsx`

- [ ] `reports/[id].tsx` — Wire live report data from Firestore
- [ ] `reports/[id].tsx` — Display subject grades as table (subject, grade, comment)
- [ ] `reports/[id].tsx` — Show "Draft" banner if `published: false`
- [ ] `reports/[id].tsx` — Teacher: edit and publish buttons
- [ ] `reports/create.tsx` — Student picker from classroom roster
- [ ] `reports/create.tsx` — Dynamic subject rows (add/remove subjects)
- [ ] `reports/create.tsx` — Validate all grades are filled before publish
- [ ] `reports/create.tsx` — Save as draft vs. publish (publish triggers notification)
- [ ] Add `app/reports/index.tsx` — list of reports visible to current user
  - Parents: reports for their linked children
  - Teachers: reports they created
  - Sorted by term, most recent first

### 8.5 Connections
- [x] `app/connections/_layout.tsx`
- [x] `app/connections/index.tsx`
- [x] `app/connections/requests.tsx`
- [x] `app/connections/[id].tsx`

- [x] `connections/index.tsx` — Wire `getUserProfile` for each connection, show role badge
- [x] `connections/index.tsx` — "Message" button → `messages/new` pre-filled with this user
- [x] `connections/requests.tsx` — Accept/reject buttons with loading state
- [ ] `connections/requests.tsx` — Show pending count badge on Connections tab
- [ ] `connections/[id].tsx` — Show classrooms in common
- [ ] `connections/[id].tsx` — Show student in common (if parent + teacher share a child)
- [ ] Add connection search screen `connections/search.tsx`:
  - Search teachers by name (for parents to send connection requests)
  - Show school/classroom info to confirm correct person

---

## Phase 9: Translation Service *(done)*
> **Goal:** Messages auto-translate based on user language preference.

### 9.1 Translation API Setup
- [ ] Choose translation provider:
  - **Google Cloud Translation API** — $20/1M chars, best accuracy, requires GCP project
  - **LibreTranslate** — self-hosted, free, lower accuracy
  - **DeepL API** — free tier (500K chars/month), excellent quality
- [ ] Add API key to `.env`: `TRANSLATION_API_KEY`
- [ ] `services/translation/index.ts` — `translateText(text, targetLang, sourceLang?)`: string
  - Wrap chosen provider
  - Return original text on error (fail gracefully)
- [ ] `services/translation/cache.ts` — cache translations in AsyncStorage
  - Key: `translation:{messageId}:{lang}`
  - TTL: 7 days
  - `getCachedTranslation(messageId, lang): string | null`
  - `setCachedTranslation(messageId, lang, text): void`

### 9.2 Integration
- [x] `services/firebase/collections/messages.ts` — `saveTranslation(messageId, lang, text)`
  - Writes to `messages/{id}.translatedContent.{lang}`
  - Cache in AsyncStorage
- [ ] `messages/[id].tsx` — Translation toggle button (globe icon) per message bubble
  - First tap: call `translateText()`, show result, save to Firestore
  - Second tap: revert to original
  - Show spinner during translation
- [ ] `app/auth/edit-profile.tsx` — Language picker (list of ~10 supported languages)
- [x] `context/AuthContext.tsx` — Expose `userLanguage` derived from `UserProfile.preferredLanguage`
- [ ] Auto-translate on receive: in `subscribeToMessages`, if incoming message lang ≠ user lang, auto-translate and cache (background, don't block render)

### 9.3 Supported Languages (initial set)
Spanish, English, Chinese (Simplified), Vietnamese, Arabic, Tagalog, Haitian Creole, Portuguese, French, Korean

---

## Phase 10: Push Notifications *(done)*
> **Goal:** Users get push notifications for all relevant events.

### 10.1 Client Setup
- [ ] `npm install expo-notifications`
- [ ] `app.json` — Add notification icon, color, and permissions config
- [ ] `services/notifications/index.ts`:
  - [ ] `registerForPushNotifications()` — request permission, get Expo push token
  - [ ] `saveFcmToken(uid, token)` — write token to `users/{uid}.fcmToken`
  - [ ] `handleNotificationReceived(notification)` — foreground notification handler
  - [ ] `handleNotificationResponse(response)` — tap handler, route to screen
- [ ] `services/notifications/handlers.ts` — routing map:
  - `type: 'message'` → navigate to `messages/{conversationId}`
  - `type: 'event'` → navigate to `events/{eventId}`
  - `type: 'report'` → navigate to `reports/{reportId}`
  - `type: 'connection'` → navigate to `connections/requests`
  - `type: 'announcement'` → navigate to `classrooms/{classroomId}`
- [ ] `app/_layout.tsx` — Call `registerForPushNotifications()` after login, set notification handlers

### 10.2 Firebase Cloud Functions
> Lives in `functions/` directory, deployed separately.

- [ ] Init `functions/` directory: `firebase init functions` (TypeScript)
- [ ] `functions/src/notifications/onMessageCreate.ts`
  - Trigger: `onCreate` for `conversations/{id}/messages/{msgId}`
  - Fetch conversation participants
  - Exclude sender
  - Send push via Expo Push API
- [ ] `functions/src/notifications/onEventCreate.ts`
  - Trigger: `onCreate` for `events/{id}`
  - Fetch classroom participants
  - Send push with event title + date
- [ ] `functions/src/notifications/onReportPublish.ts`
  - Trigger: `onUpdate` for `progressReports/{id}` where `published` changed to `true`
  - Fetch student's linked parent UIDs
  - Send push to parents
- [ ] `functions/src/notifications/onConnectionRequest.ts`
  - Trigger: `onCreate` for `connectionRequests/{id}`
  - Send push to `toUserId`
- [ ] `functions/src/notifications/onAnnouncementCreate.ts`
  - Trigger: `onCreate` for `classrooms/{id}/announcements/{announcementId}`
  - Send push to all classroom participants
- [ ] `functions/src/index.ts` — Export all functions
- [ ] `functions/package.json` — Add `expo-server-sdk` for Expo Push API
- [ ] Deploy: `firebase deploy --only functions`

### 10.3 Notification Preferences
- [ ] `services/notifications/index.ts` — `shouldNotify(uid, type)`: checks `UserProfile.notificationPreferences`
- [ ] Wrap all push sends with `shouldNotify()` check in Cloud Functions
- [ ] Respect device-level "do not disturb" via `scheduleNotificationAsync` cooldowns

---

## Phase 11: Firestore Security Rules *(done)*
> **Goal:** All data access is locked down by role and ownership.

### 11.1 Write Rules File
- [ ] `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ─── Helper Functions ───────────────────────────────────────────
    function isAuth() { return request.auth != null; }
    function uid() { return request.auth.uid; }
    function userRole() { return get(/databases/$(database)/documents/users/$(uid())).data.role; }
    function isTeacher() { return userRole() == 'teacher'; }
    function isAdmin() { return userRole() == 'admin'; }
    function isParent() { return userRole() == 'parent'; }

    // ─── Users ──────────────────────────────────────────────────────
    match /users/{userId} {
      allow read: if isAuth();
      allow write: if isAuth() && uid() == userId;
    }

    // ─── Classrooms ─────────────────────────────────────────────────
    match /classrooms/{classroomId} {
      allow read: if isAuth() && uid() in resource.data.participantIds;
      allow create: if isTeacher() || isAdmin();
      allow update, delete: if isTeacher() && resource.data.teacherId == uid();

      match /announcements/{announcementId} {
        allow read: if isAuth() && uid() in get(/databases/$(database)/documents/classrooms/$(classroomId)).data.participantIds;
        allow create: if isTeacher() && get(/databases/$(database)/documents/classrooms/$(classroomId)).data.teacherId == uid();
        allow delete: if isTeacher() && resource.data.authorId == uid();
      }
    }

    // ─── Students ───────────────────────────────────────────────────
    match /students/{studentId} {
      allow read: if isAuth() && (
        uid() in resource.data.parentIds ||
        isAdmin()
      );
      allow write: if isAdmin();
    }

    // ─── Conversations ──────────────────────────────────────────────
    match /conversations/{conversationId} {
      allow read, write: if isAuth() && uid() in resource.data.participantIds;

      match /messages/{messageId} {
        allow read: if isAuth() && uid() in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
        allow create: if isAuth() && uid() in get(/databases/$(database)/documents/conversations/$(conversationId)).data.participantIds;
        allow delete: if isAuth() && resource.data.senderId == uid();
      }
    }

    // ─── Events ─────────────────────────────────────────────────────
    match /events/{eventId} {
      allow read: if isAuth() && (
        uid() in resource.data.participantIds ||
        resource.data.classroomId in get(/databases/$(database)/documents/users/$(uid())).data.classroomIds
      );
      allow create: if isTeacher() || isAdmin();
      allow update, delete: if (isTeacher() || isAdmin()) && resource.data.creatorId == uid();
    }

    // ─── Progress Reports ───────────────────────────────────────────
    match /progressReports/{reportId} {
      allow read: if isAuth() && (
        resource.data.teacherId == uid() ||
        uid() in resource.data.parentIds
      );
      allow create, update: if isTeacher() && resource.data.teacherId == uid();
      allow delete: if isTeacher() && resource.data.teacherId == uid() && resource.data.published == false;
    }

    // ─── Connection Requests ─────────────────────────────────────────
    match /connectionRequests/{requestId} {
      allow read, write: if isAuth() && (
        uid() == resource.data.fromUserId ||
        uid() == resource.data.toUserId
      );
    }

    // ─── Sync Status ─────────────────────────────────────────────────
    match /sync_status/{collection} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }

  }
}
```

### 11.2 Testing
- [ ] Add `firebase.json` with emulator config:
  - Firestore emulator: port 8080
  - Auth emulator: port 9099
  - Functions emulator: port 5001
- [ ] `npm install --save-dev @firebase/rules-unit-testing`
- [ ] `__tests__/firestore.rules.test.ts`:
  - [ ] Parent cannot read another parent's messages
  - [ ] Teacher can read own classroom announcements
  - [ ] Teacher cannot write to another teacher's classroom
  - [ ] Admin can read sync_status; regular user cannot
  - [ ] Unauthenticated request is always denied
- [ ] Run: `firebase emulators:exec --only firestore "jest __tests__/firestore.rules.test.ts"`
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

---

## Phase 12: PowerSchool Deep Integration *(partial — sync dashboard done)*
> **Goal:** Admin dashboard, full sync coverage, real-time updates.

### 12.1 Admin Sync Dashboard
- [x] `app/(tabs)/admin.tsx` — Admin-only tab (hidden for non-admin roles):
  - [x] Show `sync_status` per collection (last sync time, records synced, status)
  - [x] "Run Full Sync" button with progress indicator
  - [x] Error log: show `sync_status.{collection}.error` if set
  - [x] App stats cards: users, classrooms, students, conversations
- [x] `app/admin/sync-status.tsx` — Detailed sync status with retry button per collection
- [x] Update `app/(tabs)/_layout.tsx` — show Admin tab only when `isAdmin == true`

### 12.2 Guardian → Parent Account Linking
- [x] After `syncGuardians()` runs, show in Admin dashboard:
  - [x] Count: "X guardian emails matched to parent accounts"
  - [x] Count: "Y guardians have no matching account (email not registered)"
- [x] Allow admin to manually link guardian email → parent UID from admin screen
- [x] `app/admin/link-parents.tsx` — list unmatched guardians, search existing users, link button

### 12.3 Incremental Sync
- [ ] `sync.ts` — Read `sync_status.{collection}.lastSyncAt` before each sync
- [ ] Pass date filter to PS API when available (pending documentation of exact param)
- [ ] After sync, compare record hashes to skip unchanged documents (prevent unnecessary Firestore writes)
- [ ] Add `syncDelta(collectionName, sinceTimestamp)` — incremental entry point

### 12.4 Sync Scheduling
- [ ] Add `functions/src/scheduledSync.ts` — Cloud Function on schedule:
  - `pubsub.schedule('every 24 hours').onRun()`
  - Calls `runFullSync(schoolId)` using admin SDK
- [ ] Admin dashboard: show "Next scheduled sync" time
- [ ] Admin dashboard: allow manual override of sync schedule

### 12.5 PS Calendar Events
> No standard REST endpoint — use PowerQuery for school calendar events.

- [ ] Identify PowerQuery key for school calendar (check PS admin → PowerQueries)
- [ ] `client.ts` — `getSchoolCalendarEvents(schoolId, startDate, endDate)` via PowerQuery
- [ ] `sync.ts` — `syncCalendarEvents(schoolId)` — write to `events/` collection with `source: 'powerschool'`
- [ ] Mark PS-synced events as read-only in the UI (no edit/delete for teacher)

---

## Phase 13: Testing *(partial — unit tests + CI done)*
> **Goal:** Core business logic has test coverage. App passes CI.

### 13.1 Test Setup
- [x] `jest.config.js` — preset: `jest-expo`, transform ignore patterns, moduleNameMapper
- [x] `jest.setup.js` — mock AsyncStorage, Firebase (full in-memory store), expo modules
- [x] `__mocks__/expo-notifications.js` — manual mock for uninstalled package
- [x] `__mocks__/@react-native-community/netinfo.js` — manual mock for uninstalled package

### 13.2 Unit Tests — Services
- [x] `__tests__/services/firebase/collections/messages.test.ts` — 50 total tests passing
  - [x] Send message → document created with correct fields
  - [x] lastMessage preview updated on conversation
  - [x] Long message text truncated to 100 chars
  - [x] getMessages → returns empty array and seeded messages
  - [x] markAsRead → calls updateDoc on message
  - [x] deleteMessage → removes document
  - [x] getUnreadCount → counts messages not in readBy
- [x] `__tests__/services/firebase/collections/classrooms.test.ts`
  - [x] Create classroom → document created with correct fields
  - [x] getClassroom → returns null for missing, data for existing
  - [x] getUserClassrooms → filters archived by default, includes when flag set
  - [x] addParticipant → resolves without error
  - [x] archiveClassroom → sets isArchived: true
  - [x] findClassroomByJoinCode → returns null when no match
- [x] `__tests__/services/firebase/collections/events.test.ts`
  - [x] Create event → document created, rsvpCounts initialized to zeros
  - [x] getEvent → returns null for missing, data for existing
  - [x] updateRSVP → updates rsvps.userId field
  - [x] deleteEvent → removes document
- [x] `__tests__/services/firebase/collections/connections.test.ts`
  - [x] Send request → pending doc created with correct fields
  - [x] Empty message defaults to ''
  - [x] Timestamps stored correctly
  - [x] rejectConnectionRequest → sets status to rejected
  - [x] acceptConnectionRequest → throws on missing, sets accepted
- [x] `__tests__/services/powerschool.test.ts` — authenticate, error handling, student fetch
- [x] `__tests__/services/schema.test.ts` — type shape validation for all schema types
- [x] `__tests__/services/translation.test.ts` — cache, translateText no-op cases

### 13.3 Component Tests
- [ ] `__tests__/components/LoadingScreen.test.tsx` — renders spinner
- [ ] `__tests__/components/ErrorBoundary.test.tsx` — catches error, renders fallback
- [ ] `__tests__/app/auth/login.test.tsx` — renders, email/password fields work, submit calls `signIn`
- [ ] `__tests__/app/auth/register.test.tsx` — role picker selects correct role, submit calls `signUp`

### 13.4 Integration Tests (Firebase Emulator)
- [ ] Send message → appears in `subscribeToMessages` callback
- [ ] Create classroom → visible via `getUserClassrooms`
- [ ] Create connection request → accept → both users updated
- [ ] Publish progress report → visible to parent via `getReportsForParent`
- [ ] Security rule: parent cannot read unrelated student

### 13.5 CI Pipeline
- [x] `.github/workflows/ci.yml` — triggers on push/PR, runs tsc + tests
- [x] `.eslintrc.js` — extends @typescript-eslint/recommended, no-any as warning
- [ ] Set minimum coverage thresholds: 70% lines for `services/`

---

## Phase 14: Polish & Ship *(partial — SkeletonCard, EmptyState, OfflineBanner, delete-account done)*
> **Goal:** Production-ready UX, performance, compliance, documentation.

### 14.1 Skeleton Loading States
- [ ] Create `components/ui/SkeletonCard.tsx` — animated shimmer placeholder
- [ ] Replace all spinners with skeleton cards on:
  - [ ] Conversation list
  - [ ] Classroom list
  - [ ] Event list / calendar
  - [ ] Progress report list
  - [ ] Student roster
  - [ ] Dashboard feed

### 14.2 Empty States
- [ ] Create `components/ui/EmptyState.tsx` — icon + title + subtitle + optional CTA button
- [ ] Wire to every list screen:
  - [ ] No messages → "Start a conversation with your child's teacher"
  - [ ] No classrooms (parent) → "Ask your child's teacher to add you"
  - [ ] No classrooms (teacher) → "Create your first classroom"
  - [ ] No events → "No upcoming events"
  - [ ] No reports → "No progress reports yet"
  - [ ] No connections → "Connect with teachers to get started"

### 14.3 Error States & Retry
- [ ] All list screens: show `ErrorBoundary` fallback with "Try Again" button
- [ ] Firestore errors: toast notification (use `react-native-toast-message` or similar)
- [ ] Network offline: banner at top of app "You're offline — viewing cached data"
- [ ] PS sync failures: visible in admin dashboard with error message

### 14.4 Offline Support
- [ ] Enable Firestore offline persistence in `firebaseConfig.ts`
  - `enableMultiTabIndexedDbPersistence` (web) or built-in RN persistence
- [x] `context/AuthContext.tsx` — expose `isOffline: boolean` using NetInfo
- [x] `components/ui/OfflineBanner.tsx` — sticky banner when `isOffline == true`
- [ ] Queue outgoing messages when offline via Firestore's local write queue (automatic with persistence)
- [ ] Disable RSVP and other mutation buttons when offline with tooltip "Offline — cannot save"

### 14.5 Haptic Feedback
- [ ] `npm install expo-haptics`
- [ ] Add `Haptics.impactAsync(Medium)` on: send message, RSVP, accept connection
- [ ] Add `Haptics.notificationAsync(Success)` on: successful sync, report publish

### 14.6 App Branding
- [ ] Design EduX4 app icon (1024×1024 PNG) — books/graduation cap motif, education blue palette
- [ ] `assets/icon.png` + `assets/adaptive-icon.png` (Android)
- [ ] Design splash screen — white background, centered logo + tagline
- [ ] `assets/splash.png`
- [ ] Update `app.json` with correct icon/splash paths and background color

### 14.7 Accessibility
- [ ] All interactive elements have `accessibilityLabel` props
- [ ] All images have `accessibilityLabel` or `accessibilityHidden={true}`
- [ ] Color contrast meets WCAG AA (4.5:1 minimum) — check blue/white combos
- [ ] Support Dynamic Type (iOS) — use relative font sizes from `typography.ts`
- [ ] Support screen readers (VoiceOver / TalkBack) on key flows (login, send message)

### 14.8 Performance
- [ ] Lazy-load all feature stacks with `React.lazy` / Expo Router dynamic imports
- [ ] Paginate all list queries (cursor-based with `startAfter`)
  - Messages: 30 per page, load more on scroll to top
  - Events: 20 per page
  - Classrooms: all (typically < 50)
- [ ] Image optimization: compress uploads before sending to Storage, use `expo-image-manipulator`
- [ ] Memoize expensive list renders with `React.memo` + `useCallback` for callbacks
- [ ] Add Firebase Performance Monitoring SDK to track screen load times

### 14.9 Privacy & Compliance
- [ ] No PII in `console.log` — audit all service files
- [ ] No PII in error messages sent to Sentry
- [ ] FERPA compliance review:
  - [ ] Student data (grades, attendance) only accessible to linked parents + teachers in shared classroom
  - [ ] No student data shared with third-party analytics services
  - [ ] Document data flows in `docs/FERPA_COMPLIANCE.md`
- [ ] Privacy Policy URL added to app store listing
- [ ] Terms of Service URL added
- [ ] Data export: `services/firebase/collections/users.ts` — `exportUserData(uid)` returns all user-owned Firestore docs as JSON
- [ ] Account deletion: `app/auth/delete-account.tsx` — deletes Auth record, Firestore user doc, anonymizes messages

### 14.10 App Store Submission
- [ ] iOS: `eas build --platform ios --profile production`
  - [ ] Bundle ID matches `app.json`
  - [ ] Provisioning profile + signing cert configured in EAS
  - [ ] App Store Connect listing: screenshots (6.5", 5.5"), description, keywords
- [ ] Android: `eas build --platform android --profile production`
  - [ ] `google-services.json` in EAS secrets
  - [ ] Play Store listing: feature graphic, screenshots, store description
- [ ] Submit: `eas submit --platform ios` / `eas submit --platform android`

### 14.11 Documentation
- [ ] `README.md` — Setup (clone → install → .env → firebase → expo start), architecture overview, contributing guide
- [ ] `docs/POWERSCHOOL_SETUP.md`:
  - Plugin ZIP creation
  - Installation steps on PS server
  - OAuth credential retrieval
  - Supported PS version requirements
  - PowerQuery IDs used (guardians, stored grades)
- [ ] `docs/FIREBASE_SETUP.md`:
  - Console project creation
  - Auth + Firestore + Storage setup
  - Security rules deployment
  - Firebase emulator usage for local testing
- [ ] `docs/FERPA_COMPLIANCE.md` — Data flows, access controls, third-party data sharing policy
- [ ] Update `CLAUDE.md` with final architecture decisions
- [ ] `.env.example` — all variables documented with descriptions

---

## Progress Summary

| Phase | Description | Status |
|-------|-------------|--------|
| 0 | Bootstrap & Environment | Partial (needs verify) |
| 1 | Firebase Infrastructure | Done |
| 2 | Data Model & Schema | Done |
| 3 | Theme & Styling | Done |
| 4 | Auth & User System | Done |
| 5 | Collection Services | Done |
| 6 | PowerSchool Integration | Done (client + sync engine) |
| 7 | Tab Screens | Done (live Firestore data) |
| 8 | Feature Screens | Done (live data, real student names, events, connections) |
| 9 | Translation Service | Done (Google Translate + AsyncStorage cache) |
| 10 | Push Notifications | Done (expo-notifications + 5 Cloud Functions) |
| 11 | Firestore Security Rules | Done (firestore.rules deployed) |
| 12 | PS Deep Integration | Partial (sync dashboard done; scheduled sync pending) |
| 13 | Testing | Partial (unit tests + CI pipeline done; emulator tests pending) |
| 14 | Polish & Ship | Partial (SkeletonCard, EmptyState, OfflineBanner, delete-account done) |

## Recommended Build Order

1. **Phase 0** — Verify environment boots cleanly
2. **Phase 2 additions** — Schema updates (language, FCM token, notification prefs)
3. **Phase 5 additions** — Real-time listeners + missing collection functions
4. **Phase 6.1–6.2** — PS client pagination + guardian sync (most complex PS work)
5. **Phase 7** — Wire all tab screens to live Firestore data
6. **Phase 8** — Wire all feature screens to live data
7. **Phase 11** — Security rules (must be done before any real users)
8. **Phase 9** — Translation service
9. **Phase 10** — Push notifications + Cloud Functions
10. **Phase 6.3–6.6** — Grades/attendance/staff sync
11. **Phase 12** — Admin dashboard + deep PS integration
12. **Phase 14.1–14.5** — UX polish (skeletons, empty states, offline)
13. **Phase 13** — Testing + CI
14. **Phase 14.6–14.11** — Branding, compliance, app store submission

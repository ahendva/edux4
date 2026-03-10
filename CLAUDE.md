# EduX4 — Parent-Teacher Communication Hub

## What is this project?
EduX4 is a React Native (Expo) app for parent-teacher communication with
PowerSchool SIS integration. Ported from the X4X fitness app infrastructure.

## Tech Stack
- **Framework:** React Native 0.79 + Expo 53 + expo-router 5
- **Backend:** Firebase (Auth, Firestore, Storage) + PowerSchool REST API
- **Language:** TypeScript (strict)
- **State:** React Context (AuthContext, ThemeContext)
- **Styling:** StyleSheet.create with theme tokens from constants/Colors.ts

## Architecture
- `app/` — Expo Router file-based screens
- `app/(tabs)/` — 5 tabs: Home, Messages, Classrooms, Calendar, Profile
- `app/auth/` — Login, Register (with role picker), Forgot Password, Edit Profile
- `components/ui/` — Reusable UI (LoadingScreen, ErrorBoundary)
- `context/` — AuthContext, ThemeContext
- `services/firebase/` — Firebase config, auth, storage, debug
- `services/firebase/collections/` — One file per Firestore collection
- `services/firebase/schema.ts` — TypeScript interfaces for all data models
- `services/powerschool/` — PowerSchool API client, types, sync engine
- `styles/` — Theme tokens, typography, themedStyles, mixins, commonStyles
- `constants/Colors.ts` — Education color palette (blues/greens)

## Domain Model
| Concept | Description |
|---|---|
| User | Parent, Teacher, or Admin with role-based access |
| Classroom | Maps to a PowerSchool section; has teacher + student roster |
| Student | Child record, linked to PS student ID and parent user(s) |
| Connection | Parent↔Teacher relationship (request/accept flow) |
| Conversation | Direct or classroom message thread with translation |
| CalendarEvent | Meeting, deadline, event, or holiday with RSVP |
| ProgressReport | Grades/comments per student per term (synced from PS) |
| Announcement | Teacher broadcast to classroom participants |

## Firestore Collections
```
users/{uid}
classrooms/{classroomId}
classrooms/{classroomId}/announcements/{id}
conversations/{conversationId}
conversations/{conversationId}/messages/{id}
events/{eventId}
progressReports/{reportId}
connectionRequests/{requestId}
sync_status/{collection}
```

## PowerSchool Integration
- OAuth 2.0 client_credentials flow
- REST API at `{baseUrl}/ws/v1/`
- Sync students, sections, grades, attendance → Firestore
- PS section → EduX4 classroom, PS student → student record

## Key Rules
1. Use proper TypeScript types — no `as any` in new code
2. Firebase config uses env vars: EXPO_PUBLIC_FIREBASE_*
3. PowerSchool config: EXPO_PUBLIC_PS_BASE_URL, PS_CLIENT_ID, PS_CLIENT_SECRET
4. Education color palette: blues (#1565C0, #42A5F5), greens (#2E7D32, #66BB6A)
5. Track progress in `CHECKLIST.md` (the canonical task list for agents)
6. Old `MIGRATION_CHECKLIST.md` is superseded by `CHECKLIST.md` — ignore it

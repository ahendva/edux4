// functions/src/index.ts — EduX4 Cloud Functions
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// ─── Helper: send push to a list of tokens ───────────────────────────────────
async function sendPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, string>,
): Promise<void> {
  if (tokens.length === 0) return;
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
    data,
    android: { priority: 'high' },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };
  const res = await messaging.sendEachForMulticast(message);
  // Clean up stale tokens
  const staleTokens: string[] = [];
  res.responses.forEach((r, i) => {
    if (!r.success && r.error?.code === 'messaging/registration-token-not-registered') {
      staleTokens.push(tokens[i]);
    }
  });
  if (staleTokens.length > 0) {
    const usersSnap = await db.collection('users')
      .where('fcmToken', 'in', staleTokens)
      .get();
    const batch = db.batch();
    usersSnap.docs.forEach(d => batch.update(d.ref, { fcmToken: admin.firestore.FieldValue.delete() }));
    await batch.commit();
  }
}

// ─── Helper: get FCM tokens for a list of user IDs ───────────────────────────
async function getTokensForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const chunks: string[][] = [];
  for (let i = 0; i < userIds.length; i += 10) chunks.push(userIds.slice(i, i + 10));
  const tokens: string[] = [];
  for (const chunk of chunks) {
    const snap = await db.collection('users')
      .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
      .get();
    snap.docs.forEach(d => {
      const tok = d.data().fcmToken as string | undefined;
      if (tok) tokens.push(tok);
    });
  }
  return tokens;
}

// ─── 1. New message notification ─────────────────────────────────────────────
export const onNewMessage = functions.firestore
  .document('conversations/{convId}/messages/{msgId}')
  .onCreate(async (snap, context) => {
    const msg = snap.data();
    const convId = context.params.convId;

    const convSnap = await db.doc(`conversations/${convId}`).get();
    if (!convSnap.exists) return;
    const conv = convSnap.data()!;

    const participantIds: string[] = conv.participantIds ?? [];
    const recipients = participantIds.filter((id: string) => id !== msg.senderId);

    // Respect notification preferences
    const eligibleRecipients: string[] = [];
    for (const uid of recipients) {
      const userSnap = await db.doc(`users/${uid}`).get();
      const prefs = userSnap.data()?.settings?.notificationPreferences;
      if (prefs?.messages !== false) eligibleRecipients.push(uid);
    }

    const tokens = await getTokensForUsers(eligibleRecipients);
    const senderSnap = await db.doc(`users/${msg.senderId}`).get();
    const senderName: string = senderSnap.data()?.displayName ?? 'Someone';
    const preview = (msg.text as string).substring(0, 100);

    await sendPush(tokens, senderName, preview, {
      type: 'message',
      conversationId: convId,
    });

    // Increment unread counts
    const batch = db.batch();
    eligibleRecipients.forEach(uid => {
      batch.update(convSnap.ref, {
        [`unreadCounts.${uid}`]: admin.firestore.FieldValue.increment(1),
      });
    });
    await batch.commit();
  });

// ─── 2. New announcement notification ────────────────────────────────────────
export const onNewAnnouncement = functions.firestore
  .document('classrooms/{classroomId}/announcements/{annId}')
  .onCreate(async (snap, context) => {
    const ann = snap.data();
    const classroomId = context.params.classroomId;

    const classroomSnap = await db.doc(`classrooms/${classroomId}`).get();
    if (!classroomSnap.exists) return;
    const classroom = classroomSnap.data()!;

    // Notify all parents of students in this classroom
    const studentIds: string[] = classroom.studentIds ?? [];
    const parentIds: Set<string> = new Set();
    for (const sid of studentIds) {
      const sSnap = await db.doc(`students/${sid}`).get();
      const pIds: string[] = sSnap.data()?.parentIds ?? [];
      pIds.forEach(id => parentIds.add(id));
    }

    const eligible: string[] = [];
    for (const uid of parentIds) {
      const uSnap = await db.doc(`users/${uid}`).get();
      if (uSnap.data()?.settings?.notificationPreferences?.announcements !== false) {
        eligible.push(uid);
      }
    }

    const tokens = await getTokensForUsers(eligible);
    await sendPush(
      tokens,
      classroom.name ?? 'Announcement',
      ann.title ?? 'New announcement',
      { type: 'announcement', classroomId },
    );
  });

// ─── 3. New event notification ────────────────────────────────────────────────
export const onNewEvent = functions.firestore
  .document('events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    const eventId = context.params.eventId;
    const classroomIds: string[] = event.classroomIds ?? (event.classroomId ? [event.classroomId] : []);
    if (classroomIds.length === 0) return;

    const parentIds: Set<string> = new Set();
    for (const cid of classroomIds) {
      const cSnap = await db.doc(`classrooms/${cid}`).get();
      const studentIds: string[] = cSnap.data()?.studentIds ?? [];
      for (const sid of studentIds) {
        const sSnap = await db.doc(`students/${sid}`).get();
        (sSnap.data()?.parentIds ?? []).forEach((id: string) => parentIds.add(id));
      }
    }

    const eligible: string[] = [];
    for (const uid of parentIds) {
      const uSnap = await db.doc(`users/${uid}`).get();
      if (uSnap.data()?.settings?.notificationPreferences?.events !== false) {
        eligible.push(uid);
      }
    }

    const tokens = await getTokensForUsers(eligible);
    await sendPush(tokens, 'New Event', event.title ?? 'New event', {
      type: 'event',
      eventId,
    });
  });

// ─── 4. Progress report published notification ────────────────────────────────
export const onReportPublished = functions.firestore
  .document('progressReports/{reportId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const reportId = context.params.reportId;

    // Only fire when isPublished flips from false → true
    if (before.isPublished || !after.isPublished) return;

    const studentSnap = await db.doc(`students/${after.studentId}`).get();
    const parentIds: string[] = studentSnap.data()?.parentIds ?? [];

    const eligible: string[] = [];
    for (const uid of parentIds) {
      const uSnap = await db.doc(`users/${uid}`).get();
      if (uSnap.data()?.settings?.notificationPreferences?.reports !== false) {
        eligible.push(uid);
      }
    }

    const tokens = await getTokensForUsers(eligible);
    await sendPush(
      tokens,
      'New Progress Report',
      `${after.term} report is now available`,
      { type: 'report', reportId },
    );
  });

// ─── 5. Connection request notification ──────────────────────────────────────
export const onConnectionRequest = functions.firestore
  .document('connectionRequests/{requestId}')
  .onCreate(async (snap, context) => {
    const req = snap.data();
    const requestId = context.params.requestId;

    const toUserSnap = await db.doc(`users/${req.toUserId}`).get();
    const prefs = toUserSnap.data()?.settings?.notificationPreferences;
    if (prefs?.connectionRequests === false) return;

    const fromSnap = await db.doc(`users/${req.fromUserId}`).get();
    const fromName: string = fromSnap.data()?.displayName ?? 'Someone';
    const token: string | undefined = toUserSnap.data()?.fcmToken;
    if (!token) return;

    await sendPush(
      [token],
      'Connection Request',
      `${fromName} wants to connect with you`,
      { type: 'connectionRequest', requestId },
    );
  });

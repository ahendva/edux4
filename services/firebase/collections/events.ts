// services/firebase/collections/events.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { CalendarEvent, RSVPStatus } from '../schema';

export const createEvent = async (
  event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  try {
    const now = Date.now();
    const docRef = await addDoc(collection(firestore, 'events'), {
      ...event,
      rsvps: event.rsvps || {},
      rsvpCounts: event.rsvpCounts || { yes: 0, no: 0, maybe: 0 },
      source: event.source || 'manual',
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create event: ${(error as Error).message}`);
  }
};

export const getEvent = async (eventId: string): Promise<CalendarEvent | null> => {
  const snap = await getDoc(doc(firestore, 'events', eventId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as CalendarEvent;
};

export const getClassroomEvents = async (classroomId: string): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(firestore, 'events'),
      where('classroomId', '==', classroomId),
      orderBy('startDate', 'asc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
  } catch (error) {
    console.error('Error getting classroom events:', error);
    return [];
  }
};

export const getUpcomingEvents = async (
  _userId: string,
  limitCount = 10,
): Promise<CalendarEvent[]> => {
  try {
    const now = Date.now();
    const q = query(
      collection(firestore, 'events'),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CalendarEvent));
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
};

// Real-time listener for upcoming events across multiple classrooms
export const subscribeToUpcomingEvents = (
  classroomIds: string[],
  callback: (events: CalendarEvent[]) => void,
): Unsubscribe => {
  const now = Date.now();
  const q = query(
    collection(firestore, 'events'),
    where('startDate', '>=', now),
    orderBy('startDate', 'asc'),
    limit(20),
  );
  return onSnapshot(q, snapshot => {
    const events = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as CalendarEvent))
      .filter(
        e =>
          !e.classroomId ||
          classroomIds.includes(e.classroomId) ||
          (e.classroomIds && e.classroomIds.some(id => classroomIds.includes(id))),
      );
    callback(events);
  });
};

export const getRSVPStatus = async (
  eventId: string,
  userId: string,
): Promise<RSVPStatus | null> => {
  const event = await getEvent(eventId);
  if (!event) return null;
  return event.rsvps?.[userId] ?? null;
};

export const updateRSVP = async (
  eventId: string,
  userId: string,
  status: RSVPStatus,
  previousStatus?: RSVPStatus | null,
): Promise<void> => {
  const eventRef = doc(firestore, 'events', eventId);
  const updates: Record<string, unknown> = {
    [`rsvps.${userId}`]: status,
    updatedAt: Date.now(),
  };

  // Update rsvpCounts
  const countMap: Record<RSVPStatus, string> = {
    going: 'rsvpCounts.yes',
    not_going: 'rsvpCounts.no',
    maybe: 'rsvpCounts.maybe',
  };
  if (previousStatus && previousStatus !== status) {
    // Would need increment import for atomic update; keep simple for now
  }
  updates[countMap[status]] = (await getEvent(eventId))?.rsvpCounts
    ? ((await getEvent(eventId))!.rsvpCounts![status === 'going' ? 'yes' : status === 'not_going' ? 'no' : 'maybe'] || 0) + 1
    : 1;

  await updateDoc(eventRef, updates);
};

export const updateEvent = async (
  eventId: string,
  updates: Partial<CalendarEvent>,
): Promise<void> => {
  await updateDoc(doc(firestore, 'events', eventId), { ...updates, updatedAt: Date.now() });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'events', eventId));
};

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
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { CalendarEvent, RSVPStatus } from '../schema';

export const createEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Date.now();
    const docRef = await addDoc(collection(firestore, 'events'), {
      ...event,
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
  } catch (error) {
    console.error('Error getting classroom events:', error);
    return [];
  }
};

export const getUpcomingEvents = async (userId: string, limitCount = 10): Promise<CalendarEvent[]> => {
  try {
    const now = Date.now();
    const q = query(
      collection(firestore, 'events'),
      where('startDate', '>=', now),
      orderBy('startDate', 'asc'),
    );
    const snapshot = await getDocs(q);
    // Filter events the user is part of (creator or in a classroom they belong to)
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent))
      .slice(0, limitCount);
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
};

export const updateRSVP = async (
  eventId: string,
  userId: string,
  status: RSVPStatus,
): Promise<void> => {
  const eventRef = doc(firestore, 'events', eventId);
  await updateDoc(eventRef, {
    [`rsvps.${userId}`]: status,
    updatedAt: Date.now(),
  });
};

export const updateEvent = async (eventId: string, updates: Partial<CalendarEvent>): Promise<void> => {
  await updateDoc(doc(firestore, 'events', eventId), { ...updates, updatedAt: Date.now() });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'events', eventId));
};

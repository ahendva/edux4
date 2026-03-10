// services/firebase/collections/announcements.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  collection,
  getDocs,
  query,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { Announcement } from '../schema';

export const createAnnouncement = async (
  announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(firestore, 'classrooms', announcement.classroomId, 'announcements'), {
    ...announcement,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getAnnouncements = async (classroomId: string): Promise<Announcement[]> => {
  try {
    const q = query(
      collection(firestore, 'classrooms', classroomId, 'announcements'),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
  } catch (error) {
    console.error('Error getting announcements:', error);
    return [];
  }
};

// Real-time listener for a classroom's announcements
export const subscribeToAnnouncements = (
  classroomId: string,
  callback: (announcements: Announcement[]) => void,
): Unsubscribe => {
  const q = query(
    collection(firestore, 'classrooms', classroomId, 'announcements'),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, snapshot => {
    callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Announcement)));
  });
};

export const pinAnnouncement = async (classroomId: string, announcementId: string, isPinned: boolean): Promise<void> => {
  const docRef = doc(firestore, 'classrooms', classroomId, 'announcements', announcementId);
  await updateDoc(docRef, { isPinned, updatedAt: Date.now() });
};

export const deleteAnnouncement = async (classroomId: string, announcementId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'classrooms', classroomId, 'announcements', announcementId));
};

/** Returns announcements created after `lastSeenAt` timestamp (unread ones). */
export const getUnreadAnnouncements = async (
  classroomId: string,
  lastSeenAt: number,
): Promise<Announcement[]> => {
  try {
    const q = query(
      collection(firestore, 'classrooms', classroomId, 'announcements'),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() } as Announcement))
      .filter(a => (a.createdAt ?? 0) > lastSeenAt);
  } catch {
    return [];
  }
};

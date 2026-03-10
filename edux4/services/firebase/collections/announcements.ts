// services/firebase/collections/announcements.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
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

export const pinAnnouncement = async (classroomId: string, announcementId: string, isPinned: boolean): Promise<void> => {
  const docRef = doc(firestore, 'classrooms', classroomId, 'announcements', announcementId);
  await updateDoc(docRef, { isPinned, updatedAt: Date.now() });
};

export const deleteAnnouncement = async (classroomId: string, announcementId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'classrooms', classroomId, 'announcements', announcementId));
};

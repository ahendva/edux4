// services/firebase/collections/progressReports.ts
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
} from 'firebase/firestore';
import { ProgressReport } from '../schema';

export const createReport = async (
  report: Omit<ProgressReport, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> => {
  const now = Date.now();
  const docRef = await addDoc(collection(firestore, 'progressReports'), {
    ...report,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
};

export const getReport = async (reportId: string): Promise<ProgressReport | null> => {
  const snap = await getDoc(doc(firestore, 'progressReports', reportId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ProgressReport;
};

export const getReportsForStudent = async (studentId: string): Promise<ProgressReport[]> => {
  try {
    const q = query(
      collection(firestore, 'progressReports'),
      where('studentId', '==', studentId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressReport));
  } catch (error) {
    console.error('Error getting student reports:', error);
    return [];
  }
};

export const getReportsForClassroom = async (classroomId: string): Promise<ProgressReport[]> => {
  try {
    const q = query(
      collection(firestore, 'progressReports'),
      where('classroomId', '==', classroomId),
      orderBy('createdAt', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgressReport));
  } catch (error) {
    console.error('Error getting classroom reports:', error);
    return [];
  }
};

export const publishReport = async (reportId: string): Promise<void> => {
  await updateDoc(doc(firestore, 'progressReports', reportId), {
    isPublished: true,
    publishedAt: Date.now(),
    updatedAt: Date.now(),
  });
};

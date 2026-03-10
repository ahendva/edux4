// services/firebase/collections/classrooms.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { Classroom } from '../schema';

export const createClassroom = async (classroom: Omit<Classroom, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const now = Date.now();
    const classroomsRef = collection(firestore, 'classrooms');
    const docRef = await addDoc(classroomsRef, {
      ...classroom,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    throw new Error(`Failed to create classroom: ${(error as Error).message}`);
  }
};

export const getClassroom = async (classroomId: string): Promise<Classroom | null> => {
  try {
    const docRef = doc(firestore, 'classrooms', classroomId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Classroom;
  } catch (error) {
    throw new Error(`Failed to get classroom: ${(error as Error).message}`);
  }
};

export const getUserClassrooms = async (userId: string): Promise<Classroom[]> => {
  try {
    const classroomsRef = collection(firestore, 'classrooms');
    const q = query(classroomsRef, where('participantIds', 'array-contains', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
  } catch (error) {
    console.error('Error getting user classrooms:', error);
    return [];
  }
};

export const getTeacherClassrooms = async (teacherId: string): Promise<Classroom[]> => {
  try {
    const classroomsRef = collection(firestore, 'classrooms');
    const q = query(classroomsRef, where('teacherId', '==', teacherId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Classroom));
  } catch (error) {
    console.error('Error getting teacher classrooms:', error);
    return [];
  }
};

export const updateClassroom = async (classroomId: string, updates: Partial<Classroom>): Promise<void> => {
  const docRef = doc(firestore, 'classrooms', classroomId);
  await updateDoc(docRef, { ...updates, updatedAt: Date.now() });
};

export const addParticipant = async (classroomId: string, userId: string): Promise<void> => {
  const docRef = doc(firestore, 'classrooms', classroomId);
  await updateDoc(docRef, { participantIds: arrayUnion(userId) });
};

export const removeParticipant = async (classroomId: string, userId: string): Promise<void> => {
  const docRef = doc(firestore, 'classrooms', classroomId);
  await updateDoc(docRef, { participantIds: arrayRemove(userId) });
};

export const deleteClassroom = async (classroomId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'classrooms', classroomId));
};

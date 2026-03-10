// services/firebase/collections/classrooms.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
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

export const getUserClassrooms = async (
  userId: string,
  includeArchived = false,
): Promise<Classroom[]> => {
  try {
    const q = query(
      collection(firestore, 'classrooms'),
      where('participantIds', 'array-contains', userId),
    );
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
    return includeArchived ? all : all.filter(c => !c.isArchived);
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

export const archiveClassroom = async (classroomId: string): Promise<void> => {
  await updateDoc(doc(firestore, 'classrooms', classroomId), {
    isArchived: true,
    updatedAt: Date.now(),
  });
};

export const getActiveClassrooms = async (userId: string): Promise<Classroom[]> => {
  try {
    const q = query(
      collection(firestore, 'classrooms'),
      where('participantIds', 'array-contains', userId),
      where('isArchived', '==', false),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
  } catch {
    // Fallback: some classrooms may not have isArchived field; filter client-side
    const all = await getUserClassrooms(userId);
    return all.filter(c => !c.isArchived);
  }
};

// Find classroom by 6-char join code
export const findClassroomByJoinCode = async (joinCode: string): Promise<Classroom | null> => {
  try {
    const q = query(
      collection(firestore, 'classrooms'),
      where('joinCode', '==', joinCode.toUpperCase()),
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const d = snapshot.docs[0];
    return { id: d.id, ...d.data() } as Classroom;
  } catch (error) {
    console.error('Error finding classroom by join code:', error);
    return null;
  }
};

export const addStudentToClassroom = async (
  classroomId: string,
  studentId: string,
): Promise<void> => {
  await updateDoc(doc(firestore, 'classrooms', classroomId), {
    studentIds: arrayUnion(studentId),
    updatedAt: Date.now(),
  });
};

export const removeStudentFromClassroom = async (
  classroomId: string,
  studentId: string,
): Promise<void> => {
  await updateDoc(doc(firestore, 'classrooms', classroomId), {
    studentIds: arrayRemove(studentId),
    updatedAt: Date.now(),
  });
};

export const deleteClassroom = async (classroomId: string): Promise<void> => {
  await deleteDoc(doc(firestore, 'classrooms', classroomId));
};

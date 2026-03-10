// services/firebase/collections/students.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { Student } from '../schema';

export const getStudent = async (studentId: string): Promise<Student | null> => {
  try {
    const snap = await getDoc(doc(firestore, 'students', studentId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Student;
  } catch (error) {
    throw new Error(`Failed to get student: ${(error as Error).message}`);
  }
};

export const getStudentsInClassroom = async (classroomId: string): Promise<Student[]> => {
  try {
    const q = query(
      collection(firestore, 'students'),
      where('classroomIds', 'array-contains', classroomId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
  } catch (error) {
    console.error('Error getting classroom students:', error);
    return [];
  }
};

export const getStudentsForParent = async (parentUid: string): Promise<Student[]> => {
  try {
    const q = query(
      collection(firestore, 'students'),
      where('parentIds', 'array-contains', parentUid),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Student));
  } catch (error) {
    console.error('Error getting parent students:', error);
    return [];
  }
};

export const updateStudent = async (
  studentId: string,
  data: Partial<Student>,
): Promise<void> => {
  await updateDoc(doc(firestore, 'students', studentId), {
    ...data,
    updatedAt: Date.now(),
  });
};

export const linkStudentToClassroom = async (
  studentId: string,
  classroomId: string,
): Promise<void> => {
  const batch = writeBatch(firestore);
  const studentRef = doc(firestore, 'students', studentId);
  const classroomRef = doc(firestore, 'classrooms', classroomId);

  const { arrayUnion } = await import('firebase/firestore');
  batch.update(studentRef, { classroomIds: arrayUnion(classroomId), updatedAt: Date.now() });
  batch.update(classroomRef, { studentIds: arrayUnion(studentId), updatedAt: Date.now() });
  await batch.commit();
};

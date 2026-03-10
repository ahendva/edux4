// services/powerschool/sync.ts
// Sync engine: pull PowerSchool data → transform → write to Firestore

import { firestore } from '../firebase/firebaseConfig';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import { getPowerSchoolClient } from './client';
import { PSStudent, PSSection } from './types';
import { Classroom, Student, SyncStatus } from '../firebase/schema';

export const syncStudents = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  const psStudents = await client.getStudents(schoolId);
  const batch = writeBatch(firestore);
  let count = 0;

  for (const ps of psStudents) {
    const studentRef = doc(firestore, 'students', `ps_${ps.id}`);
    const student: Omit<Student, 'id'> = {
      firstName: ps.name.first_name,
      lastName: ps.name.last_name,
      grade: ps.school_enrollment?.grade_level?.toString(),
      parentIds: (ps.guardian_ids || []).map(id => `ps_guardian_${id}`),
      classroomIds: [],
      psStudentId: ps.id.toString(),
      psEnrollmentId: ps.local_id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    batch.set(studentRef, student, { merge: true });
    count++;
  }

  await batch.commit();
  await updateSyncStatus('students', count);
  return count;
};

export const syncSections = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  const psSections = await client.getSections(schoolId);
  const batch = writeBatch(firestore);
  let count = 0;

  for (const ps of psSections) {
    const classroomRef = doc(firestore, 'classrooms', `ps_${ps.id}`);
    const classroom: Omit<Classroom, 'id'> = {
      name: `${ps.course_name} - ${ps.section_number}`,
      description: `${ps.course_name} (${ps.course_number})`,
      subject: ps.course_name,
      teacherId: `ps_staff_${ps.teacher_id}`,
      participantIds: [],
      studentIds: [],
      psSectionId: ps.id.toString(),
      psSchoolId: ps.school_id.toString(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    batch.set(classroomRef, classroom, { merge: true });
    count++;
  }

  await batch.commit();
  await updateSyncStatus('classrooms', count);
  return count;
};

export const syncSectionStudents = async (sectionId: number, classroomId: string): Promise<number> => {
  const client = getPowerSchoolClient();
  const psStudents = await client.getSectionStudents(sectionId);
  const studentIds = psStudents.map(s => `ps_${s.id}`);

  const classroomRef = doc(firestore, 'classrooms', classroomId);
  await setDoc(classroomRef, { studentIds, updatedAt: Date.now() }, { merge: true });

  return studentIds.length;
};

const updateSyncStatus = async (collectionName: string, recordsSynced: number): Promise<void> => {
  const statusRef = doc(firestore, 'sync_status', collectionName);
  const status: Omit<SyncStatus, 'id'> = {
    collection: collectionName,
    lastSyncAt: Date.now(),
    recordsSynced,
    status: 'success',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(statusRef, status, { merge: true });
};

export const runFullSync = async (schoolId: number): Promise<{
  students: number;
  sections: number;
}> => {
  const students = await syncStudents(schoolId);
  const sections = await syncSections(schoolId);
  return { students, sections };
};

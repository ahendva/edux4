// services/powerschool/sync.ts
// Sync engine: pull PowerSchool data → transform → write to Firestore

import { firestore } from '../firebase/firebaseConfig';
import { doc, setDoc, collection, writeBatch, getDocs, query, where } from 'firebase/firestore';
import { getPowerSchoolClient } from './client';
import { PSStudent, PSSection, SyncResult, SyncError } from './types';
import { Classroom, Student, SyncStatus, ProgressReport } from '../firebase/schema';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const updateSyncStatus = async (
  collectionName: string,
  recordsSynced: number,
  status: SyncStatus['status'],
  errorMessage?: string,
): Promise<void> => {
  const statusRef = doc(firestore, 'sync_status', collectionName);
  await setDoc(
    statusRef,
    {
      collection: collectionName,
      lastSyncAt: Date.now(),
      recordsSynced,
      status,
      errorMessage: errorMessage ?? null,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
};

const BATCH_SIZE = 400; // Firestore batch limit is 500

async function commitInBatches(
  ops: Array<{ ref: ReturnType<typeof doc>; data: Record<string, unknown> }>,
): Promise<void> {
  for (let i = 0; i < ops.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore);
    ops.slice(i, i + BATCH_SIZE).forEach(({ ref, data }) => {
      batch.set(ref, data, { merge: true });
    });
    await batch.commit();
  }
}

// ─── Students ─────────────────────────────────────────────────────────────────

export const syncStudents = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  await updateSyncStatus('students', 0, 'running');

  try {
    const psStudents = await client.getStudents(schoolId);
    const now = Date.now();

    const ops = psStudents.map(ps => {
      const studentRef = doc(firestore, 'students', `ps_${ps.id}`);
      const student: Omit<Student, 'id'> = {
        firstName: ps.name.first_name,
        lastName: ps.name.last_name,
        grade: ps.school_enrollment?.grade_level?.toString(),
        parentIds: [],
        classroomIds: [],
        psStudentId: ps.id.toString(),
        psEnrollmentId: ps.local_id,
        createdAt: now,
        updatedAt: now,
      };
      return { ref: studentRef, data: student as Record<string, unknown> };
    });

    await commitInBatches(ops);
    await updateSyncStatus('students', psStudents.length, 'success');
    return psStudents.length;
  } catch (error) {
    await updateSyncStatus('students', 0, 'error', (error as Error).message);
    throw error;
  }
};

// ─── Sections → Classrooms ────────────────────────────────────────────────────

export const syncSections = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  await updateSyncStatus('classrooms', 0, 'running');

  try {
    const psSections = await client.getSections(schoolId);
    const now = Date.now();

    const ops = psSections.map(ps => {
      const classroomRef = doc(firestore, 'classrooms', `ps_${ps.id}`);
      const classroom: Omit<Classroom, 'id'> = {
        name: `${ps.course_name} - ${ps.section_number}`,
        description: `${ps.course_name} (${ps.course_number})`,
        subject: ps.course_name,
        gradeLevel: undefined,
        termId: ps.term_id.toString(),
        teacherId: `ps_staff_${ps.teacher_id}`,
        participantIds: [],
        studentIds: [],
        psSectionId: ps.id.toString(),
        psSchoolId: ps.school_id.toString(),
        createdAt: now,
        updatedAt: now,
      };
      return { ref: classroomRef, data: classroom as Record<string, unknown> };
    });

    await commitInBatches(ops);
    await updateSyncStatus('classrooms', psSections.length, 'success');
    return psSections.length;
  } catch (error) {
    await updateSyncStatus('classrooms', 0, 'error', (error as Error).message);
    throw error;
  }
};

// ─── Section → Students ───────────────────────────────────────────────────────

export const syncSectionStudents = async (
  sectionId: number,
  classroomId: string,
): Promise<number> => {
  const client = getPowerSchoolClient();
  const psStudents = await client.getSectionStudents(sectionId);
  const studentIds = psStudents.map(s => `ps_${s.id}`);
  const now = Date.now();

  const batch = writeBatch(firestore);

  // Update classroom
  batch.set(
    doc(firestore, 'classrooms', classroomId),
    { studentIds, updatedAt: now },
    { merge: true },
  );

  // Update each student's classroomIds
  studentIds.forEach(sid => {
    const ref = doc(firestore, 'students', sid);
    batch.set(ref, { classroomIds: studentIds }, { merge: true });
  });

  await batch.commit();
  return studentIds.length;
};

// ─── Staff → Teacher Users ────────────────────────────────────────────────────

export const syncStaff = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  await updateSyncStatus('staff', 0, 'running');

  try {
    const psStaff = await client.getSchoolStaff(schoolId);
    let matched = 0;

    for (const staff of psStaff) {
      if (!staff.email) continue;

      // Match by email to an existing teacher user
      const q = query(
        collection(firestore, 'users'),
        where('email', '==', staff.email),
        where('role', '==', 'teacher'),
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        await setDoc(
          doc(firestore, 'users', userDoc.id),
          { psStaffId: staff.id.toString(), updatedAt: Date.now() },
          { merge: true },
        );
        matched++;
      }
    }

    await updateSyncStatus('staff', matched, 'success');
    return matched;
  } catch (error) {
    await updateSyncStatus('staff', 0, 'error', (error as Error).message);
    throw error;
  }
};

// ─── Guardians → Parent Users ─────────────────────────────────────────────────

export const syncGuardians = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  await updateSyncStatus('guardians', 0, 'running');

  try {
    const psStudents = await client.getStudents(schoolId);
    let matched = 0;

    for (const student of psStudents) {
      const guardians = await client.getStudentGuardians(student.id);
      const studentFirestoreId = `ps_${student.id}`;

      for (const guardian of guardians) {
        if (!guardian.email) continue;

        // Match guardian email to a parent user
        const q = query(
          collection(firestore, 'users'),
          where('email', '==', guardian.email),
          where('role', '==', 'parent'),
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const batch = writeBatch(firestore);

          // Link guardian to parent user
          batch.set(
            doc(firestore, 'users', userDoc.id),
            {
              psGuardianId: guardian.guardian_id.toString(),
              children: [...(userDoc.data().children || []), studentFirestoreId].filter(
                (v, i, a) => a.indexOf(v) === i,
              ),
              updatedAt: Date.now(),
            },
            { merge: true },
          );

          // Link parent to student
          batch.set(
            doc(firestore, 'students', studentFirestoreId),
            {
              parentIds: [...((await (async () => {
                const sd = await getDocs(query(collection(firestore, 'students'), where('psStudentId', '==', student.id.toString())));
                return sd.empty ? [] : (sd.docs[0].data().parentIds as string[] || []);
              })()), userDoc.id)].filter((v, i, a) => a.indexOf(v) === i),
              updatedAt: Date.now(),
            },
            { merge: true },
          );

          await batch.commit();
          matched++;
        }
      }
    }

    await updateSyncStatus('guardians', matched, 'success');
    return matched;
  } catch (error) {
    await updateSyncStatus('guardians', 0, 'error', (error as Error).message);
    throw error;
  }
};

// ─── Grades ───────────────────────────────────────────────────────────────────

export const syncGrades = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  await updateSyncStatus('grades', 0, 'running');

  try {
    const psStudents = await client.getStudents(schoolId);
    let count = 0;
    const now = Date.now();

    for (const student of psStudents) {
      const storedGrades = await client.getStoredGrades(student.id);
      if (storedGrades.length === 0) continue;

      // Group by term
      const byTerm = new Map<number, typeof storedGrades>();
      storedGrades.forEach(g => {
        const existing = byTerm.get(g.term_id) || [];
        existing.push(g);
        byTerm.set(g.term_id, existing);
      });

      for (const [termId, grades] of byTerm) {
        const reportId = `ps_grade_${student.id}_${termId}`;
        const report: Omit<ProgressReport, 'id'> = {
          studentId: `ps_${student.id}`,
          classroomId: grades[0].section_id ? `ps_${grades[0].section_id}` : '',
          teacherId: 'sync',
          term: grades[0].term_name || `Term ${termId}`,
          grades: grades.map(g => ({
            subject: g.course_name || `Section ${g.section_id}`,
            grade: g.letter_grade || '',
            score: g.percent,
            comments: g.comment,
          })),
          isPublished: true,
          publishedAt: now,
          psReportId: reportId,
          createdAt: now,
          updatedAt: now,
        };

        await setDoc(doc(firestore, 'progressReports', reportId), report, { merge: true });
        count++;
      }
    }

    await updateSyncStatus('grades', count, 'success');
    return count;
  } catch (error) {
    await updateSyncStatus('grades', 0, 'error', (error as Error).message);
    throw error;
  }
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export const syncAttendance = async (schoolId: number): Promise<number> => {
  const client = getPowerSchoolClient();
  await updateSyncStatus('attendance', 0, 'running');

  try {
    const psStudents = await client.getStudents(schoolId);
    let count = 0;
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    for (const student of psStudents) {
      const records = await client.getStudentAttendance(student.id);
      const recent = records.filter(
        r => new Date(r.date).getTime() >= ninetyDaysAgo,
      );

      const summary = {
        presentCount: recent.filter(r => r.status === 'present').length,
        absentCount: recent.filter(r => r.status === 'absent').length,
        tardyCount: recent.filter(r => r.status === 'tardy').length,
        excusedCount: recent.filter(r => r.status === 'excused').length,
        lastUpdated: Date.now(),
      };

      await setDoc(
        doc(firestore, 'students', `ps_${student.id}`),
        { attendanceSummary: summary, updatedAt: Date.now() },
        { merge: true },
      );
      count++;
    }

    await updateSyncStatus('attendance', count, 'success');
    return count;
  } catch (error) {
    await updateSyncStatus('attendance', 0, 'error', (error as Error).message);
    throw error;
  }
};

// ─── Full Sync ────────────────────────────────────────────────────────────────

export const runFullSync = async (schoolId: number): Promise<SyncResult> => {
  const errors: SyncError[] = [];
  const result: SyncResult = {
    students: 0,
    sections: 0,
    staff: 0,
    guardians: 0,
    grades: 0,
    attendance: 0,
    errors,
  };

  const run = async (
    name: keyof Omit<SyncResult, 'errors'>,
    fn: () => Promise<number>,
  ) => {
    try {
      result[name] = await fn();
    } catch (error) {
      errors.push({
        collection: name,
        message: (error as Error).message,
        timestamp: Date.now(),
      });
    }
  };

  // Order matters: staff first (teacher IDs needed for classrooms), then students, sections, then linking
  await run('staff', () => syncStaff(schoolId));
  await run('students', () => syncStudents(schoolId));
  await run('sections', () => syncSections(schoolId));
  await run('guardians', () => syncGuardians(schoolId));
  await run('grades', () => syncGrades(schoolId));
  await run('attendance', () => syncAttendance(schoolId));

  return result;
};

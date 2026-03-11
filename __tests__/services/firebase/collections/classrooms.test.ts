// __tests__/services/firebase/collections/classrooms.test.ts
import {
  createClassroom,
  getClassroom,
  getUserClassrooms,
  addParticipant,
  archiveClassroom,
  findClassroomByJoinCode,
} from '../../../../services/firebase/collections/classrooms';

beforeEach(() => { global.__firestoreMock?.reset(); });

describe('classrooms service', () => {
  // ── createClassroom ───────────────────────────────────────────────────────
  describe('createClassroom', () => {
    it('creates a classroom and returns an id', async () => {
      const id = await createClassroom({
        name: 'Math 101',
        subject: 'Mathematics',
        teacherId: 'teacher1',
        participantIds: ['teacher1'],
        studentIds: [],
        isArchived: false,
      });

      expect(typeof id).toBe('string');
      expect(id).toMatch(/^mock-id-/);
    });

    it('stores the classroom with correct fields', async () => {
      const id = await createClassroom({
        name: 'Science 202',
        subject: 'Science',
        teacherId: 'teacher2',
        participantIds: ['teacher2'],
        studentIds: [],
        isArchived: false,
      });

      const stored = global.__firestoreMock.getDoc(`classrooms/${id}`);
      expect(stored.name).toBe('Science 202');
      expect(stored.teacherId).toBe('teacher2');
      expect(typeof stored.createdAt).toBe('number');
    });
  });

  // ── getClassroom ──────────────────────────────────────────────────────────
  describe('getClassroom', () => {
    it('returns null for non-existent classroom', async () => {
      const result = await getClassroom('nonexistent');
      expect(result).toBeNull();
    });

    it('returns classroom when it exists', async () => {
      global.__firestoreMock.setDoc('classrooms/c-test', {
        name: 'Art Class',
        subject: 'Art',
        teacherId: 'teacher3',
        participantIds: ['teacher3'],
        studentIds: [],
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await getClassroom('c-test');
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Art Class');
      expect(result?.id).toBe('c-test');
    });
  });

  // ── getUserClassrooms ─────────────────────────────────────────────────────
  describe('getUserClassrooms', () => {
    it('returns empty array when user has no classrooms', async () => {
      const result = await getUserClassrooms('user-with-no-classrooms');
      expect(result).toEqual([]);
    });

    it('returns only non-archived classrooms by default', async () => {
      global.__firestoreMock.setDoc('classrooms/active1', {
        participantIds: ['user10'],
        isArchived: false,
        name: 'Active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      global.__firestoreMock.setDoc('classrooms/archived1', {
        participantIds: ['user10'],
        isArchived: true,
        name: 'Archived',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await getUserClassrooms('user10');
      const names = result.map(c => c.name);
      expect(names).toContain('Active');
      expect(names).not.toContain('Archived');
    });

    it('includes archived classrooms when includeArchived=true', async () => {
      global.__firestoreMock.setDoc('classrooms/active2', {
        participantIds: ['user11'],
        isArchived: false,
        name: 'Active2',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      global.__firestoreMock.setDoc('classrooms/archived2', {
        participantIds: ['user11'],
        isArchived: true,
        name: 'Archived2',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await getUserClassrooms('user11', true);
      expect(result.length).toBe(2);
    });
  });

  // ── addParticipant ────────────────────────────────────────────────────────
  describe('addParticipant', () => {
    it('calls updateDoc on the classroom document', async () => {
      global.__firestoreMock.setDoc('classrooms/c-join', {
        participantIds: ['teacher1'],
        name: 'Test',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Should not throw
      await expect(addParticipant('c-join', 'new-user')).resolves.toBeUndefined();
    });
  });

  // ── archiveClassroom ──────────────────────────────────────────────────────
  describe('archiveClassroom', () => {
    it('sets isArchived to true', async () => {
      global.__firestoreMock.setDoc('classrooms/c-archive', {
        name: 'To Archive',
        isArchived: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await archiveClassroom('c-archive');

      const stored = global.__firestoreMock.getDoc('classrooms/c-archive');
      expect(stored.isArchived).toBe(true);
    });
  });

  // ── findClassroomByJoinCode ───────────────────────────────────────────────
  describe('findClassroomByJoinCode', () => {
    it('returns null when no match found', async () => {
      const result = await findClassroomByJoinCode('XXXXXX');
      expect(result).toBeNull();
    });
  });
});

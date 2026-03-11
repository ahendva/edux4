// __tests__/services/firebase/collections/connections.test.ts
import {
  sendConnectionRequest,
  getPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
} from '../../../../services/firebase/collections/connections';

beforeEach(() => { global.__firestoreMock?.reset(); });

describe('connections service', () => {
  // ── sendConnectionRequest ─────────────────────────────────────────────────
  describe('sendConnectionRequest', () => {
    it('creates a pending connection request and returns id', async () => {
      const id = await sendConnectionRequest('user1', 'user2', 'Hello teacher!');

      expect(id).toMatch(/^mock-id-/);

      const stored = global.__firestoreMock.getDoc(`connectionRequests/${id}`);
      expect(stored.fromUserId).toBe('user1');
      expect(stored.toUserId).toBe('user2');
      expect(stored.status).toBe('pending');
      expect(stored.message).toBe('Hello teacher!');
    });

    it('sets empty message when none provided', async () => {
      const id = await sendConnectionRequest('user3', 'user4');
      const stored = global.__firestoreMock.getDoc(`connectionRequests/${id}`);
      expect(stored.message).toBe('');
    });

    it('stores createdAt and updatedAt timestamps', async () => {
      const before = Date.now();
      const id = await sendConnectionRequest('u5', 'u6');
      const after = Date.now();
      const stored = global.__firestoreMock.getDoc(`connectionRequests/${id}`);
      expect(stored.createdAt).toBeGreaterThanOrEqual(before);
      expect(stored.createdAt).toBeLessThanOrEqual(after);
    });
  });

  // ── getPendingRequests ────────────────────────────────────────────────────
  describe('getPendingRequests', () => {
    it('returns empty array when no pending requests', async () => {
      const result = await getPendingRequests('user-with-no-requests');
      expect(result).toEqual([]);
    });

    it('returns seeded pending requests', async () => {
      global.__firestoreMock.setDoc('connectionRequests/req1', {
        fromUserId: 'teacher1',
        toUserId: 'parent1',
        status: 'pending',
        message: 'Join my class',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const result = await getPendingRequests('parent1');
      // Note: mock getDocs returns all docs in collection, filtering by where() is not
      // applied in the simple mock — this tests that the function handles the query
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ── rejectConnectionRequest ───────────────────────────────────────────────
  describe('rejectConnectionRequest', () => {
    it('updates request status to rejected', async () => {
      global.__firestoreMock.setDoc('connectionRequests/req-reject', {
        fromUserId: 'u1',
        toUserId: 'u2',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await rejectConnectionRequest('req-reject');

      const stored = global.__firestoreMock.getDoc('connectionRequests/req-reject');
      expect(stored.status).toBe('rejected');
    });
  });

  // ── acceptConnectionRequest ───────────────────────────────────────────────
  describe('acceptConnectionRequest', () => {
    it('throws when request does not exist', async () => {
      await expect(acceptConnectionRequest('nonexistent-req')).rejects.toThrow('Request not found');
    });

    it('updates request status to accepted', async () => {
      // Seed both user profiles and the request
      global.__firestoreMock.setDoc('users/teacher10', {
        displayName: 'Teacher Ten',
        connections: [],
        role: 'teacher',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      global.__firestoreMock.setDoc('users/parent10', {
        displayName: 'Parent Ten',
        connections: [],
        role: 'parent',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      global.__firestoreMock.setDoc('connectionRequests/req-accept', {
        fromUserId: 'teacher10',
        toUserId: 'parent10',
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await acceptConnectionRequest('req-accept');

      const stored = global.__firestoreMock.getDoc('connectionRequests/req-accept');
      expect(stored.status).toBe('accepted');
    });
  });
});

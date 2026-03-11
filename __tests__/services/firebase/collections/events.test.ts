// __tests__/services/firebase/collections/events.test.ts
import {
  createEvent,
  getEvent,
  getUpcomingEvents,
  updateRSVP,
  deleteEvent,
} from '../../../../services/firebase/collections/events';

beforeEach(() => { global.__firestoreMock?.reset(); });

describe('events service', () => {
  const baseEvent = {
    title: 'Parent Night',
    type: 'meeting' as const,
    startDate: Date.now() + 86_400_000, // tomorrow
    creatorId: 'teacher1',
    rsvps: {},
    classroomIds: ['c1'],
    source: 'manual' as const,
  };

  // ── createEvent ───────────────────────────────────────────────────────────
  describe('createEvent', () => {
    it('creates an event and returns an id', async () => {
      const id = await createEvent(baseEvent);
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^mock-id-/);
    });

    it('initializes rsvpCounts with zeros', async () => {
      const id = await createEvent(baseEvent);
      const stored = global.__firestoreMock.getDoc(`events/${id}`);
      expect(stored.rsvpCounts).toEqual({ yes: 0, no: 0, maybe: 0 });
    });

    it('stores provided rsvpCounts if given', async () => {
      const id = await createEvent({
        ...baseEvent,
        rsvpCounts: { yes: 3, no: 1, maybe: 0 },
      });
      const stored = global.__firestoreMock.getDoc(`events/${id}`);
      expect(stored.rsvpCounts.yes).toBe(3);
    });

    it('sets source to manual by default', async () => {
      const id = await createEvent({ ...baseEvent, source: undefined as unknown as 'manual' });
      const stored = global.__firestoreMock.getDoc(`events/${id}`);
      expect(stored.source).toBe('manual');
    });
  });

  // ── getEvent ──────────────────────────────────────────────────────────────
  describe('getEvent', () => {
    it('returns null for non-existent event', async () => {
      const result = await getEvent('nonexistent-event');
      expect(result).toBeNull();
    });

    it('returns event when it exists', async () => {
      global.__firestoreMock.setDoc('events/ev1', {
        title: 'Science Fair',
        type: 'deadline',
        startDate: Date.now(),
        creatorId: 'teacher2',
        rsvps: {},
        rsvpCounts: { yes: 0, no: 0, maybe: 0 },
        source: 'manual',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const event = await getEvent('ev1');
      expect(event).not.toBeNull();
      expect(event?.title).toBe('Science Fair');
      expect(event?.id).toBe('ev1');
    });
  });

  // ── getUpcomingEvents ─────────────────────────────────────────────────────
  describe('getUpcomingEvents', () => {
    it('returns empty array when no events', async () => {
      const result = await getUpcomingEvents('user1');
      expect(result).toEqual([]);
    });
  });

  // ── updateRSVP ────────────────────────────────────────────────────────────
  describe('updateRSVP', () => {
    it('updates rsvp status for a user', async () => {
      global.__firestoreMock.setDoc('events/ev-rsvp', {
        title: 'Meeting',
        type: 'meeting',
        startDate: Date.now(),
        creatorId: 'teacher1',
        rsvps: {},
        rsvpCounts: { yes: 0, no: 0, maybe: 0 },
        source: 'manual',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await updateRSVP('ev-rsvp', 'parent1', 'going');

      const stored = global.__firestoreMock.getDoc('events/ev-rsvp');
      expect(stored[`rsvps.parent1`]).toBe('going');
    });
  });

  // ── deleteEvent ───────────────────────────────────────────────────────────
  describe('deleteEvent', () => {
    it('removes event document', async () => {
      global.__firestoreMock.setDoc('events/ev-del', {
        title: 'Delete me',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await deleteEvent('ev-del');

      const stored = global.__firestoreMock.getDoc('events/ev-del');
      expect(stored).toBeNull();
    });
  });
});

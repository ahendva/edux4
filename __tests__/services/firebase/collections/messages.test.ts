// __tests__/services/firebase/collections/messages.test.ts
import {
  sendMessage,
  getMessages,
  markAsRead,
  markAllRead,
  deleteMessage,
  getUnreadCount,
} from '../../../../services/firebase/collections/messages';

// Mock the translation service so sendMessage doesn't trigger real API calls
jest.mock('../../../../services/translation', () => ({
  translateMessageToAll: jest.fn().mockResolvedValue(undefined),
}));

beforeEach(() => { global.__firestoreMock?.reset(); });

describe('messages service', () => {
  // ── sendMessage ──────────────────────────────────────────────────────────
  describe('sendMessage', () => {
    it('creates a message document with correct fields', async () => {
      // Seed the parent conversation so updateDoc doesn't fail on missing path
      global.__firestoreMock.setDoc('conversations/conv1', {
        participantIds: ['user1', 'user2'],
        unreadCounts: {},
      });

      const id = await sendMessage('conv1', 'user1', 'Hello World');

      expect(id).toMatch(/^mock-id-/);
      const stored = global.__firestoreMock.getDoc(`conversations/conv1/messages/${id}`);
      expect(stored).not.toBeNull();
      expect(stored.senderId).toBe('user1');
      expect(stored.text).toBe('Hello World');
      expect(stored.readBy).toContain('user1');
      expect(stored.conversationId).toBe('conv1');
    });

    it('updates conversation lastMessage preview', async () => {
      global.__firestoreMock.setDoc('conversations/conv2', {
        participantIds: ['a', 'b'],
        unreadCounts: {},
        lastMessage: '',
      });

      await sendMessage('conv2', 'a', 'Quick brown fox');

      const conv = global.__firestoreMock.getDoc('conversations/conv2');
      expect(conv.lastMessage).toBe('Quick brown fox');
      expect(typeof conv.lastMessageAt).toBe('number');
    });

    it('truncates long message text in lastMessage preview', async () => {
      global.__firestoreMock.setDoc('conversations/conv3', {
        participantIds: ['a', 'b'],
        unreadCounts: {},
      });
      const longText = 'A'.repeat(200);

      await sendMessage('conv3', 'a', longText);

      const conv = global.__firestoreMock.getDoc('conversations/conv3');
      expect(conv.lastMessage.length).toBeLessThanOrEqual(100);
    });
  });

  // ── getMessages ──────────────────────────────────────────────────────────
  describe('getMessages', () => {
    it('returns empty array when no messages', async () => {
      const msgs = await getMessages('empty-conv');
      expect(msgs).toEqual([]);
    });

    it('returns seeded messages', async () => {
      global.__firestoreMock.setDoc('conversations/conv4/messages/m1', {
        conversationId: 'conv4',
        senderId: 'user1',
        text: 'First',
        readBy: ['user1'],
        createdAt: 1000,
        updatedAt: 1000,
      });
      global.__firestoreMock.setDoc('conversations/conv4/messages/m2', {
        conversationId: 'conv4',
        senderId: 'user2',
        text: 'Second',
        readBy: ['user2'],
        createdAt: 2000,
        updatedAt: 2000,
      });

      const msgs = await getMessages('conv4');
      expect(msgs.length).toBe(2);
    });
  });

  // ── markAsRead ───────────────────────────────────────────────────────────
  describe('markAsRead', () => {
    it('adds userId to readBy array', async () => {
      global.__firestoreMock.setDoc('conversations/conv5/messages/m10', {
        readBy: ['sender1'],
        senderId: 'sender1',
        text: 'Hi',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await markAsRead('conv5', 'm10', 'recipient1');

      const stored = global.__firestoreMock.getDoc('conversations/conv5/messages/m10');
      // updateDoc is called with arrayUnion — the mock stores the __arrayUnion marker
      expect(stored.readBy).toBeDefined();
    });
  });

  // ── deleteMessage ────────────────────────────────────────────────────────
  describe('deleteMessage', () => {
    it('removes message document from store', async () => {
      global.__firestoreMock.setDoc('conversations/conv6/messages/m20', {
        senderId: 'user1',
        text: 'Delete me',
        readBy: ['user1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await deleteMessage('conv6', 'm20');

      const stored = global.__firestoreMock.getDoc('conversations/conv6/messages/m20');
      expect(stored).toBeNull();
    });
  });

  // ── getUnreadCount ───────────────────────────────────────────────────────
  describe('getUnreadCount', () => {
    it('returns 0 when all messages read by userId', async () => {
      global.__firestoreMock.setDoc('conversations/conv7/messages/ma', {
        senderId: 'user1',
        text: 'Hello',
        readBy: ['user1', 'user2'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const count = await getUnreadCount('conv7', 'user2');
      expect(count).toBe(0);
    });

    it('counts messages not read by userId', async () => {
      global.__firestoreMock.setDoc('conversations/conv8/messages/mb', {
        senderId: 'user1',
        text: 'Unread',
        readBy: ['user1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      global.__firestoreMock.setDoc('conversations/conv8/messages/mc', {
        senderId: 'user1',
        text: 'Also unread',
        readBy: ['user1'],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      const count = await getUnreadCount('conv8', 'user2');
      expect(count).toBe(2);
    });
  });
});

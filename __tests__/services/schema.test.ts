// __tests__/services/schema.test.ts — Validate schema type shapes
// These are compile-time checks that Jest runs to ensure TypeScript types are consistent

import type {
  UserProfile,
  Classroom,
  Student,
  Message,
  Conversation,
  CalendarEvent,
  ProgressReport,
  ConnectionRequest,
  SyncStatus,
} from '../../services/firebase/schema';

describe('Schema type checks', () => {
  it('UserProfile has required fields', () => {
    const profile: UserProfile = {
      id: 'uid1',
      email: 'test@example.com',
      displayName: 'Test User',
      username: 'testuser',
      role: 'teacher',
      connections: [],
      children: [],
      settings: {
        notificationPreferences: {
          messages: true,
          announcements: true,
          events: true,
          reports: true,
          connectionRequests: true,
        },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(profile.role).toBe('teacher');
    expect(profile.connections).toEqual([]);
  });

  it('Student has attendanceSummary field with correct field names', () => {
    const student: Student = {
      id: 's1',
      firstName: 'Jane',
      lastName: 'Doe',
      parentIds: [],
      classroomIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      attendanceSummary: {
        presentCount: 10,
        absentCount: 2,
        tardyCount: 1,
        excusedCount: 0,
        lastUpdated: Date.now(),
      },
    };
    expect(student.attendanceSummary?.presentCount).toBe(10);
    expect(student.attendanceSummary?.absentCount).toBe(2);
  });

  it('CalendarEvent has classroomIds and rsvpCounts', () => {
    const event: CalendarEvent = {
      id: 'e1',
      title: 'Parent Night',
      type: 'meeting',
      startDate: Date.now(),
      creatorId: 'uid1',
      rsvps: {},
      classroomIds: ['c1', 'c2'],
      rsvpCounts: { yes: 5, no: 2, maybe: 1 },
      source: 'manual',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(event.classroomIds?.length).toBe(2);
    expect(event.rsvpCounts?.yes).toBe(5);
  });

  it('Message supports attachmentName', () => {
    const msg: Message = {
      id: 'm1',
      conversationId: 'conv1',
      senderId: 'uid1',
      text: 'See attached',
      readBy: ['uid1'],
      attachmentUrl: 'https://example.com/file.pdf',
      attachmentName: 'Report.pdf',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(msg.attachmentName).toBe('Report.pdf');
  });

  it('SyncStatus has correct status union', () => {
    const status: SyncStatus = {
      id: 'students',
      collection: 'students',
      lastSyncAt: Date.now(),
      recordsSynced: 42,
      status: 'success',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    expect(['idle', 'running', 'success', 'error']).toContain(status.status);
  });
});

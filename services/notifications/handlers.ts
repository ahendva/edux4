// services/notifications/handlers.ts — Handle incoming push notifications and route user
import { useRouter } from 'expo-router';

export interface NotificationData {
  type: 'message' | 'announcement' | 'event' | 'report' | 'connectionRequest';
  conversationId?: string;
  classroomId?: string;
  eventId?: string;
  reportId?: string;
  requestId?: string;
}

/**
 * Navigate to the correct screen based on notification data.
 * Call this from a notification response listener in the root layout.
 */
export function handleNotificationNavigation(
  router: ReturnType<typeof useRouter>,
  data: NotificationData,
): void {
  switch (data.type) {
    case 'message':
      if (data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      } else {
        router.push('/messages');
      }
      break;
    case 'announcement':
      if (data.classroomId) {
        router.push(`/classrooms/${data.classroomId}`);
      }
      break;
    case 'event':
      if (data.eventId) {
        router.push(`/events/${data.eventId}`);
      } else {
        router.push('/calendar');
      }
      break;
    case 'report':
      if (data.reportId) {
        router.push(`/reports/${data.reportId}`);
      } else {
        router.push('/reports');
      }
      break;
    case 'connectionRequest':
      router.push('/connections/requests');
      break;
    default:
      break;
  }
}

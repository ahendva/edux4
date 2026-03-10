// services/notifications/index.ts — Expo push notification registration and local scheduling
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { updateFcmToken } from '../firebase/collections/users';

// Lazily import to avoid crashes when expo-notifications is not installed
let Notifications: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Notifications = ((globalThis as unknown as { require?: NodeRequire }).require?.('expo-notifications') ?? null) as typeof import('expo-notifications') | null;
} catch {
  // expo-notifications not installed; push notifications disabled
}

export async function registerForPushNotifications(userId: string): Promise<string | null> {
  if (!Notifications) return null;

  // Set up notification handler behaviour
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });

  // Web doesn't support push in the same way
  if (Platform.OS === 'web') return null;

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'EduX4',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1565C0',
    });
  }

  // Get push token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('No EAS project ID configured — cannot get push token');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  // Persist to Firestore so Cloud Functions can use it
  await updateFcmToken(userId, token).catch(console.error);

  return token;
}

export function addNotificationReceivedListener(
  handler: (notification: import('expo-notifications').Notification) => void,
): (() => void) | null {
  if (!Notifications) return null;
  const sub = Notifications.addNotificationReceivedListener(handler);
  return () => sub.remove();
}

export function addNotificationResponseListener(
  handler: (response: import('expo-notifications').NotificationResponse) => void,
): (() => void) | null {
  if (!Notifications) return null;
  const sub = Notifications.addNotificationResponseReceivedListener(handler);
  return () => sub.remove();
}

export async function setBadgeCount(count: number): Promise<void> {
  if (!Notifications) return;
  await Notifications.setBadgeCountAsync(count).catch(console.error);
}

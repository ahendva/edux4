// types/uninstalled-packages.d.ts
// Type stubs for optional packages not in devDependencies.
// These are overridden when the real package is installed.

// ─── @react-native-community/netinfo ────────────────────────────────────────
declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    type: string;
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    details: Record<string, unknown> | null;
  }
  export type NetInfoSubscription = () => void;
  export type NetInfoChangeHandler = (state: NetInfoState) => void;

  interface NetInfoStatic {
    addEventListener(listener: NetInfoChangeHandler): NetInfoSubscription;
    fetch(): Promise<NetInfoState>;
  }

  const NetInfo: NetInfoStatic;
  export default NetInfo;
}

// ─── expo-notifications ──────────────────────────────────────────────────────
declare module 'expo-notifications' {
  export interface NotificationPermissionsStatus {
    status: 'granted' | 'denied' | 'undetermined';
    canAskAgain: boolean;
  }

  export interface ExpoPushToken {
    type: 'expo';
    data: string;
  }

  export interface Notification {
    date: number;
    request: NotificationRequest;
  }

  export interface NotificationRequest {
    identifier: string;
    content: NotificationContent;
    trigger: unknown;
  }

  export interface NotificationContent {
    title: string | null;
    body: string | null;
    data: Record<string, unknown>;
    badge: number | null;
  }

  export interface NotificationResponse {
    notification: Notification;
    actionIdentifier: string;
    userText?: string;
  }

  export interface NotificationHandler {
    handleNotification(notification: Notification): Promise<NotificationBehavior>;
    handleSuccess?(notificationId: string): void;
    handleError?(notificationId: string, error: Error): void;
  }

  export interface NotificationBehavior {
    shouldShowAlert: boolean;
    shouldPlaySound: boolean;
    shouldSetBadge: boolean;
  }

  export interface Subscription {
    remove(): void;
  }

  export function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function requestPermissionsAsync(): Promise<NotificationPermissionsStatus>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<ExpoPushToken>;
  export function setNotificationHandler(handler: NotificationHandler | null): void;
  export function addNotificationReceivedListener(
    listener: (notification: Notification) => void,
  ): Subscription;
  export function addNotificationResponseReceivedListener(
    listener: (response: NotificationResponse) => void,
  ): Subscription;
  export function scheduleNotificationAsync(request: {
    content: Partial<NotificationContent>;
    trigger: null | Record<string, unknown>;
  }): Promise<string>;
  export function setBadgeCountAsync(count: number): Promise<boolean>;
  export function dismissAllNotificationsAsync(): Promise<void>;

  export enum AndroidImportance {
    NONE = 0,
    MIN = 1,
    LOW = 2,
    DEFAULT = 3,
    HIGH = 4,
    MAX = 5,
  }

  export interface NotificationChannel {
    name: string;
    importance: AndroidImportance;
    vibrationPattern?: number[];
    lightColor?: string;
    sound?: string | null;
    bypassDnd?: boolean;
    lockscreenVisibility?: number;
    showBadge?: boolean;
  }

  export function setNotificationChannelAsync(
    channelId: string,
    channel: Partial<NotificationChannel>,
  ): Promise<NotificationChannel | null>;

  export function getNotificationChannelsAsync(): Promise<NotificationChannel[]>;
}

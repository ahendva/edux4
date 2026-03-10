// types/rn-shim.d.ts
// Minimal React Native / Expo ambient shims for type-checking without node_modules.
// Real package types take precedence when node_modules is installed.

declare module 'react' {
  export type ReactNode = string | number | boolean | null | undefined | ReactElement | ReactFragment | ReactPortal;
  export interface ReactElement<P = unknown> {
    type: string | ComponentType<P>;
    props: P;
    key: string | null;
  }
  export type ReactFragment = Iterable<ReactNode>;
  export interface ReactPortal extends ReactElement {}
  export type ComponentType<P = Record<string, unknown>> = ComponentClass<P> | FunctionComponent<P>;
  export type FC<P = Record<string, unknown>> = FunctionComponent<P>;
  export interface FunctionComponent<P = Record<string, unknown>> {
    (props: P): ReactElement | null;
    displayName?: string;
  }
  export interface ComponentClass<P = Record<string, unknown>, S = unknown> {
    new(props: P): Component<P, S>;
  }
  export abstract class Component<P = Record<string, unknown>, S = Record<string, unknown>> {
    props: Readonly<P>;
    state: Readonly<S>;
    setState(updater: Partial<S> | ((prev: S, props: P) => Partial<S>), callback?: () => void): void;
    forceUpdate(callback?: () => void): void;
    render(): ReactNode;
    static getDerivedStateFromError?(error: Error): unknown;
    componentDidMount?(): void;
    componentDidUpdate?(prevProps: Readonly<P>, prevState: Readonly<S>): void;
    componentWillUnmount?(): void;
    componentDidCatch?(error: Error, info: ErrorInfo): void;
  }
  export interface ErrorInfo {
    componentStack: string;
  }
  export function createElement(type: unknown, props?: unknown, ...children: ReactNode[]): ReactElement;
  export function useRef<T>(initialValue: T): { current: T };
  export function useRef<T = unknown>(initialValue?: T | null): { current: T | null };
  export function useState<T>(initialValue: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: unknown[]): T; // eslint-disable-line @typescript-eslint/no-explicit-any
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useContext<T>(context: Context<T>): T;
  export function createContext<T>(defaultValue: T): Context<T>;
  export interface Context<T> {
    Provider: ComponentType<{ value: T; children?: ReactNode }>;
    Consumer: ComponentType<{ children: (value: T) => ReactNode }>;
  }
  export function memo<T extends ComponentType<unknown>>(component: T): T;
  // ComponentProps — extracts the props type from a ComponentType
  export type ComponentProps<T extends ComponentType<any>> = T extends ComponentType<infer P> ? P : never; // eslint-disable-line @typescript-eslint/no-explicit-any
  export namespace JSX {
    interface Element extends ReactElement {}
    interface IntrinsicAttributes { key?: string | number | null }
    // Tells TypeScript that JSX children between tags are passed as the 'children' prop
    interface ElementChildrenAttribute { children: unknown }
  }
}

declare module 'react-native' {
  import { ComponentType, ReactNode } from 'react';
  export interface ViewStyle { [key: string]: unknown }
  export interface TextStyle { [key: string]: unknown }
  export interface ImageStyle { [key: string]: unknown }
  // StyleProp allows arrays (including nested), conditional (false/null/undefined) entries
  export type StyleProp<T> = T | (T | StyleProp<T> | false | null | undefined)[] | false | null | undefined;
  export interface LayoutChangeEvent { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }
  export interface GestureResponderEvent {}
  export const View: ComponentType<{ style?: StyleProp<ViewStyle>; children?: ReactNode; [key: string]: unknown }>;
  export const Text: ComponentType<{ style?: StyleProp<TextStyle>; children?: ReactNode; [key: string]: unknown }>;
  export const TextInput: ComponentType<{ value?: string; onChangeText?: (text: string) => void; style?: StyleProp<TextStyle>; [key: string]: unknown }>;
  export const TouchableOpacity: ComponentType<{ onPress?: () => void; style?: StyleProp<ViewStyle>; disabled?: boolean; children?: ReactNode; [key: string]: unknown }>;
  export const ScrollView: ComponentType<{ style?: StyleProp<ViewStyle>; contentContainerStyle?: StyleProp<ViewStyle>; children?: ReactNode; [key: string]: unknown }>;
  export const FlatList: ComponentType<{ data?: any[]; renderItem?: (info: { item: any; index: number }) => ReactElement | null; keyExtractor?: (item: any, index: number) => string; [key: string]: unknown }>; // eslint-disable-line @typescript-eslint/no-explicit-any
  export const Modal: ComponentType<{ visible?: boolean; animationType?: string; presentationStyle?: string; onRequestClose?: () => void; children?: ReactNode; [key: string]: unknown }>;
  export const ActivityIndicator: ComponentType<{ size?: 'small' | 'large'; color?: string; [key: string]: unknown }>;
  export const Switch: ComponentType<{ value?: boolean; onValueChange?: (value: boolean) => void; [key: string]: unknown }>;
  export const Image: ComponentType<{ source?: unknown; style?: StyleProp<ImageStyle>; [key: string]: unknown }>;
  export const SafeAreaView: ComponentType<{ style?: StyleProp<ViewStyle>; children?: ReactNode; [key: string]: unknown }>;
  export const StatusBar: ComponentType<{ barStyle?: string; backgroundColor?: string; [key: string]: unknown }> & {
    currentHeight?: number;
  };
  export const Animated: {
    View: ComponentType<{ style?: unknown; children?: ReactNode; [key: string]: unknown }>;
    Text: ComponentType<{ style?: unknown; children?: ReactNode; [key: string]: unknown }>;
    Value: new (value: number) => { setValue(v: number): void };
    timing(value: { setValue(v: number): void }, config: object): { start(): void; stop(): void };
    sequence(animations: unknown[]): { start(): void; stop(): void };
    loop(animation: { start(): void; stop(): void }): { start(): void; stop(): void };
  };
  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
    hairlineWidth: number;
    flatten(style: unknown): Record<string, unknown>;
    absoluteFillObject: ViewStyle;
    absoluteFill: ViewStyle;
  };
  export const Platform: { OS: 'ios' | 'android' | 'web'; select<T>(spec: { ios?: T; android?: T; web?: T; default?: T }): T };
  export const Alert: {
    alert(title: string, message?: string, buttons?: unknown[], options?: object): void;
  };
  export const RefreshControl: ComponentType<{ refreshing: boolean; onRefresh: () => void; tintColor?: string; [key: string]: unknown }>;
  export const KeyboardAvoidingView: ComponentType<{ behavior?: string; style?: StyleProp<ViewStyle>; children?: ReactNode; [key: string]: unknown }>;
  export function useColorScheme(): 'light' | 'dark' | null;
}

declare module 'expo-router' {
  import { ComponentType, ReactNode } from 'react';
  type HrefObject = { pathname: string; params?: Record<string, string | number> };
  type Href = string | HrefObject;
  export function useLocalSearchParams<T extends Record<string, string>>(): T;
  export function useRouter(): {
    push(path: Href): void;
    replace(path: Href): void;
    back(): void;
    navigate(path: Href): void;
  };
  export function useNavigation(): {
    setOptions(options: Record<string, unknown>): void;
    navigate(screen: string, params?: Record<string, unknown>): void;
    goBack(): void;
  };
  export function useSegments(): string[];
  export function useRootNavigationState(): { key?: string } | undefined;
  export const router: {
    push(path: Href): void;
    replace(path: Href): void;
    back(): void;
    navigate(path: Href): void;
  };
  export const Stack: ComponentType<{ screenOptions?: Record<string, unknown>; children?: ReactNode }> & {
    Screen: ComponentType<{ name?: string; options?: Record<string, unknown> }>;
  };
  export const Tabs: ComponentType<{ screenOptions?: Record<string, unknown>; children?: ReactNode }> & {
    Screen: ComponentType<{ name: string; options?: Record<string, unknown> }>;
  };
  export const Link: ComponentType<{ href: Href; children?: ReactNode; [key: string]: unknown }>;
  export const ErrorBoundary: ComponentType<{ children?: ReactNode; [key: string]: unknown }>;
}

declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  type IoniconsGlyphMap = Record<string, string>;
  export const Ionicons: ComponentType<{ name: string; size?: number; color?: string; style?: unknown }> & {
    glyphMap: IoniconsGlyphMap;
  };
}

declare module '@expo/vector-icons/FontAwesome' {
  import { ComponentType } from 'react';
  const FontAwesome: ComponentType<{ name?: string; size?: number; color?: string; style?: unknown }> & {
    font: Record<string, string>;
    glyphMap: Record<string, string>;
  };
  export default FontAwesome;
}

declare module 'expo-constants' {
  const Constants: {
    expoConfig?: {
      extra?: {
        eas?: { projectId?: string };
        firebaseApiKey?: string;
        firebaseAuthDomain?: string;
        firebaseProjectId?: string;
        firebaseStorageBucket?: string;
        firebaseMessagingSenderId?: string;
        firebaseIosAppId?: string;
        firebaseAndroidAppId?: string;
        [key: string]: unknown;
      };
      projectId?: string;
    };
  };
  export default Constants;
}

declare module 'expo-haptics' {
  export function impactAsync(style?: string): Promise<void>;
  export function notificationAsync(type?: string): Promise<void>;
  export const ImpactFeedbackStyle: Record<string, string>;
  export const NotificationFeedbackType: Record<string, string>;
}

declare module 'expo-font' {
  export function useFonts(map: Record<string, unknown>): [boolean, Error | null];
  export function loadAsync(map: Record<string, unknown>): Promise<void>;
  export function isLoaded(fontFamily: string): boolean;
}

declare module 'expo-splash-screen' {
  export function preventAutoHideAsync(): Promise<boolean>;
  export function hideAsync(): Promise<boolean>;
}

declare module 'expo-status-bar' {
  import { ComponentType } from 'react';
  export const StatusBar: ComponentType<{ style?: 'auto' | 'light' | 'dark'; [key: string]: unknown }>;
}

declare module 'expo-notifications' {
  export interface ExpoPushToken { data: string }
  export interface Notification { request: { content: { title?: string; body?: string; data?: Record<string, unknown> } } }
  export interface NotificationResponse { notification: Notification; actionIdentifier: string }
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<ExpoPushToken>;
  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function setNotificationHandler(handler: { handleNotification: (n: Notification) => Promise<{ shouldShowAlert: boolean; shouldPlaySound: boolean; shouldSetBadge: boolean }> }): void;
  export function addNotificationReceivedListener(listener: (n: Notification) => void): { remove(): void };
  export function addNotificationResponseReceivedListener(listener: (r: NotificationResponse) => void): { remove(): void };
  export function scheduleNotificationAsync(request: Record<string, unknown>): Promise<string>;
  export function cancelScheduledNotificationAsync(id: string): Promise<void>;
  export function setBadgeCountAsync(count: number): Promise<boolean>;
  export const AndroidImportance: Record<string, number>;
  export function setNotificationChannelAsync(id: string, channel: Record<string, unknown>): Promise<unknown>;
}

declare module 'react-native-calendars' {
  import { ComponentType } from 'react';
  export const Calendar: ComponentType<Record<string, unknown>>;
  export const CalendarList: ComponentType<Record<string, unknown>>;
}

declare module '@react-native-async-storage/async-storage' {
  const AsyncStorage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
    multiGet(keys: string[]): Promise<[string, string | null][]>;
    multiSet(keyValuePairs: [string, string][]): Promise<void>;
    clear(): Promise<void>;
    getAllKeys(): Promise<string[]>;
  };
  export default AsyncStorage;
}

declare module '@react-native-picker/picker' {
  import { ComponentType } from 'react';
  export const Picker: ComponentType<{ selectedValue?: unknown; onValueChange?: (value: unknown) => void; children?: unknown; style?: unknown }> & {
    Item: ComponentType<{ label: string; value: unknown }>;
  };
}

declare module '@react-native-community/netinfo' {
  type NetInfoState = { isConnected: boolean | null; isInternetReachable: boolean | null; type: string };
  const NetInfo: {
    addEventListener(listener: (state: NetInfoState) => void): () => void;
    fetch(): Promise<NetInfoState>;
  };
  export default NetInfo;
}

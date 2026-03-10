// types/firebase-shim.d.ts
// Ambient module shims so the codebase type-checks without node_modules.
// These are ONLY used when the real packages are absent — TypeScript
// prefers real node_modules types when they exist.

declare module 'firebase/firestore' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export interface DocumentData {
    // Using any here allows Firestore document data to be accessed without casts,
    // which is the correct behavior without real Firebase types installed.
    [key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  export interface QueryDocumentSnapshot<T = DocumentData> {
    id: string;
    data(): T;
    ref: DocumentReference<T>;
  }
  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    exists(): boolean;
    data(): T | undefined;
    ref: DocumentReference<T>;
  }
  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
  }
  export interface CollectionReference<T = DocumentData> extends Query<T> {
    id: string;
    path: string;
  }
  export interface Query<T = DocumentData> {}
  export interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach(callback: (doc: QueryDocumentSnapshot<T>) => void): void;
  }
  export type Unsubscribe = () => void;
  export type WhereFilterOp = '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'in' | 'not-in' | 'array-contains-any';
  export type OrderByDirection = 'asc' | 'desc';
  export interface Firestore {}
  export interface WriteBatch {
    set<T>(ref: DocumentReference<T>, data: Partial<T> & Record<string, unknown>, options?: { merge?: boolean; mergeFields?: string[] }): WriteBatch;
    update(ref: DocumentReference, data: Record<string, unknown>): WriteBatch;
    delete(ref: DocumentReference): WriteBatch;
    commit(): Promise<void>;
  }
  export class Timestamp {
    readonly seconds: number;
    readonly nanoseconds: number;
    constructor(seconds: number, nanoseconds: number);
    toDate(): Date;
    toMillis(): number;
    static now(): Timestamp;
    static fromDate(date: Date): Timestamp;
    static fromMillis(milliseconds: number): Timestamp;
  }
  export class FieldValue {}
  export interface QueryConstraint {}
  export function getFirestore(app?: unknown): Firestore;
  export function initializeFirestore(app: unknown, settings: Record<string, unknown>): Firestore;
  export function enableIndexedDbPersistence(db: Firestore): Promise<void>;
  export function collection(db: Firestore, path: string, ...segments: string[]): CollectionReference;
  export function doc(db: Firestore, path: string, ...segments: string[]): DocumentReference;
  export function getDoc<T = DocumentData>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
  export function getDocs<T = DocumentData>(query: Query<T>): Promise<QuerySnapshot<T>>;
  export function setDoc<T = DocumentData>(ref: DocumentReference<T>, data: Partial<T>, options?: { merge?: boolean; mergeFields?: string[] }): Promise<void>;
  export function updateDoc(ref: DocumentReference, data: Record<string, unknown>): Promise<void>;
  export function deleteDoc(ref: DocumentReference): Promise<void>;
  export function addDoc<T = DocumentData>(ref: CollectionReference<T>, data: Omit<T, 'id'>): Promise<DocumentReference<T>>;
  export function query<T = DocumentData>(q: Query<T>, ...constraints: QueryConstraint[]): Query<T>;
  export function where(field: string, op: WhereFilterOp, value: unknown): QueryConstraint;
  export function orderBy(field: string, direction?: OrderByDirection): QueryConstraint;
  export function limit(n: number): QueryConstraint;
  export function startAfter(...values: unknown[]): QueryConstraint;
  export function onSnapshot<T = DocumentData>(q: Query<T>, callback: (snapshot: QuerySnapshot<T>) => void): Unsubscribe;
  export function writeBatch(db: Firestore): WriteBatch;
  export function arrayUnion(...elements: unknown[]): FieldValue;
  export function arrayRemove(...elements: unknown[]): FieldValue;
  export function increment(n: number): FieldValue;
  export function serverTimestamp(): FieldValue;
  export function deleteField(): FieldValue;
  export class FieldPath {
    constructor(...fieldNames: string[]);
    static documentId(): FieldPath;
  }
}

declare module 'firebase/app' {
  export interface FirebaseApp {}
  export interface FirebaseOptions {
    apiKey?: string;
    authDomain?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
    appId?: string;
    measurementId?: string;
    databaseURL?: string;
  }
  export class FirebaseError extends Error {
    code: string;
    customData?: Record<string, unknown>;
  }
  export function initializeApp(options: FirebaseOptions, name?: string): FirebaseApp;
  export function getApp(name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
}

declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
  }
  export interface UserCredential {
    user: User;
  }
  export interface AdditionalUserInfo {
    isNewUser: boolean;
    providerId: string | null;
    profile?: Record<string, unknown> | null;
  }
  export interface Auth {
    currentUser: User | null;
  }
  export interface AuthCredential {}
  export interface Persistence {}
  export class EmailAuthProvider {
    static credential(email: string, password: string): AuthCredential;
  }
  export function getAuth(app?: unknown): Auth;
  export function initializeAuth(app: unknown, options?: Record<string, unknown>): Auth;
  export function getReactNativePersistence(storage: unknown): Persistence;
  export const inMemoryPersistence: Persistence;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function signOut(auth: Auth): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
  export function updateProfile(user: User, profile: { displayName?: string; photoURL?: string }): Promise<void>;
  export function onAuthStateChanged(auth: Auth, callback: (user: User | null) => void): () => void;
  export function sendEmailVerification(user: User): Promise<void>;
  export function getAdditionalUserInfo(credential: UserCredential): AdditionalUserInfo | null;
  export function deleteUser(user: User): Promise<void>;
  export function reauthenticateWithCredential(user: User, credential: AuthCredential): Promise<UserCredential>;
}

declare module 'firebase/storage' {
  export interface FirebaseStorage {}
  export interface StorageReference {
    fullPath: string;
    name: string;
  }
  export interface UploadTaskSnapshot {
    bytesTransferred: number;
    totalBytes: number;
    state: string;
    ref: StorageReference;
  }
  export interface UploadTask {
    on(
      event: string,
      next?: (snapshot: UploadTaskSnapshot) => void,
      error?: (err: Error) => void,
      complete?: () => void,
    ): void;
    snapshot: UploadTaskSnapshot;
  }
  export interface FullMetadata {
    size: number;
    contentType?: string;
    customMetadata?: Record<string, string>;
    [key: string]: unknown;
  }
  export function getStorage(app?: unknown): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path?: string): StorageReference;
  export function uploadBytesResumable(ref: StorageReference, data: Blob | Uint8Array | ArrayBuffer, metadata?: Record<string, unknown>): UploadTask;
  export function getDownloadURL(ref: StorageReference): Promise<string>;
  export function deleteObject(ref: StorageReference): Promise<void>;
  export function getMetadata(ref: StorageReference): Promise<FullMetadata>;
}

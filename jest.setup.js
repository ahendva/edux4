// jest.setup.js — Global mocks for all tests

// ─── AsyncStorage ─────────────────────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(null),
  clear: jest.fn().mockResolvedValue(null),
  getAllKeys: jest.fn().mockResolvedValue([]),
  multiGet: jest.fn().mockResolvedValue([]),
  multiSet: jest.fn().mockResolvedValue(null),
}));

// ─── Expo modules ─────────────────────────────────────────────────────────────
jest.mock('expo-constants', () => ({
  default: { expoConfig: { extra: { eas: { projectId: 'test-project-id' } } } },
  expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'ExponentPushToken[test]' }),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  },
}));

// ─── Firebase config shim ─────────────────────────────────────────────────────
jest.mock('./services/firebase/firebaseConfig', () => ({
  app: {},
  auth: { currentUser: null, onAuthStateChanged: jest.fn() },
  firestore: {},
  storage: {},
}));

// ─── Firebase Firestore ───────────────────────────────────────────────────────
// Variables inside jest.mock() factories MUST start with 'mock' (Jest requirement)
jest.mock('firebase/firestore', () => {
  const mockStore = {};
  let mockDocIdCounter = 1;

  const mockMakeRef = (path) => ({ path, id: path.split('/').pop() });

  // Expose store operations to tests via global so tests can seed and inspect data
  global.__firestoreMock = {
    reset: () => { Object.keys(mockStore).forEach((k) => delete mockStore[k]); },
    setDoc: (path, data) => { mockStore[path] = { ...data }; },
    getDoc: (path) => mockStore[path] ?? null,
  };

  return {
    collection: jest.fn((_db, ...segs) => segs.join('/')),
    doc: jest.fn((_db, ...segs) => mockMakeRef(segs.join('/'))),
    query: jest.fn((ref, ...constraints) => ({ ref, constraints })),
    where: jest.fn((field, op, value) => ({ type: 'where', field, op, value })),
    orderBy: jest.fn((field, dir) => ({ type: 'orderBy', field, dir })),
    limit: jest.fn((n) => ({ type: 'limit', n })),
    arrayUnion: jest.fn((...items) => ({ __arrayUnion: items })),
    arrayRemove: jest.fn((...items) => ({ __arrayRemove: items })),

    addDoc: jest.fn(async (collPath, data) => {
      const id = `mock-id-${mockDocIdCounter++}`;
      mockStore[`${collPath}/${id}`] = { ...data };
      return { id };
    }),
    setDoc: jest.fn(async (ref, data, opts) => {
      mockStore[ref.path] = opts && opts.merge
        ? Object.assign({}, mockStore[ref.path] || {}, data)
        : { ...data };
    }),
    updateDoc: jest.fn(async (ref, updates) => {
      mockStore[ref.path] = Object.assign({}, mockStore[ref.path] || {}, updates);
    }),
    deleteDoc: jest.fn(async (ref) => { delete mockStore[ref.path]; }),

    getDoc: jest.fn(async (ref) => {
      const data = mockStore[ref.path];
      return {
        id: ref.id,
        exists: () => data !== undefined,
        data: () => data,
      };
    }),
    getDocs: jest.fn(async (q) => {
      const collPath = typeof q === 'string' ? q : (q && q.ref);
      const prefix = collPath + '/';
      const docs = Object.entries(mockStore)
        .filter(([k]) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
        .map(([k, v]) => ({ id: k.slice(prefix.length), data: () => v }));
      return { docs, empty: docs.length === 0, size: docs.length };
    }),

    onSnapshot: jest.fn((q, callback) => {
      const collPath = typeof q === 'string' ? q : (q && q.ref);
      const prefix = collPath + '/';
      const docs = Object.entries(mockStore)
        .filter(([k]) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
        .map(([k, v]) => ({ id: k.slice(prefix.length), data: () => v }));
      if (typeof callback === 'function') callback({ docs, empty: docs.length === 0, size: docs.length });
      return jest.fn();
    }),

    writeBatch: jest.fn(() => ({
      set: jest.fn(),
      update: jest.fn(async (ref, data) => {
        mockStore[ref.path] = Object.assign({}, mockStore[ref.path] || {}, data);
      }),
      delete: jest.fn(),
      commit: jest.fn().mockResolvedValue(undefined),
    })),

    getFirestore: jest.fn(() => ({})),
    initializeFirestore: jest.fn(() => ({})),
    enableIndexedDbPersistence: jest.fn().mockResolvedValue(undefined),
  };
});

// ─── Firebase Auth ─────────────────────────────────────────────────────────────
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  initializeAuth: jest.fn(() => ({})),
  getReactNativePersistence: jest.fn(),
  inMemoryPersistence: {},
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn().mockResolvedValue(undefined),
  deleteUser: jest.fn().mockResolvedValue(undefined),
  EmailAuthProvider: { credential: jest.fn() },
  reauthenticateWithCredential: jest.fn().mockResolvedValue(undefined),
}));

// ─── Firebase Storage ──────────────────────────────────────────────────────────
jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({ ref: {} }),
  uploadBytesResumable: jest.fn(() => ({ on: jest.fn(), snapshot: { bytesTransferred: 0, totalBytes: 100 } })),
  getDownloadURL: jest.fn().mockResolvedValue('https://storage.example.com/file.jpg'),
  deleteObject: jest.fn().mockResolvedValue(undefined),
  getMetadata: jest.fn().mockResolvedValue({ size: 1024 }),
}));

// ─── Firebase App ──────────────────────────────────────────────────────────────
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({})),
}));



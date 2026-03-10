// services/firebase/firebaseConfig.ts
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  inMemoryPersistence,
  Auth,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extra = Constants.expoConfig?.extra ?? {};

const firebaseConfig = Platform.OS === 'ios'
  ? {
      apiKey: extra.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
      authDomain: extra.firebaseAuthDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
      projectId: extra.firebaseProjectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      storageBucket: extra.firebaseStorageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
      messagingSenderId: extra.firebaseMessagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: extra.firebaseIosAppId ?? process.env.EXPO_PUBLIC_FIREBASE_IOS_APP_ID ?? "",
    }
  : {
      apiKey: extra.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
      authDomain: extra.firebaseAuthDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
      projectId: extra.firebaseProjectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      storageBucket: extra.firebaseStorageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
      messagingSenderId: extra.firebaseMessagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
      appId: extra.firebaseAndroidAppId ?? process.env.EXPO_PUBLIC_FIREBASE_ANDROID_APP_ID ?? "",
    };

if (!firebaseConfig.projectId) {
  throw new Error(
    '[Firebase] projectId is missing. Copy .env.example to .env and fill in your Firebase credentials, ' +
    'then set them in app.json "extra" or as EXPO_PUBLIC_* environment variables.'
  );
}

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

const authPersistence =
  Platform.OS === 'web'
    ? inMemoryPersistence
    : getReactNativePersistence(AsyncStorage);

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, { persistence: authPersistence });
  firestore = getFirestore(app);
} else {
  app = getApp();
  auth = getAuth(app);
  firestore = getFirestore(app);
}

export const storage = getStorage(app);
export { app, auth, firestore };

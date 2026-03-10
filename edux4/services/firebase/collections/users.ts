// services/firebase/collections/users.ts
import { firestore } from '../firebaseConfig';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { UserProfile, UserRole } from '../schema';

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return null;

    const data = userSnap.data();
    return {
      id: userId,
      username: data.username || '',
      displayName: data.displayName || '',
      email: data.email || '',
      role: data.role || 'parent',
      language: data.language || 'en',
      children: data.children || [],
      connections: data.connections || [],
      classrooms: data.classrooms || [],
      profilePictureUrl: data.profilePictureUrl || null,
      bio: data.bio || '',
      lastLoginDate: data.lastLoginDate || Date.now(),
      psStaffId: data.psStaffId,
      psGuardianId: data.psGuardianId,
      settings: data.settings || { darkMode: false },
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw new Error(`Failed to get user profile: ${(error as Error).message}`);
  }
};

export const initializeUserProfile = async (
  userId: string,
  displayName: string,
  email: string,
  username: string,
  role: UserRole = 'parent',
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const now = Date.now();

    await setDoc(userRef, {
      username,
      displayName,
      email,
      role,
      language: 'en',
      children: [],
      connections: [],
      classrooms: [],
      profilePictureUrl: null,
      bio: '',
      lastLoginDate: now,
      settings: {
        darkMode: false,
        notificationPreferences: {
          newMessages: true,
          eventReminders: true,
          reportPublished: true,
          connectionRequests: true,
          announcements: true,
        },
      },
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error initializing user profile:', error);
    throw new Error(`Failed to initialize user profile: ${(error as Error).message}`);
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Partial<UserProfile>,
): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { ...updates, updatedAt: Date.now() });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${(error as Error).message}`);
  }
};

export const logUserLogin = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, { lastLoginDate: Date.now() });
  } catch (error) {
    console.error('Failed to log user login:', error);
  }
};

export const isUsernameTaken = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
};

export const addConnection = async (userId: string, connectionId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const connRef = doc(firestore, 'users', connectionId);
  await updateDoc(userRef, { connections: arrayUnion(connectionId) });
  await updateDoc(connRef, { connections: arrayUnion(userId) });
};

export const removeConnection = async (userId: string, connectionId: string): Promise<void> => {
  const userRef = doc(firestore, 'users', userId);
  const connRef = doc(firestore, 'users', connectionId);
  await updateDoc(userRef, { connections: arrayRemove(connectionId) });
  await updateDoc(connRef, { connections: arrayRemove(userId) });
};

export const getUsersByRole = async (role: UserRole): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
  } catch (error) {
    console.error('Error getting users by role:', error);
    return [];
  }
};

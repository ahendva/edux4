// services/firebase/authService.ts
import { auth } from './firebaseConfig';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  sendEmailVerification,
  User,
  UserCredential,
  getAdditionalUserInfo
} from 'firebase/auth';
import { initializeUserProfile, logUserLogin } from './collections/users';
import { UserRole } from './schema';

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  username: string,
  role: UserRole = 'parent',
  language = 'en',
): Promise<User> => {
  try {
    if (!email || !password || !displayName || !username) {
      throw new Error('Email, password, display name, and username are required');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });
    await sendEmailVerification(user);
    await initializeUserProfile(user.uid, displayName, email, username, role, language);

    return user;
  } catch (error) {
    const errorCode = (error as { code?: string })?.code ?? '';

    if (errorCode === 'auth/email-already-in-use') {
      throw new Error('This email is already in use. Please try a different one or sign in.');
    } else if (errorCode === 'auth/invalid-email') {
      throw new Error('The email address is not valid.');
    } else if (errorCode === 'auth/weak-password') {
      throw new Error('Password is too weak. Please use a stronger password.');
    }

    throw error;
  }
};

export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    try {
      await logUserLogin(user.uid);
    } catch (error) {
      console.error('Failed to log user login:', error);
    }

    return user;
  } catch (error) {
    const errorCode = (error as { code?: string })?.code ?? '';

    if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
      throw new Error('Invalid email or password. Please try again.');
    } else if (errorCode === 'auth/invalid-email') {
      throw new Error('The email address is not valid.');
    } else if (errorCode === 'auth/user-disabled') {
      throw new Error('This account has been disabled. Please contact support.');
    } else if (errorCode === 'auth/too-many-requests') {
      throw new Error('Too many unsuccessful login attempts. Please try again later or reset your password.');
    }

    throw error;
  }
};

export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw new Error(`Failed to sign out: ${(error as Error).message}`);
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }

    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    const errorCode = (error as { code?: string })?.code ?? '';

    if (errorCode === 'auth/invalid-email') {
      throw error;
    }
    if (errorCode === 'auth/user-not-found') {
      return;
    }

    throw error;
  }
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

export const sendVerificationEmail = async (): Promise<void> => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently signed in');
    }

    await sendEmailVerification(user);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${(error as Error).message}`);
  }
};

export const updateUserAuthProfile = async (
  updates: { displayName?: string; photoURL?: string }
): Promise<void> => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error('No user is currently signed in');
    }

    await updateProfile(user, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error(`Failed to update user profile: ${(error as Error).message}`);
  }
};

export const isNewUser = (userCredential: UserCredential): boolean => {
  const additionalInfo = getAdditionalUserInfo(userCredential);
  return !!additionalInfo?.isNewUser;
};

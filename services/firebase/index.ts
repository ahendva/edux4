// services/firebase/index.ts
export * from './firebaseConfig';
export * from './schema';

export {
  signUp,
  signIn,
  logOut,
  resetPassword,
  getCurrentUser,
  subscribeToAuthChanges,
  sendVerificationEmail,
  isNewUser,
} from './authService';

export * from './collections/users';
export * from './collections/classrooms';
export * from './collections/conversations';
export * from './collections/messages';
export * from './collections/events';
export * from './collections/announcements';
export * from './collections/connections';
export * from './collections/progressReports';

export * from './firebaseDebug';

export const checkConnectivity = async (): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
    return navigator.onLine;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    await fetch('https://www.google.com', { method: 'HEAD', signal: controller.signal });
    clearTimeout(timeoutId);
    return true;
  } catch {
    return false;
  }
};

export const safeFirebaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback: T | null = null,
): Promise<T | null> => {
  try {
    return await Promise.race([
      operation(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timed out')), 10000),
      ),
    ]);
  } catch (error) {
    console.error('Firebase operation failed:', error);
    return fallback;
  }
};

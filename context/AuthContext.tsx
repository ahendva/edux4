// context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from 'firebase/auth';
import NetInfo from '@react-native-community/netinfo';
import {
  signUp,
  signIn,
  logOut,
  resetPassword,
  subscribeToAuthChanges,
  sendVerificationEmail,
  updateUserAuthProfile
} from '../services/firebase/authService';
import {
  getUserProfile,
  updateUserProfile,
  logUserLogin
} from '../services/firebase/collections/users';
import { View, ActivityIndicator } from 'react-native';
import { UserProfile, UserRole } from '../services/firebase/schema';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  /** True when the current user has role === 'admin' */
  isAdmin: boolean;
  /** True when device has no network connection */
  isOffline: boolean;
  /** ISO 639-1 language code from the user's profile, defaults to 'en' */
  userLanguage: string;
  signUp: (email: string, password: string, displayName: string, username: string, role?: UserRole, language?: string) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Track network connectivity
  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setIsOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  const refreshUserProfile = async () => {
    if (user) {
      try {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (authUser) => {
      setUser(authUser);

      if (authUser) {
        try {
          const profile = await getUserProfile(authUser.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
      if (initializing) setInitializing(false);
    });

    return () => unsubscribe();
  }, [initializing]);

  const isAdmin = userProfile?.role === 'admin';
  const userLanguage = userProfile?.language || 'en';

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isAdmin,
    isOffline,
    userLanguage,
    signUp: async (email, password, displayName, username, role = 'parent', language) => {
      const newUser = await signUp(email, password, displayName, username, role, language);
      await logUserLogin(newUser.uid);
      await refreshUserProfile();
      return newUser;
    },
    signIn: async (email, password) => {
      const loggedInUser = await signIn(email, password);
      await refreshUserProfile();
      return loggedInUser;
    },
    logOut: async () => {
      await logOut();
    },
    resetPassword: async (email) => {
      await resetPassword(email);
    },
    sendVerificationEmail: async () => {
      await sendVerificationEmail();
    },
    updateProfile: async (updates) => {
      if (!user) throw new Error('No user is currently signed in');
      await updateUserProfile(user.uid, updates);
      if (updates.displayName) {
        await updateUserAuthProfile({ displayName: updates.displayName });
      }
      await refreshUserProfile();
    },
    refreshUserProfile,
  };

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}>
        <ActivityIndicator size="large" color="#1565C0" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

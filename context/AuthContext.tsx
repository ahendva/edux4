// context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from 'firebase/auth';
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
  signUp: (email: string, password: string, displayName: string, username: string, role?: UserRole) => Promise<User>;
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
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setUser(user);

      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
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

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    signUp: async (email, password, displayName, username, role = 'parent') => {
      const user = await signUp(email, password, displayName, username, role);
      await logUserLogin(user.uid);
      await refreshUserProfile();
      return user;
    },
    signIn: async (email, password) => {
      const user = await signIn(email, password);
      await refreshUserProfile();
      return user;
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

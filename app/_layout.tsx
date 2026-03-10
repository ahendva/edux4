// app/_layout.tsx
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { createHeaderOptions } from '../styles/headerStyles';
import { useStyles, FONTS } from '../styles';
import { initMonitoring, setUserContext, clearUserContext } from '../services/monitoring';
import OfflineBanner from '../components/ui/OfflineBanner';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

function AuthRedirect() {
  const segments = useSegments();
  const { user, loading } = useAuth();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (user) {
      setUserContext(user.uid, user.displayName ?? undefined);
    } else {
      clearUserContext();
    }
  }, [user]);

  useEffect(() => {
    if (!navigationState?.key || loading) return;

    const inAuthGroup = segments[0] === 'auth';
    const currentPath = segments.join('/');
    const isEditProfileScreen = currentPath === 'auth/edit-profile';

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup && !isEditProfileScreen) {
      router.replace('/(tabs)');
    }
  }, [user, segments, loading, navigationState?.key]);

  return null;
}

function AppWithTheme() {
  const { colors, barStyle } = useTheme();
  const defaultHeaderOptions = createHeaderOptions(colors);

  return (
    <>
      <AuthRedirect />
      <StatusBar barStyle={barStyle} />
      <OfflineBanner />
      <Stack screenOptions={{ ...defaultHeaderOptions, headerShown: true }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="messages" options={{ headerShown: false }} />
        <Stack.Screen name="classrooms" options={{ headerShown: false }} />
        <Stack.Screen name="events" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="connections" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

function AppWithProviders() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  useEffect(() => {
    initMonitoring();
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <AppWithProviders />;
}

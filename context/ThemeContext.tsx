// context/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { getUserProfile } from '../services/firebase/collections/users';
import Colors from '../constants/Colors';
import { createTypography } from '../styles/typography';

type ColorScheme = 'basic' | 'pro';
type ThemeMode = 'light' | 'dark';

interface ThemeColors {
  primaryheader: string;
  primary: string;
  primaryLight: string;
  onPrimary: string;
  accent: string;
  onAccent: string;
  success: string;
  onSuccess: string;
  warning: string;
  onWarning: string;
  danger: string;
  onDanger: string;
  error: string;
  text: string;
  textSubtle: string;
  placeholder: string;
  background: string;
  surface: string;
  surfaceSubtle: string;
  onSurface: string;
  card: string;
  border: string;
  gray: string;
  lightGray: string;
  darkGray: string;
  infoBackground: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  [key: string]: string | undefined;
}

interface ThemeContextType {
  scheme: ColorScheme;
  mode: ThemeMode;
  colors: ThemeColors;
  typography: ReturnType<typeof createTypography>;
  barStyle: 'light-content' | 'dark-content';
  toggleMode: () => Promise<void>;
  setSchemeAndSave: (scheme: ColorScheme) => Promise<void>;
  setModeAndSave: (mode: ThemeMode) => Promise<void>;
  isDarkMode: boolean;
}

const defaultTypography = createTypography();

const ThemeContext = createContext<ThemeContextType>({
  scheme: 'basic',
  mode: 'light',
  colors: Colors.basic.light as ThemeColors,
  typography: defaultTypography,
  barStyle: 'dark-content',
  toggleMode: async () => {},
  setSchemeAndSave: async () => {},
  setModeAndSave: async () => {},
  isDarkMode: false,
});

export const useTheme = () => useContext(ThemeContext);
export const useAppTheme = () => useTheme();

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const systemColorScheme = useColorScheme();
  const [scheme, setScheme] = useState<ColorScheme>('basic');
  const [mode, setMode] = useState<ThemeMode>(systemColorScheme === 'dark' ? 'dark' : 'light');

  const colors = Colors[scheme as ColorScheme][mode as ThemeMode] as ThemeColors;
  const typography = createTypography();
  const barStyle = mode === 'light' ? 'dark-content' : 'light-content';

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedScheme = await AsyncStorage.getItem('colorScheme');
        if (storedScheme) setScheme(storedScheme as ColorScheme);

        const storedMode = await AsyncStorage.getItem('themeMode');
        if (storedMode) setMode(storedMode as ThemeMode);

        if (user) {
          try {
            const profile = await getUserProfile(user.uid);
            const profileScheme = profile?.settings?.colorScheme;
            if (profileScheme === 'basic' || profileScheme === 'pro') {
              setScheme(profileScheme);
              await AsyncStorage.setItem('colorScheme', profileScheme);
            }
            const profileMode = profile?.settings?.themeMode;
            if (profileMode === 'light' || profileMode === 'dark') {
              setMode(profileMode);
              await AsyncStorage.setItem('themeMode', profileMode);
            }
          } catch (error) {
            // Profile not found yet, use defaults
          }
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, [user]);

  const toggleMode = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    await setModeAndSave(newMode);
  };

  const setSchemeAndSave = async (newScheme: ColorScheme) => {
    setScheme(newScheme);
    await AsyncStorage.setItem('colorScheme', newScheme);
  };

  const setModeAndSave = async (newMode: ThemeMode) => {
    setMode(newMode);
    await AsyncStorage.setItem('themeMode', newMode);
  };

  return (
    <ThemeContext.Provider value={{ scheme, mode, colors, typography, barStyle, toggleMode, setSchemeAndSave, setModeAndSave, isDarkMode: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

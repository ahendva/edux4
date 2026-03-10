// app/auth/_layout.tsx
import { Stack, router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../../context/ThemeContext';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colors.primaryheader },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: 'bold' },
      headerTitleAlign: 'left',
      animation: 'slide_from_right',
      headerShown: true,
    }}>
      <StatusBar style="dark" />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <Stack.Screen name="delete-account" options={{ title: 'Delete Account' }} />
    </Stack>
  );
}

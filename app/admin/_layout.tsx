// app/admin/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function AdminLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="sync-status" options={{ title: 'Sync Dashboard' }} />
      <Stack.Screen name="link-parents" options={{ title: 'Link Parents' }} />
    </Stack>
  );
}

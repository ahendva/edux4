// app/reports/_layout.tsx — Stack navigator for progress report screens
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ReportsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Progress Report' }} />
      <Stack.Screen name="create" options={{ title: 'Create Report', presentation: 'modal' }} />
    </Stack>
  );
}

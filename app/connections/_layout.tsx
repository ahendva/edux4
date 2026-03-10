// app/connections/_layout.tsx — Stack navigator for connection screens
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ConnectionsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Connections' }} />
      <Stack.Screen name="requests" options={{ title: 'Connection Requests' }} />
      <Stack.Screen name="search" options={{ title: 'Find People' }} />
      <Stack.Screen name="[id]" options={{ title: 'Profile' }} />
    </Stack>
  );
}

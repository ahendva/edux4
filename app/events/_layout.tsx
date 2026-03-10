// app/events/_layout.tsx — Stack navigator for event screens
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function EventsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Event' }} />
      <Stack.Screen name="create" options={{ title: 'Create Event', presentation: 'modal' }} />
    </Stack>
  );
}

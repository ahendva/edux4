// app/messages/_layout.tsx — Stack navigator for message screens
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function MessagesLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="[id]" options={{ title: 'Conversation' }} />
      <Stack.Screen name="new" options={{ title: 'New Message', presentation: 'modal' }} />
    </Stack>
  );
}

// app/classrooms/_layout.tsx — Stack navigator for classroom screens
import { Stack } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';

export default function ClassroomsLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Classrooms' }} />
      <Stack.Screen name="create" options={{ title: 'Create Classroom', presentation: 'modal' }} />
      <Stack.Screen name="[id]" options={{ title: 'Classroom' }} />
      <Stack.Screen name="[id]/admin" options={{ title: 'Admin Panel' }} />
      <Stack.Screen name="[id]/manage" options={{ title: 'Edit Classroom', presentation: 'modal' }} />
      <Stack.Screen name="[id]/students/[studentId]" options={{ title: 'Student Detail' }} />
    </Stack>
  );
}

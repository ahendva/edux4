// app/+not-found.tsx
import { Stack, useRouter } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <View style={styles.container}>
        <Ionicons name="school-outline" size={64} color="#78909C" style={styles.icon} />
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          The screen you're looking for doesn't exist or has been moved.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')} accessibilityRole="button">
          <Ionicons name="home-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button">
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F5F7FA' },
  icon: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#212121', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#78909C', textAlign: 'center', marginBottom: 32, maxWidth: 280, lineHeight: 22 },
  button: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1565C0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, gap: 8, marginBottom: 12 },
  buttonText: { color: '#ffffff', fontWeight: '600', fontSize: 16 },
  backButton: { paddingVertical: 12, paddingHorizontal: 24 },
  backButtonText: { color: '#78909C', fontSize: 15 },
});

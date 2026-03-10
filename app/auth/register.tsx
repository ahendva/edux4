// app/auth/register.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { isUsernameTaken } from '../../services/firebase/collections/users';
import { UserRole } from '../../services/firebase/schema';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, user } = useAuth();
  const { colors, barStyle } = useTheme();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) router.replace('/(tabs)');
  }, [user]);

  if (user) return null;

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !username) {
      Alert.alert('Missing Fields', 'Please fill out all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak Password', 'Password should be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const taken = await isUsernameTaken(username.toLowerCase());
      if (taken) {
        Alert.alert('Username Taken', 'Please choose a different username.');
        setLoading(false);
        return;
      }

      // Detect device locale — extract ISO 639-1 language code (first 2 chars)
      const deviceLang = (Intl.DateTimeFormat().resolvedOptions().locale || 'en').slice(0, 2).toLowerCase();
      await signUp(email, password, name, username.toLowerCase(), role, deviceLang);
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Failed to create an account. Please try again.';
      if (error.code === 'auth/email-already-in-use') message = 'This email is already in use.';
      else if (error.code === 'auth/invalid-email') message = 'Invalid email address format.';
      else if (error.code === 'auth/weak-password') message = 'Password is too weak.';
      Alert.alert('Registration Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Ionicons name="school" size={48} color={colors.primary} />
            <Text style={[styles.logo, { color: colors.primary }]}>EduX4</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

            {/* Role Picker */}
            <Text style={[styles.roleLabel, { color: colors.textSubtle }]}>I am a:</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[styles.roleButton, { borderColor: colors.primary, backgroundColor: role === 'parent' ? colors.primary : 'transparent' }]}
                onPress={() => setRole('parent')}
              >
                <Ionicons name="people-outline" size={18} color={role === 'parent' ? '#fff' : colors.primary} />
                <Text style={[styles.roleText, { color: role === 'parent' ? '#fff' : colors.primary }]}>Parent</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.roleButton, { borderColor: colors.primary, backgroundColor: role === 'teacher' ? colors.primary : 'transparent' }]}
                onPress={() => setRole('teacher')}
              >
                <Ionicons name="book-outline" size={18} color={role === 'teacher' ? '#fff' : colors.primary} />
                <Text style={[styles.roleText, { color: role === 'teacher' ? '#fff' : colors.primary }]}>Teacher</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="person-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Full Name" placeholderTextColor={colors.gray} value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="at-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Username" placeholderTextColor={colors.gray} value={username} onChangeText={setUsername} autoCapitalize="none" autoComplete="username" />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="mail-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Email" placeholderTextColor={colors.gray} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Password" placeholderTextColor={colors.gray} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
              <TouchableOpacity style={styles.showPasswordButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Confirm Password" placeholderTextColor={colors.gray} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} />
            </View>

            <TouchableOpacity style={[styles.registerButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerButtonText}>Create Account</Text>}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.gray }]}>Already have an account? </Text>
              <Link href="/auth/login" asChild>
                <TouchableOpacity><Text style={[styles.loginLink, { color: colors.primary }]}>Login</Text></TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 20 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 10 },
  headerContainer: { alignItems: 'center', marginVertical: 20 },
  logo: { fontSize: 36, fontWeight: 'bold', marginTop: 8 },
  formContainer: { borderRadius: 16, padding: 24, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  roleLabel: { fontSize: 14, marginBottom: 8, textAlign: 'center' },
  roleRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 20 },
  roleButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1.5, gap: 6 },
  roleText: { fontSize: 15, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 16, height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  showPasswordButton: { padding: 8 },
  registerButton: { borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  registerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: 'bold' },
});

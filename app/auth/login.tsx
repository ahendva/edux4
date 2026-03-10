// app/auth/login.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { colors, barStyle } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      let message = 'Failed to sign in. Please check your credentials.';
      if (error.code === 'auth/invalid-email') message = 'Invalid email address format.';
      else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential')
        message = 'Invalid email or password. Please try again.';
      else if (error.code === 'auth/too-many-requests') message = 'Too many attempts. Please wait and try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.headerContainer}>
            <Ionicons name="school" size={64} color={colors.primary} />
            <Text style={[styles.logo, { color: colors.primary }]}>EduX4</Text>
            <Text style={[styles.tagline, { color: colors.gray }]}>Parent-Teacher Hub</Text>
          </View>

          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            <Text style={[styles.title, { color: colors.text }]}>Login</Text>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="mail-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Email" placeholderTextColor={colors.gray} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            </View>

            <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
              <Ionicons name="lock-closed-outline" size={22} color={colors.gray} style={styles.inputIcon} />
              <TextInput style={[styles.input, { color: colors.text }]} placeholder="Password" placeholderTextColor={colors.gray} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="password" />
              <TouchableOpacity style={styles.showPasswordButton} onPress={() => setShowPassword(!showPassword)}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <Link href="/auth/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPasswordLink}>
                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>

            <TouchableOpacity style={[styles.loginButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginButtonText}>Login</Text>}
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: colors.gray }]}>Don't have an account? </Text>
              <Link href="/auth/register" asChild>
                <TouchableOpacity><Text style={[styles.signupLink, { color: colors.primary }]}>Sign Up</Text></TouchableOpacity>
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
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  headerContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 40, fontWeight: 'bold', marginTop: 8 },
  tagline: { fontSize: 16, marginTop: 4 },
  formContainer: { borderRadius: 16, padding: 24, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 16, height: 56, paddingHorizontal: 16 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  showPasswordButton: { padding: 8 },
  forgotPasswordLink: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotPasswordText: { fontSize: 14 },
  loginButton: { borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center' },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14 },
  signupLink: { fontSize: 14, fontWeight: 'bold' },
});

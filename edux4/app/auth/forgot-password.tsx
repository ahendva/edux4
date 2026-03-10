// app/auth/forgot-password.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resetPassword } from '../../services/firebase/authService';
import { useTheme } from '../../context/ThemeContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, barStyle } = useTheme();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Missing Email', 'Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        Alert.alert('Invalid Email', 'Please enter a valid email address format.');
        setLoading(false);
        return;
      }
    } finally {
      setLoading(false);
    }
    setResetSent(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={barStyle} backgroundColor={colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.contentContainer}>
            <Ionicons name="lock-open-outline" size={80} color={colors.primary} style={styles.icon} />
            <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>

            {resetSent ? (
              <View style={styles.successContainer}>
                <Text style={[styles.successText, { color: colors.text }]}>
                  Password reset email sent! Check your inbox and follow the instructions.
                </Text>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/auth/login')}>
                  <Text style={styles.actionButtonText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.description, { color: colors.gray }]}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={22} color={colors.gray} style={styles.inputIcon} />
                  <TextInput style={[styles.input, { color: colors.text }]} placeholder="Email" placeholderTextColor={colors.gray} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
                </View>
                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]} onPress={handleResetPassword} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionButtonText}>Send Reset Link</Text>}
                </TouchableOpacity>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity style={styles.cancelButton}>
                    <Text style={[styles.cancelButtonText, { color: colors.gray }]}>Cancel</Text>
                  </TouchableOpacity>
                </Link>
              </>
            )}
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
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start', marginBottom: 20 },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  icon: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  description: { fontSize: 16, textAlign: 'center', marginBottom: 32, maxWidth: '80%' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 24, height: 56, paddingHorizontal: 16, width: '100%', maxWidth: 320, borderWidth: 1 },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16 },
  actionButton: { borderRadius: 12, height: 56, justifyContent: 'center', alignItems: 'center', width: '100%', maxWidth: 320 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { paddingVertical: 16, marginTop: 8 },
  cancelButtonText: { fontSize: 16 },
  successContainer: { alignItems: 'center', paddingHorizontal: 20 },
  successText: { fontSize: 16, textAlign: 'center', marginBottom: 32, lineHeight: 24 },
});

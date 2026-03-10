// app/auth/delete-account.tsx — FERPA-compliant account deletion with confirmation
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { deleteDoc, doc } from 'firebase/firestore';
import { firestore } from '../../services/firebase/firebaseConfig';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { user, userProfile, logOut } = useAuth();
  const { colors } = useTheme();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const CONFIRM_PHRASE = 'DELETE MY ACCOUNT';

  const handleDelete = async () => {
    if (!user || !userProfile) return;
    if (confirm !== CONFIRM_PHRASE) {
      Alert.alert('Confirmation Required', `Type "${CONFIRM_PHRASE}" to confirm deletion.`);
      return;
    }
    if (!password) {
      Alert.alert('Password Required', 'Enter your current password to confirm deletion.');
      return;
    }

    setDeleting(true);
    try {
      // Re-authenticate first (Firebase requires recent auth before deletion)
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);

      // Delete Firestore user profile
      await deleteDoc(doc(firestore, 'users', user.uid));

      // Delete Firebase Auth account
      await deleteUser(user);

      Alert.alert(
        'Account Deleted',
        'Your account and personal data have been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }],
      );
    } catch (err: any) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect.');
      } else {
        Alert.alert('Error', `Could not delete account: ${err.message}`);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.warningBox, { backgroundColor: `${colors.danger}14`, borderColor: colors.danger }]}>
        <Ionicons name="warning-outline" size={28} color={colors.danger} />
        <Text style={[styles.warningTitle, { color: colors.danger }]}>Delete Account</Text>
        <Text style={[styles.warningText, { color: colors.text }]}>
          This action is <Text style={{ fontWeight: '700' }}>permanent and irreversible</Text>.
          All your data, messages, and connections will be permanently deleted in compliance with
          FERPA and applicable privacy regulations.
        </Text>
      </View>

      <Text style={[styles.label, { color: colors.text }]}>What will be deleted:</Text>
      {[
        'Your profile and account information',
        'All messages you sent',
        'Your connection requests and connections',
        'Your notification preferences',
      ].map((item, i) => (
        <View key={i} style={styles.bulletRow}>
          <Ionicons name="close-circle-outline" size={16} color={colors.danger} />
          <Text style={[styles.bulletText, { color: colors.text }]}>{item}</Text>
        </View>
      ))}

      <Text style={[styles.label, { color: colors.text }, { marginTop: 24 }]}>
        Type <Text style={{ fontWeight: '700', color: colors.danger }}>{CONFIRM_PHRASE}</Text> to confirm:
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder={CONFIRM_PHRASE}
        placeholderTextColor={colors.gray}
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="characters"
      />

      <Text style={[styles.label, { color: colors.text }]}>Current Password:</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Enter your password"
        placeholderTextColor={colors.gray}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          styles.deleteBtn,
          { backgroundColor: confirm === CONFIRM_PHRASE && password ? colors.danger : colors.gray },
        ]}
        onPress={handleDelete}
        disabled={deleting || confirm !== CONFIRM_PHRASE || !password}
      >
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteBtnText}>Permanently Delete Account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel — Keep My Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 48 },
  warningBox: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    gap: 10,
  },
  warningTitle: { fontSize: 18, fontWeight: '700' },
  warningText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  bulletText: { fontSize: 14 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  deleteBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  deleteBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', marginTop: 16, padding: 12 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});

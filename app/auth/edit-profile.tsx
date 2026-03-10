// app/auth/edit-profile.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, Alert,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile, updateUserProfile, isUsernameTaken } from '../../services/firebase/collections/users';
import { useStyles } from '../../styles';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, resetPassword } = useAuth();
  const { colors } = useTheme();
  const { common, themed, mixins } = useStyles();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const usernameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const profile = await getUserProfile(user.uid);
      setDisplayName(profile?.displayName || user?.displayName || '');
      setUsername(profile?.username || '');
      setOriginalUsername(profile?.username || '');
      setBio(profile?.bio || '');
    } catch {
      Alert.alert('Error', 'Failed to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUsernameChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(cleaned);
    if (usernameCheckTimer.current) clearTimeout(usernameCheckTimer.current);
    if (!cleaned || cleaned === originalUsername) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    usernameCheckTimer.current = setTimeout(async () => {
      try {
        const taken = await isUsernameTaken(cleaned);
        setUsernameStatus(taken ? 'taken' : 'available');
      } catch { setUsernameStatus('idle'); }
    }, 600);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) { Alert.alert('Validation', 'Display name cannot be empty.'); return; }
    if (usernameStatus === 'taken') { Alert.alert('Username Taken', 'Choose a different username.'); return; }

    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      });
      Alert.alert('Saved', 'Profile updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[common.container, themed.bgScreen]}>
        <View style={common.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[common.loadingText, themed.textGray]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[common.container, themed.bgScreen]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={common.content} keyboardShouldPersistTaps="handled">
        <View style={[themed.themedCard, mixins.shadow.medium]}>
          <Text style={[common.sectionTitle, themed.textNormal]}>Profile Information</Text>

          <View style={common.mb3}>
            <Text style={[common.label, themed.textGray]}>Display Name *</Text>
            <TextInput style={[common.input, themed.inputBorder, themed.inputText, themed.bgLightGray]} value={displayName} onChangeText={setDisplayName} placeholder="Your name" placeholderTextColor={colors.placeholder} maxLength={50} />
          </View>

          <View style={common.mb3}>
            <Text style={[common.label, themed.textGray]}>Username *</Text>
            <TextInput style={[common.input, themed.inputBorder, themed.inputText, themed.bgLightGray, usernameStatus === 'taken' && { borderColor: colors.danger }, usernameStatus === 'available' && { borderColor: colors.success }]} value={username} onChangeText={handleUsernameChange} placeholder="your_username" placeholderTextColor={colors.placeholder} autoCapitalize="none" maxLength={30} />
            {usernameStatus === 'available' && <Text style={{ color: colors.success, fontSize: 12, marginTop: 4 }}>Username available</Text>}
            {usernameStatus === 'taken' && <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>Username taken</Text>}
          </View>

          <View style={common.mb3}>
            <Text style={[common.label, themed.textGray]}>Bio</Text>
            <TextInput style={[common.input, themed.inputBorder, themed.inputText, themed.bgLightGray, { height: 80, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} placeholder="Tell us about yourself" placeholderTextColor={colors.placeholder} multiline maxLength={200} />
          </View>

          <View style={common.mb3}>
            <Text style={[common.label, themed.textGray]}>Email</Text>
            <TextInput style={[common.input, themed.inputBorder, themed.textGray, themed.bgLightGray]} value={user?.email || ''} editable={false} />
          </View>
        </View>
      </ScrollView>

      <View style={[common.row, common.p4, { borderTopWidth: 1, borderTopColor: colors.border }]}>
        <TouchableOpacity style={[themed.secondaryButton, common.mr2, { flex: 1 }]} onPress={() => router.back()} disabled={saving}>
          <Text style={themed.secondaryButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[themed.primaryButton, { flex: 2, opacity: saving ? 0.7 : 1 }]} onPress={handleSave} disabled={saving || usernameStatus === 'taken'}>
          {saving ? <ActivityIndicator size="small" color={colors.onPrimary} /> : <Text style={themed.primaryButtonText}>Save Changes</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

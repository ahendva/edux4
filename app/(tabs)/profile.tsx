// app/(tabs)/profile.tsx — Profile & settings
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { THEME_OPTIONS } from '../../constants/Colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, logOut } = useAuth();
  const { colors, isDarkMode, toggleMode, scheme, setSchemeAndSave } = useTheme();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const roleBadge = userProfile?.role === 'teacher' ? 'Teacher' : userProfile?.role === 'admin' ? 'Admin' : 'Parent';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(userProfile?.displayName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.displayName, { color: colors.text }]}>{userProfile?.displayName || 'User'}</Text>
        <Text style={[styles.username, { color: colors.gray }]}>@{userProfile?.username || 'username'}</Text>
        <View style={[styles.rolePill, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons name={userProfile?.role === 'teacher' ? 'book' : 'people'} size={14} color={colors.primary} />
          <Text style={[styles.roleLabel, { color: colors.primary }]}>{roleBadge}</Text>
        </View>

        <TouchableOpacity style={[styles.editButton, { borderColor: colors.primary }]} onPress={() => router.push('/auth/edit-profile')}>
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.editText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>

        <TouchableOpacity style={styles.settingRow} onPress={toggleMode}>
          <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
          <Ionicons name={isDarkMode ? 'toggle' : 'toggle-outline'} size={28} color={colors.primary} />
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 16 }]}>Theme</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.themeOption, scheme === opt.key && { borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => setSchemeAndSave(opt.key as any)}
            >
              <View style={[styles.themeSwatch, { backgroundColor: isDarkMode ? opt.darkPrimary : opt.lightPrimary }]} />
              <Text style={[styles.themeName, { color: colors.text }]}>{opt.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Account */}
      <View style={[styles.settingsCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>

        <TouchableOpacity style={styles.settingRow} onPress={() => router.push('/connections/requests')}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>Connections</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.gray} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.settingLabel, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: { margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  displayName: { fontSize: 20, fontWeight: 'bold', marginTop: 12 },
  username: { fontSize: 14, marginTop: 2 },
  rolePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8, gap: 4 },
  roleLabel: { fontSize: 13, fontWeight: '600' },
  editButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16, marginTop: 16, gap: 6 },
  editText: { fontSize: 14, fontWeight: '600' },
  settingsCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  settingLabel: { flex: 1, fontSize: 15 },
  themeRow: { flexDirection: 'row', gap: 12 },
  themeOption: { alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'transparent' },
  themeSwatch: { width: 40, height: 40, borderRadius: 20 },
  themeName: { fontSize: 12, marginTop: 6, fontWeight: '500' },
});

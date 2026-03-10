// app/(tabs)/profile.tsx — Profile & settings
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { THEME_OPTIONS } from '../../constants/Colors';
import { getStudentsForParent } from '../../services/firebase/collections/students';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { Student, Classroom } from '../../services/firebase/schema';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'ar', label: 'العربية' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'ht', label: 'Kreyòl' },
  { code: 'pt', label: 'Português' },
  { code: 'fr', label: 'Français' },
  { code: 'ko', label: '한국어' },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, logOut, updateProfile } = useAuth();
  const { colors, isDarkMode, toggleMode, scheme, setSchemeAndSave } = useTheme();
  const [children, setChildren] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [showLanguages, setShowLanguages] = useState(false);

  useEffect(() => {
    if (!user || !userProfile) return;
    if (userProfile.role === 'parent') {
      getStudentsForParent(user.uid).then(setChildren).catch(console.error);
    } else if (userProfile.role === 'teacher') {
      getUserClassrooms(user.uid).then(setClassrooms).catch(console.error);
    }
  }, [user, userProfile]);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  const toggleNotif = async (key: string, current: boolean) => {
    await updateProfile({
      settings: {
        ...(userProfile?.settings || {}),
        notificationPreferences: {
          ...(userProfile?.settings?.notificationPreferences || {}),
          [key]: !current,
        },
      },
    } as Parameters<typeof updateProfile>[0]);
  };

  const setLanguage = async (code: string) => {
    await updateProfile({ language: code } as Parameters<typeof updateProfile>[0]);
    setShowLanguages(false);
  };

  const roleBadge =
    userProfile?.role === 'teacher' ? 'Teacher' : userProfile?.role === 'admin' ? 'Admin' : 'Parent';
  const notifPrefs = userProfile?.settings?.notificationPreferences;
  const currentLang = LANGUAGES.find(l => l.code === userProfile?.language) || LANGUAGES[0];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(userProfile?.displayName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.displayName, { color: colors.text }]}>
          {userProfile?.displayName || 'User'}
        </Text>
        <Text style={[styles.username, { color: colors.gray }]}>
          @{userProfile?.username || 'username'}
        </Text>
        <View style={[styles.rolePill, { backgroundColor: colors.surfaceSubtle }]}>
          <Ionicons
            name={userProfile?.role === 'teacher' ? 'book' : 'people'}
            size={14}
            color={colors.primary}
          />
          <Text style={[styles.roleLabel, { color: colors.primary }]}>{roleBadge}</Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { borderColor: colors.primary }]}
          onPress={() => router.push('/auth/edit-profile')}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.editText, { color: colors.primary }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Parent: linked children */}
      {userProfile?.role === 'parent' && children.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Children</Text>
          {children.map(child => (
            <View key={child.id} style={styles.row}>
              <Ionicons name="person" size={18} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>
                {child.firstName} {child.lastName}
                {child.grade ? ` — Grade ${child.grade}` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Teacher: classroom list */}
      {userProfile?.role === 'teacher' && classrooms.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Classrooms</Text>
          {classrooms.map(c => (
            <TouchableOpacity
              key={c.id}
              style={styles.row}
              onPress={() => router.push(`/classrooms/${c.id}`)}
            >
              <Ionicons name="school" size={18} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>{c.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.gray} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Appearance */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <TouchableOpacity style={styles.row} onPress={toggleMode}>
          <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>Dark Mode</Text>
          <Ionicons name={isDarkMode ? 'toggle' : 'toggle-outline'} size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.subTitle, { color: colors.text }]}>Theme</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.themeOption,
                scheme === opt.key && { borderColor: colors.primary, borderWidth: 2 },
              ]}
              onPress={() => setSchemeAndSave(opt.key as Parameters<typeof setSchemeAndSave>[0])}
            >
              <View
                style={[
                  styles.themeSwatch,
                  { backgroundColor: isDarkMode ? opt.darkPrimary : opt.lightPrimary },
                ]}
              />
              <Text style={[styles.themeName, { color: colors.text }]}>{opt.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Language */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Language</Text>
        <TouchableOpacity style={styles.row} onPress={() => setShowLanguages(v => !v)}>
          <Ionicons name="language" size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>{currentLang.label}</Text>
          <Ionicons
            name={showLanguages ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.gray}
          />
        </TouchableOpacity>
        {showLanguages &&
          LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.code}
              style={[styles.row, styles.langOption]}
              onPress={() => setLanguage(lang.code)}
            >
              <Text style={[styles.rowLabel, { color: colors.text }]}>{lang.label}</Text>
              {lang.code === userProfile?.language && (
                <Ionicons name="checkmark" size={18} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
      </View>

      {/* Notifications */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
        {[
          { key: 'messages', label: 'New Messages', icon: 'chatbubble-outline' },
          { key: 'announcements', label: 'Announcements', icon: 'megaphone-outline' },
          { key: 'events', label: 'Events & Reminders', icon: 'calendar-outline' },
          { key: 'reports', label: 'Progress Reports', icon: 'document-text-outline' },
          { key: 'connectionRequests', label: 'Connection Requests', icon: 'person-add-outline' },
        ].map(({ key, label, icon }) => {
          const val = notifPrefs?.[key as keyof typeof notifPrefs] ?? true;
          return (
            <View key={key} style={styles.row}>
              <Ionicons name={icon as React.ComponentProps<typeof Ionicons>['name']} size={20} color={colors.primary} />
              <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
              <Switch
                value={!!val}
                onValueChange={() => toggleNotif(key, !!val)}
                trackColor={{ false: colors.gray, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          );
        })}
      </View>

      {/* Admin section */}
      {userProfile?.role === 'admin' && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Admin</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/admin/sync-status')}>
            <Ionicons name="sync-outline" size={20} color={colors.primary} />
            <Text style={[styles.rowLabel, { color: colors.text }]}>Sync Dashboard</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.gray} />
          </TouchableOpacity>
        </View>
      )}

      {/* Account */}
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/connections/')}>
          <Ionicons name="people-outline" size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>Connections</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.gray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/connections/requests')}>
          <Ionicons name="person-add-outline" size={20} color={colors.primary} />
          <Text style={[styles.rowLabel, { color: colors.text }]}>Connection Requests</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.gray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => router.push('/auth/delete-account')}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <Text style={[styles.rowLabel, { color: colors.danger }]}>Delete Account</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.gray} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={[styles.rowLabel, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height: 32 }} />
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
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 4,
  },
  roleLabel: { fontSize: 13, fontWeight: '600' },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 6,
  },
  editText: { fontSize: 14, fontWeight: '600' },
  card: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  subTitle: { fontSize: 14, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  rowLabel: { flex: 1, fontSize: 15 },
  langOption: { paddingLeft: 32 },
  themeRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  themeOption: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  themeSwatch: { width: 40, height: 40, borderRadius: 20 },
  themeName: { fontSize: 12, marginTop: 6, fontWeight: '500' },
});

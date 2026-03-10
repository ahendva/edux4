// app/connections/[id].tsx — Connection profile: name, role, classrooms in common, message button
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile } from '../../services/firebase/collections/users';
import { removeConnection } from '../../services/firebase/collections/users';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { UserProfile, Classroom } from '../../services/firebase/schema';

export default function ConnectionProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { colors } = useTheme();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sharedClassrooms, setSharedClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const load = useCallback(async () => {
    if (!id || !user) return;
    try {
      const [p, myClassrooms, theirClassrooms] = await Promise.all([
        getUserProfile(id),
        getUserClassrooms(user.uid),
        getUserClassrooms(id),
      ]);
      setProfile(p);
      if (p) navigation.setOptions({ title: p.displayName });

      // Find classrooms in common
      const myIds = new Set(myClassrooms.map(c => c.id));
      setSharedClassrooms(theirClassrooms.filter(c => myIds.has(c.id)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const handleDisconnect = () => {
    if (!id || !user) return;
    Alert.alert('Disconnect', 'Remove this connection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setDisconnecting(true);
          try {
            await removeConnection(user.uid, id);
            await refreshUserProfile();
            router.back();
          } catch (err) {
            Alert.alert('Error', 'Could not remove connection.');
          } finally {
            setDisconnecting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>User not found.</Text>
      </View>
    );
  }

  const isConnected = userProfile?.connections.includes(id) ?? false;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Profile header */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={40} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <View style={[styles.roleBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.roleText}>{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</Text>
        </View>
        {profile.bio && (
          <Text style={styles.bio} numberOfLines={3}>{profile.bio}</Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/messages/new')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Message</Text>
        </TouchableOpacity>
        {isConnected && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={handleDisconnect}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <Ionicons name="person-remove-outline" size={20} color={colors.danger} />
            )}
            <Text style={[styles.actionLabel, { color: colors.danger }]}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Shared classrooms */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Shared Classrooms ({sharedClassrooms.length})
        </Text>
        {sharedClassrooms.length === 0 ? (
          <Text style={[styles.empty, { color: colors.gray }]}>No classrooms in common.</Text>
        ) : (
          sharedClassrooms.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[styles.classroomRow, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/classrooms/${c.id}`)}
            >
              <Ionicons name="school-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.classroomName, { color: colors.text }]}>{c.name}</Text>
                {c.subject && <Text style={[styles.classroomSub, { color: colors.gray }]}>{c.subject}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gray} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { alignItems: 'center', padding: 28, margin: 16, borderRadius: 16, gap: 8 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  displayName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  roleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bio: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 4 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, gap: 6 },
  actionLabel: { fontSize: 13, fontWeight: '500' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  empty: { fontSize: 14 },
  classroomRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 6 },
  classroomName: { fontSize: 14, fontWeight: '600' },
  classroomSub: { fontSize: 12, marginTop: 2 },
});

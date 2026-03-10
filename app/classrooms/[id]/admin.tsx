// app/classrooms/[id]/admin.tsx — Teacher admin panel: manage students, post announcements, create events
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { getClassroom } from '../../../services/firebase/collections/classrooms';
import {
  getAnnouncements,
  createAnnouncement,
  pinAnnouncement,
  deleteAnnouncement,
} from '../../../services/firebase/collections/announcements';
import { Classroom, Announcement } from '../../../services/firebase/schema';

export default function AdminPanelScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // New announcement state
  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [cls, ann] = await Promise.all([getClassroom(id), getAnnouncements(id)]);
      setClassroom(cls);
      setAnnouncements(ann);
      if (cls) navigation.setOptions({ title: `${cls.name} — Admin` });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePostAnnouncement = async () => {
    if (!id || !user || !annTitle.trim() || !annBody.trim()) return;
    setPosting(true);
    try {
      await createAnnouncement({
        classroomId: id,
        authorId: user.uid,
        title: annTitle.trim(),
        body: annBody.trim(),
        isPinned: false,
      });
      setAnnTitle('');
      setAnnBody('');
      await load();
    } catch (err) {
      Alert.alert('Error', 'Could not post announcement.');
    } finally {
      setPosting(false);
    }
  };

  const handleTogglePin = async (ann: Announcement) => {
    if (!id) return;
    try {
      await pinAnnouncement(id, ann.id, !ann.isPinned);
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, isPinned: !a.isPinned } : a));
    } catch (err) {
      Alert.alert('Error', 'Could not update announcement.');
    }
  };

  const handleDeleteAnn = (ann: Announcement) => {
    Alert.alert('Delete', `Delete "${ann.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!id) return;
          await deleteAnnouncement(id, ann.id);
          setAnnouncements(prev => prev.filter(a => a.id !== ann.id));
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/classrooms/${id}/manage`)}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Edit Info</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/events/create')}
          >
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>New Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/reports/create')}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>New Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Announcement */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Post Announcement</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Title"
          placeholderTextColor={colors.gray}
          value={annTitle}
          onChangeText={setAnnTitle}
        />
        <TextInput
          style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border, marginTop: 8 }]}
          placeholder="Write your announcement..."
          placeholderTextColor={colors.gray}
          value={annBody}
          onChangeText={setAnnBody}
          multiline
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[styles.postBtn, { backgroundColor: annTitle.trim() && annBody.trim() ? colors.primary : colors.gray }]}
          onPress={handlePostAnnouncement}
          disabled={!annTitle.trim() || !annBody.trim() || posting}
        >
          {posting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Post</Text>}
        </TouchableOpacity>
      </View>

      {/* Existing announcements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Announcements ({announcements.length})</Text>
        {announcements.length === 0 && (
          <Text style={[styles.empty, { color: colors.gray }]}>No announcements yet.</Text>
        )}
        {announcements.map(ann => (
          <View key={ann.id} style={[styles.annCard, { backgroundColor: colors.surface }]}>
            <View style={styles.annHeader}>
              <Text style={[styles.annTitle, { color: colors.text }]} numberOfLines={1}>{ann.title}</Text>
              <View style={styles.annActions}>
                <TouchableOpacity onPress={() => handleTogglePin(ann)}>
                  <Ionicons
                    name={ann.isPinned ? 'pin' : 'pin-outline'}
                    size={18}
                    color={ann.isPinned ? colors.primary : colors.gray}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteAnn(ann)} style={{ marginLeft: 12 }}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.annBody, { color: colors.gray }]} numberOfLines={2}>{ann.body}</Text>
          </View>
        ))}
      </View>

      {/* Students */}
      <View style={[styles.section, { paddingBottom: 40 }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Students ({classroom?.studentIds?.length ?? 0})
        </Text>
        {(classroom?.studentIds?.length ?? 0) === 0 ? (
          <Text style={[styles.empty, { color: colors.gray }]}>No students enrolled.</Text>
        ) : (
          classroom?.studentIds?.map(sid => (
            <TouchableOpacity
              key={sid}
              style={[styles.studentRow, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/classrooms/${id}/students/${sid}`)}
            >
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={[styles.studentId, { color: colors.text }]}>{sid}</Text>
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
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, gap: 6 },
  actionLabel: { fontSize: 12, fontWeight: '500' },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  multiline: { height: 80 },
  postBtn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  postBtnText: { color: '#fff', fontWeight: '700' },
  annCard: { padding: 12, borderRadius: 10, marginBottom: 8 },
  annHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  annTitle: { flex: 1, fontWeight: '600', fontSize: 14 },
  annActions: { flexDirection: 'row', alignItems: 'center' },
  annBody: { fontSize: 13, lineHeight: 18 },
  empty: { fontSize: 14 },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, marginBottom: 6 },
  studentId: { flex: 1, fontSize: 14 },
});

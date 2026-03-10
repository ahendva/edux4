// app/classrooms/[id].tsx — Classroom detail: announcements, roster, events, reports
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getClassroom } from '../../services/firebase/collections/classrooms';
import { getAnnouncements } from '../../services/firebase/collections/announcements';
import { getClassroomEvents } from '../../services/firebase/collections/events';
import { Classroom, Announcement, CalendarEvent } from '../../services/firebase/schema';

export default function ClassroomDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isTeacher = userProfile?.role === 'teacher' && classroom?.teacherId === user?.uid;

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [cls, ann, evts] = await Promise.all([
        getClassroom(id),
        getAnnouncements(id),
        getClassroomEvents(id),
      ]);
      setClassroom(cls);
      setAnnouncements(ann.slice(0, 5));
      setEvents(evts.filter(e => e.startDate > Date.now()).slice(0, 3));
      if (cls) navigation.setOptions({ title: cls.name });
    } catch (err) {
      console.error('Error loading classroom:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!classroom) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Classroom not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Header card */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{classroom.name}</Text>
        {classroom.subject && <Text style={styles.headerSub}>{classroom.subject}</Text>}
        {classroom.grade && <Text style={styles.headerSub}>{classroom.grade}</Text>}
        <View style={styles.statsRow}>
          <Text style={styles.stat}>{classroom.studentIds?.length ?? 0} students</Text>
          <Text style={styles.stat}>{classroom.participantIds?.length ?? 0} participants</Text>
        </View>
      </View>

      {/* Teacher actions */}
      {isTeacher && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/classrooms/${id}/admin`)}
          >
            <Ionicons name="settings-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Admin</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push(`/classrooms/${id}/manage`)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/events/create')}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Event</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/reports/create')}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
            <Text style={[styles.actionLabel, { color: colors.text }]}>Report</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Announcements */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Announcements</Text>
        {announcements.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.gray }]}>No announcements yet.</Text>
        ) : (
          announcements.map(a => (
            <View key={a.id} style={[styles.announcementCard, { backgroundColor: colors.surface }]}>
              {a.isPinned && (
                <View style={styles.pinnedBadge}>
                  <Ionicons name="pin" size={12} color={colors.primary} />
                  <Text style={[styles.pinnedText, { color: colors.primary }]}>Pinned</Text>
                </View>
              )}
              <Text style={[styles.announcementTitle, { color: colors.text }]}>{a.title}</Text>
              <Text style={[styles.announcementBody, { color: colors.gray }]} numberOfLines={3}>{a.body}</Text>
            </View>
          ))
        )}
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
        {events.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.gray }]}>No upcoming events.</Text>
        ) : (
          events.map(e => (
            <TouchableOpacity
              key={e.id}
              style={[styles.eventRow, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/events/${e.id}`)}
            >
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{e.title}</Text>
                <Text style={[styles.eventDate, { color: colors.gray }]}>
                  {new Date(e.startDate).toLocaleDateString()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.gray} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Progress Reports link */}
      <TouchableOpacity
        style={[styles.reportsLink, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/reports')}
      >
        <Ionicons name="document-text-outline" size={20} color={colors.primary} />
        <Text style={[styles.reportsLinkText, { color: colors.text }]}>View Progress Reports</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { padding: 20, margin: 16, borderRadius: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  stat: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 12, gap: 4 },
  actionLabel: { fontSize: 12, fontWeight: '500' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptyText: { fontSize: 14 },
  announcementCard: { padding: 14, borderRadius: 12, marginBottom: 8 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  pinnedText: { fontSize: 11, fontWeight: '600' },
  announcementTitle: { fontSize: 15, fontWeight: '600' },
  announcementBody: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 6 },
  eventTitle: { fontSize: 14, fontWeight: '600' },
  eventDate: { fontSize: 12, marginTop: 2 },
  reportsLink: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 16, borderRadius: 12 },
  reportsLinkText: { flex: 1, fontSize: 15, fontWeight: '500' },
});

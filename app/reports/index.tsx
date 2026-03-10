// app/reports/index.tsx — Reports list (teachers: their reports; parents: published for children)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getReportsForClassroom,
  getReportsForParent,
} from '../../services/firebase/collections/progressReports';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { getStudentsForParent } from '../../services/firebase/collections/students';
import { ProgressReport } from '../../services/firebase/schema';

export default function ReportsIndexScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!user || !userProfile) return;
    try {
      if (userProfile.role === 'teacher') {
        const classrooms = await getUserClassrooms(user.uid);
        const all = await Promise.all(classrooms.map(c => getReportsForClassroom(c.id)));
        setReports(all.flat().sort((a, b) => (b.createdAt as number) - (a.createdAt as number)));
      } else {
        const students = await getStudentsForParent(user.uid);
        const studentIds = students.map(s => s.id);
        setReports(await getReportsForParent(studentIds));
      }
    } catch (err) {
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user, userProfile]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const renderReport = ({ item }: { item: ProgressReport }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/reports/${item.id}`)}
    >
      <View style={[styles.icon, { backgroundColor: `${colors.primary}18` }]}>
        <Ionicons name="document-text" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.term, { color: colors.text }]}>{item.term}</Text>
        <Text style={[styles.meta, { color: colors.gray }]}>
          {item.grades.length} subject{item.grades.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <View style={styles.right}>
        <View
          style={[
            styles.badge,
            { backgroundColor: item.isPublished ? `${colors.success}20` : `${colors.warning}20` },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: item.isPublished ? colors.success : colors.warning },
            ]}
          >
            {item.isPublished ? 'Published' : 'Draft'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.gray} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={reports}
        keyExtractor={r => r.id}
        renderItem={renderReport}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={[styles.list, reports.length === 0 && styles.listCenter]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No reports yet</Text>
            <Text style={[styles.emptySub, { color: colors.gray }]}>
              {userProfile?.role === 'teacher'
                ? 'Create a report from the classroom page'
                : 'Reports will appear here when published by your teacher'}
            </Text>
          </View>
        }
      />
      {userProfile?.role === 'teacher' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/reports/create')}
          accessibilityLabel="Create report"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  listCenter: { flexGrow: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  term: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 2 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyTitle: { fontSize: 17, fontWeight: '600', marginTop: 14 },
  emptySub: { fontSize: 14, marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});

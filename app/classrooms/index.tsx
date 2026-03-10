// app/classrooms/index.tsx — Full classroom directory with search and filters
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { Classroom } from '../../services/firebase/schema';

export default function ClassroomDirectoryScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active');

  const loadClassrooms = async () => {
    if (!user) return;
    try {
      const data = await getUserClassrooms(user.uid);
      setClassrooms(data);
    } catch (err) {
      console.error('Error loading classrooms:', err);
    }
  };

  useEffect(() => { loadClassrooms(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassrooms();
    setRefreshing(false);
  };

  const filtered = classrooms.filter(c => {
    const matchSearch = search
      ? c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.subject?.toLowerCase().includes(search.toLowerCase()) ?? false)
      : true;
    const matchFilter =
      filter === 'all' ? true :
      filter === 'archived' ? c.isArchived === true :
      !c.isArchived;
    return matchSearch && matchFilter;
  });

  const renderClassroom = ({ item }: { item: Classroom }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/classrooms/${item.id}`)}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.surfaceSubtle }]}>
        <Ionicons name="school" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.sub, { color: colors.gray }]}>
          {[item.subject, item.grade].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[styles.meta, { color: colors.textSubtle }]}>
          {item.studentIds?.length ?? 0} students
          {item.isArchived ? '  ·  Archived' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.gray} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search classrooms..."
          placeholderTextColor={colors.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(['active', 'all', 'archived'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, filter === f && { backgroundColor: colors.primary }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: filter === f ? colors.onPrimary : colors.gray }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderClassroom}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="school-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyText, { color: colors.gray }]}>No classrooms found</Text>
          </View>
        }
      />

      {userProfile?.role === 'teacher' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/classrooms/create')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: 'transparent', borderWidth: 1, borderColor: 'transparent' },
  filterText: { fontSize: 13, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 80 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  iconWrap: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 13, marginTop: 2 },
  meta: { fontSize: 12, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, marginTop: 12 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
});

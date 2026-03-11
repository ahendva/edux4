// app/(tabs)/classrooms.tsx — Classroom list
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { Classroom } from '../../services/firebase/schema';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';

export default function ClassroomsScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClassrooms = async () => {
    if (!user) return;
    try {
      const data = await getUserClassrooms(user.uid);
      setClassrooms(data);
    } catch (error) {
      console.error('Error loading classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClassrooms(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClassrooms();
    setRefreshing(false);
  };

  const renderClassroom = ({ item }: { item: Classroom }) => (
    <TouchableOpacity
      style={[styles.classroomCard, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/classrooms/${item.id}`)}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.surfaceSubtle }]}>
        <Ionicons name="school" size={24} color={colors.primary} />
      </View>
      <View style={styles.classInfo}>
        <Text style={[styles.className, { color: colors.text }]}>{item.name}</Text>
        {item.subject && <Text style={[styles.classSubject, { color: colors.gray }]}>{item.subject}</Text>}
        <Text style={[styles.classMeta, { color: colors.textSubtle }]}>
          {item.studentIds?.length || 0} students
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonList count={5} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={classrooms}
        keyExtractor={(item) => item.id}
        renderItem={renderClassroom}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="school-outline"
            title="No classrooms yet"
            subtitle={userProfile?.role === 'teacher' ? 'Create a classroom to get started' : 'Ask a teacher to add you'}
            actionLabel={userProfile?.role === 'teacher' ? 'Create Classroom' : undefined}
            onAction={userProfile?.role === 'teacher' ? () => router.push('/classrooms/create') : undefined}
          />
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
  list: { padding: 16 },
  classroomCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, gap: 12 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600' },
  classSubject: { fontSize: 13, marginTop: 2 },
  classMeta: { fontSize: 12, marginTop: 2 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
});

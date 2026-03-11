// app/(tabs)/index.tsx — Home Dashboard
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getConversations } from '../../services/firebase/collections/conversations';
import { getUpcomingEvents } from '../../services/firebase/collections/events';
import { SkeletonList } from '../../components/ui/SkeletonCard';
import EmptyState from '../../components/ui/EmptyState';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;
    try {
      const conversations = await getConversations(user.uid);
      const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCounts?.[user.uid] || 0), 0);
      setUnreadCount(totalUnread);

      const events = await getUpcomingEvents(user.uid, 3);
      setUpcomingEvents(events);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  const roleBadge = userProfile?.role === 'teacher' ? 'Teacher' : 'Parent';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Welcome */}
      <View style={[styles.welcomeCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.welcomeName}>{userProfile?.displayName || 'User'}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name={userProfile?.role === 'teacher' ? 'book' : 'people'} size={14} color={colors.primary} />
          <Text style={[styles.roleText, { color: colors.primary }]}>{roleBadge}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]} onPress={() => router.push('/(tabs)/messages')}>
          <Ionicons name="chatbubble-ellipses" size={28} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Messages</Text>
          {unreadCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.danger }]}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]} onPress={() => router.push('/(tabs)/classrooms')}>
          <Ionicons name="school" size={28} color={colors.accent} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Classrooms</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surface }]} onPress={() => router.push('/(tabs)/calendar')}>
          <Ionicons name="calendar" size={28} color={colors.warning} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Calendar</Text>
        </TouchableOpacity>
      </View>

      {/* Upcoming Events */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Events</Text>
        {loading ? (
          <SkeletonList count={3} hasIcon={false} />
        ) : upcomingEvents.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="No upcoming events"
            subtitle="Events from your classrooms will appear here"
            actionLabel="View Calendar"
            onAction={() => router.push('/(tabs)/calendar')}
          />
        ) : (
          upcomingEvents.map((event) => (
            <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.surface }]}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <View style={styles.eventInfo}>
                <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                <Text style={[styles.eventDate, { color: colors.gray }]}>
                  {new Date(event.startDate).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  welcomeCard: { margin: 16, padding: 24, borderRadius: 16 },
  welcomeText: { color: '#ffffffcc', fontSize: 16 },
  welcomeName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 12, gap: 4 },
  roleText: { fontSize: 13, fontWeight: '600' },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  actionCard: { flex: 1, alignItems: 'center', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  actionLabel: { fontSize: 13, marginTop: 8, fontWeight: '500' },
  badge: { position: 'absolute', top: 8, right: 8, minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  eventCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, gap: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 13, marginTop: 2 },
});

// app/(tabs)/admin.tsx — Admin Dashboard tab (only visible to admins)
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { firestore } from '../../services/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { runFullSync } from '../../services/powerschool/sync';
import { SyncStatus } from '../../services/firebase/schema';

const SCHOOL_ID = parseInt(process.env.EXPO_PUBLIC_PS_SCHOOL_ID ?? '1', 10);

const COLLECTIONS = ['students', 'classrooms', 'staff', 'guardians', 'grades', 'attendance'] as const;

const STATUS_COLORS: Record<string, string> = {
  idle:    '#9E9E9E',
  running: '#FB8C00',
  success: '#2E7D32',
  error:   '#C62828',
};

const STATUS_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  idle:    'time-outline',
  running: 'sync-outline',
  success: 'checkmark-circle-outline',
  error:   'alert-circle-outline',
};

interface AppStats {
  users: number;
  classrooms: number;
  students: number;
  conversations: number;
}

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [stats, setStats] = useState<AppStats | null>(null);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [usersSnap, classroomsSnap, studentsSnap, convsSnap, syncSnap] = await Promise.all([
        getDocs(collection(firestore, 'users')),
        getDocs(collection(firestore, 'classrooms')),
        getDocs(collection(firestore, 'students')),
        getDocs(collection(firestore, 'conversations')),
        getDocs(collection(firestore, 'sync_status')),
      ]);

      setStats({
        users: usersSnap.size,
        classrooms: classroomsSnap.size,
        students: studentsSnap.size,
        conversations: convsSnap.size,
      });

      const map: Record<string, SyncStatus> = {};
      syncSnap.docs.forEach((d: { id: string; data: () => Record<string, unknown> }) => {
        map[d.id] = { id: d.id, ...d.data() } as SyncStatus;
      });
      setSyncStatuses(map);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRunFullSync = () => {
    Alert.alert(
      'Run Full Sync',
      'This will sync all students, classrooms, guardians, grades, and attendance from PowerSchool. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Sync',
          onPress: async () => {
            setSyncing(true);
            try {
              const result = await runFullSync(SCHOOL_ID);
              await loadData();
              const errorCount = result.errors.length;
              if (errorCount === 0) {
                Alert.alert('Sync Complete', 'All collections synced successfully.');
              } else {
                Alert.alert(
                  'Sync Complete with Errors',
                  `${errorCount} collection(s) had errors:\n${result.errors.map((e: { collection: string; message: string }) => `• ${e.collection}: ${e.message}`).join('\n')}`,
                );
              }
            } catch (err) {
              Alert.alert('Sync Failed', (err as Error).message);
            } finally {
              setSyncing(false);
            }
          },
        },
      ],
    );
  };

  const formatDate = (ts?: number) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString([], {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard label="Users"         value={stats?.users ?? 0}         icon="people-outline"       color={colors.primary} surface={colors.surface} text={colors.text} />
        <StatCard label="Classrooms"    value={stats?.classrooms ?? 0}    icon="school-outline"       color={colors.accent}  surface={colors.surface} text={colors.text} />
        <StatCard label="Students"      value={stats?.students ?? 0}      icon="person-outline"       color="#FB8C00"         surface={colors.surface} text={colors.text} />
        <StatCard label="Convos"        value={stats?.conversations ?? 0} icon="chatbubbles-outline"  color="#7B1FA2"         surface={colors.surface} text={colors.text} />
      </View>

      {/* Quick actions */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.syncBtn, { backgroundColor: syncing ? colors.gray : colors.primary }]}
          onPress={handleRunFullSync}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Ionicons name="sync-outline" size={20} color="#fff" />
          )}
          <Text style={styles.syncBtnText}>{syncing ? 'Syncing…' : 'Full Sync'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/admin/sync-status')}
        >
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Sync Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/admin/link-parents')}
        >
          <Ionicons name="link-outline" size={20} color={colors.accent} />
          <Text style={[styles.actionBtnText, { color: colors.text }]}>Link Parents</Text>
        </TouchableOpacity>
      </View>

      {/* Sync status summary */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>PowerSchool Sync Status</Text>
      {COLLECTIONS.map(col => {
        const status = syncStatuses[col];
        const s = status?.status ?? 'idle';
        const color = STATUS_COLORS[s] ?? colors.gray;

        return (
          <View key={col} style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}>
              <Ionicons name={STATUS_ICONS[s] ?? 'help-circle-outline'} size={20} color={color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={[styles.colName, { color: colors.text }]}>
                {col.charAt(0).toUpperCase() + col.slice(1)}
              </Text>
              <Text style={[styles.colMeta, { color: colors.gray }]}>
                Last sync: {formatDate(status?.lastSyncAt)}
              </Text>
              {status?.errorMessage && (
                <Text style={[styles.colError, { color: STATUS_COLORS.error }]} numberOfLines={2}>
                  {status.errorMessage}
                </Text>
              )}
            </View>
            <View style={styles.right}>
              <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
                <Text style={[styles.badgeText, { color }]}>{s}</Text>
              </View>
              {status?.recordsSynced != null && (
                <Text style={[styles.count, { color: colors.gray }]}>{status.recordsSynced} records</Text>
              )}
            </View>
          </View>
        );
      })}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function StatCard({
  label, value, icon, color, surface, text,
}: {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  surface: string;
  text: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: surface }]}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.statValue, { color: text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 10, marginTop: 4 },

  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 18 },
  syncBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  syncBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  colName: { fontSize: 14, fontWeight: '600' },
  colMeta: { fontSize: 12, marginTop: 2 },
  colError: { fontSize: 11, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  count: { fontSize: 11 },
});

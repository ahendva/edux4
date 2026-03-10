// app/admin/sync-status.tsx — Admin: PowerSchool sync dashboard
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
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { firestore } from '../../services/firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { runFullSync } from '../../services/powerschool/sync';
import { SyncStatus } from '../../services/firebase/schema';

const SCHOOL_ID = parseInt(process.env.EXPO_PUBLIC_PS_SCHOOL_ID ?? '1', 10);

const STATUS_COLORS: Record<string, string> = {
  idle: '#9E9E9E',
  running: '#FB8C00',
  success: '#2E7D32',
  error: '#C62828',
};

const STATUS_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  idle: 'time-outline',
  running: 'sync-outline',
  success: 'checkmark-circle-outline',
  error: 'alert-circle-outline',
};

export default function SyncStatusScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [statuses, setStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Sync Dashboard' });
  }, []);

  const loadStatuses = useCallback(async () => {
    try {
      const snap = await getDocs(collection(firestore, 'sync_status'));
      setStatuses(snap.docs.map(d => ({ id: d.id, ...d.data() } as SyncStatus)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatuses();
    setRefreshing(false);
  };

  const handleRunSync = async () => {
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
              await loadStatuses();
              const errorCount = result.errors.length;
              if (errorCount === 0) {
                Alert.alert('Sync Complete', 'All collections synced successfully.');
              } else {
                Alert.alert(
                  'Sync Complete with Errors',
                  `${errorCount} collection(s) had errors:\n${result.errors.map(e => `• ${e.collection}: ${e.message}`).join('\n')}`,
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

  const COLLECTIONS = ['students', 'classrooms', 'staff', 'guardians', 'grades', 'attendance'];
  const statusMap = Object.fromEntries(statuses.map(s => [s.id, s]));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Sync button */}
      <TouchableOpacity
        style={[styles.syncBtn, { backgroundColor: syncing ? colors.gray : colors.primary }]}
        onPress={handleRunSync}
        disabled={syncing}
      >
        {syncing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="sync-outline" size={20} color="#fff" />
            <Text style={styles.syncBtnText}>Run Full Sync</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Collection Status</Text>

      {COLLECTIONS.map(col => {
        const status = statusMap[col];
        const s = status?.status ?? 'idle';
        const color = STATUS_COLORS[s] ?? colors.gray;

        return (
          <View key={col} style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={[styles.iconBox, { backgroundColor: `${color}18` }]}>
              <Ionicons name={STATUS_ICONS[s] ?? 'help-circle-outline'} size={22} color={color} />
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 16,
    borderRadius: 14,
  },
  syncBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1 },
  colName: { fontSize: 15, fontWeight: '600' },
  colMeta: { fontSize: 12, marginTop: 2 },
  colError: { fontSize: 11, marginTop: 4 },
  right: { alignItems: 'flex-end', gap: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  count: { fontSize: 11 },
});

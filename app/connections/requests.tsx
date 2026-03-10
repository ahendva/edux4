// app/connections/requests.tsx — Pending connection requests (incoming/outgoing)
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  getPendingRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  sendConnectionRequest,
} from '../../services/firebase/collections/connections';
import { getUsersByRole } from '../../services/firebase/collections/users';
import { ConnectionRequest, UserProfile } from '../../services/firebase/schema';

export default function ConnectionRequestsScreen() {
  const router = useRouter();
  const { user, userProfile, refreshUserProfile } = useAuth();
  const { colors } = useTheme();

  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    if (!user || !userProfile) return;
    try {
      const [reqs, allOpposite] = await Promise.all([
        getPendingRequests(user.uid),
        getUsersByRole(userProfile.role === 'parent' ? 'teacher' : 'parent'),
      ]);
      setRequests(reqs);
      // Suggest users not already connected
      const notConnected = allOpposite.filter(
        u => !userProfile.connections.includes(u.id) && u.id !== user.uid,
      );
      setSuggestions(notConnected.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user, userProfile]);
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleAccept = async (req: ConnectionRequest) => {
    setActionLoading(req.id);
    try {
      await acceptConnectionRequest(req.id);
      await refreshUserProfile();
      setRequests(prev => prev.filter(r => r.id !== req.id));
      Alert.alert('Connected!', 'Connection accepted.');
    } catch (err) {
      Alert.alert('Error', 'Could not accept request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (req: ConnectionRequest) => {
    setActionLoading(req.id);
    try {
      await rejectConnectionRequest(req.id);
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } catch (err) {
      Alert.alert('Error', 'Could not reject request.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendRequest = async (toUser: UserProfile) => {
    if (!user) return;
    setActionLoading(toUser.id);
    try {
      await sendConnectionRequest(user.uid, toUser.id);
      setSuggestions(prev => prev.filter(u => u.id !== toUser.id));
      Alert.alert('Request Sent', `Connection request sent to ${toUser.displayName}.`);
    } catch (err) {
      Alert.alert('Error', 'Could not send request.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderRequest = ({ item }: { item: ConnectionRequest }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
        <Ionicons name="person" size={20} color={colors.primary} />
      </View>
      <View style={styles.requestInfo}>
        <Text style={[styles.requestFrom, { color: colors.text }]}>{item.fromUserId}</Text>
        {item.message ? (
          <Text style={[styles.requestMsg, { color: colors.gray }]} numberOfLines={2}>{item.message}</Text>
        ) : null}
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: colors.success }]}
          onPress={() => handleAccept(item)}
          disabled={actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.rejectBtn, { borderColor: colors.danger }]}
          onPress={() => handleReject(item)}
          disabled={actionLoading === item.id}
        >
          <Ionicons name="close" size={18} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
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
        data={requests}
        keyExtractor={item => item.id}
        renderItem={renderRequest}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Pending Requests ({requests.length})
            </Text>
            {requests.length === 0 && (
              <Text style={[styles.empty, { color: colors.gray }]}>No pending requests.</Text>
            )}
          </>
        }
        ListFooterComponent={
          suggestions.length > 0 ? (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                Suggested Connections
              </Text>
              {suggestions.map(u => (
                <View key={u.id} style={[styles.suggestionCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.suggestionInfo}>
                    <Text style={[styles.suggestionName, { color: colors.text }]}>{u.displayName}</Text>
                    <Text style={[styles.suggestionRole, { color: colors.gray }]}>{u.role}</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.connectBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleSendRequest(u)}
                    disabled={actionLoading === u.id}
                  >
                    {actionLoading === u.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.connectBtnText}>Connect</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  empty: { fontSize: 14, marginBottom: 8 },
  requestCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  requestInfo: { flex: 1 },
  requestFrom: { fontSize: 14, fontWeight: '600' },
  requestMsg: { fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  suggestionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 },
  suggestionInfo: { flex: 1 },
  suggestionName: { fontSize: 14, fontWeight: '600' },
  suggestionRole: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  connectBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  connectBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

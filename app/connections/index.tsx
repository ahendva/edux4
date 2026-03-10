// app/connections/index.tsx — All connections list with search
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile } from '../../services/firebase/collections/users';
import { UserProfile } from '../../services/firebase/schema';

export default function ConnectionsListScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { colors } = useTheme();

  const [connections, setConnections] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    if (!userProfile?.connections?.length) { setLoading(false); return; }
    try {
      const profiles = await Promise.all(
        userProfile.connections.map(id => getUserProfile(id)),
      );
      setConnections(profiles.filter((p): p is UserProfile => p !== null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [userProfile]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = connections.filter(c => {
    const q = search.toLowerCase();
    return !q || c.displayName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
  });

  const renderConnection = ({ item }: { item: UserProfile }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface }]}
      onPress={() => router.push(`/connections/${item.id}`)}
    >
      <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
        <Ionicons name="person" size={22} color={colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.displayName}</Text>
        <Text style={[styles.role, { color: colors.gray }]}>{item.role}</Text>
      </View>
      <TouchableOpacity
        style={[styles.messageBtn, { backgroundColor: colors.primaryLight }]}
        onPress={() => router.push('/messages/new')}
      >
        <Ionicons name="chatbubble-outline" size={16} color={colors.onPrimary} />
      </TouchableOpacity>
      <Ionicons name="chevron-forward" size={16} color={colors.gray} />
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
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search connections..."
          placeholderTextColor={colors.gray}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Quick links */}
      <TouchableOpacity
        style={[styles.requestsLink, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/connections/search')}
      >
        <Ionicons name="person-add-outline" size={18} color={colors.primary} />
        <Text style={[styles.requestsText, { color: colors.text }]}>Find People</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.requestsLink, { backgroundColor: colors.surface }]}
        onPress={() => router.push('/connections/requests')}
      >
        <Ionicons name="people-outline" size={18} color={colors.primary} />
        <Text style={[styles.requestsText, { color: colors.text }]}>Connection Requests</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray} />
      </TouchableOpacity>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderConnection}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyText, { color: colors.gray }]}>No connections yet</Text>
            <Text style={[styles.emptySub, { color: colors.gray }]}>Connect with teachers or parents to start communicating</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', margin: 16, marginBottom: 8, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15 },
  requestsLink: { flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 12 },
  requestsText: { flex: 1, fontSize: 14, fontWeight: '500' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  role: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  messageBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { fontSize: 13, marginTop: 4, textAlign: 'center', paddingHorizontal: 32 },
});

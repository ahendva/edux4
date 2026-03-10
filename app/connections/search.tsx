// app/connections/search.tsx — Search for teachers/parents to connect with
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { searchUsersByName } from '../../services/firebase/collections/users';
import { sendConnectionRequest } from '../../services/firebase/collections/connections';
import { UserProfile } from '../../services/firebase/schema';

export default function ConnectionSearchScreen() {
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search role opposite to current user: parents search teachers, teachers search parents
  const searchRole = userProfile?.role === 'parent' ? 'teacher' : 'parent';

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await searchUsersByName(query, searchRole);
        // Exclude self and already-connected users
        const existing = new Set(userProfile?.connections ?? []);
        setResults(found.filter(u => u.id !== user?.uid && !existing.has(u.id)));
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleConnect = async (target: UserProfile) => {
    if (!user) return;
    setActionLoading(target.id);
    try {
      await sendConnectionRequest(user.uid, target.id);
      setSentIds(prev => new Set([...prev, target.id]));
    } catch (err) {
      Alert.alert('Error', 'Could not send connection request. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const renderUser = ({ item }: { item: UserProfile }) => {
    const sent = sentIds.has(item.id);
    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.avatarText, { color: colors.primary }]}>
            {(item.displayName || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.displayName}</Text>
          <Text style={[styles.username, { color: colors.gray }]}>@{item.username || item.email}</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.connectBtn,
            { backgroundColor: sent ? colors.surfaceSubtle : colors.primary },
          ]}
          onPress={() => !sent && handleConnect(item)}
          disabled={sent || actionLoading === item.id}
        >
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={[styles.connectText, { color: sent ? colors.gray : '#fff' }]}>
              {sent ? 'Sent' : 'Connect'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={`Search ${searchRole}s by name…`}
          placeholderTextColor={colors.gray}
          value={query}
          onChangeText={setQuery}
          autoFocus
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color={colors.primary} />}
        {query.length > 0 && !searching && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          query.length >= 2 && !searching ? (
            <View style={styles.empty}>
              <Ionicons name="person-outline" size={44} color={colors.gray} />
              <Text style={[styles.emptyText, { color: colors.gray }]}>No {searchRole}s found</Text>
            </View>
          ) : query.length < 2 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={44} color={colors.gray} />
              <Text style={[styles.emptyText, { color: colors.gray }]}>
                Search for {searchRole}s to connect with
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600' },
  username: { fontSize: 12, marginTop: 2 },
  connectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  connectText: { fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
});

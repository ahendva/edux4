// app/(tabs)/messages.tsx — Conversations list with real-time updates
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { subscribeToConversations } from '../../services/firebase/collections/conversations';
import { Conversation } from '../../services/firebase/schema';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  const filtered = conversations.filter(c =>
    !search || c.subject?.toLowerCase().includes(search.toLowerCase()),
  );

  const formatTime = (ts?: number) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => {
      const unread = item.unreadCounts?.[user?.uid || ''] || 0;
      return (
        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surface }]}
          onPress={() => router.push(`/messages/${item.id}`)}
        >
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="chatbubble" size={20} color={colors.onPrimary} />
          </View>
          <View style={styles.info}>
            <View style={styles.row}>
              <Text
                style={[styles.subject, { color: colors.text }, unread > 0 && styles.bold]}
                numberOfLines={1}
              >
                {item.subject || 'Direct Message'}
              </Text>
              <Text style={[styles.time, { color: colors.gray }]}>
                {formatTime(item.lastMessageAt)}
              </Text>
            </View>
            <Text style={[styles.preview, { color: colors.gray }]} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
          </View>
          {unread > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [user, colors, router],
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={18} color={colors.gray} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search conversations…"
          placeholderTextColor={colors.gray}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={colors.gray} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderConversation}
        contentContainerStyle={[styles.list, filtered.length === 0 && styles.listCenter]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color={colors.gray} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
            <Text style={[styles.emptySub, { color: colors.gray }]}>
              Start a conversation with your child's teacher
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/messages/new')}
        accessibilityLabel="New conversation"
      >
        <Ionicons name="create-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  list: { paddingHorizontal: 12, paddingBottom: 100 },
  listCenter: { flexGrow: 1, justifyContent: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
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
  info: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subject: { fontSize: 15, flex: 1, marginRight: 8 },
  bold: { fontWeight: '700' },
  preview: { fontSize: 13, marginTop: 2 },
  time: { fontSize: 12 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: 60 },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
});

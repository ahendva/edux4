// app/(tabs)/messages.tsx — Conversations list
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getConversations } from '../../services/firebase/collections/conversations';
import { Conversation } from '../../services/firebase/schema';

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    if (!user) return;
    try {
      const convs = await getConversations(user.uid);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConversations(); }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const unread = item.unreadCounts?.[user?.uid || ''] || 0;
    return (
      <TouchableOpacity
        style={[styles.conversationCard, { backgroundColor: colors.surface }]}
        onPress={() => router.push(`/messages/${item.id}`)}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="chatbubble" size={20} color={colors.onPrimary} />
        </View>
        <View style={styles.convInfo}>
          <Text style={[styles.convSubject, { color: colors.text }]} numberOfLines={1}>
            {item.subject || 'Direct Message'}
          </Text>
          <Text style={[styles.convPreview, { color: colors.gray }]} numberOfLines={1}>
            {item.lastMessage || 'No messages yet'}
          </Text>
        </View>
        {unread > 0 && (
          <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.unreadText}>{unread}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={48} color={colors.gray} />
            <Text style={[styles.emptyText, { color: colors.gray }]}>No conversations yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.gray }]}>Start a conversation with a parent or teacher</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  conversationCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  convInfo: { flex: 1 },
  convSubject: { fontSize: 15, fontWeight: '600' },
  convPreview: { fontSize: 13, marginTop: 2 },
  unreadBadge: { minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySubtext: { fontSize: 14, marginTop: 4 },
});

// app/messages/[id].tsx — Conversation thread screen
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getConversation } from '../../services/firebase/collections/conversations';
import { getMessages, sendMessage, markAsRead } from '../../services/firebase/collections/messages';
import { getUserProfile } from '../../services/firebase/collections/users';
import { Message, UserProfile } from '../../services/firebase/schema';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserProfile>>({});
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const loadData = useCallback(async () => {
    if (!id || !user) return;
    try {
      const [conv, msgs] = await Promise.all([
        getConversation(id),
        getMessages(id, 100),
      ]);
      if (conv) {
        navigation.setOptions({ title: conv.subject || 'Conversation' });
        // Load participant profiles
        const profileEntries = await Promise.all(
          conv.participantIds.map(async pid => {
            const profile = await getUserProfile(pid);
            return profile ? [pid, profile] as const : null;
          }),
        );
        const profileMap: Record<string, UserProfile> = {};
        profileEntries.forEach(entry => {
          if (entry) profileMap[entry[0]] = entry[1];
        });
        setParticipants(profileMap);
      }
      setMessages(msgs);
      // Mark all as read
      await Promise.all(
        msgs
          .filter(m => !m.readBy.includes(user.uid))
          .map(m => markAsRead(id, m.id, user.uid)),
      );
    } catch (err) {
      console.error('Error loading conversation:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSend = async () => {
    if (!text.trim() || !id || !user) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      const msgId = await sendMessage(id, user.uid, content);
      const now = Date.now();
      setMessages(prev => [...prev, {
        id: msgId,
        conversationId: id,
        senderId: user.uid,
        text: content,
        readBy: [user.uid],
        createdAt: now,
        updatedAt: now,
      }]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      Alert.alert('Error', 'Failed to send message.');
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    const sender = participants[item.senderId];
    const time = new Date(item.createdAt as number).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="person" size={14} color={colors.primary} />
          </View>
        )}
        <View style={[
          styles.bubble,
          isMe
            ? [styles.bubbleMe, { backgroundColor: colors.primary }]
            : [styles.bubbleThem, { backgroundColor: colors.surface }],
        ]}>
          {!isMe && sender && (
            <Text style={[styles.senderName, { color: colors.primary }]}>{sender.displayName}</Text>
          )}
          <Text style={[styles.bubbleText, { color: isMe ? colors.onPrimary : colors.text }]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, { color: isMe ? colors.onPrimary : colors.gray, opacity: 0.7 }]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.gray} />
            <Text style={[styles.emptyText, { color: colors.gray }]}>No messages yet. Say hello!</Text>
          </View>
        }
      />
      <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={colors.gray}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: text.trim() ? colors.primary : colors.surfaceSubtle }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color={text.trim() ? colors.onPrimary : colors.gray} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, gap: 8 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatarSmall: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { marginTop: 12, fontSize: 14 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, gap: 8, borderTopWidth: StyleSheet.hairlineWidth },
  textInput: { flex: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 15, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

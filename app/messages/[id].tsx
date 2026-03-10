// app/messages/[id].tsx — Conversation thread with real-time subscription
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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getConversation } from '../../services/firebase/collections/conversations';
import {
  subscribeToMessages,
  sendMessage,
  markAllRead,
  deleteMessage,
} from '../../services/firebase/collections/messages';
import { getUsersByIds } from '../../services/firebase/collections/users';
import { Message, UserProfile } from '../../services/firebase/schema';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Record<string, UserProfile>>({});
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);
  const scrolledToEnd = useRef(false);

  // Load conversation metadata + participant profiles
  useEffect(() => {
    if (!id || !user) return;
    getConversation(id).then(async conv => {
      if (conv) {
        navigation.setOptions({ title: conv.subject || 'Conversation' });
        const profiles = await getUsersByIds(conv.participantIds);
        const map: Record<string, UserProfile> = {};
        profiles.forEach(p => { map[p.id] = p; });
        setParticipants(map);
      }
    });
  }, [id, user]);

  // Real-time messages subscription
  useEffect(() => {
    if (!id || !user) return;
    const unsub = subscribeToMessages(id, msgs => {
      setMessages(msgs);
      setLoading(false);
      // Mark all unread on arrival
      markAllRead(id, user.uid).catch(console.error);
    });
    return unsub;
  }, [id, user]);

  // Scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && !scrolledToEnd.current) {
      scrolledToEnd.current = true;
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    if (!text.trim() || !id || !user || sending) return;
    const content = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(id, user.uid, content);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 150);
    } catch {
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setText(content);
    } finally {
      setSending(false);
    }
  };

  const handleLongPress = useCallback(
    (msg: Message) => {
      if (msg.senderId !== user?.uid) return;
      Alert.alert('Delete Message', 'Delete this message?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMessage(id!, msg.id).catch(console.error),
        },
      ]);
    },
    [user, id],
  );

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === user?.uid;
    const sender = participants[item.senderId];
    const time = new Date(item.createdAt as number).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const displayLang = userProfile?.language || 'en';
    const translated = item.translatedText?.[displayLang];

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => handleLongPress(item)}
        style={[styles.messageRow, isMe && styles.messageRowMe]}
      >
        {!isMe && (
          <View style={[styles.avatarSmall, { backgroundColor: colors.surfaceSubtle }]}>
            <Ionicons name="person" size={14} color={colors.primary} />
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isMe
              ? [styles.bubbleMe, { backgroundColor: colors.primary }]
              : [styles.bubbleThem, { backgroundColor: colors.surface }],
          ]}
        >
          {!isMe && sender && (
            <Text style={[styles.senderName, { color: colors.primary }]}>
              {sender.displayName}
            </Text>
          )}
          <Text style={[styles.bubbleText, { color: isMe ? '#fff' : colors.text }]}>
            {translated || item.text}
          </Text>
          {translated && (
            <Text style={[styles.translatedNote, { color: isMe ? 'rgba(255,255,255,0.65)' : colors.gray }]}>
              Translated
            </Text>
          )}
          {item.attachmentUrl && (
            <TouchableOpacity style={styles.attachmentRow}>
              <Ionicons
                name="attach"
                size={14}
                color={isMe ? 'rgba(255,255,255,0.8)' : colors.gray}
              />
              <Text style={[styles.attachmentName, { color: isMe ? 'rgba(255,255,255,0.8)' : colors.gray }]}>
                {item.attachmentName || 'Attachment'}
              </Text>
            </TouchableOpacity>
          )}
          <Text
            style={[
              styles.bubbleTime,
              { color: isMe ? 'rgba(255,255,255,0.7)' : colors.gray },
            ]}
          >
            {time}
            {isMe && item.readBy && item.readBy.length > 1 ? ' ✓✓' : ''}
          </Text>
        </View>
      </TouchableOpacity>
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
        onContentSizeChange={() => {
          if (scrolledToEnd.current) {
            listRef.current?.scrollToEnd({ animated: true });
          }
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubbles-outline" size={40} color={colors.gray} />
            <Text style={[styles.emptyText, { color: colors.gray }]}>
              No messages yet. Say hello!
            </Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TextInput
          style={[styles.textInput, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="Type a message…"
          placeholderTextColor={colors.gray}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          onSubmitEditing={Platform.OS === 'web' ? handleSend : undefined}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: text.trim() ? colors.primary : colors.surfaceSubtle },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
          accessibilityLabel="Send message"
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={text.trim() ? '#fff' : colors.gray}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: 12, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8, gap: 8 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 10 },
  bubbleMe: { borderBottomRightRadius: 4 },
  bubbleThem: { borderBottomLeftRadius: 4 },
  senderName: { fontSize: 11, fontWeight: '600', marginBottom: 2 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  translatedNote: { fontSize: 10, marginTop: 2, fontStyle: 'italic' },
  attachmentRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  attachmentName: { fontSize: 12 },
  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: { marginTop: 12, fontSize: 14 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

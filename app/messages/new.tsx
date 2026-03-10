// app/messages/new.tsx — New conversation: find or create direct thread
import React, { useState, useCallback } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { searchUsersByName } from '../../services/firebase/collections/users';
import {
  createConversation,
  findDirectConversation,
} from '../../services/firebase/collections/conversations';
import { sendMessage } from '../../services/firebase/collections/messages';
import { UserProfile } from '../../services/firebase/schema';

export default function NewMessageScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSearch = useCallback(
    async (q: string) => {
      setSearchQuery(q);
      if (q.length < 2) { setResults([]); return; }
      setSearching(true);
      try {
        const oppositeRole = userProfile?.role === 'parent' ? 'teacher' : 'parent';
        const found = await searchUsersByName(q, oppositeRole);
        // Only show connections
        const connected = found.filter(u => userProfile?.connections?.includes(u.id));
        setResults(connected);
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    },
    [userProfile],
  );

  const handleSend = async () => {
    if (!user || !selected || !messageText.trim()) return;
    setSending(true);
    try {
      // Reuse an existing direct conversation if one exists
      let convId = (await findDirectConversation(user.uid, selected.id))?.id;
      if (!convId) {
        convId = await createConversation(
          [user.uid, selected.id],
          subject.trim() || undefined,
        );
      }
      await sendMessage(convId, user.uid, messageText.trim());
      router.replace(`/messages/${convId}`);
    } catch {
      Alert.alert('Error', 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const canSend = !!selected && messageText.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* To field */}
      <Text style={[styles.label, { color: colors.text }]}>To</Text>
      {selected ? (
        <View style={[styles.chip, { backgroundColor: colors.primaryLight }]}>
          <View style={[styles.chipAvatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.chipAvatarText}>{selected.displayName[0].toUpperCase()}</Text>
          </View>
          <Text style={[styles.chipName, { color: '#fff' }]}>{selected.displayName}</Text>
          <Text style={[styles.chipRole, { color: 'rgba(255,255,255,0.75)' }]}>{selected.role}</Text>
          <TouchableOpacity onPress={() => { setSelected(null); setResults([]); }}>
            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.searchRow, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={18} color={colors.gray} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search connections by name…"
              placeholderTextColor={colors.gray}
              value={searchQuery}
              onChangeText={handleSearch}
              autoFocus
            />
            {searching && <ActivityIndicator size="small" color={colors.primary} />}
          </View>

          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={u => u.id}
              style={styles.resultsList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.resultRow, { borderBottomColor: colors.border }]}
                  onPress={() => { setSelected(item); setSearchQuery(''); setResults([]); }}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="person" size={20} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultName, { color: colors.text }]}>
                      {item.displayName}
                    </Text>
                    <Text style={[styles.resultRole, { color: colors.gray }]}>
                      {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.gray} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                searchQuery.length >= 2 && !searching ? (
                  <Text style={[styles.emptyText, { color: colors.gray }]}>
                    No connections match "{searchQuery}"
                  </Text>
                ) : null
              }
            />
          )}
        </>
      )}

      {/* Subject */}
      <Text style={[styles.label, { color: colors.text }]}>Subject (optional)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="What's this about?"
        placeholderTextColor={colors.gray}
        value={subject}
        onChangeText={setSubject}
      />

      {/* Message */}
      <Text style={[styles.label, { color: colors.text }]}>Message</Text>
      <TextInput
        style={[
          styles.input,
          styles.messageInput,
          { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
        ]}
        placeholder="Write your message…"
        placeholderTextColor={colors.gray}
        value={messageText}
        onChangeText={setMessageText}
        multiline
        textAlignVertical="top"
        maxLength={2000}
      />

      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: canSend ? colors.primary : colors.gray }]}
        onPress={handleSend}
        disabled={!canSend || sending}
      >
        {sending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sendBtnText}>Send Message</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  resultsList: { maxHeight: 220 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultName: { fontSize: 15, fontWeight: '500' },
  resultRole: { fontSize: 12, marginTop: 1 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  chipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  chipName: { fontSize: 14, fontWeight: '600' },
  chipRole: { fontSize: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  messageInput: { height: 130, marginBottom: 4 },
  emptyText: { padding: 12, textAlign: 'center', fontSize: 14 },
  sendBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

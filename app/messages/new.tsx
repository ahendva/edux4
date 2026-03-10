// app/messages/new.tsx — New conversation: recipient search, subject, first message
import React, { useState, useEffect } from 'react';
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
import { getUsersByRole } from '../../services/firebase/collections/users';
import { createConversation } from '../../services/firebase/collections/conversations';
import { sendMessage } from '../../services/firebase/collections/messages';
import { UserProfile } from '../../services/firebase/schema';

export default function NewMessageScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load connected users of opposite role as candidate recipients
  useEffect(() => {
    const load = async () => {
      if (!userProfile) return;
      setLoading(true);
      try {
        const role = userProfile.role === 'parent' ? 'teacher' : 'parent';
        const users = await getUsersByRole(role);
        // Filter to connections only
        const connected = users.filter(u => userProfile.connections.includes(u.id));
        setCandidates(connected);
      } catch (err) {
        console.error('Error loading recipients:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userProfile]);

  const filtered = candidates.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      u.displayName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const handleSend = async () => {
    if (!user || !selected) return;
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }
    setSending(true);
    try {
      const convId = await createConversation(
        [user.uid, selected.id],
        subject.trim() || undefined,
      );
      await sendMessage(convId, user.uid, messageText.trim());
      router.replace(`/messages/${convId}`);
    } catch (err) {
      Alert.alert('Error', 'Could not send message. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Recipient search */}
      <Text style={[styles.label, { color: colors.text }]}>To</Text>
      {selected ? (
        <View style={[styles.selectedChip, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.chipName, { color: colors.onPrimary }]}>{selected.displayName}</Text>
          <TouchableOpacity onPress={() => setSelected(null)}>
            <Ionicons name="close-circle" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            placeholder="Search connections..."
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={item => item.id}
              style={styles.list}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.candidateRow, { borderBottomColor: colors.border }]}
                  onPress={() => { setSelected(item); setSearchQuery(''); }}
                >
                  <View style={[styles.avatar, { backgroundColor: colors.surfaceSubtle }]}>
                    <Ionicons name="person" size={18} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={[styles.candidateName, { color: colors.text }]}>{item.displayName}</Text>
                    <Text style={[styles.candidateRole, { color: colors.gray }]}>{item.role}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: colors.gray }]}>No connections found.</Text>
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
        style={[styles.input, styles.messageInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Write your message..."
        placeholderTextColor={colors.gray}
        value={messageText}
        onChangeText={setMessageText}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.sendBtn, { backgroundColor: selected && messageText.trim() ? colors.primary : colors.gray }]}
        onPress={handleSend}
        disabled={!selected || !messageText.trim() || sending}
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
  label: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  messageInput: { height: 120, marginBottom: 8 },
  list: { maxHeight: 200, marginBottom: 8 },
  candidateRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  candidateName: { fontSize: 15, fontWeight: '500' },
  candidateRole: { fontSize: 12, marginTop: 1 },
  selectedChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipName: { fontSize: 14, fontWeight: '600' },
  emptyText: { padding: 12, textAlign: 'center' },
  sendBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

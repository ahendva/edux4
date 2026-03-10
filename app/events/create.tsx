// app/events/create.tsx — Create event: title, type, date/time, location, classroom, description
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createEvent } from '../../services/firebase/collections/events';
import { EventType } from '../../services/firebase/schema';

const EVENT_TYPES: { type: EventType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'meeting', label: 'Meeting', icon: 'people-outline' },
  { type: 'deadline', label: 'Deadline', icon: 'alert-circle-outline' },
  { type: 'event', label: 'Event', icon: 'star-outline' },
  { type: 'holiday', label: 'Holiday', icon: 'sunny-outline' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [classroomId, setClassroomId] = useState('');
  // Simple date/time strings — in a real build these would use DateTimePicker
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [saving, setSaving] = useState(false);

  const parseDate = (str: string): number | null => {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    const startDate = parseDate(startDateStr);
    if (!startDate) { Alert.alert('Required', 'Please enter a valid start date (e.g. 2026-04-01 14:00).'); return; }

    setSaving(true);
    try {
      const id = await createEvent({
        title: title.trim(),
        type,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        classroomId: classroomId.trim() || undefined,
        startDate,
        endDate: parseDate(endDateStr) ?? undefined,
        creatorId: user.uid,
        rsvps: {},
      });
      router.replace(`/events/${id}`);
    } catch (err) {
      Alert.alert('Error', 'Could not create event. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.text }]}>Event Title *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Parent-Teacher Meeting"
        placeholderTextColor={colors.gray}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={[styles.label, { color: colors.text }]}>Type</Text>
      <View style={styles.typeRow}>
        {EVENT_TYPES.map(({ type: t, label, icon }) => (
          <TouchableOpacity
            key={t}
            style={[
              styles.typeChip,
              type === t ? { backgroundColor: colors.primary } : { backgroundColor: colors.surface },
            ]}
            onPress={() => setType(t)}
          >
            <Ionicons name={icon} size={16} color={type === t ? colors.onPrimary : colors.gray} />
            <Text style={[styles.typeLabel, { color: type === t ? colors.onPrimary : colors.gray }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.label, { color: colors.text }]}>Start Date & Time *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. 2026-04-01 14:00"
        placeholderTextColor={colors.gray}
        value={startDateStr}
        onChangeText={setStartDateStr}
      />

      <Text style={[styles.label, { color: colors.text }]}>End Date & Time</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. 2026-04-01 15:00 (optional)"
        placeholderTextColor={colors.gray}
        value={endDateStr}
        onChangeText={setEndDateStr}
      />

      <Text style={[styles.label, { color: colors.text }]}>Location</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Room 204"
        placeholderTextColor={colors.gray}
        value={location}
        onChangeText={setLocation}
      />

      <Text style={[styles.label, { color: colors.text }]}>Classroom ID (optional)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Link to a classroom"
        placeholderTextColor={colors.gray}
        value={classroomId}
        onChangeText={setClassroomId}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Event details..."
        placeholderTextColor={colors.gray}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: title.trim() ? colors.primary : colors.gray }]}
        onPress={handleCreate}
        disabled={!title.trim() || saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Event</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  multiline: { height: 100 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  typeLabel: { fontSize: 13, fontWeight: '500' },
  createBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

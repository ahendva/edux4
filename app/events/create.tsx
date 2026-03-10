// app/events/create.tsx — Create event with multi-classroom select and recurring toggle
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createEvent } from '../../services/firebase/collections/events';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { Classroom, EventType } from '../../services/firebase/schema';

const EVENT_TYPES: { type: EventType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'meeting', label: 'Meeting', icon: 'people-outline' },
  { type: 'deadline', label: 'Deadline', icon: 'alert-circle-outline' },
  { type: 'event', label: 'Event', icon: 'star-outline' },
  { type: 'holiday', label: 'Holiday', icon: 'sunny-outline' },
];

const RECURRENCE_OPTIONS = [
  { value: 'FREQ=DAILY', label: 'Daily' },
  { value: 'FREQ=WEEKLY', label: 'Weekly' },
  { value: 'FREQ=MONTHLY', label: 'Monthly' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroomIds, setSelectedClassroomIds] = useState<string[]>([]);
  const [showClassroomPicker, setShowClassroomPicker] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('event');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('FREQ=WEEKLY');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserClassrooms(user.uid).then(setClassrooms).catch(console.error);
  }, [user]);

  const parseDate = (str: string): number | null => {
    if (!str.trim()) return null;
    const d = new Date(str.trim());
    return isNaN(d.getTime()) ? null : d.getTime();
  };

  const toggleClassroom = (classroomId: string) => {
    setSelectedClassroomIds(prev =>
      prev.includes(classroomId)
        ? prev.filter(id => id !== classroomId)
        : [...prev, classroomId],
    );
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    const startDate = parseDate(startDateStr);
    if (!startDate) {
      Alert.alert('Required', 'Please enter a valid start date/time.\nExample: 2026-04-15 14:00');
      return;
    }

    setSaving(true);
    try {
      const id = await createEvent({
        title: title.trim(),
        type,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        classroomId: selectedClassroomIds[0] || undefined,
        classroomIds: selectedClassroomIds.length > 0 ? selectedClassroomIds : undefined,
        startDate,
        endDate: parseDate(endDateStr) ?? undefined,
        creatorId: user.uid,
        rsvps: {},
        recurrenceRule: isRecurring ? recurrenceRule : undefined,
      });
      router.replace(`/events/${id}`);
    } catch (err) {
      Alert.alert('Error', 'Could not create event. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const selectedNames = classrooms
    .filter(c => selectedClassroomIds.includes(c.id))
    .map(c => c.name);

  return (
    <>
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
              <Ionicons name={icon} size={16} color={type === t ? '#fff' : colors.gray} />
              <Text style={[styles.typeLabel, { color: type === t ? '#fff' : colors.gray }]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Start Date & Time *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="YYYY-MM-DD HH:MM  (e.g. 2026-04-15 14:00)"
          placeholderTextColor={colors.gray}
          value={startDateStr}
          onChangeText={setStartDateStr}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={[styles.label, { color: colors.text }]}>End Date & Time</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="YYYY-MM-DD HH:MM  (optional)"
          placeholderTextColor={colors.gray}
          value={endDateStr}
          onChangeText={setEndDateStr}
          keyboardType="numbers-and-punctuation"
        />

        <Text style={[styles.label, { color: colors.text }]}>Location</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="e.g. Room 204"
          placeholderTextColor={colors.gray}
          value={location}
          onChangeText={setLocation}
        />

        <Text style={[styles.label, { color: colors.text }]}>Classrooms</Text>
        <TouchableOpacity
          style={[styles.selectorBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowClassroomPicker(true)}
        >
          <Ionicons name="school-outline" size={18} color={colors.gray} />
          <Text style={[styles.selectorText, { color: selectedNames.length > 0 ? colors.text : colors.gray }]} numberOfLines={1}>
            {selectedNames.length > 0 ? selectedNames.join(', ') : 'Select classrooms (optional)'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={colors.gray} />
        </TouchableOpacity>

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

        {/* Recurring toggle */}
        <View style={[styles.recurRow, { backgroundColor: colors.surface }]}>
          <Ionicons name="repeat-outline" size={20} color={colors.primary} />
          <Text style={[styles.recurLabel, { color: colors.text }]}>Recurring Event</Text>
          <Switch
            value={isRecurring}
            onValueChange={setIsRecurring}
            trackColor={{ false: colors.gray, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>

        {isRecurring && (
          <View style={styles.recurrenceOptions}>
            {RECURRENCE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.recurChip,
                  recurrenceRule === opt.value
                    ? { backgroundColor: colors.primary }
                    : { backgroundColor: colors.surface },
                ]}
                onPress={() => setRecurrenceRule(opt.value)}
              >
                <Text style={[styles.recurChipText, { color: recurrenceRule === opt.value ? '#fff' : colors.gray }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: title.trim() ? colors.primary : colors.gray }]}
          onPress={handleCreate}
          disabled={!title.trim() || saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.createBtnText}>Create Event</Text>}
        </TouchableOpacity>
      </ScrollView>

      {/* Classroom picker modal */}
      <Modal
        visible={showClassroomPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClassroomPicker(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Classrooms</Text>
            <TouchableOpacity onPress={() => setShowClassroomPicker(false)}>
              <Text style={[styles.modalDone, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          {classrooms.length === 0 ? (
            <View style={styles.modalEmpty}>
              <Text style={[styles.modalEmptyText, { color: colors.gray }]}>No classrooms found.</Text>
            </View>
          ) : (
            <FlatList
              data={classrooms}
              keyExtractor={c => c.id}
              renderItem={({ item }) => {
                const selected = selectedClassroomIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.modalRow, { borderBottomColor: colors.border }]}
                    onPress={() => toggleClassroom(item.id)}
                  >
                    <Ionicons name="school-outline" size={20} color={colors.primary} />
                    <Text style={[styles.modalRowText, { color: colors.text }]}>{item.name}</Text>
                    {selected && <Ionicons name="checkmark-circle" size={22} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  multiline: { height: 100 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  typeLabel: { fontSize: 13, fontWeight: '500' },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  selectorText: { flex: 1, fontSize: 15 },
  recurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  recurLabel: { flex: 1, fontSize: 15 },
  recurrenceOptions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  recurChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  recurChipText: { fontSize: 13, fontWeight: '500' },
  createBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  modalDone: { fontSize: 16, fontWeight: '600' },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalRowText: { flex: 1, fontSize: 15 },
  modalEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalEmptyText: { fontSize: 15 },
});

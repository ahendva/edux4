// app/classrooms/[id]/manage.tsx — Edit classroom: name, subject, grade, description, archive
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../../context/ThemeContext';
import { getClassroom, updateClassroom } from '../../../services/firebase/collections/classrooms';

export default function ManageClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [isArchived, setIsArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const cls = await getClassroom(id);
      if (cls) {
        setName(cls.name);
        setSubject(cls.subject ?? '');
        setGrade(cls.grade ?? '');
        setDescription(cls.description ?? '');
        setIsArchived(cls.isArchived ?? false);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const handleSave = async () => {
    if (!id || !name.trim()) return;
    setSaving(true);
    try {
      await updateClassroom(id, {
        name: name.trim(),
        subject: subject.trim() || undefined,
        grade: grade.trim() || undefined,
        description: description.trim() || undefined,
        isArchived,
      });
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Could not save changes.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.label, { color: colors.text }]}>Classroom Name *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={name}
        onChangeText={setName}
        placeholder="Classroom name"
        placeholderTextColor={colors.gray}
      />

      <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={subject}
        onChangeText={setSubject}
        placeholder="e.g. Mathematics"
        placeholderTextColor={colors.gray}
      />

      <Text style={[styles.label, { color: colors.text }]}>Grade Level</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={grade}
        onChangeText={setGrade}
        placeholder="e.g. Grade 5"
        placeholderTextColor={colors.gray}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Classroom description"
        placeholderTextColor={colors.gray}
        multiline
        textAlignVertical="top"
      />

      <View style={[styles.switchRow, { backgroundColor: colors.surface }]}>
        <Text style={[styles.switchLabel, { color: colors.text }]}>Archive Classroom</Text>
        <Switch
          value={isArchived}
          onValueChange={setIsArchived}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor="#fff"
        />
      </View>

      <TouchableOpacity
        style={[styles.saveBtn, { backgroundColor: name.trim() ? colors.primary : colors.gray }]}
        onPress={handleSave}
        disabled={!name.trim() || saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  multiline: { height: 100 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 12, marginTop: 16 },
  switchLabel: { fontSize: 15, fontWeight: '500' },
  saveBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

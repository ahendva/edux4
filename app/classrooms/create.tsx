// app/classrooms/create.tsx — Create classroom form: name, subject, grade, description
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createClassroom } from '../../services/firebase/collections/classrooms';

export default function CreateClassroomScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!user) return;
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a classroom name.');
      return;
    }
    setSaving(true);
    try {
      const id = await createClassroom({
        name: name.trim(),
        subject: subject.trim() || undefined,
        grade: grade.trim() || undefined,
        description: description.trim() || undefined,
        teacherId: user.uid,
        participantIds: [user.uid],
        studentIds: [],
      });
      router.replace(`/classrooms/${id}`);
    } catch (err) {
      Alert.alert('Error', 'Could not create classroom. Please try again.');
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
      <Text style={[styles.label, { color: colors.text }]}>Classroom Name *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Math — Period 3"
        placeholderTextColor={colors.gray}
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: colors.text }]}>Subject</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Mathematics, Science"
        placeholderTextColor={colors.gray}
        value={subject}
        onChangeText={setSubject}
      />

      <Text style={[styles.label, { color: colors.text }]}>Grade Level</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Grade 5, 10th Grade"
        placeholderTextColor={colors.gray}
        value={grade}
        onChangeText={setGrade}
      />

      <Text style={[styles.label, { color: colors.text }]}>Description</Text>
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Briefly describe this classroom..."
        placeholderTextColor={colors.gray}
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.createBtn, { backgroundColor: name.trim() ? colors.primary : colors.gray }]}
        onPress={handleCreate}
        disabled={!name.trim() || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createBtnText}>Create Classroom</Text>
        )}
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
  createBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

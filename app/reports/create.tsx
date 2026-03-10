// app/reports/create.tsx — Create progress report: student picker, term, subject grades, comments, publish
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createReport, publishReport } from '../../services/firebase/collections/progressReports';
import { SubjectGrade } from '../../services/firebase/schema';

export default function CreateReportScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [studentId, setStudentId] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [term, setTerm] = useState('');
  const [comments, setComments] = useState('');
  const [grades, setGrades] = useState<SubjectGrade[]>([
    { subject: '', grade: '', score: undefined, comments: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [publishNow, setPublishNow] = useState(false);

  const updateGrade = (index: number, field: keyof SubjectGrade, value: string) => {
    setGrades(prev => prev.map((g, i) => {
      if (i !== index) return g;
      if (field === 'score') return { ...g, score: value ? Number(value) : undefined };
      return { ...g, [field]: value };
    }));
  };

  const addGrade = () => {
    setGrades(prev => [...prev, { subject: '', grade: '', score: undefined, comments: '' }]);
  };

  const removeGrade = (index: number) => {
    if (grades.length === 1) return;
    setGrades(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (andPublish = false) => {
    if (!user) return;
    if (!studentId.trim()) { Alert.alert('Required', 'Please enter a student ID.'); return; }
    if (!classroomId.trim()) { Alert.alert('Required', 'Please enter a classroom ID.'); return; }
    if (!term.trim()) { Alert.alert('Required', 'Please enter a term (e.g. Q1 2026).'); return; }

    const validGrades = grades.filter(g => g.subject.trim() && g.grade.trim());
    if (validGrades.length === 0) { Alert.alert('Required', 'Add at least one subject grade.'); return; }

    setSaving(true);
    try {
      const id = await createReport({
        studentId: studentId.trim(),
        classroomId: classroomId.trim(),
        teacherId: user.uid,
        term: term.trim(),
        grades: validGrades,
        comments: comments.trim() || undefined,
        isPublished: false,
      });
      if (andPublish) {
        await publishReport(id);
      }
      router.replace(`/reports/${id}`);
    } catch (err) {
      Alert.alert('Error', 'Could not save report. Please try again.');
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
      <Text style={[styles.label, { color: colors.text }]}>Student ID *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Enter student ID"
        placeholderTextColor={colors.gray}
        value={studentId}
        onChangeText={setStudentId}
      />

      <Text style={[styles.label, { color: colors.text }]}>Classroom ID *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Enter classroom ID"
        placeholderTextColor={colors.gray}
        value={classroomId}
        onChangeText={setClassroomId}
      />

      <Text style={[styles.label, { color: colors.text }]}>Term *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="e.g. Q1 2026, Semester 1"
        placeholderTextColor={colors.gray}
        value={term}
        onChangeText={setTerm}
      />

      {/* Subject Grades */}
      <View style={styles.gradesHeader}>
        <Text style={[styles.label, { color: colors.text, marginTop: 0 }]}>Subject Grades</Text>
        <TouchableOpacity onPress={addGrade} style={[styles.addGradeBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addGradeBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {grades.map((g, i) => (
        <View key={i} style={[styles.gradeRow, { backgroundColor: colors.surface }]}>
          <View style={styles.gradeInputs}>
            <TextInput
              style={[styles.inputSmall, { color: colors.text, borderColor: colors.border, flex: 2 }]}
              placeholder="Subject"
              placeholderTextColor={colors.gray}
              value={g.subject}
              onChangeText={v => updateGrade(i, 'subject', v)}
            />
            <TextInput
              style={[styles.inputSmall, { color: colors.text, borderColor: colors.border, width: 60 }]}
              placeholder="Grade"
              placeholderTextColor={colors.gray}
              value={g.grade}
              onChangeText={v => updateGrade(i, 'grade', v)}
              maxLength={3}
            />
            <TextInput
              style={[styles.inputSmall, { color: colors.text, borderColor: colors.border, width: 60 }]}
              placeholder="Score"
              placeholderTextColor={colors.gray}
              value={g.score !== undefined ? String(g.score) : ''}
              onChangeText={v => updateGrade(i, 'score', v)}
              keyboardType="numeric"
              maxLength={3}
            />
            {grades.length > 1 && (
              <TouchableOpacity onPress={() => removeGrade(i)}>
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.inputSmall, { color: colors.text, borderColor: colors.border, marginTop: 6 }]}
            placeholder="Subject comments (optional)"
            placeholderTextColor={colors.gray}
            value={g.comments ?? ''}
            onChangeText={v => updateGrade(i, 'comments', v)}
          />
        </View>
      ))}

      <Text style={[styles.label, { color: colors.text }]}>Overall Teacher Comments</Text>
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Overall notes for the student..."
        placeholderTextColor={colors.gray}
        value={comments}
        onChangeText={setComments}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.draftBtn, { borderColor: colors.primary }]}
          onPress={() => handleSave(false)}
          disabled={saving}
        >
          {saving && !publishNow ? <ActivityIndicator color={colors.primary} /> : (
            <Text style={[styles.draftBtnText, { color: colors.primary }]}>Save Draft</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.publishBtn, { backgroundColor: colors.success }]}
          onPress={() => { setPublishNow(true); handleSave(true); }}
          disabled={saving}
        >
          {saving && publishNow ? <ActivityIndicator color="#fff" /> : (
            <Text style={styles.publishBtnText}>Save & Publish</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  label: { fontSize: 13, fontWeight: '600', marginTop: 16, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 15 },
  multiline: { height: 100 },
  gradesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  addGradeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addGradeBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  gradeRow: { padding: 12, borderRadius: 10, marginBottom: 8 },
  gradeInputs: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputSmall: { borderWidth: 1, borderRadius: 8, padding: 8, fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  draftBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
  draftBtnText: { fontSize: 15, fontWeight: '700' },
  publishBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

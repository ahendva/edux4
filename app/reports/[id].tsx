// app/reports/[id].tsx — View report: student, period, subject grades table, comments, publish
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getReport, publishReport } from '../../services/firebase/collections/progressReports';
import { ProgressReport } from '../../services/firebase/schema';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [report, setReport] = useState<ProgressReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const r = await getReport(id);
      setReport(r);
      if (r) navigation.setOptions({ title: `Report — ${r.term}` });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async () => {
    if (!id) return;
    Alert.alert('Publish Report', 'This will make the report visible to parents. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Publish',
        onPress: async () => {
          setPublishing(true);
          try {
            await publishReport(id);
            setReport(prev => prev ? { ...prev, isPublished: true, publishedAt: Date.now() } : prev);
          } catch (err) {
            Alert.alert('Error', 'Could not publish report.');
          } finally {
            setPublishing(false);
          }
        },
      },
    ]);
  };

  const gradeColor = (grade: string) => {
    const upper = grade.toUpperCase();
    if (upper === 'A' || upper === 'A+' || upper === 'A-') return colors.success;
    if (upper.startsWith('B')) return colors.primary;
    if (upper.startsWith('C')) return colors.warning;
    return colors.danger;
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Report not found.</Text>
      </View>
    );
  }

  const isTeacher = userProfile?.role === 'teacher' && report.teacherId === user?.uid;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <Ionicons name="document-text" size={32} color="rgba(255,255,255,0.8)" />
        <Text style={styles.headerTitle}>{report.term}</Text>
        <View style={[
          styles.statusBadge,
          { backgroundColor: report.isPublished ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.15)' },
        ]}>
          <Text style={styles.statusText}>
            {report.isPublished ? '✓ Published' : 'Draft'}
          </Text>
        </View>
      </View>

      {/* Meta */}
      <View style={[styles.metaCard, { backgroundColor: colors.surface }]}>
        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={16} color={colors.gray} />
          <Text style={[styles.metaLabel, { color: colors.gray }]}>Student</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{report.studentId}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="school-outline" size={16} color={colors.gray} />
          <Text style={[styles.metaLabel, { color: colors.gray }]}>Classroom</Text>
          <Text style={[styles.metaValue, { color: colors.text }]}>{report.classroomId}</Text>
        </View>
        {report.publishedAt && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.gray} />
            <Text style={[styles.metaLabel, { color: colors.gray }]}>Published</Text>
            <Text style={[styles.metaValue, { color: colors.text }]}>
              {new Date(report.publishedAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>

      {/* Grades table */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Grades</Text>
        <View style={[styles.gradesTable, { backgroundColor: colors.surface }]}>
          <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderText, { color: colors.gray, flex: 2 }]}>Subject</Text>
            <Text style={[styles.tableHeaderText, { color: colors.gray }]}>Grade</Text>
            <Text style={[styles.tableHeaderText, { color: colors.gray }]}>Score</Text>
          </View>
          {report.grades.map((g, i) => (
            <View
              key={i}
              style={[
                styles.tableRow,
                i < report.grades.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
              ]}
            >
              <Text style={[styles.tableCell, { color: colors.text, flex: 2 }]}>{g.subject}</Text>
              <Text style={[styles.gradeCell, { color: gradeColor(g.grade) }]}>{g.grade}</Text>
              <Text style={[styles.tableCell, { color: colors.gray }]}>
                {g.score !== undefined ? `${g.score}%` : '—'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Subject comments */}
      {report.grades.some(g => g.comments) && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Subject Notes</Text>
          {report.grades.filter(g => g.comments).map((g, i) => (
            <View key={i} style={[styles.commentCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.commentSubject, { color: colors.primary }]}>{g.subject}</Text>
              <Text style={[styles.commentText, { color: colors.text }]}>{g.comments}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Overall comments */}
      {report.comments && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Teacher Comments</Text>
          <View style={[styles.commentCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.commentText, { color: colors.text }]}>{report.comments}</Text>
          </View>
        </View>
      )}

      {/* Publish button (teacher only, unpublished) */}
      {isTeacher && !report.isPublished && (
        <TouchableOpacity
          style={[styles.publishBtn, { backgroundColor: colors.success }]}
          onPress={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={styles.publishBtnText}>Publish Report</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { alignItems: 'center', padding: 24, margin: 16, borderRadius: 16, gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  metaCard: { marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 10, gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: { fontSize: 13, width: 80 },
  metaValue: { fontSize: 13, fontWeight: '500', flex: 1 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  gradesTable: { borderRadius: 12, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  tableHeaderText: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, width: 60 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 14, paddingVertical: 10 },
  tableCell: { fontSize: 14, width: 60 },
  gradeCell: { fontSize: 14, fontWeight: '700', width: 60 },
  commentCard: { padding: 14, borderRadius: 12, marginBottom: 6 },
  commentSubject: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  commentText: { fontSize: 14, lineHeight: 20 },
  publishBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 16, borderRadius: 12 },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

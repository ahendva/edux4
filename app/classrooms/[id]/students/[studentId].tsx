// app/classrooms/[id]/students/[studentId].tsx — Student detail: grades, attendance, parent contact
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../../context/ThemeContext';
import { getReportsForStudent } from '../../../../services/firebase/collections/progressReports';
import { ProgressReport } from '../../../../services/firebase/schema';

export default function StudentDetailScreen() {
  const { id: classroomId, studentId } = useLocalSearchParams<{ id: string; studentId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const data = await getReportsForStudent(studentId);
      setReports(data.filter(r => r.isPublished));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    navigation.setOptions({ title: `Student: ${studentId}` });
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Student header */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={36} color="rgba(255,255,255,0.8)" />
        </View>
        <Text style={styles.studentIdText}>{studentId}</Text>
        <Text style={styles.studentSub}>Student · {classroomId}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/messages/new')}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>Message Parent</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.push('/reports/create')}
        >
          <Ionicons name="document-text-outline" size={20} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.text }]}>New Report</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Reports */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Progress Reports ({reports.length})
        </Text>
        {reports.length === 0 ? (
          <Text style={[styles.empty, { color: colors.gray }]}>No published reports yet.</Text>
        ) : (
          reports.map(report => (
            <TouchableOpacity
              key={report.id}
              style={[styles.reportCard, { backgroundColor: colors.surface }]}
              onPress={() => router.push(`/reports/${report.id}`)}
            >
              <View style={styles.reportHeader}>
                <Text style={[styles.reportTerm, { color: colors.text }]}>{report.term}</Text>
                <View style={[styles.publishedBadge, { backgroundColor: colors.success + '22' }]}>
                  <Text style={[styles.publishedText, { color: colors.success }]}>Published</Text>
                </View>
              </View>
              {report.grades.slice(0, 3).map((g, i) => (
                <View key={i} style={styles.gradeRow}>
                  <Text style={[styles.gradeSubject, { color: colors.gray }]}>{g.subject}</Text>
                  <Text style={[styles.gradeValue, { color: colors.text }]}>{g.grade}</Text>
                </View>
              ))}
              {report.grades.length > 3 && (
                <Text style={[styles.moreGrades, { color: colors.primary }]}>
                  +{report.grades.length - 3} more subjects
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { alignItems: 'center', padding: 24, margin: 16, borderRadius: 16 },
  avatarLarge: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  studentIdText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  studentSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '500' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  empty: { fontSize: 14 },
  reportCard: { padding: 14, borderRadius: 12, marginBottom: 8 },
  reportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reportTerm: { flex: 1, fontWeight: '600', fontSize: 15 },
  publishedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  publishedText: { fontSize: 11, fontWeight: '600' },
  gradeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  gradeSubject: { fontSize: 13 },
  gradeValue: { fontSize: 13, fontWeight: '600' },
  moreGrades: { fontSize: 12, marginTop: 4 },
});

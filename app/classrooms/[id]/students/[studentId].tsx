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
import { getStudent } from '../../../../services/firebase/collections/students';
import { getReportsForStudent } from '../../../../services/firebase/collections/progressReports';
import { getUsersByIds } from '../../../../services/firebase/collections/users';
import { Student, ProgressReport, UserProfile } from '../../../../services/firebase/schema';

export default function StudentDetailScreen() {
  const { id: classroomId, studentId } = useLocalSearchParams<{ id: string; studentId: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { colors } = useTheme();

  const [student, setStudent] = useState<Student | null>(null);
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!studentId) return;
    try {
      const [stud, reps] = await Promise.all([
        getStudent(studentId),
        getReportsForStudent(studentId),
      ]);
      setStudent(stud);
      setReports(reps.filter(r => r.isPublished));
      if (stud?.parentIds?.length) {
        const parentProfiles = await getUsersByIds(stud.parentIds);
        setParents(parentProfiles);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (student) {
      navigation.setOptions({ title: `${student.firstName} ${student.lastName}` });
    }
  }, [student]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = student
    ? `${student.firstName} ${student.lastName}`
    : studentId;

  const attendance = student?.attendanceSummary;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Student header */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarInitial}>
            {(student?.firstName || 'S')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.studentName}>{displayName}</Text>
        {student?.grade ? (
          <Text style={styles.studentSub}>Grade {student.grade}</Text>
        ) : null}
      </View>

      {/* Attendance Summary */}
      {attendance && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Attendance</Text>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNum, { color: colors.success }]}>{attendance.present}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Present</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNum, { color: colors.danger }]}>{attendance.absent}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Absent</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNum, { color: colors.warning }]}>{attendance.tardy}</Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Tardy</Text>
            </View>
            <View style={styles.attendanceStat}>
              <Text style={[styles.statNum, { color: colors.primary }]}>
                {attendance.present + attendance.absent + attendance.tardy > 0
                  ? Math.round((attendance.present / (attendance.present + attendance.absent + attendance.tardy)) * 100)
                  : 0}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.gray }]}>Rate</Text>
            </View>
          </View>
        </View>
      )}

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

      {/* Parents */}
      {parents.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Parents / Guardians</Text>
          {parents.map(parent => (
            <TouchableOpacity
              key={parent.id}
              style={styles.parentRow}
              onPress={() => router.push('/messages/new')}
            >
              <View style={[styles.parentAvatar, { backgroundColor: `${colors.primary}18` }]}>
                <Ionicons name="person" size={16} color={colors.primary} />
              </View>
              <View style={styles.parentInfo}>
                <Text style={[styles.parentName, { color: colors.text }]}>{parent.displayName}</Text>
                <Text style={[styles.parentEmail, { color: colors.gray }]}>{parent.email}</Text>
              </View>
              <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Progress Reports */}
      <View style={[styles.card, { backgroundColor: 'transparent', paddingHorizontal: 16 }]}>
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
                <View style={[styles.publishedBadge, { backgroundColor: `${colors.success}22` }]}>
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

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { alignItems: 'center', padding: 28, margin: 16, borderRadius: 16 },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarInitial: { fontSize: 28, fontWeight: '700', color: '#fff' },
  studentName: { fontSize: 20, fontWeight: '700', color: '#fff' },
  studentSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  card: { padding: 16, marginHorizontal: 16, marginBottom: 12, borderRadius: 16 },
  attendanceRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 4 },
  attendanceStat: { alignItems: 'center', gap: 4 },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionLabel: { fontSize: 13, fontWeight: '500' },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  parentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  parentInfo: { flex: 1 },
  parentName: { fontSize: 14, fontWeight: '600' },
  parentEmail: { fontSize: 12, marginTop: 1 },
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

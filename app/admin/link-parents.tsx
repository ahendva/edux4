// app/admin/link-parents.tsx — Admin: manually link guardian email to parent account
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { firestore } from '../../services/firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, arrayUnion, query, where } from 'firebase/firestore';
import { getUsersByRole } from '../../services/firebase/collections/users';
import { UserProfile, Student } from '../../services/firebase/schema';

interface UnlinkedGuardian {
  studentId: string;
  studentName: string;
  guardianEmail: string;
  psGuardianId: string;
}

export default function LinkParentsScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const [unlinked, setUnlinked] = useState<UnlinkedGuardian[]>([]);
  const [parents, setParents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null); // studentId being linked

  // Search state for the parent picker modal
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuardian, setSelectedGuardian] = useState<UnlinkedGuardian | null>(null);

  useEffect(() => {
    navigation.setOptions({ title: 'Link Parents' });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [studentsSnap, parentUsers] = await Promise.all([
        getDocs(collection(firestore, 'students')),
        getUsersByRole('parent'),
      ]);
      setParents(parentUsers);

      const parentEmails = new Set(parentUsers.map(p => p.email.toLowerCase()));

      // Find students with psGuardianId but no parentIds match any parent account
      const unlinkedList: UnlinkedGuardian[] = [];
      studentsSnap.docs.forEach(d => {
        const student = { id: d.id, ...d.data() } as Student & { guardianEmail?: string };
        if (!student.psGuardianId) return;
        const gEmail = (student.guardianEmail ?? '').toLowerCase();
        if (!gEmail) return;
        // If no parent with this email, or the parent's account exists but isn't linked
        const linkedParent = parentUsers.find(p => p.email.toLowerCase() === gEmail);
        const alreadyLinked = linkedParent && student.parentIds?.includes(linkedParent.id);
        if (!alreadyLinked) {
          unlinkedList.push({
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            guardianEmail: gEmail,
            psGuardianId: student.psGuardianId,
          });
        }
      });

      setUnlinked(unlinkedList);
    } catch (err) {
      console.error('Error loading guardian data:', err);
      Alert.alert('Error', 'Failed to load guardian data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAutoLink = async (guardian: UnlinkedGuardian) => {
    const matchingParent = parents.find(p => p.email.toLowerCase() === guardian.guardianEmail.toLowerCase());
    if (!matchingParent) {
      Alert.alert(
        'No Matching Account',
        `No parent account found with email "${guardian.guardianEmail}". Select a parent manually.`,
      );
      setSelectedGuardian(guardian);
      return;
    }
    await doLink(guardian.studentId, matchingParent.id, guardian.studentName, matchingParent.displayName);
  };

  const handleManualLink = (guardian: UnlinkedGuardian) => {
    setSelectedGuardian(guardian);
    setSearchQuery('');
  };

  const doLink = async (studentId: string, parentUid: string, studentName: string, parentName: string) => {
    setLinking(studentId);
    setSelectedGuardian(null);
    try {
      const studentRef = doc(firestore, 'students', studentId);
      const parentRef = doc(firestore, 'users', parentUid);
      await Promise.all([
        updateDoc(studentRef, { parentIds: arrayUnion(parentUid), updatedAt: Date.now() }),
        updateDoc(parentRef, { children: arrayUnion(studentId), updatedAt: Date.now() }),
      ]);
      Alert.alert('Linked', `${parentName} linked to ${studentName}.`);
      await loadData();
    } catch (err) {
      Alert.alert('Error', `Failed to link: ${(err as Error).message}`);
    } finally {
      setLinking(null);
    }
  };

  const filteredParents = parents.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      p.displayName.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // If showing parent picker for a specific guardian
  if (selectedGuardian) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.pickerHeader, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => setSelectedGuardian(null)}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.pickerHeaderText}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Select Parent</Text>
            <Text style={[styles.pickerSubtitle, { color: colors.gray }]} numberOfLines={1}>
              for {selectedGuardian.studentName}
            </Text>
          </View>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.gray} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by name or email…"
            placeholderTextColor={colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>

        <FlatList
          data={filteredParents}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.parentRow, { backgroundColor: colors.surface }]}
              onPress={() => doLink(selectedGuardian.studentId, item.id, selectedGuardian.studentName, item.displayName)}
            >
              <View style={[styles.avatar, { backgroundColor: `${colors.primary}20` }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {item.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.parentInfo}>
                <Text style={[styles.parentName, { color: colors.text }]}>{item.displayName}</Text>
                <Text style={[styles.parentEmail, { color: colors.gray }]}>{item.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyPicker}>
              <Ionicons name="people-outline" size={36} color={colors.gray} />
              <Text style={[styles.emptyText, { color: colors.gray }]}>No parent accounts found</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
        />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Summary */}
      <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
        <Text style={styles.summaryTitle}>Guardian Linking</Text>
        <Text style={styles.summaryCount}>{unlinked.length}</Text>
        <Text style={styles.summaryLabel}>
          {unlinked.length === 1 ? 'guardian needs linking' : 'guardians need linking'}
        </Text>
      </View>

      {unlinked.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colors.accent} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>All linked!</Text>
          <Text style={[styles.emptyText, { color: colors.gray }]}>
            All guardian emails are matched to parent accounts.
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Unmatched Guardians</Text>
          {unlinked.map(guardian => {
            const matchingParent = parents.find(
              p => p.email.toLowerCase() === guardian.guardianEmail.toLowerCase(),
            );
            const isLinking = linking === guardian.studentId;

            return (
              <View key={`${guardian.studentId}-${guardian.psGuardianId}`} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.studentBadge, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name="person-outline" size={16} color={colors.primary} />
                    <Text style={[styles.studentName, { color: colors.primary }]} numberOfLines={1}>
                      {guardian.studentName}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.guardianEmail, { color: colors.text }]}>{guardian.guardianEmail}</Text>
                {matchingParent ? (
                  <View style={[styles.matchBox, { backgroundColor: `${colors.accent}15` }]}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={colors.accent} />
                    <Text style={[styles.matchText, { color: colors.accent }]} numberOfLines={1}>
                      Match: {matchingParent.displayName}
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.matchBox, { backgroundColor: `${colors.danger}15` }]}>
                    <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
                    <Text style={[styles.matchText, { color: colors.danger }]}>
                      No account with this email
                    </Text>
                  </View>
                )}
                <View style={styles.cardActions}>
                  {matchingParent && (
                    <TouchableOpacity
                      style={[styles.linkBtn, { backgroundColor: colors.accent }]}
                      onPress={() => handleAutoLink(guardian)}
                      disabled={isLinking}
                    >
                      {isLinking
                        ? <ActivityIndicator color="#fff" size="small" />
                        : <><Ionicons name="link-outline" size={16} color="#fff" /><Text style={styles.linkBtnText}>Auto-Link</Text></>
                      }
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.linkBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleManualLink(guardian)}
                    disabled={isLinking}
                  >
                    <Ionicons name="people-outline" size={16} color="#fff" />
                    <Text style={styles.linkBtnText}>Select Parent</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  summaryCard: {
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryTitle: { color: '#ffffffcc', fontSize: 14, fontWeight: '600' },
  summaryCount: { color: '#fff', fontSize: 48, fontWeight: '900', marginVertical: 4 },
  summaryLabel: { color: '#ffffffcc', fontSize: 13 },

  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 10 },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row' },
  studentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  studentName: { fontSize: 13, fontWeight: '700' },
  guardianEmail: { fontSize: 14, fontWeight: '500' },
  matchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  matchText: { fontSize: 13, fontWeight: '600', flex: 1 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  linkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  linkBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  emptyCard: {
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyText: { fontSize: 14, textAlign: 'center' },

  // Parent picker
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    paddingTop: 20,
  },
  pickerHeaderText: { flex: 1 },
  pickerTitle: { fontSize: 16, fontWeight: '700' },
  pickerSubtitle: { fontSize: 13 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  parentInfo: { flex: 1 },
  parentName: { fontSize: 15, fontWeight: '600' },
  parentEmail: { fontSize: 13, marginTop: 2 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 72 },
  emptyPicker: { alignItems: 'center', padding: 48, gap: 8 },
});

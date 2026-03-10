// app/events/[id].tsx — Event detail: title, description, date/time, location, RSVP, attendees
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
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getEvent, updateRSVP, deleteEvent } from '../../services/firebase/collections/events';
import { CalendarEvent, RSVPStatus, EventType } from '../../services/firebase/schema';

const EVENT_ICONS: Record<EventType, keyof typeof Ionicons.glyphMap> = {
  meeting: 'people-outline',
  deadline: 'alert-circle-outline',
  event: 'star-outline',
  holiday: 'sunny-outline',
};

const RSVP_OPTIONS: { status: RSVPStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'going', label: 'Going', icon: 'checkmark-circle' },
  { status: 'maybe', label: 'Maybe', icon: 'help-circle' },
  { status: 'not_going', label: 'Not Going', icon: 'close-circle' },
];

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const e = await getEvent(id);
      setEvent(e);
      if (e) navigation.setOptions({ title: e.title });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleRSVP = async (status: RSVPStatus) => {
    if (!id || !user || !event) return;
    setRsvpLoading(true);
    try {
      await updateRSVP(id, user.uid, status);
      setEvent(prev => prev ? { ...prev, rsvps: { ...prev.rsvps, [user.uid]: status } } : prev);
    } catch (err) {
      Alert.alert('Error', 'Could not update RSVP.');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(id);
          router.back();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Event not found.</Text>
      </View>
    );
  }

  const myRsvp = user ? event.rsvps[user.uid] : undefined;
  const isCreator = event.creatorId === user?.uid;
  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'admin';

  const goingCount = Object.values(event.rsvps).filter(r => r === 'going').length;
  const maybeCount = Object.values(event.rsvps).filter(r => r === 'maybe').length;

  const formatDate = (ts: number) => new Date(ts).toLocaleString([], {
    weekday: 'long', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.primary }]}>
        <Ionicons name={EVENT_ICONS[event.type as EventType]} size={36} color="rgba(255,255,255,0.8)" />
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Text style={styles.typeText}>{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</Text>
        </View>
      </View>

      {/* Details */}
      <View style={[styles.detailsCard, { backgroundColor: colors.surface }]}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} />
          <View>
            <Text style={[styles.detailLabel, { color: colors.gray }]}>Start</Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(event.startDate)}</Text>
          </View>
        </View>
        {event.endDate && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={18} color={colors.primary} />
            <View>
              <Text style={[styles.detailLabel, { color: colors.gray }]}>End</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{formatDate(event.endDate)}</Text>
            </View>
          </View>
        )}
        {event.location && (
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View>
              <Text style={[styles.detailLabel, { color: colors.gray }]}>Location</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{event.location}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Description */}
      {event.description && (
        <View style={[styles.descCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.descText, { color: colors.text }]}>{event.description}</Text>
        </View>
      )}

      {/* RSVP */}
      <View style={styles.rsvpSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          RSVP · {goingCount} going · {maybeCount} maybe
        </Text>
        <View style={styles.rsvpRow}>
          {RSVP_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.status}
              style={[
                styles.rsvpBtn,
                myRsvp === opt.status
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surface },
              ]}
              onPress={() => handleRSVP(opt.status)}
              disabled={rsvpLoading}
            >
              <Ionicons
                name={opt.icon}
                size={18}
                color={myRsvp === opt.status ? colors.onPrimary : colors.gray}
              />
              <Text style={[styles.rsvpLabel, { color: myRsvp === opt.status ? colors.onPrimary : colors.gray }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Delete (creator / teacher only) */}
      {(isCreator || isTeacher) && (
        <TouchableOpacity
          style={[styles.deleteBtn, { borderColor: colors.danger }]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={[styles.deleteBtnText, { color: colors.danger }]}>Delete Event</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { alignItems: 'center', padding: 28, margin: 16, borderRadius: 16, gap: 8 },
  eventTitle: { fontSize: 20, fontWeight: '700', color: '#fff', textAlign: 'center' },
  typeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  typeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  detailsCard: { marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 10, gap: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  detailLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  detailValue: { fontSize: 14, fontWeight: '500' },
  descCard: { marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 10 },
  descText: { fontSize: 15, lineHeight: 22 },
  rsvpSection: { marginHorizontal: 16, marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 10 },
  rsvpRow: { flexDirection: 'row', gap: 10 },
  rsvpBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 12 },
  rsvpLabel: { fontSize: 13, fontWeight: '500' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, borderRadius: 12, borderWidth: 1 },
  deleteBtnText: { fontSize: 15, fontWeight: '600' },
});

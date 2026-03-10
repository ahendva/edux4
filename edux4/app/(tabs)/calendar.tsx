// app/(tabs)/calendar.tsx — Calendar view
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUpcomingEvents } from '../../services/firebase/collections/events';
import { CalendarEvent } from '../../services/firebase/schema';

export default function CalendarScreen() {
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    if (user) {
      getUpcomingEvents(user.uid, 20).then(setEvents).catch(console.error);
    }
  }, [user]);

  const typeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return 'people';
      case 'deadline': return 'alert-circle';
      case 'holiday': return 'sunny';
      default: return 'calendar';
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'meeting': return colors.primary;
      case 'deadline': return colors.danger;
      case 'holiday': return colors.accent;
      default: return colors.warning;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Upcoming Events</Text>
      </View>

      {events.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.gray} />
          <Text style={[styles.emptyText, { color: colors.gray }]}>No upcoming events</Text>
        </View>
      ) : (
        events.map((event) => (
          <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.eventIcon, { backgroundColor: `${typeColor(event.type)}20` }]}>
              <Ionicons name={typeIcon(event.type) as any} size={22} color={typeColor(event.type)} />
            </View>
            <View style={styles.eventInfo}>
              <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
              <Text style={[styles.eventDate, { color: colors.gray }]}>
                {new Date(event.startDate).toLocaleDateString()} at {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {event.location && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={14} color={colors.gray} />
                  <Text style={[styles.locationText, { color: colors.gray }]}>{event.location}</Text>
                </View>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  eventCard: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, padding: 16, borderRadius: 12, gap: 12 },
  eventIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 15, fontWeight: '600' },
  eventDate: { fontSize: 13, marginTop: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { fontSize: 12 },
});

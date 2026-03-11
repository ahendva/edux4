// app/(tabs)/calendar.tsx — Calendar with month view + event list
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { subscribeToUpcomingEvents } from '../../services/firebase/collections/events';
import { getUserClassrooms } from '../../services/firebase/collections/classrooms';
import { CalendarEvent } from '../../services/firebase/schema';

const typeColor = (type: string, primary: string, danger: string, accent: string, warning: string) => {
  switch (type) {
    case 'meeting': return primary;
    case 'deadline': return danger;
    case 'holiday': return accent;
    default: return warning;
  }
};

const typeIcon = (type: string): React.ComponentProps<typeof Ionicons>['name'] => {
  switch (type) {
    case 'meeting': return 'people';
    case 'deadline': return 'alert-circle';
    case 'holiday': return 'sunny';
    default: return 'calendar';
  }
};

export default function CalendarScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { colors } = useTheme();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    if (!user) return;

    let unsub: (() => void) | null = null;

    getUserClassrooms(user.uid).then(classrooms => {
      const classroomIds = classrooms.map(c => c.id);
      unsub = subscribeToUpcomingEvents(classroomIds, setEvents);
    });

    return () => { unsub?.(); };
  }, [user]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Re-trigger by resetting (listener handles the data)
    setTimeout(() => setRefreshing(false), 800);
  };

  // Build marked dates for the calendar
  const markedDates: Record<string, { dots: Array<{ color: string }>; selected?: boolean; selectedColor?: string }> = {};

  events.forEach(event => {
    const dateStr = new Date(event.startDate).toISOString().split('T')[0];
    const color = typeColor(event.type, colors.primary, colors.danger, colors.accent, colors.warning);
    if (!markedDates[dateStr]) {
      markedDates[dateStr] = { dots: [] };
    }
    if (markedDates[dateStr].dots.length < 3) {
      markedDates[dateStr].dots.push({ color });
    }
  });

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...(markedDates[selectedDate] || { dots: [] }),
      selected: true,
      selectedColor: colors.primary,
    };
  }

  const displayedEvents = selectedDate
    ? events.filter(e => new Date(e.startDate).toISOString().split('T')[0] === selectedDate)
    : events;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={(day: { dateString: string }) => {
          setSelectedDate(prev => (prev === day.dateString ? '' : day.dateString));
        }}
        theme={{
          backgroundColor: colors.background,
          calendarBackground: colors.surface,
          textSectionTitleColor: colors.gray,
          selectedDayBackgroundColor: colors.primary,
          selectedDayTextColor: '#fff',
          todayTextColor: colors.primary,
          dayTextColor: colors.text,
          arrowColor: colors.primary,
          monthTextColor: colors.text,
          textDisabledColor: colors.gray,
        }}
        style={styles.calendar}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {selectedDate && (
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              {new Date(selectedDate).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => setSelectedDate('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray} />
            </TouchableOpacity>
          </View>
        )}

        {displayedEvents.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={44} color={colors.gray} />
            <Text style={[styles.emptyText, { color: colors.gray }]}>No events</Text>
          </View>
        ) : (
          displayedEvents.map(event => {
            const color = typeColor(event.type, colors.primary, colors.danger, colors.accent, colors.warning);
            return (
              <TouchableOpacity
                key={event.id}
                style={[styles.card, { backgroundColor: colors.surface }]}
                onPress={() => router.push(`/events/${event.id}`)}
              >
                <View style={[styles.typeIcon, { backgroundColor: `${color}20` }]}>
                  <Ionicons name={typeIcon(event.type)} size={22} color={color} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.title, { color: colors.text }]}>{event.title}</Text>
                  <Text style={[styles.date, { color: colors.gray }]}>
                    {new Date(event.startDate).toLocaleDateString([], {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}{' '}
                    at{' '}
                    {new Date(event.startDate).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                  {event.location && (
                    <View style={styles.locRow}>
                      <Ionicons name="location-outline" size={13} color={colors.gray} />
                      <Text style={[styles.loc, { color: colors.gray }]}>{event.location}</Text>
                    </View>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray} />
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPad} />
      </ScrollView>

      {userProfile?.role === 'teacher' && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/events/create')}
          accessibilityLabel="Create event"
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  calendar: { borderRadius: 0 },
  list: { flex: 1, paddingHorizontal: 12 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  filterLabel: { fontSize: 15, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  typeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  eventInfo: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  date: { fontSize: 13, marginTop: 3 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 3 },
  loc: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 15, marginTop: 10 },
  bottomPad: { height: 100 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
});

import axios from 'axios';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text as ThemedText, View as ThemedView } from '@/components/Themed';

const SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard';
const COLORS = {
  background: '#0B0F0D',
  surface: '#151B17',
  surfaceRaised: '#1C241F',
  border: '#29332D',
  text: '#F3F4EF',
  muted: '#9AA59D',
  accent: '#D5F45B',
  danger: '#FF766D',
};

type Competitor = {
  athlete?: {
    displayName?: string;
    fullName?: string;
  };
};

type Competition = {
  competitors?: Competitor[];
  venue?: { fullName?: string };
  status?: { type?: { detail?: string } };
};

type FightEvent = {
  id: string;
  name: string;
  date?: string;
  competitions?: Competition[];
};

type ScoreboardResponse = {
  events?: FightEvent[];
};

function formatEventDate(value?: string) {
  if (!value) return 'Date to be announced';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date to be announced'
    : date.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
}

export default function FightCardScreen() {
  const [events, setEvents] = useState<FightEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadEvents = useCallback(async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError('');

    try {
      const response = await axios.get<ScoreboardResponse>(SCOREBOARD_URL, {
        params: { limit: 10 },
        timeout: 15000,
      });
      setEvents(response.data.events ?? []);
    } catch {
      setError('Fight data could not be loaded. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ThemedView style={styles.screen} lightColor={COLORS.background} darkColor={COLORS.background}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void loadEvents(true)}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>LIVE FROM THE OCTAGON</Text>
              <ThemedText style={styles.title} lightColor={COLORS.text} darkColor={COLORS.text}>
                Fight card
              </ThemedText>
            </View>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveLabel}>UFC</Text>
            </View>
          </View>

          <View style={styles.introCard}>
            <Text style={styles.introMark}>✳</Text>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>Know what’s next.</Text>
              <Text style={styles.introSubtitle}>
                Upcoming UFC events, pulled live from the scoreboard.
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>Upcoming events</Text>
            <Pressable
              onPress={() => void loadEvents(true)}
              disabled={isLoading || isRefreshing}
              accessibilityRole="button"
              accessibilityLabel="Refresh upcoming events"
            >
              <Text style={styles.refreshText}>REFRESH</Text>
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator color={COLORS.accent} />
              <Text style={styles.stateText}>Getting the latest fight data...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateCard}>
              <Text style={styles.errorTitle}>No connection to the fight desk</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable style={styles.retryButton} onPress={() => void loadEvents()}>
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : events.length === 0 ? (
            <View style={styles.stateCard}>
              <Text style={styles.stateText}>No upcoming events are listed right now.</Text>
            </View>
          ) : (
            events.map((event) => {
              const featuredBout = event.competitions?.[0];
              const fighters =
                featuredBout?.competitors
                  ?.map((competitor) => competitor.athlete?.displayName ?? competitor.athlete?.fullName)
                  .filter((name): name is string => Boolean(name))
                  .join('  VS  ') ?? '';
              const venue = featuredBout?.venue?.fullName ?? 'Venue to be announced';
              const status = featuredBout?.status?.type?.detail ?? 'Fight card';

              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventTopLine}>
                    <Text style={styles.eventTag}>UFC EVENT</Text>
                    <Text style={styles.eventStatus}>{status.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventDate}>{formatEventDate(event.date)}</Text>
                  <View style={styles.cardDivider} />
                  <Text style={styles.featuredLabel}>FEATURED BOUT</Text>
                  <Text style={styles.fighters}>
                    {fighters || 'Full fight card to be announced'}
                  </Text>
                  <Text style={styles.venue}>{venue}</Text>
                </View>
              );
            })
          )}

          <Text style={styles.attribution}>
            Event information is retrieved from ESPN’s public MMA scoreboard.
          </Text>
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, paddingHorizontal: 20 },
  content: { paddingBottom: 34 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  eyebrow: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.accent },
  liveLabel: { color: COLORS.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 17,
    padding: 17,
    marginBottom: 25,
  },
  introMark: { color: COLORS.background, fontSize: 30, fontWeight: '900', marginRight: 13 },
  introCopy: { flex: 1 },
  introTitle: { color: COLORS.background, fontSize: 16, fontWeight: '900' },
  introSubtitle: { color: '#354021', fontSize: 11, lineHeight: 16, marginTop: 3 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  refreshText: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  eventCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 17,
    marginBottom: 12,
  },
  eventTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventTag: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  eventStatus: { color: COLORS.muted, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  eventName: { color: COLORS.text, fontSize: 18, lineHeight: 24, fontWeight: '900', marginTop: 13 },
  eventDate: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  cardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 15 },
  featuredLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1.4 },
  fighters: { color: COLORS.text, fontSize: 14, lineHeight: 20, fontWeight: '800', marginTop: 6 },
  venue: { color: COLORS.muted, fontSize: 11, marginTop: 7 },
  stateCard: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
  },
  stateText: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 10 },
  errorTitle: { color: COLORS.text, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  errorText: { color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  retryButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginTop: 15,
  },
  retryButtonText: { color: COLORS.background, fontSize: 11, fontWeight: '900' },
  attribution: { color: COLORS.muted, fontSize: 9, textAlign: 'center', lineHeight: 15, marginTop: 8 },
});

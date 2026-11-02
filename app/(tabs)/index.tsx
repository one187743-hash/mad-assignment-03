import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text as ThemedText, View as ThemedView } from '@/components/Themed';

const STORAGE_KEY = '@corner/training-sessions-v1';
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

const DISCIPLINES = ['Striking', 'Grappling', 'Sparring', 'Conditioning'] as const;
type Discipline = (typeof DISCIPLINES)[number];
type Filter = 'All' | Discipline;

type TrainingSession = {
  id: string;
  title: string;
  discipline: Discipline;
  durationMinutes: number;
  notes: string;
  date: string;
};

type SessionDraft = {
  title: string;
  discipline: Discipline;
  duration: string;
  notes: string;
};

const EMPTY_DRAFT: SessionDraft = {
  title: '',
  discipline: 'Striking',
  duration: '60',
  notes: '',
};

function isTrainingSession(value: unknown): value is TrainingSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.id === 'string' &&
    typeof session.title === 'string' &&
    DISCIPLINES.includes(session.discipline as Discipline) &&
    typeof session.durationMinutes === 'number' &&
    typeof session.notes === 'string' &&
    typeof session.date === 'string'
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function TrainingLogScreen() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<TrainingSession | null>(null);
  const [draft, setDraft] = useState<SessionDraft>(EMPTY_DRAFT);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSessions() {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        const parsed: unknown = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(parsed) || !parsed.every(isTrainingSession)) {
          throw new Error('Stored training data is not in the expected format.');
        }
        if (active) setSessions(parsed);
      } catch {
        if (active) setMessage('Could not load your saved sessions. Your existing data was not changed.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadSessions();
    return () => {
      active = false;
    };
  }, []);

  const visibleSessions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return sessions.filter((session) => {
      const matchesFilter = filter === 'All' || session.discipline === filter;
      const matchesSearch =
        !query ||
        session.title.toLowerCase().includes(query) ||
        session.discipline.toLowerCase().includes(query) ||
        session.notes.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [filter, search, sessions]);

  const totalMinutes = sessions.reduce((total, session) => total + session.durationMinutes, 0);

  async function saveSessions(next: TrainingSession[]) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSessions(next);
      setMessage('');
      return true;
    } catch {
      setMessage('Could not save your training log. Check your device storage and try again.');
      return false;
    }
  }

  function openNewSession() {
    setEditing(null);
    setDraft(EMPTY_DRAFT);
    setFormError('');
    setFormVisible(true);
  }

  function openEditSession(session: TrainingSession) {
    setEditing(session);
    setDraft({
      title: session.title,
      discipline: session.discipline,
      duration: String(session.durationMinutes),
      notes: session.notes,
    });
    setFormError('');
    setFormVisible(true);
  }

  async function handleSave() {
    const title = draft.title.trim();
    const durationMinutes = Number(draft.duration);
    if (!title) {
      setFormError('Add a name for this session.');
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
      setFormError('Duration must be between 1 and 600 minutes.');
      return;
    }

    const session: TrainingSession = {
      id: editing?.id ?? `${Date.now()}`,
      title,
      discipline: draft.discipline,
      durationMinutes,
      notes: draft.notes.trim(),
      date: editing?.date ?? new Date().toISOString(),
    };
    const next = editing
      ? sessions.map((item) => (item.id === editing.id ? session : item))
      : [session, ...sessions];

    if (await saveSessions(next)) setFormVisible(false);
  }

  function handleDelete(session: TrainingSession) {
    Alert.alert('Delete session?', `Remove "${session.title}" from your training log?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void saveSessions(sessions.filter((item) => item.id !== session.id)),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ThemedView style={styles.screen} lightColor={COLORS.background} darkColor={COLORS.background}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.eyebrow}>THE DAILY GRIND</Text>
            <ThemedText style={styles.title} lightColor={COLORS.text} darkColor={COLORS.text}>
              Training log
            </ThemedText>
          </View>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>C</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>SESSIONS LOGGED</Text>
            <Text style={styles.summaryNumber}>{sessions.length}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View>
            <Text style={styles.summaryLabel}>MAT TIME</Text>
            <Text style={styles.summaryNumber}>
              {Math.floor(totalMinutes / 60)}
              <Text style={styles.summaryUnit}>h </Text>
              {totalMinutes % 60}
              <Text style={styles.summaryUnit}>m</Text>
            </Text>
          </View>
          <Text style={styles.summaryGlove}>✳</Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>Your sessions</Text>
          <Pressable style={styles.addButton} onPress={openNewSession} accessibilityRole="button">
            <Text style={styles.addButtonText}>＋  Log session</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search sessions, styles, notes..."
          placeholderTextColor={COLORS.muted}
          accessibilityLabel="Search training sessions"
        />

        <View style={styles.filters}>
          {(['All', ...DISCIPLINES] as Filter[]).map((item) => (
            <Pressable
              key={item}
              onPress={() => setFilter(item)}
              style={[styles.filterChip, filter === item && styles.filterChipActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: filter === item }}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        {message ? (
          <Text style={styles.errorMessage} accessibilityRole="alert">
            {message}
          </Text>
        ) : null}

        {isLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Loading your log...</Text>
          </View>
        ) : (
          <FlatList
            data={visibleSessions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyGlyph}>◎</Text>
                <Text style={styles.emptyTitle}>
                  {sessions.length ? 'No sessions match' : 'Every round starts somewhere'}
                </Text>
                <Text style={styles.emptyCopy}>
                  {sessions.length
                    ? 'Try another search or filter.'
                    : 'Log your first workout and start building your record.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.sessionCard}>
                <View style={styles.sessionTopLine}>
                  <Text style={styles.disciplineTag}>{item.discipline.toUpperCase()}</Text>
                  <Text style={styles.sessionDate}>{formatDate(item.date)}</Text>
                </View>
                <Text style={styles.sessionTitle}>{item.title}</Text>
                <Text style={styles.sessionMeta}>{item.durationMinutes} min on the mats</Text>
                {item.notes ? <Text style={styles.sessionNotes}>{item.notes}</Text> : null}
                <View style={styles.sessionActions}>
                  <Pressable onPress={() => openEditSession(item)} accessibilityRole="button">
                    <Text style={styles.actionText}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(item)} accessibilityRole="button">
                    <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            )}
          />
        )}

        <Modal
          visible={formVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFormVisible(false)}
        >
          <KeyboardAvoidingView
            style={styles.modalBackdrop}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.formCard}>
              <View style={styles.formHeading}>
                <View>
                  <Text style={styles.eyebrow}>{editing ? 'UPDATE YOUR WORK' : 'PUT IN THE WORK'}</Text>
                  <Text style={styles.formTitle}>{editing ? 'Edit session' : 'New session'}</Text>
                </View>
                <Pressable onPress={() => setFormVisible(false)} accessibilityLabel="Close form">
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>SESSION NAME</Text>
              <TextInput
                style={styles.input}
                value={draft.title}
                onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
                placeholder="e.g. Kickboxing fundamentals"
                placeholderTextColor={COLORS.muted}
                maxLength={70}
              />

              <Text style={styles.inputLabel}>DISCIPLINE</Text>
              <View style={styles.disciplineOptions}>
                {DISCIPLINES.map((discipline) => (
                  <Pressable
                    key={discipline}
                    onPress={() => setDraft((current) => ({ ...current, discipline }))}
                    style={[
                      styles.disciplineOption,
                      draft.discipline === discipline && styles.disciplineOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.disciplineOptionText,
                        draft.discipline === discipline && styles.disciplineOptionTextActive,
                      ]}
                    >
                      {discipline}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>DURATION (MINUTES)</Text>
              <TextInput
                style={styles.input}
                value={draft.duration}
                onChangeText={(duration) => setDraft((current) => ({ ...current, duration }))}
                keyboardType="number-pad"
                maxLength={3}
              />

              <Text style={styles.inputLabel}>NOTES (OPTIONAL)</Text>
              <TextInput
                style={[styles.input, styles.notesInput]}
                value={draft.notes}
                onChangeText={(notes) => setDraft((current) => ({ ...current, notes }))}
                placeholder="What did you work on?"
                placeholderTextColor={COLORS.muted}
                multiline
                maxLength={240}
              />

              {formError ? <Text style={styles.errorMessage}>{formError}</Text> : null}
              <Pressable style={styles.saveButton} onPress={() => void handleSave()}>
                <Text style={styles.saveButtonText}>
                  {editing ? 'Save changes' : 'Add to training log'}
                </Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  screen: { flex: 1, paddingHorizontal: 20 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 20,
  },
  eyebrow: { color: COLORS.accent, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, marginTop: 5 },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: COLORS.background, fontSize: 24, fontWeight: '900' },
  summaryCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 24,
  },
  summaryLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  summaryNumber: { color: COLORS.text, fontSize: 26, fontWeight: '900', marginTop: 5 },
  summaryUnit: { color: COLORS.muted, fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, height: 38, backgroundColor: COLORS.border },
  summaryGlove: { position: 'absolute', right: 18, color: '#33402D', fontSize: 62, top: -5 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  addButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },
  addButtonText: { color: COLORS.background, fontSize: 12, fontWeight: '900' },
  search: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12, marginBottom: 12 },
  filterChip: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: COLORS.background },
  listContent: { paddingBottom: 28, flexGrow: 1 },
  sessionCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 11,
  },
  sessionTopLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  disciplineTag: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  sessionDate: { color: COLORS.muted, fontSize: 10, fontWeight: '600' },
  sessionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '800', marginTop: 9 },
  sessionMeta: { color: COLORS.muted, fontSize: 12, marginTop: 5 },
  sessionNotes: { color: '#C4CCC6', fontSize: 12, lineHeight: 18, marginTop: 9 },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 14,
    paddingTop: 12,
  },
  actionText: { color: COLORS.accent, fontSize: 12, fontWeight: '800' },
  deleteText: { color: COLORS.danger },
  emptyState: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 28 },
  emptyGlyph: { color: COLORS.accent, fontSize: 32, marginBottom: 10 },
  emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  emptyCopy: { color: COLORS.muted, fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 7 },
  errorMessage: { color: COLORS.danger, fontSize: 12, lineHeight: 18, marginBottom: 9 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  formCard: {
    backgroundColor: COLORS.surfaceRaised,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  formHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: { color: COLORS.text, fontSize: 22, fontWeight: '900', marginTop: 5 },
  closeButton: { color: COLORS.muted, fontSize: 30, lineHeight: 32 },
  inputLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginBottom: 7 },
  input: {
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    marginBottom: 15,
  },
  notesInput: { minHeight: 62, textAlignVertical: 'top' },
  disciplineOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 },
  disciplineOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  disciplineOptionActive: { borderColor: COLORS.accent, backgroundColor: '#28331A' },
  disciplineOptionText: { color: COLORS.muted, fontSize: 10, fontWeight: '700' },
  disciplineOptionTextActive: { color: COLORS.accent },
  saveButton: {
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    borderRadius: 11,
    paddingVertical: 14,
    marginTop: 5,
  },
  saveButtonText: { color: COLORS.background, fontSize: 13, fontWeight: '900' },
});

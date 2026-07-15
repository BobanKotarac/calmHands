import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

const W = Dimensions.get('window').width;

type MoodDoc = {
  value: number;
  note?: string | null;
  dayId?: string;
  updatedAt?: any;
};

const MOOD_VALUES = [1, 2, 3, 4, 5];
const MOOD_COLORS: Record<number, string> = {
  1: '#EF4444',
  2: '#F97316',
  3: '#3B82F6',
  4: '#10B981',
  5: '#22C55E',
};

function todayId() {
  // Lokalni datum (ne UTC) da se “dan” ne pomera korisniku
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function TrackerScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ id: string; data: MoodDoc }>>([]);
  const [saving, setSaving] = useState(false);

  const today = todayId();

  useEffect(() => {
    if (!user) return;

    // Uzimamo poslednjih 14 dokumenata (po updatedAt desc),
    // a svaki dokument je jedan dan (docId = YYYY-MM-DD)
    const q = query(
      collection(db, 'users', user.uid, 'moods'),
      orderBy('updatedAt', 'desc'),
      limit(14)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as MoodDoc }));

      // sortiraj po docId (YYYY-MM-DD) da graf ide hronološki
      rows.sort((a, b) => a.id.localeCompare(b.id));
      setItems(rows);

      // ako već postoji današnji unos, popuni UI da user može da “izmeni današnji”
      const todays = rows.find((r) => r.id === today);
      if (todays?.data?.value) setSelectedMood(todays.data.value);
      if (todays?.data?.note) setNote(todays.data.note ?? '');
    });

    return unsub;
  }, [user, today]);

  const selectedHint = t(`tracker.hint${selectedMood}`);

  const chartData = useMemo(() => {
    const values = items.map((x) => x.data.value);
    return {
      labels: items.map((x) => x.id.slice(5)), // MM-DD
      datasets: [{ data: values.length ? values : [3] }],
    };
  }, [items]);

  const hasToday = useMemo(() => items.some((x) => x.id === today), [items, today]);

  async function saveMood() {
    if (!user) return;

    try {
      setSaving(true);

      await setDoc(
        doc(db, 'users', user.uid, 'moods', today),
        {
          value: selectedMood,
          note: note.trim() || null,
          dayId: today,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Keyboard.dismiss();
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
        <ScrollView
          contentContainerStyle={{ padding: theme.padding.screen, gap: 14 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>{t('tracker.title')}</Text>

          <Text style={{ color: theme.colors.textMuted, lineHeight: 22, fontSize: 14 }}>
            {t('tracker.subtitle', { date: today, hint: hasToday ? t('tracker.todayHintEntered') : t('tracker.todayHintNew') })}
          </Text>

          <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 10 }}>
            <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('tracker.quickSelect')}</Text>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {MOOD_VALUES.map((v) => {
                const active = v === selectedMood;
                const moodColor = MOOD_COLORS[v] ?? theme.colors.primary;
                return (
                  <TouchableOpacity
                    key={v}
                    activeOpacity={theme.activeOpacity}
                    onPress={() => setSelectedMood(v)}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      borderRadius: theme.radius.button,
                      backgroundColor: active ? moodColor : theme.colors.cardMuted,
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? moodColor : theme.colors.cardBorder,
                    }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: active ? '600' : '400' }}>{t(`tracker.mood${v}`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>
              {t('tracker.selected')}: <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{selectedMood}/5</Text>
              {selectedHint ? ` — ${selectedHint}` : ''}
            </Text>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('tracker.notePlaceholder')}
              placeholderTextColor={theme.colors.textDim}
              multiline
              style={{
                minHeight: 70,
                backgroundColor: theme.colors.cardMuted,
                color: theme.colors.text,
                padding: 12,
                borderRadius: theme.radius.button,
                textAlignVertical: 'top',
                borderWidth: 1,
                borderColor: theme.colors.cardBorder,
              }}
            />

            <TouchableOpacity
              activeOpacity={theme.activeOpacity}
              onPress={saveMood}
              disabled={saving}
              style={{ overflow: 'hidden', borderRadius: theme.radius.button, opacity: saving ? 0.8 : 1 }}
            >
              <LinearGradient
                colors={saving ? [theme.colors.successDark, theme.colors.successDark] : [theme.colors.success, theme.colors.successDark]}
                style={{ paddingVertical: theme.padding.button, paddingHorizontal: theme.padding.screen, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: theme.colors.text, textAlign: 'center', fontSize: 16, fontWeight: '600' }}>
                  {saving ? t('profile.saving') : hasToday ? t('tracker.saveEdit') : t('tracker.saveToday')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 10 }}>
            <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('tracker.trend14')}</Text>

            <LineChart
              data={chartData}
              width={W - 32}
              height={220}
              fromZero
              yAxisInterval={1}
              chartConfig={{
                backgroundGradientFrom: theme.colors.card,
                backgroundGradientTo: theme.colors.card,
                decimalPlaces: 0,
                color: (o = 1) => `rgba(59,130,246,${o})`,
                labelColor: (o = 1) => `rgba(148,163,184,${o})`,
                propsForDots: { r: '4' },
              }}
              style={{ borderRadius: theme.radius.card }}
            />
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

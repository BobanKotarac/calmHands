import React, { useEffect, useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { moodColor, moodMeta } from '../utils/moodMeta';
import * as Haptics from 'expo-haptics';
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
import { AppBackground } from '../components/ui/AppBackground';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { onListenError } from '../utils/onListenError';

type MoodDoc = {
  value: number;
  note?: string | null;
  dayId?: string;
  updatedAt?: any;
};

const MOOD_VALUES = [1, 2, 3, 4, 5];
const TREND_DAYS = 14;
const CHART_HEIGHT = 140;

function todayId() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function dayIdFromDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function TrackerScreen() {
  const { user, isGuest } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ id: string; data: MoodDoc }>>([]);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const today = todayId();

  useEffect(() => {
    if (!user || isGuest) return;

    const q = query(
      collection(db, 'users', user.uid, 'moods'),
      orderBy('updatedAt', 'desc'),
      limit(30)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as MoodDoc }));
      rows.sort((a, b) => a.id.localeCompare(b.id));
      setItems(rows);

      const todays = rows.find((r) => r.id === today);
      if (todays?.data?.value) setSelectedMood(todays.data.value);
      if (todays?.data?.note) setNote(todays.data.note ?? '');
    }, onListenError);

    return unsub;
  }, [user, today, isGuest]);

  const selectedHint = t(`tracker.hint${selectedMood}`);

  /** Last 14 calendar days — filled or empty — so the chart is always even and readable. */
  const last14Days = useMemo(() => {
    const byDay = new Map(items.map((x) => [x.id, x.data.value]));
    const out: { dayId: string; value: number | null; dayNum: string; isToday: boolean }[] = [];
    const now = new Date();
    for (let i = TREND_DAYS - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayId = dayIdFromDate(d);
      out.push({
        dayId,
        value: byDay.get(dayId) ?? null,
        dayNum: String(d.getDate()),
        isToday: dayId === today,
      });
    }
    return out;
  }, [items, today]);

  const hasToday = useMemo(() => items.some((x) => x.id === today), [items, today]);
  const filledCount = last14Days.filter((d) => d.value != null).length;

  async function saveMood() {
    if (!user || isGuest) return;

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
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  const onSelectMood = async (v: number) => {
    setSelectedMood(v);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  if (isGuest) {
    return (
      <AppBackground>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', padding: theme.padding.screen, gap: 16 }} edges={['top']}>
          <Text style={[theme.typography.title, { color: theme.colors.text, textAlign: 'center' }]}>
            {t('guest.lockedTitle')}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
            {t('guest.lockedBody')}
          </Text>
          <Button
            title={t('guest.createAccount')}
            variant="primary"
            onPress={() => navigation.getParent?.('RootStack')?.navigate('Auth') ?? navigation.navigate('Auth')}
          />
        </SafeAreaView>
      </AppBackground>
    );
  }

  return (
    <AppBackground>
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            padding: theme.padding.screen,
            gap: theme.padding.sectionGap,
            paddingBottom: theme.padding.tabBarClearance,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={[theme.typography.title, { color: theme.colors.text }]}>{t('tracker.title')}</Text>

          <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>
            {t('tracker.subtitle', {
              date: today,
              hint: hasToday ? t('tracker.todayHintEntered') : t('tracker.todayHintNew'),
            })}
          </Text>

          {justSaved ? (
            <View
              style={{
                backgroundColor: theme.colors.success + '22',
                borderRadius: theme.radius.button,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.colors.success,
              }}
            >
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: theme.colors.success,
                    textAlign: 'center',
                    fontFamily: theme.typography.fontSemiBold,
                  },
                ]}
              >
                ✓ {t('myLogs.savedMoodCelebration')}
              </Text>
            </View>
          ) : null}

          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.card,
              padding: theme.padding.cardTight,
              gap: 10,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>
              {t('tracker.quickSelect')}
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {MOOD_VALUES.map((v) => {
                const active = v === selectedMood;
                const color = moodColor(v);
                return (
                  <TouchableOpacity
                    key={v}
                    activeOpacity={theme.activeOpacity}
                    onPress={() => onSelectMood(v)}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      minHeight: 44,
                      borderRadius: theme.radius.button,
                      backgroundColor: active ? color : theme.colors.cardMuted,
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? color : theme.colors.cardBorder,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.text,
                        fontFamily: active ? theme.typography.fontSemiBold : theme.typography.fontRegular,
                      }}
                    >
                      {t(`tracker.mood${v}`)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>
              {t('tracker.selected')}:{' '}
              <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontSemiBold }}>
                {selectedMood}/5
              </Text>
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
                fontFamily: theme.typography.fontRegular,
              }}
            />

            <TouchableOpacity
              activeOpacity={theme.activeOpacity}
              onPress={saveMood}
              disabled={saving}
              style={{ overflow: 'hidden', borderRadius: theme.radius.button, opacity: saving ? 0.8 : 1 }}
            >
              <LinearGradient
                colors={
                  saving
                    ? [theme.colors.successDark, theme.colors.successDark]
                    : [theme.colors.success, theme.colors.successDark]
                }
                style={{
                  paddingVertical: theme.padding.button,
                  paddingHorizontal: theme.padding.screen,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    color: theme.colors.text,
                    textAlign: 'center',
                    fontSize: 16,
                    fontFamily: theme.typography.fontSemiBold,
                  }}
                >
                  {saving ? t('profile.saving') : hasToday ? t('tracker.saveEdit') : t('tracker.saveToday')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* 14-day mood bars */}
          <View
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.card,
              padding: theme.padding.cardTight,
              gap: 12,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>
                {t('tracker.trend14')}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textDim }]}>
                {filledCount}/{TREND_DAYS}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Y scale */}
              <View style={{ height: CHART_HEIGHT, justifyContent: 'space-between', paddingVertical: 2 }}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <Text key={n} style={[theme.typography.captionSmall, { color: theme.colors.textDim, width: 12, textAlign: 'right' }]}>
                    {n}
                  </Text>
                ))}
              </View>

              {/* Bars */}
              <View style={{ flex: 1, height: CHART_HEIGHT }}>
                <View
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'space-between',
                  }}
                  pointerEvents="none"
                >
                  {[0, 1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={{
                        height: StyleSheetHairline,
                        backgroundColor: theme.colors.cardBorder,
                        opacity: 0.7,
                      }}
                    />
                  ))}
                </View>

                <View
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: 3,
                    paddingHorizontal: 2,
                  }}
                >
                  {last14Days.map(({ dayId, value, dayNum, isToday }) => {
                    const barH =
                      value == null ? 4 : Math.max(8, ((value - 0) / 5) * (CHART_HEIGHT - 4));
                    const color = value != null ? moodMeta(value).color : theme.colors.cardBorder;
                    return (
                      <View
                        key={dayId}
                        style={{
                          flex: 1,
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          height: '100%',
                        }}
                      >
                        <View
                          style={{
                            width: '70%',
                            maxWidth: 14,
                            height: barH,
                            borderRadius: 6,
                            backgroundColor: color,
                            opacity: value == null ? 0.35 : 1,
                            borderWidth: isToday ? 1.5 : 0,
                            borderColor: theme.colors.text,
                          }}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Day labels */}
            <View style={{ flexDirection: 'row', marginLeft: 20, gap: 3 }}>
              {last14Days.map(({ dayId, dayNum, isToday }, i) => {
                const show = i % 2 === 0 || isToday || i === last14Days.length - 1;
                return (
                  <View key={dayId} style={{ flex: 1, alignItems: 'center' }}>
                    <Text
                      style={[
                        theme.typography.captionSmall,
                        {
                          color: isToday ? theme.colors.primary : theme.colors.textDim,
                          fontFamily: isToday ? theme.typography.fontSemiBold : theme.typography.fontRegular,
                          opacity: show ? 1 : 0,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>

            {filledCount === 0 ? (
              <Text style={[theme.typography.caption, { color: theme.colors.textMuted, textAlign: 'center' }]}>
                {t('tracker.chartEmpty')}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}

const StyleSheetHairline = 1;

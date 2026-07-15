import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Button, Dimensions, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { addDoc, collection, limit, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';
import { getRitualStreak } from '../utils/getRitualStrek';
import { useFocusEffect } from '@react-navigation/native';
import { usePremiumContext } from '../context/premiumContext';
import { getCurrentWeekId, getWeeklyReflection } from '../utils/weeklyReflection';
import { dismissLowMoodSuggestion, isLowMoodSuggestionDismissed } from '../utils/lowMoodSuggestion';
import WeeklyReviewModal from '../components/WeeklyReviewModal';
import {
  updateLongestStreaks,
  getUnlockedAchievements,
  unlockAchievement,
  getAchievementsToCheck,
  checkAndUnlockOtherAchievements,
  type AchievementId,
} from '../utils/achievements';
import { useTranslation } from 'react-i18next';

const W = Dimensions.get('window').width;

type MoodDoc = {
  value: number;
  note?: string | null;
  dayId?: string;
  updatedAt?: any;
};

type ThoughtLogDoc = {
  thoughts?: string;
  bodySensations?: string;
  intensityBefore?: number;
  intensityAfter?: number;
  createdAt?: any; // Timestamp
};

type ThoughtLogRow = { id: string; data: ThoughtLogDoc };

type Action = 'SOS' | 'Breathing' | 'Grounding' | 'Mudras' | 'ThoughtLog' | 'MojiLogovi' | 'Mood';

type Rec = {
  titleKey: string;
  reasonKey: string;
  color: string;
  action: Action;
  params?: any;
};

const isNumber = (x: unknown): x is number => typeof x === 'number';


function moodMeta(v: number): { emoji: string; titleKey: string; color: string } {
  if (v <= 1) return { emoji: '😣', titleKey: 'hard', color: '#EF4444' };
  if (v === 2) return { emoji: '😟', titleKey: 'bad', color: '#F97316' };
  if (v === 3) return { emoji: '😐', titleKey: 'ok', color: '#60A5FA' };
  if (v === 4) return { emoji: '🙂', titleKey: 'good', color: '#10B981' };
  return { emoji: '😌', titleKey: 'great', color: '#22C55E' };
}

function todayId() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDayId(id: string) {
  // id: YYYY-MM-DD (lokalno)
  const [y, m, d] = id.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function daysBetween(a: Date, b: Date) {
  const ms = 24 * 60 * 60 * 1000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((aa - bb) / ms);
}

export default function HomeScreen({ navigation }: any) {
    const { user } = useAuth();
    const [items, setItems] = useState<Array<{ id: string; data: MoodDoc }>>([]);
    const [thoughtRows, setThoughtRows] = useState<ThoughtLogRow[]>([]);
    const [showAllRecs, setShowAllRecs] = useState(false);
    const [ritualStreak, setRitualStreak] = useState<number>(0);
    const [showWeeklyReviewCard, setShowWeeklyReviewCard] = useState(false);
    const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
    const [currentWeekId, setCurrentWeekId] = useState<string>('');
    const [lowMoodDismissed, setLowMoodDismissed] = useState(true);
    const [showNotOkayModal, setShowNotOkayModal] = useState(false);
    const [notOkayText, setNotOkayText] = useState('');
    const { isPremium, showPaywall } = usePremiumContext();
    const { t } = useTranslation();

    useEffect(() => {
        if (!user) return;

        const q = query(
        collection(db, 'users', user.uid, 'moods'),
        orderBy('updatedAt', 'desc'),
        limit(60) // uzmemo više da streak/trend ima smisla
        );

        const unsub = onSnapshot(q, (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as MoodDoc }));
        rows.sort((a, b) => a.id.localeCompare(b.id)); // hronološki
        setItems(rows);
        });

        return unsub;
    }, [user]);

    useEffect(() => {
    if (!user) return;

        const q = query(
            collection(db, 'users', user.uid, 'thoughtLogs'),
            orderBy('createdAt', 'desc'),
            limit(60)
        );

        const unsub = onSnapshot(q, (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as ThoughtLogDoc }));
            setThoughtRows(rows);
        });

        return unsub;
    }, [user]);

    useFocusEffect(
  React.useCallback(() => {
    let alive = true;
    const weekId = getCurrentWeekId();
    setCurrentWeekId(weekId);
    const day = new Date().getDay(); // 0 = nedelja, 6 = subota
    const isEndOfWeek = day === 0 || day === 6;

    (async () => {
      if (!user?.uid) return;
      const s = await getRitualStreak(user.uid);
      if (alive) setRitualStreak(s);
      const reflection = await getWeeklyReflection(user.uid, weekId);
      if (alive) setShowWeeklyReviewCard(!reflection && isEndOfWeek);
      const dismissed = await isLowMoodSuggestionDismissed();
      if (alive) setLowMoodDismissed(dismissed);
    })();

    return () => { alive = false; };
  }, [user?.uid])
);




    const today = todayId();
    const hasToday = useMemo(() => items.some((x) => x.id === today), [items, today]);

    const lastValue = items.length ? items[items.length - 1].data.value : null;
    const meta = useMemo(() => moodMeta(lastValue ?? 3), [lastValue]);

    // Streak: koliko dana unazad bez rupe, gledajući od danas ako ima today,
    // ili od poslednjeg unosa ako nema today.
    const streak = useMemo(() => {
        if (!items.length) return 0;

        const set = new Set(items.map((x) => x.id));
        const start = hasToday ? today : items[items.length - 1].id;

        let count = 0;
        let cursor = parseDayId(start);

        while (true) {
        const id =
            `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
        if (!set.has(id)) break;
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
        }
        return count;
    }, [items, hasToday, today]);

    useEffect(() => {
      if (!user?.uid) return;
      (async () => {
        try {
          await updateLongestStreaks(user.uid, streak, ritualStreak);
          const unlocked = await getUnlockedAchievements(user.uid);
          const toUnlock = getAchievementsToCheck(streak, ritualStreak);
          for (const id of toUnlock) {
            if (!unlocked[id]) await unlockAchievement(user.uid, id as AchievementId);
          }
          await checkAndUnlockOtherAchievements(user.uid);
        } catch (_) {}
      })();
    }, [user?.uid, streak, ritualStreak]);

    // Insight: prosek poslednjih 7 + trend u odnosu na prethodnih 7
    const insight = useMemo(() => {
        const values = items.map((x) => x.data.value);
        if (!values.length) return { avg7: null as number | null, delta: null as number | null };

        const last7 = values.slice(-7);
        const prev7 = values.slice(-14, -7);

        const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / (arr.length || 1);

        const avg7 = avg(last7);
        const avgPrev = prev7.length ? avg(prev7) : null;
        const delta = avgPrev == null ? null : avg7 - avgPrev;

        return { avg7, delta };
    }, [items]);

    // Poslednjih 7 dana za strip: levo = pre 6 dana, desno = danas
    const last7DaysStrip = useMemo(() => {
        const out: { dayId: string; value: number | null; daysAgo: number }[] = [];
        const itemByDay = new Map(items.map((x) => [x.id, x.data.value]));
        const d = new Date();
        for (let i = 6; i >= 0; i--) {
            const x = new Date(d);
            x.setDate(x.getDate() - i);
            const yyyy = x.getFullYear();
            const mm = String(x.getMonth() + 1).padStart(2, '0');
            const dd = String(x.getDate()).padStart(2, '0');
            const dayId = `${yyyy}-${mm}-${dd}`;
            const val = itemByDay.get(dayId) ?? null;
            out.push({ dayId, value: val ?? null, daysAgo: i });
        }
        return out;
    }, [items]);

    const todayColor = hasToday ? '#10B981' : '#F59E0B';


    // const thoughtLast7 = useMemo(() => {
    // const now = Date.now();
    // return thoughtRows.filter((r) => {
    //     const ts = r.data.createdAt?.toDate?.();
    //     const ms = ts ? ts.getTime() : null;
    //     return ms != null && now - ms <= last7Ms;
    // });
    // }, [thoughtRows]);
     const last7Ms = 7 * 24 * 60 * 60 * 1000;

    const thoughtLast7 = useMemo(() => {
        const now = Date.now();

        return thoughtRows.filter((r) => {
            const ts = r.data.createdAt?.toDate?.();

            // Ako serverTimestamp još nije stigao, tretiraj kao "sada"
            const ms = ts ? ts.getTime() : now;

            return now - ms <= last7Ms;
        });
    }, [thoughtRows]);

    const suggestionWords = useMemo(() => {
        const stopWords = ['i', 'u', 'na', 'da', 'je', 'sa', 'do', 'za', 'ne', 'to', 'su'];
        const wordCounts = new Map<string, number>();
        thoughtLast7.forEach((r) => {
            const text = [r.data.thoughts, r.data.bodySensations].filter(Boolean).join(' ') || '';
            text.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter((w) => w.length > 2 && !stopWords.includes(w))
                .forEach((w) => wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1));
        });
        return Array.from(wordCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([word]) => word);
    }, [thoughtLast7]);
    
    const thoughtAvg7 = useMemo(() => {
        const nums = thoughtLast7
            .map((r) => r.data.intensityAfter)
            .filter(isNumber);

        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    }, [thoughtLast7]);

    // Recommendation logic
    const thoughtCount7 = useMemo(() => thoughtLast7.length, [thoughtLast7]);
    const thoughtImproveAvg7 = useMemo(() => {
      const diffs = thoughtLast7
        .map((r) => {
          const b = r.data.intensityBefore;
          const a = r.data.intensityAfter;
          if (typeof a !== 'number' || typeof b !== 'number') return null;
          return b - a;
        })
        .filter((x): x is number => typeof x === 'number');

      return diffs.length ? diffs.reduce((s, v) => s + v, 0) / diffs.length : null;
    }, [thoughtLast7]);

    // Jednostavan „risk score” za naredni dan, 0–1 (bez ML).
    const riskScore = useMemo(() => {
      const mood7 = insight.avg7 ?? 3;
      const panic7 = thoughtAvg7; // prosečan intenzitet posle (0–10) | null
      const count7 = thoughtCount7;
      const improved7 = thoughtImproveAvg7;

      let r = 0;

      // Nizak prosečan mood
      if (mood7 <= 2) r += 0.4;
      else if (mood7 <= 2.5) r += 0.25;
      else if (mood7 <= 3) r += 0.1;

      // Pojačani intenzitet u logovima (posle intervencije)
      if (panic7 != null) {
        if (panic7 >= 7) r += 0.4;
        else if (panic7 >= 4) r += 0.25;
      }

      // Koliko je bilo logova u poslednjih 7 dana
      if (count7 >= 5) r += 0.2;
      else if (count7 >= 3) r += 0.1;

      // Ako logovi dosledno pomažu, malo smanji rizik
      if (improved7 != null && improved7 >= 2) r -= 0.1;

      if (r < 0) return 0;
      if (r > 1) return 1;
      return r;
    }, [insight.avg7, thoughtAvg7, thoughtCount7, thoughtImproveAvg7]);

    const recs = useMemo<Rec[]>(() => {
      const mood7 = insight.avg7 ?? 3;
      const panic7 = thoughtAvg7; // null | number
      const count7 = thoughtCount7;
      const improved7 = thoughtImproveAvg7;

      // 0) Novi korisnik: prvi mood
      if (items.length === 0) {
        return [
          { titleKey: 'home.rec.first_mood_title', reasonKey: 'home.rec.first_mood_reason', color: theme.colors.primary, action: 'Mood' },
        ];
      }

      // 0.5) Visok rizik: uvek ponudi SOS paket
      if (riskScore >= 0.8) {
        return [
          { titleKey: 'home.rec.acute_sos_title', reasonKey: 'home.rec.acute_sos_reason', color: '#EF4444', action: 'SOS' },
          { titleKey: 'home.rec.then_grounding_title', reasonKey: 'home.rec.then_grounding_reason', color: '#F97316', action: 'Grounding' },
        ];
      }

      // 1) Akutno: SOS (po jakim logovima)
      if (count7 >= 3 && (panic7 != null && panic7 >= 7)) {
        return [
          { titleKey: 'home.rec.acute_sos_title', reasonKey: 'home.rec.acute_sos_reason', color: '#EF4444', action: 'SOS' },
          { titleKey: 'home.rec.then_grounding_title', reasonKey: 'home.rec.then_grounding_reason', color: '#F97316', action: 'Grounding' },
        ];
      }

      // 2) Srednja napetost: disanje kao primarno
      if (panic7 != null && panic7 >= 4) {
        const out: Rec[] = [
          { titleKey: 'home.rec.tension_breathing_title', reasonKey: 'home.rec.tension_breathing_reason', color: '#3B82F6', action: 'Breathing', params: { durationSec: 180 } },
          {
            titleKey: 'home.rec.thoughts_grounding_title',
            reasonKey: 'home.rec.thoughts_grounding_reason',
            color: '#0EA5E9',
            action: 'Grounding',
          },
        ];

        if (improved7 != null && improved7 >= 2) {
          out.push({ titleKey: 'home.rec.log_helps_title', reasonKey: 'home.rec.log_helps_reason', color: '#10B981', action: 'ThoughtLog' });
        }
        return out;
      }

      // 3) Nizak mood bez mnogo panike: rutina
      if (mood7 <= 2.5 && count7 <= 1) {
        return [
          { titleKey: 'home.rec.low_mood_mudra_title', reasonKey: 'home.rec.low_mood_mudra_reason', color: '#F59E0B', action: 'Mudras' },
          { titleKey: 'home.rec.preventive_breathing_title', reasonKey: 'home.rec.preventive_breathing_reason', color: '#3B82F6', action: 'Breathing', params: { durationSec: 60 } },
        ];
      }

      // 4) Fallback: upiši log
      return [
        { titleKey: 'home.rec.write_log_title', reasonKey: 'home.rec.write_log_reason', color: '#10B981', action: 'ThoughtLog' },
        { titleKey: 'home.rec.review_logs_title', reasonKey: 'home.rec.review_logs_reason', color: '#111827', action: 'MojiLogovi' },
      ];
    }, [items.length, insight.avg7, thoughtAvg7, thoughtCount7, thoughtImproveAvg7, riskScore]);


//     console.log('count7', thoughtCount7, 'panic7', thoughtAvg7, 'rows', thoughtRows.length);
// console.log('last7 createdAt', thoughtLast7.map(x => x.data.createdAt));
// console.log('last7 after', thoughtLast7.map(x => x.data.intensityAfter));


    const ctaScale = useRef(new Animated.Value(1)).current;
    const todayFormatted = useMemo(() => {
      const d = parseDayId(today);
      return d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' });
    }, [today]);

    const showLowMoodCard = useMemo(() => {
      if (lowMoodDismissed) return false;
      if (items.length < 3) return false;
      const avg7 = insight.avg7;
      // Prikaži karticu kad je prosečan mood nizak i procena rizika umerena ili visoka.
      return avg7 != null && avg7 <= 2.5 && riskScore >= 0.4;
    }, [lowMoodDismissed, items.length, insight.avg7, riskScore]);

    const handleDismissLowMood = React.useCallback(async () => {
      await dismissLowMoodSuggestion();
      setLowMoodDismissed(true);
    }, []);

    const saveQuickThoughtLog = React.useCallback(async () => {
      const text = notOkayText.trim();
      if (!user?.uid || !text) return;
      try {
        await addDoc(collection(db, 'users', user.uid, 'thoughtLogs'), {
          thoughts: text,
          bodySensations: '',
          createdAt: serverTimestamp(),
        });
      } catch (_) {}
    }, [user?.uid, notOkayText]);

    const openNotOkayOption = React.useCallback(
      async (action: 'sos' | 'plan' | 'log' | 'saveClose') => {
        if (action === 'saveClose' && notOkayText.trim()) {
          await saveQuickThoughtLog();
        }
        if (action === 'log' && notOkayText.trim()) {
          await saveQuickThoughtLog();
        }
        setShowNotOkayModal(false);
        setNotOkayText('');
        if (action === 'sos') navigation.navigate('SOS');
        else if (action === 'plan') navigation.navigate('Planovi' as any);
        else if (action === 'log') navigation.navigate('ThoughtLog');
      },
      [notOkayText, saveQuickThoughtLog, navigation]
    );

    return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: theme.padding.screen, gap: 12, paddingBottom: 24 }}>
            {/* Hero */}
            <View style={{ marginBottom: 8 }}>
              <Text style={[theme.typography.hero, { color: theme.colors.text }]}>
                {t('home.welcome')}{user?.displayName ? `, ${user.displayName}` : ''}.
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14, marginTop: 4 }}>
                {todayFormatted}
              </Text>
            </View>

            {/* Trenutno mi nije dobro */}
            <TouchableOpacity
              activeOpacity={theme.activeOpacity}
              onPress={() => setShowNotOkayModal(true)}
              style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.button, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: theme.colors.cardBorder, borderStyle: 'dashed' }}
            >
              <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 15 }}>💙 {t('home.notOkayButton')}</Text>
            </TouchableOpacity>

            {/* TODAY + STREAK + INSIGHT */}
            <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('home.today')}</Text>
                <Text style={{ color: todayColor, fontSize: 14 }}>
                {hasToday ? `✅ ${t('home.todayEntered')}` : `⏳ ${t('home.todayNotEntered')}`}
                </Text>
            </View>

            <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>{!items.length ? t('home.noEntryYet') : !hasToday ? t('home.todayNotEnteredLabel') : t('home.todayEnteredLabel')} {t('home.date')}: {today}.</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderRadius: theme.radius.cardSmall, padding: 12, borderWidth: streak > 0 && streak >= ritualStreak ? 1 : 0, borderColor: theme.colors.success }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('home.moodStreak')}</Text>
                <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>{streak} {t('common.days')}</Text>
                </View>

                <View style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderRadius: theme.radius.cardSmall, padding: 12 }}>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('home.avg7')}</Text>
                <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>
                    {insight.avg7 == null ? '—' : insight.avg7.toFixed(1)}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>
                    {insight.delta == null
                    ? t('home.noComparison')
                    : insight.delta >= 0
                        ? `Trend +${insight.delta.toFixed(1)}`
                        : `Trend ${insight.delta.toFixed(1)}`}
                </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderRadius: theme.radius.cardSmall, padding: 12, borderWidth: ritualStreak > 0 && ritualStreak > streak ? 1 : 0, borderColor: theme.colors.success }}>
                    <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('home.ritualStreak')}</Text>
                    <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '700' }}>{ritualStreak} {t('common.days')}</Text>
                </View>

            </View>

            <TouchableOpacity
                activeOpacity={theme.activeOpacity}
                onPressIn={() => Animated.spring(ctaScale, { toValue: 0.98, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true }).start()}
                onPress={() => navigation.navigate('Mood')}
                style={{ overflow: 'hidden', borderRadius: theme.radius.button }}
            >
                <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={{ paddingVertical: theme.padding.button, paddingHorizontal: theme.padding.screen, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
                      {!hasToday && '✏️ '}{hasToday ? t('home.editMood') : t('home.enterMood')}
                    </Text>
                  </LinearGradient>
                </Animated.View>
            </TouchableOpacity>
            </View>

            {/* NEDELJNI PREGLED */}
            {showWeeklyReviewCard && user?.uid && (
              <TouchableOpacity
                activeOpacity={theme.activeOpacity}
                onPress={() => setShowWeeklyReviewModal(true)}
                style={{ backgroundColor: theme.colors.primaryDark + '28', borderRadius: theme.radius.card, padding: theme.padding.cardTight, borderWidth: 1, borderColor: theme.colors.primary }}
              >
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>📋 {t('home.weeklyReview')}</Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 4 }}>{t('home.weeklyReviewHint')}</Text>
              </TouchableOpacity>
            )}

            {/* Low-mood: predlog plan + podsetnik */}
            {showLowMoodCard && (
              <View style={{ backgroundColor: theme.colors.warning + '22', borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 12, borderWidth: 1, borderColor: theme.colors.warning }}>
                <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{t('home.lowMoodSuggestionTitle')}</Text>
                <Text style={{ color: theme.colors.textMuted, fontSize: 14, lineHeight: 20 }}>{t('home.lowMoodSuggestionBody')}</Text>
                <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  <TouchableOpacity
                    activeOpacity={theme.activeOpacity}
                    onPress={() => (navigation as any).navigate('Planovi')}
                    style={{ backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: theme.radius.button }}
                  >
                    <Text style={{ color: theme.colors.text, fontWeight: '600' }}>{t('home.lowMoodSuggestionCta')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={theme.activeOpacity}
                    onPress={handleDismissLowMood}
                    style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                  >
                    <Text style={{ color: theme.colors.textMuted }}>{t('home.lowMoodSuggestionDismiss')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* LAST MOOD CARD – bez kruga, čisto emoji + skala 1–5 */}
            <View style={{ borderRadius: theme.radius.card, overflow: 'hidden' }}>
              <LinearGradient
                colors={[meta.color + '20', theme.colors.card, theme.colors.card]}
                style={{ padding: theme.padding.cardTight, gap: 14 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[theme.typography.body, { color: theme.colors.text }]}>{t('home.lastMood')}</Text>
                  <Text style={{ color: meta.color, fontSize: 18, fontWeight: '600' }}>{lastValue != null ? `${lastValue}/5` : '—'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48 }}>{meta.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>{lastValue != null ? t(`mood.${meta.titleKey}`) : t('home.noEntry')}</Text>
                    <Text style={{ color: theme.colors.textMuted, marginTop: 4, fontSize: 14 }}>{lastValue != null ? t('home.followTrend') : t('home.startWithFirst')}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 10, alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((n) => {
                        const active = lastValue != null && lastValue >= n;
                        return (
                          <View
                            key={n}
                            style={{
                              width: 28,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: active ? meta.color : theme.colors.cardBorder,
                              opacity: active ? 1 : 0.5,
                            }}
                          />
                        );
                      })}
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* TREND – strip poslednjih 7 dana, boja po moodu */}
            <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 10 }}>
                <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('home.trend7')}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 6 }}>
                    {last7DaysStrip.map(({ dayId, value, daysAgo }) => {
                        const color = value != null ? moodMeta(value).color : theme.colors.cardBorder;
                        const isFilled = value != null;
                        const label = daysAgo === 0 ? t('home.trend7Today') : daysAgo === 1 ? t('home.trend7Yesterday') : t('home.trend7DaysAgo', { count: daysAgo });
                        return (
                            <View key={dayId} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                                <View
                                    style={{
                                        width: '100%',
                                        aspectRatio: 1,
                                        maxWidth: 40,
                                        borderRadius: theme.radius.cardSmall,
                                        backgroundColor: color,
                                        opacity: isFilled ? 1 : 0.35,
                                    }}
                                />
                                <Text style={{ color: theme.colors.textMuted, fontSize: 11 }} numberOfLines={1}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* INSIGHTS + RECOMMENDATIONS */}
            
            <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 12 }}>
                {isPremium ? (
                <>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('home.recommendations')}</Text>
                    <TouchableOpacity
                        activeOpacity={theme.activeOpacity}
                        onPress={() => setShowAllRecs((v) => !v)}
                        style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: theme.radius.pill, backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder }}
                    >
                        <Text style={{ color: theme.colors.textMuted }}>{showAllRecs ? t('home.showOne') : t('home.showAll')}</Text>
                    </TouchableOpacity>
                </View>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('home.recommendationsSubtitle')}</Text>

                {(showAllRecs ? recs : recs.slice(0, 1)).map((r, idx) => (
                    <TouchableOpacity
                        key={idx}
                        activeOpacity={theme.activeOpacity}
                        onPress={() => {
                            if (r.action === 'Breathing') navigation.navigate('Breathing', r.params);
                            else if (r.action === 'Mood') navigation.navigate('Mood' as any);
                            else navigation.navigate(r.action as any);
                        }}
                        style={{
                            backgroundColor: r.color,
                            padding: theme.padding.cardTight,
                            borderRadius: theme.radius.cardSmall,
                            ...(idx === 0 && Platform.OS === 'android' ? { elevation: 2 } : {}),
                            ...(idx === 0 && Platform.OS === 'ios' ? { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 3 } : {}),
                        }}
                    >
                        <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>{t(r.titleKey)}</Text>
                        <Text style={{ color: theme.colors.text, opacity: 0.9, marginTop: 4 }}>{t(r.reasonKey)}</Text>
                    </TouchableOpacity>
                ))}
                </>
            ):(
                <Button title={t('home.buyProRecommendations')} onPress={showPaywall} />
            )}
            </View>

            {/* QUICK ACTIONS */}
            <View style={{ flexDirection: 'column', gap: 10 }}>
<TouchableOpacity
                activeOpacity={theme.activeOpacity}
                onPress={() => navigation.navigate('SOS')}
                style={{ overflow: 'hidden', borderRadius: theme.radius.cardSmall, borderWidth: 2, borderColor: theme.colors.sos }}
              >
                <LinearGradient
                  colors={[theme.colors.sos, theme.colors.sosDark]}
                  style={{ paddingVertical: theme.padding.button + 2, paddingHorizontal: theme.padding.screen, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: theme.colors.text, fontSize: 17, fontWeight: '700' }}>{t('home.sos')}</Text>
                </LinearGradient>
              </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={theme.activeOpacity}
                    onPress={() => navigation.navigate('Mudras')}
                    style={{ backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: theme.padding.button, borderRadius: theme.radius.cardSmall }}
                >
                    <Text style={{ color: theme.colors.text, textAlign: 'center', fontSize: 16 }}>{t('home.mudras')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={theme.activeOpacity}
                    onPress={() => navigation.navigate('MojiLogovi')}
                    style={{ backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: theme.padding.button, borderRadius: theme.radius.cardSmall }}
                >
                    <Text style={{ color: theme.colors.text, textAlign: 'center', fontSize: 16 }}>{t('home.myLogs')}</Text>
                </TouchableOpacity>
                {isPremium ? (
                    <TouchableOpacity
                        activeOpacity={theme.activeOpacity}
                        onPress={() => navigation.navigate('Insights')}
                        style={{ backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: theme.padding.button, borderRadius: theme.radius.cardSmall }}
                    >
                        <Text style={{ color: theme.colors.text, textAlign: 'center', fontSize: 16 }}>{t('home.insights')}</Text>
                    </TouchableOpacity>
                ):(
                    <Button title={t('home.buyProInsights')} onPress={showPaywall} />
                )}
            </View>

            <WeeklyReviewModal
              visible={showWeeklyReviewModal}
              onClose={() => setShowWeeklyReviewModal(false)}
              weekId={currentWeekId}
              uid={user?.uid ?? ''}
              onSaved={() => setShowWeeklyReviewCard(false)}
              suggestionWords={suggestionWords}
            />

            {/* Brzi check-in: Loše mi je */}
            <Modal visible={showNotOkayModal} transparent animationType="fade">
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => { setShowNotOkayModal(false); setNotOkayText(''); }}
                style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}
              >
                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.card, gap: 16 }}>
                  <Text style={[theme.typography.sectionTitle, { color: theme.colors.text }]}>{t('home.notOkayModalTitle')}</Text>
                  <TextInput
                    placeholder={t('home.notOkayModalHint')}
                    placeholderTextColor={theme.colors.textDim}
                    value={notOkayText}
                    onChangeText={setNotOkayText}
                    multiline
                    numberOfLines={2}
                    style={{ backgroundColor: theme.colors.cardMuted, borderRadius: theme.radius.button, padding: 12, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.cardBorder, minHeight: 60 }}
                  />
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      activeOpacity={theme.activeOpacity}
                      onPress={() => openNotOkayOption('sos')}
                      style={{ backgroundColor: theme.colors.sos + '28', paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.sos }}
                    >
                      <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '600' }}>{t('home.notOkayOpenSos')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={theme.activeOpacity}
                      onPress={() => openNotOkayOption('plan')}
                      style={{ backgroundColor: theme.colors.cardMuted, paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.cardBorder }}
                    >
                      <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('home.notOkayOpenPlan')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      activeOpacity={theme.activeOpacity}
                      onPress={() => openNotOkayOption('log')}
                      style={{ backgroundColor: theme.colors.cardMuted, paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.cardBorder }}
                    >
                      <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('home.notOkayWriteLog')}</Text>
                    </TouchableOpacity>
                    {notOkayText.trim() ? (
                      <TouchableOpacity
                        activeOpacity={theme.activeOpacity}
                        onPress={() => openNotOkayOption('saveClose')}
                        style={{ paddingVertical: 10 }}
                      >
                        <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 14 }}>{t('home.notOkaySaveAndClose')}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <TouchableOpacity activeOpacity={theme.activeOpacity} onPress={() => { setShowNotOkayModal(false); setNotOkayText(''); }} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 14 }}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
        </ScrollView>
    </SafeAreaView>
  );
}

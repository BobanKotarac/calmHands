import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';
import { moodMeta } from '../utils/moodMeta';
import { HomeRecommendationsSection } from '../components/home/HomeRecommendationsSection';
import { QuickActionsGrid } from '../components/ui/QuickActionsGrid';
import { SosFab } from '../components/ui/SosFab';
import { AppBackground } from '../components/ui/AppBackground';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
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
import { onListenError } from '../utils/onListenError';

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
  accentColor: string;
  action: Action;
  params?: any;
};

const isNumber = (x: unknown): x is number => typeof x === 'number';

function recAccent(action: Action): string {
  switch (action) {
    case 'SOS':
      return theme.colors.sos;
    case 'Breathing':
      return theme.colors.primary;
    case 'Grounding':
      return theme.colors.accent;
    case 'Mudras':
      return theme.colors.warning;
    case 'ThoughtLog':
      return theme.colors.success;
    case 'MojiLogovi':
      return theme.colors.textMuted;
    case 'Mood':
      return theme.colors.primary;
    default:
      return theme.colors.primary;
  }
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
    const { user, isGuest } = useAuth();
    const [items, setItems] = useState<Array<{ id: string; data: MoodDoc }>>([]);
    const [thoughtRows, setThoughtRows] = useState<ThoughtLogRow[]>([]);
    const [showAllRecs, setShowAllRecs] = useState(false);
    const [ritualStreak, setRitualStreak] = useState<number>(0);
    const [showWeeklyReviewCard, setShowWeeklyReviewCard] = useState(false);
    const [showWeeklyReviewModal, setShowWeeklyReviewModal] = useState(false);
    const [currentWeekId, setCurrentWeekId] = useState<string>('');
    const [lowMoodDismissed, setLowMoodDismissed] = useState(true);
    const [showNotOkayModal, setShowNotOkayModal] = useState(false);
    const { isPremium, showPaywall } = usePremiumContext();
    const { t } = useTranslation();

    const goAuth = () => navigation.getParent?.('RootStack')?.navigate('Auth') ?? navigation.navigate('Auth');
    const goPaywallOrAuth = () => (isGuest ? goAuth() : showPaywall());

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
        }, onListenError);

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
        }, onListenError);

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

    const todayColor = hasToday ? theme.colors.success : theme.colors.warning;


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
          { titleKey: 'home.rec.first_mood_title', reasonKey: 'home.rec.first_mood_reason', accentColor: recAccent('Mood'), action: 'Mood' },
        ];
      }

      // 0.5) Visok rizik: uvek ponudi SOS paket
      if (riskScore >= 0.8) {
        return [
          { titleKey: 'home.rec.acute_sos_title', reasonKey: 'home.rec.acute_sos_reason', accentColor: recAccent('SOS'), action: 'SOS' },
          { titleKey: 'home.rec.then_grounding_title', reasonKey: 'home.rec.then_grounding_reason', accentColor: recAccent('Grounding'), action: 'Grounding' },
        ];
      }

      // 1) Akutno: SOS (po jakim logovima)
      if (count7 >= 3 && (panic7 != null && panic7 >= 7)) {
        return [
          { titleKey: 'home.rec.acute_sos_title', reasonKey: 'home.rec.acute_sos_reason', accentColor: recAccent('SOS'), action: 'SOS' },
          { titleKey: 'home.rec.then_grounding_title', reasonKey: 'home.rec.then_grounding_reason', accentColor: recAccent('Grounding'), action: 'Grounding' },
        ];
      }

      // 2) Srednja napetost: disanje kao primarno
      if (panic7 != null && panic7 >= 4) {
        const out: Rec[] = [
          { titleKey: 'home.rec.tension_breathing_title', reasonKey: 'home.rec.tension_breathing_reason', accentColor: recAccent('Breathing'), action: 'Breathing', params: { durationSec: 180 } },
          {
            titleKey: 'home.rec.thoughts_grounding_title',
            reasonKey: 'home.rec.thoughts_grounding_reason',
            accentColor: recAccent('Grounding'),
            action: 'Grounding',
          },
        ];

        if (improved7 != null && improved7 >= 2) {
          out.push({ titleKey: 'home.rec.log_helps_title', reasonKey: 'home.rec.log_helps_reason', accentColor: recAccent('ThoughtLog'), action: 'ThoughtLog' });
        }
        return out;
      }

      // 3) Nizak mood bez mnogo panike: rutina
      if (mood7 <= 2.5 && count7 <= 1) {
        return [
          { titleKey: 'home.rec.low_mood_mudra_title', reasonKey: 'home.rec.low_mood_mudra_reason', accentColor: recAccent('Mudras'), action: 'Mudras' },
          { titleKey: 'home.rec.preventive_breathing_title', reasonKey: 'home.rec.preventive_breathing_reason', accentColor: recAccent('Breathing'), action: 'Breathing', params: { durationSec: 60 } },
        ];
      }

      // 4) Fallback: upiši log
      return [
        { titleKey: 'home.rec.write_log_title', reasonKey: 'home.rec.write_log_reason', accentColor: recAccent('ThoughtLog'), action: 'ThoughtLog' },
        { titleKey: 'home.rec.review_logs_title', reasonKey: 'home.rec.review_logs_reason', accentColor: recAccent('MojiLogovi'), action: 'MojiLogovi' },
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

    const openNotOkayOption = React.useCallback(
      (action: 'sos' | 'plan' | 'log') => {
        setShowNotOkayModal(false);
        if (action === 'sos') navigation.navigate('SOS');
        else if (action === 'plan') {
          if (isGuest) goAuth();
          else navigation.navigate('Planovi' as any);
        } else if (action === 'log') {
          if (isGuest) goAuth();
          else navigation.navigate('ThoughtLog');
        }
      },
      [navigation, isGuest]
    );

    const handleRecPress = (r: { action: string; params?: any }) => {
      if (r.action === 'Breathing') navigation.navigate('Breathing', r.params);
      else if (r.action === 'Mood') navigation.navigate('Mood' as any);
      else navigation.navigate(r.action as any);
    };

    const quickActions = [
      { key: 'breathe', label: t('home.quickBreathe'), emoji: '🌬️', onPress: () => navigation.navigate('Breathing', { durationSec: 60 }) },
      { key: 'ground', label: t('home.quickGround'), emoji: '🌍', onPress: () => navigation.navigate('Grounding') },
      { key: 'mudras', label: t('home.mudras'), emoji: '👐', onPress: () => navigation.navigate('Mudras') },
      ...(isGuest
        ? []
        : [
            { key: 'logs', label: t('home.myLogs'), emoji: '📝', onPress: () => navigation.navigate('MojiLogovi') },
            ...(isPremium
              ? [{ key: 'insights', label: t('home.insights'), emoji: '📊', onPress: () => navigation.navigate('Insights') }]
              : [{ key: 'insights', label: t('home.insights'), emoji: '🔒', onPress: goPaywallOrAuth, accent: theme.colors.primary }]),
          ]),
    ];

    return (
    <AppBackground>
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.padding.screen,
            gap: theme.padding.sectionGap,
            paddingBottom: 100,
          }}
        >
            {/* Hero */}
            <View style={{ marginBottom: 4, gap: 6 }}>
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontFamily: theme.typography.fontSemiBold, letterSpacing: 0.6, textTransform: 'uppercase' }]}>
                CalmHands
              </Text>
              <Text style={[theme.typography.hero, { color: theme.colors.text }]}>
                {t('home.welcome')}{user?.displayName ? `, ${user.displayName}` : ''}.
              </Text>
              <Text style={{ color: theme.colors.textMuted, fontSize: 14, fontFamily: theme.typography.fontRegular }}>
                {todayFormatted}
              </Text>
            </View>

            {isGuest ? (
              <TouchableOpacity
                activeOpacity={theme.activeOpacity}
                onPress={goAuth}
                style={{
                  backgroundColor: theme.colors.primaryMuted,
                  borderRadius: theme.radius.card,
                  padding: theme.padding.cardTight,
                  borderWidth: 1,
                  borderColor: theme.colors.primarySoft,
                  gap: 4,
                }}
              >
                <Text style={[theme.typography.bodySmall, { color: theme.colors.primary, fontFamily: theme.typography.fontSemiBold }]}>
                  {t('guest.createAccount')}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('guest.modeHint')}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Support CTA — teal fill; SOS FAB stays the urgent red shortcut */}
            <TouchableOpacity
              activeOpacity={theme.activeOpacity}
              onPress={() => setShowNotOkayModal(true)}
              style={{
                borderRadius: theme.radius.button,
                overflow: 'hidden',
                elevation: 4,
                shadowColor: theme.colors.primary,
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.35,
                shadowRadius: 8,
              }}
            >
              <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 16, paddingHorizontal: 18, gap: 2 }}
              >
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.onPrimary,
                      textAlign: 'center',
                      fontWeight: '700',
                      fontFamily: theme.typography.fontBold,
                      fontSize: 17,
                    },
                  ]}
                >
                  {t('home.notOkayButton')}
                </Text>
                <Text
                  style={{
                    color: theme.colors.onPrimary,
                    opacity: 0.7,
                    textAlign: 'center',
                    fontSize: 13,
                    fontFamily: theme.typography.fontRegular,
                  }}
                >
                  {t('home.notOkayButtonHint')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* TODAY + STREAK + INSIGHT */}
            <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.card, gap: 14, borderWidth: 1, borderColor: theme.colors.cardBorder, ...theme.shadow.card, shadowOpacity: 0.14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[theme.typography.sectionTitle, { color: theme.colors.text }]}>{t('home.today')}</Text>
                <Text style={{ color: todayColor, fontSize: 13, fontFamily: theme.typography.fontSemiBold }}>
                {hasToday ? t('home.todayEntered') : t('home.todayNotEntered')}
                </Text>
            </View>

            <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>
              {!items.length ? t('home.noEntryYet') : !hasToday ? t('home.todayNotEnteredLabel') : t('home.todayEnteredLabel')}
            </Text>

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
                onPress={() => (isGuest ? goAuth() : navigation.navigate('Mood'))}
                style={{ overflow: 'hidden', borderRadius: theme.radius.button }}
            >
                <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                  <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                    style={{ paddingVertical: theme.padding.button, paddingHorizontal: theme.padding.screen, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: theme.colors.onPrimary, fontSize: 16, fontFamily: theme.typography.fontSemiBold }}>
                      {isGuest
                        ? t('guest.createAccount')
                        : `${!hasToday ? '✏️ ' : ''}${hasToday ? t('home.editMood') : t('home.enterMood')}`}
                    </Text>
                  </LinearGradient>
                </Animated.View>
            </TouchableOpacity>
            </View>

            {/* NEDELJNI PREGLED */}
            {!isGuest && showWeeklyReviewCard && user?.uid && (
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
            {!isGuest && showLowMoodCard && (
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
                    <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: '600' }}>
                      {lastValue != null ? t(`mood.${meta.titleKey}`) : t('home.noEntryYet')}
                    </Text>
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
            <View style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.cardTight, gap: 10, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
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
                                        maxWidth: 44,
                                        minHeight: 44,
                                        borderRadius: theme.radius.cardSmall,
                                        backgroundColor: color,
                                        opacity: isFilled ? 1 : 0.35,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                  {isFilled ? (
                                    <Text style={{ color: theme.colors.background, fontSize: 13, fontFamily: theme.typography.fontBold }}>{value}</Text>
                                  ) : null}
                                </View>
                                <Text style={[theme.typography.captionSmall, { color: theme.colors.textMuted }]} numberOfLines={1}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {!isGuest ? (
              <HomeRecommendationsSection
                isPremium={isPremium}
                recs={recs}
                showAllRecs={showAllRecs}
                onToggleShowAll={() => setShowAllRecs((v) => !v)}
                onPressRec={handleRecPress}
                onShowPaywall={goPaywallOrAuth}
              />
            ) : null}

            <View style={{ gap: 8 }}>
              <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('home.quickActions')}</Text>
              <QuickActionsGrid actions={quickActions} />
            </View>

            {!isGuest ? (
              <WeeklyReviewModal
                visible={showWeeklyReviewModal}
                onClose={() => setShowWeeklyReviewModal(false)}
                weekId={currentWeekId}
                uid={user?.uid ?? ''}
                onSaved={() => setShowWeeklyReviewCard(false)}
                suggestionWords={suggestionWords}
              />
            ) : null}

            {/* Support options */}
            <Modal visible={showNotOkayModal} transparent animationType="fade">
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => setShowNotOkayModal(false)}
                style={{ flex: 1, backgroundColor: theme.colors.overlay, justifyContent: 'center', padding: 24 }}
              >
                <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()} style={{ backgroundColor: theme.colors.card, borderRadius: theme.radius.card, padding: theme.padding.card, gap: 16 }}>
                  <Text style={[theme.typography.sectionTitle, { color: theme.colors.text }]}>{t('home.notOkayModalTitle')}</Text>
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      activeOpacity={theme.activeOpacity}
                      onPress={() => openNotOkayOption('sos')}
                      style={{ backgroundColor: theme.colors.sos + '28', paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.sos }}
                    >
                      <Text style={{ color: theme.colors.text, textAlign: 'center', fontWeight: '600' }}>{t('home.notOkayOpenSos')}</Text>
                    </TouchableOpacity>
                    {!isGuest ? (
                      <>
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
                      </>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={theme.activeOpacity}
                        onPress={goAuth}
                        style={{ backgroundColor: theme.colors.primaryMuted, paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.button, borderWidth: 1, borderColor: theme.colors.primarySoft }}
                      >
                        <Text style={{ color: theme.colors.primary, textAlign: 'center', fontFamily: theme.typography.fontSemiBold }}>{t('guest.createAccount')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <TouchableOpacity activeOpacity={theme.activeOpacity} onPress={() => setShowNotOkayModal(false)} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: theme.colors.textMuted, textAlign: 'center', fontSize: 14 }}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
        </ScrollView>
        <SosFab label={t('home.sosShort')} onPress={() => navigation.navigate('SOS')} />
    </SafeAreaView>
    </AppBackground>
  );
}

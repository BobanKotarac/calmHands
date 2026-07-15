import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { VerticalCalendarHeatmap } from '../component/VerticalCalendarHeatmap';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../context/authContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { devSeedInsightsData } from '../utils/devSeed';
import { Modal } from 'react-native';
import { PLACE_OPTIONS, SITUATION_OPTIONS } from '../constants/thoughtLogTags';
import { useTranslation } from 'react-i18next';

type MoodDoc = { value: number; updatedAt?: any; dayId?: string };
type ThoughtLogDoc = {
  thoughts?: string;
  bodySensations?: string;
  intensityAfter?: number;
  createdAt?: any;
  place?: string;
  situation?: string;
  timeOfDay?: string;
};

type MoodRow = { id: string; data: MoodDoc };
type ThoughtRow = { id: string; data: ThoughtLogDoc };

function toDayIdLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function pearson(xs: number[], ys: number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n === 0) return 0;

  let sumX = 0, sumY = 0, sumXX = 0, sumYY = 0, sumXY = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i], y = ys[i];
    sumX += x; sumY += y;
    sumXX += x * x; sumYY += y * y;
    sumXY += x * y;
  }

  const num = sumXY - (sumX * sumY) / n;
  const den = Math.sqrt((sumXX - (sumX * sumX) / n) * (sumYY - (sumY * sumY) / n));
  if (den === 0) return 0;
  return num / den;
}

type HeatmapValue = { date: string; count: number };

function getTopTriggers(logs: ThoughtRow[], days: number = 90): { word: string; freq: number; panicPercent: number }[] {
  const now = Date.now();
  const recent = logs.filter(log => {
    const ts = log.data.createdAt?.toDate?.()?.getTime() || 0;
    return now - ts <= days * 86400000;
  });

  const stopWords = ['i', 'u', 'na', 'da', 'je', 'sa', 'do', 'za', 'ne', 'to', 'su'];
  const wordCounts = new Map<string, { count: number; panicDays: number }>();

  recent.forEach(log => {
    const text = [log.data.thoughts, log.data.bodySensations].filter(Boolean).join(' ') || '';
    const intensityAfter = log.data.intensityAfter || 0;
    const isHighPanic = intensityAfter >= 6;

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: any) => w.length > 2 && !stopWords.includes(w));

    words.forEach((word: any) => {
      const entry = wordCounts.get(word) || { count: 0, panicDays: 0 };
      entry.count++;
      if (isHighPanic) entry.panicDays++;
      wordCounts.set(word, entry);
    });
  });

  return Array.from(wordCounts.entries())
    .filter(([, data]) => data.count >= 3)
    .map(([word, data]) => ({
      word,
      freq: data.count,
      panicPercent: Math.round((data.panicDays / data.count) * 100),
    }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 8);
}

export default function InsightsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [moods, setMoods] = useState<MoodRow[]>([]);
  const [thoughts, setThoughts] = useState<ThoughtRow[]>([]);
  const [mode, setMode] = useState<'mood' | 'panic'>('mood');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [heatmapExpanded, setHeatmapExpanded] = useState(false);
  const [filterPlace, setFilterPlace] = useState<string | null>(null);
  const [filterSituation, setFilterSituation] = useState<string | null>(null);
  const [triggersByCategoryExpanded, setTriggersByCategoryExpanded] = useState(false);

  function parseDayIdLocal(id: string) {
    const [y, m, d] = id.split('-').map(Number);
    return new Date(y, (m ?? 1) - 1, d ?? 1);
  }

  const startMs = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 364);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'moods'),
      orderBy('updatedAt', 'desc'),
      limit(450)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as MoodDoc }));
      const filtered = rows.filter((r) => {
        const d = parseDayIdLocal(r.id);
        return d.getTime() >= startMs;
      });
      filtered.sort((a, b) => a.id.localeCompare(b.id));
      setMoods(filtered);
    });

    return unsub;
  }, [user, startMs]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'users', user.uid, 'thoughtLogs'),
      orderBy('createdAt', 'desc'),
      limit(1200)
    );

    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as ThoughtLogDoc }));
      const filtered = rows.filter((r) => {
        const ts = r.data.createdAt?.toDate?.();
        const ms = ts ? ts.getTime() : null;
        return ms == null ? true : ms >= startMs;
      });
      setThoughts(filtered);
    });

    return unsub;
  }, [user, startMs]);

  const moodByDay = useMemo(() => {
    const m = new Map<string, number>();
    moods.forEach((r) => { if (typeof r.data.value === 'number') m.set(r.id, r.data.value); });
    return m;
  }, [moods]);

  const panicCountByDay = useMemo(() => {
    const m = new Map<string, number>();
    thoughts.forEach((r) => {
      const ts = r.data.createdAt?.toDate?.();
      if (!ts) return;
      const id = toDayIdLocal(ts);
      m.set(id, (m.get(id) ?? 0) + 1);
    });
    return m;
  }, [thoughts]);

  const correlation = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];

    moodByDay.forEach((mood, dayId) => {
      const p = panicCountByDay.get(dayId);
      if (p == null) return;
      xs.push(mood);
      ys.push(p);
    });

    return {
      r: xs.length >= 3 ? pearson(xs, ys) : null,
      n: xs.length,
    };
  }, [moodByDay, panicCountByDay]);

  const filteredThoughts = useMemo(() => {
    if (!filterPlace && !filterSituation) return thoughts;
    return thoughts.filter((r) => {
      if (filterPlace && r.data.place !== filterPlace) return false;
      if (filterSituation && r.data.situation !== filterSituation) return false;
      return true;
    });
  }, [thoughts, filterPlace, filterSituation]);

  const topTriggers = useMemo(() => getTopTriggers(filteredThoughts, 90), [filteredThoughts]);

  const triggersByPlace = useMemo(() => {
    const result: { place: string; triggers: { word: string; freq: number; panicPercent: number }[] }[] = [];
    PLACE_OPTIONS.forEach((opt) => {
      const subset = thoughts.filter((r) => r.data.place === opt.value);
      if (subset.length < 3) return;
      const triggers = getTopTriggers(subset, 365);
      if (triggers.length) result.push({ place: opt.value, triggers });
    });
    return result;
  }, [thoughts]);

  const triggersBySituation = useMemo(() => {
    const result: { situation: string; triggers: { word: string; freq: number; panicPercent: number }[] }[] = [];
    SITUATION_OPTIONS.forEach((opt) => {
      const subset = thoughts.filter((r) => r.data.situation === opt.value);
      if (subset.length < 3) return;
      const triggers = getTopTriggers(subset, 365);
      if (triggers.length) result.push({ situation: opt.value, triggers });
    });
    return result;
  }, [thoughts]);

  const heatmapValues: HeatmapValue[] = useMemo(() => {
    const values: HeatmapValue[] = [];

    if (mode === 'mood') {
      moodByDay.forEach((mood, dayId) => {
        const count = clamp(Math.round(mood) - 1, 0, 4);
        if (Number.isFinite(count)) values.push({ date: dayId, count });
      });
    } else {
      panicCountByDay.forEach((cnt, dayId) => {
        const count =
          cnt >= 8 ? 4 :
          cnt >= 5 ? 3 :
          cnt >= 3 ? 2 : 1;
        values.push({ date: dayId, count });
      });
    }

    return values;
  }, [mode, moodByDay, panicCountByDay]);

  const moodColors = ['#532550', '#7F1D1D', '#B45309', '#15803D', '#22C55E'];
  const panicColors = ['#472545', '#395dc1', '#122f6d', '#F59E0B', '#EF4444'];
  const colorArray = mode === 'mood' ? moodColors : panicColors;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1220' }} edges={['top']}>
      <ScrollView style={{ flex: 1, backgroundColor: '#0B1220' }} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#111827' }}
        >
          <Text style={{ color: 'white' }}>{t('common.back')}</Text>
        </TouchableOpacity>

        <Text style={{ color: 'white', fontSize: 22 }}>{t('insights.title')}</Text>

        {__DEV__ && (
          <TouchableOpacity
            onPress={async () => {
              if (!user?.uid) return;
              await devSeedInsightsData(user.uid, 180);
            }}
            style={{ backgroundColor: '#334155', padding: 10, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', textAlign: 'center' }}>{t('insights.devSeed')}</Text>
          </TouchableOpacity>
        )}

        {/* Korelacija */}
        <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 6 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>{t('insights.correlation')}</Text>
          <Text style={{ color: '#94A3B8' }}>
            {correlation.r == null
              ? t('insights.noDataCorrelation', { n: correlation.n })
              : `r=${correlation.r.toFixed(2)} (broj dana: ${correlation.n})`}
          </Text>
          {correlation.r != null && (
            <Text style={{ color: '#94A3B8' }}>
              {correlation.r <= -0.3
                ? 'Kad mood pada, panika često raste.'
                : correlation.r >= 0.3
                  ? 'Kad mood raste, panika često raste (proveri okidače).'
                  : 'Nema jasne veze (za sad).'}
            </Text>
          )}
        </View>

        {/* Top Triggers */}
        <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 8 }}>
          <Text style={{ color: 'white', fontSize: 16 }}>{t('insights.topTriggers')}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 12 }}>{t('insights.filterByTag')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PLACE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={'p-' + opt.value}
                onPress={() => setFilterPlace(filterPlace === opt.value ? null : opt.value)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: filterPlace === opt.value ? '#2563EB' : '#0F172A',
                }}
              >
                <Text style={{ color: filterPlace === opt.value ? 'white' : '#94A3B8', fontSize: 12 }}>{t(`place.${opt.value}`)}</Text>
              </TouchableOpacity>
            ))}
            {SITUATION_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={'s-' + opt.value}
                onPress={() => setFilterSituation(filterSituation === opt.value ? null : opt.value)}
                style={{
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: filterSituation === opt.value ? '#2563EB' : '#0F172A',
                }}
              >
                <Text style={{ color: filterSituation === opt.value ? 'white' : '#94A3B8', fontSize: 12 }}>{t(`situation.${opt.value}`)}</Text>
              </TouchableOpacity>
            ))}
            {(filterPlace || filterSituation) && (
              <TouchableOpacity
                onPress={() => { setFilterPlace(null); setFilterSituation(null); }}
                style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: '#475569' }}
              >
                <Text style={{ color: 'white', fontSize: 12 }}>{t('common.removeFilter')}</Text>
              </TouchableOpacity>
            )}
          </View>
          {topTriggers.length === 0 ? (
            <Text style={{ color: '#94A3B8' }}>{t('insights.noTriggers')}</Text>
          ) : (
            topTriggers.map((trigger, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor: '#0F172A',
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: 'white', fontSize: 15, fontWeight: '600' }}>"{trigger.word}"</Text>
                <Text style={{ color: '#94A3B8' }}>
                  {trigger.freq}× · {trigger.panicPercent}% panic
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Okidači po kategoriji */}
        <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setTriggersByCategoryExpanded(!triggersByCategoryExpanded)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>{t('insights.triggersByCategory')}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 18 }}>{triggersByCategoryExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>
          {triggersByCategoryExpanded && (
            <>
              <Text style={{ color: '#94A3B8', fontSize: 12 }}>{t('insights.byPlaceSituation')}</Text>
              {triggersByPlace.length === 0 && triggersBySituation.length === 0 ? (
                <Text style={{ color: '#94A3B8' }}>{t('insights.noTagsCategory')}</Text>
              ) : (
                <>
                  {triggersByPlace.map(({ place, triggers }) => (
                    <View key={place} style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 10, gap: 6 }}>
                      <Text style={{ color: '#60A5FA', fontWeight: '600' }}>{t('insights.place')}: {t(`place.${place}`)}</Text>
                      {triggers.slice(0, 4).map((tr, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'white' }}>"{tr.word}"</Text>
                          <Text style={{ color: '#94A3B8' }}>{tr.freq}× · {tr.panicPercent}%</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  {triggersBySituation.map(({ situation, triggers }) => (
                    <View key={situation} style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 10, gap: 6 }}>
                      <Text style={{ color: '#60A5FA', fontWeight: '600' }}>{t('insights.situation')}: {t(`situation.${situation}`)}</Text>
                      {triggers.slice(0, 4).map((tr, i) => (
                        <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'white' }}>"{tr.word}"</Text>
                          <Text style={{ color: '#94A3B8' }}>{tr.freq}× · {tr.panicPercent}%</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>

        {/* COLLAPSIBLE Heatmap - klik na header toggle */}
        <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 14, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setHeatmapExpanded(!heatmapExpanded)}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text style={{ color: 'white', fontSize: 16 }}>{t('insights.heatmap')}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 18 }}>{heatmapExpanded ? '▼' : '▶'}</Text>
          </TouchableOpacity>

          {heatmapExpanded && (
            <>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => setMode('mood')}
                  style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: mode === 'mood' ? '#2563EB' : '#0F172A' }}
                >
                  <Text style={{ color: 'white', textAlign: 'center' }}>{t('insights.mood')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMode('panic')}
                  style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: mode === 'panic' ? '#F59E0B' : '#0F172A' }}
                >
                  <Text style={{ color: 'white', textAlign: 'center' }}>{t('insights.panic')}</Text>
                </TouchableOpacity>
              </View>

              <VerticalCalendarHeatmap
                values={heatmapValues}
                colors={colorArray}
                emptyColor="#0F172A"
                cell={34}
                gap={6}
                monthsBack={12}
                onPressDate={(dateId) => setSelectedDate(dateId)}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ color: '#94A3B8' }}>{t('insights.less')}</Text>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {colorArray.map((c, i) => (
                    <View key={i} style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: c }} />
                  ))}
                </View>
                <Text style={{ color: '#94A3B8' }}>{t('insights.more')}</Text>
              </View>

              <Text style={{ color: '#94A3B8' }}>
                {mode === 'mood' ? t('insights.moodHeatmapHint') : t('insights.panicHeatmapHint')}
              </Text>

              {__DEV__ && (
                <Text style={{ color: '#94A3B8' }}>
                  moods={moods.length} thoughtLogs={thoughts.length} pairedDays={correlation.n}
                </Text>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Modal za selektovan dan */}
      <Modal
        visible={selectedDate != null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 }}>
          <View style={{ backgroundColor: '#111827', borderRadius: 16, padding: 14, gap: 10 }}>
            <Text style={{ color: 'white', fontSize: 18 }}>{t('insights.dayDetails')}</Text>

            <Text style={{ color: '#94A3B8' }}>
              {selectedDate}
            </Text>

            <Text style={{ color: 'white' }}>
              {t('insights.moodLabel')}: {selectedDate ? (moodByDay.get(selectedDate) ?? '—') : '—'} / 5
            </Text>

            <Text style={{ color: 'white' }}>
              {t('insights.thoughtLogsCount')}: {selectedDate ? (panicCountByDay.get(selectedDate) ?? 0) : 0}
            </Text>

            <TouchableOpacity
              onPress={() => {
                setSelectedDate(null);
                navigation.navigate('MojiLogovi', { dateId: selectedDate });
              }}
              style={{ backgroundColor: '#2563EB', borderRadius: 12, padding: 10 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>{t('insights.openLogsForDay')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedDate(null)}
              style={{ backgroundColor: '#0F172A', borderRadius: 12, padding: 10 }}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>{t('insights.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

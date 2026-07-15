import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { logRitualEvent } from '../utils/ritualPlans';
import { useAuth } from '../context/authContext';
import { unlockAchievement } from '../utils/achievements';
import { playCompleteSound } from '../utils/playCompleteSound';
import { theme } from '../theme';

type PhaseKey = 'inhale' | 'hold1' | 'exhale' | 'hold2';

type PhaseDef = { key: PhaseKey; labelKey: string; seconds: number; targetScale: number };

const BOX_PHASES: PhaseDef[] = [
  { key: 'inhale', labelKey: 'breathing.phaseInhale', seconds: 4, targetScale: 1.22 },
  { key: 'hold1', labelKey: 'breathing.phaseHold', seconds: 4, targetScale: 1.22 },
  { key: 'exhale', labelKey: 'breathing.phaseExhale', seconds: 4, targetScale: 0.82 },
  { key: 'hold2', labelKey: 'breathing.phaseHold', seconds: 4, targetScale: 0.82 },
];

const CALM_PHASES: PhaseDef[] = [
  { key: 'inhale', labelKey: 'breathing.phaseInhale', seconds: 4, targetScale: 1.22 },
  { key: 'hold1', labelKey: 'breathing.phaseHold', seconds: 7, targetScale: 1.22 },
  { key: 'exhale', labelKey: 'breathing.phaseExhale', seconds: 8, targetScale: 0.82 },
];

/** Duži izdah: udah 4s, kratka pauza 2s, izdah 6s — aktivira vagalni tonus, smiruje. */
const LONG_EXHALE_PHASES: PhaseDef[] = [
  { key: 'inhale', labelKey: 'breathing.phaseInhale', seconds: 4, targetScale: 1.22 },
  { key: 'hold1', labelKey: 'breathing.phaseHold', seconds: 2, targetScale: 1.22 },
  { key: 'exhale', labelKey: 'breathing.phaseExhale', seconds: 6, targetScale: 0.82 },
];

const PATTERN_LABELS: readonly string[] = ['breathing.patternBox', 'breathing.patternCalm', 'breathing.patternLongExhale'];

const PATTERNS = [
  { id: 'box', descKey: 'breathing.descBox', phases: BOX_PHASES },
  { id: 'calm', descKey: 'breathing.descCalm', phases: CALM_PHASES },
  { id: 'longExhale', descKey: 'breathing.descLongExhale', phases: LONG_EXHALE_PHASES },
] as const;

const DURATIONS = [30, 60, 120, 180, 300] as const;

const format = (sec: number) => (sec < 60 ? `${sec}s` : `${Math.round(sec / 60)}m`);
const formatMMSS = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function BreathingScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const initialDuration = (route?.params?.durationSec as number) ?? 60;
  const [patternIndex, setPatternIndex] = useState(0);
  const [durationSec, setDurationSec] = useState(initialDuration);
  const [running, setRunning] = useState(true);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(PATTERNS[0].phases[0].seconds);
  const [totalRemaining, setTotalRemaining] = useState(durationSec);
  const [showSuccess, setShowSuccess] = useState(false);
  const { user } = useAuth();
  const source = route?.params?.source;
  const planId = route?.params?.planId ?? null;

  const phases = PATTERNS[patternIndex].phases;
  const phase = phases[phaseIndex];

  const scale = useRef(new Animated.Value(1)).current;
  const deadlineMsRef = useRef<number>(Date.now() + phases[0].seconds * 1000);
  const lastTotalDecSecRef = useRef<number>(Math.floor(Date.now() / 1000));
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (source === 'sos' && user?.uid) {
      unlockAchievement(user.uid, 'sos_first').catch(() => {});
    }
  }, [source, user?.uid]);

  const setPhase = async (idx: number) => {
    const p = phases[idx];
    setPhaseIndex(idx);
    setRemaining(p.seconds);
    deadlineMsRef.current = Date.now() + p.seconds * 1000;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
    Animated.timing(scale, {
      toValue: p.targetScale,
      duration: p.seconds * 1000,
      useNativeDriver: true,
    }).start();
  };

  const reset = async (nextDuration?: number, nextPatternIndex?: number) => {
    const d = nextDuration ?? durationSec;
    const pIdx = nextPatternIndex ?? patternIndex;
    const ph = PATTERNS[pIdx].phases;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {}
    setRunning(true);
    setTotalRemaining(d);
    setDurationSec(d);
    if (nextPatternIndex !== undefined) setPatternIndex(nextPatternIndex);
    setPhaseIndex(0);
    setRemaining(ph[0].seconds);
    deadlineMsRef.current = Date.now() + ph[0].seconds * 1000;
    lastTotalDecSecRef.current = Math.floor(Date.now() / 1000);
    Animated.timing(scale, {
      toValue: ph[0].targetScale,
      duration: ph[0].seconds * 1000,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    setTotalRemaining(initialDuration);
    setDurationSec(initialDuration);
    setPhaseIndex(0);
    const ph = PATTERNS[0].phases;
    setRemaining(ph[0].seconds);
    deadlineMsRef.current = Date.now() + ph[0].seconds * 1000;
    lastTotalDecSecRef.current = Math.floor(Date.now() / 1000);
    Animated.timing(scale, {
      toValue: ph[0].targetScale,
      duration: ph[0].seconds * 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (!running) return;
      const now = Date.now();
      const r = Math.max(0, Math.ceil((deadlineMsRef.current - now) / 1000));
      setRemaining(r);
      const currentSec = Math.floor(now / 1000);
      if (currentSec > lastTotalDecSecRef.current) {
        const elapsed = currentSec - lastTotalDecSecRef.current;
        lastTotalDecSecRef.current = currentSec;
        setTotalRemaining((t) => Math.max(0, t - elapsed));
      }
    }, 250);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [running, patternIndex]);

  useEffect(() => {
    if (running && pausedAtRef.current) {
      const delta = Date.now() - pausedAtRef.current;
      deadlineMsRef.current += delta;
      pausedAtRef.current = null;
    } else if (!running) {
      pausedAtRef.current = Date.now();
    }
  }, [running]);

  useEffect(() => {
    if (!running || remaining !== 0) return;
    const next = (phaseIndex + 1) % phases.length;
    setPhase(next);
  }, [remaining, running, phaseIndex, phases.length]);

  useEffect(() => {
    if (!running || totalRemaining !== 0) return;
    setRunning(false);
    setShowSuccess(true);
    (async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      playCompleteSound().catch(() => {});
      try {
        if (user?.uid) {
          await logRitualEvent(user.uid, { stepType: 'breathing', planId, source });
        }
      } catch {}
    })();
  }, [totalRemaining, running, user?.uid, planId, source]);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [showSuccess]);

  const progress = useMemo(() => {
    if (!durationSec) return 1;
    return 1 - totalRemaining / durationSec;
  }, [durationSec, totalRemaining]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: theme.padding.screen, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={async () => {
              try { await Haptics.selectionAsync(); } catch {}
              navigation.goBack();
            }}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.card }}
          >
            <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.colors.text, fontSize: 18 }}>{t('breathing.title')}</Text>
          <View style={{ width: 70 }} />
        </View>

        <Text style={{ color: theme.colors.textMuted, fontSize: 14 }}>
          {t(PATTERNS[patternIndex].descKey)}
        </Text>

        {/* Pattern selector */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {PATTERNS.map((_, idx) => {
            const active = idx === patternIndex;
            return (
              <TouchableOpacity
                key={idx}
                onPress={async () => {
                  try { await Haptics.selectionAsync(); } catch {}
                  reset(durationSec, idx);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 999,
                  backgroundColor: active ? theme.colors.primary + '28' : theme.colors.card,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.cardBorder,
                }}
              >
                <Text style={{ color: active ? theme.colors.primary : theme.colors.textMuted, fontWeight: active ? '600' : '400' }}>
                  {t(PATTERN_LABELS[idx])}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Duration chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {DURATIONS.map((d) => {
            const active = d === durationSec;
            return (
              <TouchableOpacity
                key={d}
                onPress={async () => {
                  try { await Haptics.selectionAsync(); } catch {}
                  reset(d);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 10,
                  borderRadius: 999,
                  backgroundColor: active ? theme.colors.cardMuted : theme.colors.card,
                  borderWidth: 1,
                  borderColor: active ? theme.colors.primary : theme.colors.cardBorder,
                }}
              >
                <Text style={{ color: active ? theme.colors.text : theme.colors.textMuted }}>{format(d)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 8, backgroundColor: theme.colors.cardMuted, borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.cardBorder }}>
          <View style={{ height: 8, width: `${Math.round(progress * 100)}%`, backgroundColor: theme.colors.primary }} />
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingBottom: 24 }}>
          <Animated.View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: theme.colors.primary + '22',
              borderWidth: 3,
              borderColor: theme.colors.primary + '99',
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ scale }],
              marginBottom: 20,
            }}
          >
            <Text style={{ color: theme.colors.textMuted, fontSize: 16 }}>{t(phase.labelKey)}</Text>
            <Text style={{ color: theme.colors.text, fontSize: 52, fontVariant: ['tabular-nums'] as any }}>
              {remaining}
            </Text>
          </Animated.View>
          <Text style={{ color: theme.colors.textDim }}>
            {t('breathing.remaining')}: {formatMMSS(totalRemaining)}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={async () => {
              try { await Haptics.selectionAsync(); } catch {}
              setRunning((r) => !r);
            }}
            style={{ flex: 1, backgroundColor: theme.colors.card, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.colors.cardBorder }}
          >
            <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{running ? t('breathing.pause') : t('breathing.resume')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => reset()}
            style={{ flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: 14 }}
          >
            <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('breathing.repeat')} {format(durationSec)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: theme.colors.card, borderRadius: 24, padding: 32, alignItems: 'center', minWidth: 220 }}>
            <LottieView
              source={require('../assets/animation/breathing.json')}
              autoPlay
              loop={false}
              style={{ width: 120, height: 120 }}
              onAnimationFinish={() => setShowSuccess(false)}
            />
            <Text style={{ color: theme.colors.text, fontSize: 20, marginTop: 12 }}>{t('breathing.complete')}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

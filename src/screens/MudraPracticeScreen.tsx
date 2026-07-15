import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Text, TouchableOpacity, View, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import { useTranslation } from 'react-i18next';
import { useKeepAwake } from 'expo-keep-awake'; // [web:879]
import { MUDRAS } from '../data/mudras';
import { haptics } from '../utils/haptics';
import { useAuth } from '../context/authContext';
import { logRitualEvent } from '../utils/ritualPlans';
import { playCompleteSound } from '../utils/playCompleteSound';
import { theme } from '../theme';


function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

type Phase = 'prep' | 'practice' | 'done';

export default function MudraPracticeScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const source = route?.params?.source;
  const planId = route?.params?.planId ?? null;
  useKeepAwake(); // [web:879]

  const mudraId = route?.params?.mudraId as string;
  const minutes = (route?.params?.minutes as number) ?? 5;

  const mudra = useMemo(() => MUDRAS.find((m) => m.id === mudraId), [mudraId]);

  const prepSeconds = 10;
  const practiceSeconds = Math.max(1, Math.round(minutes * 60));

  const [phase, setPhase] = useState<Phase>('prep');
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(prepSeconds);
  const [showSuccess, setShowSuccess] = useState(false);

  const [cueText, setCueText] = useState<string | null>(null);
  const [lastCue, setLastCue] = useState<string | null>(null);

  // robust timer: one interval + deadline
  const deadlineMsRef = useRef<number>(Date.now() + prepSeconds * 1000);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedAtRef = useRef<number | null>(null);
  const loggedDoneRef = useRef(false);

  const totalSeconds = phase === 'prep' ? prepSeconds : phase === 'practice' ? practiceSeconds : 0;
  const progress = totalSeconds ? 1 - remaining / totalSeconds : 1;

  const startPhase = (p: Phase) => {
    const now = Date.now();
    const secs = p === 'prep' ? prepSeconds : p === 'practice' ? practiceSeconds : 0;
    setPhase(p);
    setPaused(false);
    setCueText(null);
    setLastCue(null);
    deadlineMsRef.current = now + secs * 1000;
    setRemaining(secs);
    loggedDoneRef.current = false;
  };

  useEffect(() => {
    // ensure exactly one interval exists
    if (tickRef.current) clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      if (paused || phase === 'done') return;
      const r = Math.max(0, Math.ceil((deadlineMsRef.current - Date.now()) / 1000));
      setRemaining(r);
    }, 250);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [paused, phase]); // prevents “timer goes crazy” from stacked intervals [web:924][web:929]

  useEffect(() => {
    // pause should freeze time
    if (paused) {
      pausedAtRef.current = Date.now();
      return;
    }
    if (pausedAtRef.current) {
      const delta = Date.now() - pausedAtRef.current;
      deadlineMsRef.current += delta;
      pausedAtRef.current = null;
    }
  }, [paused]);

  // guided cues during practice
  useEffect(() => {
    if (phase !== 'practice') return;
    if (paused) return;

    const half = Math.floor(practiceSeconds * 0.5);
    const quarter = Math.floor(practiceSeconds * 0.25);

    const fire = (key: string, text: string, pattern: number[]) => {
      if (lastCue === key) return;
      setLastCue(key);
      setCueText(text);
      Vibration.vibrate(pattern);
      setTimeout(() => setCueText(null), 2500);
    };

    if (remaining === half) fire('half', t('mudras.cueHalf'), [0, 200, 120, 200]);
    if (remaining === quarter) fire('quarter', t('mudras.cueQuarter'), [0, 200]);
    if (remaining === 10) fire('ten', t('mudras.cueTen'), [0, 100, 80, 100, 80, 100]);
    if (remaining === half) haptics.medium();
    if (remaining === quarter) haptics.light();
    if (remaining === 10) haptics.heavy();
  }, [phase, paused, remaining, practiceSeconds, lastCue]);

  // phase transitions
  useEffect(() => {
    if (paused) return;
    if (remaining !== 0) return;

    if (phase === 'prep') {
      startPhase('practice');
      haptics.medium();

      return;
    }
    if (phase === 'practice') {
      setPhase('done');
      setShowSuccess(true);
      if (remaining === 0) haptics.success();
      playCompleteSound().catch(() => {});

      if (!loggedDoneRef.current) {
        loggedDoneRef.current = true;
        (async () => {
          try {
            if (user?.uid) {
              await logRitualEvent(user.uid, {
                stepType: 'mudra',
                planId,
                source,
              });
            }
          } catch {}
        })();
      }
    }

  }, [paused, remaining, phase]);

  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => setShowSuccess(false), 2500);
    return () => clearTimeout(t);
  }, [showSuccess]);

  const mistakeHint = useMemo(() => {
    if (!mudra) return null;
    if (phase !== 'practice') return null;
    const arr = mudra.mistakeKeys ?? [];
    if (!arr.length) return null;
    const idx = Math.floor((practiceSeconds - remaining) / 15) % arr.length;
    return t(arr[idx]);
  }, [mudra?.mistakeKeys, phase, remaining, practiceSeconds, t]);


  if (!mudra) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ flex: 1, padding: theme.padding.screen, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.text }}>{t('mudras.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const title = phase === 'prep' ? t('mudras.prep') : phase === 'practice' ? t('mudras.practice') : t('mudras.done');

  const guidance =
    phase === 'prep'
      ? `${t('mudras.prepGuidance')}\n${t(mudra.howKey)}`
      : phase === 'practice'
        ? `${t(mudra.breathKey)}\n${t('mudras.sectionFocus')}: ${t(mudra.focusKey)}`
        : t('mudras.doneGuidance');


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: theme.padding.screen, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.card }}
          >
            <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.colors.text, fontSize: 18 }} numberOfLines={1}>{t(mudra.titleKey)}</Text>
          <View style={{ width: 70 }} />
        </View>

        <View style={{ height: 8, backgroundColor: theme.colors.cardMuted, borderRadius: 99, overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.cardBorder }}>
          <View style={{ height: 8, width: `${Math.round(progress * 100)}%`, backgroundColor: theme.colors.primary }} />
        </View>

        <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 14, gap: 10, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
          <Text style={{ color: theme.colors.textMuted }}>{title}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 44, textAlign: 'center', fontVariant: ['tabular-nums'] as any }}>
            {formatMMSS(remaining)}
          </Text>
          <Text style={{ color: theme.colors.text }}>{guidance}</Text>

          {cueText && (
            <View style={{ backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 10, borderRadius: 14 }}>
              <Text style={{ color: theme.colors.text }}>{cueText}</Text>
            </View>
          )}

          {phase !== 'done' ? (
            <>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setPaused((p) => !p)}
                  style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 12, borderRadius: 14 }}
                >
                  <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{paused ? t('mudras.resume') : t('mudras.pause')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setPaused(false); setPhase('done'); setShowSuccess(true); }}
                  style={{ flex: 1, backgroundColor: theme.colors.danger, padding: 12, borderRadius: 14 }}
                >
                  <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('mudras.finish')}</Text>
                </TouchableOpacity>
              </View>
              {phase === 'practice' && mistakeHint && (
                <View style={{ backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 10, borderRadius: 14 }}>
                  <Text style={{ color: theme.colors.textMuted }}>{t('mudras.watchOut')}</Text>
                  <Text style={{ color: theme.colors.text }}>{mistakeHint}</Text>
                </View>
              )}
            </>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => startPhase('prep')}
                style={{ flex: 1, backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 12, borderRadius: 14 }}
              >
                <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('mudras.repeat')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{ flex: 1, backgroundColor: theme.colors.primary, padding: 12, borderRadius: 14 }}
              >
                <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('common.back')}</Text>
              </TouchableOpacity>
            </View>
          )}
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
            <Text style={{ color: theme.colors.text, fontSize: 20, marginTop: 12 }}>{t('mudras.done')}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

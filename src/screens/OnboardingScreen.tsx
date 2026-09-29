import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { AppBackground } from '../components/ui/AppBackground';
import { Button } from '../components/ui/Button';

const { width: W } = Dimensions.get('window');

type Slide =
  | { key: string; kind: 'info'; titleKey: string; bodyKey: string; emoji: string }
  | { key: string; kind: 'breath' };

function BreathDemo() {
  const { t } = useTranslation();
  const scale = useRef(new Animated.Value(0.85)).current;
  const [phase, setPhase] = useState<'inhale' | 'exhale'>('inhale');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const run = () => {
      setPhase('inhale');
      Animated.timing(scale, { toValue: 1.15, duration: 4000, useNativeDriver: true }).start(async () => {
        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch {}
        setPhase('exhale');
        Animated.timing(scale, { toValue: 0.85, duration: 5000, useNativeDriver: true }).start(async () => {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch {}
          setDone(true);
        });
      });
    };
    run();
  }, [done, scale]);

  return (
    <View style={{ alignItems: 'center', gap: 20, marginTop: 8 }}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => {
          if (done) {
            setDone(false);
            scale.setValue(0.85);
          }
        }}
      >
        <Animated.View
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: theme.colors.primary + '33',
            borderWidth: 2,
            borderColor: theme.colors.primary,
            transform: [{ scale }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: theme.colors.text, fontFamily: theme.typography.fontSemiBold }}>
            {done ? '✓' : phase === 'inhale' ? '↑' : '↓'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
      <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted, textAlign: 'center' }]}>
        {done ? t('onboarding.tryBreathDone') : t('onboarding.tryBreathBody')}
      </Text>
    </View>
  );
}

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    { key: '1', kind: 'info', titleKey: 'onboarding.welcomeTitle', bodyKey: 'onboarding.welcomeBody', emoji: '💙' },
    { key: '2', kind: 'info', titleKey: 'onboarding.moodTitle', bodyKey: 'onboarding.moodBody', emoji: '📊' },
    { key: 'breath', kind: 'breath' },
    { key: '3', kind: 'info', titleKey: 'onboarding.sosTitle', bodyKey: 'onboarding.sosBody', emoji: '🆘' },
    { key: '4', kind: 'info', titleKey: 'onboarding.plansTitle', bodyKey: 'onboarding.plansBody', emoji: '📋' },
    { key: '5', kind: 'info', titleKey: 'onboarding.finishTitle', bodyKey: 'onboarding.finishBody', emoji: '✨' },
  ];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / W);
    if (i >= 0 && i < slides.length) setIndex(i);
  };

  const goNext = () => {
    if (index < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      onComplete();
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => {
    if (item.kind === 'breath') {
      return (
        <View style={{ width: W, paddingHorizontal: theme.padding.screen * 2, justifyContent: 'center', flex: 1 }}>
          <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 16 }}>🌬️</Text>
          <Text style={[theme.typography.hero, { color: theme.colors.text, textAlign: 'center', marginBottom: 12 }]}>
            {t('onboarding.tryBreathTitle')}
          </Text>
          <BreathDemo />
        </View>
      );
    }
    return (
      <View style={{ width: W, paddingHorizontal: theme.padding.screen * 2, justifyContent: 'center', flex: 1 }}>
        <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 24 }}>{item.emoji}</Text>
        <Text style={[theme.typography.hero, { color: theme.colors.text, textAlign: 'center', marginBottom: 16 }]}>
          {t(item.titleKey)}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
          {t(item.bodyKey)}
        </Text>
      </View>
    );
  };

  return (
    <AppBackground>
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <FlatList
        ref={listRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
      />
      <View style={{ paddingHorizontal: theme.padding.screen, paddingBottom: 28, gap: 18 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === index ? 22 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? theme.colors.primary : theme.colors.cardBorder,
              }}
            />
          ))}
        </View>
        <Button
          title={index < slides.length - 1 ? t('onboarding.next') : t('onboarding.start')}
          variant="primary"
          onPress={goNext}
        />
      </View>
    </SafeAreaView>
    </AppBackground>
  );
}

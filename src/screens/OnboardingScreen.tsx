import React, { useRef, useState } from 'react';
import {
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
import { theme } from '../theme';

const { width: W } = Dimensions.get('window');

type Slide = { key: string; titleKey: string; bodyKey: string; emoji: string };

export default function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    { key: '1', titleKey: 'onboarding.welcomeTitle', bodyKey: 'onboarding.welcomeBody', emoji: '💙' },
    { key: '2', titleKey: 'onboarding.moodTitle', bodyKey: 'onboarding.moodBody', emoji: '📊' },
    { key: '3', titleKey: 'onboarding.sosTitle', bodyKey: 'onboarding.sosBody', emoji: '🆘' },
    { key: '4', titleKey: 'onboarding.plansTitle', bodyKey: 'onboarding.plansBody', emoji: '📋' },
    { key: '5', titleKey: 'onboarding.finishTitle', bodyKey: 'onboarding.finishBody', emoji: '✨' },
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

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={{ width: W, paddingHorizontal: theme.padding.screen * 2, justifyContent: 'center', flex: 1 }}>
      <Text style={{ fontSize: 56, textAlign: 'center', marginBottom: 24 }}>{item.emoji}</Text>
      <Text style={[theme.typography.hero, { color: theme.colors.text, textAlign: 'center', marginBottom: 16 }]}>
        {t(item.titleKey)}
      </Text>
      <Text style={{ fontSize: 16, color: theme.colors.textMuted, lineHeight: 24, textAlign: 'center' }}>
        {t(item.bodyKey)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom']}>
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
      <View style={{ paddingHorizontal: theme.padding.screen, paddingBottom: 32, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === index ? theme.colors.primary : theme.colors.cardBorder,
              }}
            />
          ))}
        </View>
        <TouchableOpacity
          activeOpacity={theme.activeOpacity}
          onPress={goNext}
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: theme.padding.button,
            borderRadius: theme.radius.button,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: theme.colors.text, fontSize: 16, fontWeight: '600' }}>
            {index < slides.length - 1 ? t('onboarding.next') : t('onboarding.start')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

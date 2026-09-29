import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { RecommendationCard } from '../ui/RecommendationCard';
import { Button } from '../ui/Button';

export type HomeRec = {
  titleKey: string;
  reasonKey: string;
  accentColor: string;
  action: string;
  params?: unknown;
};

type Props = {
  isPremium: boolean;
  recs: HomeRec[];
  showAllRecs: boolean;
  onToggleShowAll: () => void;
  onPressRec: (rec: HomeRec) => void;
  onShowPaywall: () => void;
};

export function HomeRecommendationsSection({
  isPremium,
  recs,
  showAllRecs,
  onToggleShowAll,
  onPressRec,
  onShowPaywall,
}: Props) {
  const { t } = useTranslation();
  const preview = recs[0];

  return (
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, fontSize: 16 }]}>{t('home.recommendations')}</Text>
        {isPremium && recs.length > 1 ? (
          <TouchableOpacity
            activeOpacity={theme.activeOpacity}
            onPress={onToggleShowAll}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.cardMuted,
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
            }}
          >
            <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{showAllRecs ? t('home.showOne') : t('home.showAll')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('home.recommendationsSubtitle')}</Text>

      {isPremium ? (
        (showAllRecs ? recs : recs.slice(0, 1)).map((r, idx) => (
          <RecommendationCard
            key={`${r.titleKey}-${idx}`}
            title={t(r.titleKey)}
            reason={t(r.reasonKey)}
            accentColor={r.accentColor}
            onPress={() => onPressRec(r)}
          />
        ))
      ) : preview ? (
        <View style={{ gap: 10 }}>
          <View style={{ position: 'relative', borderRadius: theme.radius.cardSmall, overflow: 'hidden' }}>
            <RecommendationCard title={t(preview.titleKey)} reason={t(preview.reasonKey)} accentColor={preview.accentColor} disabled />
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: theme.colors.overlay,
                justifyContent: 'center',
                alignItems: 'center',
                padding: 12,
              }}
            >
              <Text style={[theme.typography.bodySmall, { color: theme.colors.text, textAlign: 'center' }]}>{t('home.proRecommendationsLocked')}</Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={theme.activeOpacity}
            onPress={onShowPaywall}
            style={{
              backgroundColor: theme.colors.primary + '22',
              borderRadius: theme.radius.button,
              padding: theme.padding.button,
              borderWidth: 1,
              borderColor: theme.colors.primary,
            }}
          >
            <Text style={[theme.typography.body, { color: theme.colors.text, textAlign: 'center', fontFamily: theme.typography.fontSemiBold }]}>
              {t('home.proRecommendationsTeaser')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Button title={t('home.buyProRecommendations')} onPress={onShowPaywall} />
      )}
    </View>
  );
}

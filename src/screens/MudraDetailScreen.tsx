import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MUDRAS } from '../data/mudras';
import { theme } from '../theme';

const MIN_OPTIONS = [3, 5, 7, 10, 15];

function BulletList({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((item, i) => (
        <Text key={`${i}-${item}`} style={{ color: theme.colors.text, lineHeight: 20 }}>
          {'\u2022'} {item}
        </Text>
      ))}
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: theme.colors.textMuted }}>{title}</Text>
      {children}
    </View>
  );
}

export default function MudraDetailScreen({ navigation, route }: any) {
  const { t } = useTranslation();
  const mudraId = route?.params?.mudraId as string;
  const mudra = useMemo(() => MUDRAS.find((m) => m.id === mudraId), [mudraId]);

  const [minutes, setMinutes] = useState<number>(mudra?.durationMinDefault ?? 5);

  if (!mudra) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
        <View style={{ flex: 1, padding: theme.padding.screen, justifyContent: 'center' }}>
          <Text style={{ color: theme.colors.text }}>{t('mudras.notFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const mistakeItems = mudra.mistakeKeys.map((k) => t(k));
  const benefitItems = mudra.benefitKeys.map((k) => t(k));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: theme.padding.screen, gap: 12, paddingBottom: 28 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.card }}
        >
          <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
        </TouchableOpacity>

        <View style={{ backgroundColor: theme.colors.card, borderRadius: 18, padding: 14, gap: 12, borderWidth: 1, borderColor: theme.colors.cardBorder }}>
          <Text style={{ color: theme.colors.text, fontSize: 20 }}>{t(mudra.titleKey)}</Text>
          <Text style={{ color: theme.colors.textMuted }}>{t(mudra.summaryKey)}</Text>

          <Section title={t('mudras.sectionHow')}>
            <Text style={{ color: theme.colors.text, lineHeight: 20 }}>{t(mudra.howKey)}</Text>
          </Section>

          <Section title={t('mudras.sectionBreath')}>
            <Text style={{ color: theme.colors.text, lineHeight: 20 }}>{t(mudra.breathKey)}</Text>
          </Section>

          <Section title={t('mudras.sectionFocus')}>
            <Text style={{ color: theme.colors.text, lineHeight: 20 }}>{t(mudra.focusKey)}</Text>
          </Section>

          <Section title={t('mudras.sectionBenefits')}>
            <BulletList items={benefitItems} />
          </Section>

          <Section title={t('mudras.sectionMistakes')}>
            <BulletList items={mistakeItems} />
          </Section>

          {!!mudra.cautionKey && (
            <Section title={t('mudras.sectionCaution')}>
              <View style={{ backgroundColor: theme.colors.cardMuted, borderWidth: 1, borderColor: theme.colors.cardBorder, padding: 10, borderRadius: 14 }}>
                <Text style={{ color: theme.colors.text, lineHeight: 20 }}>{t(mudra.cautionKey)}</Text>
              </View>
            </Section>
          )}

          <Section title={t('mudras.sectionDuration')}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {MIN_OPTIONS.map((m) => {
                const active = minutes === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMinutes(m)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 10,
                      borderRadius: 12,
                      backgroundColor: active ? theme.colors.cardMuted : theme.colors.background,
                      borderWidth: 1,
                      borderColor: active ? theme.colors.primary : theme.colors.cardBorder,
                    }}
                  >
                    <Text style={{ color: active ? theme.colors.text : theme.colors.textMuted }}>{m} min</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('MudraPractice', { mudraId: mudra.id, minutes })}
              style={{ backgroundColor: theme.colors.primary, padding: 12, borderRadius: 14 }}
            >
              <Text style={{ color: theme.colors.text, textAlign: 'center' }}>{t('mudras.startPractice', { minutes })}</Text>
            </TouchableOpacity>
          </Section>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

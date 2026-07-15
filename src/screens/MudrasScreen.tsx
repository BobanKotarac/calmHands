import React, { useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { MUDRAS } from '../data/mudras';
import { theme } from '../theme';

const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: theme.colors.cardMuted,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
      }}
    >
      <Text style={{ color: theme.colors.accent, fontSize: 12 }} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function MudrasScreen({ navigation }: any) {
  const [q, setQ] = useState('');

  const { t } = useTranslation();
  const data = useMemo(() => {
    const s = norm(q.trim());
    if (!s) return MUDRAS;
    return MUDRAS.filter((m) => {
      const title = t(m.titleKey);
      const summary = t(m.summaryKey);
      const how = t(m.howKey);
      const keywords = m.keywordKeys.map((k) => t(k));
      const benefits = m.benefitKeys.map((k) => t(k));
      const hay = norm([title, summary, how, ...keywords, ...benefits].join(' '));
      return hay.includes(s);
    });
  }, [q, t]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      <View style={{ flex: 1, padding: theme.padding.screen, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, backgroundColor: theme.colors.card }}
          >
            <Text style={{ color: theme.colors.text }}>{t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={{ color: theme.colors.text, fontSize: 18 }}>{t('mudras.title')}</Text>
          <View style={{ width: 70 }} />
        </View>
        <Text style={{ color: theme.colors.textMuted }}>{t('mudras.subtitle')}</Text>
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder={t('mudras.searchPlaceholder')}
          placeholderTextColor={theme.colors.textDim}
          autoCorrect={false}
          autoCapitalize="none"
          style={{
            backgroundColor: '#111827',
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: 'white',
            borderWidth: 1,
            borderColor: '#1F2937',
          }}
        />

        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 10, paddingTop: 4, paddingBottom: 24 }}
          renderItem={({ item }) => {
            const chips = (item.keywordKeys ?? []).slice(0, 3).map((k) => t(k));
            const benefitsText = item.benefitKeys.map((k) => t(k)).join(' • ');

            return (
              <TouchableOpacity
                onPress={() => navigation.navigate('MudraDetail', { mudraId: item.id })}
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: 18,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: theme.colors.cardBorder,
                }}
                activeOpacity={0.9}
              >
                <Text style={{ color: theme.colors.text, fontSize: 16 }}>{t(item.titleKey)}</Text>
                <Text style={{ color: theme.colors.textMuted, marginTop: 6 }} numberOfLines={2}>
                  {t(item.summaryKey)}
                </Text>

                {!!chips.length && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {chips.map((k) => (
                      <Chip key={k} label={k} onPress={() => setQ(k)} />
                    ))}
                  </View>
                )}

                <Text style={{ color: theme.colors.textDim, marginTop: 10 }} numberOfLines={2}>
                  {benefitsText}
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ color: theme.colors.textDim }}>{t('mudras.defaultDuration')}: {item.durationMinDefault} min</Text>
                  <Text style={{ color: theme.colors.primary }}>{t('mudras.details')} →</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={{ paddingTop: 24 }}>
              <Text style={{ color: theme.colors.textMuted }}>{t('mudras.noResults', { query: q.trim() })}</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

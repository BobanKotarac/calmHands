import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../../theme';
import { changeAppLanguage, type SupportedLocale } from '../../i18n';
import { Card } from './Card';

const OPTIONS: { code: SupportedLocale; flag: string; native: string; subtitleKey: string }[] = [
  { code: 'sr', flag: '🇷🇸', native: 'Srpski', subtitleKey: 'profile.langSrHint' },
  { code: 'en', flag: '🇬🇧', native: 'English', subtitleKey: 'profile.langEnHint' },
];

export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const active = (i18n.language?.startsWith('sr') ? 'sr' : 'en') as SupportedLocale;

  return (
    <Card>
      <Text style={[theme.typography.body, { color: theme.colors.text, fontFamily: theme.typography.fontSemiBold }]}>
        {t('profile.language')}
      </Text>
      <Text style={[theme.typography.caption, { color: theme.colors.textMuted }]}>{t('profile.languageHint')}</Text>

      <View
        style={{
          flexDirection: 'row',
          gap: 8,
          marginTop: 4,
          backgroundColor: theme.colors.cardMuted,
          borderRadius: theme.radius.button,
          padding: 4,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
        }}
      >
        {OPTIONS.map((opt) => {
          const selected = active === opt.code;
          return (
            <TouchableOpacity
              key={opt.code}
              activeOpacity={theme.activeOpacity}
              onPress={() => changeAppLanguage(opt.code)}
              style={{
                flex: 1,
                minHeight: 72,
                borderRadius: theme.radius.buttonSmall,
                paddingVertical: 12,
                paddingHorizontal: 10,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                backgroundColor: selected ? theme.colors.primary + '28' : 'transparent',
                borderWidth: selected ? 1.5 : 0,
                borderColor: selected ? theme.colors.primary : 'transparent',
              }}
            >
              <Text style={{ fontSize: 22 }}>{opt.flag}</Text>
              <Text
                style={{
                  color: selected ? theme.colors.primary : theme.colors.text,
                  fontFamily: selected ? theme.typography.fontSemiBold : theme.typography.fontRegular,
                  fontSize: 15,
                }}
              >
                {opt.native}
              </Text>
              <Text style={[theme.typography.captionSmall, { color: theme.colors.textDim }]}>
                {selected ? '✓' : t(opt.subtitleKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Card>
  );
}

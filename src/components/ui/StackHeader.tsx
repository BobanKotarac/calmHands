import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';

type StackHeaderProps = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

/** Custom stack header — always applies top safe-area (native-stack does not do this for custom headers). */
export function StackHeader({ title, onBack, right }: StackHeaderProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View
      style={{
        paddingTop: insets.top + 6,
        paddingBottom: 14,
        paddingHorizontal: theme.padding.screen,
        backgroundColor: 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={theme.activeOpacity}
          accessibilityLabel={t('common.back')}
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: theme.radius.buttonSmall,
            backgroundColor: theme.colors.card,
            borderWidth: 1,
            borderColor: theme.colors.cardBorder,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <Text style={[theme.typography.sectionTitle, { color: theme.colors.text, flex: 1, textAlign: 'center' }]} numberOfLines={1}>
        {title}
      </Text>
      {right ?? <View style={{ width: 40 }} />}
    </View>
  );
}

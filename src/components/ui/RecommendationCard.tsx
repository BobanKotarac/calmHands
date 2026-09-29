import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

type RecommendationCardProps = {
  title: string;
  reason: string;
  accentColor: string;
  onPress?: () => void;
  disabled?: boolean;
};

export function RecommendationCard({ title, reason, accentColor, onPress, disabled }: RecommendationCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={onPress ? theme.activeOpacity : 1}
      onPress={onPress}
      disabled={disabled || !onPress}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.cardSmall,
        borderWidth: 1,
        borderColor: theme.colors.cardBorder,
        overflow: 'hidden',
        opacity: disabled ? 0.85 : 1,
        ...theme.shadow.card,
        shadowOpacity: 0.12,
      }}
    >
      <View style={{ flexDirection: 'row', minHeight: 76 }}>
        <View style={{ width: 4, backgroundColor: accentColor }} />
        <View style={{ flex: 1, padding: theme.padding.cardTight, gap: 4, justifyContent: 'center' }}>
          <Text style={[theme.typography.body, { color: theme.colors.text, fontFamily: theme.typography.fontSemiBold }]}>{title}</Text>
          <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>{reason}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

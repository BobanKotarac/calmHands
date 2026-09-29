import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../../theme';

export type QuickAction = {
  key: string;
  label: string;
  emoji: string;
  onPress: () => void;
  accent?: string;
};

type QuickActionsGridProps = {
  actions: QuickAction[];
};

export function QuickActionsGrid({ actions }: QuickActionsGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {actions.map((a) => (
        <TouchableOpacity
          key={a.key}
          activeOpacity={theme.activeOpacity}
          onPress={a.onPress}
          style={{
            width: '47%',
            flexGrow: 1,
            minWidth: '45%',
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.cardSmall,
            paddingVertical: 18,
            paddingHorizontal: 14,
            alignItems: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: a.accent ? a.accent + '66' : theme.colors.cardBorder,
            ...theme.shadow.card,
            shadowOpacity: 0.12,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: a.accent ? a.accent + '22' : theme.colors.primaryMuted,
            }}
          >
            <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
          </View>
          <Text
            style={[
              theme.typography.bodySmall,
              { color: theme.colors.text, textAlign: 'center', fontFamily: theme.typography.fontSemiBold },
            ]}
          >
            {a.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

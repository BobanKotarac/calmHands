import React from 'react';
import { View, ViewProps } from 'react-native';
import { theme } from '../../theme';

type CardProps = ViewProps & { muted?: boolean; tight?: boolean; elevated?: boolean };

export function Card({ style, muted, tight, elevated, ...rest }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: muted ? theme.colors.cardMuted : theme.colors.card,
          borderRadius: theme.radius.card,
          padding: tight ? theme.padding.cardTight : theme.padding.card,
          gap: 10,
          borderWidth: 1,
          borderColor: theme.colors.cardBorder,
          ...(elevated ? theme.shadow.card : null),
        },
        style,
      ]}
      {...rest}
    />
  );
}

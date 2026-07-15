import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { theme } from '../../theme';

type Variant = 'primary' | 'success' | 'danger' | 'muted';

type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: Variant;
  small?: boolean;
};

const VARIANT_BG: Record<Variant, string> = {
  primary: theme.colors.primary,
  success: theme.colors.success,
  danger: theme.colors.danger,
  muted: theme.colors.cardMuted,
};

export function Button({ title, variant = 'primary', small, style, disabled, ...rest }: ButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={theme.activeOpacity}
      disabled={disabled}
      style={[
        {
          backgroundColor: disabled ? theme.colors.cardBorder : VARIANT_BG[variant],
          borderRadius: small ? theme.radius.buttonSmall : theme.radius.button,
          padding: small ? theme.padding.buttonSmall : theme.padding.button,
        },
        style,
      ]}
      {...rest}
    >
      <Text
        style={{
          color: theme.colors.text,
          textAlign: 'center',
          fontSize: small ? theme.typography.bodySmall.fontSize : theme.typography.body.fontSize,
          fontWeight: '600',
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

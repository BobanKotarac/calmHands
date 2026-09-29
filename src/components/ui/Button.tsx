import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

type Variant = 'primary' | 'success' | 'danger' | 'muted' | 'ghost';

type ButtonProps = TouchableOpacityProps & {
  title: string;
  variant?: Variant;
  small?: boolean;
};

const SOLID_BG: Record<Exclude<Variant, 'primary'>, string> = {
  success: theme.colors.success,
  danger: theme.colors.danger,
  muted: theme.colors.card,
  ghost: 'transparent',
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: theme.colors.onPrimary,
  success: theme.colors.onPrimary,
  danger: theme.colors.text,
  muted: theme.colors.text,
  ghost: theme.colors.textMuted,
};

export function Button({ title, variant = 'primary', small, style, disabled, ...rest }: ButtonProps) {
  const radius = small ? theme.radius.buttonSmall : theme.radius.button;
  const pad = small ? theme.padding.buttonSmall : theme.padding.button;
  const fontSize = small ? theme.typography.bodySmall.fontSize : theme.typography.body.fontSize;

  const label = (
    <Text
      style={{
        color: disabled ? theme.colors.textDim : TEXT_COLOR[variant],
        textAlign: 'center',
        fontSize,
        fontFamily: theme.typography.fontSemiBold,
        fontWeight: '600',
      }}
    >
      {title}
    </Text>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <TouchableOpacity activeOpacity={theme.activeOpacity} disabled={disabled} style={style} {...rest}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: radius, padding: pad, ...(theme.shadow.soft as object), shadowOpacity: 0.22 }}
        >
          {label}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={theme.activeOpacity}
      disabled={disabled}
      style={[
        {
          backgroundColor: disabled ? theme.colors.cardMuted : SOLID_BG[variant === 'primary' ? 'muted' : variant],
          borderRadius: radius,
          padding: pad,
          borderWidth: variant === 'ghost' || variant === 'muted' ? 1 : 0,
          borderColor: theme.colors.cardBorder,
        },
        style,
      ]}
      {...rest}
    >
      {label}
    </TouchableOpacity>
  );
}

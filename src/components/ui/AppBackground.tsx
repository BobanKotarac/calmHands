import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

type AppBackgroundProps = ViewProps & {
  children: React.ReactNode;
};

/** Soft ink → teal wash behind screen content — atmosphere without flat fill. */
export function AppBackground({ children, style, ...rest }: AppBackgroundProps) {
  return (
    <View style={[{ flex: 1, backgroundColor: theme.colors.background }, style]} {...rest}>
      <LinearGradient
        pointerEvents="none"
        colors={[theme.colors.backgroundTop, theme.colors.backgroundMid, theme.colors.background]}
        locations={[0, 0.28, 0.72]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

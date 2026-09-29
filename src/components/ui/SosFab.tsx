import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';

type SosFabProps = {
  label: string;
  onPress: () => void;
};

/** Floats above tab content (tab bar is in layout, not overlaid). */
export function SosFab({ label, onPress }: SosFabProps) {
  return (
    <TouchableOpacity
      activeOpacity={theme.activeOpacity}
      onPress={onPress}
      style={{
        position: 'absolute',
        right: theme.padding.screen,
        bottom: 20,
        borderRadius: theme.radius.pill,
        overflow: 'hidden',
        ...theme.shadow.fab,
      }}
    >
      <LinearGradient colors={[theme.colors.sos, theme.colors.sosDark]} style={{ paddingVertical: 14, paddingHorizontal: 22 }}>
        <Text style={{ color: theme.colors.text, fontSize: 14, fontFamily: theme.typography.fontBold, letterSpacing: 0.4 }}>
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

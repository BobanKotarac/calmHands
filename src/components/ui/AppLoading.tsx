import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { AppBackground } from './AppBackground';

/** No i18n — safe to render before/during language bootstrap. */
export function AppLoading({ label = 'Loading...' }: { label?: string }) {
  return (
    <AppBackground>
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Text style={[theme.typography.hero, { color: theme.colors.text, letterSpacing: -0.6 }]}>CalmHands</Text>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[theme.typography.bodySmall, { color: theme.colors.textMuted }]}>{label}</Text>
      </SafeAreaView>
    </AppBackground>
  );
}

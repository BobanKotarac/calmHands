import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';

type ScreenContainerProps = ScrollViewProps & { scroll?: boolean };

export function ScreenContainer({ children, contentContainerStyle, scroll = true, ...rest }: ScreenContainerProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[
            { padding: theme.padding.screen, gap: 12, paddingBottom: 24 },
            contentContainerStyle,
          ]}
          {...rest}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: theme.padding.screen, gap: 12 }}>{children}</View>
      )}
    </SafeAreaView>
  );
}

import React from 'react';
import { ScrollView, ScrollViewProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../../theme';
import { AppBackground } from './AppBackground';

type ScreenContainerProps = ScrollViewProps & { scroll?: boolean };

export function ScreenContainer({ children, contentContainerStyle, scroll = true, ...rest }: ScreenContainerProps) {
  return (
    <AppBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              {
                padding: theme.padding.screen,
                gap: theme.padding.sectionGap,
                paddingBottom: theme.padding.tabBarClearance,
              },
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
            {...rest}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1, padding: theme.padding.screen, gap: theme.padding.sectionGap }}>{children}</View>
        )}
      </SafeAreaView>
    </AppBackground>
  );
}

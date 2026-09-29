import React from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { theme } from '../theme';
import { AppBackground } from './ui/AppBackground';
import { Button } from './ui/Button';
import { useAuth } from '../context/authContext';

/** Blocks account-only features for anonymous guests. */
export function RequireAccount({ children }: { children: React.ReactNode }) {
  const { isGuest } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();

  if (!isGuest) return <>{children}</>;

  return (
    <AppBackground>
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.padding.screen, gap: 16 }}>
        <Text style={[theme.typography.title, { color: theme.colors.text, textAlign: 'center' }]}>
          {t('guest.lockedTitle')}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textMuted, textAlign: 'center' }]}>
          {t('guest.lockedBody')}
        </Text>
        <Button
          title={t('guest.createAccount')}
          variant="primary"
          onPress={() => navigation.navigate('Auth')}
        />
        <Button
          title={t('common.back')}
          variant="muted"
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else navigation.navigate('Tabs');
          }}
        />
      </View>
    </AppBackground>
  );
}

export function withRequireAccount<P extends object>(Component: React.ComponentType<P>) {
  return function AccountGatedScreen(props: P) {
    return (
      <RequireAccount>
        <Component {...props} />
      </RequireAccount>
    );
  };
}

import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/authContext';
import LoginScreen from './src/screens/LoginScreen';
import AppTabs from './src/navigation/AppTabs';
import RootNavigator from './src/navigation/RootNavigation';
import OnboardingScreen from './src/screens/OnboardingScreen';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PremiumProvider } from './src/context/premiumContext';
import { initI18n } from './src/i18n';
import { useTranslation } from 'react-i18next';
import { syncNotificationsWithFirebase } from './src/utils/reminders';
import { getOnboardingDone, setOnboardingDone } from './src/utils/onboardingStorage';
import { theme } from './src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});
SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});

function Root() {
  const { user, initializing } = useAuth();
  const { t } = useTranslation();
  const [onboardingDone, setOnboardingDoneState] = useState<boolean | null>(null);

  useEffect(() => {
    if (user?.uid) syncNotificationsWithFirebase(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      setOnboardingDoneState(null);
      return;
    }
    getOnboardingDone(user.uid).then(setOnboardingDoneState);
  }, [user?.uid]);

  const handleOnboardingComplete = () => {
    if (user?.uid) {
      setOnboardingDone(user.uid).then(() => setOnboardingDoneState(true));
    }
  };

  if (initializing) return <Text>{t('common.loading')}</Text>;
  // Only hit if the anonymous guest sign-in itself failed (e.g. disabled in Firebase).
  if (!user) return <LoginScreen />;
  if (onboardingDone === null) return <Text>{t('common.loading')}</Text>;
  if (onboardingDone === false) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  return <RootNavigator />;
}


export default function App() {
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}, []);


  useEffect(() => {
  const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
    const data: any = resp.notification.request.content.data;
    if (data?.kind === 'plan' && data?.planId) {
      // navigationRef.navigate('RunPlan', { planId: data.planId })
    }
  });
  return () => sub.remove();
}, []);

  useEffect(() => {
    if (!i18nReady) return;
    SplashScreen.hideAsync().catch(() => {});
  }, [i18nReady]);

  if (!i18nReady) return <Text>Loading...</Text>;

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <PremiumProvider>
          <Root />
        </PremiumProvider>
      </NavigationContainer>
    </AuthProvider>
  );
}

import 'react-native-url-polyfill/auto';
import './src/i18n'; // sync bootstrap before any useTranslation
import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider, useAuth } from './src/context/authContext';
import LoginScreen from './src/screens/LoginScreen';
import RootNavigator from './src/navigation/RootNavigation';
import OnboardingScreen from './src/screens/OnboardingScreen';
import * as Notifications from 'expo-notifications';
import { PremiumProvider } from './src/context/premiumContext';
import { TodayMoodProvider } from './src/context/todayMoodContext';
import i18n, { initI18n } from './src/i18n';
import { syncNotificationsWithFirebase } from './src/utils/reminders';
import { getOnboardingDone, setOnboardingDone } from './src/utils/onboardingStorage';
import { theme } from './src/theme';
import { AppLoading } from './src/components/ui/AppLoading';
import { navigationRef, navigateRunPlan } from './src/navigation/navigationRef';

function Root() {
  const { user, initializing } = useAuth();
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

  if (initializing) return <AppLoading />;
  if (!user) return <LoginScreen />;
  if (onboardingDone === null) return <AppLoading />;
  if (onboardingDone === false) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  return <RootNavigator />;
}

async function loadAppFonts(): Promise<void> {
  const [{ loadAsync }, fonts] = await Promise.all([
    import('expo-font'),
    import('@expo-google-fonts/dm-sans'),
  ]);
  await loadAsync({
    DMSans_400Regular: fonts.DMSans_400Regular,
    DMSans_600SemiBold: fonts.DMSans_600SemiBold,
    DMSans_700Bold: fonts.DMSans_700Bold,
  });
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SplashScreen.preventAutoHideAsync().catch(() => {});
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});

    let cancelled = false;
    (async () => {
      try {
        await initI18n();
        await loadAppFonts();
      } catch {
        // fonts / language preference are best-effort
      } finally {
        if (!cancelled) {
          setReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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
        navigateRunPlan(String(data.planId));
      }
    });
    return () => sub.remove();
  }, []);

  if (!ready) return <AppLoading />;

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <StatusBar style="light" />
        <NavigationContainer ref={navigationRef}>
          <PremiumProvider>
            <TodayMoodProvider>
              <Root />
            </TodayMoodProvider>
          </PremiumProvider>
        </NavigationContainer>
      </AuthProvider>
    </I18nextProvider>
  );
}

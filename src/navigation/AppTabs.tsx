import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import HomeScreen from '../screens/HomeScreen';
import TrackerScreen from '../screens/TrackerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RitualPlansScreen from '../screens/RitualPlansScreen';

export type TabsParamList = {
  Home: undefined;
  Mood: undefined;
  Profil: undefined;
  Planovi: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export default function AppTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="Mood" component={TrackerScreen} options={{ tabBarLabel: t('tabs.mood') }} />
      <Tab.Screen name="Planovi" component={RitualPlansScreen} options={{ tabBarLabel: t('tabs.plans') }} />
      <Tab.Screen name="Profil" component={ProfileScreen} options={{ tabBarLabel: t('tabs.profile') }} />
    </Tab.Navigator>
  );
}

import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import TrackerScreen from '../screens/TrackerScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RitualPlansScreen from '../screens/RitualPlansScreen';
import { theme } from '../theme';
import { useTodayMood } from '../context/todayMoodContext';
import { useAuth } from '../context/authContext';

export type TabsParamList = {
  Home: undefined;
  Mood: undefined;
  Profil: undefined;
  Planovi: undefined;
};

const Tab = createBottomTabNavigator<TabsParamList>();

export default function AppTabs() {
  const { t } = useTranslation();
  const { hasTodayMood } = useTodayMood();
  const { isGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);
  const tabBarHeight = theme.tabBar.contentHeight + bottomPad;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textDim,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.cardBorder,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: bottomPad,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
            },
            android: { elevation: 10 },
          }),
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontSemiBold,
          fontSize: 11,
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />
      {!isGuest ? (
        <Tab.Screen
          name="Mood"
          component={TrackerScreen}
          options={{
            tabBarLabel: t('tabs.mood'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'happy' : 'happy-outline'} size={size} color={color} />
            ),
            tabBarBadge: hasTodayMood ? undefined : '!',
            tabBarBadgeStyle: { backgroundColor: theme.colors.warning, fontSize: 10, color: theme.colors.onPrimary },
          }}
        />
      ) : null}
      {!isGuest ? (
        <Tab.Screen
          name="Planovi"
          component={RitualPlansScreen}
          options={{
            tabBarLabel: t('tabs.plans'),
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
            ),
          }}
        />
      ) : null}
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarLabel: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

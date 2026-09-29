import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import AppTabs from './AppTabs';
import SosScreen from '../screens/SoSScreen';
import MudrasScreen from '../screens/MudrasScreen';
import MudraDetailScreen from '../screens/MudraDetailScreen';
import MudraPracticeScreen from '../screens/MudraPracticeScreen';
import ThoughtLogScreen from '../screens/ThoughtLogScreen';
import BreathingScreen from '../screens/BreathingScreen';
import GroundingScreen from '../screens/GroundingScreen';
import MojiLogoviScreen from '../screens/AllThoughtScreen';
import InsightsScreen from '../screens/InsightsScreen';
import PlanEditorScreen from '../screens/PlanEditorScreen';
import RunPlanScreen from '../screens/RunPlanScreen';
import PaywallScreen from '../screens/PaywallSccreen';
import SafetyPlanEditorScreen from '../screens/SafetyPlanEditorScreen';
import LoginScreen from '../screens/LoginScreen';
import { StackHeader } from '../components/ui/StackHeader';
import { withRequireAccount } from '../components/RequireAccount';
import { theme } from '../theme';

export type RootStackParamList = {
  Tabs: undefined;
  Auth: undefined;
  SOS: undefined;
  Mudras: undefined;
  ThoughtLog: undefined;
  MudraDetail: { mudraId: string };
  MudraPractice: { mudraId: string; minutes: number };
  Breathing: { durationSec?: number } | undefined;
  Grounding: undefined;
  MojiLogovi: undefined;
  Insights: undefined;
  RitualPlans: undefined;
  PlanEditor: { planId?: string } | undefined;
  RunPlan: { planId: string };
  Paywall: undefined;
  SafetyPlanEditor: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const InsightsGated = withRequireAccount(InsightsScreen);
const ThoughtLogGated = withRequireAccount(ThoughtLogScreen);
const MojiLogoviGated = withRequireAccount(MojiLogoviScreen);
const PlanEditorGated = withRequireAccount(PlanEditorScreen);
const RunPlanGated = withRequireAccount(RunPlanScreen);
const SafetyPlanGated = withRequireAccount(SafetyPlanEditorScreen);
const PaywallGated = withRequireAccount(PaywallScreen);

function stackHeader(title: string, navigation: { goBack: () => void; canGoBack?: () => boolean; navigate: (name: string) => void }) {
  return (
    <StackHeader
      title={title}
      onBack={() => {
        if (navigation.canGoBack?.()) navigation.goBack();
        else navigation.navigate('Tabs');
      }}
    />
  );
}

export default function RootNavigator() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      id="RootStack"
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Tabs" component={AppTabs} />
      <Stack.Screen name="Auth" component={LoginScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="SOS" component={SosScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen
        name="Insights"
        component={InsightsGated}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => stackHeader(t('insights.title'), navigation),
        })}
      />
      <Stack.Screen
        name="ThoughtLog"
        component={ThoughtLogGated}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => stackHeader(t('thoughtLog.title'), navigation),
        })}
      />
      <Stack.Screen
        name="MojiLogovi"
        component={MojiLogoviGated}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => stackHeader(t('myLogs.screenTitle'), navigation),
        })}
      />
      <Stack.Screen name="Breathing" component={BreathingScreen} />
      <Stack.Screen name="Grounding" component={GroundingScreen} />
      <Stack.Screen name="Mudras" component={MudrasScreen} />
      <Stack.Screen name="MudraDetail" component={MudraDetailScreen} />
      <Stack.Screen name="MudraPractice" component={MudraPracticeScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="PlanEditor" component={PlanEditorGated} options={{ presentation: 'modal' }} />
      <Stack.Screen name="RunPlan" component={RunPlanGated} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Paywall" component={PaywallGated} />
      <Stack.Screen
        name="SafetyPlanEditor"
        component={SafetyPlanGated}
        options={({ navigation }) => ({
          headerShown: true,
          header: () => stackHeader(t('safetyPlan.title'), navigation),
        })}
      />
    </Stack.Navigator>
  );
}

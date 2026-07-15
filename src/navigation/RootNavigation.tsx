import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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


export default function RootNavigator() {
    return (
        <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={AppTabs} />
        <Stack.Screen name="Auth" component={LoginScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen
            name="SOS"
            component={SosScreen}
            options={{ presentation: 'modal' }}
        />
        <Stack.Screen name="Insights" component={InsightsScreen} />
        <Stack.Screen name="ThoughtLog" component={ThoughtLogScreen} />
        <Stack.Screen name="MojiLogovi" component={MojiLogoviScreen} />
        <Stack.Screen name="Breathing" component={BreathingScreen} />
        <Stack.Screen name="Grounding" component={GroundingScreen} />
        <Stack.Screen name="Mudras" component={MudrasScreen} />
        <Stack.Screen name="MudraDetail" component={MudraDetailScreen} />
        <Stack.Screen name="MudraPractice" component={MudraPracticeScreen} options={{ presentation: 'modal' }} />   
        <Stack.Screen name="PlanEditor" component={PlanEditorScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="RunPlan" component={RunPlanScreen} options={{ presentation: 'modal' }} />
        <Stack.Screen name="Paywall" component={PaywallScreen} />
        <Stack.Screen name="SafetyPlanEditor" component={SafetyPlanEditorScreen} />
        </Stack.Navigator>
    );
}

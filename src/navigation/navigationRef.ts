import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './RootNavigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateRunPlan(planId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('RunPlan', { planId });
  }
}

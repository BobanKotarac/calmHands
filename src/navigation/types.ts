import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootStackParamList } from './RootNavigation';
import type { TabsParamList } from './AppTabs';

/** For screens registered directly on the root stack (LoginScreen, PaywallScreen, ...). */
export type RootScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

/** For screens nested inside the bottom tab navigator that also need to reach root-stack screens via getParent(). */
export type TabScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabsParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

import * as Haptics from 'expo-haptics';

export const haptics = {
  tap: async () => {
    try { await Haptics.selectionAsync(); } catch {}
  },
  light: async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
  },
  medium: async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch {}
  },
  heavy: async () => {
    try { await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); } catch {}
  },
  success: async () => {
    try { await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch {}
  },
};

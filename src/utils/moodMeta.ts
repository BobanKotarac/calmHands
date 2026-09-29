import { theme } from '../theme';

export function moodColor(value: number): string {
  const v = Math.min(5, Math.max(1, Math.round(value))) as 1 | 2 | 3 | 4 | 5;
  return theme.colors.mood[v];
}

export function moodMeta(v: number): { emoji: string; titleKey: string; color: string } {
  const color = moodColor(v);
  if (v <= 1) return { emoji: '😣', titleKey: 'hard', color };
  if (v === 2) return { emoji: '😟', titleKey: 'bad', color };
  if (v === 3) return { emoji: '😐', titleKey: 'ok', color };
  if (v === 4) return { emoji: '🙂', titleKey: 'good', color };
  return { emoji: '😌', titleKey: 'great', color };
}

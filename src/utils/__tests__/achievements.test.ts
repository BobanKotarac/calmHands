jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('../../firebase/firebase', () => ({ db: {} }));

import { getAchievementsToCheck } from '../achievements';

describe('getAchievementsToCheck', () => {
  it('unlocks nothing below any threshold', () => {
    expect(getAchievementsToCheck(1, 1)).toEqual([]);
  });

  it('unlocks mood_streak_3 at exactly 3', () => {
    expect(getAchievementsToCheck(3, 0)).toEqual(['mood_streak_3']);
  });

  it('unlocks both mood thresholds at 7', () => {
    expect(getAchievementsToCheck(7, 0)).toEqual(['mood_streak_3', 'mood_streak_7']);
  });

  it('unlocks mood and ritual achievements independently', () => {
    expect(getAchievementsToCheck(7, 7)).toEqual([
      'mood_streak_3',
      'mood_streak_7',
      'ritual_streak_3',
      'ritual_streak_7',
    ]);
  });
});

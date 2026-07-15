jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  serverTimestamp: jest.fn(),
}));
jest.mock('../../firebase/firebase', () => ({ db: {} }));

import { getCurrentWeekId } from '../weeklyReflection';

describe('getCurrentWeekId', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the same Monday for every day in that week', () => {
    // Week of 2026-01-12 (Monday) through 2026-01-18 (Sunday)
    const expected = '2026-01-12';
    const daysInWeek = [12, 13, 14, 15, 16, 17, 18];
    for (const day of daysInWeek) {
      jest.useFakeTimers().setSystemTime(new Date(2026, 0, day, 10, 0, 0));
      expect(getCurrentWeekId()).toBe(expected);
    }
  });

  it('rolls over to the next Monday correctly', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 19, 10, 0, 0)); // next Monday
    expect(getCurrentWeekId()).toBe('2026-01-19');
  });
});

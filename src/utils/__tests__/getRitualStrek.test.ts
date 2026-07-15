jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
}));
jest.mock('../../firebase/firebase', () => ({ db: {} }));

import { computeRitualStreak } from '../getRitualStrek';

function dayId(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

describe('computeRitualStreak', () => {
  it('returns 0 for no activity', () => {
    expect(computeRitualStreak(new Set())).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const today = new Date(2026, 0, 15);
    const days = new Set([
      dayId(new Date(2026, 0, 15)),
      dayId(new Date(2026, 0, 14)),
      dayId(new Date(2026, 0, 13)),
    ]);
    expect(computeRitualStreak(days, today)).toBe(3);
  });

  it('stops counting at the first gap', () => {
    const today = new Date(2026, 0, 15);
    const days = new Set([
      dayId(new Date(2026, 0, 15)),
      dayId(new Date(2026, 0, 14)),
      // gap on the 13th
      dayId(new Date(2026, 0, 12)),
    ]);
    expect(computeRitualStreak(days, today)).toBe(2);
  });

  it('returns 0 if today has no activity, even if yesterday does', () => {
    const today = new Date(2026, 0, 15);
    const days = new Set([dayId(new Date(2026, 0, 14))]);
    expect(computeRitualStreak(days, today)).toBe(0);
  });
});

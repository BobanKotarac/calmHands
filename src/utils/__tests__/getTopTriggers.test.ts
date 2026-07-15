import { getTopTriggers } from '../getTopTriggers';

function logAt(daysAgo: number, thoughts: string, intensityAfter = 0) {
  const ms = Date.now() - daysAgo * 86400000;
  return {
    data: {
      thoughts,
      intensityAfter,
      createdAt: { toDate: () => new Date(ms) },
    },
  };
}

describe('getTopTriggers', () => {
  it('ignores logs older than the requested window', () => {
    const logs = [
      logAt(1, 'posao posao posao'),
      logAt(1, 'posao posao'),
      logAt(1, 'posao'),
      logAt(100, 'posao posao posao posao'), // outside 30-day window
    ];
    const result = getTopTriggers(logs, 30);
    expect(result.find((t) => t.word === 'posao')?.freq).toBe(6);
  });

  it('drops words appearing fewer than 3 times', () => {
    const logs = [logAt(1, 'retkarec'), logAt(1, 'retkarec')];
    const result = getTopTriggers(logs, 30);
    expect(result.find((t) => t.word === 'retkarec')).toBeUndefined();
  });

  it('filters stop words and short words', () => {
    const logs = [logAt(0, 'i u na da je'), logAt(0, 'i u na da je'), logAt(0, 'i u na da je')];
    const result = getTopTriggers(logs, 30);
    expect(result).toHaveLength(0);
  });

  it('computes panicPercent from high-intensity logs', () => {
    const logs = [
      logAt(0, 'anksioznost', 8), // high panic (>=6)
      logAt(0, 'anksioznost', 8),
      logAt(0, 'anksioznost', 2), // not high panic
    ];
    const result = getTopTriggers(logs, 30);
    const entry = result.find((t) => t.word === 'anksioznost');
    expect(entry?.freq).toBe(3);
    expect(entry?.panicPercent).toBe(67); // 2/3 rounded
  });

  it('sorts by frequency descending and caps at 8 results', () => {
    const words = Array.from({ length: 10 }, (_, i) => `reccc${i}`);
    const logs = words.flatMap((w, i) => {
      const count = 10 - i; // descending frequency per word
      return Array.from({ length: count }, () => logAt(0, w));
    });
    const result = getTopTriggers(logs, 30);
    expect(result.length).toBeLessThanOrEqual(8);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].freq).toBeGreaterThanOrEqual(result[i].freq);
    }
  });
});

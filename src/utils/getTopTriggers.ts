export function getTopTriggers(logs: any[], days: number = 30): { word: string; freq: number; panicPercent: number }[] {
  const now = Date.now();
  const recent = logs.filter(log => {
    const ts = log.data.createdAt?.toDate?.()?.getTime() || 0;
    return now - ts <= days * 86400000;
  });

  const stopWords = ['i', 'u', 'na', 'da', 'je', 'sa', 'do', 'za', 'ne', 'to', 'su']; // srpski

  const wordCounts = new Map<string, { count: number; panicDays: number }>();

  recent.forEach(log => {
    const text = [log.data.thoughts, log.data.bodySensations].filter(Boolean).join(' ') || '';
    const intensityAfter = log.data.intensityAfter || 0;
    const isHighPanic = intensityAfter >= 6;

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // ukloni interpunkciju
      .split(/\s+/)
      .filter((w: any) => w.length > 2 && !stopWords.includes(w)); // >2 slova, bez stop

    words.forEach((word: any) => {
      const entry = wordCounts.get(word) || { count: 0, panicDays: 0 };
      entry.count++;
      if (isHighPanic) entry.panicDays++;
      wordCounts.set(word, entry);
    });
  });

  return Array.from(wordCounts.entries())
    .filter(([, data]) => data.count >= 3)
    .map(([word, data]) => ({
      word,
      freq: data.count,
      panicPercent: Math.round((data.panicDays / data.count) * 100),  // ← FIXED
    }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 8);
}
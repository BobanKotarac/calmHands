import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

import { db } from '../firebase/firebase';

type ThoughtLogCsvRow = {
  createdAt: string;
  intensityBefore: number | '';
  intensityAfter: number | '';
  thoughts: string;
  bodySensations: string;
};

const csvEscape = (v: any) => {
  const s = String(v ?? '');
  // CSV: dupliraj " i wrap u " ako ima specijalne char
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export async function exportThoughtLogsToCsv(userId: string) {
  const q = query(
    collection(db, 'users', userId, 'thoughtLogs'),
    orderBy('createdAt', 'desc'),
    limit(500)
  );

  const snap = await getDocs(q);

  const rows: ThoughtLogCsvRow[] = snap.docs.map((d) => {
    const x: any = d.data();
    const created =
      x.createdAt?.toDate?.() ? x.createdAt.toDate().toISOString() : '';

    return {
      createdAt: created,
      intensityBefore: typeof x.intensityBefore === 'number' ? x.intensityBefore : '',
      intensityAfter: typeof x.intensityAfter === 'number' ? x.intensityAfter : '',
      thoughts: x.thoughts ?? '',
      bodySensations: x.bodySensations ?? '',
    };
  });

  const header = ['createdAt', 'intensityBefore', 'intensityAfter', 'thoughts', 'bodySensations'];
  const lines = [
    header.join(','),
    ...rows.map((r) =>
      [
        csvEscape(r.createdAt),
        csvEscape(r.intensityBefore),
        csvEscape(r.intensityAfter),
        csvEscape(r.thoughts),
        csvEscape(r.bodySensations),
      ].join(',')
    ),
  ];

  const csv = lines.join('\n');
  const filename = `thought_logs_${new Date().toISOString().slice(0, 10)}.csv`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 }); // [web:833]

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Sharing nije dostupan na ovom uređaju.');
  }

  await Sharing.shareAsync(uri, {
    dialogTitle: 'Export Thought Logs (CSV)',
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  }); // [web:1437]
}

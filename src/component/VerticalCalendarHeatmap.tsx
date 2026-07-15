import React, { useMemo } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';


type HeatmapValue = { date: string; count: number }; // YYYY-MM-DD, count 1..4
type Cell = { key: string; day?: number; dateId?: string; level?: number }; // level 1..4
type WeekRow = { key: string; cells: Cell[] }; // one week = 7 cells
type SectionT = { title: string; monthKey: string; data: WeekRow[] };

function pad2(n: number) { return String(n).padStart(2, '0'); }
function dayId(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function startOfMonth(y: number, m0: number) { return new Date(y, m0, 1); }
function daysInMonth(y: number, m0: number) { return new Date(y, m0 + 1, 0).getDate(); }

// Monday=0..Sunday=6
function dowMon0(d: Date) {
  const js = d.getDay(); // Sun=0..Sat=6
  return (js + 6) % 7;
}

export function VerticalCalendarHeatmap(props: {
  values: HeatmapValue[];        // sparse ok
  colors: string[];              // index 1..4 used
  emptyColor: string;            // no data day
  cell?: number;
  gap?: number;
  monthsBack?: number;           // default 12
  onPressDate?: (dateId: string) => void;

}) {
  const cell = props.cell ?? 34;
  const gap = props.gap ?? 6;
  const monthsBack = props.monthsBack ?? 12;

  const valueMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of props.values) m.set(v.date, v.count);
    return m;
  }, [props.values]);

  const sections: SectionT[] = useMemo(() => {
    const out: SectionT[] = [];
    const now = new Date();

    for (let k = monthsBack - 1; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const y = d.getFullYear();
      const m0 = d.getMonth();

      const monthKey = `${y}-${pad2(m0 + 1)}`;
      const title = d.toLocaleString(undefined, { month: 'long', year: 'numeric' });

      const first = startOfMonth(y, m0);
      const pad = dowMon0(first);
      const dim = daysInMonth(y, m0);

      const cells: Cell[] = [];

      // pad start
      for (let i = 0; i < pad; i++) cells.push({ key: `${monthKey}-pad-${i}` });

      // days
      for (let day = 1; day <= dim; day++) {
        const dd = new Date(y, m0, day);
        const id = dayId(dd);
        const level = valueMap.get(id); // 1..4
        cells.push({ key: `${monthKey}-${id}`, day, dateId: id, level });
      }

      // pad end to full weeks
      while (cells.length % 7 !== 0) cells.push({ key: `${monthKey}-endpad-${cells.length}` });

      // chunk into week rows
      const weeks: WeekRow[] = [];
      for (let i = 0; i < cells.length; i += 7) {
        weeks.push({
          key: `${monthKey}-week-${i / 7}`,
          cells: cells.slice(i, i + 7),
        });
      }

      out.push({ title, monthKey, data: weeks });
    }

    return out;
  }, [monthsBack, valueMap]);

  function WeekRow({
  item,
  cell,
  gap,
  emptyColor,
  colors,
  onPressDate,
}: {
  item: WeekRow;
  cell: number;
  gap: number;
  emptyColor: string;
  colors: string[];
  onPressDate?: (dateId: string) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap, marginBottom: gap }}>
      {item.cells.map((c) => {
        const bg =
          c.day == null
            ? 'transparent'
            : c.level == null
              ? emptyColor
              : (colors[c.level] ?? emptyColor);
        const Box: any = c.day != null ? TouchableOpacity : View;
        const hasData = c.level != null;
        return (
          <Box
            key={c.key}
            onPress={() => {
              if (!hasData) return;
              if (c.dateId && onPressDate) onPressDate(c.dateId);
            }}
            activeOpacity={0.8}
            style={{
              width: cell,
              height: cell,
              borderRadius: 8,
              backgroundColor: bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {c.day != null && (
              <Text style={{ color: 'white', fontSize: 12, opacity: c.level == null ? 0.7 : 1 }}>
                {c.day}
              </Text>
            )}
          </Box>
        );
      })}
    </View>
  );
}

  return (
    <View style={{ paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', gap, marginBottom: 8 }}>
        {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((x, i) => (
          <Text key={`${x}-${i}`} style={{ width: cell, color: '#94A3B8', textAlign: 'center' }}>
            {x}
          </Text>
        ))}
      </View>
      {sections.map((section) => (
        <View key={section.monthKey}>
          <Text style={{ color: 'white', fontSize: 16, marginTop: 14, marginBottom: 8 }}>
            {section.title}
          </Text>
          {section.data.map((row) => (
            <WeekRow
              key={row.key}
              item={row}
              cell={cell}
              gap={gap}
              emptyColor={props.emptyColor}
              colors={props.colors}
              onPressDate={props.onPressDate}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

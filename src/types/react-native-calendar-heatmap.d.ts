declare module 'react-native-calendar-heatmap' {
  import * as React from 'react';

  export type HeatmapValue = {
    date: string | Date | number;
    count?: number;
  };

  export type Props = {
    endDate?: string | Date | number;
    numDays?: number;
    values: HeatmapValue[];
    colorArray?: string[];
  };

  const CalendarHeatmap: React.ComponentType<Props>;
  export default CalendarHeatmap;
}

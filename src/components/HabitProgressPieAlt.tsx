import React from 'react';
import ReactECharts from 'echarts-for-react';

export interface HabitPieData {
  name: string;
  progress: number; // 0-100
}

interface HabitProgressPieAltProps {
  data: HabitPieData[];
}

export const HabitProgressPieAlt: React.FC<HabitProgressPieAltProps> = ({ data }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%' // Show name and percent
    },
    legend: {
      show: false,
    },
    series: [
      {
        name: 'Habit Progress',
        type: 'pie',
        radius: ['70%', '90%'], // Doughnut style, small
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
        },
        data: data.map((d, i) => ({
          value: d.progress,
          name: d.name,
          itemStyle: {
            color: [
              '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#f472b6', '#38bdf8', '#facc15',
            ][i % 8],
          },
        })),
      },
    ],
    animation: false,
  };

  return (
    <div style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', padding: 0, margin: '0 auto', overflow: 'hidden' }}>
      <ReactECharts option={option} style={{ width: 40, height: 40, minWidth: 40, minHeight: 40, maxWidth: 40, maxHeight: 40 }} />
    </div>
  );
};

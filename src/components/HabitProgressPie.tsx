import React from 'react';
import ReactECharts from 'echarts-for-react';

export interface HabitPieData {
  name: string;
  progress: number; // 0-100
}

interface HabitProgressPieProps {
  data: HabitPieData[];
}

const COLORS = [
  '#34d399', // green
  '#60a5fa', // blue
  '#fbbf24', // yellow
  '#f87171', // red
  '#a78bfa', // purple
  '#f472b6', // pink
  '#38bdf8', // sky
  '#facc15', // amber
];

export const HabitProgressPie: React.FC<HabitProgressPieProps> = ({ data }) => {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: {
        color: '#374151',
        fontSize: 14,
      },
    },
    series: [
      {
        name: 'Habit Progress',
        type: 'pie',
        radius: ['50%', '80%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        data: data.map((d, i) => ({
          value: d.progress,
          name: d.name,
          itemStyle: {
            color: COLORS[i % COLORS.length],
          },
        })),
      },
    ],
    animation: false,
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-card rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Habit Progress Overview</h2>
      <ReactECharts option={option} style={{ width: '100%', height: 320 }} />
    </div>
  );
};
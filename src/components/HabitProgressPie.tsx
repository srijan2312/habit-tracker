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
  const filteredData = data.filter(d => d.progress > 0);
  const chartData = filteredData.length ? filteredData : data; // show all if everything is 0

  const option = {
    textStyle: {
      color: '#e5e7eb',
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}%',
      backgroundColor: '#111827',
      borderColor: '#1f2937',
      textStyle: { color: '#e5e7eb' },
    },
    legend: {
      type: 'scroll',
      orient: 'horizontal',
      bottom: 0,
      left: 'center',
      width: '92%',
      padding: [10, 16, 4, 16],
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 14,
      textStyle: {
        color: '#e5e7eb',
        fontSize: 14,
      },
    },
    series: [
      {
        name: 'Habit Progress',
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        label: {
          show: false,
          color: '#e5e7eb',
        },
        labelLine: { lineStyle: { color: '#9ca3af' } },
        emphasis: {
          label: {
            show: true,
            color: '#e5e7eb',
            fontSize: 16,
            fontWeight: 'bold',
          },
          scale: true,
          scaleSize: 8,
        },
        data: chartData.map((d, i) => ({
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
    <div className="w-full max-w-2xl mx-auto bg-card rounded-xl shadow p-6 pb-10 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-center text-foreground">Habit Progress Overview</h2>
      <ReactECharts option={option} style={{ width: '100%', height: 380 }} />
    </div>
  );
};
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { HabitWithStats } from '@/hooks/useHabits';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isAfter } from 'date-fns';

interface MonthlyProgressChartProps {
  habits: HabitWithStats[];
  selectedMonth: Date;
  type: 'daily' | 'cumulative';
}

export const MonthlyProgressChart: React.FC<MonthlyProgressChartProps> = ({ habits, selectedMonth, type }) => {
  const chartData = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const now = new Date();
    const isCurrentMonth = monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth();
    const effectiveEnd = isCurrentMonth ? now : monthEnd;
    const days = eachDayOfInterval({ start: monthStart, end: effectiveEnd });
    let cumulative = 0;
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      // For each habit, check if it has a completed log for this day (unique per habit)
      let completedCount = 0;
      habits.forEach(habit => {
        // Only count if the log is in the selected month
        const hasCompleted = habit.logs.some(log => {
          const d = new Date(log.date);
          return log.date === dateStr && log.completed && d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
        });
        if (hasCompleted) completedCount++;
      });
      const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
      cumulative += completedCount;
      return { day: format(day, 'd'), date: dateStr, percentage, cumulative };
    });
  }, [habits, selectedMonth]);

  if (habits.length === 0) return <div className="flex h-full items-center justify-center text-muted-foreground">No habits</div>;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => type === 'daily' ? `${v}%` : v} />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
        <Area type="monotone" dataKey={type === 'daily' ? 'percentage' : 'cumulative'} stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorProgress)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { HabitWithStats } from '@/hooks/useHabits';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isAfter } from 'date-fns';

interface MonthlyStatsProps {
  habits: HabitWithStats[];
  selectedMonth: Date;
}

export const MonthlyStats: React.FC<MonthlyStatsProps> = ({ habits, selectedMonth }) => {
  const stats = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const now = new Date();
    // Only use up to today if the selected month is the current month, else use full month
    const isCurrentMonth = monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth();
    const effectiveEnd = isCurrentMonth ? now : monthEnd;
    const days = eachDayOfInterval({ start: monthStart, end: effectiveEnd });
    const totalPossible = habits.length * days.length;
    let completedCount = 0;
    habits.forEach(habit => {
      // Only count unique completed days for this habit
      const completedDates = new Set(
        habit.logs
          .filter(log => {
            const d = new Date(log.date);
            return d >= monthStart && d <= effectiveEnd && d.getMonth() === monthStart.getMonth() && log.completed;
          })
          .map(log => log.date)
      );
      completedCount += completedDates.size;
    });
    return { completed: completedCount, uncompleted: totalPossible - completedCount };
  }, [habits, selectedMonth]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-success/10 p-2"><CheckCircle2 className="h-5 w-5 text-success" /></div>
        <div>
          <p className="text-sm font-medium text-success">Total Completed</p>
          <p className="text-4xl font-bold text-foreground">{stats.completed}</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-destructive/10 p-2"><XCircle className="h-5 w-5 text-destructive" /></div>
        <div>
          <p className="text-sm font-medium text-destructive">Total Uncompleted</p>
          <p className="text-4xl font-bold text-foreground">{stats.uncompleted}</p>
        </div>
      </div>
    </div>
  );
};

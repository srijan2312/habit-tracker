import { useMemo } from 'react';
import { HabitWithStats } from '@/hooks/useHabits';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isAfter } from 'date-fns';

interface MonthlyProgressRingProps { habits: HabitWithStats[]; selectedMonth: Date; }

export const MonthlyProgressRing: React.FC<MonthlyProgressRingProps> = ({ habits, selectedMonth }) => {
  const { completed, total, percentage } = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    // Always use the full month for denominator
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const totalPossible = habits.length * days.length;
    let completedCount = 0;
    habits.forEach(habit => {
      // Only count unique completed days for this habit
      const completedDates = new Set(
        habit.logs
          .filter(log => {
            const d = new Date(log.date);
            return d >= monthStart && d <= monthEnd && d.getMonth() === monthStart.getMonth() && log.completed;
          })
          .map(log => log.date)
      );
      completedCount += completedDates.size;
    });
    return { completed: completedCount, total: totalPossible, percentage: totalPossible > 0 ? Math.round((completedCount / totalPossible) * 100) : 0 };
  }, [habits, selectedMonth]);

  const size = 140, strokeWidth = 12, radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--primary))" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700 ease-out" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{completed} / {total}</span>
        </div>
      </div>
      <p
        className={
          [
            "mt-2 text-sm font-bold px-3 py-1 rounded-full inline-block shadow-sm",
            percentage >= 80
              ? "bg-success text-success-light"
              : percentage >= 40
              ? "bg-accent text-accent-foreground"
              : "bg-secondary text-secondary-foreground"
          ].join(' ')
        }
      >
        {percentage}% Complete
      </p>
    </div>
  );
};

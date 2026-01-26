import { useCallback, useMemo } from 'react';
import { Check } from 'lucide-react';
import { HabitWithStats } from '@/hooks/useHabits';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isAfter, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface HabitGridProps { habits: HabitWithStats[]; selectedMonth: Date; onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void; }

export const HabitGrid: React.FC<HabitGridProps> = ({ habits, selectedMonth, onToggle }) => {
    // Get the number of days in the selected month
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd }).length;
  const { days, weeks } = useMemo(() => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const weekGroups: Date[][] = [];
    let currentWeek: Date[] = [];
    allDays.forEach((day, i) => { currentWeek.push(day); if (getDay(day) === 6 || i === allDays.length - 1) { weekGroups.push([...currentWeek]); currentWeek = []; } });
    return { days: allDays, weeks: weekGroups };
  }, [selectedMonth]);

  const habitStats = useMemo(() => habits.map(habit => {
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const now = new Date();
    const isCurrentMonth = monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth();
    const effectiveEnd = isCurrentMonth ? now : monthEnd;
    const daysInRange = eachDayOfInterval({ start: monthStart, end: effectiveEnd });
    // Only count unique completed days within the selected month
    const completedDates = new Set(
      habit.logs
        .filter(log => {
          const d = new Date(log.date);
          return d >= monthStart && d <= effectiveEnd && d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear() && log.completed;
        })
        .map(log => log.date)
    );
    const completedDays = completedDates.size;
    // Cap percentage at 100
    const rawPercent = daysInRange.length > 0 ? Math.round((completedDays / daysInRange.length) * 100) : 0;
    return {
      habitId: habit._id,
      completedDays,
      totalDays: daysInRange.length,
      percentage: Math.min(rawPercent, 100)
    };
  }), [habits, selectedMonth]);

  const logMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    habits.forEach(habit => {
      map.set(habit._id, new Set(habit.logs.map(log => log.date)));
    });
    return map;
  }, [habits]);

  const isDateCompleted = useCallback((habitId: string, date: Date) => {
    const dates = logMap.get(habitId);
    if (!dates) return false;
    return dates.has(format(date, 'yyyy-MM-dd'));
  }, [logMap]);
  const isFutureDate = (date: Date) => isAfter(startOfDay(date), startOfDay(new Date()));
  const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const today = format(new Date(), 'yyyy-MM-dd');

  if (habits.length === 0) return <div className="flex h-64 items-center justify-center rounded-lg border bg-card text-muted-foreground">No habits to track</div>;

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full min-w-[800px] border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/50 px-4 py-3 text-left font-semibold">HABITS</th>
            {weeks.map((week, i) => <th key={i} colSpan={week.length} className="border-l px-2 py-1 text-center text-xs font-semibold text-primary">WEEK {i + 1}</th>)}
            <th className="border-l px-3 py-3 text-center text-xs">COMPLETED</th>
            <th className="border-l px-3 py-3 text-center text-xs">TOTAL</th>
          </tr>
          <tr className="border-b bg-muted/30">
            <th className="sticky left-0 z-10 bg-muted/30 px-4 py-2"></th>
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              return <th key={dateStr} className={cn("border-l px-1 py-1 text-center", dateStr === today && "bg-primary/20")}>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[10px] text-muted-foreground">{dayLabels[getDay(day)]}</span>
                  <span className={cn("text-xs font-medium", dateStr === today ? "text-primary font-bold" : "text-foreground")}>{format(day, 'd')}</span>
                </div>
              </th>;
            })}
            <th className="border-l px-3 py-2"></th><th className="border-l px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit, index) => {
            const stats = habitStats.find(s => s.habitId === habit._id);
            return (
              <tr key={habit._id} className="border-b hover:bg-muted/20 transition-colors">
                <td className="sticky left-0 z-10 bg-card px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-8 text-center font-bold text-primary">{index + 1}</span>
                    <span className="font-medium text-foreground truncate max-w-[150px]">{habit.title}</span>
                  </div>
                </td>
                {days.map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const isCompleted = isDateCompleted(habit._id, day);
                  const isFuture = isFutureDate(day);
                  return <td key={`${habit._id}-${dateStr}`} className={cn("border-l px-1 py-2 text-center", dateStr === today && "bg-primary/10")}> 
                    <button onClick={() => !isFuture && onToggle(habit._id, dateStr, !isCompleted)} disabled={isFuture} className={cn("mx-auto flex h-6 w-6 items-center justify-center rounded border-2 transition-all", isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 bg-background hover:border-primary/50", isFuture && "opacity-30 cursor-not-allowed")}> 
                      {isCompleted && <Check className="h-4 w-4" />} 
                    </button> 
                  </td>;
                })}
                <td className="border-l px-3 py-3 text-center font-semibold">{stats?.completedDays} / {stats?.totalDays}</td>
                <td className="border-l px-3 py-3 text-center">
                  <div
                    className={[
                      "mx-auto h-6 rounded px-3 flex items-center justify-center text-sm font-bold min-w-[50px]",
                      stats?.percentage >= 80
                        ? "bg-success text-success-light"
                        : stats?.percentage >= 40
                        ? "bg-accent text-accent-foreground"
                        : "bg-secondary text-secondary-foreground"
                    ].join(' ')}
                  >
                    {Math.min(stats?.percentage || 0, 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{daysInMonth} day progress</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

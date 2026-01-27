import { useCallback, useMemo } from 'react';
import { Check, Lock, Zap } from 'lucide-react';
import { HabitWithStats } from '@/hooks/useHabits';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isAfter, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

interface HabitGridProps { habits: HabitWithStats[]; selectedMonth: Date; onToggle: (habitId: string, date: string, currentlyCompleted: boolean) => void; onUseFreeze: (habitId: string, date: string) => void; }

export const HabitGrid: React.FC<HabitGridProps> = ({ habits, selectedMonth, onToggle, onUseFreeze }) => {
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

  const habitStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const isCurrentMonth = monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth();
    const effectiveEnd = isCurrentMonth ? now : monthEnd;
    const daysElapsed = Math.floor((effectiveEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    const effectiveEndStr = format(effectiveEnd, 'yyyy-MM-dd');
    
    return habits.map(habit => {
      // Count unique completed days within the selected month range
      const completedDates = new Set(
        habit.logs
          .filter(log => log.date >= monthStartStr && log.date <= effectiveEndStr && log.completed)
          .map(log => log.date)
      );

      // Count frozen days as protected completions for stats display
      if (habit.freezeDates && habit.freezeDates.length) {
        habit.freezeDates.forEach(dateStr => {
          if (dateStr >= monthStartStr && dateStr <= effectiveEndStr) {
            completedDates.add(dateStr);
          }
        });
      }
      const completedDays = completedDates.size;
      const rawPercent = daysElapsed > 0 ? Math.round((completedDays / daysElapsed) * 100) : 0;
      return {
        habitId: habit._id,
        completedDays,
        totalDays: daysElapsed,
        percentage: Math.min(rawPercent, 100)
      };
    });
  }, [habits, selectedMonth]);

  const logMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    habits.forEach(habit => {
      map.set(habit._id, new Set(habit.logs.map(log => log.date)));
    });
    return map;
  }, [habits]);

  const freezeMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    habits.forEach(habit => {
      if (habit.freezeDates && habit.freezeDates.length) {
        map.set(habit._id, new Set(habit.freezeDates));
      }
    });
    return map;
  }, [habits]);

  const isDateCompleted = useCallback((habitId: string, date: Date) => {
    const dates = logMap.get(habitId);
    if (!dates) return false;
    return dates.has(format(date, 'yyyy-MM-dd'));
  }, [logMap]);

  const isDateFrozen = useCallback((habitId: string, date: Date) => {
    const dates = freezeMap.get(habitId);
    if (!dates) return false;
    return dates.has(format(date, 'yyyy-MM-dd'));
  }, [freezeMap]);
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
                  const isFrozen = isDateFrozen(habit._id, day);
                  const isFuture = isFutureDate(day);
                  const isToday = dateStr === today;
                  // Use habit start_date if present, otherwise fall back to created_at (older habits should allow freezing past days)
                  const startDate = habit.start_date
                    ? startOfDay(new Date(habit.start_date))
                    : habit.created_at
                      ? startOfDay(new Date(habit.created_at))
                      : startOfDay(new Date(0));
                  const isBeforeStart = startOfDay(day) < startDate;
                  const isPast = startOfDay(day) < startOfDay(new Date());
                  const locked = isFuture || isBeforeStart || (isPast && !isToday);
                  const canUseFreeze = locked && !isFuture && !isBeforeStart && !isCompleted && !isFrozen;

                  const handleClick = () => {
                    if (locked) {
                      if (!isCompleted && !isFrozen && !isBeforeStart && !isFuture) {
                        onUseFreeze(habit._id, dateStr);
                      }
                      return;
                    }
                    onToggle(habit._id, dateStr, !isCompleted);
                  };

                  const showLock = locked && !isCompleted && !isFrozen;

                  return <td key={`${habit._id}-${dateStr}`} className={cn("border-l px-1 py-2 text-center", dateStr === today && "bg-primary/10")}> 
                    <button
                      onClick={handleClick}
                      disabled={isFuture || isBeforeStart}
                      className={cn(
                        "mx-auto flex h-6 w-6 items-center justify-center rounded border-2 transition-all",
                        isCompleted ? "border-primary bg-primary text-primary-foreground" :
                        isFrozen ? "border-blue-400 bg-blue-50 text-blue-700" :
                        canUseFreeze ? "border-dashed border-blue-500 bg-blue-50/60 hover:bg-blue-100" :
                        "border-muted-foreground/30 bg-background hover:border-primary/50",
                        (isFuture || isBeforeStart) && "opacity-30 cursor-not-allowed"
                      )}
                      title={locked ? (isBeforeStart ? "Starts later" : !isToday ? (canUseFreeze ? "Click to use a freeze and restore this day" : "Day locked.") : undefined) : "Mark complete"}
                      aria-label={canUseFreeze ? "Use a freeze to restore this day" : locked ? "Locked day" : "Toggle completion"}
                    >
                      {isCompleted && <Check className="h-4 w-4" />}
                      {!isCompleted && isFrozen && <Zap className="h-4 w-4" />}
                      {showLock && <Lock className="h-3 w-3 text-muted-foreground" />}
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

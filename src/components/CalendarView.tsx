import { useState, useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HabitWithStats } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CalendarViewProps {
  habits: HabitWithStats[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({ habits }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedHabitId, setSelectedHabitId] = useState<string>('all');

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getDayStatus = (date: Date): 'completed' | 'missed' | 'partial' | 'future' | 'none' => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (date > today) return 'future';

    const relevantHabits = selectedHabitId === 'all' 
      ? habits 
      : habits.filter(h => h.id === selectedHabitId);

    if (relevantHabits.length === 0) return 'none';

    const completedCount = relevantHabits.filter(habit => 
      habit.logs.some(log => log.date === dateStr && log.completed)
    ).length;

    if (completedCount === relevantHabits.length) return 'completed';
    if (completedCount > 0) return 'partial';
    if (completedCount === 0 && date < today) return 'missed';
    return 'none';
  };

  const getCompletedHabitsForDay = (date: Date): string[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return habits
      .filter(habit => habit.logs.some(log => log.date === dateStr && log.completed))
      .map(habit => habit.title);
  };

  return (
    <div className="rounded-xl border bg-card p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h2 className="min-w-[180px] text-center font-display text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <Select value={selectedHabitId} onValueChange={setSelectedHabitId}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by habit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Habits</SelectItem>
            {habits.map(habit => (
              <SelectItem key={habit.id} value={habit.id}>
                {habit.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-success" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-warning" />
          <span className="text-muted-foreground">Partial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-missed" />
          <span className="text-muted-foreground">Missed</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {WEEKDAYS.map(day => (
          <div 
            key={day} 
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Days */}
        {calendarDays.map(day => {
          const status = getDayStatus(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const completedHabits = getCompletedHabitsForDay(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "group relative aspect-square flex flex-col items-center justify-center rounded-lg p-1 transition-all",
                !isCurrentMonth && "opacity-30",
                isToday(day) && "ring-2 ring-primary ring-offset-2",
                status === 'completed' && "bg-success-light",
                status === 'partial' && "bg-warning-light",
                status === 'missed' && "bg-missed-light",
              )}
            >
              <span className={cn(
                "text-sm font-medium",
                isToday(day) && "text-primary font-bold",
                status === 'completed' && "text-success",
                status === 'missed' && "text-missed",
              )}>
                {format(day, 'd')}
              </span>
              
              {/* Status dot */}
              {status !== 'future' && status !== 'none' && (
                <div className={cn(
                  "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                  status === 'completed' && "bg-success",
                  status === 'partial' && "bg-warning",
                  status === 'missed' && "bg-missed",
                )} />
              )}

              {/* Tooltip */}
              {completedHabits.length > 0 && (
                <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-40 -translate-x-1/2 rounded-lg bg-foreground p-2 text-xs text-background shadow-lg group-hover:block">
                  <p className="mb-1 font-semibold">Completed:</p>
                  <ul className="space-y-0.5">
                    {completedHabits.slice(0, 5).map((title, i) => (
                      <li key={i} className="truncate">• {title}</li>
                    ))}
                    {completedHabits.length > 5 && (
                      <li>+{completedHabits.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

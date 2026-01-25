import { Flame, MoreHorizontal, Pencil, Trash2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { HabitWithStats } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

import { useNavigate } from 'react-router-dom';

interface HabitCardProps {
  habit: HabitWithStats;
  onEdit: (habit: HabitWithStats) => void;
  onDelete: (habitId: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onEdit,
  onDelete,
}) => {
  const navigate = useNavigate();
  // Calculate days in current month
  const now = new Date();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const daysInMonth = monthEnd.getDate();

  const frequencyLabel = habit.frequency === 'daily' 
    ? 'Daily' 
    : habit.frequency === 'weekly' 
      ? 'Weekly' 
      : 'Custom';

  // When card is clicked, go to monthly planner for this habit
  const handleCardClick = () => {
    navigate(`/monthly-tracker?habitId=${habit._id}`);
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-lg cursor-pointer",
        habit.isCompletedToday && "border-success/30 bg-success-light/30"
      )}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Removed tick/untick button. Card is now clickable. */}

          {/* Habit Info */}
          <div className="flex flex-col gap-1">
              <h3 className={cn(
                "font-semibold text-foreground transition-all"
              )}>
                {habit.title}
              </h3>
            {habit.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {habit.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                <Calendar className="h-3 w-3" />
                {frequencyLabel}
              </span>
              {habit.currentStreak > 0 && (
                <span className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  habit.currentStreak >= 7 
                    ? "bg-streak-light text-streak animate-streak" 
                    : "bg-warning-light text-warning"
                )}>
                  <Flame className="h-3 w-3" />
                  {habit.currentStreak} day streak
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 bg-secondary text-foreground shadow-none"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(habit); }}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={e => { e.stopPropagation(); onDelete(habit._id); }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{daysInMonth} day progress</span>
          <span className="font-medium text-foreground">{Math.min(habit.completionPercentage, 100)}%</span>
        </div>
        <Progress value={Math.min(habit.completionPercentage, 100)} className="h-1.5" />
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{habit.currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current Streak</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{habit.longestStreak}</p>
          <p className="text-xs text-muted-foreground">Best Streak</p>
        </div>
      </div>
    </div>
  );
};

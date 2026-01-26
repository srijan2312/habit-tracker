import { useMemo } from 'react';
import { Target, Flame, Trophy, TrendingUp, Star } from 'lucide-react';
import { HabitWithStats } from '@/hooks/useHabits';
import { format } from 'date-fns';

interface StatsOverviewProps {
  habits: HabitWithStats[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ habits }) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => h.isCompletedToday).length;
    const totalCurrentStreak = habits.reduce((sum, h) => sum + h.currentStreak, 0);
    const bestStreak = Math.max(...habits.map(h => h.longestStreak), 0);
    const avgCompletion = totalHabits > 0 
      ? Math.round(habits.reduce((sum, h) => sum + h.completionPercentage, 0) / totalHabits)
      : 0;

    // Most Consistent Habit (highest completion % this month)
    let mostConsistentHabit = null;
    if (habits.length > 0) {
      mostConsistentHabit = habits.reduce((max, h) =>
        (h.completionPercentage > (max?.completionPercentage ?? -1) ? h : max), null
      );
    }

    return {
      totalHabits,
      completedToday,
      pendingToday: totalHabits - completedToday,
      totalCurrentStreak,
      bestStreak,
      avgCompletion,
      mostConsistentHabit,
    };
  }, [habits]);

  const cards = [
    {
      title: "Today's Progress",
      value: `${stats.completedToday}/${stats.totalHabits}`,
      subtitle: `${stats.pendingToday} habits pending`,
      icon: Target,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Best Streak',
      value: `${stats.bestStreak} days`,
      subtitle: 'Personal record',
      icon: Flame,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    stats.mostConsistentHabit && {
      title: 'Most Consistent Habit',
      value: stats.mostConsistentHabit.title,
      subtitle: `${Math.round(stats.mostConsistentHabit.completionPercentage)}% this month`,
      icon: Star,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Avg. Completion',
      value: `${stats.avgCompletion}%`,
      subtitle: 'Last 30 days',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 w-full">
      {cards.filter(Boolean).map((card, index) => (
        <div
          key={card.title}
          className="group rounded-xl border bg-card p-4 lg:p-5 transition-all duration-300 hover:shadow-lg animate-fade-up flex flex-col justify-between"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs lg:text-sm text-muted-foreground truncate">{card.title}</p>
              <p className="mt-1 text-xl lg:text-3xl font-bold tracking-tight text-foreground break-words">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground truncate">{card.subtitle}</p>
            </div>
            <div className={`rounded-lg p-2 lg:p-2.5 flex-shrink-0 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 lg:h-5 lg:w-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

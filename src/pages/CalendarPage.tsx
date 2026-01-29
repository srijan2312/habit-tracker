import { Loader2 } from 'lucide-react';
import { useHabits } from '@/hooks/useHabits';
import { CalendarView } from '@/components/CalendarView';
import { StatsOverview } from '@/components/StatsOverview';

export default function CalendarPage() {
  const { habits, isLoading } = useHabits();

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading calendar...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          {/* Page Header */}
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Calendar
            </h1>
            <p className="mt-1 text-muted-foreground">
              View your habit history over time
            </p>
          </div>

          {/* Stats Overview */}
          <StatsOverview habits={habits} />

          {/* Calendar */}
          <CalendarView habits={habits} />
        </div>
      </main>
    </div>
  );
}

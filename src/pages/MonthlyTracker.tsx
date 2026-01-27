import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { useHabits } from '@/hooks/useHabits';
import { Header } from '@/components/Header';
import { MonthlyStats } from './MonthlyStats';
import { MonthlyProgressChart } from './MonthlyProgressChart';
import { MonthlyProgressRing } from './MonthlyProgressRing';
import { HabitGrid } from './HabitGrid';
import { CelebrationDialog } from '@/components/CelebrationDialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MonthlyTracker() {
  const { habits, isLoading, toggleHabitCompletion, useFreeze } = useHabits();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [celebrationData, setCelebrationData] = useState<{ open: boolean; habitTitle: string; streak: number }>({
    open: false,
    habitTitle: '',
    streak: 0,
  });

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const handleToggle = (habitId: string, date: string, currentlyCompleted: boolean) => {
    toggleHabitCompletion.mutate({ habitId, date, completed: currentlyCompleted });
    
    // Show celebration if completing today's habit
    if (currentlyCompleted && date === format(new Date(), 'yyyy-MM-dd')) {
      const habit = habits.find(h => h._id === habitId);
      if (habit) {
        setCelebrationData({
          open: true,
          habitTitle: habit.title,
          streak: habit.currentStreak + 1,
        });
      }
    }
  };

  const currentYear = selectedMonth.getFullYear();
  const currentMonthNum = selectedMonth.getMonth();

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const handleYearChange = (year: string) => {
    const newDate = new Date(selectedMonth);
    newDate.setFullYear(parseInt(year));
    setSelectedMonth(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(months.indexOf(month));
    setSelectedMonth(newDate);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-6">
        <div className="container space-y-6">
          {/* Month Selector */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border bg-card p-1">
                <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-24 border-0 bg-primary text-primary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={months[currentMonthNum]} onValueChange={handleMonthChange}>
                  <SelectTrigger className="w-32 border-0 bg-primary text-primary-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-5 w-5" /></Button>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}><ChevronRight className="h-5 w-5" /></Button>
              </div>
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground uppercase">{format(selectedMonth, 'MMMM yyyy')}</h1>
            <div className="rounded-lg border bg-primary px-4 py-2 text-center">
              <p className="text-xs text-primary-foreground/80">Today's Date:</p>
              <p className="text-sm font-semibold text-primary-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border bg-card p-5"><MonthlyStats habits={habits} selectedMonth={selectedMonth} /></div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-primary">Habits Completed / Day</h3>
              <div className="h-40"><MonthlyProgressChart habits={habits} selectedMonth={selectedMonth} type="daily" /></div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 text-sm font-semibold text-primary">Habits Completed in Month</h3>
              <div className="h-40"><MonthlyProgressChart habits={habits} selectedMonth={selectedMonth} type="cumulative" /></div>
            </div>
            <div className="rounded-xl border bg-card p-5">
              <h3 className="mb-3 text-center text-sm font-semibold text-primary">Monthly Progress</h3>
              <MonthlyProgressRing habits={habits} selectedMonth={selectedMonth} />
            </div>
          </div>

          {/* Habit Grid */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span className="inline-flex items-center gap-1">🔒 Locked past day</span>
              <span className="inline-flex items-center gap-1">⚡ Click locked past day to use a freeze</span>
              <span className="inline-flex items-center gap-1">✅ Completed</span>
            </div>
            <HabitGrid habits={habits} selectedMonth={selectedMonth} onToggle={handleToggle} onUseFreeze={useFreeze} />
          </div>
        </div>
      </main>

      {/* Celebration Dialog */}
      <CelebrationDialog
        open={celebrationData.open}
        onClose={() => setCelebrationData({ open: false, habitTitle: '', streak: 0 })}
        habitTitle={celebrationData.habitTitle}
        streak={celebrationData.streak}
      />
    </div>
  );
}

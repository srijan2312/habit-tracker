import { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { useHabits } from '@/hooks/useHabits';
import { useAuth } from '@/contexts/useAuth';
import { Header } from '@/components/Header';
import { MonthlyStats } from './MonthlyStats';
import { MonthlyProgressChart } from './MonthlyProgressChart';
import { MonthlyProgressRing } from './MonthlyProgressRing';
import { HabitGrid } from './HabitGrid';
import { CelebrationDialog } from '@/components/CelebrationDialog';
import { API_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function MonthlyTracker() {
  const { user } = useAuth();
  const youId = (user as any)?._id || (user as any)?.id;
  const { habits, isLoading, toggleHabitCompletion, useFreeze, celebrationData, setCelebrationData } = useHabits();
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const handlePrevMonth = () => setSelectedMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setSelectedMonth(prev => addMonths(prev, 1));

  const handleToggle = async (habitId: string, date: string, currentlyCompleted: boolean) => {
    toggleHabitCompletion.mutate({ habitId, date, completed: currentlyCompleted });
    
    // Increment challenge score only when completing habits for today
    if (currentlyCompleted && youId) {
      const today = format(new Date(), 'yyyy-MM-dd');
      const dateStr = format(new Date(date), 'yyyy-MM-dd');
      
      console.log('📋 Challenge score check:', { youId, dateStr, today, isToday: dateStr === today });
      
      // Only increment if the completed date is today
      if (dateStr === today) {
        try {
          const token = localStorage.getItem('token');
          console.log('🚀 Incrementing challenge score for userId:', youId);
          const response = await fetch(`${API_URL}/api/challenges/increment-score`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ userId: youId }),
          });
          const data = await response.json();
          console.log('✅ Challenge score response:', data);
        } catch (err) {
          console.error('❌ Failed to update challenge score:', err);
        }
      } else {
        console.log('⏭️ Skipping score update - not today\'s date');
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
          <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr] items-center">
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
            <h1 className="text-center font-display text-3xl font-bold text-foreground uppercase">{format(selectedMonth, 'MMMM yyyy')}</h1>
            <div className="flex justify-end">
              <div className="rounded-lg border bg-primary px-4 py-2 text-center">
                <p className="text-xs text-primary-foreground/80">Today's Date:</p>
                <p className="text-sm font-semibold text-primary-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
              </div>
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

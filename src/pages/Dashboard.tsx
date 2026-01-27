import { useState, useMemo, useEffect } from 'react';
import { Plus, Filter, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useHabits, HabitWithStats, Habit } from '@/hooks/useHabits';
import { useDailyReward } from '@/hooks/useDailyReward';
import { Header } from '@/components/Header';
import { HabitCard } from '@/components/HabitCard';
import { HabitFormModal } from '@/components/HabitFormModal';
import { DailyRewardModal } from '@/components/DailyRewardModal';
import { StatsOverview } from '@/components/StatsOverview';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { HabitProgressPie } from '@/components/HabitProgressPie';

type FilterType = 'all' | 'completed' | 'pending';

export default function Dashboard() {
  const { habits, isLoading, createHabit, updateHabit, deleteHabit, toggleHabitCompletion } = useHabits();
  const { data: reward } = useDailyReward();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithStats | null>(null);
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDailyReward, setShowDailyReward] = useState(false);

  const today = format(new Date(), 'EEEE, MMMM d');

  // Show daily reward modal on first load if user can claim today
  useEffect(() => {
    if (reward && reward.canClaimToday) {
      setShowDailyReward(true);
    }
  }, [reward?.canClaimToday]);

  const filteredHabits = useMemo(() => {
    switch (filter) {
      case 'completed':
        return habits.filter(h => h.isCompletedToday);
      case 'pending':
        return habits.filter(h => !h.isCompletedToday);
      default:
        return habits;
    }
  }, [habits, filter]);

  const handleCreateHabit = async (habitData: Omit<Habit, '_id' | 'userId' | 'created_at' | 'updated_at'>) => {
    await createHabit.mutateAsync(habitData as Habit);
    setIsFormOpen(false);
  };

  // Accepts form data shape (without id)
  const handleUpdateHabit = async (
    habitData: Omit<Parameters<typeof updateHabit.mutateAsync>[0], 'id'>
  ) => {
    if (editingHabit) {
      await updateHabit.mutateAsync({ id: editingHabit._id, ...habitData });
      setEditingHabit(null);
    }
  };

  const handleDeleteHabit = async () => {
    if (deletingHabitId) {
      await deleteHabit.mutateAsync(deletingHabitId);
      setDeletingHabitId(null);
    }
  };

  const handleToggle = (habitId: string, date: string, completed: boolean) => {
    toggleHabitCompletion.mutate({ habitId, date, completed });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your habits...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">{today}</p>
            </div>
            <Button onClick={() => setIsFormOpen(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              New Habit
            </Button>
          </div>

          {/* Stats Overview */}
          <StatsOverview habits={habits} />

          {/* Pie Chart Overview */}
          {habits.length > 0 && (
            <HabitProgressPie
              data={habits.map(h => ({
                name: h.title,
                progress: h.completionPercentage || 0,
              }))}
            />
          )}

          {/* Habits Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl font-semibold text-foreground">
                Today's Habits
              </h2>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Habits</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {habits.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/20 py-16">
                <div className="mb-4 rounded-full bg-primary/10 p-4">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mb-2 font-display text-lg font-semibold text-foreground">
                  No habits yet
                </h3>
                <p className="mb-4 text-center text-muted-foreground">
                  Create your first habit to start building<br />better routines.
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Habit
                </Button>
              </div>
            ) : filteredHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-12">
                <p className="text-muted-foreground">
                  No {filter === 'completed' ? 'completed' : 'pending'} habits
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredHabits.map((habit) => (
                  <HabitCard
                    key={habit._id}
                    habit={habit}
                    onEdit={setEditingHabit}
                    onDelete={setDeletingHabitId}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create/Edit Modal */}
      <HabitFormModal
        open={isFormOpen || !!editingHabit}
        onClose={() => {
          setIsFormOpen(false);
          setEditingHabit(null);
        }}
        onSubmit={async (habitData) => {
          if (editingHabit) {
            await handleUpdateHabit(habitData);
          } else {
            await handleCreateHabit(habitData);
          }
        }}
        habit={editingHabit}
        isLoading={createHabit.isPending || updateHabit.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingHabitId} onOpenChange={() => setDeletingHabitId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this habit and all its tracking history. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHabit}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Daily Signin Reward Modal */}
      <DailyRewardModal open={showDailyReward} onOpenChange={setShowDailyReward} />
    </div>
  );
}

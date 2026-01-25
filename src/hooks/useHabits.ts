import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { format, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export interface Habit {
  _id: string;
  userId: string;
  title: string;
  description: string | null;
  frequency: string;
  custom_days: number[] | null;
  start_date: string;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  _id?: string;
  habit_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  created_at?: string;
}

export interface HabitWithStats extends Habit {
  currentStreak: number;
  longestStreak: number;
  completionPercentage: number;
  isCompletedToday: boolean;
  logs: HabitLog[];
}

interface User {
  _id: string;
  email: string;
}

export const useHabits = () => {
  const auth = useAuth();
  const user = (auth && typeof auth === 'object' && 'user' in auth) ? (auth.user as User | null) : null;
  const queryClient = useQueryClient();

  const habitsQuery = useQuery({
    queryKey: ['habits', user?._id],
    queryFn: async (): Promise<HabitWithStats[]> => {
      if (!user) return [];
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/habits/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch habits');
      // The backend now returns habits with logs and stats
      return await res.json();
    },
    enabled: !!user,
  });

  const createHabit = useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const token = localStorage.getItem('token');
      const res = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...habit, userId: user._id }),
      });
      if (!res.ok) throw new Error('Failed to create habit');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit created successfully!');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error('Failed to create habit: ' + error.message);
      } else {
        toast.error('Failed to create habit');
      }
    },
  });

  const updateHabit = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: string }) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/habits/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update habit');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit updated!');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error('Failed to update habit: ' + error.message);
      } else {
        toast.error('Failed to update habit');
      }
    },
  });

  const deleteHabit = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete habit');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit deleted');
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error('Failed to delete habit: ' + error.message);
      } else {
        toast.error('Failed to delete habit');
      }
    },
  });

  const toggleHabitCompletion = useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      const token = localStorage.getItem('token');
      if (completed) {
        // Create the log
        const res = await fetch(`/api/habits/logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ habit_id: habitId, user_id: user._id, date, completed: true }),
        });
        if (!res.ok) throw new Error('Failed to create log');
      } else {
        // Delete the log (send user_id as query param for backend compatibility)
        const res = await fetch(`/api/habits/logs/${habitId}/${date}?user_id=${user._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          toast.error('No log found to untick for this day.');
          return;
        }
        if (!res.ok) throw new Error('Failed to delete log');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
    onError: (error: unknown) => {
      if (error instanceof Error) {
        toast.error('Failed to update habit: ' + error.message);
      } else {
        toast.error('Failed to update habit');
      }
    },
  });

  const getMonthLogs = async (month: Date) => {
    if (!user) return [];
    const token = localStorage.getItem('token');
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    const res = await fetch(`/api/habits/logs/${user._id}?start=${start}&end=${end}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch logs');
    return await res.json();
  };

  return {
    habits: habitsQuery.data || [],
    isLoading: habitsQuery.isLoading,
    error: habitsQuery.error,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getMonthLogs,
    refetch: habitsQuery.refetch,
  };
};

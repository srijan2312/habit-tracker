import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { format, startOfMonth, endOfMonth, startOfDay, subDays } from 'date-fns';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';
import { useState } from 'react';

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
  freezeDates?: string[];
  freezesUsed?: number;
}

interface User {
  _id: string;
  email: string;
}

interface SupabaseHabit {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  frequency: string;
  custom_days: number[] | null;
  start_date: string;
  reminder_time: string | null;
  created_at: string;
  updated_at: string;
  freezeDates?: string[];
  freezesUsed?: number;
}

export const useHabits = () => {
  const auth = useAuth();
  const user = (auth && typeof auth === 'object' && 'user' in auth) ? (auth.user as User | null) : null;
  const queryClient = useQueryClient();
  const [celebrationData, setCelebrationData] = useState<{ open: boolean; habitTitle: string; streak: number }>({
    open: false,
    habitTitle: '',
    streak: 0,
  });

  const habitsQuery = useQuery({
    queryKey: ['habits', user?._id],
    queryFn: async (): Promise<HabitWithStats[]> => {
      if (!user) return [];
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/habits/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch habits');
      const data = await res.json();
      // Transform Supabase data (id, user_id) to frontend format (_id, userId)
      return data.map((habit: SupabaseHabit) => ({
        ...habit,
        _id: habit.id,
        userId: habit.user_id,
        freezeDates: habit.freezeDates || [],
        freezesUsed: habit.freezesUsed ?? habit.freezesUsed ?? 0,
      }));
    },
    enabled: !!user,
  });

  const createHabit = useMutation({
    mutationFn: async (habit: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Not authenticated');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/habits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...habit, user_id: user._id }),
      });
      if (!res.ok) throw new Error('Failed to create habit');
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', user?._id] });
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
      const res = await fetch(`${API_URL}/api/habits/${id}`, {
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
      queryClient.invalidateQueries({ queryKey: ['habits', user?._id] });
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
      const res = await fetch(`${API_URL}/api/habits/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Failed to delete habit');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', user?._id] });
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
        const res = await fetch(`${API_URL}/api/habits/logs`, {
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
        const res = await fetch(`${API_URL}/api/habits/logs/${habitId}/${date}?user_id=${user._id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404) {
          toast.error('No log found to untick for this day.');
          return;
        }
        if (!res.ok) throw new Error('Failed to delete log');
      }
      return { habitId, date, completed };
    },
    onMutate: async ({ habitId, date, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['habits', user?._id] });
      const previousHabits = queryClient.getQueryData<HabitWithStats[]>(['habits', user?._id]);
      if (!previousHabits || !user) return { previousHabits };

      const updated = previousHabits.map(habit => {
        if (habit._id !== habitId) return habit;
        const hasLog = habit.logs.some(log => log.date === date);
        let logs = habit.logs;
        if (completed && !hasLog) {
          logs = [...habit.logs, { habit_id: habitId, user_id: user._id, date, completed: true }];
        } else if (!completed && hasLog) {
          logs = habit.logs.filter(log => log.date !== date);
        }
        return { ...habit, logs };
      });

      queryClient.setQueryData(['habits', user._id], updated);
      return { previousHabits };
    },
    onSuccess: (data) => {
      if (data && data.completed && data.date === format(new Date(), 'yyyy-MM-dd')) {
        const habits = queryClient.getQueryData<HabitWithStats[]>(['habits', user?._id]);
        const habit = habits?.find(h => h._id === data.habitId);
        if (habit) {
          const streak = computeStreak(habit.logs, habit.freezeDates || []);
          setCelebrationData({
            open: true,
            habitTitle: habit.title,
            streak,
          });
        }
      }
    },
    onError: (error: unknown, _variables, context) => {
      if (context?.previousHabits && user) {
        queryClient.setQueryData(['habits', user._id], context.previousHabits);
      }
      if (error instanceof Error) {
        toast.error('Failed to update habit: ' + error.message);
      } else {
        toast.error('Failed to update habit');
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', user?._id] });
    },
  });

  const getMonthLogs = async (month: Date) => {
    if (!user) return [];
    const token = localStorage.getItem('token');
    const start = format(startOfMonth(month), 'yyyy-MM-dd');
    const end = format(endOfMonth(month), 'yyyy-MM-dd');
    const res = await fetch(`${API_URL}/api/habits/logs/${user._id}?start=${start}&end=${end}`, {
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
    celebrationData,
    setCelebrationData,
    useFreeze: async (habitId: string, date: string) => {
      if (!user) return;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/habits/freeze/${habitId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user._id, date }),
      });
      if (res.ok) {
        toast.success('Streak freeze applied!');
        queryClient.invalidateQueries({ queryKey: ['habits', user._id] });
        queryClient.invalidateQueries({ queryKey: ['user-freezes', user._id] }); // Refresh freeze counter
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to use freeze');
      }
    },
  };
};

// Compute current streak counting freeze dates as protected days
const computeStreak = (logs: HabitLog[], freezeDates: string[]) => {
  const today = startOfDay(new Date());
  const completed = new Set(logs.filter(l => l.completed).map(l => l.date));
  freezeDates.forEach(d => completed.add(d));

  let streak = 0;
  let cursor = today;

  while (true) {
    const dateStr = format(cursor, 'yyyy-MM-dd');
    if (completed.has(dateStr)) {
      streak += 1;
      cursor = subDays(cursor, 1);
    } else {
      break;
    }
  }

  return streak;
};

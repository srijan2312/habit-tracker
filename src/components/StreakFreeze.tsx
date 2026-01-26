import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { API_URL } from '@/config/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { toast } from 'sonner';

export const StreakFreezeCounter: React.FC = () => {
  const auth = useAuth();
  const user = (auth && typeof auth === 'object' && 'user' in auth) ? auth.user : null;

  const { data: userData, refetch } = useQuery({
    queryKey: ['user-freezes', user?._id],
    queryFn: async () => {
      if (!user) return null;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/habits/info/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch user info');
      return await res.json();
    },
    enabled: !!user,
    staleTime: 0, // Always refetch to show current count
    refetchOnWindowFocus: true,
  });

  const freezesCount = userData?.freezes_available || 0;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full border border-blue-200 dark:border-blue-800">
      <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200">
        {freezesCount} Freeze{freezesCount !== 1 ? 's' : ''}
      </Badge>
    </div>
  );
};

interface StreakFreezeButtonProps {
  habitId: string;
  missedDate: string;
  onFreezeUsed?: () => void;
}

export const StreakFreezeButton: React.FC<StreakFreezeButtonProps> = ({ habitId, missedDate, onFreezeUsed }) => {
  const auth = useAuth();
  const user = (auth && typeof auth === 'object' && 'user' in auth) ? auth.user : null;
  const [loading, setLoading] = useState(false);

  const { data: userData, refetch } = useQuery({
    queryKey: ['user-freezes', user?._id],
    queryFn: async () => {
      if (!user) return null;
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/habits/info/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch user info');
      return await res.json();
    },
    enabled: !!user,
  });

  const freezesCount = userData?.freezes_available || 0;
  const hasFreeze = freezesCount > 0;

  const handleUseFreeze = async () => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/habits/freeze/${habitId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: user._id, date: missedDate }),
      });
      if (res.ok) {
        toast.success('Streak freeze applied! Your streak is protected.');
        refetch();
        onFreezeUsed?.();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to use freeze');
      }
    } catch (err) {
      toast.error('Error applying freeze');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleUseFreeze}
      disabled={!hasFreeze || loading}
      size="sm"
      variant="outline"
      className="gap-2"
    >
      <Zap className="w-4 h-4" />
      {loading ? 'Using...' : `Use Freeze (${freezesCount})`}
    </Button>
  );
};

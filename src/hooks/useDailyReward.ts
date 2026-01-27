import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { API_URL } from '@/config/api';
import { toast } from 'sonner';

interface DailyRewardStatus {
  currentDay: number;
  lastClaimedDate: string | null;
  totalPoints: number;
  freezeTokens: number;
  canClaimToday: boolean;
}

interface ClaimRewardResponse {
  success: boolean;
  currentDay: number;
  pointsEarned: number;
  freezeTokenEarned: number;
  totalPoints: number;
  totalFreezeTokens: number;
}

export const useDailyReward = () => {
  const auth = useAuth();
  const user = (auth && typeof auth === 'object' && 'user' in auth) ? (auth.user as any) : null;
  const userId = user?._id || user?.id;
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['daily-reward-status', userId],
    queryFn: async (): Promise<DailyRewardStatus> => {
      if (!userId) return {
        currentDay: 0,
        lastClaimedDate: null,
        totalPoints: 0,
        freezeTokens: 0,
        canClaimToday: false,
      };

      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${API_URL}/api/rewards/daily-signin/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch daily reward status');
        return await res.json();
      } catch (error) {
        // If table doesn't exist yet, return default state but still mark as can claim
        console.error('Daily reward error:', error);
        return {
          currentDay: 1,
          lastClaimedDate: null,
          totalPoints: 0,
          freezeTokens: 0,
          canClaimToday: true,
        };
      }
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Not authenticated');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/rewards/daily-signin/claim/${userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to claim reward');
      }
      return (await res.json()) as ClaimRewardResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['daily-reward-status', userId] });
      
      if (data.freezeTokenEarned > 0) {
        toast.success(`🎉 Day 7 Complete! Earned 1 Freeze Token!`);
      } else {
        toast.success(`✨ Earned 10 Points! (Day ${data.currentDay})`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to claim reward');
    },
  });

  return {
    ...statusQuery,
    claimReward: claimRewardMutation.mutate,
    isClaimingReward: claimRewardMutation.isPending,
  };
};

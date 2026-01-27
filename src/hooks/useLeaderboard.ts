import { useQuery } from '@tanstack/react-query';
import { API_URL } from '@/config/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  highestStreak: number;
  avgCompletion: number;
  habitCount: number;
}

interface LeaderboardResponse {
  users: LeaderboardEntry[];
  userRank: LeaderboardEntry | null;
}

interface UseLeaderboardOptions {
  metric?: 'streak' | 'completion';
  limit?: number;
  userId?: string;
}

export const useLeaderboard = ({
  metric = 'streak',
  limit = 50,
  userId,
}: UseLeaderboardOptions = {}) => {
  return useQuery({
    queryKey: ['leaderboard', metric, limit, userId],
    queryFn: async () => {
      const params = new URLSearchParams({
        metric,
        limit: String(limit),
        ...(userId && { userId }),
      });
      const response = await fetch(`${API_URL}/api/leaderboard?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      return (await response.json()) as LeaderboardResponse;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

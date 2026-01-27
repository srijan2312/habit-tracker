import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/useAuth';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Flame, TrendingUp, Crown, ArrowLeft } from 'lucide-react';

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [metric, setMetric] = useState<'streak' | 'completion'>('streak');
  const { data: leaderboard, isLoading, error } = useLeaderboard({ 
    metric, 
    limit: 50,
    userId: user?._id || (user as any)?.id
  });

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>Failed to load leaderboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Leaderboard</h1>
              <p className="text-muted-foreground">
                See how you stack up against other habit builders. Rankings based on your highest streak and monthly completion rate.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6 space-y-6">
              <Tabs defaultValue="streak" onValueChange={(value) => setMetric(value as 'streak' | 'completion')} className="w-full">
                <TabsList className="grid w-full max-w-sm grid-cols-2">
                  <TabsTrigger value="streak" className="gap-2">
                    <Flame className="w-4 h-4" />
                    Longest Streak
                  </TabsTrigger>
                  <TabsTrigger value="completion" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Completion %
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="streak" className="space-y-4">
                  <LeaderboardTable 
                    leaderboard={leaderboard?.users} 
                    userRank={leaderboard?.userRank}
                    isLoading={isLoading} 
                    metric="streak" 
                    currentUserId={user?._id || (user as any)?.id}
                  />
                </TabsContent>

                <TabsContent value="completion" className="space-y-4">
                  <LeaderboardTable 
                    leaderboard={leaderboard?.users} 
                    userRank={leaderboard?.userRank}
                    isLoading={isLoading} 
                    metric="completion"
                    currentUserId={user?._id || (user as any)?.id}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

interface LeaderboardTableProps {
  leaderboard?: Array<{
    rank: number;
    userId: string;
    name: string;
    highestStreak: number;
    avgCompletion: number;
    habitCount: number;
  }>;
  userRank?: {
    rank: number;
    userId: string;
    name: string;
    highestStreak: number;
    avgCompletion: number;
    habitCount: number;
  } | null;
  isLoading: boolean;
  metric: 'streak' | 'completion';
  currentUserId?: string;
}

function LeaderboardTable({ leaderboard, userRank, isLoading, metric, currentUserId }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!leaderboard || leaderboard.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">No leaderboard data yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          {leaderboard?.map((entry) => (
            <div
              key={entry.userId}
              className={`flex items-center justify-between p-4 rounded-lg transition-colors border border-border/40 ${
                entry.userId === currentUserId ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-accent/50'
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 font-bold text-primary min-w-max">
                  {entry.rank === 1 ? (
                    <Trophy className="w-6 h-6 text-yellow-500" />
                  ) : entry.rank === 2 ? (
                    <Trophy className="w-6 h-6 text-gray-400" />
                  ) : entry.rank === 3 ? (
                    <Trophy className="w-6 h-6 text-orange-600" />
                  ) : (
                    <span>#{entry.rank}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{entry.name}</p>
                    {entry.userId === currentUserId && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">You</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8 min-w-max">
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="font-bold text-lg">{entry.highestStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">day streak</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{entry.avgCompletion.toFixed(0)}%</div>
                  <p className="text-xs text-muted-foreground">completion</p>
                </div>
              </div>
            </div>
          ))}

          {/* Show user's rank if outside top 50 */}
          {userRank && (
            <>
              <div className="py-4 flex items-center justify-center">
                <div className="h-px bg-border flex-1"></div>
                <span className="px-4 text-xs text-muted-foreground font-medium">YOUR RANK</span>
                <div className="h-px bg-border flex-1"></div>
              </div>
              <div
                className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border-2 border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 font-bold text-primary-foreground min-w-max">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{userRank.name}</p>
                      <span className="text-xs bg-primary/30 text-primary px-2 py-0.5 rounded-full font-bold">You</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 min-w-max">
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <Flame className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-lg">{userRank.highestStreak}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">day streak</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{userRank.avgCompletion.toFixed(0)}%</div>
                    <p className="text-xs text-muted-foreground">completion</p>
                  </div>
                  <div className="text-right pl-4 border-l border-border">
                    <div className="font-bold text-xl text-primary">#{userRank.rank}</div>
                    <p className="text-xs text-muted-foreground">rank</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

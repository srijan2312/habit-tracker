import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/useAuth';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Link2, PartyPopper, ShieldCheck, Users, Trash2 } from 'lucide-react';
import { API_URL } from '@/config/api';

type Participant = {
  id: string;
  userId: string;
  name: string;
  score: number;
  updatedAt: string;
};

type Challenge = {
  id: string;
  code: string;
  name: string;
  status: 'pending' | 'active';
  createdAt: string;
  ownerId?: string;
  participants: Participant[];
};

export default function FriendChallenges() {
  const { user } = useAuth();
  const youId = (user as any)?._id || (user as any)?.id || 'you';
  const youName = user?.name || (user as any)?.fullName || user?.email?.split('@')[0] || 'You';
  const [newName, setNewName] = useState('Weekend Sprint');
  const [joinCode, setJoinCode] = useState('');
  const [friendName, setFriendName] = useState('');

  const queryClient = useQueryClient();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const challengesQuery = useQuery({
    queryKey: ['friend-challenges', youId],
    enabled: Boolean(youId),
    queryFn: async (): Promise<Challenge[]> => {
      const res = await fetch(`${API_URL}/api/challenges?userId=${youId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load challenges');
      const data = await res.json();
      return data.challenges || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/challenges`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ userId: youId, userName: youName, name: newName }),
      });
      if (!res.ok) throw new Error('Failed to create challenge');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Challenge created — share the link with a friend!');
      queryClient.invalidateQueries({ queryKey: ['friend-challenges', youId] });
      setJoinCode(data.challenge?.code || '');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not create challenge');
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API_URL}/api/challenges/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ code: joinCode, userId: youId, userName: friendName || youName }),
      });
      if (!res.ok) throw new Error('Failed to join challenge');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Joined challenge');
      queryClient.invalidateQueries({ queryKey: ['friend-challenges', youId] });
      setFriendName('');
      setJoinCode('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not join challenge');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const res = await fetch(`${API_URL}/api/challenges/${challengeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error('Failed to delete challenge');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Challenge deleted');
      queryClient.invalidateQueries({ queryKey: ['friend-challenges', youId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Could not delete challenge');
    },
  });

  const challenges = challengesQuery.data || [];

  const leaderboard = useMemo(() => {
    if (!challenges.length) return [] as Array<Participant & { challengeName: string }>;
    const all = challenges.flatMap((c) => c.participants.map((p) => ({ ...p, challengeName: c.name })));
    return all.sort((a, b) => b.score - a.score);
  }, [challenges]);

  const lastInviteCode = challenges[0]?.code;
  const lastInviteLink = lastInviteCode ? `${window.location.origin}/join/${lastInviteCode}` : '';

  const handleCopy = async () => {
    if (!lastInviteLink) return;
    try {
      await navigator.clipboard.writeText(lastInviteLink);
      toast.success('Invite link copied');
    } catch (err) {
      console.error(err);
      toast.error('Could not copy link');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1 py-6 sm:py-10">
        <div className="container px-4 sm:px-6 space-y-6 sm:space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <PartyPopper className="h-5 w-5 text-primary" />
              <p className="text-sm font-medium text-primary">New</p>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Friend Challenges</h1>
            <p className="text-muted-foreground max-w-2xl">
              Create a head-to-head challenge, share a join link, and watch scores update as you both complete habits.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active challenges</CardDescription>
                <CardTitle className="text-3xl">{challenges.length || 0}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Shared with friends</CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>People competing</CardDescription>
                <CardTitle className="text-3xl">{leaderboard.length || 0}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">Total participants across challenges</CardContent>
            </Card>
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardDescription>Latest invite</CardDescription>
                <CardTitle className="text-xl">
                  {lastInviteCode || 'Create one to share'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {lastInviteCode || '----'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!lastInviteCode}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy link
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create a challenge</CardTitle>
                <CardDescription>Generate a shareable link for a friend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Challenge name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., 7-day pushups"
                  />
                </div>
                <Button className="w-full sm:w-auto" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                  <Link2 className="h-4 w-4 mr-2" />
                  {createMutation.isPending ? 'Creating...' : 'Create & share'}
                </Button>
                {lastInviteCode && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Code: {lastInviteCode}</Badge>
                      <span className="text-muted-foreground truncate">{lastInviteLink}</span>
                    </div>
                    <p className="text-muted-foreground">Send this link to your friend so they can join.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Join with a code</CardTitle>
                <CardDescription>Add a friend into an existing challenge.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Join code</label>
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="ABCD"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Friend name</label>
                  <Input
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    placeholder="Their display name"
                  />
                </div>
                <Button
                  className="w-full sm:w-auto"
                  variant="outline"
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {joinMutation.isPending ? 'Joining...' : 'Add friend'}
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Live standings</CardTitle>
              <CardDescription>Scores update as participants complete habits.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="challenges" className="w-full">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="challenges">Challenges</TabsTrigger>
                  <TabsTrigger value="leaderboard">Overall</TabsTrigger>
                </TabsList>

                <TabsContent value="challenges" className="space-y-4">
                  {challengesQuery.isLoading ? (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-muted-foreground">
                      Loading challenges...
                    </div>
                  ) : challenges.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-muted/40 p-6 text-center text-muted-foreground">
                      Create a challenge to start competing with a friend.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {challenges.map((challenge) => (
                        <div key={challenge.id} className="rounded-lg border p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">{challenge.code}</p>
                              <p className="text-lg font-semibold">{challenge.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>
                                {challenge.status === 'active' ? 'Active' : 'Pending'}
                              </Badge>
                              {challenge.ownerId === youId && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => deleteMutation.mutate(challenge.id)}
                                  disabled={deleteMutation.isPending}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          <Separator />
                          <div className="space-y-2">
                            {challenge.participants
                              .slice()
                              .sort((a, b) => b.score - a.score)
                              .map((p, idx) => (
                                <div
                                  key={p.id}
                                  className="flex items-center justify-between rounded-md px-3 py-2 bg-muted/30"
                                >
                                  <div className="flex items-center gap-3">
                                    <Badge variant={idx === 0 ? 'default' : 'secondary'} className="min-w-[36px] justify-center">
                                      #{idx + 1}
                                    </Badge>
                                    <div>
                                      <p className="font-medium flex items-center gap-2">
                                        {p.name}
                                        {p.id === youId && <ShieldCheck className="h-4 w-4 text-primary" />}
                                      </p>
                                      <p className="text-xs text-muted-foreground">Updated {new Date(p.updatedAt).toLocaleString()}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-semibold">{p.score} pts</p>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-2">
                  {leaderboard.length === 0 ? (
                    <p className="text-muted-foreground">No participants yet.</p>
                  ) : (
                    leaderboard.map((p, idx) => (
                      <div
                        key={`${p.id}-${idx}`}
                        className="flex items-center justify-between rounded-md border px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant={idx === 0 ? 'default' : 'secondary'} className="min-w-[36px] justify-center">
                            #{idx + 1}
                          </Badge>
                          <div>
                            <p className="font-medium flex items-center gap-2">
                              {p.name}
                              {p.id === youId && <ShieldCheck className="h-4 w-4 text-primary" />}
                            </p>
                            <p className="text-xs text-muted-foreground">{(p as any).challengeName}</p>
                          </div>
                        </div>
                        <p className="text-lg font-semibold">{p.score} pts</p>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

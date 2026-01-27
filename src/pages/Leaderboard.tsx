import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { Header } from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Copy, Link2, PartyPopper, Plus, ShieldCheck, Users } from 'lucide-react';

type Participant = {
  id: string;
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
  participants: Participant[];
};

const STORAGE_KEY = 'habitly.friend-challenges.v1';

const randomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const randomScore = () => Math.floor(Math.random() * 60) + 20;

export default function FriendChallenges() {
  const { user } = useAuth();
  const youId = (user as any)?._id || (user as any)?.id || 'you';
  const youName = user?.name || (user as any)?.fullName || user?.email?.split('@')[0] || 'You';

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newName, setNewName] = useState('Weekend Sprint');
  const [joinCode, setJoinCode] = useState('');
  const [friendName, setFriendName] = useState('');
  const [lastInvite, setLastInvite] = useState<{ code: string; link: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setChallenges(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load challenges', err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
    } catch (err) {
      console.error('Failed to persist challenges', err);
    }
  }, [challenges, hydrated]);

  const shareLinkFor = (code: string) => `${window.location.origin}/join/${code}`;

  const createChallenge = () => {
    const code = randomCode();
    const now = new Date().toISOString();
    const challenge: Challenge = {
      id: `ch-${now}`,
      code,
      name: newName || 'New Challenge',
      status: 'active',
      createdAt: now,
      participants: [
        {
          id: youId,
          name: youName,
          score: randomScore(),
          updatedAt: now,
        },
        {
          id: 'rival',
          name: 'Rival (sample)',
          score: randomScore(),
          updatedAt: now,
        },
      ],
    };

    setChallenges((prev) => [challenge, ...prev]);
    setLastInvite({ code, link: shareLinkFor(code) });
    toast.success('Challenge created — share the link with a friend!');
  };

  const addFriendToChallenge = () => {
    if (!joinCode.trim()) {
      toast.error('Enter a join code');
      return;
    }
    const target = challenges.find((c) => c.code.toUpperCase() === joinCode.trim().toUpperCase());
    if (!target) {
      toast.error('No challenge found for that code');
      return;
    }
    const now = new Date().toISOString();
    const name = friendName.trim() || 'Friend';
    const updated = {
      ...target,
      participants: [
        ...target.participants,
        {
          id: `${name}-${now}`,
          name,
          score: randomScore(),
          updatedAt: now,
        },
      ],
    };

    setChallenges((prev) => prev.map((c) => (c.id === target.id ? updated : c)));
    toast.success(`${name} added to the challenge!`);
    setFriendName('');
    setJoinCode('');
  };

  const leaderboard = useMemo(() => {
    if (!challenges.length) return [] as Participant[];
    const all = challenges.flatMap((c) => c.participants.map((p) => ({ ...p, challengeName: c.name })));
    return all.sort((a, b) => b.score - a.score);
  }, [challenges]);

  const handleCopy = async () => {
    if (!lastInvite) return;
    try {
      await navigator.clipboard.writeText(lastInvite.link);
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
                  {lastInvite ? lastInvite.code : 'Create one to share'}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                <Badge variant="secondary" className="uppercase tracking-wide">
                  {lastInvite ? lastInvite.code : '----'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!lastInvite}
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
                <Button className="w-full sm:w-auto" onClick={createChallenge}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Create & share
                </Button>
                {lastInvite && (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Code: {lastInvite.code}</Badge>
                      <span className="text-muted-foreground truncate">{lastInvite.link}</span>
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
                <Button className="w-full sm:w-auto" variant="outline" onClick={addFriendToChallenge}>
                  <Users className="h-4 w-4 mr-2" />
                  Add friend
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
                  {challenges.length === 0 ? (
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
                            <Badge variant={challenge.status === 'active' ? 'default' : 'secondary'}>
                              {challenge.status === 'active' ? 'Active' : 'Pending'}
                            </Badge>
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

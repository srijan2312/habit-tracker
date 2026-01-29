import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';

export default function JoinChallenge() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [friendName, setFriendName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to join a challenge');
      navigate('/signin');
    }
  }, [user, navigate]);

  const youId = (user as any)?._id || (user as any)?.id;
  const youName = user?.name || (user as any)?.fullName || user?.email?.split('@')[0] || 'You';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleJoin = async () => {
    if (!code) {
      toast.error('Invalid challenge code');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/challenges/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          code,
          userId: youId,
          userName: friendName.trim() || youName,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to join challenge');
      }

      toast.success('Joined challenge! Redirecting...');
      setTimeout(() => navigate('/leaderboard'), 1500);
    } catch (err: any) {
      toast.error(err.message || 'Could not join challenge');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 flex items-center justify-center py-6 sm:py-10">
        <div className="container px-4 sm:px-6 max-w-md">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Join Challenge</CardTitle>
              <CardDescription>
                You've been invited to a friend challenge!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Challenge code</label>
                <div className="rounded-lg border bg-muted/40 p-3 text-center font-mono text-lg font-semibold">
                  {code}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Your display name</label>
                <Input
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  placeholder={youName}
                />
              </div>

              <Button
                onClick={handleJoin}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  'Join Challenge'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

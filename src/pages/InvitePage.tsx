import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { API_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Share2, Users, Gift, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface Referral {
  id: string;
  created_at: string;
  freeze_tokens_awarded: number;
  referred_user: {
    email: string;
    created_at: string;
  };
}

interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  referrals: Referral[];
}

export default function InvitePage() {
  const auth = useAuth();
  const user = (auth && typeof auth === 'object' && 'user' in auth) ? auth.user : null;
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    const fetchReferralInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/referrals/info`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setReferralInfo(data);
        } else {
          toast.error('Failed to load referral info');
        }
      } catch (err) {
        console.error('Error fetching referral info:', err);
        toast.error('Failed to load referral info');
      } finally {
        setLoading(false);
      }
    };

    fetchReferralInfo();
  }, [user]);

  const referralLink = referralInfo
    ? `${window.location.origin}/signup?ref=${referralInfo.referralCode}`
    : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = async () => {
    if (navigator.share && referralLink) {
      try {
        await navigator.share({
          title: 'Join Habitly with my referral!',
          text: 'Build better habits with Habitly! Use my referral code to get started.',
          url: referralLink,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyToClipboard(referralLink);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-8 px-4">
          <Card>
            <CardHeader>
              <CardTitle>Sign in required</CardTitle>
              <CardDescription>Please sign in to view your referral code</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Invite Friends</h1>
            <p className="text-muted-foreground">
              Share Habitly with friends and earn 5 freeze tokens for each friend who signs up!
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Total Referrals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  Tokens Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-blue-600" />
                  Your Code
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-24" />
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Referral Link</CardTitle>
              <CardDescription>
                Share this link with friends. When they sign up, you'll get 5 freeze tokens!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Skeleton className="h-10 w-full" />
                <Button variant="outline" className="shrink-0" disabled>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>

              <div className="flex gap-2">
                <Button className="w-full" disabled>
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Link
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">How it works:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Share your referral link with friends</li>
                  <li>• They sign up using your link</li>
                  <li>• You get 5 freeze tokens added to your account</li>
                  <li>• They start building great habits!</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-bg min-h-screen">
      <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Invite Friends</h1>
        <p className="text-muted-foreground">
          Share Habitly with friends and earn 5 freeze tokens for each friend who signs up!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{referralInfo?.totalReferrals || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Gift className="w-4 h-4 text-green-600" />
              Tokens Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {(referralInfo?.totalReferrals || 0) * 5}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share2 className="w-4 h-4 text-blue-600" />
              Your Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-blue-600">
              {referralInfo?.referralCode || '---'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Referral Link</CardTitle>
          <CardDescription>
            Share this link with friends. When they sign up, you'll get 5 freeze tokens!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="font-mono text-sm"
            />
            <Button
              onClick={() => copyToClipboard(referralLink)}
              variant="outline"
              className="shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={shareReferral} className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              Share Link
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">How it works:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• Share your referral link with friends</li>
              <li>• They sign up using your link</li>
              <li>• You get 5 freeze tokens added to your account</li>
              <li>• They start building great habits!</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {referralInfo && referralInfo.referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>Friends who joined using your code</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referralInfo.referrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{referral.referred_user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/40">
                    +{referral.freeze_tokens_awarded} tokens
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {referralInfo && referralInfo.referrals.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-2">No referrals yet</h3>
            <p className="text-sm text-muted-foreground">
              Share your referral link to start earning freeze tokens!
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

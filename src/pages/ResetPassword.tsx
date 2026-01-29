import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('Verifying reset link...');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.setItem('in_password_reset', 'true');

    const initializeSession = async () => {
      try {
        const hash = window.location.hash;
        const search = window.location.search;

        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : '');
        const queryParams = new URLSearchParams(search);

        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        const hashType = hashParams.get('type');
        const queryType = queryParams.get('type');

        const token = queryParams.get('token');
        const code = queryParams.get('code');

        if (accessToken && (hashType === 'recovery' || queryType === 'recovery')) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (error) {
            setMessage(`❌ ${error.message || 'Failed to verify reset link'}`);
            return;
          }
        } else if (token && queryType === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: token,
          });

          if (error) {
            setMessage(`❌ ${error.message || 'Failed to verify reset link'}`);
            return;
          }
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setMessage(`❌ ${error.message || 'Failed to verify reset link'}`);
            return;
          }
        } else {
          setMessage('❌ Invalid or missing reset link. Please request a new one from the login page.');
          return;
        }

        // Verify session was set
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setMessage('❌ Auth session missing. Please request a new reset link.');
          return;
        }

        setMessage('');
        setReady(true);
      } catch (err) {
        setMessage('❌ An error occurred. Please try again.');
        console.error(err);
      }
    };

    initializeSession();

    return () => {
      sessionStorage.removeItem('in_password_reset');
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (password.length < 6) {
      setMessage('❌ Password must be at least 6 characters');
      return;
    }

    if (password !== confirm) {
      setMessage('❌ Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) {
        setMessage(`❌ ${error.message}`);
        return;
      }

      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err) {
      setMessage('❌ An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle>Password Reset!</CardTitle>
            <p className="mt-2 text-muted-foreground">Redirecting to login...</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              {message.startsWith('❌') ? (
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive">
                  <span className="text-white text-xl">✕</span>
                </div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              )}
            </div>
            <CardTitle>{message.startsWith('❌') ? 'Error' : 'Verifying'}</CardTitle>
            <p className="mt-2 text-muted-foreground">{message}</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle>Reset Password</CardTitle>
          <p className="mt-2 text-muted-foreground">Enter your new password below</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
            </div>
            {message && <div className="text-sm text-destructive">{message}</div>}
            <Button className="w-full" type="submit" size="lg" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

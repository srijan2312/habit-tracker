import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { supabase } from '@/lib/supabaseClient';


export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Mark that we're in password reset mode to prevent auth redirects
    sessionStorage.setItem('in_password_reset', 'true');

    const checkSession = async () => {
      try {
        // Check if we have a recovery token in the URL
        const hash = window.location.hash;
        
        if (hash.includes('access_token') && hash.includes('type=recovery')) {
          // Extract access_token from hash
          const params = new URLSearchParams(hash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (accessToken) {
            console.log('Recovery token found, setting session...');
            
            // Manually set the session with the recovery token
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (sessionError) {
              console.error('Session error:', sessionError);
              setError('Invalid or expired recovery link. Please request a new one.');
            } else if (sessionData.session) {
              console.log('Session established successfully');
              setHasSession(true);
            } else {
              setError('Could not establish recovery session.');
            }
          } else {
            setError('Invalid recovery link format.');
          }
        } else {
          // No recovery token in URL
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            setHasSession(true);
          } else {
            setError('No recovery link found. Please use the link from your reset email.');
          }
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Failed to verify recovery session.');
      }
    };

    checkSession();

    return () => {
      // Clean up when leaving this page
      sessionStorage.removeItem('in_password_reset');
    };
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!hasSession) {
      setError('No active recovery session. Please use the link from your reset email.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      // Verify we still have a session before updating
      const { data: sessionCheck } = await supabase.auth.getSession();
      if (!sessionCheck.session) {
        throw new Error('Session expired. Please request a new reset link.');
      }

      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw new Error(authError.message || 'Failed to reset password');
      
      setSuccess(true);
      // Sign out the recovery session
      await supabase.auth.signOut();
      
      setTimeout(() => navigate('/signin'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        {/* Always show dark mode button in top-right */}
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
            <CardTitle>Password reset!</CardTitle>
            <p className="mt-2 text-muted-foreground">Redirecting to login...</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Always show dark mode button in top-right */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
            </Link>
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
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button className="w-full" type="submit" size="lg" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

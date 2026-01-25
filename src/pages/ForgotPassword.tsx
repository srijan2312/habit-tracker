import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send email');
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Always show dark mode button in top-right */}
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-card rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
        {sent ? (
          <>
            <p className="mb-6 text-center text-muted-foreground">
              If an account exists, a reset link has been sent to your email.
            </p>
            <Button className="w-full" onClick={onBack} variant="secondary">
              Back to Login
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className={error ? 'border-destructive' : ''}
              />
            </div>
            {error && <div className="text-destructive text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading} size="lg">
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
            <div className="text-center mt-2">
              <Link to="/signin" className="text-sm text-primary hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

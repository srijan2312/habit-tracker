import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PasswordChecklist } from '@/components/PasswordChecklist';
import { API_URL } from '@/config/api';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().email('Invalid email address').max(255, 'Email is too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password is too long')
    .regex(passwordRegex, 'Password must contain uppercase, lowercase, number, and symbol'),
});

export default function SignUp() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref');
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signUpSchema.safeParse({ fullName, email, password });
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      // Store referral code in sessionStorage before signup
      if (referralCode) {
        sessionStorage.setItem('pending_referral_code', referralCode);
      }
      
      const { error, needsEmailConfirmation } = await signUp(email, password, fullName);
      if (error) {
        toast.error(error);
        sessionStorage.removeItem('pending_referral_code');
      } else if (needsEmailConfirmation) {
        toast.success('Check your email to confirm your account before signing in.');
        navigate('/signin');
      } else {
        toast.success('Account created successfully!');
        
        // Apply referral code if provided
        if (referralCode) {
          const token = localStorage.getItem('token');
          if (token) {
            try {
              const response = await fetch(`${API_URL}/api/referrals/apply`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ referralCode }),
              });
              
              if (response.ok) {
                await response.json();
              }
              sessionStorage.removeItem('pending_referral_code');
            } catch {
              // Silent failure for referral apply
            }
          }
        }
        
        navigate('/dashboard');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bg flex min-h-screen items-center justify-center px-4 py-10 sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card/90 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/Logo.png" alt="Habitly" className="h-10 w-10 object-contain rounded-full" />
            </Link>
            <ThemeToggle />
          </div>
          <div className="mb-4 mt-6 text-center">
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Start your journey — small steps add up.
            </p>
            {referralCode && (
              <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-sm text-green-700 dark:text-green-300">
                  🎉 Using referral code: <span className="font-bold">{referralCode}</span>
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              className={errors.fullName ? 'border-destructive' : ''}
            />
            {errors.fullName && (
              <p className="text-sm text-destructive">{errors.fullName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && <PasswordChecklist password={password} />}
          </div>

          <Button
            type="submit"
            className="h-12 w-full shadow-md shadow-primary/25"
            size="xl"
            variant="hero"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/signin" className="text-muted-foreground/60 font-medium transition-colors hover:text-primary">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

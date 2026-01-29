import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext, AuthContextType, User } from './AuthContextContext';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { supabase } from '@/lib/supabaseClient';


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivityTime');
    setUser(null);
  }, []);

  useInactivityLogout(signOut, Boolean(user));

  useEffect(() => {
    let isMounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      const session = data.session;
      if (session?.user) {
        const nameFromMeta = session.user.user_metadata?.full_name as string | undefined;
        const displayName = nameFromMeta || session.user.email?.split('@')[0] || 'User';
        const newUser: User = {
          _id: session.user.id,
          email: session.user.email || '',
          name: displayName,
        };
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      setLoading(false);
    };

    syncSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        const nameFromMeta = session.user.user_metadata?.full_name as string | undefined;
        const displayName = nameFromMeta || session.user.email?.split('@')[0] || 'User';
        const newUser: User = {
          _id: session.user.id,
          email: session.user.email || '',
          name: displayName,
        };
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/signin`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      const needsEmailConfirmation = !data.session;
      return { error: null, needsEmailConfirmation };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: 'Unknown error' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (!data.session?.user) {
        return { error: 'Email not confirmed. Please check your inbox.' };
      }

      localStorage.setItem('token', data.session.access_token);
      const userName = (data.session.user.user_metadata?.full_name as string | undefined) || email.split('@')[0];
      localStorage.setItem('user', JSON.stringify({ _id: data.session.user.id, email, name: userName }));
      localStorage.setItem('lastActivityTime', Date.now().toString());
      setUser({ _id: data.session.user.id, email, name: userName });
      
      // Apply pending referral code after successful signin
      const pendingReferralCode = sessionStorage.getItem('pending_referral_code');
      if (pendingReferralCode) {
        setTimeout(async () => {
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'https://habit-tracker-y0b7.onrender.com';
            const response = await fetch(`${API_URL}/api/referrals/apply`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({ referralCode: pendingReferralCode }),
            });
            
            if (response.ok) {
              const result = await response.json();
              console.log('Referral applied:', result);
            }
          } catch (err) {
            console.error('Failed to apply referral:', err);
          } finally {
            sessionStorage.removeItem('pending_referral_code');
          }
        }, 1000);
      }
      
      return { error: null };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: 'Unknown error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

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
      console.log('Auth state change event:', _event, 'has session:', !!session);
      if (session?.user) {
        const nameFromMeta = session.user.user_metadata?.full_name as string | undefined;
        const displayName = nameFromMeta || session.user.email?.split('@')[0] || 'User';
        const newUser: User = {
          _id: session.user.id,
          email: session.user.email || '',
          name: displayName,
        };
        console.log('Storing token from auth state change');
        localStorage.setItem('token', session.access_token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
      } else {
        console.log('Clearing auth data from state change');
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
      console.log('SignIn attempt for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('SignIn error:', error);
        return { error: error.message };
      }

      if (!data.session?.user) {
        console.error('No session after signIn');
        return { error: 'Email not confirmed. Please check your inbox.' };
      }

      console.log('SignIn successful, storing token...');
      console.log('Access token:', data.session.access_token?.substring(0, 20) + '...');
      localStorage.setItem('token', data.session.access_token);
      const userName = (data.session.user.user_metadata?.full_name as string | undefined) || email.split('@')[0];
      localStorage.setItem('user', JSON.stringify({ _id: data.session.user.id, email, name: userName }));
      localStorage.setItem('lastActivityTime', Date.now().toString());
      console.log('Token stored, verifying:', localStorage.getItem('token')?.substring(0, 20) + '...');
      setUser({ _id: data.session.user.id, email, name: userName });
      return { error: null };
    } catch (err: unknown) {
      console.error('SignIn exception:', err);
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

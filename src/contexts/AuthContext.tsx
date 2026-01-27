import React, { useEffect, useState, useCallback } from 'react';
import { AuthContext, AuthContextType, User } from './AuthContextContext';
import { API_URL } from '@/config/api';
// import { useInactivityLogout } from '@/hooks/useInactivityLogout';


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivityTime');
    setUser(null);
  }, []);

  // Inactivity logout disabled - feature still has dependency issues
  // useInactivityLogout(user ? signOut : () => {});

  useEffect(() => {
    // Check for token and user in localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const parsedUser = JSON.parse(userStr);
      // Ensure name is set (for old users without name in localStorage)
      if (!parsedUser.name && parsedUser.email) {
        parsedUser.name = parsedUser.email.split('@')[0];
      }
      setUser(parsedUser);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { error: data.error || 'Registration failed' };
      }
      return { error: null };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: 'Unknown error' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Login failed' };
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ _id: data.userId, email }));
      localStorage.setItem('lastActivityTime', Date.now().toString());
      setUser({ _id: data.userId, email });
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

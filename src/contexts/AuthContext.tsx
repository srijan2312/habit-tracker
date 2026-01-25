import React, { useEffect, useState } from 'react';
import { AuthContext, AuthContextType, User } from './AuthContextContext';


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token and user in localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setUser(JSON.parse(userStr));
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
      const res = await fetch('/api/users/login', {
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
      setUser({ _id: data.userId, email });
      return { error: null };
    } catch (err: unknown) {
      if (err instanceof Error) {
        return { error: err.message };
      }
      return { error: 'Unknown error' };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

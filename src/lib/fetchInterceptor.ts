import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// Intercept fetch to handle 401 errors globally
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  if (response.status === 401) {
    // Token expired or invalid
    await supabase.auth.signOut();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActivityTime');
    toast.error('Session expired. Please log in again.');
    window.location.href = '/';
  }
  
  return response;
};

export {};

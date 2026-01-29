import { toast } from 'sonner';
import { supabase } from '@/lib/supabaseClient';

// Intercept fetch to handle 401 errors globally
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const response = await originalFetch(...args);
  
  if (response.status === 401) {
    // Token expired or invalid
    console.error('401 Unauthorized:', args[0], await response.clone().text());
    // Temporarily disabled auto-logout to debug
    // await supabase.auth.signOut();
    // localStorage.removeItem('token');
    // localStorage.removeItem('user');
    // localStorage.removeItem('lastActivityTime');
    // toast.error('Session expired. Please log in again.');
    // window.location.href = '/';
  }
  
  return response;
};

export {};

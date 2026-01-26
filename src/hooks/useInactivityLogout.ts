import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const LAST_ACTIVITY_KEY = 'lastActivityTime';

export const useInactivityLogout = (signOut: () => void) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateLastActivity = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const checkInactivity = () => {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        handleLogout();
      }
    }
  };

  const handleLogout = () => {
    signOut();
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    toast.info('Logged out due to inactivity');
    navigate('/');
  };

  const resetTimeout = () => {
    updateLastActivity();
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIMEOUT);
  };

  useEffect(() => {
    // Check inactivity on mount (handles browser close/reopen)
    checkInactivity();

    // Set initial last activity time
    updateLastActivity();

    // Activity events to monitor
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      window.addEventListener(event, resetTimeout);
    });

    // Start initial timeout
    resetTimeout();

    // Check on visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, resetTimeout);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};

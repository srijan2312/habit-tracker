import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds
const LAST_ACTIVITY_KEY = 'lastActivityTime';

export const useInactivityLogout = (signOut: () => void | Promise<void>, enabled = true) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const signOutRef = useRef(signOut);

  // Keep signOut ref updated
  useEffect(() => {
    signOutRef.current = signOut;
  }, [signOut]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    const handleLogout = () => {
      signOutRef.current();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      toast.info('Logged out due to inactivity');
      window.location.assign('/');
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

    const resetTimeout = () => {
      updateLastActivity();
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        handleLogout();
      }, INACTIVITY_TIMEOUT);
    };

    // Set initial last activity time (reset to now on mount to avoid immediate logout)
    updateLastActivity();
    
    // Check inactivity only if there was a previous session
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
      // Only check if the timestamp is reasonable (not from an old session)
      if (timeSinceLastActivity > 0 && timeSinceLastActivity < 24 * 60 * 60 * 1000) {
        checkInactivity();
      }
    }

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
  }, [signOut, enabled]);
};

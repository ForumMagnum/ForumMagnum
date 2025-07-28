import { useEffect, useCallback } from 'react';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { randomId } from '../../lib/random';
import { clientContextVars, useTracking } from '../../lib/analyticsEvents';

const SESSION_STORAGE_KEY = 'lwSessionTracker';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  sessionId: string;
  lastActivityTimestamp: number;
}

export function useSessionManagement() {
  const { captureEvent } = useTracking();

  const getOrCreateSession = useCallback((): SessionData => {
    const ls = getBrowserLocalStorage();
    if (!ls) {
      return { sessionId: randomId(), lastActivityTimestamp: Date.now() };
    }

    const storedData = ls.getItem(SESSION_STORAGE_KEY);
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData) as SessionData;
        if (Date.now() - parsed.lastActivityTimestamp < SESSION_TIMEOUT_MS) {
          return parsed;
        }
        const newSession: SessionData = {
          sessionId: randomId(),
          lastActivityTimestamp: Date.now()
        };
        ls.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
        captureEvent('sessionStarted', { previousSessionId: parsed.sessionId, previousSessionLastActivity: parsed.lastActivityTimestamp });
        
        return newSession;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("Failed to parse session data", e);
      }
    }

    const newSession: SessionData = {
      sessionId: randomId(),
      lastActivityTimestamp: Date.now()
    };
    ls.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    captureEvent('sessionStarted');
    
    return newSession;
  }, [captureEvent]);

  const updateLastActivity = useCallback(() => {
    const ls = getBrowserLocalStorage();
    if (!ls) return;

    const storedData = ls.getItem(SESSION_STORAGE_KEY);
    if (!storedData) return;

    try {
      const session = JSON.parse(storedData) as SessionData;
      const updatedSession = { ...session, lastActivityTimestamp: Date.now() };
      ls.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to update session data", e);
    }
  }, []);

  useEffect(() => {
    const session = getOrCreateSession();
    clientContextVars.sessionId = session.sessionId;

    // Check session validity on ANY visibility change
    const handleVisibilityChange = () => {
      const currentSession = getOrCreateSession();
      clientContextVars.sessionId = currentSession.sessionId;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen for cross-tab session updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY && e.newValue) {
        try {
          const newSession = JSON.parse(e.newValue) as SessionData;
          clientContextVars.sessionId = newSession.sessionId;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to parse session data from storage event", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [getOrCreateSession]);

  return { updateLastActivity };
} 

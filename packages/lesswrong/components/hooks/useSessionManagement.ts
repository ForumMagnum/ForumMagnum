import { useState, useEffect, useCallback, useRef } from 'react';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { randomId } from '../../lib/random';
import { clientContextVars, useTracking } from '../../lib/analyticsEvents';
import { isClient } from '../../lib/executionEnvironment';

const SESSION_STORAGE_KEY = 'lwSessionTracker';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface SessionData {
  sessionId: string;
  lastActivityTimestamp: number;
}

export function useSessionManagement() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const sessionDataRef = useRef<SessionData | null>(null);
  const { captureEvent } = useTracking();

  useEffect(() => {
    sessionDataRef.current = sessionData;
  }, [sessionData]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateLastActivity = useCallback(() => {
    const ls = getBrowserLocalStorage();
    if (!ls || !sessionDataRef.current) return;

    const updatedSession = { ...sessionDataRef.current, lastActivityTimestamp: Date.now() };
    ls.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
    setSessionData(updatedSession);
  }, []);

  useEffect(() => {
    const session = getOrCreateSession();
    setSessionData(session);
    
    if (isClient) {
      clientContextVars.sessionId = session.sessionId;
    }

    // Listen for cross-tab session updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SESSION_STORAGE_KEY && e.newValue) {
        try {
          const newSession = JSON.parse(e.newValue) as SessionData;
          setSessionData(newSession);
          if (isClient) {
            clientContextVars.sessionId = newSession.sessionId;
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error("Failed to parse session data from storage event", err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [getOrCreateSession]);

  return { sessionData, updateLastActivity };
} 

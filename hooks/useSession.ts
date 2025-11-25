import { useState, useCallback } from 'react';

export interface Session {
  id: string;
  startedAt: number;
}

const SESSION_STORAGE_KEY = 'isekai-session';

const generateSessionId = (): string => {
  return `session_${crypto.randomUUID()}`;
};

const loadSession = (): Session | null => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
  return null;
};

const saveSession = (session: Session): void => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
};

const clearSession = (): void => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
};

export interface UseSessionResult {
  session: Session;
  sessionId: string;
  startNewSession: () => Session;
}

export const useSession = (): UseSessionResult => {
  const [session, setSession] = useState<Session>(() => {
    const existing = loadSession();
    if (existing) return existing;

    const newSession: Session = {
      id: generateSessionId(),
      startedAt: Date.now(),
    };
    saveSession(newSession);
    return newSession;
  });

  const startNewSession = useCallback((): Session => {
    clearSession();
    const newSession: Session = {
      id: generateSessionId(),
      startedAt: Date.now(),
    };
    saveSession(newSession);
    setSession(newSession);
    return newSession;
  }, []);

  return {
    session,
    sessionId: session.id,
    startNewSession,
  };
};

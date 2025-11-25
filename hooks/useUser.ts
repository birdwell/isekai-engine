import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: string;
  createdAt: number;
}

const USER_STORAGE_KEY = 'isekai-user';

const generateUserId = (): string => {
  return `user_${crypto.randomUUID()}`;
};

const loadUser = (): User | null => {
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load user:', e);
  }
  return null;
};

const saveUser = (user: User): void => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user:', e);
  }
};

export interface UseUserResult {
  user: User;
  userId: string;
  resetUser: () => void;
}

export const useUser = (): UseUserResult => {
  const [user, setUser] = useState<User>(() => {
    const existing = loadUser();
    if (existing) return existing;

    const newUser: User = {
      id: generateUserId(),
      createdAt: Date.now(),
    };
    saveUser(newUser);
    return newUser;
  });

  const resetUser = useCallback(() => {
    const newUser: User = {
      id: generateUserId(),
      createdAt: Date.now(),
    };
    saveUser(newUser);
    setUser(newUser);
  }, []);

  return {
    user,
    userId: user.id,
    resetUser,
  };
};

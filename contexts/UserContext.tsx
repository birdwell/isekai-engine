import React, { createContext, useContext } from 'react';
import { useUser, User, UseUserResult } from '@/hooks/useUser';
import { useSession, Session, UseSessionResult } from '@/hooks/useSession';

interface UserContextValue extends UseUserResult, UseSessionResult {}

const UserContext = createContext<UserContextValue | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const userState = useUser();
  const sessionState = useSession();

  const value: UserContextValue = {
    ...userState,
    ...sessionState,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextValue => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};

export const useUserId = (): string => {
  return useUserContext().userId;
};

export const useSessionId = (): string => {
  return useUserContext().sessionId;
};

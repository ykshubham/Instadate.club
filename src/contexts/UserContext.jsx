import React from 'react';
import { useAuth } from './AuthContext.jsx';

const UserContext = React.createContext(null);

export function UserProvider({ children }) {
  const { user, isAuthenticated, isLoading, refreshAuth } = useAuth();
  const value = React.useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    refreshUser: refreshAuth
  }), [user, isAuthenticated, isLoading, refreshAuth]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) throw new Error('useUser must be used inside UserProvider');
  return context;
}

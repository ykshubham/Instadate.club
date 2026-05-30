import React from 'react';

const AuthContext = React.createContext(null);

async function readJsonResponse(response, fallbackMessage) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(fallbackMessage);
  }
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || fallbackMessage);
  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authError, setAuthError] = React.useState(null);

  const checkSession = React.useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' });
      const payload = await readJsonResponse(response, 'Auth status unavailable');
      setUser(payload.user || null);
      return payload.user || null;
    } catch (error) {
      setUser(null);
      setAuthError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = React.useCallback((redirectTo = '/profile') => {
    window.location.href = `/api/auth/google/start?redirectTo=${encodeURIComponent(redirectTo)}`;
  }, []);

  const signInWithGoogleToken = React.useCallback(async idToken => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ idToken })
    });
    const payload = await readJsonResponse(response, 'Google login failed');
    setUser(payload.user || null);
    return payload;
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
    } finally {
      sessionStorage.removeItem('instadate_profile_cache');
      sessionStorage.removeItem('instadate_guest_mode');
      window.history.replaceState({}, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setUser(null);
      window.location.replace('/login');
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    signIn,
    signInWithGoogleToken,
    signOut,
    refreshAuth: checkSession
  }), [user, isLoading, authError, signIn, signInWithGoogleToken, signOut, checkSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

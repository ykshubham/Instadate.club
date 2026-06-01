import React from 'react';

const AuthContext = React.createContext(null);

async function readJsonResponse(response, fallbackMessage) {
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(fallbackMessage);
  }
  const payload = await response.json();
  if (!response.ok) {
    // Carry the structured error so callers can surface code/attemptsLeft/retryAfterSec.
    const err = new Error(payload.error || fallbackMessage);
    err.code = payload.error;
    err.payload = payload;
    throw err;
  }
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

  // Phone OTP (Sprint 2 Task 1). startPhoneOtp sends a code; verifyPhoneOtp signs in.
  const startPhoneOtp = React.useCallback(async (phone, countryCode = '+91') => {
    const response = await fetch('/api/auth/otp/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ phone, countryCode })
    });
    return readJsonResponse(response, 'Could not send code');
  }, []);

  const verifyPhoneOtp = React.useCallback(async (phone, code, countryCode = '+91') => {
    const response = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ phone, code, countryCode })
    });
    const payload = await readJsonResponse(response, 'Verification failed');
    setUser(payload.user || null);
    return payload;
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
    } finally {
      sessionStorage.removeItem('instadate_profile_cache');
      // Land on the login screen, NOT guest-browse. Removing the key would default
      // guestMode back to true (getItem !== 'false'), which re-enables the auth-only
      // /api/state poll → 401 → api-unauthorized → signOut → reload → loop (flicker).
      sessionStorage.setItem('instadate_guest_mode', 'false');
      setUser(null);
      window.location.replace('/login'); // single full reload yields clean logged-out state
    }
  }, []);

  const value = React.useMemo(() => ({
    user,
    isAuthenticated: Boolean(user),
    accountStatus: user?.status || (user ? 'active' : null),
    isLoading,
    authError,
    signIn,
    signInWithGoogleToken,
    startPhoneOtp,
    verifyPhoneOtp,
    signOut,
    refreshAuth: checkSession
  }), [user, isLoading, authError, signIn, signInWithGoogleToken, startPhoneOtp, verifyPhoneOtp, signOut, checkSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

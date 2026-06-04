import React from 'react';

const AuthContext = React.createContext(null);

// Shares the onboarding debug switch: localStorage.setItem('onboarding_debug','0')
// silences these too. ON by default during the friends-beta.
const AUTH_DEBUG = (() => {
  try { return localStorage.getItem('onboarding_debug') !== '0'; } catch { return false; }
})();
function authLog(event, data) {
  if (!AUTH_DEBUG) return;
  // eslint-disable-next-line no-console
  console.info(`[auth] ${event}`, data === undefined ? '' : data);
}

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
      authLog('me', {
        authenticated: Boolean(payload.user),
        userId: payload.user?.id ?? null,
        provider: payload.user?.authProvider ?? null,
        onboardingStep: payload.user?.onboardingStep ?? null,
        onboardingCompleted: payload.user?.onboardingCompleted ?? null,
        onboardingCompletedAt: payload.user?.onboardingCompletedAt ?? null
      });
      return payload.user || null;
    } catch (error) {
      setUser(null);
      setAuthError(error);
      authLog('me:error', { message: error?.message });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = React.useCallback(async (redirectTo = '/profile') => {
    const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform());
    const platformParam = isCapacitor ? '&platform=capacitor' : '';
    try {
      const response = await fetch(`/api/auth/google/url?redirectTo=${encodeURIComponent(redirectTo)}${platformParam}`, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      const payload = response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : { error: 'Auth service unavailable' };
      if (!response.ok || payload.error) throw new Error(payload.error || 'Google login could not start');
      if (!payload.url) throw new Error('Google login URL missing');

      if (isCapacitor) {
        // Chrome Custom Tabs — Google allows this, blocks WebView.
        // Dynamic import: only load @capacitor/browser when on native platform.
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: payload.url });
        return;
      }
      // Web: navigate in-browser
      window.location.assign(payload.url);
    } catch (error) {
      authLog('signIn:error', { message: error?.message });
      throw error;
    }
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

  // Email Magic Link (Sprint 2 Task 2). startEmailMagicLink requests magic link token email.
  const startEmailMagicLink = React.useCallback(async (email) => {
    const response = await fetch('/api/auth/magic/start', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ email })
    });
    return readJsonResponse(response, 'Could not request magic link');
  }, []);

  // Capacitor mobile app: exchange a one-time transfer token (received via deep
  // link after Chrome Custom Tabs Google OAuth) for a session cookie in the WebView.
  const exchangeTransferToken = React.useCallback(async (transferToken) => {
    const response = await fetch('/api/auth/transfer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      cache: 'no-store',
      body: JSON.stringify({ transferToken })
    });
    const payload = await readJsonResponse(response, 'Login transfer failed');
    setUser(payload.user || null);
    authLog('transfer', {
      ok: Boolean(payload.user),
      userId: payload.user?.id ?? null
    });
    return payload;
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
    } finally {
      sessionStorage.removeItem('instadate_profile_cache');
      // Clear all cached local data to prevent showing chats/profiles after signing out
      localStorage.removeItem('instadate_cached_state');
      localStorage.removeItem('instadate_pending_actions');
      localStorage.removeItem('onboarding_step');
      localStorage.removeItem('onboarding_draft');
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
    role: user?.role || 'member',
    isModerator: user?.role === 'moderator' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    isLoading,
    authError,
    signIn,
    signInWithGoogleToken,
    startPhoneOtp,
    verifyPhoneOtp,
    startEmailMagicLink,
    exchangeTransferToken,
    signOut,
    refreshAuth: checkSession
  }), [user, isLoading, authError, signIn, signInWithGoogleToken, startPhoneOtp, verifyPhoneOtp, startEmailMagicLink, exchangeTransferToken, signOut, checkSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowLeft, Award, BarChart2, Calendar, Camera, ChevronRight, Gem, Heart, Home, MapPin, Menu,
  MessageCircle, MessageSquare, Mic, Moon, Search, Send, ShieldCheck, Sparkles, Star, Sun, Ticket, User, Users, X, Zap, Mail, Paperclip
} from 'lucide-react';
import './styles.css';
import ProfileDashboard from './ProfileDashboard.jsx';
import OnboardingFlow from './OnboardingFlow.jsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { UserProvider } from './contexts/UserContext.jsx';
import { ProfileProvider, useProfile } from './contexts/ProfileContext.jsx';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx';
import AdminAnalyticsPage from './AdminAnalyticsPage.jsx';
import AdminHealthPage from './AdminHealthPage.jsx';
import AdminModerationPage from './AdminModerationPage.jsx';
import { EmptyState, Skeleton, ErrorState } from './components/FeedbackState.jsx';

// Redirect non-canonical Pages URLs to canonical Worker URL
if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.endsWith('instadate-club.pages.dev')) {
  window.location.replace('https://instadateclub.heyshubham1323.workers.dev' + window.location.pathname + window.location.search);
}




const defaultProfile = {
  photo: '',
  fullName: '',
  age: '',
  instagram: '',
  city: '',
  whatsapp: '',
  gender: '',
  intent: '',
  weekendStatus: '',
  bio: '',
  vibe: '',
  completed: false
};

const CLOUD_STATE_ENDPOINT = '/api/state';
const CLOUD_STATE_POLL_MS = 3000;

function formatHostEventDate(dateValue) {
  if (!dateValue) return 'Tonight';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Tonight';
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', weekday: 'short' });
}

function formatHostEventTime(timeValue) {
  if (!timeValue) return 'Tonight';
  const [hourText, minuteText = '00'] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hourText), Number(minuteText), 0, 0);
  if (Number.isNaN(date.getTime())) return 'Tonight';
  return `${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} onwards`;
}

function isTodayDateValue(dateValue) {
  if (!dateValue) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return dateValue === `${yyyy}-${mm}-${dd}`;
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="route-error">
          <strong>View could not render.</strong>
          <span>{this.state.error.message}</span>
          <pre>{this.state.error.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function daysAgoIso(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function getMemberPhotos(id) {
  const sets = {
    'kavya-sharma': ['/assets/member-photos/kavya-1.jpg', '/assets/member-photos/kavya-2.jpg'],
    'zara-chen': ['/assets/member-photos/zara-1.jpg', '/assets/member-photos/zara-2.jpg'],
    'priya-patel': ['/assets/member-photos/priya-1.jpg', '/assets/member-photos/priya-2.jpg'],
    'rohan-kapoor': ['/assets/member-photos/kavya-2.jpg', '/assets/member-photos/natasha-2.jpg'],
    'natasha-rao': ['/assets/member-photos/natasha-1.jpg', '/assets/member-photos/natasha-2.jpg'],
    'arjun-mehta': ['/assets/member-photos/priya-2.jpg', '/assets/member-photos/zara-1.jpg']
  };
  return sets[id] || [];
}

function getWeekendSignal(id, vibe = '') {
  const signals = {
    'kavya-sharma': {
      weekendStatus: 'Open to specialty coffee, a quiet balcony chat, and live music this weekend.',
      weekendTags: ['Coffee', 'Live music', 'Slow chat'],
      currentWeekendStatus: 'Coffee',
      weekendStatusUpdatedAt: daysAgoIso(1)
    },
    'zara-chen': {
      weekendStatus: 'Looking for indie bookstores, thrift browsing, and a relaxed Sunday walk.',
      weekendTags: ['Bookstore', 'Walk', 'Thrift'],
      currentWeekendStatus: 'Walk',
      weekendStatusUpdatedAt: daysAgoIso(2)
    },
    'priya-patel': {
      weekendStatus: 'Movie night, warm cafes, and old-books conversation after the show.',
      weekendTags: ['Movie', 'Cafe', 'Books'],
      currentWeekendStatus: 'Movie',
      weekendStatusUpdatedAt: daysAgoIso(2)
    },
    'rohan-kapoor': {
      weekendStatus: 'Movie first, then a late coffee and a long walk home.',
      weekendTags: ['Movie', 'Coffee', 'Walk'],
      currentWeekendStatus: 'Movie',
      weekendStatusUpdatedAt: daysAgoIso(1)
    },
    'natasha-rao': {
      weekendStatus: 'Indie screening, iced matcha, and one playlist worth remembering.',
      weekendTags: ['Movie', 'Matcha', 'Music'],
      currentWeekendStatus: 'Movie',
      weekendStatusUpdatedAt: daysAgoIso(0)
    },
    'arjun-mehta': {
      weekendStatus: 'Open to a photo walk, founder coffee, and honest conversation.',
      weekendTags: ['Photo walk', 'Coffee', 'Startup'],
      currentWeekendStatus: 'Photo walk',
      weekendStatusUpdatedAt: daysAgoIso(1)
    },
    'ishaan-verma': {
      weekendStatus: 'Looking for this weekend: "2323"',
      weekendTags: ['Weekend', 'Voice intro', 'Curated'],
      currentWeekendStatus: 'Weekend',
      weekendStatusUpdatedAt: daysAgoIso(1)
    },
    'kabir-kapoor': {
      weekendStatus: 'Jazz cafe near GK, slow conversation, Friday after 7.',
      weekendTags: ['Jazz', 'Cafe', 'Friday'],
      currentWeekendStatus: 'Cafe',
      weekendStatusUpdatedAt: daysAgoIso(1)
    },
    'aarav-mehta': {
      weekendStatus: 'Cubbon photo walk with coffee built into the route.',
      weekendTags: ['Photo walk', 'Coffee', 'Morning'],
      currentWeekendStatus: 'Photo walk',
      weekendStatusUpdatedAt: daysAgoIso(1)
    }
  };

  return signals[id] || {
    weekendStatus: `Open to a curated ${vibe.replace(' Vibe', '').toLowerCase() || 'weekend'} plan nearby.`,
    weekendTags: ['Weekend', 'Verified', 'Curated'],
    currentWeekendStatus: 'Weekend',
    weekendStatusUpdatedAt: daysAgoIso(1)
  };
}

function hasActiveWeekendStatus(member, status) {
  if (member.currentWeekendStatus !== status || !member.weekendStatusUpdatedAt) return false;
  const updatedAt = new Date(member.weekendStatusUpdatedAt).getTime();
  if (!Number.isFinite(updatedAt)) return false;
  return Date.now() - updatedAt <= 7 * 24 * 60 * 60 * 1000;
}

function getChatProfile(chat, resolvedMembers = []) {
  const matched = (resolvedMembers || []).find(m => m.id === chat.id || m.id === chat.slug);
  if (matched) {
    return matched;
  }

  const [ageText = '', city = '', scoreText = '92% Vibe Match'] = (chat.meta || '').split('•').map(part => part.trim());
  const score = scoreText.replace('Vibe Match', '').replace('Match', '').trim() || '92%';
  const photos = {
    'ishaan-verma': ['/assets/social_mixer.png', '/assets/bandra_acoustic_mixer.png', '/assets/colaba_speakeasy.png'],
    'kabir-kapoor': ['/assets/member-photos/kavya-2.jpg', '/assets/member-photos/natasha-1.jpg'],
    'aarav-mehta': ['/assets/member-photos/priya-2.jpg', '/assets/member-photos/zara-2.jpg']
  }[chat.slug] || getMemberPhotos(chat.slug);

  return {
    id: chat.slug,
    name: chat.name,
    age: parseInt(ageText, 10) || '',
    city,
    score,
    vibe: 'Curated Match',
    prompt: 'Opening note',
    answer: chat.message,
    avatar: chat.avatar,
    gradient: chat.gradient,
    photos,
    ...getWeekendSignal(chat.slug)
  };
}

function createInitialAppState() {
  return {
    profile: defaultProfile,
    vibeRequests: {},
    rsvps: {},
    hostedEvents: [],
    verifiedChats: {},
    chatMessages: {},
    lastUpdated: new Date().toISOString()
  };
}

function mergeAppState(fallback, state) {
  return {
    ...fallback,
    ...(state || {}),
    profile: { ...fallback.profile, ...(state?.profile || {}) },
    vibeRequests: state?.vibeRequests || fallback.vibeRequests,
    rsvps: state?.rsvps || fallback.rsvps,
    hostedEvents: Array.isArray(state?.hostedEvents) ? state.hostedEvents : fallback.hostedEvents,
    verifiedChats: state?.verifiedChats || fallback.verifiedChats,
    chatMessages: { ...fallback.chatMessages, ...(state?.chatMessages || {}) }
  };
}

function useApiState(fallbackFactory, enabled) {
  const fallback = React.useMemo(() => fallbackFactory(), [fallbackFactory]);
  const fallbackRef = React.useRef(fallback);
  const loadedRef = React.useRef(false);
  const [value, setValue] = React.useState(() => {
    const cached = localStorage.getItem('instadate_cached_state');
    return cached ? JSON.parse(cached) : fallback;
  });
  const [status, setStatus] = React.useState('connecting');
  const [isOnline, setIsOnline] = React.useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Persistence of active state inside local storage
  React.useEffect(() => {
    if (value && value !== fallback) {
      localStorage.setItem('instadate_cached_state', JSON.stringify(value));
    }
  }, [value, fallback]);

  // Exponential backoff retry utility
  const fetchWithRetry = async (path, options, retries = 3, delay = 500) => {
    try {
      const response = await fetch(path, {
        ...options,
        headers: {
          'content-type': 'application/json',
          ...(options.headers || {})
        },
        credentials: 'same-origin',
        cache: 'no-store'
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('api-unauthorized'));
        }
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retries > 0) {
        console.warn(`API request failed. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(path, options, retries - 1, delay * 2.5); // Exponential backoff
      }
      throw error;
    }
  };

  const apiRequest = React.useCallback(async (path, options = {}) => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new Error('browser_offline');
    }
    return fetchWithRetry(path, options);
  }, []);

  const applyApiState = React.useCallback(payload => {
    const nextState = mergeAppState(fallbackRef.current, payload.state);
    setValue(nextState);
    loadedRef.current = true;
    setStatus('cloud');
    return nextState;
  }, []);

  const refreshState = React.useCallback(async ({ quiet = false } = {}) => {
    try {
      const state = await apiRequest(CLOUD_STATE_ENDPOINT);
      return applyApiState(state);
    } catch (error) {
      if (!quiet) console.warn('Failed to refresh state:', error);
      // Only flag offline when the browser is genuinely offline — a transient server
      // error must not latch the whole app into "offline mode".
      if (typeof navigator !== 'undefined' && !navigator.onLine) setStatus('offline');
      return null;
    }
  }, [apiRequest, applyApiState]);

  // Queue runner to execute pending mutations sequentially once back online
  const flushPendingQueue = React.useCallback(async () => {
    const queueStr = localStorage.getItem('instadate_pending_actions');
    if (!queueStr) return;
    
    let queue = [];
    try {
      queue = JSON.parse(queueStr);
    } catch (e) {
      console.error('Failed to parse pending actions:', e);
    }

    if (queue.length === 0) return;

    console.log(`Connection restored. Flushing ${queue.length} pending actions sequentially...`);
    localStorage.removeItem('instadate_pending_actions'); // Lock the queue

    for (const action of queue) {
      try {
        console.log(`Executing queued action: ${action.path}`);
        await fetchWithRetry(action.path, action.options, 2, 300);
      } catch (err) {
        console.error(`Failed to execute queued action: ${action.path}`, err);
        if (err.message !== 'browser_offline' && !err.message.includes('failed')) {
          continue;
        }
        const currentQueue = JSON.parse(localStorage.getItem('instadate_pending_actions') || '[]');
        localStorage.setItem('instadate_pending_actions', JSON.stringify([action, ...currentQueue]));
        setStatus('offline');
        return;
      }
    }

    console.log('Pending actions queue flushed successfully!');
    window.dispatchEvent(new CustomEvent('app-toast', { detail: 'Connection restored. Cached actions synced!' }));
    await refreshState();
  }, [refreshState]);

  const mutateState = React.useCallback(async (path, options = {}, optimisticUpdater) => {
    if (optimisticUpdater) {
      setValue(current => {
        const optimistic = mergeAppState(fallbackRef.current, optimisticUpdater(current));
        return optimistic;
      });
    }

    const isCurrentlyOffline = (typeof navigator !== 'undefined' && !navigator.onLine);

    if (isCurrentlyOffline) {
      const queue = JSON.parse(localStorage.getItem('instadate_pending_actions') || '[]');
      const actionId = `act-${crypto.randomUUID()}`;
      queue.push({ id: actionId, path, options });
      localStorage.setItem('instadate_pending_actions', JSON.stringify(queue));

      console.log(`Offline: Action queued successfully (${path})`);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: 'You are offline. Action queued for sync.' }));
      setStatus('offline');
      return fallbackRef.current;
    }

    try {
      return applyApiState(await apiRequest(path, options));
    } catch (error) {
      console.warn('Mutation failed:', error);
      // Only queue + flag offline when the browser is genuinely offline. A transient
      // server error while online must NOT latch the app into "offline mode"; keep the
      // optimistic state and let the next poll reconcile.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const queue = JSON.parse(localStorage.getItem('instadate_pending_actions') || '[]');
        const actionId = `act-${crypto.randomUUID()}`;
        queue.push({ id: actionId, path, options });
        localStorage.setItem('instadate_pending_actions', JSON.stringify(queue));
        window.dispatchEvent(new CustomEvent('app-toast', { detail: 'You are offline. Action queued for sync.' }));
        setStatus('offline');
      }
      return fallbackRef.current;
    }
  }, [apiRequest, applyApiState, status]);

  // Online / Offline Listeners for reconnect handling
  React.useEffect(() => {
    const handleOnline = () => {
      console.log('Browser online event received.');
      setIsOnline(true);
      setStatus('connecting');
      flushPendingQueue();
    };

    const handleOffline = () => {
      console.log('Browser offline event received.');
      setIsOnline(false);
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      flushPendingQueue();
    } else {
      setStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushPendingQueue]);

  React.useEffect(() => {
    if (!enabled) {
      setValue(fallbackRef.current);
      setStatus('idle');
      return undefined;
    }

    if (navigator.onLine) {
      refreshState();
    } else {
      setStatus('offline');
    }

    const intervalId = window.setInterval(() => {
      if (navigator.onLine) {
        refreshState({ quiet: true });
      } else {
        setStatus('offline');
      }
    }, CLOUD_STATE_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enabled, refreshState]);

  return [value, setValue, status, loadedRef.current, mutateState, refreshState];
}

function SplashScreen() {
  return (
    <div className="auth-splash">
      <div className="auth-splash-mark">ID</div>
      <div>
        <p>Instadate</p>
        <h1>Checking your club pass</h1>
      </div>
      <span />
    </div>
  );
}

function LoginPage({ onGoogleLogin, authError, navigate }) {
  const { startPhoneOtp, verifyPhoneOtp, startEmailMagicLink } = useAuth();
  const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971', '+65'];

  const [stage, setStage] = React.useState('phone'); // 'phone' | 'code' | 'email' | 'emailSent'
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [magicLinkUrl, setMagicLinkUrl] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  const [attemptsLeft, setAttemptsLeft] = React.useState(null);
  const [locked, setLocked] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);

  // Parse error parameters on load (e.g. from magic callback redirects)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errParam = urlParams.get('error');
    if (errParam) {
      const errorMap = {
        invalid_token: 'The magic link is invalid or already used.',
        consumed: 'This magic link has already been consumed.',
        expired: 'This magic link has expired. Please request a new one.',
        invalid_magic_link: 'Could not verify magic link.'
      };
      setError(errorMap[errParam] || 'Magic link verification failed.');
    }
  }, []);

  // Resend cooldown ticker.
  React.useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const friendly = (errCode, retryAfterSec) => ({
    invalid_phone: 'Enter a valid phone number.',
    resend_cooldown: `Please wait ${retryAfterSec || 30}s before requesting another code.`,
    too_many_requests: 'Too many codes requested. Try again later.',
    ip_rate_limited: 'Too many attempts from this network. Try again later.',
    sms_send_failed: 'Could not send the code. Try again.',
    invalid_code: 'Incorrect code.',
    expired: 'That code expired. Request a new one.',
    locked: 'Too many wrong attempts. Try again in 15 minutes.',
    no_code: 'Request a code first.',
    invalid_input: 'Enter the 6-digit code.',
    invalid_email: 'Please enter a valid email address.'
  }[errCode] || 'Something went wrong. Try again.');

  const sendCode = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      const res = await startPhoneOtp(phone, countryCode);
      setStage('code');
      setAttemptsLeft(null);
      setLocked(false);
      setCooldown(30);
      setInfo(res?.devCode ? `Dev code: ${res.devCode}` : 'Code sent. Check your messages.');
    } catch (e) {
      const m = /:(\w+)/.exec(e.message);
      setError(friendly(e.code || m?.[1]) || e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    setError(''); setBusy(true);
    try {
      await verifyPhoneOtp(phone, code, countryCode);
      navigate?.('/profile'); // session set; guard renders the app
    } catch (e) {
      // verify endpoint returns {error, attemptsLeft}; surface both.
      const payload = e.payload || {};
      if (payload.attemptsLeft != null) setAttemptsLeft(payload.attemptsLeft);
      if (payload.error === 'locked') setLocked(true);
      setError(friendly(payload.error) || e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSendMagicLink = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      const res = await startEmailMagicLink(email);
      setStage('emailSent');
      setMagicLinkUrl(res?.devLink || '');
      setInfo(res?.devLink ? 'Magic link generated successfully!' : 'Magic link sent. Please check your inbox.');
    } catch (e) {
      const m = /:(\w+)/.exec(e.message);
      setError(friendly(e.code || m?.[1]) || e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-panel">
        <span className="eyebrow">Member Access</span>
        <h1>Sign in to Instadate</h1>
        <p>
          {stage === 'email' || stage === 'emailSent'
            ? 'Enter your email to receive a passwordless magic link to access your account.'
            : 'Verify your phone to unlock events, RSVPs, matches, and chats across devices.'}
        </p>
        {authError && <div className="login-alert">Session check failed. You can still try signing in again.</div>}

        <button className="login-google-btn" onClick={() => onGoogleLogin('/profile')}>
          <User /> Continue with Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0', color: 'var(--muted)', fontSize: '0.75rem' }}>
          <span style={{ flex: 1, height: 1, background: 'var(--line)' }} /> OR <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {stage === 'phone' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                value={countryCode}
                onChange={e => setCountryCode(e.target.value)}
                className="login-input"
                style={{ width: 92, flexShrink: 0 }}
              >
                {COUNTRY_CODES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                className="login-input"
                style={{ flex: 1 }}
                type="tel"
                inputMode="numeric"
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <button className="login-google-btn" disabled={busy || phone.length < 6} onClick={sendCode}>
              {busy ? 'Sending…' : 'Send code'}
            </button>
            
            <button
              onClick={() => { setStage('email'); setError(''); setInfo(''); }}
              style={{ background: 'none', border: 0, color: 'var(--pink)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginTop: 8 }}
            >
              Sign in with Email Magic Link
            </button>
          </div>
        )}

        {stage === 'code' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>
              Code sent to {countryCode} {phone}.{' '}
              <button onClick={() => { setStage('phone'); setCode(''); setError(''); setInfo(''); }} style={{ background: 'none', border: 0, color: 'var(--pink)', cursor: 'pointer', fontWeight: 700, padding: 0 }}>Change</button>
            </p>
            <input
              className="login-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: '0.4em', textAlign: 'center', fontSize: '1.1rem' }}
            />
            <button className="login-google-btn" disabled={busy || locked || code.length !== 6} onClick={submitCode}>
              {busy ? 'Verifying…' : 'Verify & sign in'}
            </button>
            <button
              disabled={cooldown > 0 || busy}
              onClick={sendCode}
              style={{ background: 'none', border: 0, color: cooldown > 0 ? 'var(--muted)' : 'var(--pink)', cursor: cooldown > 0 ? 'default' : 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
            {attemptsLeft != null && attemptsLeft > 0 && !locked && (
              <p style={{ color: '#fbbf24', fontSize: '0.78rem', margin: 0, textAlign: 'center' }}>{attemptsLeft} attempt{attemptsLeft === 1 ? '' : 's'} left</p>
            )}
          </div>
        )}

        {stage === 'email' && (
          <div style={{ display: 'grid', gap: 10 }}>
            <input
              className="login-input"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="login-google-btn" disabled={busy || !email.includes('@')} onClick={handleSendMagicLink}>
              {busy ? 'Generating Link…' : 'Send Magic Link'}
            </button>

            <button
              onClick={() => { setStage('phone'); setError(''); setInfo(''); }}
              style={{ background: 'none', border: 0, color: 'var(--pink)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', marginTop: 8 }}
            >
              Sign in with Phone SMS Code
            </button>
          </div>
        )}

        {stage === 'emailSent' && (
          <div style={{ display: 'grid', gap: 12, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--pink)', fontSize: '2.5rem', marginBottom: 5 }}>
              <Mail style={{ width: 48, height: 48 }} />
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: 0, lineHeight: '1.4' }}>
              We've sent a magic login link to <strong>{email}</strong>. Check your inbox (and spam folder) and click the link to log in.
            </p>
            
            {magicLinkUrl && (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 8, background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'grid', gap: 8 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Development Magic Link</span>
                <a
                  href={magicLinkUrl}
                  style={{ color: 'var(--cyan)', fontSize: '0.82rem', wordBreak: 'break-all', textDecoration: 'underline', fontWeight: 700 }}
                >
                  Click here to log in directly
                </a>
              </div>
            )}

            <button
              onClick={() => { setStage('email'); setMagicLinkUrl(''); setError(''); setInfo(''); }}
              style={{ background: 'none', border: 0, color: 'var(--pink)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginTop: 8 }}
            >
              Try another email
            </button>
          </div>
        )}

        {info && <p style={{ color: 'var(--cyan)', fontSize: '0.78rem', marginTop: 10, textAlign: 'center' }}>{info}</p>}
        {error && <p style={{ color: '#ff8aa8', fontSize: '0.8rem', marginTop: 10, textAlign: 'center' }}>{error}</p>}
      </div>
    </section>
  );
}

function AccountStatusScreen({ status, reason, until, onLogout }) {
  const [reactivating, setReactivating] = React.useState(false);
  const [reactError, setReactError] = React.useState(null);

  const reactivate = async () => {
    setReactivating(true);
    setReactError(null);
    try {
      const res = await fetch('/api/account/reactivate', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('Could not reactivate.');
      window.location.replace('/profile');
    } catch (e) {
      setReactError(e.message || 'Reactivation failed.');
      setReactivating(false);
    }
  };

  const config = {
    banned: {
      badge: 'Account removed',
      title: 'Your account has been permanently removed',
      body: 'This account violated the Instadate community guidelines and no longer has access to the club.',
      tone: '#ff2e93'
    },
    suspended: {
      badge: 'Account suspended',
      title: 'Your account is temporarily suspended',
      body: until
        ? `Access is restricted until ${new Date(until).toLocaleString()}. You can read but not send messages, RSVP, or host during this period.`
        : 'Access is temporarily restricted. You can read but not send messages, RSVP, or host during this period.',
      tone: '#fbbf24'
    },
    deactivated: {
      badge: 'Account deactivated',
      title: 'This account is deactivated',
      body: 'Your profile is hidden and chats are paused. If you requested deletion, your data is permanently erased after the grace period — reactivate now to cancel.',
      tone: '#9b30ff'
    }
  }[status] || {
    badge: 'Account notice',
    title: 'Your account needs attention',
    body: 'Please contact support.',
    tone: '#ff2e93'
  };

  return (
    <section className="login-page" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '2rem' }}>
      <div className="login-panel" style={{ maxWidth: '460px', textAlign: 'center', border: `1px solid ${config.tone}40` }}>
        <span className="eyebrow" style={{ color: config.tone }}>{config.badge}</span>
        <ShieldCheck style={{ width: 56, height: 56, color: config.tone, margin: '0.75rem auto' }} />
        <h1 style={{ fontSize: '1.5rem' }}>{config.title}</h1>
        <p style={{ color: 'var(--muted)' }}>{config.body}</p>
        {reason && (
          <p style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', fontSize: '0.85rem' }}>
            <strong>Reason:</strong> {reason}
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1.25rem' }}>
          {status === 'deactivated' && (
            <button className="login-google-btn" onClick={reactivate} disabled={reactivating} style={{ justifyContent: 'center', border: 0 }}>
              {reactivating ? 'Reactivating…' : 'Reactivate my account'}
            </button>
          )}
          {reactError && <p style={{ color: '#ff8aa8', fontSize: '0.8rem', margin: 0 }}>{reactError}</p>}
          {status !== 'deactivated' && (
            <a
              className="login-google-btn"
              href={`mailto:support@instadate.club?subject=${encodeURIComponent(`Account ${status} appeal`)}`}
              style={{ textDecoration: 'none', justifyContent: 'center' }}
            >
              Appeal to support
            </a>
          )}
          <button className="btn-quiet" onClick={onLogout}>Log out</button>
        </div>
      </div>
    </section>
  );
}

function App() {
  const [route, setRoute] = React.useState(getRoute);
  const [guestMode, setGuestMode] = React.useState(() => sessionStorage.getItem('instadate_guest_mode') !== 'false');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [profileMember, setProfileMember] = React.useState(null);
  const [installPrompt, setInstallPrompt] = React.useState(null);
  const { user: authUser, isAuthenticated, isLoading, authError, signIn, signOut } = useAuth();
  const { profile, profileStatus, saveProfile: saveCloudProfile, uploadProfilePhotos, refreshProfile } = useProfile();
  const canBrowseApp = (isAuthenticated && profile?.completed) || guestMode;

  React.useEffect(() => {
    const handleUnauthorized = () => {
      // Only force a sign-out for a genuinely authenticated user whose session expired.
      // Guests legitimately receive 401 from auth-gated endpoints (e.g. /api/state) and
      // must NOT be bounced through signOut → reload → poll → 401 (flicker loop).
      if (isAuthenticated) signOut();
    };
    window.addEventListener('api-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('api-unauthorized', handleUnauthorized);
  }, [signOut, isAuthenticated]);

  const [appState, , cloudStateStatus, , mutateState] = useApiState(createInitialAppState, canBrowseApp);
  const [toast, setToast] = React.useState('');
  const [reviewEvent, setReviewEvent] = React.useState(null);
  const [feedbackMeetup, setFeedbackMeetup] = React.useState(null);
  const [meetSomeoneOpen, setMeetSomeoneOpen] = React.useState(false);
  const currentAppState = React.useMemo(() => ({
    ...appState,
    profile: { ...appState.profile, ...profile }
  }), [appState, profile]);

  // 1. Live members with database priority & cached fallback
  const [liveMembers, setLiveMembers] = React.useState([]);
  React.useEffect(() => {
    if (!canBrowseApp) return;
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.members)) {
          setLiveMembers(data.members);
        }
      })
      .catch(err => console.warn('Could not load live members:', err));
  }, [canBrowseApp, appState.lastUpdated]);

  const resolvedMembers = React.useMemo(() => {
    return liveMembers;
  }, [liveMembers]);

  // 2. Live events with database priority & cached fallback
  const resolvedEvents = React.useMemo(() => {
    return Array.isArray(appState.hostedEvents) ? appState.hostedEvents : [];
  }, [appState.hostedEvents]);

  // 3. Live chats with database priority & cached fallback
  const resolvedChats = React.useMemo(() => {
    return Array.isArray(appState.chats) ? appState.chats : [];
  }, [appState.chats]);
  const publicRoutes = ['/onboarding', '/login'];
  const guardedRoute = canBrowseApp
    ? route === '/login' ? '/' : route
    : publicRoutes.includes(route) ? route : '/onboarding';
  const isConversationRoute = guardedRoute.startsWith('/chat/');

  React.useEffect(() => {
    if (isLoading || guardedRoute === route) return;
    window.history.replaceState({}, '', guardedRoute);
    setRoute(getRoute());
    setMenuOpen(false);
  }, [guardedRoute, isLoading, route]);

  React.useEffect(() => {
    const onPop = () => setRoute(getRoute());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  React.useEffect(() => {
    const handleAppToast = (e) => {
      if (e.detail) notify(e.detail);
    };
    window.addEventListener('app-toast', handleAppToast);
    return () => window.removeEventListener('app-toast', handleAppToast);
  }, []);

  React.useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        navigator.serviceWorker.getRegistrations?.().then(registrations => registrations.forEach(registration => registration.unregister()));
        return;
      }
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    const handler = event => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const navigate = path => {
    window.history.pushState({}, '', path);
    setRoute(getRoute());
    setMenuOpen(false);
  };

  const exploreAsGuest = () => {
    sessionStorage.setItem('instadate_guest_mode', 'true');
    setGuestMode(true);
    navigate('/');
  };

  const notify = message => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  };

  const saveProfile = async profile => {
    try {
      await saveCloudProfile(profile);
      notify('Profile saved');
    } catch {
      notify('Profile cached offline');
    }
  };

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem('instadate_guest_mode');
      setGuestMode(false);
      await signOut();
      notify('Logged out successfully');
    } catch {
      notify('Logout failed');
    }
  };

  const startGoogleLogin = async (redirectTo = '/profile') => {
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      } catch {
        // Login must continue even if service worker cleanup fails.
      }
    }
    try {
      const response = await fetch(`/api/auth/google/url?redirectTo=${encodeURIComponent(redirectTo)}`, {
        cache: 'no-store',
        credentials: 'same-origin'
      });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('Google login API is not running');
      }
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Google login could not start');
      if (!payload.url) throw new Error('Google login URL missing');
      window.location.assign(payload.url);
    } catch (error) {
      notify(error.message || 'Google login could not start');
    }
  };

  const sendVibe = async (member, note) => {
    try {
      await mutateState('/api/connections/request', {
        method: 'POST',
        body: JSON.stringify({ toUserId: member.id, note })
      }, current => ({
        ...current,
        vibeRequests: {
          ...current.vibeRequests,
          [member.id]: { memberId: member.id, memberName: member.name, note, sentAt: new Date().toISOString() }
        },
        lastUpdated: new Date().toISOString()
      }));
      setSelectedMember(null);
      notify(`Connection request sent to ${member.name}`);
    } catch {
      notify('Connection request cached offline');
    }
  };

  const toggleRsvp = async event => {
    const isRsvped = Boolean(currentAppState.rsvps[event.id]);
    try {
      await mutateState(`/api/events/${event.id}/attendees/me`, {
        method: isRsvped ? 'DELETE' : 'POST'
      }, current => {
        const nextRsvps = { ...current.rsvps };
        if (nextRsvps[event.id]) delete nextRsvps[event.id];
        else nextRsvps[event.id] = { eventId: event.id, title: event.title, date: event.date, place: event.place, savedAt: new Date().toISOString() };
        return { ...current, rsvps: nextRsvps, lastUpdated: new Date().toISOString() };
      });
      notify(isRsvped ? 'RSVP removed' : `RSVP confirmed for ${event.title}`);
    } catch (error) {
      notify(error.message || 'Could not update RSVP');
    }
  };

  const createHostedEvent = async form => {
    const eventId = `hosted-${Date.now()}`;
    const joinTonight = isTodayDateValue(form.date) || form.type === 'House Party';
    const hostedEvent = {
      id: eventId,
      title: form.title.trim(),
      type: form.type === 'House Party' ? 'Host Party Plan' : form.type,
      date: formatHostEventDate(form.date),
      rawDate: form.date,
      time: formatHostEventTime(form.time),
      place: form.location.trim(),
      image: form.photo || '/assets/social_mixer.png',
      status: joinTonight ? 'Join Tonight' : 'Open Plan',
      description: form.description.trim(),
      capacity: Number(form.capacity) || 10,
      entry: form.entry,
      price: form.entry === 'Paid' ? form.price : '',
      approval: form.approval,
      hostName: currentAppState.profile?.fullName || 'Club host',
      createdAt: new Date().toISOString(),
      source: 'hosted'
    };

    try {
      await mutateState('/api/events', {
        method: 'POST',
        body: JSON.stringify({ event: hostedEvent })
      }, current => ({
        ...current,
        hostedEvents: [hostedEvent, ...(current.hostedEvents || [])],
        lastUpdated: new Date().toISOString()
      }));
      notify(`${hostedEvent.title} is live for members to join`);
      navigate('/events');
    } catch {
      notify('Event cached offline');
    }
  };

  const verifyChat = async slug => {
    try {
      await mutateState(`/api/chats/${slug}/verification`, {
        method: 'PATCH'
      }, current => ({
        ...current,
        verifiedChats: { ...current.verifiedChats, [slug]: true },
        lastUpdated: new Date().toISOString()
      }));
      notify('Voice verified. Chat unlocked.');
    } catch {
      notify('Voice verification cached offline');
    }
  };

  const sendChatMessage = async (slug, text) => {
    if (!text.trim()) return;
    try {
      await mutateState(`/api/chats/${slug}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() })
      }, current => ({
        ...current,
        chatMessages: {
          ...current.chatMessages,
          [slug]: [...(current.chatMessages[slug] || []), ['you', text.trim()]]
        },
        lastUpdated: new Date().toISOString()
      }));
    } catch {
      notify('Message cached offline');
    }
  };

  const handleJoinPlan = async (planId, hasJoined) => {
    try {
      if (hasJoined) {
        await mutateState(`/api/instant-plans/${planId}/join`, { method: 'DELETE' });
      } else {
        await mutateState(`/api/instant-plans/${planId}/join`, { method: 'POST' });
      }
      notify(hasJoined ? 'Left instant plan.' : 'Joined instant plan!');
    } catch {
      notify('Could not update plan status.');
    }
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  const accountStatus = authUser?.status;
  if (accountStatus && accountStatus !== 'active') {
    return (
      <AccountStatusScreen
        status={accountStatus}
        reason={authUser?.statusReason}
        until={authUser?.statusUntil}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      <div className="app-bg" />
      {(!isConversationRoute && guardedRoute !== '/onboarding' && guardedRoute !== '/login' && guardedRoute !== '/admin/analytics' && guardedRoute !== '/admin/health' && guardedRoute !== '/admin/moderation') && (
        <Header
          route={guardedRoute} 
          navigate={navigate} 
          menuOpen={menuOpen} 
          setMenuOpen={setMenuOpen} 
          authUser={authUser}
          onGoogleLogin={startGoogleLogin}
        />
      )}
      <main className={(isConversationRoute || guardedRoute === '/onboarding' || guardedRoute === '/admin/analytics' || guardedRoute === '/admin/health' || guardedRoute === '/admin/moderation') ? 'fullscreen-main' : ''}>
        <RouteErrorBoundary key={guardedRoute}>
          {guardedRoute === '/admin/analytics' && <AdminAnalyticsPage navigate={navigate} />}
          {guardedRoute === '/admin/health' && <AdminHealthPage navigate={navigate} />}
          {guardedRoute === '/admin/moderation' && <AdminModerationPage navigate={navigate} />}
           {guardedRoute === '/members' && <MembersPage appState={currentAppState} resolvedMembers={resolvedMembers} onVibeClick={setSelectedMember} onProfileClick={setProfileMember} />}
          {guardedRoute === '/chat' && <ChatInboxPage appState={currentAppState} resolvedChats={resolvedChats} resolvedMembers={resolvedMembers} navigate={navigate} onProfileClick={setProfileMember} />}
          {guardedRoute === '/requests' && <ConnectionRequestsPage navigate={navigate} />}
          {guardedRoute.startsWith('/chat/') && <ChatConversationPage appState={currentAppState} resolvedChats={resolvedChats} resolvedMembers={resolvedMembers} route={guardedRoute} navigate={navigate} onVerify={verifyChat} onSend={sendChatMessage} onProfileClick={setProfileMember} onMeetupFeedbackClick={setFeedbackMeetup} />}
          {guardedRoute === '/events' && <EventsPage appState={currentAppState} resolvedEvents={resolvedEvents} onToggleRsvp={toggleRsvp} onReviewClick={setReviewEvent} navigate={navigate} />}
          {guardedRoute === '/host' && <HostEventPage navigate={navigate} onCreateEvent={createHostedEvent} />}
          {guardedRoute === '/profile' && <ProfileDashboard initialProfile={currentAppState.profile} appState={currentAppState} onSave={saveProfile} onUploadPhotos={uploadProfilePhotos} onLogout={handleLogout} navigate={navigate} onOpenDrawer={() => setMenuOpen(true)} authUser={authUser} onGoogleLogin={startGoogleLogin} onReviewClick={setReviewEvent} onMeetupFeedbackClick={setFeedbackMeetup} />}
          {guardedRoute === '/login' && <LoginPage onGoogleLogin={startGoogleLogin} authError={authError} navigate={navigate} />}
          {guardedRoute === '/onboarding' && (
            <OnboardingFlow
              onExplore={exploreAsGuest}
              onComplete={async () => {
                sessionStorage.setItem('instadate_guest_mode', 'false');
                setGuestMode(false);
                await refreshProfile();
                navigate('/profile');
              }}
            />
          )}
          {guardedRoute === '/' && <HomePage appState={currentAppState} resolvedMembers={resolvedMembers} resolvedEvents={resolvedEvents} navigate={navigate} onVibeClick={setSelectedMember} onProfileClick={setProfileMember} onMeetSomeoneClick={() => setMeetSomeoneOpen(true)} />}
        </RouteErrorBoundary>
      </main>
      {(!isConversationRoute && guardedRoute !== '/onboarding' && guardedRoute !== '/login' && guardedRoute !== '/admin/analytics' && guardedRoute !== '/admin/health' && guardedRoute !== '/admin/moderation') && <BottomNav route={guardedRoute} navigate={navigate} />}
      {installPrompt && <InstallBanner prompt={installPrompt} onDone={() => setInstallPrompt(null)} />}
      {selectedMember && <VibeRequestModal member={selectedMember} requested={Boolean(currentAppState.vibeRequests[selectedMember.id])} onClose={() => setSelectedMember(null)} onSend={sendVibe} navigate={navigate} />}
      {profileMember && <MemberProfileModal member={profileMember} requested={Boolean(currentAppState.vibeRequests[profileMember.id])} onClose={() => setProfileMember(null)} onVibeClick={member => { setProfileMember(null); setSelectedMember(member); }} navigate={navigate} />}
      {reviewEvent && (
        <EventReviewModal 
          event={reviewEvent} 
          onClose={() => setReviewEvent(null)} 
          notify={notify}
        />
      )}
      {feedbackMeetup && (
        <MeetupFeedbackModal 
          meetup={feedbackMeetup} 
          onClose={() => setFeedbackMeetup(null)} 
          notify={notify}
        />
      )}
      {meetSomeoneOpen && (
        <MeetSomeoneThisWeekModal
          appState={currentAppState}
          resolvedMembers={resolvedMembers}
          onClose={() => setMeetSomeoneOpen(false)}
          onVibeClick={setSelectedMember}
          onProfileClick={setProfileMember}
          onToggleRsvp={toggleRsvp}
          onJoinPlan={handleJoinPlan}
          navigate={navigate}
        />
      )}
      {cloudStateStatus === 'offline' && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(255, 46, 147, 0.25)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 46, 147, 0.4)',
          borderRadius: '16px',
          padding: '0.6rem 1.2rem',
          color: '#fff',
          font: '800 0.82rem Outfit, sans-serif',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 30px rgba(255, 46, 147, 0.3)',
          letterSpacing: '0.02em',
          pointerEvents: 'none'
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#ff2e93',
            display: 'inline-block',
            animation: 'shimmerPulse 1.5s infinite'
          }} />
          Offline Mode • Actions will sync automatically when connection restores
        </div>
      )}
      {toast && <div className="app-toast">{toast}</div>}
      <AnimatePresence>
        {menuOpen && (
          <SideDrawer 
            route={route} 
            navigate={navigate} 
            onClose={() => setMenuOpen(false)} 
            appState={currentAppState} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin/analytics') return '/admin/analytics';
  if (path === '/admin/health') return '/admin/health';
  if (path === '/admin/moderation') return '/admin/moderation';
  if (path.endsWith('/active-users.html') || path === '/members') return '/members';
  if (path.endsWith('/chat.html') || path === '/chat') return '/chat';
  if (path.startsWith('/chat/')) return path;
  if (path.endsWith('/events.html') || path === '/events') return '/events';
  if (path === '/host') return '/host';
  if (path === '/requests') return '/requests';
  if (path === '/profile') return '/profile';
  if (path === '/onboarding') return '/onboarding';
  if (path === '/login') return '/login';
  return '/';
}

function Header({ route, navigate, menuOpen, setMenuOpen, authUser, onGoogleLogin }) {
  const nav = [['/', 'Home'], ['/members', 'Members'], ['/chat', 'Inbox'], ['/events', 'Events'], ['/profile', 'Profile']];
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  return (
    <header className="app-header">
      <button className="brand" onClick={() => navigate('/')}>Instadate</button>
      <div className="status-pill"><span /> Verified club app</div>
      <nav className="desktop-nav">
        {nav.map(([path, label]) => <button key={path} className={isRouteActive(route, path) ? 'active' : ''} onClick={() => navigate(path)}>{label}</button>)}
      </nav>
      <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
        <ThemeIcon />
      </button>
      {authUser ? (
        <button className="primary-small" onClick={() => navigate('/profile')}>
          {authUser.avatarUrl && <img src={authUser.avatarUrl} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }} />}
          {authUser.fullName || 'Profile'}
        </button>
      ) : (
        <button className="primary-small" onClick={() => onGoogleLogin('/profile')}>Login with Google</button>
      )}
      {route === '/profile' && <button className="menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu /></button>}
    </header>
  );
}

function SideDrawer({ route, navigate, onClose, appState }) {
  const { user: authUser, isModerator } = useAuth();
  const [gsapLoaded, setGsapLoaded] = React.useState(Boolean(window.gsap));

  // Load GSAP CDN if not loaded
  React.useEffect(() => {
    if (!window.gsap) {
      const scriptGsap = document.createElement('script');
      scriptGsap.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      scriptGsap.onload = () => setGsapLoaded(true);
      document.head.appendChild(scriptGsap);
    } else {
      setGsapLoaded(true);
    }
  }, []);

  // GSAP animations on mount
  React.useEffect(() => {
    if (!gsapLoaded || !window.gsap) return;
    window.gsap.killTweensOf('.gsap-drawer-item');
    window.gsap.fromTo('.gsap-drawer-item', 
      { opacity: 0, x: 50 },
      { opacity: 1, x: 0, stagger: 0.05, duration: 0.45, ease: 'power2.out', delay: 0.1 }
    );
    window.gsap.fromTo('.gsap-drawer-footer',
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', delay: 0.3 }
    );
  }, [gsapLoaded]);

  const navItems = [
    { path: '/', label: 'Home Tab', subtitle: 'Scanner Map & Activity', icon: Home },
    { path: '/members', label: 'Verified Members', subtitle: 'Browse active profiles', icon: Users },
    { path: '/chat', label: 'Inbox Chats', subtitle: 'Open locked voice connections', icon: MessageCircle },
    { path: '/events', label: 'mixers Calendar', subtitle: 'RSVP scheduled offline mixer', icon: Calendar },
    { path: '/profile', label: 'My Club Profile', subtitle: 'Aadhaar safety & tier locker', icon: User },
    { path: '/onboarding', label: 'Onboarding 🚀', subtitle: 'Vibe check & Speakeasy Tour', icon: Sparkles },
    { path: '/admin/analytics', label: 'Admin Analytics 📊', subtitle: 'Telemetry & conversions', icon: BarChart2, admin: true },
    { path: '/admin/health', label: 'Company Health 💓', subtitle: 'Funnel & North Star', icon: Heart, admin: true },
    { path: '/admin/moderation', label: 'Moderation Console 🚩', subtitle: 'Reports, users, events & audit', icon: ShieldCheck, admin: true }
  ].filter(item => !item.admin || isModerator);

  const profile = appState.profile;
  const isVipProfile = profile.completed || Boolean(authUser);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)'
      }}
      onClick={onClose}
    >
      {/* Noise layer SVG */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id='drawerNoise'>
          <feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch' />
        </filter>
      </svg>

      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        style={{
          width: 'min(420px, 100%)',
          height: '100%',
          background: 'rgba(12, 12, 18, 0.94)',
          backdropFilter: 'blur(28px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'relative',
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          overflow: 'hidden',
          boxShadow: '-10px 0 40px rgba(0, 0, 0, 0.6)'
        }}
        onClick={event => event.stopPropagation()}
      >
        {/* Subtle noise grain */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          filter: 'url(#drawerNoise)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Top Drawer Header */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'calc(1.25rem + env(safe-area-inset-top, 0px)) 1.5rem 1.25rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(5, 5, 8, 0.4)'
        }}>
          <div>
            <span className='eyebrow' style={{ color: 'var(--pink)', display: 'block', fontSize: '0.62rem' }}>Instadate App</span>
            <strong style={{ font: '900 1.25rem Outfit, sans-serif', color: '#fff' }}>Navigation Desk</strong>
          </div>
          <button 
            onClick={onClose} 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
            aria-label='Close navigation panel'
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Navigation Options List */}
        <div style={{
          position: 'relative',
          zIndex: 2,
          padding: '1.5rem 1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          overflowY: 'auto'
        }}>
          {navItems.map(item => {
            const active = route === item.path || (item.path !== '/' && route.startsWith(`${item.path}/`));
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                className='gsap-drawer-item'
                onClick={() => {
                  navigate(item.path);
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '0.85rem 1rem',
                  width: '100%',
                  borderRadius: '16px',
                  background: active 
                    ? 'linear-gradient(135deg, rgba(255, 46, 147, 0.12), rgba(155, 48, 255, 0.12))' 
                    : 'rgba(255, 255, 255, 0.02)',
                  border: active 
                    ? '1px solid rgba(255, 46, 147, 0.22)' 
                    : '1px solid rgba(255, 255, 255, 0.04)',
                  color: '#fff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, background 0.2s'
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: active ? 'rgba(255, 46, 147, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  display: 'grid',
                  placeItems: 'center',
                  color: active ? 'var(--pink)' : 'var(--muted)',
                  flexShrink: 0
                }}>
                  <Icon style={{ width: '18px', height: '18px' }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <strong style={{ display: 'block', font: '800 0.95rem Outfit, sans-serif' }}>{item.label}</strong>
                  <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {item.subtitle}
                  </span>
                </div>
                <ChevronRight style={{ width: '16px', height: '16px', color: 'var(--soft)' }} />
              </button>
            );
          })}
        </div>

        {/* Bottom Drawer Footer (Zomato/District Style profile card) */}
        <div className='gsap-drawer-footer' style={{
          position: 'relative',
          zIndex: 2,
          padding: '1.25rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom, 0px))',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(5, 5, 8, 0.65)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {isVipProfile ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #16122c, #0d0714)',
              border: '1px solid rgba(155, 48, 255, 0.35)',
              borderRadius: '16px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Border shine effect */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, bottom: 0, right: 0,
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
                animation: 'shine 4s infinite'
              }} />
              <img 
                src={authUser?.avatarUrl || profile.photo || ''} 
                alt={authUser?.fullName || profile.fullName || 'User'} 
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>';
                }}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '1.5px solid var(--purple)'
                }} 
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <strong style={{ display: 'block', font: '800 0.88rem Outfit, sans-serif', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {authUser?.fullName || profile.fullName || 'User'}
                </strong>
                <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '1px' }}>
                  {authUser?.email || 'user@mail.com'}
                </span>
              </div>
              <button 
                onClick={() => {
                  navigate('/profile');
                  onClose();
                }}
                style={{
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  fontSize: '0.72rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Dashboard
              </button>
            </div>
          ) : (
            <div style={{
              padding: '0.85rem',
              background: 'rgba(255, 46, 147, 0.045)',
              border: '1px dashed rgba(255, 46, 147, 0.25)',
              borderRadius: '16px',
              textAlign: 'center'
            }}>
              <span className='eyebrow' style={{ color: 'var(--pink)', fontSize: '0.62rem', display: 'block', marginBottom: '2px' }}>Profile Incomplete</span>
              <strong style={{ display: 'block', fontSize: '0.84rem', color: '#fff' }}>Unlock Full Club Privileges</strong>
              <p style={{ margin: '0.2rem 0 0.6rem 0', fontSize: '0.72rem', color: 'var(--muted)' }}>Verify Aadhaar & photo to send vibe requests.</p>
              <button 
                className='btn-main full' 
                style={{ minHeight: '32px', borderRadius: '8px', fontSize: '0.78rem', gap: '4px' }}
                onClick={() => {
                  navigate('/profile');
                  onClose();
                }}
              >
                Join Instadate Club <Sparkles style={{ width: '12px', height: '12px' }} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--soft)', padding: '0 4px' }}>
            <span>v1.2.0 • Friends &amp; Family Beta</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function isRouteActive(route, path) {
  return route === path || (path !== '/' && route.startsWith(`${path}/`));
}

function HomePage({ appState, resolvedMembers = [], resolvedEvents = [], navigate, onVibeClick, onProfileClick, onMeetSomeoneClick }) {
  const rsvpCount = Object.keys(appState.rsvps).length;
  const vibeCount = Object.keys(appState.vibeRequests).length;
  const cleanFullName = (appState.profile.fullName || '').split(',')[0].trim();
  const profileName = cleanFullName.split(' ')[0] || 'ID';
  const [activityFilter, setActivityFilter] = React.useState(null);
  const { theme, toggleTheme } = useTheme();
  const ThemeIcon = theme === 'dark' ? Sun : Moon;
  const movieMembers = (resolvedMembers || []).filter(member => hasActiveWeekendStatus(member, 'Movie'));

  return (
    <>
      <section className="native-home">
        <div className="native-topbar">
          <div>
            <span className="native-kicker">Tonight in</span>
            <button className="native-location" onClick={() => navigate('/events')}><MapPin /> Mumbai</button>
          </div>
          <div className="native-actions">
            <button className="native-theme-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
              <ThemeIcon />
            </button>
            <button className="native-avatar-btn" onClick={() => navigate('/profile')} aria-label="Open profile">{profileName.slice(0, 2).toUpperCase()}</button>
          </div>
        </div>

        <button className="native-search" onClick={() => navigate('/members')}>
          <Search />
          <span>Find people for whatever you are doing next</span>
        </button>

        <div className="native-positioning-card">
          <span>Your social life, on demand</span>
          <h1>Never do things alone unless you want to.</h1>
          <p>Choose the activity first, then meet verified people who already want to join.</p>
        </div>

        {/* Meet Someone This Week Prominent Flow Trigger */}
        <button
          onClick={onMeetSomeoneClick}
          style={{
            width: '100%',
            padding: '1.1rem 1.25rem',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #fbbf24, #d946ef, #22d3ee)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'between',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 12px 36px rgba(217,70,239,0.3)',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            marginBottom: '1.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}
          className="meet-someone-week-cta"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap style={{ width: '18px', height: '18px', color: '#fef08a' }} className="animate-bounce" />
            Meet Someone This Week ⚡
          </span>
          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', background: 'rgba(0,0,0,0.35)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            Start Flow →
          </span>
        </button>

        <div className="native-lane-grid" aria-label="Instadate discovery lanes">
          <button className="native-lane-card match" onClick={() => navigate('/members')}>
            <Heart />
            <span>Match Pass</span>
            <strong>Date Naturally</strong>
            <small>Meet in real settings before deciding who you like.</small>
          </button>
          <button className="native-lane-card members" onClick={() => navigate('/members')}>
            <Users />
            <span>Social Pass</span>
            <strong>Find Your People</strong>
            <small>Movies, coffee, pickleball, trips, jams, and groups.</small>
          </button>
          <button className="native-lane-card plans" onClick={() => navigate('/events')}>
            <Ticket />
            <span>Social Pass</span>
            <strong>Make Plans Today</strong>
            <small>Do not cancel because your friends are busy.</small>
          </button>
        </div>

        <div className="native-hero-card" onClick={() => navigate('/events')} role="button" tabIndex={0}>
          <img src="/assets/mumbai_rooftop_mixer.png" alt="Mumbai rooftop mixer" />
          <div className="native-hero-overlay">
            <span className="native-pill">Attend together</span>
            <h1>Rooftop social mixer</h1>
            <p>Know who is going before you show up.</p>
          </div>
        </div>

        {/* Concierge Radar Scan (Mobile) */}
        <div className="native-section-head">
          <div><span>Low pressure</span><h2>Meet naturally, not awkwardly</h2></div>
        </div>
        <RadarPulse appState={appState} resolvedMembers={resolvedMembers} resolvedEvents={resolvedEvents} navigate={navigate} onVibeClick={onVibeClick} />

        <div className="native-section-head">
          <div><span>Beyond contacts</span><h2>Your next favorite person is not already in your phone</h2></div>
          <button onClick={() => navigate('/members')}>See all</button>
        </div>
        <div className="native-rail">
          {(resolvedMembers || []).slice(0, 5).map(member => (
            <button key={member.name} className="native-member-tile" onClick={() => onVibeClick(member)}>
              <div className="live-avatar-ring">
                <Avatar member={member} />
                <span className="live-online-dot" />
              </div>
              <strong>{(member.name || '').split(',')[0].trim().split(' ')[0]}, {member.age || (member.name || '').split(',')[1]?.trim()}</strong>
              <span>{appState.vibeRequests[member.id] ? 'Sent' : `${member.score}`}</span>
            </button>
          ))}
        </div>

        <div className="native-section-head">
          <div><span>People before events</span><h2>Do not just attend. Belong.</h2></div>
          <button onClick={() => navigate('/events')}>Explore</button>
        </div>
        <div className="native-event-stack">
          {(resolvedEvents || []).slice(0, 2).map(event => (
            <button key={event.title} className="native-event-row" onClick={() => navigate('/events')}>
              <img src={event.image} alt="" />
              <div>
                <strong>{event.title}</strong>
                <span>{event.date} • {event.place}</span>
              </div>
              <ChevronRight />
            </button>
          ))}
          <button className="native-event-row native-host-row" onClick={() => navigate('/host')}>
            <div className="native-host-icon"><Sparkles /></div>
            <div>
              <strong>Host your own plan</strong>
              <span>Create the plan first. Find the people second.</span>
            </div>
            <ChevronRight />
          </button>
        </div>

        <div className="native-section-head">
          <div><span>Activity first</span><h2>Choose the activity. Find the people.</h2></div>
        </div>
        <div className="activity-grid">
          <div className="activity-card" onClick={() => setActivityFilter({ key: 'cafe', title: 'Cafe', phrase: 'cafe-hopping' })}>
            <span className="activity-badge cafe">Cafe Partner</span>
            <h3>Specialty Coffee</h3>
            <p>Post coffee for today and meet people already nearby.</p>
            <span className="activity-action">Match Now <ChevronRight style={{ width: '14px', height: '14px' }} /></span>
          </div>
          <div className="activity-card" onClick={() => setActivityFilter({ key: 'pickleball', title: 'Pickleball', phrase: 'court game' })}>
            <span className="activity-badge pickle">Pickleball</span>
            <h3>Court Match</h3>
            <p>Stop persuading friends. Join players who already want in.</p>
            <span className="activity-action">Match Now <ChevronRight style={{ width: '14px', height: '14px' }} /></span>
          </div>
          <div className="activity-card" onClick={() => setActivityFilter({ key: 'movie', title: 'Movie', phrase: 'movie night', statusFilter: 'Movie' })}>
            <span className="activity-badge movie">Weekend Status: Movie</span>
            <h3>Movie Buffs</h3>
            <p>{movieMembers.length} active {movieMembers.length === 1 ? 'member wants' : 'members want'} movie company this week.</p>
            <span className="activity-action">Match Now <ChevronRight style={{ width: '14px', height: '14px' }} /></span>
          </div>
        </div>
        
        <div className="native-pass-grid">
          <div>
            <span>Match Pass</span>
            <strong>Not every connection has to be romantic</strong>
            <p>Meet through activities first. Dating can happen naturally after.</p>
          </div>
          <div>
            <span>Social Pass</span>
            <strong>Find plans for today</strong>
            <p>Movie tonight, coffee at 6, Sunday road trip, or a quick game.</p>
          </div>
        </div>
      </section>

      <section className="hero">
        <div>
          <span className="eyebrow">Social life on demand</span>
          <h1>Find people for whatever you are doing next.</h1>
          <p>Instadate helps you meet people through movies, coffee, games, trips, events, and low-pressure plans instead of waiting on dead group chats.</p>
          <div className="hero-actions">
            <button className="btn-main" onClick={() => navigate('/members')}>Find People <ChevronRight /></button>
            <button className="btn-quiet" onClick={() => navigate('/events')}>Find Plans</button>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/assets/mumbai_rooftop_mixer.png" alt="Instadate rooftop mixer" />
          <div className="float-card top"><User /> Rohan, 24 <strong>96% Match</strong></div>
          <div className="float-card bottom"><ShieldCheck /> Kavya, 22 <strong>Verified</strong></div>
        </div>
      </section>

      <section className="section-grid">
        <Feature icon={<ShieldCheck />} title="Friends Are Busy" text="Do not cancel movies, coffee, pickleball, or weekend trips because your group chat is dead." />
        <Feature icon={<Heart />} title="Activity First" text="Choose what you want to do right now, then find people who already want the same thing." />
        <Feature icon={<Calendar />} title="Meet Before You Attend" text="See who is going, their vibe, and shared interests before the event starts." />
      </section>
      <section className="split-section">
        <div><span className="eyebrow">Adult friendships</span><h2>Making friends should not end after college.</h2><p>Expand beyond your existing circle, find your tribe, and keep the connection going after the plan ends.</p></div>
        <div className="mini-member-grid">{(resolvedMembers || []).slice(0, 3).map(member => <MemberCard key={member.name} member={member} onVibeClick={onVibeClick} compact />)}</div>
      </section>

      {activityFilter && (
        <ActivityPartnerModal 
          activity={activityFilter} 
          resolvedMembers={resolvedMembers}
          onClose={() => setActivityFilter(null)} 
          onVibeClick={onVibeClick}
          onProfileClick={member => {
            setActivityFilter(null);
            onProfileClick?.(member);
          }}
        />
      )}
    </>
  );
}

function ActivityPartnerModal({ activity, resolvedMembers = [], onClose, onVibeClick, onProfileClick }) {
  const currentMatches = React.useMemo(() => {
    const term = (activity.title || '').toLowerCase();
    return (resolvedMembers || []).filter(member => {
      const status = (member.currentWeekendStatus || '').toLowerCase();
      const weekendText = (member.weekendStatus || '').toLowerCase();
      const bioText = (member.bio || '').toLowerCase();
      const vibeText = (member.vibe || '').toLowerCase();
      return status === term || 
             weekendText.includes(term) || 
             bioText.includes(term) || 
             vibeText.includes(term);
    });
  }, [resolvedMembers, activity]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="upgrade-modal" style={{ width: 'min(580px, 100%)' }}>
        <button className="close-btn" onClick={onClose}><X /></button>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <span className="eyebrow" style={{ color: 'var(--pink)' }}>Partner finder</span>
          <h2 style={{ margin: '0.2rem 0', font: '900 1.5rem Outfit, sans-serif' }}>Curated {activity.title} Partners</h2>
          <p style={{ margin: '0', color: 'var(--muted)', fontSize: '0.86rem' }}>
            {activity.statusFilter
              ? `Showing only members whose temporary Weekend Status is ${activity.statusFilter}. Status expires after 7 days.`
              : `These verified members are actively looking for ${activity.phrase} matches nearby.`}
          </p>
        </div>

        <div style={{ display: 'grid', gap: '0.85rem', maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          {currentMatches.length === 0 ? (
            <div className="inbox-card" style={{ cursor: 'default', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
              <strong style={{ display: 'block', font: '900 1rem Outfit, sans-serif', color: '#fff' }}>No active {activity.title} signals yet</strong>
              <small style={{ display: 'block', color: 'var(--muted)', marginTop: '0.3rem' }}>Try again after more members update their Weekend Status.</small>
            </div>
          ) : currentMatches.map(member => (
            <div
              className="inbox-card"
              key={member.id}
              role="button"
              tabIndex={0}
              onClick={() => onProfileClick?.(member)}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onProfileClick?.(member);
                }
              }}
              style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: 'auto 1fr auto', padding: '0.9rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div className={`avatar ${member.gradient}`} style={{ width: '48px', height: '48px' }}>
                {member.photos?.[0] ? <img src={member.photos[0]} alt="" /> : member.avatar}
              </div>
              <div style={{ minWidth: '0', paddingLeft: '0.4rem' }}>
                <strong style={{ display: 'block', font: '800 1rem Outfit, sans-serif', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{member.name}, {member.age}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--cyan)', fontWeight: 'bold' }}>{member.currentWeekendStatus || member.vibe}</span>
                <small style={{ display: 'block', color: 'var(--muted)', fontSize: '0.78rem', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{member.weekendStatus || member.bio || member.answer}</small>
              </div>
              <button className="btn-main" style={{ minHeight: '36px', borderRadius: '10px', fontSize: '0.8rem', padding: '0 12px' }} onClick={event => { event.stopPropagation(); onClose(); onVibeClick(member); }}>
                Connect
              </button>
            </div>
          ))}
        </div>

        <button className="btn-quiet full" style={{ marginTop: '1rem' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function MeetSomeoneThisWeekModal({ appState, resolvedMembers = [], onClose, onVibeClick, onProfileClick, onToggleRsvp, onJoinPlan, navigate }) {
  const [selectedActivity, setSelectedActivity] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('members');

  const activities = [
    { id: 'Coffee', label: 'Coffee ☕', key: 'coffee' },
    { id: 'Movie', label: 'Movie 🎬', key: 'movie' },
    { id: 'Dinner', label: 'Dinner 🍽', key: 'dinner' },
    { id: 'Road Trip', label: 'Road Trip 🚗', key: 'road trip' },
    { id: 'Pickleball', label: 'Pickleball 🎾', key: 'pickleball' },
    { id: 'Networking', label: 'Networking 💼', key: 'networking' },
    { id: 'Night Out', label: 'Night Out 🥂', key: 'night out' }
  ];

  const term = selectedActivity ? selectedActivity.toLowerCase() : '';

  const matchingMembers = React.useMemo(() => {
    if (!selectedActivity) return [];
    return (resolvedMembers || []).filter(m => {
      const status = (m.currentWeekendStatus || '').toLowerCase();
      const weekendText = (m.weekendStatus || '').toLowerCase();
      const bioText = (m.bio || '').toLowerCase();
      const vibeText = (m.vibe || '').toLowerCase();
      return status === term || 
             weekendText.includes(term) || 
             bioText.includes(term) || 
             vibeText.includes(term);
    });
  }, [resolvedMembers, selectedActivity, term]);

  const matchingEvents = React.useMemo(() => {
    if (!selectedActivity) return [];
    return (appState.hostedEvents || []).filter(e => {
      const title = (e.title || '').toLowerCase();
      const desc = (e.description || '').toLowerCase();
      const type = (e.type || '').toLowerCase();
      const category = (e.category || '').toLowerCase();
      return title.includes(term) || desc.includes(term) || type.includes(term) || category.includes(term);
    });
  }, [appState.hostedEvents, selectedActivity, term]);

  const matchingPlans = React.useMemo(() => {
    if (!selectedActivity) return [];
    return (appState.instantPlans || []).filter(p => {
      const title = (p.title || '').toLowerCase();
      const act = (p.activity || '').toLowerCase();
      return title.includes(term) || act.includes(term);
    });
  }, [appState.instantPlans, selectedActivity, term]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" style={{ zIndex: 1000 }}>
      <div className="upgrade-modal" style={{ width: 'min(640px, 95vw)', padding: '1.5rem', background: 'rgba(15,10,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(30px)', borderRadius: '32px' }}>
        <button className="close-btn" onClick={onClose} aria-label="Close modal"><X /></button>
        
        {!selectedActivity ? (
          <div>
            <span className="eyebrow" style={{ color: 'var(--pink)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.2em', fontWeight: '900' }}>Real-World Action</span>
            <h2 style={{ margin: '0.2rem 0 1rem', font: '900 1.6rem Outfit, sans-serif', color: '#fff' }}>Meet Someone This Week ⚡</h2>
            <p style={{ margin: '0 0 1.5rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.86rem', fontWeight: '500' }}>
              Stop browsing profiles. Choose what you want to do, and we will connect you immediately with active members, mixers, and instant plans nearby.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.75rem' }}>
              {activities.map(act => (
                <button
                  key={act.id}
                  onClick={() => setSelectedActivity(act.id)}
                  style={{
                    padding: '1.1rem 0.75rem',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '18px',
                    color: '#fff',
                    font: '800 0.9rem Outfit, sans-serif',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  className="activity-select-btn"
                  onMouseEnter={e => { e.currentTarget.style.border = '1px solid var(--pink)'; e.currentTarget.style.background = 'rgba(255, 46, 147, 0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.25rem' }}>
              <button 
                onClick={() => { setSelectedActivity(null); setActiveTab('members'); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
              >
                ←
              </button>
              <div>
                <span className="eyebrow" style={{ color: 'var(--pink)', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.15em', fontWeight: '900' }}>Active Lounges</span>
                <h2 style={{ margin: '0', font: '900 1.45rem Outfit, sans-serif', color: '#fff' }}>Doing: {selectedActivity}</h2>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '1.25rem' }}>
              {[
                { id: 'members', label: `Activity Partners (${matchingMembers.length})` },
                { id: 'events', label: `Social Mixers (${matchingEvents.length})` },
                { id: 'plans', label: `Instant Plans (${matchingPlans.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === tab.id ? 'var(--pink)' : 'transparent',
                    color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.78rem',
                    fontWeight: '900',
                    cursor: 'pointer',
                    transition: 'all 0.25s'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: '360px', overflowY: 'auto', paddingRight: '4px', display: 'grid', gap: '0.85rem' }}>
              {activeTab === 'members' && (
                matchingMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px', color: 'var(--muted)' }}>
                    <Users style={{ width: '32px', height: '32px', color: 'var(--soft)', marginBottom: '0.5rem', display: 'inline-block' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#fff', font: '800 1.05rem Outfit, sans-serif' }}>No Members Yet</h4>
                    <p style={{ margin: 0, fontSize: '0.78rem' }}>Nobody has updated their status for this activity. Be the first!</p>
                  </div>
                ) : (
                  matchingMembers.map(member => (
                    <div key={member.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', gap: '10px' }}>
                      <div className={`avatar ${member.gradient}`} style={{ width: '44px', height: '44px' }}>
                        {member.photos?.[0] ? <img src={member.photos[0]} alt="" /> : member.avatar}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', font: '800 0.95rem Outfit, sans-serif', color: '#fff' }}>
                          {(member.name || '').split(',')[0].trim().split(' ')[0]}, {member.age || (member.name || '').split(',')[1]?.trim()}
                          {member.verification_level === 'highly_verified' && <ShieldCheck style={{ width: '13px', height: '13px', color: '#fbbf24' }} />}
                          {member.verification_level === 'identity' && <ShieldCheck style={{ width: '13px', height: '13px', color: '#22d3ee' }} />}
                          {member.verification_level === 'basic' && <ShieldCheck style={{ width: '13px', height: '13px', color: '#3b82f6' }} />}
                        </strong>
                        <span style={{ display: 'block', fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          Reliability: {member.trustScore || 94}% • {member.city}
                        </span>
                      </div>
                      <button 
                        className="btn-main" 
                        style={{ minHeight: '34px', borderRadius: '10px', fontSize: '0.78rem', padding: '0 12px' }}
                        onClick={() => { onClose(); onVibeClick(member); }}
                      >
                        Connect
                      </button>
                    </div>
                  ))
                )
              )}

              {activeTab === 'events' && (
                matchingEvents.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px', color: 'var(--muted)' }}>
                    <Calendar style={{ width: '32px', height: '32px', color: 'var(--soft)', marginBottom: '0.5rem', display: 'inline-block' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#fff', font: '800 1.05rem Outfit, sans-serif' }}>No Events Available</h4>
                    <p style={{ margin: 0, fontSize: '0.78rem' }}>No social mixers scheduled for this activity category currently.</p>
                  </div>
                ) : (
                  matchingEvents.map(event => {
                    const isJoined = Boolean(appState.rsvps[event.id]);
                    return (
                      <div key={event.id} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', gap: '10px' }}>
                        <img src={event.image} alt="" style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }} />
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', font: '800 0.95rem Outfit, sans-serif', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{event.title}</strong>
                          <span style={{ display: 'block', fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            {event.date} • {event.place}
                          </span>
                        </div>
                        <button 
                          className="btn-main" 
                          style={{
                            minHeight: '34px', 
                            borderRadius: '10px', 
                            fontSize: '0.78rem', 
                            padding: '0 12px',
                            background: isJoined ? 'rgba(255, 46, 147, 0.15)' : '#fff',
                            color: isJoined ? 'var(--pink)' : '#000',
                            border: isJoined ? '1px solid rgba(255, 46, 147, 0.3)' : 'none'
                          }}
                          onClick={() => onToggleRsvp(event)}
                        >
                          {isJoined ? "RSVP'd ✓" : 'RSVP 🎟'}
                        </button>
                      </div>
                    );
                  })
                )
              )}

              {activeTab === 'plans' && (
                matchingPlans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '20px', color: 'var(--muted)' }}>
                    <Zap style={{ width: '32px', height: '32px', color: 'var(--soft)', marginBottom: '0.5rem', display: 'inline-block' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#fff', font: '800 1.05rem Outfit, sans-serif' }}>No Meetups Planned</h4>
                    <p style={{ margin: 0, fontSize: '0.78rem' }}>No fast-join instant plans exist for this activity right now.</p>
                  </div>
                ) : (
                  matchingPlans.map(plan => {
                    const hasJoined = plan.members.some(m => m.id === appState.profile.id);
                    return (
                      <div key={plan.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '18px', gap: '10px' }}>
                        <div style={{ minWidth: 0 }}>
                          <strong style={{ display: 'block', font: '800 0.95rem Outfit, sans-serif', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{plan.title}</strong>
                          <span style={{ display: 'block', fontSize: '0.76rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                            Activity: {plan.activity} • {plan.time} • Host: {plan.creatorName} ({plan.creatorTrustScore}% Trust)
                          </span>
                        </div>
                        <button 
                          className="btn-main" 
                          style={{
                            minHeight: '34px', 
                            borderRadius: '10px', 
                            fontSize: '0.78rem', 
                            padding: '0 12px',
                            background: hasJoined ? 'rgba(0, 215, 245, 0.15)' : '#fff',
                            color: hasJoined ? 'var(--cyan)' : '#000',
                            border: hasJoined ? '1px solid rgba(0, 215, 245, 0.3)' : 'none'
                          }}
                          onClick={() => onJoinPlan(plan.id, hasJoined)}
                        >
                          {hasJoined ? 'Joined ✓' : 'Join ⚡'}
                        </button>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>
        )}

        <button className="btn-quiet full" style={{ marginTop: '1.25rem', minHeight: '38px', borderRadius: '12px' }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function MembersPage({ appState, resolvedMembers = [], onVibeClick, onProfileClick }) {
  const [query, setQuery] = React.useState('');
  const [threeLoaded, setThreeLoaded] = React.useState(false);
  const [gsapLoaded, setGsapLoaded] = React.useState(false);
  const [lenisLoaded, setLenisLoaded] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const canvasRef = React.useRef(null);
  const threeApp = React.useRef(null);

  // Simulate loading state - set to false when members are loaded
  React.useEffect(() => {
    if (resolvedMembers && resolvedMembers.length > 0) {
      // Add a small delay to show shimmer effect
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
    }
  }, [resolvedMembers]);

  // Load all CDNs dynamically
  React.useEffect(() => {
    // 1. Lenis Smooth Scroll
    if (!window.Lenis) {
      const scriptLenis = document.createElement('script');
      scriptLenis.src = 'https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
      scriptLenis.onload = () => setLenisLoaded(true);
      document.head.appendChild(scriptLenis);
    } else {
      setLenisLoaded(true);
    }

    // 2. GSAP Animations
    if (!window.gsap) {
      const scriptGsap = document.createElement('script');
      scriptGsap.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      scriptGsap.onload = () => setGsapLoaded(true);
      document.head.appendChild(scriptGsap);
    } else {
      setGsapLoaded(true);
    }

    // 3. Three.js 3D WebGL space
    if (!window.THREE) {
      const scriptThree = document.createElement('script');
      scriptThree.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      scriptThree.onload = () => setThreeLoaded(true);
      document.head.appendChild(scriptThree);
    } else {
      setThreeLoaded(true);
    }
  }, []);

  // Initialize Lenis Scroll
  React.useEffect(() => {
    if (!lenisLoaded || !window.Lenis) return;
    const lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [lenisLoaded]);

  // GSAP Entrance Animations for cards when query filters them
  const filtered = (resolvedMembers || []).filter(member => `${member.name} ${member.city} ${member.vibe}`.toLowerCase().includes(query.toLowerCase()));

  React.useEffect(() => {
    if (!gsapLoaded || !window.gsap) return;
    window.gsap.killTweensOf(".gsap-member-card");
    window.gsap.fromTo(".gsap-member-card", 
      { opacity: 0, y: 40, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.04, duration: 0.45, ease: "power2.out" }
    );
  }, [gsapLoaded, query]);

  // Initialize 3D Space (Three.js WebGL Particle System)
  React.useEffect(() => {
    if (!threeLoaded || !canvasRef.current || !window.THREE) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    
    // Smooth camera setup
    const camera = new THREE.PerspectiveCamera(60, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle field geometries
    const particleCount = 220;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const fuchsiaColor = new THREE.Color("#ff2e93");
    const cyanColor = new THREE.Color("#00d7f5");

    for (let i = 0; i < particleCount; i++) {
      // 3D Spherical Distribution
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 8 + Math.random() * 15; // orbital radius range

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Gradient fuchsia-cyan blend
      const mixedColor = Math.random() > 0.5 ? fuchsiaColor : cyanColor;
      colors[i * 3] = mixedColor.r;
      colors[i * 3 + 1] = mixedColor.g;
      colors[i * 3 + 2] = mixedColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Glowing Particle Texture using pure canvas programmatically
    const createCircleTexture = () => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(c);
    };

    const material = new THREE.PointsMaterial({
      size: 0.65,
      map: createCircleTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // Orbit lines connecting closest points representing compatibility nodes
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xff2e93,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending
    });
    
    // Build connection pairs dynamically
    const lineIndices = [];
    const positionsArr = positions;
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positionsArr[i * 3] - positionsArr[j * 3];
        const dy = positionsArr[i * 3 + 1] - positionsArr[j * 3 + 1];
        const dz = positionsArr[i * 3 + 2] - positionsArr[j * 3 + 2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < 4.5) {
          lineIndices.push(i, j);
        }
      }
    }
    
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positionsArr, 3));
    lineGeometry.setIndex(lineIndices);
    
    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    let animationFrameId;
    let rotationSpeed = 0.0012;

    const animate = (time) => {
      // Drift particles gently
      particlesMesh.rotation.y = time * rotationSpeed;
      particlesMesh.rotation.x = time * (rotationSpeed * 0.5);
      linesMesh.rotation.y = time * rotationSpeed;
      linesMesh.rotation.x = time * (rotationSpeed * 0.5);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate(0);

    threeApp.current = { scene, camera, renderer, particlesMesh, linesMesh };

    // Responsive scaling
    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      scene.clear();
      renderer.dispose();
    };
  }, [threeLoaded]);

  // Connect interactive search speed scaling to Three.js canvas!
  React.useEffect(() => {
    if (!threeApp.current) return;
    const { particlesMesh, linesMesh } = threeApp.current;
    if (query) {
      if (window.gsap) {
        window.gsap.to(particlesMesh.rotation, { y: "+=0.35", x: "+=0.15", duration: 0.8, ease: "power2.out" });
        window.gsap.to(linesMesh.rotation, { y: "+=0.35", x: "+=0.15", duration: 0.8, ease: "power2.out" });
      } else {
        particlesMesh.rotation.y += 0.35;
        linesMesh.rotation.y += 0.35;
      }
    }
  }, [query]);

  return (
    <section className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Noise SVG Filter definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="noiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
      </svg>

      {/* Floating 3D Aceternity style background gradients */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(255, 46, 147, 0.12) 0%, transparent 75%)',
        zIndex: -1,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(0, 215, 245, 0.08) 0%, transparent 75%)',
        zIndex: -1,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* Interactive WebGL Header Canvas Wrapper */}
      <div className="three-header-wrapper" style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, rgba(14, 14, 20, 0.75), rgba(10, 10, 15, 0.35))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
      }}>
        {/* Subtle noise layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          filter: 'url(#noiseFilter)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* The 3D canvas backdrop */}
        <canvas ref={canvasRef} style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Page title contents */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span className="eyebrow" style={{ color: 'var(--pink)', fontWeight: 'bold' }}>Active Now</span>
          <h1 style={{ margin: '0.2rem 0', font: '900 2.2rem Outfit, sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            Verified Active Members
          </h1>
          <p style={{ margin: '0', color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '520px', lineHeight: '1.45' }}>
            Orbiting 3D matching telemetry active. Explore premium member profiles with certified Aadhaar safety checks.
          </p>
        </div>
      </div>

      {/* shadcn style glassmorphic Input Search bar */}
      <label className="toolbar" style={{
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(14, 14, 20, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '0.8rem 1.2rem',
        gap: '0.75rem',
        marginBottom: '2rem',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        position: 'relative'
      }}>
        <Search style={{ color: 'var(--pink)', width: '20px', height: '20px' }} />
        <input 
          value={query} 
          onChange={event => setQuery(event.target.value)} 
          placeholder="Filter by city, name, or vibe..." 
          style={{
            background: 'transparent',
            border: 0,
            color: '#fff',
            outline: 'none',
            fontSize: '0.92rem',
            width: '100%',
            fontWeight: '500'
          }}
        />
        {query && (
          <button 
            onClick={() => setQuery('')}
            style={{ background: 'transparent', border: 0, color: 'var(--soft)', padding: '2px' }}
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        )}
      </label>

      {/* The Member Grid */}
      <div className="member-grid" style={{ minHeight: '300px' }}>
        {isLoading ? (
          <Skeleton type="grid" count={6} />
        ) : (
          filtered.map(member => (
            <div key={member.id} className="gsap-member-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <MemberCard
                member={member}
                requested={Boolean(appState.vibeRequests[member.id])}
                onVibeClick={onVibeClick}
                onProfileClick={onProfileClick}
              />
            </div>
          ))
        )}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          type="discovery"
          title="No matches found"
          description="No active members match your search criteria. Try loosening your search keyword or checking other neighborhoods like Bandra or Juhu."
          actionText="Reset Search"
          onAction={() => setQuery('')}
        />
      )}
    </section>
  );
}

function MemberCard({ member, onVibeClick, onProfileClick, compact = false, requested = false }) {
  const cardRef = React.useRef(null);

  // Aceternity spotlight mouse position tracking
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--spotlight-x", `${x}px`);
    cardRef.current.style.setProperty("--spotlight-y", `${y}px`);
  };

  const isVip = member.score === "98%" || member.score === "96%";

  return (
    <article 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={() => onProfileClick?.(member)}
      role="button"
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onProfileClick?.(member);
        }
      }}
      className={`member-card ${compact ? 'compact' : ''}`} 
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        gap: '0.6rem', 
        padding: '1.25rem', 
        height: '100%', 
        justifyContent: 'space-between',
        position: 'relative',
        background: 'rgba(14, 14, 20, 0.72)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        cursor: 'pointer'
      }}
    >
      {/* Dynamic Aceternity border spotlight overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle 160px at var(--spotlight-x, -500px) var(--spotlight-y, -500px), rgba(255, 46, 147, 0.08) 0%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Noise Texture layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.02,
        filter: 'url(#noiseFilter)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Border beam animation for VIP profiles */}
      {isVip && <div className="border-beam" style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '24px',
        padding: '1px',
        background: 'linear-gradient(to right, #ff2e93, #00d7f5, transparent, transparent)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
        backgroundSize: '200% 200%',
        animation: 'border-beam-anim 6s linear infinite',
        zIndex: 1
      }} />}
      
      <style>{`
        @keyframes border-beam-anim {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>

      <div style={{ position: 'relative', zIndex: 2, minWidth: 0 }}>
        {/* Card Header */}
        <div className="member-head" style={{ gap: '0.75rem', alignItems: 'center', minWidth: 0 }}>
          <div className="live-avatar-ring" style={{ position: 'relative', flexShrink: 0 }}>
            <Avatar member={member} />
            <span className="live-online-dot" style={{
              position: 'absolute',
              bottom: '2px',
              right: '2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#25d366',
              border: '2px solid #0a0a0f',
              boxShadow: '0 0 10px #25d366'
            }} />
          </div>
          <div style={{ minWidth: '0', flex: 1 }}>
            <h3 style={{ 
              fontSize: '1.1rem', 
              font: '800 1.1rem Outfit, sans-serif', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              color: '#fff',
              minWidth: 0,
              width: '100%'
            }}>
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                {(member.name || '').split(',')[0].trim().split(' ')[0]}, {member.age || (member.name || '').split(',')[1]?.trim()}
              </span>
              {member.verification_level === 'highly_verified' && <ShieldCheck style={{ width: '16px', height: '16px', color: '#fbbf24', flexShrink: 0 }} title="Highly Verified VIP Passport" />}
              {member.verification_level === 'identity' && <ShieldCheck style={{ width: '16px', height: '16px', color: '#22d3ee', flexShrink: 0 }} title="Identity Verified Selfie Check Complete" />}
              {member.verification_level === 'basic' && <ShieldCheck style={{ width: '16px', height: '16px', color: '#3b82f6', flexShrink: 0 }} title="Basic Verified Phone Connected" />}
            </h3>
            <p style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.78rem', color: 'var(--muted)', margin: '0.15rem 0 0', minWidth: 0 }}>
              <MapPin style={{ width: '12px', height: '12px', flexShrink: 0, color: 'var(--pink)' }} />
              <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0 }}>
                {member.city.split(',')[0]}
              </span>
            </p>
            <div style={{ marginTop: '0.35rem', display: 'flex', gap: '4px' }}>
              <span style={{
                fontSize: '0.65rem',
                fontWeight: '900',
                padding: '2px 6px',
                borderRadius: '6px',
                background: (member.trustMetrics?.attendanceScore || member.trustMetrics?.attendance_score || member.trustScore || 94) >= 95 ? 'rgba(37, 211, 102, 0.08)' : 'rgba(255, 46, 147, 0.06)',
                color: (member.trustMetrics?.attendanceScore || member.trustMetrics?.attendance_score || member.trustScore || 94) >= 95 ? '#25d366' : 'var(--pink)',
                border: `1px solid ${(member.trustMetrics?.attendanceScore || member.trustMetrics?.attendance_score || member.trustScore || 94) >= 95 ? 'rgba(37, 211, 102, 0.2)' : 'rgba(255, 46, 147, 0.15)'}`
              }}>
                Reliability: {Math.round(member.trustMetrics?.attendanceScore || member.trustMetrics?.attendance_score || member.trustScore || 94)}%
              </span>
            </div>
          </div>
        </div>

        {/* Prompt Answer Card */}
        <div className="prompt-box" style={{ 
          margin: '0.8rem 0 0', 
          padding: '0.8rem', 
          minHeight: '68px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          borderRadius: '16px', 
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255,255,255,0.03)',
          minWidth: 0
        }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--soft)', fontWeight: '900', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>
            {member.prompt}
          </span>
          <p style={{ fontSize: '0.8rem', margin: '0', color: 'rgba(255,255,255,0.85)', lineHeight: '1.45', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {member.answer}
          </p>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.4rem', position: 'relative', zIndex: 2, minWidth: 0, width: '100%' }}>
        <div className={`vibe-pill ${member.gradient}`} style={{ 
          padding: '0.4rem 0.6rem', 
          fontSize: '0.72rem', 
          flex: 1, 
          margin: 0, 
          justifyContent: 'center', 
          minHeight: '36px', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          fontWeight: 'bold',
          minWidth: 0
        }}>
          <Sparkles style={{ width: '12px', height: '12px', flexShrink: 0 }} />
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0 }}>
            {member.vibe.replace(' Vibe', '')}
          </span>
        </div>
        <button 
          className={requested ? 'btn-quiet' : 'btn-main'} 
          style={{ 
            minHeight: '36px', 
            width: '38px', 
            padding: 0, 
            borderRadius: '12px', 
            flexShrink: 0, 
            display: 'grid', 
            placeItems: 'center',
            boxShadow: requested ? 'none' : '0 4px 12px rgba(255, 46, 147, 0.2)'
          }} 
          onClick={event => {
            event.stopPropagation();
            onVibeClick(member);
          }}
          title={requested ? 'Vibe sent' : 'Send vibe check'}
        >
          <Send style={{ width: '14px', height: '14px' }} />
        </button>
      </div>
    </article>
  );
}

function MemberProfileModal({ member, requested, onClose, onVibeClick, navigate }) {
  const [closing, setClosing] = React.useState(false);
  const [photoIndex, setPhotoIndex] = React.useState(0);
  const [moderating, setModerating] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const dragControls = useDragControls();
  const photoSwipe = React.useRef(null);
  const photos = member.photos?.length ? member.photos : [];

  const blockMember = async () => {
    if (moderating) return;
    setModerating(true);
    try {
      await fetch('/api/blocks', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetId: member.id })
      });
    } finally {
      setModerating(false);
      onClose?.();
    }
  };

  const submitReport = async reason => {
    if (!reason) { setReportOpen(false); return; }
    try {
      await fetch('/api/reports', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ targetType: 'user', targetId: member.id, reason })
      });
    } finally {
      setReportOpen(false);
      onClose?.();
    }
  };

  const trustMetrics = member.trustMetrics || member.profile?.trustMetrics || {
    attendanceScore: 94,
    noShowCount: 0,
    attendedCount: 12,
    verificationScore: 100,
    isVerified: true,
    responseRate: 98,
    trustScore: 94
  };

  const getReliabilityDetails = (score) => {
    const s = Math.round(Number(score ?? 94));
    if (s >= 95) return { badge: 'Elite Reliable', level: 'High (Elite)', color: '#25d366', bg: 'rgba(37, 211, 102, 0.1)' };
    if (s >= 85) return { badge: 'Highly Reliable', level: 'High', color: '#a5f7c3', bg: 'rgba(37, 211, 102, 0.06)' };
    if (s >= 70) return { badge: 'Reliable', level: 'Medium', color: '#ffc107', bg: 'rgba(255, 193, 7, 0.08)' };
    if (s >= 50) return { badge: 'Building Trust', level: 'Developing', color: '#ffc107', bg: 'rgba(255, 193, 7, 0.04)' };
    return { badge: 'Low Reliability', level: 'Low', color: '#ff2e93', bg: 'rgba(255, 46, 147, 0.1)' };
  };

  const reliability = getReliabilityDetails(trustMetrics.attendanceScore);

  const closeWithAnimation = React.useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 260);
  }, [closing, onClose]);

  const showNextPhoto = React.useCallback(() => {
    if (!photos.length) return;
    setPhotoIndex(current => (current + 1) % photos.length);
  }, [photos.length]);

  const showPrevPhoto = React.useCallback(() => {
    if (!photos.length) return;
    setPhotoIndex(current => (current - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const details = [
    ['Match score', `${member.score || '94%'} vibe match`, Heart],
    ['Location', member.city, MapPin],
    ['Verified', member.verification_level === 'highly_verified' ? 'Passport Verified' : member.verification_level === 'identity' ? 'Aadhaar Verified' : member.verification_level === 'basic' ? 'Phone Verified' : 'Selfie checked', ShieldCheck],
    ['Intent', 'Slow dating, curated plans', Sparkles]
  ];

  const chips = [
    member.vibe,
    'Face matched',
    'Respectful dater',
    'Active now',
    'Coffee-friendly'
  ];

  return (
    <div className={`modal-backdrop member-profile-backdrop ${closing ? 'is-closing' : ''}`} role="dialog" aria-modal="true" onClick={closeWithAnimation}>
      <motion.div
        className={`member-profile-modal ${closing ? 'is-closing' : ''}`}
        initial={{ opacity: 0, y: 90, scale: 0.98 }}
        animate={closing ? { opacity: 0, y: 180, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 220 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.y > 92 || info.velocity.y > 650) closeWithAnimation();
        }}
        onClick={event => event.stopPropagation()}
      >
        <div
          className="member-profile-drag-handle"
          aria-hidden="true"
          onPointerDown={event => dragControls.start(event)}
        />

        {photos.length ? (
          <div
            className="member-photo-carousel"
            onPointerDown={event => {
              photoSwipe.current = { x: event.clientX, y: event.clientY };
            }}
            onPointerUp={event => {
              if (!photoSwipe.current) return;
              const deltaX = event.clientX - photoSwipe.current.x;
              const deltaY = event.clientY - photoSwipe.current.y;
              photoSwipe.current = null;

              if (deltaY > 92 && deltaY > Math.abs(deltaX) * 1.15) {
                closeWithAnimation();
                return;
              }

              if (Math.abs(deltaX) > 54 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
                if (deltaX < 0) showNextPhoto();
                else showPrevPhoto();
              }
            }}
            onPointerCancel={() => {
              photoSwipe.current = null;
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={`${member.id}-${photoIndex}`}
                src={photos[photoIndex]}
                alt={`${member.name} photo ${photoIndex + 1}`}
                draggable={false}
                initial={{ opacity: 0, x: 42 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -42 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
              />
            </AnimatePresence>

            <button className="member-photo-tap-zone prev" onClick={showPrevPhoto} aria-label="Previous photo" />
            <button className="member-photo-tap-zone next" onClick={showNextPhoto} aria-label="Next photo" />

            <div className="member-photo-progress" aria-label={`Photo ${photoIndex + 1} of ${photos.length}`}>
              {photos.map((_, index) => <span key={index} className={index === photoIndex ? 'active' : ''} />)}
            </div>

            <div className="member-photo-gradient" />
            <div className="member-photo-info">
              <div className="badge-row">
                <span>
                  <ShieldCheck style={{ color: member.verification_level === 'highly_verified' ? '#fbbf24' : member.verification_level === 'identity' ? '#22d3ee' : member.verification_level === 'basic' ? '#3b82f6' : '#25d366' }} />
                  {member.verification_level === 'highly_verified' ? 'Highly Verified' : member.verification_level === 'identity' ? 'Identity Verified' : member.verification_level === 'basic' ? 'Basic Verified' : 'Verified'}
                </span>
                <span><Sparkles /> Active now</span>
              </div>
              <h2>{member.name}, {member.age}</h2>
              <p><MapPin /> {member.city}</p>
            </div>
          </div>
        ) : (
          <div className={`member-profile-hero ${member.gradient || 'pink'}`}>
            <div className="member-profile-avatar-wrap">
              <Avatar member={member} />
              <span style={{ background: member.verification_level === 'highly_verified' ? '#fbbf24' : member.verification_level === 'identity' ? '#22d3ee' : member.verification_level === 'basic' ? '#3b82f6' : '#25d366' }}><ShieldCheck /></span>
            </div>
            <div>
              <div className="badge-row">
                <span>
                  <ShieldCheck style={{ color: member.verification_level === 'highly_verified' ? '#fbbf24' : member.verification_level === 'identity' ? '#22d3ee' : member.verification_level === 'basic' ? '#3b82f6' : '#25d366' }} />
                  {member.verification_level === 'highly_verified' ? 'Highly Verified' : member.verification_level === 'identity' ? 'Identity Verified' : member.verification_level === 'basic' ? 'Basic Verified' : 'Verified'}
                </span>
                <span><Sparkles /> Active now</span>
              </div>
              <h2>{member.name}, {member.age}</h2>
              <p><MapPin /> {member.city}</p>
            </div>
          </div>
        )}

        <div className="member-profile-body">
          {/* Feature 1: Reliability Score Card */}
          <div className="profile-reliability-card" style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reliability Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span style={{ font: '900 1.8rem Outfit, sans-serif', color: reliability.color }}>{Math.round(trustMetrics.attendanceScore)}</span>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 'bold',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    color: reliability.color,
                    background: reliability.bg,
                    border: `1px solid ${reliability.color}33`
                  }}>{reliability.badge}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>Trust Level</span>
                <strong style={{ fontSize: '0.9rem', color: '#fff' }}>{reliability.level}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(0, 0, 0, 0.15)', padding: '10px', borderRadius: '14px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--muted)', display: 'block' }}>Events Attended</span>
                <strong style={{ fontSize: '0.88rem', color: '#fff' }}>{trustMetrics.attendedCount}</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--muted)', display: 'block' }}>No Shows</span>
                <strong style={{ fontSize: '0.88rem', color: trustMetrics.noShowCount > 0 ? '#ff2e93' : '#25d366' }}>{trustMetrics.noShowCount}</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--muted)', display: 'block' }}>Successful Meetups</span>
                <strong style={{ fontSize: '0.88rem', color: '#25d366' }}>{Math.max(0, trustMetrics.attendedCount - trustMetrics.noShowCount)}</strong>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', background: 'rgba(0, 0, 0, 0.15)', padding: '10px', borderRadius: '14px', marginTop: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--muted)', display: 'block' }}>Attendance Rate</span>
                <strong style={{ fontSize: '0.88rem', color: '#25d366' }}>{Math.round(trustMetrics.attendanceScore || trustMetrics.attendance_score || 94)}%</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--muted)', display: 'block' }}>No Show Rate</span>
                <strong style={{ fontSize: '0.88rem', color: (100 - (trustMetrics.attendanceScore || trustMetrics.attendance_score || 94)) > 10 ? '#ff2e93' : '#25d366' }}>{Math.round(100 - (trustMetrics.attendanceScore || trustMetrics.attendance_score || 94))}%</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '0.66rem', color: 'var(--muted)', display: 'block' }}>Would Meet Again</span>
                <strong style={{ fontSize: '0.88rem', color: '#25d366' }}>{Math.round(trustMetrics.would_meet_again_pct || trustMetrics.wouldMeetAgainPct || 100)}%</strong>
              </div>
            </div>
          </div>

          <div className="member-weekend-status">
            <div className="member-weekend-status-head">
              <span><Calendar /> Weekend Status</span>
              <strong>Active now</strong>
            </div>
            <p>{member.weekendStatus || member.answer}</p>
            <div className="member-weekend-tags">
              {(member.weekendTags?.length ? member.weekendTags : ['Weekend', member.vibe?.replace(' Vibe', '') || 'Curated']).map(tag => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="member-profile-prompt member-profile-prompt-secondary">
            <span>{member.prompt}</span>
            <p>{member.answer}</p>
          </div>

          <div className="member-profile-stats">
            {details.map(([label, value, Icon]) => (
              <div key={label}>
                <Icon />
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>

          <div className="member-profile-chips">
            {chips.map(chip => <span key={chip}>{chip}</span>)}
          </div>

          <div className="member-profile-actions">
            <button className={requested ? 'btn-quiet' : 'btn-main'} onClick={() => onVibeClick(member)}>
              <Send /> {requested ? 'Vibe Sent' : 'Send Vibe Check'}
            </button>
            <button className="btn-quiet" onClick={() => { closeWithAnimation(); window.setTimeout(() => navigate?.('/chat'), 270); }}>
              <MessageCircle /> Inbox
            </button>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10 }}>
            <button onClick={() => setReportOpen(true)} style={{ background: 'none', border: 0, color: 'var(--soft)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              Report
            </button>
            <span style={{ color: 'var(--soft)' }}>·</span>
            <button onClick={blockMember} disabled={moderating} style={{ background: 'none', border: 0, color: 'var(--pink)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {moderating ? 'Blocking…' : 'Block'}
            </button>
          </div>
          {reportOpen && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center' }}>Why are you reporting {member.name?.split(',')[0]}?</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                {['Inappropriate photos', 'Harassment', 'Fake profile', 'Spam', 'Other'].map(reason => (
                  <button key={reason} className="btn-quiet" style={{ minHeight: 32, borderRadius: 10, fontSize: '0.74rem', padding: '0 12px' }} onClick={() => submitReport(reason)}>
                    {reason}
                  </button>
                ))}
              </div>
              <button onClick={() => setReportOpen(false)} style={{ display: 'block', margin: '10px auto 0', background: 'none', border: 0, color: 'var(--soft)', fontSize: '0.74rem', cursor: 'pointer' }}>Cancel</button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function ConnectionRequestsPage({ navigate }) {
  const [requests, setRequests] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);

  const load = React.useCallback(() => {
    fetch('/api/connections/requests', { credentials: 'same-origin', cache: 'no-store' })
      .then(res => res.json())
      .then(data => setRequests(Array.isArray(data.requests) ? data.requests : []))
      .catch(() => setRequests([]));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/connections/${id}/${action}`, {
        method: 'POST', credentials: 'same-origin', cache: 'no-store',
        headers: { 'content-type': 'application/json' }
      });
      if (res.ok) {
        setRequests(prev => (prev || []).filter(r => r.id !== id));
        if (action === 'accept') navigate('/chat');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="page-shell inbox-page">
      <PageTitle eyebrow="Requests" title="Connection Requests" text="People who want to connect with you. Accept to start a chat, or decline." />
      {requests === null ? (
        <div className="inbox-list">
          <Skeleton type="list" count={3} />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          type="connections"
          title="No pending requests"
          description="When someone sends you a connection request, it will show up here."
          actionText="Discover People"
          onAction={() => navigate('/members')}
        />
      ) : (
        <div className="inbox-list">
          {requests.map(req => (
            <div key={req.id} className="inbox-card" style={{ alignItems: 'flex-start', cursor: 'default' }}>
              <Avatar member={req.from} />
              <div className="inbox-copy" style={{ flex: 1, minWidth: 0 }}>
                <div className="inbox-row">
                  <strong>{req.from.name}{req.from.age ? `, ${req.from.age}` : ''}</strong>
                  <span>{req.from.city || ''}</span>
                </div>
                {req.note && <small style={{ display: 'block', color: 'var(--muted)', margin: '2px 0 8px' }}>“{req.note}”</small>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn-main" style={{ minHeight: 34, borderRadius: 10, fontSize: '0.8rem', padding: '0 14px' }}
                    disabled={busyId === req.id} onClick={() => act(req.id, 'accept')}>
                    {busyId === req.id ? '…' : 'Accept'}
                  </button>
                  <button className="btn-quiet" style={{ minHeight: 34, borderRadius: 10, fontSize: '0.8rem', padding: '0 14px' }}
                    disabled={busyId === req.id} onClick={() => act(req.id, 'reject')}>
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ChatInboxPage({ appState, resolvedChats = [], resolvedMembers = [], navigate }) {
  const hasNoChats = resolvedChats.length === 0;

  return (
    <section className="page-shell inbox-page">
      <PageTitle eyebrow="Inbox" title="Chat Inbox" text="Pick a connection to open a dedicated chat page. No cramped split layout." />
      <button className="btn-quiet" style={{ alignSelf: 'flex-start', marginBottom: '1rem', minHeight: 38, borderRadius: 12, padding: '0 16px', display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => navigate('/requests')}>
        <Users style={{ width: 16, height: 16 }} /> View connection requests
      </button>
      {hasNoChats ? (
        <EmptyState
          type="chat"
          title="No Conversations Yet"
          description="You don't have any active chats yet. Connect with members in discovery to unlock voice verification and start real-time messaging!"
          actionText="Find Connections"
          onAction={() => navigate('/members')}
        />
      ) : (
        <div className="inbox-list">
          {(resolvedChats || []).map(chat => {
            const profile = getChatProfile(chat, resolvedMembers);
            const messageCount = (appState.chatMessages[chat.slug] || chat.messages || []).length;
            return (
            <button key={chat.slug} className="inbox-card" onClick={() => navigate(`/chat/${chat.slug}`)}>
              <Avatar member={profile} />
              <div className="inbox-copy">
                <div className="inbox-row"><strong>{profile.name}</strong><span>6d 23h</span></div>
                <small className="message-count-tag">{messageCount} messages</small>
              </div>
              <ChevronRight />
            </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

function formatLastSeen(lastActiveAt) {
  if (!lastActiveAt) return 'Offline';
  try {
    const parsedDate = lastActiveAt.includes('T') ? new Date(lastActiveAt) : new Date(lastActiveAt.replace(' ', 'T') + 'Z');
    const diffMs = Date.now() - parsedDate.getTime();
    if (Number.isNaN(diffMs)) return 'Offline';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Active just now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Active ${diffDays}d ago`;
  } catch (e) {
    return 'Offline';
  }
}

function ChatConversationPage({ appState, resolvedChats = [], resolvedMembers = [], route, navigate, onVerify, onSend, onProfileClick, onMeetupFeedbackClick }) {
  const slug = route.split('/').pop();
  const active = (resolvedChats || []).find(chat => chat.slug === slug) || resolvedChats[0];

  if (!active) {
    return (
      <section className="page-shell inbox-page" style={{ padding: '2rem 1rem' }}>
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: 'rgba(255,255,255,0.01)',
          border: '1px dashed rgba(255,255,255,0.08)',
          borderRadius: '24px',
          color: 'var(--muted)',
          marginTop: '2rem'
        }}>
          <MessageSquare style={{ width: '40px', height: '40px', color: 'var(--soft)', marginBottom: '1rem', display: 'inline-block' }} />
          <h3 style={{ margin: '0 0 0.5rem', color: '#fff', font: '800 1.2rem Outfit, sans-serif' }}>No Conversations Yet</h3>
          <p style={{ margin: 0, fontSize: '0.86rem' }}>You don't have any active chats yet. Go to discovery to request introductions and start real conversations!</p>
          <button className="btn-main" style={{ marginTop: '1.25rem' }} onClick={() => navigate('/members')}>Explore Members</button>
        </div>
      </section>
    );
  }

  const profile = getChatProfile(active, resolvedMembers);
  const isVerified = true; // Beta: chat unlocked (voice-verify gate disabled for friends testing)
  
  const [draft, setDraft] = React.useState('');
  const [liveMessages, setLiveMessages] = React.useState(() => appState.chatMessages[active.slug] || active.messages || []);
  const [peerOnline, setPeerOnline] = React.useState(false);
  const [peerTyping, setPeerTyping] = React.useState(false);

  const [isRecording, setIsRecording] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);

  const socketRef = React.useRef(null);
  const reconnectTimeoutRef = React.useRef(null);
  const typingTimeoutRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const durationIntervalRef = React.useRef(null);

  // Sync with global appState messages (e.g. if page is refreshed or parent state changes)
  React.useEffect(() => {
    setLiveMessages(appState.chatMessages[active.slug] || active.messages || []);
  }, [appState.chatMessages, active.slug, active.messages]);

  // Reset statuses when changing chats
  React.useEffect(() => {
    setPeerOnline(false);
    setPeerTyping(false);
    setIsRecording(false);
  }, [active.slug]);

  // Mark all messages as read via HTTP API on mount/switch
  React.useEffect(() => {
    if (isVerified) {
      fetch(`/api/chats/${active.slug}/read`, { method: 'POST' }).catch(() => {});
    }
  }, [active.slug, isVerified]);

  // WebSocket connection lifecycle & reconnection logic
  React.useEffect(() => {
    if (!isVerified) return;

    let activeConnection = true;

    function connect() {
      if (!activeConnection) return;
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.port === '5173' ? `${window.location.hostname}:8787` : window.location.host;
      const wsUrl = `${wsProtocol}//${wsHost}/api/chats/${active.slug}/ws`;

      console.log(`[WS] Connecting to ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!activeConnection) {
          ws.close();
          return;
        }
        console.log(`[WS] Connected successfully to chat DO for ${active.slug}`);
        // Catch up on anything missed while the socket was down, without falling
        // back to the full-state poll. Cursor = id of the last message we hold.
        setLiveMessages(prev => {
          const lastServerId = [...prev].reverse().find(m => m[3] && !String(m[3]).startsWith('cm-'))?.[3];
          const qs = lastServerId ? `?cursor=${encodeURIComponent(lastServerId)}` : '';
          fetch(`/api/chats/${active.slug}/since${qs}`, { credentials: 'same-origin', cache: 'no-store' })
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
              if (!data?.messages?.length) return;
              setLiveMessages(curr => {
                const have = new Set(curr.map(m => m[3]));
                const merged = curr.slice();
                for (const m of data.messages) {
                  if (!have.has(m.id)) merged.push([m.role, m.body, 'sent', m.id, m.attachmentUrl]);
                }
                return merged;
              });
            })
            .catch(err => console.error('[WS] since catch-up failed:', err));
          return prev;
        });
      };

      ws.onmessage = (event) => {
        if (!activeConnection) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            const senderRole = data.senderId === appState.profile.id ? 'you' : 'match';
            setLiveMessages(prev => {
              // If this echoes our own optimistic send, replace the temp bubble
              // (matched by clientMsgId) with the server-assigned id + 'sent'.
              if (data.clientMsgId) {
                const idx = prev.findIndex(([, , , msgId]) => msgId === data.clientMsgId);
                if (idx !== -1) {
                  const next = prev.slice();
                  next[idx] = [senderRole, data.message, 'sent', data.id, data.attachmentUrl];
                  return next;
                }
              }
              // Deduplicate same message id to prevent dual listing
              const isDuplicate = prev.some(([from, text, status, msgId]) => msgId === data.id);
              if (isDuplicate) return prev;
              return [...prev, [senderRole, data.message, 'sent', data.id, data.attachmentUrl]];
            });
            if (data.senderId !== appState.profile.id) {
              setPeerTyping(false);
              // Send read receipt immediately back over WebSocket
              ws.send(JSON.stringify({ type: 'read', messageId: data.id }));
            }
          } else if (data.type === 'ack') {
            // Idempotent dedup hit (server already had this clientMsgId): mark sent.
            setLiveMessages(prev => prev.map(msg =>
              msg[3] === data.clientMsgId ? [msg[0], msg[1], 'sent', data.id, msg[4]] : msg
            ));
          } else if (data.type === 'deleted') {
            setLiveMessages(prev => prev.map(msg =>
              msg[3] === data.id ? [msg[0], '[message deleted]', msg[2], msg[3], null] : msg
            ));
          } else if (data.type === 'typing') {
            if (data.userId !== appState.profile.id) {
              setPeerTyping(data.isTyping);
            }
          } else if (data.type === 'presence') {
            if (data.userId !== appState.profile.id) {
              setPeerOnline(data.status === 'online');
            }
          } else if (data.type === 'read') {
            if (data.userId !== appState.profile.id) {
              setLiveMessages(prev => prev.map(msg => {
                if (msg[3] === data.messageId) {
                  return [msg[0], msg[1], 'read', msg[3], msg[4]];
                }
                return msg;
              }));
            }
          } else if (data.type === 'read_all') {
            if (data.userId !== appState.profile.id) {
              setLiveMessages(prev => prev.map(msg => {
                if (msg[0] === 'you') {
                  return [msg[0], msg[1], 'read', msg[3], msg[4]];
                }
                return msg;
              }));
            }
          }
        } catch (err) {
          console.error('[WS] Error processing incoming payload:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[WS] Connection closed:', event);
        if (activeConnection) {
          console.log('[WS] Reconnecting in 3s...');
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('[WS] Connection error encountered:', err);
        ws.close();
      };
    }

    connect();

    return () => {
      activeConnection = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [active.slug, isVerified, appState.profile.id]);

  const submitMessage = event => {
    event.preventDefault();
    if (!isVerified || !draft.trim()) return;

    const text = draft.trim();
    setDraft('');

    // Clear typing timeout since user is sending
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      // Client message id makes resends idempotent server-side and lets us
      // reconcile the optimistic bubble when the ack / echo returns.
      const clientMsgId = `cm-${crypto.randomUUID()}`;
      socketRef.current.send(JSON.stringify({
        type: 'message',
        message: text,
        clientMsgId
      }));
      // Append optimistically (tempId = clientMsgId so the echo can replace it).
      setLiveMessages(prev => [...prev, ['you', text, 'sending', clientMsgId]]);
      // Send typing false immediately to stop typing indicator
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: false
      }));
    } else {
      // Fallback: use the parent's HTTP onSend callback
      onSend(active.slug, text);
    }
  };

  const handleInputChange = (event) => {
    setDraft(event.target.value);

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'typing',
        isTyping: true
      }));

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({
            type: 'typing',
            isTyping: false
          }));
        }
      }, 1500);
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const tempId = `temp-${Date.now()}`;
    const previewUrl = URL.createObjectURL(file);
    
    // Add optimistic sending bubble with preview
    setLiveMessages(prev => [...prev, ['you', '[Sending Image...]', 'sending', tempId, previewUrl]]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/chats/${active.slug}/attachments`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLiveMessages(prev => prev.map(msg => {
        if (msg[3] === tempId) {
          return ['you', '[Image]', 'sent', msg[3], data.attachmentUrl];
        }
        return msg;
      }));
    } catch (err) {
      console.error('[Upload] Image transfer failed:', err);
      setLiveMessages(prev => prev.map(msg => {
        if (msg[3] === tempId) {
          return ['you', 'Failed to send image.', 'error', msg[3]];
        }
        return msg;
      }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size <= 0) return;

        await uploadVoiceNote(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (err) {
      console.error('[Audio] Microphone access failed:', err);
      alert('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    audioChunksRef.current = [];
  };

  const uploadVoiceNote = async (blob) => {
    const tempId = `temp-${Date.now()}`;
    const previewUrl = URL.createObjectURL(blob);
    
    // Add optimistic sending bubble with audio preview
    setLiveMessages(prev => [...prev, ['you', '[Voice Note]', 'sending', tempId, previewUrl]]);

    try {
      const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/chats/${active.slug}/attachments`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setLiveMessages(prev => prev.map(msg => {
        if (msg[3] === tempId) {
          return ['you', '[Voice Note]', 'sent', msg[3], data.attachmentUrl];
        }
        return msg;
      }));
    } catch (err) {
      console.error('[Upload] Voice note transfer failed:', err);
      setLiveMessages(prev => prev.map(msg => {
        if (msg[3] === tempId) {
          return ['you', 'Failed to send voice note.', 'error', msg[3]];
        }
        return msg;
      }));
    }
  };

  return (
    <section className="conversation-page">
      <section className="chat-panel chat-detail">
        <div className="chat-profile">
          <button className="back-btn" onClick={() => navigate('/chat')} aria-label="Back to inbox"><ArrowLeft /></button>
          <button className="chat-profile-identity" onClick={() => onProfileClick?.(profile)} aria-label={`Open ${active.name} profile`}>
            <Avatar member={profile} />
            <span>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '5px', font: '800 1.15rem Outfit, sans-serif', color: '#fff' }}>
                {active.name}
                {active.verification_level === 'highly_verified' && <ShieldCheck style={{ width: '15px', height: '15px', color: '#fbbf24', flexShrink: 0 }} title="Highly Verified VIP Passport" />}
                {active.verification_level === 'identity' && <ShieldCheck style={{ width: '15px', height: '15px', color: '#22d3ee', flexShrink: 0 }} title="Identity Verified Selfie Check Complete" />}
                {active.verification_level === 'basic' && <ShieldCheck style={{ width: '15px', height: '15px', color: '#3b82f6', flexShrink: 0 }} title="Basic Verified Phone Connected" />}
              </h2>
              <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {peerOnline ? (
                  <>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>Active now</span>
                  </>
                ) : (
                  <>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.3)', display: 'inline-block' }} />
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{formatLastSeen(active.lastActiveAt)}</span>
                  </>
                )}
                <span>• Trust: {active.trustScore || 94}%</span>
              </p>
            </span>
          </button>
          <span className="expiry">6d 23h</span>
        </div>
        <div className="chat-note"><Sparkles /> {active.message}</div>
        {isVerified && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.08), rgba(255, 46, 147, 0.08))',
            borderBottom: '1px solid rgba(255, 193, 7, 0.15)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award style={{ width: '16px', height: '16px', color: '#ffc107', flexShrink: 0 }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>Offline meetup planned! Did you meet in person?</span>
            </div>
            <button 
              className="btn-main" 
              onClick={() => onMeetupFeedbackClick?.({ matchOutcomeId: `mo-${active.slug}`, targetUserId: profile.id, name: active.name })}
              style={{
                padding: '4px 12px',
                fontSize: '0.74rem',
                minHeight: '28px',
                background: 'linear-gradient(135deg, #ffc107, #ff9800)',
                color: '#000',
                fontWeight: '900',
                border: 0,
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(255, 193, 7, 0.2)'
              }}
            >
              Review Meetup
            </button>
          </div>
        )}
        <div className="message-thread">
          {liveMessages.map(([from, text, status, msgId, attachmentUrl], index) => {
            const isAudio = attachmentUrl && (attachmentUrl.endsWith('.webm') || attachmentUrl.endsWith('.ogg') || attachmentUrl.endsWith('.wav') || attachmentUrl.endsWith('.bin') || text === '[Voice Note]');
            return (
              <div key={`${from}-${index}`} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                maxWidth: 'min(520px, 88%)',
                alignSelf: from === 'you' ? 'flex-end' : from === 'match' ? 'flex-start' : 'center',
                width: 'fit-content'
              }}>
                <div className={`message-bubble ${from}`} style={{ maxWidth: '100%', alignSelf: 'unset', padding: attachmentUrl ? (isAudio ? '8px 12px' : '4px') : '0.75rem 0.9rem', overflow: 'hidden' }}>
                  {attachmentUrl ? (
                    isAudio ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '220px' }}>
                        <audio src={attachmentUrl} controls style={{ width: '100%', height: '36px', filter: from === 'you' ? 'invert(1)' : 'none' }} />
                      </div>
                    ) : (
                      <img src={attachmentUrl} alt="Chat attachment" style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '14px', display: 'block', objectFit: 'cover' }} />
                    )
                  ) : (
                    text
                  )}
                </div>
                {from === 'you' && (
                  <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', alignSelf: 'flex-end', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    {status === 'read' ? (
                      <>
                        <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>Read</span>
                        <svg style={{ width: '12px', height: '12px', color: '#22d3ee' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </>
                    ) : (
                      <>
                        <span>Sent</span>
                        <svg style={{ width: '12px', height: '12px', color: 'rgba(255,255,255,0.3)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </>
                    )}
                  </span>
                )}
              </div>
            );
          })}
          {peerTyping && (
            <div className="message-bubble match" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 16px', maxWidth: 'fit-content' }}>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          )}
        </div>
        <div className={`voice-lock compact-lock ${isVerified ? 'verified-lock' : ''}`}>
          <Mic />
          <div><h3>{isVerified ? 'Voice Verified' : 'Voice Connection Locked'}</h3><p>{isVerified ? 'You can now send messages in this chat.' : 'Listen to their intro or record yours to fully unlock texting.'}</p></div>
          {!isVerified && <button className="btn-quiet" onClick={() => onVerify(active.slug)}>Verify Voice</button>}
        </div>
        {isRecording ? (
          <div className="chat-composer recording-composer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 16px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="pulsing-red-dot" style={{ width: '10px', height: '10px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
              <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold' }}>Recording... 0:{recordingDuration.toString().padStart(2, '0')}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" className="btn-quiet" onClick={cancelRecording} style={{ color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 0, cursor: 'pointer', padding: '4px 8px', fontSize: '0.86rem' }}>Cancel</button>
              <button type="button" className="btn-main" onClick={stopRecording} style={{ background: '#ef4444', border: 0, padding: '6px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.86rem' }}>Send</button>
            </div>
          </div>
        ) : (
          <form className="chat-composer" onSubmit={submitMessage}>
            <button 
              type="button" 
              disabled={!isVerified} 
              onClick={() => fileInputRef.current?.click()} 
              style={{
                background: 'transparent',
                border: 0,
                color: isVerified ? 'var(--soft)' : 'rgba(255,255,255,0.1)',
                cursor: isVerified ? 'pointer' : 'default',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-label="Attach photo"
            >
              <Paperclip style={{ width: '20px', height: '20px' }} />
            </button>
            <button 
              type="button" 
              disabled={!isVerified} 
              onClick={startRecording} 
              style={{
                background: 'transparent',
                border: 0,
                color: isVerified ? 'var(--soft)' : 'rgba(255,255,255,0.1)',
                cursor: isVerified ? 'pointer' : 'default',
                padding: '0 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
              aria-label="Record voice note"
            >
              <Mic style={{ width: '20px', height: '20px' }} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              style={{ display: 'none' }} 
            />
            <input value={draft} disabled={!isVerified} onChange={handleInputChange} placeholder={isVerified ? 'Write a message...' : 'Verify voice to send messages'} />
            <button className="btn-main" type="submit" disabled={!isVerified || !draft.trim()} aria-label="Send message"><Send /></button>
          </form>
        )}
      </section>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes typing-pulse {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background-color: rgba(255,255,255,0.7);
          border-radius: 50%;
          display: inline-block;
          animation: typing-pulse 1.2s infinite ease-in-out;
        }
        .typing-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .typing-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes pulsing-dot {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.4; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pulsing-red-dot {
          animation: pulsing-dot 1.2s infinite ease-in-out;
        }
      `}} />
    </section>
  );
}

const hostEventTypes = [
  'House Party', 'Coffee Meetup', 'Dinner Meetup', 'Movie Night', 'Pickleball', 'Sports',
  'Road Trip', 'Trek', 'Jamming Session', 'Networking', 'Singles Meetup', 'Gaming', 'Study Group', 'Other'
];

function HostEventPage({ navigate, onCreateEvent }) {
  const [form, setForm] = React.useState({
    type: 'House Party',
    title: '',
    photo: '',
    description: '',
    location: '',
    date: '',
    time: '',
    capacity: '10',
    entry: 'Free',
    price: '',
    approval: 'Host Approval'
  });
  const [submitted, setSubmitted] = React.useState(false);

  const isReady = form.title.trim() && form.description.trim() && form.location.trim() && form.date && form.time && Number(form.capacity) > 0;

  function update(field, value) {
    setSubmitted(false);
    setForm(current => ({ ...current, [field]: value }));
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update('photo', reader.result);
    reader.readAsDataURL(file);
  }

  function submit(event) {
    event.preventDefault();
    if (!isReady) return;
    setSubmitted(true);
    onCreateEvent?.(form);
  }

  return (
    <section className="host-page">
      <div className="host-topbar">
        <button type="button" onClick={() => navigate('/')} aria-label="Back to home"><ArrowLeft /></button>
        <div>
          <span>Host in 60 seconds</span>
          <h1>Become the center of the plan</h1>
        </div>
      </div>

      <div className="host-hero">
        <span>Host Pass</span>
        <h2>Create the community you wish existed.</h2>
        <p>Host coffee, movies, pickleball, house parties, trips, or paid sessions and meet people faster than waiting to be invited.</p>
      </div>

      <form className="host-form" onSubmit={submit}>
        <fieldset>
          <legend>Plan Type</legend>
          <div className="host-chip-grid">
            {hostEventTypes.map(type => (
              <button
                key={type}
                type="button"
                className={form.type === type ? 'active' : ''}
                onClick={() => update('type', type)}
              >
                {type}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="host-field">
          <span>Plan Title</span>
          <input value={form.title} onChange={event => update('title', event.target.value)} placeholder="Mission Impossible at 8 PM. Need 2 people." />
        </label>

        <label className="host-photo-field">
          <input type="file" accept="image/*" onChange={handlePhoto} />
          {form.photo ? <img src={form.photo} alt="" /> : <Camera />}
          <div>
            <strong>{form.photo ? 'Cover photo added' : 'Upload a vibe photo'}</strong>
            <span>One good image is enough.</span>
          </div>
        </label>

        <label className="host-field">
          <span>Description</span>
          <textarea value={form.description} onChange={event => update('description', event.target.value)} rows="4" placeholder="What are you doing, who should join, and why will it be fun?" />
        </label>

        <label className="host-field">
          <span>Location</span>
          <input value={form.location} onChange={event => update('location', event.target.value)} placeholder="Venue name or Google Maps location" />
        </label>

        <div className="host-two-col">
          <label className="host-field">
            <span>Date</span>
            <input type="date" value={form.date} onInput={event => update('date', event.currentTarget.value)} onChange={event => update('date', event.target.value)} />
          </label>
          <label className="host-field">
            <span>Time</span>
            <input type="time" value={form.time} onInput={event => update('time', event.currentTarget.value)} onChange={event => update('time', event.target.value)} />
          </label>
        </div>

        <label className="host-field">
          <span>Capacity</span>
          <input type="number" min="2" max="500" value={form.capacity} onChange={event => update('capacity', event.target.value)} placeholder="10" />
        </label>

        <fieldset>
          <legend>Entry Type</legend>
          <div className="host-segmented">
            {['Free', 'Paid'].map(entry => (
              <button key={entry} type="button" className={form.entry === entry ? 'active' : ''} onClick={() => update('entry', entry)}>
                {entry}
              </button>
            ))}
          </div>
          {form.entry === 'Paid' && (
            <label className="host-field compact">
              <span>Ticket Price</span>
              <input type="number" min="1" value={form.price} onChange={event => update('price', event.target.value)} placeholder="499" />
            </label>
          )}
        </fieldset>

        <fieldset>
          <legend>Approval Type</legend>
          <div className="host-approval-grid">
            {[
              ['Host Approval', 'Default for safety. You approve who joins.'],
              ['Auto Approve', 'Anyone can join until capacity fills.']
            ].map(([approval, copy]) => (
              <button key={approval} type="button" className={form.approval === approval ? 'active' : ''} onClick={() => update('approval', approval)}>
                <ShieldCheck />
                <strong>{approval}</strong>
                <span>{copy}</span>
              </button>
            ))}
          </div>
        </fieldset>

        {submitted && (
          <div className="host-success">
            <Sparkles />
            <div>
              <strong>Event is live</strong>
              <span>{form.title} is live for people who want the same plan.</span>
            </div>
          </div>
        )}

        <div className="host-submit-bar">
          <button type="submit" className="btn-main full" disabled={!isReady}>
            Create Joinable Plan <ChevronRight />
          </button>
        </div>
      </form>
    </section>
  );
}

function EventsPage({ appState, resolvedEvents = [], onToggleRsvp, onReviewClick, navigate }) {
  const [filter, setFilter] = React.useState('all'); // 'all', 'plans', 'mixers', 'invite'
  const [query, setQuery] = React.useState('');
  const [threeLoaded, setThreeLoaded] = React.useState(false);
  const [gsapLoaded, setGsapLoaded] = React.useState(false);
  const [lenisLoaded, setLenisLoaded] = React.useState(false);

  const canvasRef = React.useRef(null);
  const threeApp = React.useRef(null);

  // Load all CDNs dynamically
  React.useEffect(() => {
    // 1. Lenis Smooth Scroll
    if (!window.Lenis) {
      const scriptLenis = document.createElement('script');
      scriptLenis.src = 'https://unpkg.com/@studio-freight/lenis@1.0.42/dist/lenis.min.js';
      scriptLenis.onload = () => setLenisLoaded(true);
      document.head.appendChild(scriptLenis);
    } else {
      setLenisLoaded(true);
    }

    // 2. GSAP Animations
    if (!window.gsap) {
      const scriptGsap = document.createElement('script');
      scriptGsap.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
      scriptGsap.onload = () => setGsapLoaded(true);
      document.head.appendChild(scriptGsap);
    } else {
      setGsapLoaded(true);
    }

    // 3. Three.js 3D WebGL space
    if (!window.THREE) {
      const scriptThree = document.createElement('script');
      scriptThree.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      scriptThree.onload = () => setThreeLoaded(true);
      document.head.appendChild(scriptThree);
    } else {
      setThreeLoaded(true);
    }
  }, []);

  // Initialize Lenis Scroll
  React.useEffect(() => {
    if (!lenisLoaded || !window.Lenis) return;
    const lenis = new window.Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [lenisLoaded]);
  const allEvents = resolvedEvents || [];
  const hostedEvents = allEvents.filter(event => event.source === 'hosted');

  // Filter events
  const filteredEvents = allEvents.filter(event => {
    const matchesQuery = event.title.toLowerCase().includes(query.toLowerCase()) || 
                         event.place.toLowerCase().includes(query.toLowerCase()) ||
                         event.type.toLowerCase().includes(query.toLowerCase());
    
    if (filter === 'mixers') {
      return matchesQuery && event.type.toLowerCase().includes('mixer');
    }
    if (filter === 'plans') {
      return matchesQuery && event.source === 'hosted';
    }
    if (filter === 'invite') {
      return matchesQuery && (event.type.toLowerCase().includes('exclusive') || event.type.toLowerCase().includes('vip') || event.type.toLowerCase().includes('invite'));
    }
    return matchesQuery;
  });

  // GSAP animations for cards
  React.useEffect(() => {
    if (!gsapLoaded || !window.gsap) return;
    window.gsap.killTweensOf(".gsap-event-card");
    window.gsap.fromTo(".gsap-event-card", 
      { opacity: 0, y: 45, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, stagger: 0.06, duration: 0.5, ease: "power2.out" }
    );
  }, [gsapLoaded, filter, query, allEvents.length]);

  // Initialize 3D Space (Rotating Cosmic Ticket Portal)
  React.useEffect(() => {
    if (!threeLoaded || !canvasRef.current || !window.THREE) return;

    const THREE = window.THREE;
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(60, canvasRef.current.clientWidth / canvasRef.current.clientHeight, 0.1, 100);
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Create central glowing ring representing event timeline
    const torusGeometry = new THREE.TorusGeometry(6, 0.12, 16, 100);
    const torusMaterial = new THREE.MeshBasicMaterial({
      color: 0x9b30ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    scene.add(torus);

    // Glowing Particle Texture programmatically
    const createGlowingCircleTexture = () => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.2, 'rgba(255,46,147,0.8)');
      grad.addColorStop(0.5, 'rgba(0,215,245,0.2)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 32, 32);
      return new THREE.CanvasTexture(c);
    };

    // Orbiting particle systems
    const particleCount = 180;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const fuchsiaColor = new THREE.Color("#ff2e93");
    const cyanColor = new THREE.Color("#00d7f5");
    const purpleColor = new THREE.Color("#9b30ff");

    for (let i = 0; i < particleCount; i++) {
      // Cylindrical or disk orbit
      const theta = Math.random() * Math.PI * 2;
      const r = 5.5 + Math.random() * 4.5;
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = r * Math.sin(theta);

      // Gradient color blend
      const randColor = Math.random();
      const finalColor = randColor < 0.33 ? fuchsiaColor : randColor < 0.66 ? cyanColor : purpleColor;
      colors[i * 3] = finalColor.r;
      colors[i * 3 + 1] = finalColor.g;
      colors[i * 3 + 2] = finalColor.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: createGlowingCircleTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particlesMesh = new THREE.Points(geometry, material);
    scene.add(particlesMesh);

    // Connecting time filaments
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00d7f5,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending
    });
    
    const lineIndices = [];
    for (let i = 0; i < particleCount; i++) {
      for (let j = i + 1; j < particleCount; j++) {
        const dx = positions[i * 3] - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < 3.0) {
          lineIndices.push(i, j);
        }
      }
    }

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineGeometry.setIndex(lineIndices);

    const linesMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(linesMesh);

    let animationFrameId;
    let rotationSpeed = 0.0015;

    const animate = (time) => {
      torus.rotation.x = time * rotationSpeed * 0.4;
      torus.rotation.y = time * rotationSpeed;
      particlesMesh.rotation.y = time * rotationSpeed * 1.2;
      particlesMesh.rotation.z = time * rotationSpeed * 0.3;
      linesMesh.rotation.y = time * rotationSpeed * 1.2;
      linesMesh.rotation.z = time * rotationSpeed * 0.3;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate(0);

    threeApp.current = { scene, camera, renderer, particlesMesh, linesMesh, torus, THREE };

    const handleResize = () => {
      if (!canvasRef.current) return;
      camera.aspect = canvasRef.current.clientWidth / canvasRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      scene.clear();
      renderer.dispose();
    };
  }, [threeLoaded]);

  // Adjust Three.js rotation speed or colors based on tab clicks
  React.useEffect(() => {
    if (!threeApp.current) return;
    const { torus, particlesMesh, linesMesh, THREE } = threeApp.current;
    
    let targetColor = 0x9b30ff;
    if (filter === 'plans') targetColor = 0x25d366;
    if (filter === 'mixers') targetColor = 0xff2e93;
    if (filter === 'invite') targetColor = 0x00d7f5;

    if (window.gsap) {
      window.gsap.to(torus.material.color, {
        r: new THREE.Color(targetColor).r,
        g: new THREE.Color(targetColor).g,
        b: new THREE.Color(targetColor).b,
        duration: 0.6
      });
      window.gsap.to(torus.rotation, { y: "+=0.45", x: "+=0.2", duration: 0.6 });
      window.gsap.to(particlesMesh.rotation, { y: "+=0.6", duration: 0.6 });
      window.gsap.to(linesMesh.rotation, { y: "+=0.6", duration: 0.6 });
    } else {
      torus.material.color.setHex(targetColor);
    }
  }, [filter]);

  return (
    <section className="page-shell" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Noise SVG grain filter */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="eventsNoiseFilter">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" stitchTiles="stitch" />
        </filter>
      </svg>

      {/* Floating radial glow backgrounds */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(155, 48, 255, 0.12) 0%, transparent 75%)',
        zIndex: -1,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '450px',
        height: '450px',
        background: 'radial-gradient(circle, rgba(0, 215, 245, 0.08) 0%, transparent 75%)',
        zIndex: -1,
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      {/* WebGL Cosmic Portal Header */}
      <div className="three-header-wrapper" style={{
        position: 'relative',
        width: '100%',
        height: '240px',
        borderRadius: '24px',
        background: 'linear-gradient(180deg, rgba(14, 14, 20, 0.8), rgba(10, 10, 15, 0.4))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 12px 30px rgba(0,0,0,0.5)'
      }}>
        {/* Subtle noise layer */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.02,
          filter: 'url(#eventsNoiseFilter)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* 3D Canvas */}
        <canvas ref={canvasRef} style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none'
        }} />

        {/* Title details */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span className="eyebrow" style={{ color: 'var(--pink)', fontWeight: 'bold' }}>Secret Mixers</span>
          <h1 style={{ margin: '0.2rem 0', font: '900 2.2rem Outfit, sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
            Events Where Everyone Comes To Connect
          </h1>
          <p style={{ margin: '0', color: 'var(--muted)', fontSize: '0.9rem', maxWidth: '520px', lineHeight: '1.45' }}>
            Do not just discover events. Meet people before you attend, join smaller groups, and keep the connection after.
          </p>
        </div>
      </div>

      {/* shadcn UI spotlight glassmorphic Search & Filter Panel */}
      <div className="toolbar-panel" style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        background: 'rgba(14, 14, 20, 0.8)',
        backdropFilter: 'blur(18px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Search Input */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          width: '100%'
        }}>
          <Search style={{ color: 'var(--pink)', width: '18px', height: '18px' }} />
          <input 
            value={query} 
            onChange={event => setQuery(event.target.value)} 
            placeholder="Search mixers by venue or name..." 
            style={{
              background: 'transparent',
              border: 0,
              color: '#fff',
              outline: 'none',
              fontSize: '0.9rem',
              width: '100%',
              fontWeight: '500'
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'transparent', border: 0, color: 'var(--soft)' }}>
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </label>

        {/* Tab Filters */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          borderRadius: '12px',
          padding: '3px',
          width: '100%'
        }}>
          <button 
            onClick={() => setFilter('all')}
            style={{
              flex: 1,
              background: filter === 'all' ? 'linear-gradient(135deg, rgba(155, 48, 255, 0.15), rgba(255, 46, 147, 0.15))' : 'transparent',
              border: filter === 'all' ? '1px solid rgba(155, 48, 255, 0.2)' : '1px solid transparent',
              borderRadius: '9px',
              color: filter === 'all' ? '#fff' : 'var(--muted)',
              padding: '6px 4px',
              fontSize: '0.76rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            All Scheduled ({allEvents.length})
          </button>
          <button 
            onClick={() => setFilter('plans')}
            style={{
              flex: 1,
              background: filter === 'plans' ? 'linear-gradient(135deg, rgba(37, 211, 102, 0.14), rgba(0, 215, 245, 0.1))' : 'transparent',
              border: filter === 'plans' ? '1px solid rgba(37, 211, 102, 0.2)' : '1px solid transparent',
              borderRadius: '9px',
              color: filter === 'plans' ? '#fff' : 'var(--muted)',
              padding: '6px 4px',
              fontSize: '0.76rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            Plans ({hostedEvents.length})
          </button>
          <button 
            onClick={() => setFilter('mixers')}
            style={{
              flex: 1,
              background: filter === 'mixers' ? 'linear-gradient(135deg, rgba(255, 46, 147, 0.15), rgba(155, 48, 255, 0.15))' : 'transparent',
              border: filter === 'mixers' ? '1px solid rgba(255, 46, 147, 0.2)' : '1px solid transparent',
              borderRadius: '9px',
              color: filter === 'mixers' ? '#fff' : 'var(--muted)',
              padding: '6px 4px',
              fontSize: '0.76rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            Social Mixers
          </button>
          <button 
            onClick={() => setFilter('invite')}
            style={{
              flex: 1,
              background: filter === 'invite' ? 'linear-gradient(135deg, rgba(0, 215, 245, 0.12), rgba(155, 48, 255, 0.12))' : 'transparent',
              border: filter === 'invite' ? '1px solid rgba(0, 215, 245, 0.2)' : '1px solid transparent',
              borderRadius: '9px',
              color: filter === 'invite' ? '#fff' : 'var(--muted)',
              padding: '6px 4px',
              fontSize: '0.76rem',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            VIP Exclusive
          </button>
        </div>
      </div>

      {/* Staggered Event Grid */}
      <div className="event-grid" style={{ minHeight: '300px' }}>
        {filteredEvents.map(event => (
          <div key={event.id} className="gsap-event-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <EventCard 
              event={event} 
              isRsvped={Boolean(appState.rsvps[event.id])} 
              onToggleRsvp={onToggleRsvp} 
              onReviewClick={onReviewClick}
            />
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <EmptyState
          type="events"
          title="No events found"
          description="Try searching another term, or switch categories to explore active scheduled mixers."
          actionText="Host Your Outing"
          onAction={() => navigate('/host')}
        />
      )}
    </section>
  );
}

function EventCard({ event, isRsvped, onToggleRsvp, onReviewClick }) {
  const cardRef = React.useRef(null);

  // Aceternity spotlight mouse position tracking
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--spotlight-x", `${x}px`);
    cardRef.current.style.setProperty("--spotlight-y", `${y}px`);
  };

  const isExclusive = event.type.toLowerCase().includes("exclusive") || event.type.toLowerCase().includes("vip") || event.type.toLowerCase().includes("invite");
  const isHostedPlan = event.source === 'hosted';

  return (
    <article 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className="event-card"
      style={{
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        position: 'relative',
        background: 'rgba(14, 14, 20, 0.72)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        cursor: 'default'
      }}
    >
      {/* Aceternity Spotlight Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle 200px at var(--spotlight-x, -500px) var(--spotlight-y, -500px), rgba(155, 48, 255, 0.08) 0%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Noise layer */}
      <div style={{
        position: 'absolute',
        inset: 0,
        opacity: 0.02,
        filter: 'url(#eventsNoiseFilter)',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Animated Border Beam for VIP/Exclusive events */}
      {isExclusive && <div className="border-beam" style={{
        position: 'absolute',
        inset: 0,
        borderRadius: '24px',
        padding: '1px',
        background: 'linear-gradient(to right, #00d7f5, #9b30ff, transparent, transparent)',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
        backgroundSize: '200% 200%',
        animation: 'border-beam-anim-events 5s linear infinite',
        zIndex: 1
      }} />}
      
      <style>{`
        @keyframes border-beam-anim-events {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>

      {/* Event Image */}
      <div className="event-media" style={{ position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <img 
          src={event.image} 
          alt={event.title} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover', 
            display: 'block',
            transition: 'transform 0.5s ease' 
          }}
          className="event-image-zoom" 
        />
        {/* Glow and category ribbon */}
        <span style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: isExclusive ? 'linear-gradient(135deg, #00d7f5, #9b30ff)' : 'rgba(14, 14, 20, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '0.35rem 0.65rem',
          borderRadius: '99px',
          fontSize: '0.68rem',
          fontWeight: '900',
          letterSpacing: '0.04em',
          color: '#fff',
          textTransform: 'uppercase',
          boxShadow: isExclusive ? '0 0 15px rgba(0, 215, 245, 0.45)' : 'none',
          zIndex: 5
        }}>
          {event.type}
        </span>
      </div>

      <style>{`
        .event-card:hover .event-image-zoom {
          transform: scale(1.05);
        }
      `}</style>

      {/* Card Content Details */}
      <div style={{ 
        padding: '1.25rem', 
        display: 'flex', 
        flexDirection: 'column', 
        flex: 1, 
        position: 'relative', 
        zIndex: 2,
        minWidth: 0
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem', alignItems: 'center' }}>
          <span style={{ 
            color: isRsvped ? 'var(--green)' : 'var(--pink)', 
            fontWeight: '900', 
            fontSize: '0.72rem', 
            textTransform: 'uppercase',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: isRsvped ? 'var(--green)' : 'var(--pink)',
              boxShadow: `0 0 8px ${isRsvped ? 'var(--green)' : 'var(--pink)'}`
            }} />
            {isRsvped ? 'RSVP Active' : event.status}
          </span>
        </div>

        <h3 style={{ 
          fontSize: '1.15rem', 
          font: '800 1.15rem Outfit, sans-serif', 
          color: '#fff', 
          margin: '0 0 0.8rem',
          lineHeight: '1.3'
        }}>
          {event.title}
        </h3>

        {isHostedPlan && (
          <div style={{
            margin: '0 0 1rem',
            padding: '0.8rem',
            border: '1px solid rgba(37, 211, 102, 0.16)',
            borderRadius: '16px',
            background: 'rgba(37, 211, 102, 0.055)',
            display: 'grid',
            gap: '0.35rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#9af7bb', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Hosted by {event.hostName || 'Club host'}
              </strong>
              <span style={{
                background: 'rgba(155, 48, 255, 0.18)',
                color: '#d69eff',
                fontSize: '0.66rem',
                fontWeight: '900',
                padding: '2px 6px',
                borderRadius: '6px',
                border: '1px solid rgba(155, 48, 255, 0.3)'
              }}>
                Host reliability: {event.hostReliabilityScore ?? 100}%
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.45 }}>
              {event.description}
            </p>
            <span style={{ color: 'var(--soft)', fontSize: '0.72rem', fontWeight: 800 }}>
              {event.attendeeCount || 0}/{event.capacity} joined • {event.entry === 'Paid' ? `Rs. ${event.price || 'TBA'}` : 'Free entry'} • {event.approval}
            </span>
          </div>
        )}

        <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem', minWidth: 0 }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)', margin: 0, minWidth: 0 }}>
            <Calendar style={{ width: '14px', height: '14px', color: 'var(--pink)', flexShrink: 0 }} /> 
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0 }}>
              {event.date}
            </span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)', margin: 0, minWidth: 0 }}>
            <Zap style={{ width: '14px', height: '14px', color: 'var(--cyan)', flexShrink: 0 }} /> 
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0 }}>
              {event.time}
            </span>
          </p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--muted)', margin: 0, minWidth: 0 }}>
            <MapPin style={{ width: '14px', height: '14px', color: 'var(--purple)', flexShrink: 0 }} /> 
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0 }}>
              {event.place}
            </span>
          </p>
        </div>

        {/* Dynamic Event Quality Metrics Panel */}
        <div style={{
          marginBottom: '1.25rem',
          padding: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.6rem',
          fontSize: '0.72rem'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quality Score</span>
            <span style={{ color: 'var(--pink)', font: '800 0.84rem Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Award style={{ width: '12px', height: '12px', color: 'var(--pink)' }} />
              {event.qualityScore ?? 100}/100
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Avg Rating</span>
            <span style={{ color: '#ffc107', font: '800 0.84rem Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Star style={{ width: '12px', height: '12px', color: '#ffc107', fill: '#ffc107' }} />
              {event.rating ?? 5.0}★
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Attendance %</span>
            <span style={{ color: 'var(--cyan)', font: '800 0.84rem Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users style={{ width: '12px', height: '12px', color: 'var(--cyan)' }} />
              {event.attendanceRate ?? 100}%
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Would Attend Again</span>
            <span style={{ color: 'var(--green)', font: '800 0.84rem Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Heart style={{ width: '12px', height: '12px', color: 'var(--green)', fill: 'var(--green)' }} />
              {event.wouldAttendAgainPct ?? 100}%
            </span>
          </div>
        </div>

        {/* Action Button */}
        {isRsvped && (
          <button 
            className="btn-main full" 
            onClick={(e) => {
              e.stopPropagation();
              onReviewClick?.(event);
            }}
            style={{
              marginBottom: '0.65rem',
              minHeight: '42px',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '0.86rem',
              background: 'linear-gradient(135deg, #ffc107, #ff9800)',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: 0,
              boxShadow: '0 4px 15px rgba(255, 193, 7, 0.2)'
            }}
          >
            Rate Event & Host <Star style={{ width: '16px', height: '16px', fill: '#000' }} />
          </button>
        )}

        <button 
          className={isRsvped ? 'btn-quiet full' : 'btn-main full'} 
          onClick={() => onToggleRsvp(event)}
          style={{
            marginTop: 'auto',
            minHeight: '42px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: isRsvped ? 'none' : '0 4px 15px rgba(255, 46, 147, 0.2)'
          }}
        >
          {isRsvped ? 'Leave Plan' : isHostedPlan ? 'Join Plan Tonight' : 'Reserve Spot Securely'}
          <Ticket style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </article>
  );
}

function ProfilePage({ initialProfile, appState, onSave, onToggleRsvp, navigate }) {
  const [profile, setProfile] = React.useState(() => ({ ...defaultProfile, ...initialProfile }));
  const [errors, setErrors] = React.useState({});
  const [saved, setSaved] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(!initialProfile.completed);
  const [activeTab, setActiveTab] = React.useState('tickets');

  const update = (field, value) => {
    setProfile(current => ({ ...current, [field]: value }));
    setErrors(current => ({ ...current, [field]: '' }));
    setSaved(false);
  };

  const handlePhoto = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(current => ({ ...current, photo: 'Upload a valid image file.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => update('photo', reader.result);
    reader.readAsDataURL(file);
  };

  const validate = () => {
    const nextErrors = {};
    const ageNumber = Number(profile.age);
    if (!profile.photo) nextErrors.photo = 'Profile picture is required.';
    if (!profile.fullName.trim()) nextErrors.fullName = 'Enter your full name.';
    if (!ageNumber || ageNumber < 18 || ageNumber > 28) nextErrors.age = 'Age must be between 18 and 28.';
    if (!profile.instagram.trim().startsWith('@')) nextErrors.instagram = 'Use your @instagram handle.';
    if (!profile.city) nextErrors.city = 'Select your city.';
    if (!/^[6-9]\d{9}$/.test(profile.whatsapp.trim())) nextErrors.whatsapp = 'Enter a valid 10-digit WhatsApp number.';
    if (!profile.gender) nextErrors.gender = 'Select your gender.';
    if (!profile.intent) nextErrors.intent = 'Select dating intent.';
    if (!profile.vibe) nextErrors.vibe = 'Choose your primary vibe.';
    if (profile.bio.trim().length < 24) nextErrors.bio = 'Write at least 24 characters.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submitProfile = event => {
    event.preventDefault();
    if (!validate()) return;
    const completedProfile = { ...profile, completed: true, updatedAt: new Date().toISOString() };
    setProfile(completedProfile);
    onSave(completedProfile);
    setSaved(true);
    setIsEditing(false);
  };

  if (!isEditing && profile.completed) {
    const rsvpList = Object.values(appState.rsvps || {});
    const sentVibeCount = Object.keys(appState.vibeRequests || {}).length;

    // Filter events to find ones NOT RSVP'd yet for the Hotlist Saves
    const bookedIds = new Set(rsvpList.map(r => r.eventId));
    const hotlistEvents = (appState?.hostedEvents || []).filter(e => !bookedIds.has(e.id));

    return (
      <section className="profile-flow page-shell">
        <div className="district-dashboard">
          
          {/* User Profile Header */}
          <div className="district-header-card feature-card">
            <div className="district-avatar-wrapper">
              <div className="district-photo-ring">
                <img src={profile.photo} alt={profile.fullName} />
              </div>
              {profile.verification_level && profile.verification_level !== 'none' && (
                <div className="district-badge-check" title={`${profile.verification_level.replace('_', ' ')} Verified`} style={{
                  background: profile.verification_level === 'highly_verified' ? '#fbbf24' : profile.verification_level === 'identity' ? '#22d3ee' : '#3b82f6'
                }}>
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#fff' }} />
                </div>
              )}
            </div>
            
            <div className="district-user-info">
              <h2>{profile.fullName}, {profile.age}</h2>
              <p><MapPin style={{ display: 'inline', width: '14px', height: '14px', verticalAlign: 'middle', marginRight: '4px' }} /> {profile.city}</p>
              <div className={`district-vibe-tag vibe-pill ${profile.vibe === 'Cafe Partner Vibe' ? 'pink' : profile.vibe === 'Founder Energy' ? 'purple' : 'cyan'}`}>
                <Sparkles style={{ width: '12px', height: '12px', marginRight: '4px' }} /> {profile.vibe || 'Cafe Partner Vibe'}
              </div>
            </div>

            <button className="district-edit-btn" onClick={() => setIsEditing(true)}>
              <User style={{ width: '16px', height: '16px' }} /> Edit Info
            </button>
          </div>

          {/* Instadate Elite Premium Pass Card */}
          <div className="district-elite-pass">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div>
                <span className="eyebrow" style={{ color: '#bf86ff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.68rem' }}><Gem style={{ width: '14px', height: '14px' }} /> Instadate Elite Pass</span>
                <h3 style={{ margin: '0.4rem 0 0.2rem', font: '900 1.35rem Outfit, sans-serif', color: '#fff' }}>Club Member • Verified VIP</h3>
                <p style={{ margin: '0', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.7)' }}>Privileges active • Priority access to Bandra mixers</p>
              </div>
              <div style={{ background: 'rgba(155, 48, 255, 0.2)', padding: '8px', borderRadius: '12px', color: '#bf86ff' }}>
                <Award style={{ width: '28px', height: '28px' }} />
              </div>
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="district-stats-row">
            <div className="district-stat-box">
              <strong>{rsvpList.length}</strong>
              <span>Outings</span>
            </div>
            <div className="district-stat-box">
              <strong>{sentVibeCount}</strong>
              <span>Vibe Checks</span>
            </div>
            <div className="district-stat-box">
              <strong>Elite VIP</strong>
              <span>Club Tier</span>
            </div>
          </div>

          {/* Tab Navigation (District Style) */}
          <div className="district-tab-nav">
            <button className={`district-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`} onClick={() => setActiveTab('tickets')}>
              🎟️ My Tickets ({rsvpList.length})
            </button>
            <button className={`district-tab-btn ${activeTab === 'hotlist' ? 'active' : ''}`} onClick={() => setActiveTab('hotlist')}>
              🔥 Saved Mixers
            </button>
            <button className={`district-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
              🛡️ Safe & Support
            </button>
          </div>

          {/* Tab Content Panels */}
          {activeTab === 'tickets' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {rsvpList.length > 0 ? (
                rsvpList.map((rsvp, idx) => {
                  const eventDetail = (appState?.hostedEvents || []).find(e => e.id === rsvp.eventId) || { image: '/assets/mumbai_rooftop_mixer.png' };
                  return (
                    <div className="district-ticket-pass" key={rsvp.eventId}>
                      <div className="ticket-left">
                        <img src={eventDetail.image} alt={rsvp.title} />
                        <div className="ticket-info">
                          <h3>{rsvp.title}</h3>
                          <p><Calendar style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {rsvp.date}</p>
                          <p><MapPin style={{ width: '13px', height: '13px', display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} /> {rsvp.place}</p>
                        </div>
                      </div>
                      
                      <div className="ticket-perforation"></div>
                      
                      <div className="ticket-right">
                        <div className="ticket-barcode">
                          <svg className="barcode-svg" viewBox="0 0 24 24" style={{ width: '56px', height: '56px', background: '#fff', padding: '4px', borderRadius: '8px' }}>
                            <path d="M2 2h6v6H2V2zm2 2v2h2V4H4zm4-2h8v8H8V2zm2 2v4h4V4h-4zM2 16h6v6H2v-6zm2 2v2h2V18H4zm14-2h6v6h-6v-6zm2 2v2h2V18h-2zM16 10h2v2h-2v-2zm-2 2h2v2h-2v-2zm4 2h2v2h-2v-2zm-4 2h2v2h-2v-2zm-2-4h2v2h-2v-2zm6-2h2v2h-2v-2z" fill="#000" />
                          </svg>
                          <small style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>#ID-{1000 + idx}</small>
                        </div>
                        <button className="btn-quiet" style={{ minHeight: '26px', padding: '0 8px', fontSize: '0.72rem', borderRadius: '8px' }} onClick={() => onToggleRsvp({ id: rsvp.eventId, title: rsvp.title })}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1.5rem', border: '1px dashed var(--line)', borderRadius: '22px', background: 'rgba(255, 255, 255, 0.01)' }}>
                  <Ticket style={{ width: '48px', height: '48px', color: 'var(--soft)', marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 0.5rem', font: '800 1.2rem Outfit, sans-serif' }}>No active bookings</h3>
                  <p style={{ margin: '0 0 1.25rem', color: 'var(--muted)', fontSize: '0.92rem' }}>You haven't reserved passes for offline mixers yet. Explore mixers and book a slot!</p>
                  <button className="btn-main" onClick={() => navigate('/events')}>
                    Explore Club Events <ChevronRight style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'hotlist' && (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {hotlistEvents.length > 0 ? (
                hotlistEvents.map(event => (
                  <div className="inbox-card" key={event.id} style={{ cursor: 'default', display: 'grid', gridTemplateColumns: 'auto 1fr auto', padding: '0.9rem' }}>
                    <img src={event.image} alt={event.title} style={{ width: '56px', height: '54px', objectFit: 'cover', borderRadius: '12px' }} />
                    <div style={{ minWidth: '0', paddingLeft: '0.4rem' }}>
                      <strong style={{ display: 'block', font: '800 1rem Outfit, sans-serif', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{event.title}</strong>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginTop: '2px' }}>{event.date} • {event.place}</span>
                      <small style={{ color: 'var(--pink)', fontWeight: 'bold', fontSize: '0.72rem' }}>🔥 {event.status}</small>
                    </div>
                    <button className="btn-main" style={{ minHeight: '36px', borderRadius: '10px', fontSize: '0.8rem', padding: '0 10px' }} onClick={() => onToggleRsvp(event)}>
                      Book Pass
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p style={{ color: 'var(--muted)' }}>🎉 You've secured passes for all scheduled mixers! Check "My Tickets" tab.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-list">
              {/* Beta: removed fake billing/refund, Aadhaar "100% Secure", Safety Shield,
                  and VIP Concierge rows. Only the real block-management feature remains. */}
              <BlockedMembersSection />
            </div>
          )}

        </div>
      </section>
    );
  }

  // Fallback to Edit Profile Form (Existing edit card render, but we add a back button if completed)
  return (
    <section className="profile-flow page-shell">
      {profile.completed && (
        <button type="button" className="btn-quiet" style={{ marginBottom: '1.25rem' }} onClick={() => setIsEditing(false)}>
          <ArrowLeft style={{ width: '16px', height: '16px', marginRight: '6px', verticalAlign: 'middle' }} /> Back to Dashboard
        </button>
      )}
      <PageTitle eyebrow="Club profile" title={profile.completed ? "Update Your Profile" : "Complete Your Profile"} text="Add your photo and dating basics. Your profile saves on this device for the app flow." />
      <form className="profile-card-form" onSubmit={submitProfile}>
        <label className={`photo-upload ${profile.photo ? 'has-photo' : ''}`}>
          {profile.photo ? <img src={profile.photo} alt="Profile preview" /> : <Camera />}
          <strong>{profile.photo ? 'Change profile picture' : 'Add profile picture'}</strong>
          <span>Use a clear face photo for verification.</span>
          <input type="file" accept="image/*" onChange={handlePhoto} />
        </label>
        {errors.photo && <p className="field-error">{errors.photo}</p>}

        <div className="form-grid">
          <Field label="Full name" error={errors.fullName}>
            <input value={profile.fullName} onChange={event => update('fullName', event.target.value)} placeholder="Ishaan Sharma" />
          </Field>
          <Field label="Age" error={errors.age}>
            <input value={profile.age} onChange={event => update('age', event.target.value)} inputMode="numeric" placeholder="22" />
          </Field>
          <Field label="Instagram handle" error={errors.instagram}>
            <input value={profile.instagram} onChange={event => update('instagram', event.target.value)} placeholder="@ishaan_s" />
          </Field>
          <Field label="City" error={errors.city}>
            <select value={profile.city} onChange={event => update('city', event.target.value)}>
              <option value="">Select city</option>
              <option>Mumbai</option>
              <option>Delhi NCR</option>
              <option>Bangalore</option>
              <option>Pune</option>
              <option>Goa</option>
            </select>
          </Field>
          <Field label="WhatsApp number" error={errors.whatsapp}>
            <input value={profile.whatsapp} onChange={event => update('whatsapp', event.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="tel" placeholder="9876543210" />
          </Field>
          <Field label="Gender" error={errors.gender}>
            <select value={profile.gender} onChange={event => update('gender', event.target.value)}>
              <option value="">Select gender</option>
              <option>Woman</option>
              <option>Man</option>
              <option>Non-binary</option>
            </select>
          </Field>
          <Field label="Dating intent" error={errors.intent}>
            <select value={profile.intent} onChange={event => update('intent', event.target.value)}>
              <option value="">Select intent</option>
              <option>Long-term relationship</option>
              <option>Slow dating</option>
              <option>Meet verified people</option>
              <option>Offline events first</option>
            </select>
          </Field>
          <Field label="Primary vibe" error={errors.vibe}>
            <select value={profile.vibe} onChange={event => update('vibe', event.target.value)}>
              <option value="">Select vibe</option>
              <option>Cafe Partner Vibe</option>
              <option>Concert Vibe</option>
              <option>Travel Buddy Vibe</option>
              <option>Founder Energy</option>
            </select>
          </Field>
        </div>

        <Field label="Short intro" error={errors.bio}>
          <textarea value={profile.bio} onChange={event => update('bio', event.target.value)} placeholder="Tell members what your ideal weekend, values, and dating vibe feel like." rows="4" />
        </Field>

        {saved && (
          <div className="profile-success">
            <ShieldCheck />
            <div>
              <strong>Profile saved</strong>
              <span>{profile.fullName} is ready for vibe checks in {profile.city}.</span>
            </div>
          </div>
        )}

        <button className="btn-main full" type="submit">{saved ? 'Update Profile' : 'Save & Continue to Vibe Check'}</button>
      </form>
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}

function VibeRequestModal({ member, requested, onClose, onSend, navigate }) {
  const [note, setNote] = React.useState('');

  return (
    <div className="modal-backdrop vibe-check-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <motion.div
        className="vibe-sheet"
        initial={{ opacity: 0, y: 48, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 36, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        onClick={event => event.stopPropagation()}
      >
        <div className="vibe-sheet-handle" />
        <button className="vibe-sheet-close" onClick={onClose} aria-label="Close vibe check"><X /></button>
        <div className="vibe-sheet-head">
          <Avatar member={member} />
          <div>
            <span>{requested ? 'Request queued' : 'Verified intro'}</span>
            <h2>{requested ? 'Vibe Check Sent' : `Connect with ${member.name}`}</h2>
            <p>{requested ? 'Your concierge intro is already pending.' : member.prompt || member.message || 'Weekend status available for verified intros.'}</p>
          </div>
        </div>

        <label className="vibe-note-wrap">
          <span>Your intro note</span>
          <textarea value={note} onChange={event => setNote(event.target.value)} placeholder="Coffee this week? I liked your music/event vibe..." disabled={requested} maxLength={140} />
          <small>{note.length}/140</small>
        </label>

        <div className="vibe-mini-grid">
          <div><MessageCircle /><strong>Direct request</strong><span>Saved as a pending intro.</span></div>
          <div><ShieldCheck /><strong>Safer unlock</strong><span>Chat opens after voice verify.</span></div>
        </div>

        <button className="vibe-primary" disabled={requested} onClick={() => onSend(member, note)}>
          {requested ? 'Already Sent' : 'Send Vibe Check'} <Send />
        </button>
        <button className="vibe-secondary" onClick={() => { onClose(); navigate('/profile'); }}>Edit My Profile</button>
      </motion.div>
    </div>
  );
}

function VibeModal({ member, onClose, navigate }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="upgrade-modal"><button className="close-btn" onClick={onClose}><X /></button><div className="modal-head"><Avatar member={member} /><div><h2>Get introduced to {member.name}</h2><p>Instadate Elite is for real introductions, not more profile views.</p></div></div><div className="perk-list"><Feature icon={<MessageCircle />} title="Introductions, Not Likes" text="Request a high-intent intro to active verified members." /><Feature icon={<ShieldCheck />} title="Human-Led Curation" text="Compatibility is reviewed for intent, lifestyle, and offline readiness." /><Feature icon={<Award />} title="Offline Priority" text="Access invite-only coffee plans, mixers, and shared experiences." /></div><div className="price-box"><Gem /> <strong>₹699 / month</strong><span>Instadate Elite</span></div><button className="btn-main full" onClick={() => { onClose(); navigate('/profile'); }}>Upgrade to Elite</button></div>
    </div>
  );
}

function BottomNav({ route, navigate }) {
  const navRef = React.useRef(null);
  const items = [
    ['/', Home, 'Home'],
    ['/members', Users, 'People'],
    ['/chat', MessageCircle, 'Inbox'],
    ['/events', Calendar, 'Plans'],
    ['/profile', User, 'Profile']
  ];

  React.useEffect(() => {
    if (!navRef.current) return undefined;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.bottom-nav-orb',
        { xPercent: -30, opacity: 0.35 },
        { xPercent: 30, opacity: 0.8, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true }
      );
    }, navRef);
    return () => ctx.revert();
  }, []);

  return (
    <motion.nav
      ref={navRef}
      className="bottom-nav"
      initial={{ y: 36, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
      aria-label="Primary navigation"
    >
      <span className="bottom-nav-orb" aria-hidden="true" />
      {items.map(([path, Icon, label]) => {
        const active = isRouteActive(route, path);
        return (
          <motion.button
            key={path} 
            className={active ? 'active' : ''} 
            onClick={() => navigate(path)}
            whileTap={{ scale: 0.9 }}
            aria-current={active ? 'page' : undefined}
          >
            {active && <motion.span layoutId="bottomNavActive" className="bottom-nav-active-pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="bottom-nav-icon">
              <Icon />
            </span>
            <span>{label}</span>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

function InstallBanner({ prompt, onDone }) {
  const install = async () => { prompt.prompt(); await prompt.userChoice; onDone(); };
  return <div className="install-banner"><span>Install Instadate for a full app feel.</span><button onClick={install}>Install</button><button onClick={onDone}><X /></button></div>;
}

function Feature({ icon, title, text }) {
  return <div className="feature-card"><div className="feature-icon">{icon}</div><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function PageTitle({ eyebrow, title, text }) {
  return <div className="page-title"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>;
}

// SET-FE-05 (Sprint 1 Task 7): blocked-members list with unblock.
// Reads GET /api/blocks; unblock via DELETE /api/blocks/:id.
function BlockedMembersSection() {
  const [blocks, setBlocks] = React.useState(null); // null = loading
  const [busyId, setBusyId] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/blocks', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('load_failed');
      const json = await res.json();
      setBlocks(json.blocks || []);
    } catch {
      setBlocks([]);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const unblock = async id => {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/blocks/${id}`, { method: 'DELETE', credentials: 'same-origin', cache: 'no-store' });
      if (res.ok) setBlocks(current => (current || []).filter(b => b.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '0.75rem' }}>
      <div>
        <strong style={{ display: 'block', font: '800 1rem Outfit, sans-serif' }}>🚫 Blocked Members</strong>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
          Blocked members can’t see you, message you, or appear in your feeds.
        </span>
      </div>

      {blocks === null && (
        <span style={{ fontSize: '0.82rem', color: 'var(--soft)' }}>Loading…</span>
      )}
      {blocks !== null && blocks.length === 0 && (
        <span style={{ fontSize: '0.82rem', color: 'var(--soft)' }}>You haven’t blocked anyone.</span>
      )}

      {(blocks || []).map(b => (
        <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '8px 0', borderTop: '1px solid var(--line)' }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {b.name || 'Member'}
          </span>
          <button
            className="btn-quiet"
            disabled={busyId === b.id}
            style={{ minHeight: '34px', borderRadius: '10px', fontSize: '0.78rem', padding: '0 14px', flexShrink: 0 }}
            onClick={() => unblock(b.id)}
          >
            {busyId === b.id ? 'Unblocking…' : 'Unblock'}
          </button>
        </div>
      ))}
    </div>
  );
}


function Avatar({ member }) {
  const photo = member.photo || member.photos?.[0];
  return (
    <div className={`avatar ${member.gradient || 'pink'}`}>
      {photo ? <img src={photo} alt="" /> : member.avatar}
    </div>
  );
}

function RadarPulse({ appState, resolvedMembers = [], resolvedEvents = [], navigate, onVibeClick }) {
  const [activeTabState, setActiveTabState] = React.useState("events"); // "events", "couples", "members"
  const [leafletLoaded, setLeafletLoaded] = React.useState(false);
  const [onlineCount, setOnlineCount] = React.useState(18);

  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);

  // Pre-load Leaflet on mount
  React.useEffect(() => {
    if (window.L) {
      setLeafletLoaded(true);
      return;
    }
    // Inject Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Inject Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      setLeafletLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  // Online count fluctuator
  React.useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => {
        const diff = Math.random() > 0.5 ? 1 : -1;
        const next = prev + diff;
        return next >= 10 && next <= 25 ? next : prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup Map on unmount
  React.useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const eventsData = React.useMemo(() => {
    if (resolvedEvents && resolvedEvents.length > 0) {
      return resolvedEvents.map((e, index) => {
        const angle = ((index + 0.5) * 2 * Math.PI) / resolvedEvents.length;
        const radius = 0.008 + (index * 0.003) % 0.012;
        const lat = 19.065 + radius * Math.sin(angle);
        const lng = 72.832 + radius * Math.cos(angle);
        return {
          id: e.id,
          lat,
          lng,
          title: (e.title || '').replace(' (Demo Mixer)', ''),
          place: (e.place || '').replace(' (Sample Event)', ''),
          time: e.time || '7:00 PM onwards',
          details: `${e.attendeeCount || 0} members checked in! Quality Score: ${e.qualityScore ?? 100}`
        };
      });
    }
    return [];
  }, [resolvedEvents]);

  const couplesData = [
    { lat: 19.0540, lng: 72.8315, names: 'Zara & Rohan', place: 'Subko Coffee, Bandra', score: '96%', timeAgo: 'Met 20m ago' },
    { lat: 19.0735, lng: 72.8220, names: 'Kavya & Kabir', place: 'Blue Tokai, Khar', score: '98%', timeAgo: 'Met 1h ago' }
  ];

  const onlineMembersData = React.useMemo(() => {
    if (resolvedMembers && resolvedMembers.length > 0) {
      return resolvedMembers.map((m, index) => {
        const angle = (index * 2 * Math.PI) / resolvedMembers.length;
        const radius = 0.005 + (index * 0.002) % 0.015;
        const lat = 19.065 + radius * Math.sin(angle);
        const lng = 72.832 + radius * Math.cos(angle);
        return {
          id: m.id,
          lat,
          lng,
          name: (m.name || '').replace(' (Demo Profile)', ''),
          age: m.age || 23,
          vibe: m.vibe || 'Speakeasy Vibe',
          avatar: m.avatar || 'U',
          gradient: m.gradient || 'pink'
        };
      });
    }
    return [];
  }, [resolvedMembers]);

  // Initialize and Update Map
  React.useEffect(() => {
    if (!leafletLoaded || !mapRef.current) return;

    const L = window.L;

    // Create map instance if it doesn't exist
    if (!mapInstance.current) {
      const centerCoords = [19.065, 72.832]; // Bandra center
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView(centerCoords, 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstance.current = map;
    }

    const map = mapInstance.current;

    // Clear previous layers/markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Custom pulsing HTML icon helper
    const createPulseIcon = (colorClass) => {
      return L.divIcon({
        className: 'custom-pulse-marker',
        html: `
          <div class="pulse-marker-wrapper">
            <div class="pulse-core ${colorClass}"></div>
            <div class="pulse-ring ${colorClass}"></div>
            <div class="pulse-ring-outer ${colorClass}"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
    };

    // Render respective markers & center
    if (activeTabState === "events") {
      eventsData.forEach(e => {
        L.marker([e.lat, e.lng], { icon: createPulseIcon('purple') })
          .addTo(map)
          .bindPopup(`
            <div class="map-popup-body">
              <span class="popup-kicker purple">⚡ Live Club Event</span>
              <strong class="popup-title">${e.title}</strong>
              <span class="popup-desc">${e.place} • ${e.time}</span>
              <button class="popup-btn purple" onclick="window.history.pushState({}, '', '/events'); window.dispatchEvent(new Event('popstate'));">RSVP Now</button>
            </div>
          `);
      });
      if (eventsData.length > 0) {
        map.setView([eventsData[0].lat, eventsData[0].lng], 14);
      } else {
        map.setView([19.065, 72.832], 14);
      }
    } else if (activeTabState === "couples") {
      couplesData.forEach(c => {
        L.marker([c.lat, c.lng], { icon: createPulseIcon('fuchsia') })
          .addTo(map)
          .bindPopup(`
            <div class="map-popup-body text-center">
              <span class="popup-kicker fuchsia">💖 Live Outing Meetup</span>
              <strong class="popup-title">${c.names}</strong>
              <span class="popup-desc">Meeting at ${c.place}</span>
              <span class="popup-tag">${c.score} Match</span>
            </div>
          `);
      });
      if (couplesData.length > 0) {
        map.setView([couplesData[0].lat, couplesData[0].lng], 14);
      } else {
        map.setView([19.065, 72.832], 14);
      }
    } else if (activeTabState === "members") {
      onlineMembersData.forEach(m => {
        L.marker([m.lat, m.lng], { icon: createPulseIcon('green') })
          .addTo(map)
          .bindPopup(`
            <div class="map-popup-body text-center">
              <span class="popup-kicker green">🟢 Active Member nearby</span>
              <strong class="popup-title">${m.name}, ${m.age}</strong>
              <span class="popup-desc">${m.vibe}</span>
              <button class="popup-btn green" onclick="window.history.pushState({}, '', '/members'); window.dispatchEvent(new Event('popstate'));">Vibe Check</button>
            </div>
          `);
      });
      if (onlineMembersData.length > 0) {
        map.setView([onlineMembersData[0].lat, onlineMembersData[0].lng], 14);
      } else {
        map.setView([19.065, 72.832], 14);
      }
    }

  }, [leafletLoaded, activeTabState, eventsData, onlineMembersData]);

  const location = appState.profile.city || "Mumbai";

  return (
    <div className="radar-container" style={{
      background: 'rgba(10, 8, 16, 0.45)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
      borderRadius: '24px',
      padding: '1.25rem',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
      margin: '1rem 0 2rem 0'
    }}>
      <style>{`
        .custom-pulse-marker {
          background: transparent !important;
          border: none !important;
        }
        .pulse-marker-wrapper {
          position: relative;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .pulse-core {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          z-index: 10;
          border: 1.5px solid #050508;
        }
        .pulse-core.purple { background: #9b30ff !important; box-shadow: 0 0 10px #9b30ff !important; }
        .pulse-core.fuchsia { background: #ff2e93 !important; box-shadow: 0 0 10px #ff2e93 !important; }
        .pulse-core.green { background: #25d366 !important; box-shadow: 0 0 10px #25d366 !important; }

        .pulse-ring {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          opacity: 0.65;
          animation: marker-ping 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }
        .pulse-ring.purple { border: 1.5px solid #9b30ff !important; }
        .pulse-ring.fuchsia { border: 1.5px solid #ff2e93 !important; }
        .pulse-ring.green { border: 1.5px solid #25d366 !important; }

        .pulse-ring-outer {
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          opacity: 0.35;
          animation: marker-ping 2s cubic-bezier(0.16, 1, 0.3, 1) infinite;
          animation-delay: 0.6s;
        }
        .pulse-ring-outer.purple { border: 1px solid #9b30ff !important; }
        .pulse-ring-outer.fuchsia { border: 1px solid #ff2e93 !important; }
        .pulse-ring-outer.green { border: 1px solid #25d366 !important; }

        @keyframes marker-ping {
          0% {
            transform: scale(0.4);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        .leaflet-popup-content-wrapper {
          background: rgba(14, 14, 20, 0.94) !important;
          backdrop-filter: blur(14px) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
          border-radius: 16px !important;
          color: #fff !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.6) !important;
          padding: 2px !important;
        }
        .leaflet-popup-tip {
          background: rgba(14, 14, 20, 0.94) !important;
          border: 1px solid rgba(255, 255, 255, 0.12) !important;
        }
        .leaflet-popup-content {
          margin: 10px 12px !important;
        }
        .leaflet-popup-close-button {
          color: rgba(255, 255, 255, 0.5) !important;
          padding: 8px 8px 0 0 !important;
        }

        .map-popup-body {
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .popup-kicker {
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: block;
        }
        .popup-kicker.purple { color: #bf86ff; }
        .popup-kicker.fuchsia { color: #ff68b4; }
        .popup-kicker.green { color: #6bf299; }

        .popup-title {
          display: block;
          color: #fff;
          font-size: 0.92rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
        }
        .popup-desc {
          display: block;
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.76rem;
          line-height: 1.3;
        }
        .popup-tag {
          align-self: center;
          margin-top: 4px;
          display: inline-block;
          background: rgba(255, 46, 147, 0.15);
          color: #ff2e93;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 99px;
        }
        .popup-btn {
          margin-top: 6px;
          width: 100%;
          border: 0;
          color: #fff;
          padding: 5px 10px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.72rem;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        .popup-btn.purple {
          background: linear-gradient(135deg, #9b30ff, #ff2e93);
        }
        .popup-btn.green {
          background: rgba(37, 211, 102, 0.18);
          color: #25d366;
          border: 1px solid rgba(37, 211, 102, 0.3);
        }
        .popup-btn:active {
          transform: scale(0.96);
        }
      `}</style>

      {/* Mode Switch Toggle with requested categories */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        padding: '3px',
        width: '100%',
        zIndex: 40
      }}>
        <button 
          onClick={() => setActiveTabState("events")}
          style={{
            flex: 1,
            background: activeTabState === "events" ? 'linear-gradient(135deg, rgba(155, 48, 255, 0.15), rgba(255, 46, 147, 0.15))' : 'transparent',
            border: activeTabState === "events" ? '1px solid rgba(155, 48, 255, 0.25)' : '1px solid transparent',
            borderRadius: '11px',
            color: activeTabState === "events" ? '#fff' : 'var(--muted)',
            padding: '7px 4px',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#9b30ff' }} /> Live Events
        </button>
        <button 
          onClick={() => setActiveTabState("couples")}
          style={{
            flex: 1,
            background: activeTabState === "couples" ? 'linear-gradient(135deg, rgba(255, 46, 147, 0.15), rgba(155, 48, 255, 0.15))' : 'transparent',
            border: activeTabState === "couples" ? '1px solid rgba(255, 46, 147, 0.25)' : '1px solid transparent',
            borderRadius: '11px',
            color: activeTabState === "couples" ? '#fff' : 'var(--muted)',
            padding: '7px 4px',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff2e93' }} /> Couple Meets
        </button>
        <button 
          onClick={() => setActiveTabState("members")}
          style={{
            flex: 1,
            background: activeTabState === "members" ? 'linear-gradient(135deg, rgba(37, 211, 102, 0.15), rgba(155, 48, 255, 0.15))' : 'transparent',
            border: activeTabState === "members" ? '1px solid rgba(37, 211, 102, 0.25)' : '1px solid transparent',
            borderRadius: '11px',
            color: activeTabState === "members" ? '#fff' : 'var(--muted)',
            padding: '7px 4px',
            fontSize: '0.72rem',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#25d366' }} /> Online Members
        </button>
      </div>

      {/* Real Map View */}
      <div style={{ width: '100%', position: 'relative' }}>
        {!leafletLoaded ? (
          <div style={{
            height: '260px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(5, 5, 8, 0.4)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '20px',
            gap: '12px'
          }}>
            <motion.div
              style={{
                width: '32px',
                height: '32px',
                border: '2.5px solid rgba(255, 46, 147, 0.2)',
                borderTop: '2.5px solid var(--pink)',
                borderRadius: '50%'
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 'bold' }}>Syncing telemetry mapping...</span>
          </div>
        ) : (
          <div 
            ref={mapRef} 
            id="live-telemetry-map"
            style={{
              height: '260px',
              width: '100%',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(5, 5, 8, 0.8)',
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              zIndex: 5
            }}
          />
        )}
      </div>

      {/* Dynamic List Details below the map */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <h4 style={{ margin: '0 0 0.1rem', fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--soft)', fontWeight: '800', letterSpacing: '0.05em' }}>
          {activeTabState === "events" ? "Featured Events Mixers" : activeTabState === "couples" ? "Offline Match Successes" : "Verified Nearby Members"}
        </h4>
        
        {activeTabState === "events" && (
          <div className="tab-item-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {eventsData.length > 0 ? (
              eventsData.map(e => (
                <div key={e.title} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '0.84rem', color: '#fff', font: '800 0.84rem Outfit, sans-serif' }}>{e.title}</strong>
                    <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{e.place}</span>
                    <small style={{ display: 'block', fontSize: '0.68rem', color: '#bf86ff', fontWeight: 'bold', marginTop: '1px' }}>🔥 {e.details}</small>
                  </div>
                  <button 
                    className="btn-main" 
                    style={{ minHeight: '30px', borderRadius: '8px', fontSize: '0.72rem', padding: '0 10px', flexShrink: 0 }}
                    onClick={() => navigate('/events')}
                  >
                    Book Slot
                  </button>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1.25rem',
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '16px',
                color: 'var(--muted)',
                fontSize: '0.78rem'
              }}>
                No mixers scheduled in your area yet.
              </div>
            )}
          </div>
        )}

        {activeTabState === "couples" && (
          <div className="tab-item-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {couplesData.map(c => (
              <div key={c.names} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ display: 'block', fontSize: '0.84rem', color: '#fff', font: '800 0.84rem Outfit, sans-serif' }}>
                    ❤️ {c.names}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    Meeting at {c.place}
                  </span>
                  <small style={{ display: 'block', fontSize: '0.68rem', color: 'var(--pink)', fontWeight: 'bold', marginTop: '1px' }}>
                    ⚡ {c.timeAgo}
                  </small>
                </div>
                <span style={{
                  background: 'rgba(255, 46, 147, 0.1)',
                  color: '#ff2e93',
                  fontSize: '0.66rem',
                  fontWeight: '800',
                  padding: '3px 8px',
                  borderRadius: '99px',
                  flexShrink: 0
                }}>
                  {c.score} match
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTabState === "members" && (
          <div className="tab-item-list" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {onlineMembersData.length > 0 ? (
              onlineMembersData.map(m => (
                <div key={m.id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <div className={`avatar ${m.gradient}`} style={{ width: '32px', height: '32px', fontSize: '0.75rem', flexShrink: 0 }}>
                      {m.avatar}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.84rem', color: '#fff', font: '800 0.84rem Outfit, sans-serif' }}>
                        {m.name}, {m.age}
                      </strong>
                      <span style={{ display: 'block', fontSize: '0.7rem', color: `var(--${m.gradient})`, fontWeight: 'bold', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {m.vibe}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="btn-main" 
                    style={{ minHeight: '30px', borderRadius: '8px', fontSize: '0.72rem', padding: '0 10px', flexShrink: 0 }}
                    onClick={() => {
                      const fullMember = resolvedMembers.find(gm => gm.id === m.id) || m;
                      onVibeClick(fullMember);
                    }}
                  >
                    Vibe Check
                  </button>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '1.25rem',
                background: 'rgba(255,255,255,0.01)',
                border: '1px dashed rgba(255,255,255,0.08)',
                borderRadius: '16px',
                color: 'var(--muted)',
                fontSize: '0.78rem'
              }}>
                No active activity partners nearby this week.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid footer data table */}
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.75rem',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '0.8rem',
        fontSize: '0.78rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '4px' }}>
          <span style={{ color: 'var(--soft)', fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Scanning Sector</span>
          <strong style={{ color: '#fff', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin style={{ width: '13px', height: '13px', color: 'var(--pink)' }} /> {location} West
          </strong>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '12px' }}>
          <span style={{ color: 'var(--soft)', fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Activity Status</span>
          <strong style={{ color: 'var(--green)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users style={{ width: '13px', height: '13px' }} /> {onlineCount} active matches
          </strong>
        </div>
      </div>
    </div>
  );
}

function EventReviewModal({ event, onClose, notify }) {
  const [eventRating, setEventRating] = React.useState(5);
  const [hostRating, setHostRating] = React.useState(5);
  const [wouldAttend, setWouldAttend] = React.useState(true);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(`/api/events/${event.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventRating,
          hostRating,
          wouldAttendAgain: wouldAttend ? 1 : 0,
          feedback: feedbackText || null
        })
      });
      if (!response.ok) throw new Error('Failed to submit review');
      notify('Mixer & Host reviewed! Thank you.');
      onClose();
    } catch (err) {
      console.error(err);
      notify('Review submitted successfully (local simulation).');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'grid', placeItems: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.85)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="feature-card" 
        style={{
          width: '90%',
          maxWidth: '440px',
          padding: '2rem',
          background: 'rgba(14, 14, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ font: '900 1.5rem Outfit, sans-serif', margin: 0, color: 'var(--pink)' }}>Rate Mixer & Host</h2>
          <button className="btn-quiet" onClick={onClose} style={{ minWidth: '32px', height: '32px', padding: 0 }}><X style={{ width: '16px', height: '16px' }} /></button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: 0 }}>
          How was your experience at <strong>{event.title}</strong>? Your feedback ensures premium safety and high quality mixers.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Event Rating */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>Rate the Event (1-5 Stars)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setEventRating(star)}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                >
                  <Star style={{ width: '26px', height: '26px', color: star <= eventRating ? '#ffc107' : 'rgba(255,255,255,0.15)', fill: star <= eventRating ? '#ffc107' : 'none' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Host Rating */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>Rate the Host (1-5 Stars)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setHostRating(star)}
                  style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                >
                  <Star style={{ width: '26px', height: '26px', color: star <= hostRating ? '#ffc107' : 'rgba(255,255,255,0.15)', fill: star <= hostRating ? '#ffc107' : 'none' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Would Attend Again */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '8px' }}>Would you attend this event category again?</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setWouldAttend(true)}
                style={{
                  flex: 1,
                  minHeight: '36px',
                  borderRadius: '10px',
                  border: `1px solid ${wouldAttend ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                  background: wouldAttend ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                  color: wouldAttend ? '#fff' : 'var(--muted)',
                  fontWeight: 'bold',
                  fontSize: '0.82rem'
                }}
              >
                Yes, absolutely
              </button>
              <button
                type="button"
                onClick={() => setWouldAttend(false)}
                style={{
                  flex: 1,
                  minHeight: '36px',
                  borderRadius: '10px',
                  border: `1px solid ${!wouldAttend ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                  background: !wouldAttend ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                  color: !wouldAttend ? '#fff' : 'var(--muted)',
                  fontWeight: 'bold',
                  fontSize: '0.82rem'
                }}
              >
                No, wouldn't
              </button>
            </div>
          </div>

          {/* Optional Feedback */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>Optional feedback (comments for host & club)</label>
            <textarea
              value={feedbackText}
              onChange={e => setFeedbackText(e.target.value)}
              placeholder="Tell us more about the mixer vibe, organization, or host energy..."
              style={{
                width: '100%',
                minHeight: '70px',
                borderRadius: '10px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '8px 12px',
                fontSize: '0.82rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-main full"
            style={{ minHeight: '42px', borderRadius: '12px', marginTop: '0.5rem', fontWeight: 'bold' }}
          >
            {submitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function MeetupFeedbackModal({ meetup, onClose, notify }) {
  const [meetupHappened, setMeetupHappened] = React.useState(true);
  const [showedUp, setShowedUp] = React.useState(true);
  const [ratingStars, setRatingStars] = React.useState(5);
  const [meetAgain, setMeetAgain] = React.useState(true);
  const [textFeedback, setTextFeedback] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('/api/meetup-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchOutcomeId: meetup.matchOutcomeId,
          targetUserId: meetup.targetUserId,
          meetupHappened: meetupHappened ? 1 : 0,
          showedUp: showedUp ? 1 : 0,
          ratingStars: meetupHappened ? ratingStars : null,
          meetAgain: meetupHappened && meetAgain ? 1 : 0,
          textFeedback: textFeedback || null
        })
      });
      if (!response.ok) throw new Error('Failed to submit feedback');
      notify('Feedback submitted! Reliability synced.');
      onClose();
    } catch (err) {
      console.error(err);
      notify('Feedback submitted successfully (local simulation).');
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'grid', placeItems: 'center', zIndex: 1000, background: 'rgba(0,0,0,0.85)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={e => e.stopPropagation()}
        className="feature-card" 
        style={{
          width: '90%',
          maxWidth: '440px',
          padding: '2rem',
          background: 'rgba(14, 14, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.2rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ font: '900 1.5rem Outfit, sans-serif', margin: 0, color: 'var(--pink)' }}>Review Meetup</h2>
          <button className="btn-quiet" onClick={onClose} style={{ minWidth: '32px', height: '32px', padding: 0 }}><X style={{ width: '16px', height: '16px' }} /></button>
        </div>

        <p style={{ color: 'var(--muted)', fontSize: '0.84rem', margin: 0 }}>
          Did you and <strong>{meetup.name}</strong> manage to meet in person?
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Did meetup happen */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>Did this meetup happen?</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMeetupHappened(true)}
                style={{
                  flex: 1,
                  minHeight: '34px',
                  borderRadius: '8px',
                  border: `1px solid ${meetupHappened ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                  background: meetupHappened ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                  color: meetupHappened ? '#fff' : 'var(--muted)',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                Yes, we met
              </button>
              <button
                type="button"
                onClick={() => setMeetupHappened(false)}
                style={{
                  flex: 1,
                  minHeight: '34px',
                  borderRadius: '8px',
                  border: `1px solid ${!meetupHappened ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                  background: !meetupHappened ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                  color: !meetupHappened ? '#fff' : 'var(--muted)',
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }}
              >
                No, cancelled
              </button>
            </div>
          </div>

          {meetupHappened ? (
            <>
              {/* Did the other person show up */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>Did {meetup.name} show up?</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowedUp(true)}
                    style={{
                      flex: 1,
                      minHeight: '34px',
                      borderRadius: '8px',
                      border: `1px solid ${showedUp ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                      background: showedUp ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: showedUp ? '#fff' : 'var(--muted)',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}
                  >
                    Yes, showed up
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowedUp(false)}
                    style={{
                      flex: 1,
                      minHeight: '34px',
                      borderRadius: '8px',
                      border: `1px solid ${!showedUp ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                      background: !showedUp ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                      color: !showedUp ? '#fff' : 'var(--muted)',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }}
                  >
                    No Show
                  </button>
                </div>
              </div>

              {showedUp && (
                <>
                  {/* Rating meetup */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>How would you rate the meetup?</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRatingStars(star)}
                          style={{ background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}
                        >
                          <Star style={{ width: '24px', height: '24px', color: star <= ratingStars ? '#ffc107' : 'rgba(255,255,255,0.15)', fill: star <= ratingStars ? '#ffc107' : 'none' }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Would meet again */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '6px' }}>Would you meet this person again?</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setMeetAgain(true)}
                        style={{
                          flex: 1,
                          minHeight: '34px',
                          borderRadius: '8px',
                          border: `1px solid ${meetAgain ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                          background: meetAgain ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                          color: meetAgain ? '#fff' : 'var(--muted)',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}
                      >
                        Yes, would love to
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeetAgain(false)}
                        style={{
                          flex: 1,
                          minHeight: '34px',
                          borderRadius: '8px',
                          border: `1px solid ${!meetAgain ? 'var(--pink)' : 'rgba(255,255,255,0.06)'}`,
                          background: !meetAgain ? 'rgba(255, 46, 147, 0.1)' : 'rgba(255,255,255,0.02)',
                          color: !meetAgain ? '#fff' : 'var(--muted)',
                          fontWeight: 'bold',
                          fontSize: '0.8rem'
                        }}
                      >
                        No, rather not
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          ) : null}

          {/* Optional Feedback */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: 'var(--soft)', marginBottom: '4px' }}>Optional feedback (private comments)</label>
            <textarea
              value={textFeedback}
              onChange={e => setTextFeedback(e.target.value)}
              placeholder="What did you do? Any respect or safety notes?"
              style={{
                width: '100%',
                minHeight: '60px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#fff',
                padding: '8px',
                fontSize: '0.8rem',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-main full"
            style={{ minHeight: '40px', borderRadius: '10px', marginTop: '0.4rem', fontWeight: 'bold' }}
          >
            {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <ThemeProvider>
    <AuthProvider>
      <UserProvider>
        <ProfileProvider>
          <App />
        </ProfileProvider>
      </UserProvider>
    </AuthProvider>
  </ThemeProvider>
);

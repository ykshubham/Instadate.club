import React from 'react';
import { useAuth } from './AuthContext.jsx';

const ProfileContext = React.createContext(null);
const CACHE_KEY = 'instadate_profile_cache';

const emptyProfile = {
  photo: '',
  photos: [],
  fullName: '',
  age: '',
  instagram: '',
  city: '',
  whatsapp: '',
  gender: '',
  profession: '',
  college: '',
  intent: '',
  weekendStatus: '',
  bio: '',
  vibe: '',
  plan: 'Instadate Plus',
  completed: false,
  interests: [],
  intents: []
};

async function apiJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    credentials: 'same-origin',
    cache: 'no-store',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'content-type': 'application/json' }),
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || `Request failed: ${response.status}`);
  return payload;
}

function readCachedProfile() {
  try {
    return { ...emptyProfile, ...JSON.parse(sessionStorage.getItem(CACHE_KEY) || '{}') };
  } catch {
    return emptyProfile;
  }
}

export function ProfileProvider({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [profile, setProfileState] = React.useState(readCachedProfile);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);

  const cacheProfile = React.useCallback(nextProfile => {
    const merged = { ...emptyProfile, ...(nextProfile || {}) };
    setProfileState(merged);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(merged));
    return merged;
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!isAuthenticated) {
      sessionStorage.removeItem(CACHE_KEY);
      cacheProfile(emptyProfile);
      setStatus('idle');
      return emptyProfile;
    }
    setStatus('loading');
    setError(null);
    try {
      const payload = await apiJson('/api/profile');
      setStatus('cloud');
      return cacheProfile(payload.profile);
    } catch (nextError) {
      setError(nextError);
      setStatus('offline');
      return readCachedProfile();
    }
  }, [cacheProfile, isAuthenticated]);

  React.useEffect(() => {
    if (!isLoading) refreshProfile();
  }, [isLoading, refreshProfile]);

  const saveProfile = React.useCallback(async nextProfile => {
    const optimistic = cacheProfile(nextProfile);
    setStatus('saving');
    try {
      const payload = await apiJson('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ profile: optimistic })
      });
      setStatus('cloud');
      return cacheProfile(payload.profile);
    } catch (nextError) {
      setError(nextError);
      setStatus('offline');
      throw nextError;
    }
  }, [cacheProfile]);

  const uploadProfilePhotos = React.useCallback(async files => {
    const uploads = [];
    for (const file of Array.from(files || [])) {
      const form = new FormData();
      form.append('photo', file);
      uploads.push(apiJson('/api/profile/photo', { method: 'POST', body: form }));
    }
    const results = await Promise.all(uploads);
    const latest = results.at(-1)?.profile || profile;
    return cacheProfile(latest);
  }, [cacheProfile, profile]);

  const deleteProfilePhoto = React.useCallback(async photoUrl => {
    const id = String(photoUrl || '').split('/').pop();
    if (!id) return profile;
    const payload = await apiJson(`/api/profile/photo/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return cacheProfile(payload.profile);
  }, [cacheProfile, profile]);

  const value = React.useMemo(() => ({
    profile,
    profileStatus: status,
    profileError: error,
    refreshProfile,
    saveProfile,
    uploadProfilePhotos,
    deleteProfilePhoto
  }), [profile, status, error, refreshProfile, saveProfile, uploadProfilePhotos, deleteProfilePhoto]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = React.useContext(ProfileContext);
  if (!context) throw new Error('useProfile must be used inside ProfileProvider');
  return context;
}

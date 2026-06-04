import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarCheck, Camera, CheckCircle2,
  ChevronRight, Crown, Gem, HeartHandshake, Lock, MapPin, MessageCircle,
  ShieldCheck, Sparkles, Star, Ticket, UserCheck, Users, WandSparkles, X, Zap, Mail, Plus
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext.jsx';
import { useProfile } from './contexts/ProfileContext.jsx';

const COUNTRY_CODES = ['+91', '+1', '+44', '+61', '+971', '+65'];

// --- Onboarding persistence keys -------------------------------------------
// The draft (form fields) AND the current step index are mirrored to
// localStorage so progress survives full-page reloads and, critically, the
// Google OAuth redirect — which tears down and re-mounts the whole React app.
const DRAFT_KEY = 'onboarding_draft';
const STEP_KEY = 'onboarding_step';
const LAST_STEP = 12; // highest valid slide index (0-based; 13 slides total)

// Lightweight, filterable diagnostics. ON by default during the friends-beta;
// silence with localStorage.setItem('onboarding_debug', '0').
const ONB_DEBUG = (() => {
  try { return localStorage.getItem('onboarding_debug') !== '0'; } catch { return false; }
})();
function onbLog(event, data) {
  if (!ONB_DEBUG) return;
  // eslint-disable-next-line no-console
  console.info(`[onboarding] ${event}`, data === undefined ? '' : data);
}

const slides = [
  {
    eyebrow: 'Social life on demand',
    title: 'Never do things alone unless you want to.',
    text: 'Find people for movies, coffee, pickleball, trips, events, and whatever you are doing next.',
    image: '/onboarding_couple.png',
    accent: 'from-[#ff2e93] via-[#a855f7] to-[#00d7f5]',
    primary: 'Start the club pass',
    chips: ['Verified people', 'Activity first', 'Plans today'],
    stats: [
      ['32', 'Coffee plans'],
      ['14', 'Players nearby'],
      ['Today', 'Instant plans']
    ],
    visual: 'hero'
  },
  {
    eyebrow: 'How it works',
    title: 'Choose the activity. Find the people.',
    text: 'Dating apps start with who you like. Instadate starts with what you want to do right now.',
    accent: 'from-cyan-300 via-fuchsia-300 to-violet-400',
    primary: 'Continue',
    steps: [
      ['Verify', 'Photos, Instagram, and identity signals are checked.', ShieldCheck],
      ['Pick', 'Coffee today, movie tonight, or a Sunday road trip.', WandSparkles],
      ['Connect', 'Find people already interested instead of persuading friends.', MessageCircle],
      ['Meet', 'Move into group plans, cafes, events, and activity circles.', CalendarCheck]
    ],
    visual: 'timeline'
  },
  {
    eyebrow: 'Trust layer',
    title: 'Why verification matters',
    text: 'Events are just the vehicle. Instadate shows people, vibe, interests, and social context first.',
    accent: 'from-emerald-300 via-cyan-300 to-fuchsia-300',
    primary: 'Continue',
    trust: [
      ['Identity check', 'Active', ShieldCheck],
      ['Selfie check', 'Ready', Camera],
      ['Voice gate', 'Locked', Lock],
      ['Report flow', 'One tap', BadgeCheck]
    ],
    visual: 'trust'
  }
];

const slideMotion = {
  enter: direction => ({ x: direction > 0 ? 56 : -56, opacity: 0, scale: 0.98 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: direction => ({ x: direction > 0 ? -56 : 56, opacity: 0, scale: 0.98 })
};

const spring = { type: 'spring', stiffness: 280, damping: 30 };

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function OnboardingFlow({ onExplore, onComplete }) {
  const {
    user: authUser,
    isAuthenticated,
    startPhoneOtp,
    verifyPhoneOtp,
    startEmailMagicLink,
    signIn
  } = useAuth();
  
  const {
    profile: cloudProfile,
    saveProfile: saveCloudProfile,
    uploadProfilePhotos,
    deleteProfilePhoto
  } = useProfile();

  // Restore the saved step synchronously on first render so an OAuth return (or
  // any reload) lands on the step the user left from — never a flash of step 1.
  const [index, setIndex] = React.useState(() => {
    try {
      const saved = parseInt(localStorage.getItem(STEP_KEY) ?? '', 10);
      if (Number.isInteger(saved) && saved >= 0 && saved <= LAST_STEP) return saved;
    } catch { /* ignore */ }
    return 0;
  });
  const [direction, setDirection] = React.useState(1);
  const [draft, setDraft] = React.useState(() => {
    try {
      const local = localStorage.getItem(DRAFT_KEY);
      return local ? JSON.parse(local) : {};
    } catch {
      return {};
    }
  });

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [info, setInfo] = React.useState('');
  
  // States for step components
  const [phoneStage, setPhoneStage] = React.useState('phone'); // 'phone' | 'code'
  const [countryCode, setCountryCode] = React.useState('+91');
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [cooldown, setCooldown] = React.useState(0);
  const [emailStage, setEmailStage] = React.useState('input'); // 'input' | 'sent'
  const [email, setEmail] = React.useState('');
  const [magicLinkUrl, setMagicLinkUrl] = React.useState('');
  
  const [completionPercent, setCompletionPercent] = React.useState(0);

  const shellRef = React.useRef(null);
  
  // Timer for cooldown
  React.useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Mirror the current step to localStorage on every change so a reload or the
  // Google OAuth redirect resumes exactly here. Also our primary diagnostic.
  React.useEffect(() => {
    try { localStorage.setItem(STEP_KEY, String(index)); } catch { /* ignore */ }
    onbLog('step', { index });
  }, [index]);

  // GSAP animation for background decorative lines
  React.useEffect(() => {
    if (!shellRef.current) return undefined;
    const beams = shellRef.current.querySelectorAll('[data-beam]');
    const ctx = gsap.context(() => {
      gsap.to(beams, {
        xPercent: 24,
        opacity: 0.75,
        duration: 3.8,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.35
      });
    }, shellRef);
    return () => ctx.revert();
  }, []);

  // Sync draft local storage and server draft persistence
  const updateDraft = React.useCallback(async (updatedFields) => {
    const nextDraft = { ...draft, ...updatedFields };
    setDraft(nextDraft);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(nextDraft));

    if (isAuthenticated) {
      try {
        const patchData = {
          fullName: nextDraft.fullName,
          age: nextDraft.age,
          gender: nextDraft.gender,
          city: nextDraft.city,
          whatsapp: nextDraft.phone,
          profession: nextDraft.profession,
          college: nextDraft.college,
          bio: nextDraft.bio,
          intent: nextDraft.intent,
          preferred_gender: nextDraft.preferred_gender,
          min_age: nextDraft.min_age,
          max_age: nextDraft.max_age,
          preferred_distance_km: nextDraft.preferred_distance_km,
          onboarding_step: index
        };
        const response = await saveCloudProfile(patchData);
        if (response?.completionPercent != null) {
          setCompletionPercent(response.completionPercent);
        }
      } catch (err) {
        console.warn('Silent onboarding draft sync failed:', err);
      }
    }
  }, [draft, isAuthenticated, index, saveCloudProfile]);

  // Server Resume Logic (ONB-FE-04). The locally-restored `index` already
  // reflects this device's progress; the server step lets a *different* device
  // resume too. We only ever move forward (max of the two), never backward.
  React.useEffect(() => {
    if (isAuthenticated && authUser) {
      const serverStep = Number.isInteger(authUser.onboardingStep) ? authUser.onboardingStep : 0;
      onbLog('resume', {
        localStep: index,
        serverStep,
        authProvider: authUser.authProvider,
        hasCloudProfile: Boolean(cloudProfile)
      });
      // If server has progressed further than local slide index, resume from there.
      // Clamp to LAST_STEP: a completed account stores the sentinel 13, which would
      // otherwise index past stepHeaders[] and crash the view (reading 'eyebrow').
      const target = Math.min(serverStep, LAST_STEP);
      if (target > index) {
        onbLog('resume:advance', { from: index, to: target, rawServerStep: serverStep });
        setIndex(target);
      }
      
      // Seed default draft from cloud profile if available
      if (cloudProfile) {
        setDraft(prev => ({
          ...prev,
          fullName: prev.fullName || cloudProfile.fullName || '',
          age: prev.age || cloudProfile.age || '',
          gender: prev.gender || cloudProfile.gender || '',
          phone: prev.phone || cloudProfile.whatsapp || '',
          city: prev.city || cloudProfile.city || '',
          profession: prev.profession || cloudProfile.profession || '',
          college: prev.college || cloudProfile.college || '',
          bio: prev.bio || cloudProfile.bio || '',
          intent: prev.intent || cloudProfile.intent || '',
          preferred_gender: prev.preferred_gender || cloudProfile.preferred_gender || 'All',
          min_age: prev.min_age || cloudProfile.min_age || 18,
          max_age: prev.max_age || cloudProfile.max_age || 40,
          preferred_distance_km: prev.preferred_distance_km || cloudProfile.preferred_distance_km || 50
        }));
      }
    }
  }, [isAuthenticated, authUser, cloudProfile]);

  // Dynamic Navigation & Validation gates (ONB-FE-07)
  const validationGate = () => {
    setError('');
    
    // Step 4: Auth (Must be logged in)
    if (index === 3 && !isAuthenticated) {
      setError('Please sign in or continue as guest to advance.');
      return false;
    }
    // Step 5: Phone OTP — OPTIONAL for friends beta (no SMS provider configured).
    // Relaxed so Google users can finish onboarding; phone step is skippable.
    // Step 6: Basics (fullName, age, gender)
    if (index === 5) {
      if (!draft.fullName?.trim()) {
        setError('Please enter your full name.');
        return false;
      }
      const ageVal = parseInt(draft.age, 10);
      if (isNaN(ageVal) || ageVal < 18) {
        setError('You must be 18 or older to join Instadate.');
        return false;
      }
      if (!draft.gender) {
        setError('Please select your gender.');
        return false;
      }
    }
    // Step 7: Photos (>= 1 photo)
    if (index === 6) {
      const photos = cloudProfile?.photos || [];
      if (photos.length < 1) {
        setError('Please upload at least one photo.');
        return false;
      }
    }
    // Step 9: Intent (intent)
    if (index === 8 && !draft.intent) {
      setError('Dating intention is mandatory for matches.');
      return false;
    }
    // Step 11: City (city text)
    if (index === 10 && !draft.city?.trim()) {
      setError('City location is mandatory.');
      return false;
    }

    return true;
  };

  const goTo = (nextIndex) => {
    if (nextIndex < 0 || nextIndex > LAST_STEP || nextIndex === index) return;

    // Validate forward navigation
    if (nextIndex > index) {
      for (let i = index; i < nextIndex; i++) {
        if (!validationGate()) {
          onbLog('nav:blocked', { from: index, to: nextIndex, atGate: i });
          return;
        }
      }
    }

    onbLog('nav', { from: index, to: nextIndex });
    setDirection(nextIndex > index ? 1 : -1);
    setIndex(nextIndex);
    setError('');
    setInfo('');
  };

  const next = async () => {
    if (!validationGate()) return;

    if (index === LAST_STEP) {
      // Complete flow
      setBusy(true);
      try {
        if (isAuthenticated) {
          // Final cloud save setting completed to true
          await saveCloudProfile({
            fullName: draft.fullName,
            age: draft.age,
            gender: draft.gender,
            city: draft.city,
            whatsapp: draft.phone,
            profession: draft.profession,
            college: draft.college,
            bio: draft.bio,
            intent: draft.intent,
            preferred_gender: draft.preferred_gender,
            min_age: draft.min_age,
            max_age: draft.max_age,
            preferred_distance_km: draft.preferred_distance_km,
            completed: true,
            onboarding_step: 13
          });
        }
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(STEP_KEY);
        onbLog('complete', { finalStep: index });
        onComplete?.();
      } catch (err) {
        setError(err.message || 'Verification save failed.');
      } finally {
        setBusy(false);
      }
      return;
    }

    goTo(index + 1);
  };

  const back = () => {
    goTo(index - 1);
  };

  // OTP Handling Functions
  const sendCode = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      const res = await startPhoneOtp(phone, countryCode);
      setPhoneStage('code');
      setCooldown(30);
      setInfo(res?.devCode ? `Dev code: ${res.devCode}` : 'Code sent. Check your messages.');
    } catch (e) {
      setError(e.message || 'OTP Send Failed');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    setError(''); setBusy(true);
    try {
      await verifyPhoneOtp(phone, code, countryCode);
      await updateDraft({ phone: `${countryCode}${phone}` });
      setInfo('Phone verified successfully!');
      // Autocomplete OtpStep
      setTimeout(() => {
        next();
      }, 500);
    } catch (e) {
      setError(e.message || 'Incorrect verification code.');
    } finally {
      setBusy(false);
    }
  };

  // Magic Link Handling
  const handleMagicLink = async () => {
    setError(''); setInfo(''); setBusy(true);
    try {
      const res = await startEmailMagicLink(email);
      setEmailStage('sent');
      setMagicLinkUrl(res?.devLink || '');
      setInfo(res?.devLink ? 'Link generated!' : 'Magic link dispatched to inbox.');
    } catch (e) {
      setError(e.message || 'Magic Link Send Failed');
    } finally {
      setBusy(false);
    }
  };

  // Photo Uploader helper
  const handlePhotoUpload = async (event) => {
    setError(''); setBusy(true);
    try {
      const files = event.target.files;
      if (files && files.length > 0) {
        await uploadProfilePhotos(files);
        setInfo('Photo uploaded successfully!');
      }
    } catch (e) {
      setError(e.message || 'Photo upload failed.');
    } finally {
      setBusy(false);
    }
  };

  // JIT Permissions prompt triggers
  const triggerLocationRequest = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await updateDraft({
            profileLatitude: position.coords.latitude,
            profileLongitude: position.coords.longitude,
            allowPreciseLocation: true
          });
          setInfo('Precise location permissions active!');
          setTimeout(() => next(), 500);
        },
        () => {
          setError('Location access was denied. Continuing with city only.');
          updateDraft({ allowPreciseLocation: false });
        }
      );
    } else {
      setError('Geolocation not supported by this browser.');
    }
  };

  const triggerNotificationsRequest = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          updateDraft({ allowNotifications: true });
          setInfo('Notifications active!');
        } else {
          setError('Notifications permission denied.');
          updateDraft({ allowNotifications: false });
        }
        setTimeout(() => next(), 500);
      });
    } else {
      next();
    }
  };

  // Render Step Panels
  const renderStep = () => {
    switch (index) {
      case 0:
        return <HeroVisual slide={slides[0]} />;
      case 1:
        return <TimelineVisual slide={slides[1]} />;
      case 2:
        return <TrustVisual slide={slides[2]} />;
      
      // Step 4: Auth Setup
      case 3:
        if (isAuthenticated) {
          return (
            <GlassCard className="p-5 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-4 font-['Outfit'] text-xl font-bold">Successfully Logged In</h3>
              <p className="mt-2 text-sm text-white/60">Connected via: {authUser?.authProvider || 'Email'}</p>
              <p className="mt-1 text-xs text-white/40">{authUser?.email}</p>
            </GlassCard>
          );
        }
        return (
          <GlassCard className="p-4 grid gap-4">
            <p className="text-sm text-white/70 text-center">Create a pass to unlock matches, speakeasy circles, and events.</p>
            
            <button className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-3.5 text-sm font-bold text-white hover:bg-white/10" onClick={() => {
              // Persist the step synchronously right before handing off to Google:
              // the app fully unloads here and re-mounts on the OAuth return.
              try { localStorage.setItem(STEP_KEY, String(index)); } catch { /* ignore */ }
              onbLog('oauth:redirect', { stepBeforeRedirect: index });
              signIn('/onboarding').catch(() => {
                onbLog('oauth:redirect:error');
              });
            }}>
              <Crown className="h-4 w-4 text-cyan-200" /> Continue with Google
            </button>
            
            {/* Beta: Google-only login. Phone OTP & email magic link are hidden
                (no SMS/email provider configured — they would silently fail). */}
          </GlassCard>
        );

      // Step 5: Phone OTP
      case 4:
        const isPhoneVerified = cloudProfile?.phone_verified === 1;
        if (isPhoneVerified) {
          return (
            <GlassCard className="p-5 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
              <h3 className="mt-4 font-['Outfit'] text-xl font-bold">Phone Verified</h3>
              <p className="mt-2 text-sm text-white/60">{draft.phone || cloudProfile?.whatsapp}</p>
            </GlassCard>
          );
        }
        return (
          <GlassCard className="p-4 grid gap-3">
            <h3 className="font-['Outfit'] text-base font-bold text-cyan-200">Verify Your Phone Number</h3>
            <p className="text-xs text-white/50 leading-relaxed">This acts as our premium trust barrier, preventing multi-accounts, scammers, and bots.</p>
            {phoneStage === 'phone' ? (
              <div className="flex gap-2">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-2 text-sm text-white">
                  {COUNTRY_CODES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white" />
                <button onClick={sendCode} className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-black">Send</button>
              </div>
            ) : (
              <div className="grid gap-2">
                <div className="flex gap-2">
                  <input type="text" maxLength={6} placeholder="6-digit code" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white text-center tracking-widest" />
                  <button onClick={submitCode} className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-400 px-4 py-2 text-xs font-bold text-white">Verify</button>
                </div>
                <button onClick={() => setPhoneStage('phone')} className="text-left text-xs text-white/40 underline">Change Number</button>
              </div>
            )}
          </GlassCard>
        );

      // Step 6: Basics (fullName, age, gender)
      case 5:
        return (
          <GlassCard className="p-4 grid gap-4">
            <div className="grid gap-1">
              <label className="text-xs text-white/50 uppercase font-black">Full Name</label>
              <input type="text" placeholder="Priyanka Sen" value={draft.fullName || ''} onChange={e => updateDraft({ fullName: e.target.value })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white" />
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-white/50 uppercase font-black">Age (Must be 18+)</label>
              <input type="tel" maxLength={2} placeholder="23" value={draft.age || ''} onChange={e => updateDraft({ age: e.target.value.replace(/\D/g, '') })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white" />
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs text-white/50 uppercase font-black">Gender Identity</label>
              <div className="flex gap-2">
                {['Female', 'Male', 'Non-binary'].map(g => {
                  const active = draft.gender === g;
                  return (
                    <button key={g} onClick={() => updateDraft({ gender: g })} className={cn('flex-1 rounded-xl border py-2.5 text-xs font-bold transition', active ? 'border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white' : 'border-white/10 bg-white/5 text-white/60')}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        );

      // Step 7: Photos
      case 6:
        const photos = cloudProfile?.photos || [];
        return (
          <GlassCard className="p-4 grid gap-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-white/50 uppercase font-black">Upload Profile Photos ({photos.length}/6)</span>
              <span className="text-[10px] text-fuchsia-200">Required: at least 1</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, slotIndex) => {
                const photoUrl = photos[slotIndex];
                if (photoUrl) {
                  return (
                    <div key={slotIndex} className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                      <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => deleteProfilePhoto(photoUrl)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white/80 hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                }
                return (
                  <label key={slotIndex} className="relative aspect-[3/4] flex flex-col justify-center items-center rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] cursor-pointer hover:bg-white/[0.05]">
                    <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoUpload} />
                    <Plus className="h-5 w-5 text-white/40" />
                    <span className="text-[9px] text-white/30 uppercase mt-1 font-black">Add</span>
                  </label>
                );
              })}
            </div>
          </GlassCard>
        );

      // Step 8: Bio & Profession
      case 7:
        return (
          <GlassCard className="p-4 grid gap-4">
            <div className="grid gap-1">
              <label className="text-xs text-white/50 uppercase font-black">Short Bio</label>
              <textarea placeholder="Coffee lover, indie film enthusiast, and slow traveler..." value={draft.bio || ''} onChange={e => updateDraft({ bio: e.target.value })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white min-h-[90px]" />
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-white/50 uppercase font-black">Profession</label>
              <input type="text" placeholder="Photographer, Designer, Founder" value={draft.profession || ''} onChange={e => updateDraft({ profession: e.target.value })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white" />
            </div>

            <div className="grid gap-1">
              <label className="text-xs text-white/50 uppercase font-black">College</label>
              <input type="text" placeholder="St. Xavier's College" value={draft.college || ''} onChange={e => updateDraft({ college: e.target.value })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white" />
            </div>
          </GlassCard>
        );

      // Step 9: Intent & dating prefs
      case 8:
        const intents = ['Dating', 'Friendship', 'Networking'];
        const targetGenders = ['All', 'Female', 'Male', 'Non-binary'];
        return (
          <GlassCard className="p-4 grid gap-4">
            <div className="grid gap-1.5">
              <label className="text-xs text-white/50 uppercase font-black">Dating Intention</label>
              <div className="flex gap-2">
                {intents.map(i => {
                  const active = draft.intent === i;
                  return (
                    <button key={i} onClick={() => updateDraft({ intent: i })} className={cn('flex-1 rounded-xl border py-2 text-xs font-bold transition', active ? 'border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-xl' : 'border-white/10 bg-white/5 text-white/60')}>
                      {i}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-1.5">
              <label className="text-xs text-white/50 uppercase font-black">Matching Preference</label>
              <div className="flex flex-wrap gap-2">
                {targetGenders.map(g => {
                  const active = (draft.preferred_gender || 'All') === g;
                  return (
                    <button key={g} onClick={() => updateDraft({ preferred_gender: g })} className={cn('rounded-full border px-3 py-1.5 text-xs font-bold transition', active ? 'border-fuchsia-500/40 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white' : 'border-white/10 bg-white/5 text-white/60')}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-1">
              <div className="flex justify-between items-center text-xs text-white/50 uppercase font-black">
                <span>Distance Preference</span>
                <span className="text-fuchsia-200">{draft.preferred_distance_km || 50} km</span>
              </div>
              <input type="range" min={5} max={150} value={draft.preferred_distance_km || 50} onChange={e => updateDraft({ preferred_distance_km: Number(e.target.value) })} className="w-full accent-fuchsia-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer" />
            </div>
          </GlassCard>
        );

      // Step 10: Interests
      case 9:
        const pool = ['Coffee', 'Pickleball', 'Art', 'Bookstore', 'Jazz', 'Live music', 'Hiking', 'Cooking', 'Travel', 'Speakeasies'];
        const selected = draft.interests || [];
        const toggleInterest = (tag) => {
          const nextTags = selected.includes(tag) ? selected.filter(x => x !== tag) : [...selected, tag];
          updateDraft({ interests: nextTags });
        };
        return (
          <GlassCard className="p-4 grid gap-4">
            <span className="text-xs text-white/50 uppercase font-black">Select Your Weekend Interests</span>
            <div className="flex flex-wrap gap-2">
              {pool.map(tag => {
                const active = selected.includes(tag);
                return (
                  <button key={tag} onClick={() => toggleInterest(tag)} className={cn('rounded-full border px-3.5 py-2 text-xs font-bold transition', active ? 'border-cyan-300/40 bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-xl' : 'border-white/10 bg-white/5 text-white/60')}>
                    {tag}
                  </button>
                );
              })}
            </div>
          </GlassCard>
        );

      // Step 11: City Picker
      case 10:
        return (
          <GlassCard className="p-4 grid gap-3">
            <span className="text-xs text-white/50 uppercase font-black">Select Your City</span>
            <input type="text" placeholder="Mumbai, Bangalore, Delhi NCR..." value={draft.city || ''} onChange={e => updateDraft({ city: e.target.value })} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white" />
            
            <div className="p-3.5 rounded-2xl border border-cyan-300/10 bg-cyan-400/5 grid gap-2.5 mt-2">
              <MapPin className="h-6 w-6 text-cyan-200" />
              <p className="text-xs text-white/60 leading-relaxed">Instadate uses precise location permissions to search and show active events and circles happening in your immediate vicinity.</p>
              <button onClick={triggerLocationRequest} className="w-full bg-cyan-300 py-2.5 rounded-xl text-black font-bold text-xs">Enable Precise GPS</button>
            </div>
          </GlassCard>
        );

      // Step 12: JIT Permissions
      case 11:
        return (
          <GlassCard className="p-4 grid gap-4">
            <h3 className="font-['Outfit'] text-base font-bold text-fuchsia-200">Push Notifications Permission</h3>
            <p className="text-xs text-white/50 leading-relaxed">Don't miss out. Receive in-app notifications only when an attendee requests to join your speakeasy hosted event, or a new partner vibe match is verified.</p>
            
            <div className="grid gap-2.5">
              <button onClick={triggerNotificationsRequest} className="w-full bg-white py-3 rounded-xl text-black font-bold text-xs uppercase tracking-wider">Enable Notifications</button>
              <button onClick={() => next()} className="w-full border border-white/10 bg-white/5 py-2.5 rounded-xl text-white/60 text-xs">Skip for now</button>
            </div>
          </GlassCard>
        );

      // Step 13: Ready Step
      case 12:
        return (
          <GlassCard className="p-5 text-center">
            <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] border border-cyan-200/20 bg-cyan-300/10">
              <ShieldCheck className="h-12 w-12 text-cyan-200 animate-pulse" />
            </div>
            <h3 className="mt-5 font-['Outfit'] text-2xl font-black">All Checks Verified!</h3>
            <p className="mt-2 text-sm text-white/52">Checking profile credentials, trust status, and match compatibility.</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" style={{ width: `${completionPercent || 100}%` }} />
            </div>
            <p className="mt-2 text-xs font-black text-cyan-100">{completionPercent || 100}% profile completeness</p>
          </GlassCard>
        );

      default:
        return null;
    }
  };

  const currentHeader = () => {
    // Custom slide header config for step states
    if (index >= 3) {
      const stepHeaders = [
        { eyebrow: 'Step 4 of 12: Auth Gate', title: 'Verify Member Identity', text: 'Sign in to establish your authenticated dating pass.' },
        { eyebrow: 'Step 5 of 12: Phone OTP', title: 'Add Trust Factor', text: 'Confirm your phone number using a standard 6-digit verification code.' },
        { eyebrow: 'Step 6 of 12: Basics', title: 'Tell Us About Yourself', text: 'Enter your name, age, and gender identity matching your verified documents.' },
        { eyebrow: 'Step 7 of 12: Profile Photo', title: 'Show Your True Self', text: 'Add at least 1 high-fidelity profile photo to unlock discovery match pools.' },
        { eyebrow: 'Step 8 of 12: Professional Bio', title: 'Tell Your Social Story', text: 'Optional details helping partners get to know your professional background.' },
        { eyebrow: 'Step 9 of 12: Intention & Prefs', title: 'Select Match Intention', text: 'Configure matching preferences including preferred gender, range, and distance.' },
        { eyebrow: 'Step 10 of 12: Vibe Interests', title: 'Select Social Activity', text: 'Select custom vibe chips used to fuel matching algorithms and activity plans.' },
        { eyebrow: 'Step 11 of 12: Geographic City', title: 'Matching Location', text: 'Enter your city area or allow precise location permissions to search nearby events.' },
        { eyebrow: 'Step 12 of 12: Permissions', title: 'Stay Connected', text: 'Allow just-in-time notification permissions so you never miss a match or plan update.' },
        { eyebrow: 'Verification Complete', title: 'Instadate Pass Ready!', text: 'Your application is approved. Review your pass before entering the lounge.' }
      ];
      // Fall back to the last header rather than crashing if index ever runs
      // past the table (e.g. an out-of-range resume value).
      return <SlideHeader slide={stepHeaders[index - 3] ?? stepHeaders[stepHeaders.length - 1]} />;
    }
    return <SlideHeader slide={slides[index] ?? slides[0]} />;
  };

  const isSkippable = index === 4 || index === 7 || index === 9 || index === 11;

  return (
    <div ref={shellRef} className="relative h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,46,147,.12),transparent_30%,rgba(0,215,245,.08)_60%,transparent),linear-gradient(180deg,#08060d_0%,#050507_52%,#09050c_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:42px_42px]" />
      <span data-beam className="pointer-events-none absolute left-[-16%] top-[15%] h-px w-[62%] rotate-[-18deg] bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent blur-[1px]" />
      <span data-beam className="pointer-events-none absolute right-[-18%] top-[58%] h-px w-[70%] rotate-[-18deg] bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent blur-[1px]" />

      <main className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <TopBar onClose={onExplore} />

        <CarouselIndicator index={index} total={13} goTo={goTo} accent="from-[#ff2e93] via-[#7c3aed] to-[#00d7f5]" />

        <section className="no-scrollbar onboarding-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain py-4 pb-[18rem]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={slideMotion}
              initial="enter"
              animate="center"
              exit="exit"
              transition={spring}
              className="flex shrink-0 flex-col gap-5"
            >
              {currentHeader()}
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </section>

        <div className="fixed inset-x-5 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-[480px] space-y-3 rounded-[28px] border border-white/10 bg-[#050507]/72 p-2.5 shadow-[0_-18px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl">
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={back}
              disabled={index === 0 || busy}
              className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/80 disabled:opacity-30"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.975 }}
              onClick={next}
              disabled={busy}
              className="relative h-14 overflow-hidden rounded-2xl bg-white font-['Outfit'] text-sm font-black text-black shadow-[0_18px_40px_rgba(255,255,255,.16)] disabled:opacity-70"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-white via-fuchsia-100 to-cyan-100" />
              <span className="relative inline-flex items-center gap-2">
                {index === 12 ? (busy ? 'Creating Pass…' : 'Enter Instadate') : 'Continue'}
                {index === 12 ? <Crown className="h-4.5 w-4.5" /> : <ArrowRight className="h-4.5 w-4.5" />}
              </span>
            </motion.button>
          </div>
          
          {isSkippable ? (
            <button
              type="button"
              onClick={() => next()}
              disabled={busy}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.035] py-3 text-xs font-black uppercase tracking-[0.18em] text-white/45 transition active:scale-[.98]"
            >
              Skip for now
            </button>
          ) : (
            <button
              type="button"
              onClick={onExplore}
              disabled={busy}
              className="w-full rounded-2xl border border-white/8 bg-white/[0.035] py-3 text-xs font-black uppercase tracking-[0.18em] text-white/45 transition active:scale-[.98]"
            >
              Explore app first
            </button>
          )}

          {error && <p className="text-xs text-[#ff8aa8] text-center font-bold">{error}</p>}
          {info && <p className="text-xs text-cyan-200 text-center font-bold">{info}</p>}
        </div>
      </main>
    </div>
  );
}

function TopBar({ onClose }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/35">Instadate</p>
        <p className="mt-1 font-['Outfit'] text-lg font-black text-white">Club onboarding</p>
      </div>
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onClose}
        className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white/75 backdrop-blur-xl"
        aria-label="Close onboarding"
      >
        <X className="h-5 w-5" />
      </motion.button>
    </div>
  );
}

function CarouselIndicator({ index, total, goTo, accent }) {
  return (
    <div className="mt-5 rounded-full border border-white/10 bg-white/[0.045] p-1.5 backdrop-blur-2xl">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, itemIndex) => {
          const active = itemIndex === index;
          const completed = itemIndex < index;
          const filled = active || completed;
          return (
            <button
              key={itemIndex}
              type="button"
              onClick={() => goTo(itemIndex)}
              className={cn(
                'relative h-2.5 flex-1 overflow-hidden rounded-full transition-colors duration-200',
                active ? 'bg-white/[0.12]' : 'bg-white/[0.08]'
              )}
              aria-current={active ? 'step' : undefined}
              aria-label={`Go to onboarding screen ${itemIndex + 1}`}
            >
              {filled && (
                <motion.span
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    active ? cn('bg-gradient-to-r', accent) : 'bg-white/28'
                  )}
                  initial={{ width: completed ? '100%' : 0 }}
                  animate={{ width: '100%' }}
                  exit={{ width: 0 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SlideHeader({ slide }) {
  return (
    <div className="text-left">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={cn('inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-white/68 shadow-[0_16px_45px_rgba(0,0,0,.22)] backdrop-blur-xl')}
      >
        <Sparkles className="h-3.5 w-3.5 text-fuchsia-200" />
        {slide.eyebrow}
      </motion.div>
      <h1 className="mt-4 font-['Outfit'] text-[1.82rem] font-black leading-[1.02] tracking-normal text-white sm:text-5xl">
        {slide.title}
      </h1>
      <p className="mt-3 max-w-[31rem] text-sm font-semibold leading-6 text-white/58 sm:text-[15px]">
        {slide.text}
      </p>
    </div>
  );
}

function HeroVisual({ slide }) {
  return (
    <GlassCard className="overflow-hidden p-3">
      <div className="relative overflow-hidden rounded-[26px]">
        <img src={slide.image} alt="" className="h-[218px] w-full object-cover sm:h-[380px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <Badge tone="cyan" icon={ShieldCheck}>Verified lounge</Badge>
          <Badge tone="pink" icon={Star}>98% match</Badge>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-[24px] border border-white/14 bg-black/52 p-3 shadow-2xl backdrop-blur-2xl sm:p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 font-black">ID</span>
              <div>
                <p className="font-['Outfit'] text-lg font-black">Tonight's curated pool</p>
                <p className="text-xs font-semibold text-white/55">Mumbai, Bangalore, Delhi NCR</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {slide.stats.map(([value, label]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-2 text-center sm:p-2.5">
                  <p className="font-['Outfit'] text-base font-black sm:text-lg">{value}</p>
                  <p className="text-[9px] font-black uppercase tracking-wide text-white/42">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {slide.chips.map(chip => <Chip key={chip}>{chip}</Chip>)}
      </div>
    </GlassCard>
  );
}

function TimelineVisual({ slide }) {
  return (
    <GlassCard className="p-4">
      <div className="grid gap-3">
        {slide.steps.map(([title, text, Icon], idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="relative flex gap-3 rounded-[22px] border border-white/8 bg-white/[0.035] p-3"
          >
            {idx < slide.steps.length - 1 && <span className="absolute bottom-[-14px] left-[29px] h-5 w-px bg-gradient-to-b from-fuchsia-300/55 to-cyan-300/20" />}
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/30 text-cyan-200">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="font-['Outfit'] text-base font-black">{title}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-white/50">{text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
}

function TrustVisual({ slide }) {
  return (
    <GlassCard className="overflow-hidden p-4">
      <div className="relative grid min-h-[210px] place-items-center overflow-hidden rounded-[26px] border border-cyan-200/12 bg-[linear-gradient(145deg,rgba(0,215,245,.11),rgba(255,46,147,.08),rgba(255,255,255,.03))]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
          className="absolute h-44 w-44 rounded-full border border-dashed border-cyan-200/24"
        />
        <motion.div
          animate={{ scale: [0.94, 1.05, 0.94], opacity: [0.55, 1, 0.55] }}
          transition={{ repeat: Infinity, duration: 2.4 }}
          className="relative grid h-24 w-24 place-items-center rounded-[30px] border border-cyan-200/30 bg-black/55 shadow-[0_0_60px_rgba(0,215,245,.2)] backdrop-blur-xl"
        >
          <ShieldCheck className="h-12 w-12 text-cyan-200" />
        </motion.div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {slide.trust.map(([title, status, Icon]) => (
          <div key={title} className="rounded-[20px] border border-white/8 bg-white/[0.035] p-3">
            <Icon className="h-4 w-4 text-fuchsia-200" />
            <p className="mt-2 text-xs font-black text-white">{title}</p>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-wide text-cyan-200/80">{status}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, ...spring }}
      className={cn('rounded-[32px] border border-white/10 bg-[#121118]/80 shadow-[0_28px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl', className)}
    >
      {children}
    </motion.div>
  );
}

function Badge({ children, icon: Icon, tone = 'pink' }) {
  const tones = {
    pink: 'border-fuchsia-200/24 bg-fuchsia-300/14 text-fuchsia-50',
    cyan: 'border-cyan-200/24 bg-cyan-300/14 text-cyan-50',
    gold: 'border-amber-200/24 bg-amber-300/14 text-amber-50'
  };

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide backdrop-blur-xl', tones[tone])}>
      <Icon className="h-3.5 w-3.5" />
      {children}
    </span>
  );
}

function Chip({ children }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[11px] font-black text-white/60">
      {children}
    </span>
  );
}

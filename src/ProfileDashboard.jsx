import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Award, BadgeCheck, Ban, Bell, Briefcase, Calendar, CalendarCheck, Camera,
  CheckCircle2, ChevronRight, Clock, CreditCard, Crown, Download, Eye, Flame, Gem, Gift,
  Headphones, Heart, HeartHandshake, HelpCircle, History, ImagePlus, Instagram,
  Lock, LogOut, MapPin, MapPinned, Menu, MessageCircle, PauseCircle, Pencil, Radio, ReceiptText,
  RotateCcw, Settings, Shield, ShieldCheck, SlidersHorizontal, Sparkles, Star, Trash2,
  TrendingUp, UserCheck, Users, Wallet, WandSparkles, X, Zap
} from 'lucide-react';

function renderVerificationBadge(level, size = "w-4 h-4") {
  if (level === 'highly_verified') {
    return <ShieldCheck className={`${size} text-amber-400 fill-amber-400/10 shrink-0 inline-block`} title="Highly Verified VIP Passport" />;
  }
  if (level === 'identity') {
    return <ShieldCheck className={`${size} text-cyan-400 shrink-0 inline-block`} title="Identity Verified Selfie check complete" />;
  }
  if (level === 'basic') {
    return <ShieldCheck className={`${size} text-blue-400 shrink-0 inline-block`} title="Basic Verified Phone connected" />;
  }
  return null;
}

export function getProfileCompletion(profile, localState = {}) {
  const hasEnoughPhotos = Boolean((profile?.photos || []).length >= 3);
  const isInstagramVerified = Boolean(profile?.instagram_verified);
  const hasWeekendStatus = Boolean(profile?.weekendStatus);
  const hasBio = Boolean(profile?.bio);
  const hasInterests = Boolean((profile?.interests || []).length);
  const hasVoiceIntro = Boolean(localState?.verifiedChats && Object.keys(localState.verifiedChats).length);

  const items = [
    { name: 'Add better photos', completed: hasEnoughPhotos },
    { name: 'Verify Instagram', completed: isInstagramVerified },
    { name: 'Add weekend status', completed: hasWeekendStatus },
    { name: 'Add bio', completed: hasBio },
    { name: 'Add interests', completed: hasInterests },
    { name: 'Add voice intro', completed: hasVoiceIntro }
  ];

  const completedItems = items.filter(item => item.completed).map(item => item.name);
  const remainingItems = items.filter(item => !item.completed).map(item => item.name);
  const percent = Math.round((completedItems.length / items.length) * 100);

  return {
    percent,
    completedItems,
    remainingItems,
    flags: {
      hasEnoughPhotos,
      isInstagramVerified,
      hasWeekendStatus,
      hasBio,
      hasInterests,
      hasVoiceIntro
    }
  };
}

const defaultProfile = {
  photo: '',
  photos: [],
  fullName: '',
  age: '',
  instagram: '',
  city: '',
  profession: '',
  college: '',
  weekendStatus: '',
  bio: '',
  intent: '',
  vibe: '',
  completed: false
};

const profileDefaults = {
  photo: '',
  photos: [],
  fullName: 'Ishaan Sharma',
  age: '22',
  instagram: '@ishaan_s',
  city: 'Mumbai',
  profession: 'Product Designer',
  college: 'NMIMS Mumbai',
  weekendStatus: 'Looking for coffee, live music, or a slow Sunday walk this weekend.',
  bio: 'Slow dating, live music, specialty coffee, and real conversation.',
  intent: 'Long-term, curated dating',
  vibe: 'Cafe partner vibe',
  plan: 'Instadate Plus'
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 }
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055 }
  }
};

const journeyStats = [
  ['Active Requests', 8, Sparkles, '72% warm', 'from concierge shortlist'],
  ['Pending Approvals', 3, Clock, '2 today', 'verified profiles reviewing'],
  ['Upcoming Dates', 2, CalendarCheck, '1 VIP', 'safety confirmed'],
  ['Completed Dates', 11, HeartHandshake, '4.8 rating', 'strong reliability'],
  ['Declined Requests', 4, Ban, 'low noise', 'quality filter working']
];

const timeline = ['Applied', 'Reviewing', 'Approved', 'Date Scheduled', 'Completed'];

const premiumBenefits = [
  ['Priority matchmaking', Crown],
  ['Faster approvals', Zap],
  ['Unlimited requests', Sparkles],
  ['VIP events', TicketIcon],
  ['Premium badge', Gem],
  ['Exclusive invites', Gift]
];

const dateTabs = {
  Upcoming: [
    ['Natasha Rao', 'Aether Lounge, Bandra', 'Fri, 8:30 PM', 'Safety verified', 'NR', 'pink'],
    ['Kabir Kapoor', 'Blue Tokai, GK', 'Sun, 6:00 PM', 'Voice verified', 'KK', 'purple']
  ],
  Completed: [
    ['Divya Nair', 'Olive Bar, Mumbai', 'May 24, 7:00 PM', 'Rated 5.0', 'DN', 'cyan']
  ],
  Cancelled: [
    ['Aarav Mehta', 'Museum Cafe, Bangalore', 'May 18, 5:30 PM', 'Refund complete', 'AM', 'purple']
  ],
  'Date History': [
    ['Zara Chen', 'Indie Reads, Bangalore', 'May 12, 4:00 PM', 'Great chemistry', 'ZC', 'cyan'],
    ['Priya Patel', 'Perch, Delhi NCR', 'May 03, 7:30 PM', 'Respectful', 'PP', 'pink']
  ]
};

const safetyItems = [
  ['Identity verification', 'Complete', ShieldCheck],
  ['Selfie verification', 'Complete', Camera],
  ['Instagram verification', 'Connected', Instagram],
  ['College verification', 'Pending', Briefcase],
  ['Emergency contact', 'Add now', Bell],
  ['Live safety check-in', 'Enabled', Radio]
];

const reputationStats = [
  ['Reviews received', '18', Star],
  ['Reviews given', '14', Award],
  ['Reliability score', '94%', Shield],
  ['Response rate', '88%', MessageCircle],
  ['No-show percentage', '0%', CheckCircle2]
];

const preferenceGroups = [
  ['Age range', ['21-27', 'Emotionally available']],
  ['Distance radius', ['12 km', 'Same city preferred']],
  ['Relationship intention', ['Long-term', 'Slow dating']],
  ['Interests', ['Jazz', 'Coffee', 'Design', 'Rooftops']],
  ['Lifestyle', ['Non-smoker', 'Weekend plans']],
  ['Culture', ['Open-minded', 'Family aware']]
];

const discoveryCards = [
  ['Saved profiles', '12 curated saves', Heart],
  ['Hotlist', '4 high intent matches', Flame],
  ['Recently viewed', '31 profile views', Eye],
  ['Icebreakers', '7 premium prompts', WandSparkles],
  ['Date ideas', '9 concierge picks', MapPinned]
];

const communityEvents = [
  ['Singles Supper Club', 'Fri, 9 PM', 'Chef table for verified members', 'bg-[linear-gradient(135deg,#31122a,#082427)]'],
  ['Speed Dating Salon', 'Sat, 7 PM', '8 curated intros in one night', 'bg-[linear-gradient(135deg,#291240,#281118)]'],
  ['VIP Rooftop Circle', 'Sun, 8 PM', 'Invite-only social mixer', 'bg-[linear-gradient(135deg,#10212b,#32142b)]']
];

const walletItems = [
  ['Active plan', 'Plus monthly', CreditCard],
  ['Transactions', '3 receipts', ReceiptText],
  ['Coupons', '1 unlocked', Gift],
  ['Referral earnings', 'Rs. 1,200', Wallet],
  ['Trust deposit', 'Protected', ShieldCheck]
];

const supportItems = [
  ['FAQs', HelpCircle],
  ['Chat support', Headphones],
  ['Feedback', MessageCircle],
  ['Guidelines', Shield],
  ['Help center', Sparkles]
];

const weekendTags = ['Coffee', 'Movie', 'Sports', 'Live music', 'Rooftop', 'Dinner', 'Gallery', 'Bookstore', 'Walk'];

export default function ProfileDashboard({ 
  initialProfile, 
  appState, 
  onSave, 
  onUploadPhotos, 
  onLogout, 
  navigate, 
  onOpenDrawer, 
  authUser, 
  onGoogleLogin,
  onReviewClick,
  onMeetupFeedbackClick
}) {
  const isGuest = false;

  const [localState, setLocalState] = React.useState(appState);
  React.useEffect(() => {
    setLocalState(appState);
  }, [appState]);

  async function apiCall(path, method = 'GET', body = null) {
    try {
      const options = {
        method,
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(path, options);
      const data = await res.json();
      if (data.state) {
        setLocalState(data.state);
      }
      return data;
    } catch (e) {
      console.error(e);
    }
  }

  const [profile, setProfile] = React.useState(() => {
    if (isGuest) {
      return { ...defaultProfile, ...initialProfile };
    }
    return { ...profileDefaults, ...initialProfile };
  });
  const [editOpen, setEditOpen] = React.useState(false);
  const [weekendEditOpen, setWeekendEditOpen] = React.useState(false);
  const [datesTab, setDatesTab] = React.useState('Upcoming');
  const [saving, setSaving] = React.useState(false);
  const [meetSomeoneOpen, setMeetSomeoneOpen] = React.useState(false);

  React.useEffect(() => {
    if (isGuest) {
      setProfile(prev => ({ ...defaultProfile, ...prev, ...initialProfile }));
    } else {
      setProfile(prev => ({ ...profileDefaults, ...prev, ...initialProfile }));
    }
  }, [initialProfile, isGuest]);

  const completionData = React.useMemo(() => getProfileCompletion(profile, localState), [profile, localState]);
  
  const tasks = React.useMemo(() => ([
    ['Add better photos', completionData.flags.hasEnoughPhotos, Camera],
    ['Verify Instagram', completionData.flags.isInstagramVerified, Instagram],
    ['Add weekend status', completionData.flags.hasWeekendStatus, Calendar],
    ['Add bio', completionData.flags.hasBio, Pencil],
    ['Add interests', completionData.flags.hasInterests, Sparkles],
    ['Add voice intro', completionData.flags.hasVoiceIntro, Radio]
  ]), [completionData]);

  const completion = completionData.percent;
  const isPremium = /elite|black|inner circle/i.test(profile.plan || '');

  function updateProfile(next) {
    const merged = { ...profile, ...next };
    merged.completed = Boolean(merged.fullName);
    setProfile(merged);
    onSave?.(merged);
  }

  function handlePhoto(event) {
    const files = Array.from(event.target.files || []).slice(0, 6);
    if (!files.length) return;

    if (onUploadPhotos) {
      onUploadPhotos(files).then(nextProfile => {
        setProfile(prev => ({ ...prev, ...nextProfile }));
        event.target.value = '';
      }).catch(() => {
        event.target.value = '';
      });
      return;
    }

    event.target.value = '';
  }

  function upgrade() {
    updateProfile({ plan: 'Instadate Elite' });
  }

  if (isGuest) {
    return (
      <div className="min-h-screen scroll-smooth bg-[#050506] text-white">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_4%,rgba(255,46,147,.18),transparent_28rem),radial-gradient(circle_at_92%_2%,rgba(0,215,245,.13),transparent_22rem),linear-gradient(180deg,#08060d_0%,#050506_42%,#08040a_100%)]" />
        <motion.div className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 sm:px-6" variants={container} initial="hidden" animate="show">
          <GatekeeperAdmissions onApply={() => setEditOpen(true)} onDemoLogin={() => updateProfile(profileDefaults)} authUser={authUser} onGoogleLogin={onGoogleLogin} />
        </motion.div>

        <AnimatePresence>
          {editOpen && (
            <EditProfileSheet
              profile={profile}
              saving={saving}
              onClose={() => setEditOpen(false)}
              onChange={setProfile}
              onPhoto={handlePhoto}
              onSave={() => {
                setSaving(true);
                window.setTimeout(() => {
                  updateProfile(profile);
                  setSaving(false);
                  setEditOpen(false);
                }, 450);
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen scroll-smooth bg-[#050506] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_4%,rgba(255,46,147,.18),transparent_28rem),radial-gradient(circle_at_92%_2%,rgba(0,215,245,.13),transparent_22rem),linear-gradient(180deg,#08060d_0%,#050506_42%,#08040a_100%)]" />
      <motion.div 
        className="mx-auto w-full max-w-2xl px-4 pb-28 sm:px-6 animate-none" 
        style={{ paddingTop: '1rem' }} 
        variants={container} 
        initial="hidden" 
        animate="show"
      >
        <StickyProfileNav completion={completion} navigate={navigate} onOpenDrawer={onOpenDrawer} />

        <ProfileHero
          profile={profile}
          completion={completion}
          isPremium={isPremium}
          onEdit={() => setEditOpen(true)}
          onWeekendEdit={() => setWeekendEditOpen(true)}
          onPhoto={handlePhoto}
          upgrade={upgrade}
          appState={localState}
        />

        {/* Pending Reviews Center (24h feedback loop reminder) */}
        {((localState?.pendingReviews?.meetups?.length > 0) || (localState?.pendingReviews?.events?.length > 0)) && (
          <div style={{
            margin: '1.5rem 0',
            padding: '1.25rem',
            background: 'rgba(255, 193, 7, 0.05)',
            border: '1px solid rgba(255, 193, 7, 0.15)',
            borderRadius: '24px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(255, 193, 7, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#ffc107',
                boxShadow: '0 0 10px #ffc107'
              }} />
              <h3 style={{
                font: '900 1.1rem Outfit, sans-serif',
                color: '#fff',
                margin: 0,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Pending Trust Reviews
              </h3>
            </div>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', margin: '0 0 1rem', lineHeight: 1.45 }}>
              Your feedback verifies offline reliability and keeps Instadate safe. Please take 10 seconds to share your real-world outcomes.
            </p>

            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {localState?.pendingReviews?.meetups?.map(meetup => (
                <div 
                  key={meetup.matchOutcomeId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'grid', gap: '2px' }}>
                    <span style={{ font: '800 0.86rem Outfit, sans-serif', color: '#fff' }}>
                      Meetup with {meetup.name}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                      Awaiting mutual offline verification
                    </span>
                  </div>
                  <button
                    onClick={() => onMeetupFeedbackClick?.(meetup)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'linear-gradient(135deg, #ffc107, #ff9800)',
                      border: 0,
                      borderRadius: '10px',
                      color: '#000',
                      font: '800 0.76rem Outfit, sans-serif',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(255, 193, 7, 0.25)',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Rate Meetup
                  </button>
                </div>
              ))}

              {localState?.pendingReviews?.events?.map(event => (
                <div 
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                    {event.image && (
                      <img 
                        src={event.image} 
                        alt="" 
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <div style={{ display: 'grid', gap: '2px', minWidth: 0 }}>
                      <span style={{ font: '800 0.86rem Outfit, sans-serif', color: '#fff', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {event.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {event.date} • {event.place}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onReviewClick?.(event)}
                    style={{
                      padding: '0.45rem 0.85rem',
                      background: 'linear-gradient(135deg, #00d7f5, #9b30ff)',
                      border: 0,
                      borderRadius: '10px',
                      color: '#fff',
                      font: '800 0.76rem Outfit, sans-serif',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0, 215, 245, 0.25)',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      marginLeft: 'auto'
                    }}
                  >
                    Rate Mixer & Host
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolved Members from Discovery Feeds */}
        {(() => {
          const resolvedMembers = [];
          const ids = new Set();
          
          if (Array.isArray(localState?.recommendations)) {
            for (const rec of localState.recommendations) {
              if (rec.profile && !ids.has(rec.id)) {
                ids.add(rec.id);
                resolvedMembers.push({
                  id: rec.id,
                  name: rec.profile.fullName,
                  age: rec.profile.age,
                  city: rec.profile.city,
                  vibe: rec.profile.vibe,
                  score: `${rec.score}%`,
                  avatar: rec.profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                  gradient: 'pink',
                  photos: rec.profile.photos || [rec.profile.photo],
                  currentWeekendStatus: rec.profile.currentWeekendStatus,
                  weekendStatus: rec.profile.weekendStatus,
                  trustScore: rec.profile.trustMetrics?.trustScore || 94,
                  trustMetrics: rec.profile.trustMetrics,
                  verification_level: rec.profile.verification_level || 'none'
                });
              }
            }
          }
          
          if (localState?.discovery) {
            const feeds = ['topMatches', 'nearYou', 'similarVibes', 'activeMembers', 'newMembers', 'trendingMembers'];
            for (const feed of feeds) {
              const feedList = localState.discovery[feed] || [];
              for (const item of feedList) {
                if (item.profile && !ids.has(item.id)) {
                  ids.add(item.id);
                  resolvedMembers.push({
                    id: item.id,
                    name: item.profile.fullName,
                    age: item.profile.age,
                    city: item.profile.city,
                    vibe: item.profile.vibe,
                    score: `${item.score}%`,
                    avatar: item.profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
                    gradient: 'pink',
                    photos: item.profile.photos || [item.profile.photo],
                    currentWeekendStatus: item.profile.currentWeekendStatus,
                    weekendStatus: item.profile.weekendStatus,
                    trustScore: item.trustScore || 94,
                    trustMetrics: item.profile.trustMetrics,
                    verification_level: item.profile.verification_level || 'none'
                  });
                }
              }
            }
          }

          const handleJoinPlan = async (planId, hasJoined) => {
            try {
              if (hasJoined) {
                await apiCall(`/api/instant-plans/${planId}/join`, 'DELETE');
              } else {
                await apiCall(`/api/instant-plans/${planId}/join`, 'POST');
              }
            } catch (e) {
              console.error(e);
            }
          };

          const handleToggleRsvp = async (event) => {
            const isJoined = localState?.rsvps?.[event.id];
            if (isJoined) {
              await apiCall(`/api/events/${event.id}/attendees/me`, 'DELETE');
            } else {
              await apiCall(`/api/events/${event.id}/attendees/me`, 'POST');
            }
          };

          return (
            <>
              {/* Meet Someone This Week Prominent Flow Trigger */}
              <button
                onClick={() => setMeetSomeoneOpen(true)}
                className="meet-someone-week-cta mt-6 group relative w-full overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-cyan-400 p-[2px] shadow-[0_20px_60px_rgba(217,70,239,0.4)] transition-all duration-300 hover:shadow-[0_25px_70px_rgba(217,70,239,0.5)] active:scale-[0.98]"
              >
                <div className="relative flex items-center justify-between gap-3 rounded-[22px] bg-gradient-to-br from-[#1a0a2e] via-[#16051f] to-[#0a1628] px-5 py-4 backdrop-blur-xl">
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 via-fuchsia-500/10 to-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="relative flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg">
                      <Zap className="h-5 w-5 text-white animate-pulse" />
                    </div>
                    <div className="text-left">
                      <div className="font-['Outfit'] text-sm font-black uppercase tracking-wider text-white">
                        Meet Someone This Week
                      </div>
                      <div className="text-[10px] font-semibold text-white/60">
                        Real plans, real people, this week
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
                    <span className="text-xs font-black uppercase tracking-wide text-white">Start</span>
                    <ChevronRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </button>

              {meetSomeoneOpen && (
                <MeetSomeoneThisWeekModal
                  appState={localState}
                  resolvedMembers={resolvedMembers}
                  onClose={() => setMeetSomeoneOpen(false)}
                  onVibeClick={member => { setMeetSomeoneOpen(false); onOpenDrawer?.(member); }}
                  onProfileClick={member => { setMeetSomeoneOpen(false); onOpenDrawer?.(member); }}
                  onToggleRsvp={handleToggleRsvp}
                  onJoinPlan={handleJoinPlan}
                  navigate={navigate}
                />
              )}
            </>
          );
        })()}

        {/* Dynamic Matchmaking intelligence Hub */}
        <MatchmakingHub appState={localState} onApiCall={apiCall} />

        {/* Instant Plans Lounge */}
        <InstantPlansLounge appState={localState} onApiCall={apiCall} />

        {/* Curated Events Recommendation intelligence */}
        <RecommendedEventsSection appState={localState} onApiCall={apiCall} />

        <ActiveOutingsSection activeTab={datesTab} setActiveTab={setDatesTab} hostedEvents={localState?.hostedEvents || []} outcomes={localState?.outcomes || []} navigate={navigate} />

        <SimplifiedSettings onLogout={onLogout} profile={profile} upgrade={upgrade} authUser={authUser} onGoogleLogin={onGoogleLogin} />
      </motion.div>

      <AnimatePresence>
        {editOpen && (
          <EditProfileSheet
            profile={profile}
            saving={saving}
            onClose={() => setEditOpen(false)}
            onChange={setProfile}
            onPhoto={handlePhoto}
            onSave={() => {
              setSaving(true);
              window.setTimeout(() => {
                updateProfile(profile);
                setSaving(false);
                setEditOpen(false);
              }, 450);
            }}
          />
        )}
        {weekendEditOpen && (
          <WeekendStatusSheet
            value={profile.weekendStatus || ''}
            onClose={() => setWeekendEditOpen(false)}
            onSave={weekendStatus => {
              updateProfile({ weekendStatus });
              setWeekendEditOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StickyProfileNav({ completion, navigate, onOpenDrawer }) {
  return (
    <motion.div variants={fadeUp} className="-mx-4 mb-4 border-b border-white/10 bg-[#050506]/78 px-4 py-3 backdrop-blur-2xl sm:mx-0 sm:rounded-[28px] sm:border" data-profile-card>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-fuchsia-300/80">Relationship Identity</p>
          <h1 className="font-['Outfit'] text-2xl font-black leading-none text-white">Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenDrawer} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] transition active:scale-95" aria-label="Open drawer">
            <Menu className="h-5 w-5" />
          </button>
          <button onClick={() => navigate?.('/chat')} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] transition active:scale-95">
            <MessageCircle className="h-5 w-5" />
          </button>
          <div className="rounded-2xl border border-fuchsia-400/25 bg-fuchsia-400/10 px-3 py-2 text-right">
            <p className="text-[10px] uppercase text-white/45">Strength</p>
            <p className="text-sm font-black text-fuchsia-100">{completion}%</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileHero({ profile, completion, isPremium, onEdit, onWeekendEdit, onPhoto, upgrade, appState }) {
  const trust = appState?.trustMetrics || {};
  const trustScore = trust.trust_score ?? trust.trustScore ?? 75;
  const attendanceScore = trust.attendance_score ?? trust.attendanceScore ?? 100;
  const responseRate = trust.response_rate ?? trust.responseRate ?? 100;
  const noShowCount = trust.no_show_count ?? trust.noShowCount ?? 0;
  const wouldMeetAgainPct = trust.would_meet_again_pct ?? trust.wouldMeetAgainPct ?? 100;

  const reputation = [
    ['Trust Score', `${trustScore}%`],
    ['Response Rate', `${responseRate}%`],
    ['Reliability', `${attendanceScore}%`],
    ['Would Meet Again', `${wouldMeetAgainPct}%`],
    ['No Shows', `${noShowCount}`],
    ['Verification', profile.verification_level === 'highly_verified' ? 'HIGHLY VERIFIED' : profile.verification_level === 'identity' ? 'IDENTITY VERIFIED' : profile.verification_level === 'basic' ? 'BASIC VERIFIED' : 'PENDING']
  ];
  const photos = Array.isArray(profile.photos) && profile.photos.length
    ? profile.photos
    : profile.photo ? [profile.photo] : [];
  const primaryPhoto = photos[0] || profile.photo;
  const selectedWeekendTags = weekendTags.filter(tag => (profile.weekendStatus || '').toLowerCase().includes(tag.toLowerCase()));

  return (
    <MotionSection className="overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.055] shadow-[0_30px_110px_rgba(0,0,0,.55)] backdrop-blur-2xl" data-profile-card>
      <div className="relative p-5 sm:p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(255,46,147,.2),transparent_16rem),radial-gradient(circle_at_86%_12%,rgba(0,215,245,.1),transparent_14rem)]" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          
          {/* Circular Photo */}
          <label className="group relative shrink-0 cursor-pointer">
            <input className="sr-only" type="file" accept="image/*" multiple onChange={onPhoto} />
            <div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-fuchsia-300/35 bg-gradient-to-br from-fuchsia-500/35 to-cyan-400/15 shadow-[0_0_40px_rgba(255,46,147,.18)]">
              {primaryPhoto ? <img src={primaryPhoto} alt="" className="h-full w-full object-cover" /> : <UserInitials name={profile.fullName} />}
            </div>
            <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-[#121016] shadow-xl transition group-active:scale-90">
              <ImagePlus className="h-3.5 w-3.5 text-fuchsia-200" />
            </span>
          </label>

          {/* Core Info */}
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap justify-center sm:justify-start items-center gap-1.5">
              {profile.verification_level === 'highly_verified' && <Badge icon={ShieldCheck} text="Highly Verified" tone="gold" />}
              {profile.verification_level === 'identity' && <Badge icon={ShieldCheck} text="Identity Verified" tone="cyan" />}
              {profile.verification_level === 'basic' && <Badge icon={ShieldCheck} text="Basic Verified" tone="blue" />}
              {Boolean(profile.instagram_verified) && <Badge icon={Instagram} text="Instagram Connected" tone="pink" />}
              {isPremium && <Badge icon={Gem} text="Elite VIP" tone="gold" />}
            </div>
            
            <h2 className="flex items-center gap-2 font-['Outfit'] text-3xl font-black leading-none text-white flex-wrap">
              <span>{(profile.fullName || '').split(',')[0].trim() || 'Complete profile'}, {profile.age || (profile.fullName || '').split(',')[1]?.trim() || '22'}</span>
              {renderVerificationBadge(profile.verification_level, "w-6 h-6")}
            </h2>
            
            <div className="mt-2.5 flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1.5 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5 text-fuchsia-200" />{profile.profession || 'Creative Professional'} at {profile.college || 'verified college'}</span>
              <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-cyan-200" />{profile.city || 'Mumbai'}</span>
            </div>

            {/* Quick 1-line stats bar */}
            <div className="no-scrollbar mt-4 flex justify-center sm:justify-start gap-3 overflow-x-auto py-1">
              {reputation.map(([label, val]) => (
                <div key={label} className="rounded-xl border border-white/5 bg-white/[0.03] px-3 py-1.5 text-center shrink-0">
                  <p className="font-['Outfit'] text-xs font-black text-white">{val}</p>
                  <p className="text-[9px] text-white/40 uppercase font-bold mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-[22px] border border-fuchsia-300/15 bg-black/20 p-3.5 text-left shadow-[0_18px_50px_rgba(0,0,0,.22)]">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200/80">
                  <Calendar className="h-3.5 w-3.5 text-cyan-200" />
                  Weekend Status
                </span>
                <button
                  type="button"
                  onClick={onWeekendEdit}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-[10px] font-black text-white/80 transition hover:bg-white/[0.09] active:scale-95"
                >
                  <Pencil className="h-3 w-3 text-fuchsia-200" />
                  Edit
                </button>
              </div>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-white">
                {profile.weekendStatus || 'Add what you are open to this weekend.'}
              </p>
              {selectedWeekendTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedWeekendTags.map(tag => (
                    <span key={tag} className="rounded-full border border-cyan-200/18 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-black text-cyan-100">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-6 gap-1.5">
              {Array.from({ length: 6 }).map((_, index) => {
                const image = photos[index];
                return image ? (
                  <div key={index} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                    <img src={image} alt="" className="h-full w-full object-cover" />
                    {index === 0 && <span className="absolute left-1 top-1 rounded-full bg-black/65 px-1.5 py-0.5 text-[8px] font-black uppercase text-white">Main</span>}
                  </div>
                ) : (
                  <label key={index} className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-white/12 bg-white/[0.025] text-white/35 transition active:scale-95">
                    <input className="sr-only" type="file" accept="image/*" multiple onChange={onPhoto} />
                    <ImagePlus className="h-4 w-4" />
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shimmer VIP Elite Banner embedded directly */}
        <div className="mt-5 border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Crown className="h-4.5 w-4.5 text-amber-300 animate-pulse" />
            <span className="text-white/70 font-semibold">
              {isPremium ? (
                <span>Instadate Elite membership active. You are in the top 8% of the curated city pool.</span>
              ) : (
                <span>Instadate Plus active. Upgrade to Elite to unlock custom matchmaking.</span>
              )}
            </span>
          </div>
          {!isPremium && (
            <button 
              onClick={upgrade} 
              className="text-amber-200 hover:text-amber-300 transition font-black uppercase text-[10px] tracking-wider shrink-0 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-lg"
            >
              Upgrade VIP
            </button>
          )}
        </div>

        {/* Clean Edit Profile Trigger Button */}
        <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
          <TapButton onClick={onEdit} className="flex-1 bg-gradient-to-r from-fuchsia-500 to-cyan-400 text-white min-h-[44px] rounded-xl text-xs font-black">
            Edit Profile & Value Preferences 📝
          </TapButton>
        </div>
      </div>
    </MotionSection>
  );
}

function ActiveOutingsSection({ activeTab, setActiveTab, hostedEvents = [], outcomes = [], navigate }) {
  const dates = React.useMemo(() => {
    const filtered = outcomes.filter(o => {
      if (activeTab === 'Upcoming') {
        return o.status === 'meetup_planned' || o.status === 'chat_started' || o.status === 'accepted';
      } else if (activeTab === 'Completed') {
        return o.status === 'meetup_completed';
      } else if (activeTab === 'Date History') {
        return o.status === 'meetup_completed';
      }
      return false; // Cancelled
    });

    return filtered.map(o => {
      const name = o.targetName || 'Anonymous Member';
      const venue = o.targetWeekendStatus || 'Speakeasy Lounge';
      const time = o.updatedAt ? (new Date(o.updatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) + ' onwards') : 'Tonight onwards';
      const status = o.targetIsVerified ? 'Safety verified' : 'Vibe checked';
      const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const tone = o.status === 'meetup_planned' ? 'pink' : o.status === 'meetup_completed' ? 'cyan' : 'purple';
      return [name, venue, time, status, initials, tone];
    });
  }, [outcomes, activeTab]);

  const latestHostedEvent = hostedEvents[0];
  
  return (
    <Section title="Upcoming Date Tickets" eyebrow="Your Real-world Outings" action="History">
      {latestHostedEvent && (
        <GlassCard className="mb-4 overflow-hidden p-0">
          <div className="relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(37,211,102,.18),transparent_15rem),radial-gradient(circle_at_90%_0%,rgba(0,215,245,.14),transparent_14rem)]" />
            <div className="relative grid gap-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)]">
              <div className="relative h-24 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                <img src={latestHostedEvent.image} alt="" className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-emerald-400/90 px-2 py-0.5 text-[9px] font-black uppercase text-[#051008]">
                  Host Plan
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200/80">Tonight Insight</p>
                    <h3 className="mt-1 truncate font-['Outfit'] text-xl font-black text-white">{latestHostedEvent.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-100">
                    {latestHostedEvent.status}
                  </span>
                </div>

                <div className="mt-3 grid gap-1.5 text-xs font-semibold text-white/62">
                  <p className="flex min-w-0 items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-fuchsia-200" />
                    <span className="truncate">{latestHostedEvent.date} • {latestHostedEvent.time}</span>
                  </p>
                  <p className="flex min-w-0 items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
                    <span className="truncate">{latestHostedEvent.place}</span>
                  </p>
                  <p className="flex min-w-0 items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0 text-emerald-200" />
                    <span className="truncate">{latestHostedEvent.attendeeCount || 0}/{latestHostedEvent.capacity} joined • {latestHostedEvent.approval}</span>
                  </p>
                </div>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => navigate?.('/events')}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-200/15 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-100 transition active:scale-[0.98]"
                  >
                    View in Plans
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate?.('/host')}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.045] px-3 py-2 text-xs font-black text-white/76 transition active:scale-[0.98]"
                  >
                    Host Another
                  </button>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}

      <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto rounded-[18px] border border-white/8 bg-white/[0.03] p-1">
        {Object.keys(dateTabs).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`relative shrink-0 rounded-[14px] px-3.5 py-2 text-xs font-black transition active:scale-95 ${activeTab === tab ? 'text-white' : 'text-white/50 hover:text-white/75'}`}>
            {activeTab === tab && <motion.span layoutId="dateTab" className="absolute inset-0 rounded-[14px] bg-gradient-to-r from-fuchsia-500 to-cyan-400 shadow-[0_10px_26px_rgba(217,38,178,.22)]" />}
            <span className="relative">{tab}</span>
          </button>
        ))}
      </div>
      
      {dates.length === 0 ? (
        <GlassCard className="p-5 text-center">
          <CalendarCheck className="mx-auto h-8 w-8 text-fuchsia-300/40 mb-2" />
          <p className="text-xs text-white/50 leading-relaxed max-w-sm mx-auto">
            No active outing tickets booked. Connect with verified members in the speakeasy feed to organize a real-world coffee, pickleball, or sunset date!
          </p>
        </GlassCard>
      ) : (
        <div className="grid gap-3">
          {dates.slice(0, 2).map(date => {
            const [name, venue, time, status, initials, tone] = date;
            const toneClass = tone === 'cyan'
              ? 'from-cyan-400/35 to-cyan-300/5 text-cyan-100'
              : tone === 'purple'
                ? 'from-violet-500/35 to-fuchsia-400/5 text-violet-100'
                : 'from-fuchsia-500/35 to-rose-300/5 text-fuchsia-100';
            return (
              <GlassCard key={date[0]} className="group overflow-hidden p-0">
                <div className="flex">
                  <div className={`w-1.5 shrink-0 bg-gradient-to-b ${toneClass}`} />
                  <div className="min-w-0 flex-1 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${toneClass} border border-white/10 font-['Outfit'] text-sm font-black shadow-[0_14px_32px_rgba(0,0,0,.26)]`}>
                        {initials}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="truncate font-['Outfit'] text-lg font-black leading-tight text-white">{name}</h3>
                            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.18em] text-white/38">Date pass</p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-cyan-200/15 bg-cyan-300/8 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-cyan-100">
                            <ShieldCheck className="h-3 w-3" />
                            {status}
                          </span>
                        </div>

                        <div className="mt-3 grid gap-2 rounded-2xl border border-white/6 bg-black/18 p-3 text-xs font-semibold text-white/68">
                          <p className="flex min-w-0 items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-fuchsia-200/80" />
                            <span className="truncate">{venue}</span>
                          </p>
                          <p className="flex min-w-0 items-center gap-2">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-200/80" />
                            <span className="truncate">{time}</span>
                          </p>
                        </div>

                        <div className="mt-3 flex gap-2">
                          <button type="button" className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/8 bg-white/[0.045] px-3 py-2 text-xs font-black text-white/78 transition hover:bg-white/[0.075] active:scale-[0.98]">
                            <MessageCircle className="h-3.5 w-3.5 text-cyan-200" />
                            Message
                          </button>
                          <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl border border-fuchsia-200/15 bg-fuchsia-300/8 px-3 py-2 text-xs font-black text-fuchsia-100 transition hover:bg-fuchsia-300/12 active:scale-[0.98]">
                            Details
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function WeekendStatusSheet({ value, onClose, onSave }) {
  const [draft, setDraft] = React.useState(value);
  const templates = [
    'Coffee, live music, or a slow Sunday walk this weekend.',
    'Open to a gallery date, bookstore stroll, or rooftop mocktail.',
    'Looking for a thoughtful dinner plan with good conversation.',
    'Free for a low-key cafe date and a real values chat.'
  ];

  function addTag(tag) {
    const cleanTag = tag.toLowerCase();
    if (draft.toLowerCase().includes(cleanTag)) return;

    const base = draft.trim().replace(/[.]+$/, '');
    const next = base
      ? `${base}, ${cleanTag}.`
      : `Open to ${cleanTag} this weekend.`;

    setDraft(next.slice(0, 140));
  }

  return (
    <motion.div
      className="fixed inset-0 z-[92] flex items-end justify-center bg-black/70 px-4 pb-4 backdrop-blur-xl sm:items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-[30px] border border-white/10 bg-[#08070d] shadow-[0_30px_90px_rgba(0,0,0,.7)] no-scrollbar"
        initial={{ y: 36, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 24, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      >
        <div className="relative p-5">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,46,147,.18),transparent_18rem),radial-gradient(circle_at_85%_10%,rgba(0,215,245,.12),transparent_16rem)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200/80">Weekend Status</p>
              <h3 className="mt-1 font-['Outfit'] text-2xl font-black text-white">Edit your plan signal</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-white/52">This is shown on your profile and helps curators suggest better matches.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/70 transition active:scale-95"
              aria-label="Close weekend status editor"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="relative mt-5 block rounded-[24px] border border-white/10 bg-white/[0.045] p-4 focus-within:border-cyan-200/35">
            <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/38">Visible profile note</span>
            <textarea
              value={draft}
              onChange={event => setDraft(event.target.value)}
              rows={3}
              maxLength={140}
              placeholder="Example: Looking for coffee, live music, or a slow Sunday walk this weekend."
              className="w-full resize-none bg-transparent text-sm font-semibold leading-6 text-white outline-none placeholder-white/22"
              autoFocus
            />
            <span className="mt-2 block text-right text-[10px] font-black text-white/35">{draft.length}/140</span>
          </label>

          <div className="relative mt-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/42">Quick tags</p>
            <div className="flex flex-wrap gap-2">
              {weekendTags.map(tag => {
                const active = draft.toLowerCase().includes(tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addTag(tag)}
                    className={`rounded-full border px-2.5 py-1.5 text-[10px] font-black transition active:scale-95 ${
                      active
                        ? 'border-cyan-200/35 bg-cyan-300/15 text-cyan-100'
                        : 'border-white/10 bg-white/[0.045] text-white/62 hover:bg-white/[0.075]'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            {templates.map(template => (
              <button
                key={template}
                type="button"
                onClick={() => setDraft(template)}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-left text-[10px] font-bold text-white/58 transition hover:bg-white/[0.075] active:scale-95"
              >
                {template}
              </button>
            ))}
          </div>

          <div className="sticky bottom-0 -mx-5 mt-5 grid grid-cols-[1fr_1.45fr] gap-3 border-t border-white/10 bg-[#08070d]/92 px-5 pb-1 pt-4 backdrop-blur-xl">
            <button
              type="button"
              onClick={onClose}
              className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.045] text-sm font-black text-white/68 transition active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft.trim())}
              disabled={!draft.trim()}
              className="min-h-12 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 text-sm font-black text-white shadow-[0_14px_34px_rgba(255,46,147,.22)] transition active:scale-95 disabled:opacity-40"
            >
              Save Weekend Status
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// AUTH-BE-08 / AUTH-FE-08 — Account lifecycle: export, deactivate (reversible), delete (30d grace).
function DangerZone({ onLogout }) {
  const [mode, setMode] = React.useState(null); // null | 'deactivate' | 'delete'
  const [confirmText, setConfirmText] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);

  const exportData = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/export', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = 'instadate-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
    } catch (e) {
      setError(e.message || 'Could not export your data.');
    } finally {
      setBusy(false);
    }
  };

  const deactivate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account/deactivate', { method: 'POST', credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('Could not deactivate account.');
      onLogout?.();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setError('Type DELETE to confirm.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/account', { method: 'DELETE', credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error('Could not delete account.');
      onLogout?.();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <div className="mt-5 rounded-2xl border border-[#ff2e93]/20 bg-[#ff2e93]/[0.04] p-4">
      <h4 className="font-['Outfit'] text-xs font-black uppercase tracking-wide text-rose-200">Account &amp; Data</h4>
      <p className="mt-1 text-[10px] leading-relaxed text-white/45">
        Download everything we hold about you, take a break, or permanently delete your account.
      </p>

      <div className="mt-3 grid gap-2">
        <button
          onClick={exportData}
          disabled={busy}
          className="flex min-h-[44px] items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-left text-white/80 transition active:scale-[.99] disabled:opacity-50"
        >
          <span className="flex items-center gap-2.5 text-xs font-bold"><Download className="h-4 w-4 text-[#00d7f5]" /> Export my data</span>
          <span className="text-[10px] text-white/40">JSON</span>
        </button>

        <button
          onClick={() => { setMode('deactivate'); setError(null); }}
          className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-left text-xs font-bold text-white/80 transition active:scale-[.99]"
        >
          <PauseCircle className="h-4 w-4 text-amber-300" /> Deactivate account
        </button>

        <button
          onClick={() => { setMode('delete'); setError(null); setConfirmText(''); }}
          className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-[#ff2e93]/30 bg-[#ff2e93]/10 px-3.5 text-left text-xs font-bold text-rose-200 transition active:scale-[.99]"
        >
          <Trash2 className="h-4 w-4" /> Delete account
        </button>
      </div>

      {error && <p className="mt-2 text-[11px] font-semibold text-rose-300">{error}</p>}

      <AnimatePresence>
        {mode && (
          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-[24px] border border-white/10 bg-[#0f0a14] p-5 shadow-2xl"
              initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
            >
              {mode === 'deactivate' ? (
                <>
                  <h3 className="font-['Outfit'] text-lg font-black text-white">Deactivate account?</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    Your profile is hidden from everyone and chats pause. Sign back in any time to reactivate — nothing is deleted.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setMode(null)} className="min-h-[40px] rounded-lg bg-white/10 text-xs font-black text-white transition active:scale-95">Cancel</button>
                    <button onClick={deactivate} disabled={busy} className="min-h-[40px] rounded-lg bg-amber-400/90 text-xs font-black text-black transition active:scale-95 disabled:opacity-60">
                      {busy ? 'Working…' : 'Deactivate'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="font-['Outfit'] text-lg font-black text-rose-200">Delete account permanently?</h3>
                  <p className="mt-2 text-xs leading-relaxed text-white/60">
                    Your account is hidden now and permanently erased after 30 days — including photos, chats, and matches.
                    Sign in within 30 days to cancel. Type <strong className="text-white">DELETE</strong> to confirm.
                  </p>
                  <input
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="mt-3 w-full rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-bold tracking-widest text-white placeholder:text-white/25 focus:border-[#ff2e93]/60 focus:outline-none"
                  />
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setMode(null)} className="min-h-[40px] rounded-lg bg-white/10 text-xs font-black text-white transition active:scale-95">Cancel</button>
                    <button onClick={deleteAccount} disabled={busy} className="min-h-[40px] rounded-lg bg-[#ff2e93] text-xs font-black text-white transition active:scale-95 disabled:opacity-60">
                      {busy ? 'Working…' : 'Delete forever'}
                    </button>
                  </div>
                </>
              )}
              {error && <p className="mt-2 text-center text-[11px] font-semibold text-rose-300">{error}</p>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimplifiedSettings({ onLogout, profile, upgrade, authUser, onGoogleLogin }) {
  const [activeDialog, setActiveDialog] = React.useState(null);
  const sections = [
    {
      title: authUser ? "Google Account Connected" : "Google Login",
      desc: authUser ? `${authUser.email || authUser.fullName || 'Signed in with Google'}` : "Sign in with Google to sync your club profile",
      icon: UserCheck,
      action: authUser
        ? () => setActiveDialog({ title: "Google Account", content: `Signed in as ${authUser.email || authUser.fullName}. Your hosted events, RSVPs, matches, and chats now use your D1 user record.` })
        : onGoogleLogin
    },
    {
      title: "Identity & Verification Status",
      desc: "Instagram link & selfie check active",
      icon: ShieldCheck,
      action: () => setActiveDialog({ title: "Identity Lock", content: "Your profile biometrics and linked Instagram are fully checked and verified. This ensures zero ghosting and zero fake profiles in the club." })
    },
    {
      title: "Concierge Billing & Referrals",
      desc: "Instadate Plus active • Rs. 1,200 referral balance",
      icon: Wallet,
      action: () => setActiveDialog({ title: "Instadate Wallet & Billing", content: "Your current subscription is active. Wallet balance: Rs. 1,200 referral credits, which can be applied to Speakeasy cocktail nights or concierge events." })
    },
    {
      title: "Relationship Value Filters",
      desc: "Long-term, curated dating • 12 km radius",
      icon: SlidersHorizontal,
      action: () => setActiveDialog({ title: "Value Filters", content: "Curator matches are filtered for: Age 21-27, emotional availability, distance within 12km, non-smokers, and cafe vibe partners. You can adjust these under Edit Profile." })
    },
    {
      title: "Emergency Safety Checklist",
      desc: "Selfie check connected • Live safety check-in active",
      icon: Radio,
      action: () => setActiveDialog({ title: "Safety Center", content: "Emergency safety concierge is enabled. Safe meetups organize live, secure geo check-ins automatically when dating." })
    }
  ];

  return (
    <Section title="Concierge Controls" eyebrow="Vetting & Security">
      <div className="grid gap-2">
        {sections.map((s, idx) => (
          <button 
            key={idx} 
            onClick={s.action}
            className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 text-left transition active:scale-[.99] hover:bg-white/[0.055]"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.04] text-[#00d7f5]">
                <s.icon className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs font-black text-white">{s.title}</h4>
                <p className="text-[10px] text-white/50 mt-0.5">{s.desc}</p>
              </div>
            </span>
            <ChevronRight className="h-4.5 w-4.5 text-white/30" />
          </button>
        ))}

        {/* Minimal settings row for Notifications, Help, and Logout */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <button 
            onClick={() => setActiveDialog({ title: "Help Concierge", content: "Need a hand? Our live concierge matches and booking agents are available 24/7. Chat support is fully enabled for verified members." })}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.02] text-white/70 transition active:scale-95"
          >
            <HelpCircle className="h-4 w-4" /> Help Center
          </button>

          <button
            onClick={onLogout}
            className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#ff2e93]/15 bg-[#ff2e93]/10 text-rose-200 transition active:scale-95"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>

        {/* AUTH-FE-08 / AUTH-BE-08: account lifecycle controls */}
        <DangerZone onLogout={onLogout} />
      </div>

      {/* Minimal dialog popup to prevent screen overload */}
      <AnimatePresence>
        {activeDialog && (
          <motion.div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0f0a14] p-5 shadow-2xl"
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
            >
              <h3 className="font-['Outfit'] text-lg font-black text-white">{activeDialog.title}</h3>
              <p className="text-xs text-white/60 leading-relaxed mt-2">{activeDialog.content}</p>
              <button 
                onClick={() => setActiveDialog(null)}
                className="mt-4 w-full min-h-[38px] rounded-lg bg-white/10 text-xs font-black text-white transition active:scale-95"
              >
                Close Dialog
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Section>
  );
}

function EditProfileSheet({ profile, saving, onClose, onChange, onSave, onPhoto }) {
  const [step, setStep] = React.useState(1);
  const photos = Array.isArray(profile.photos) && profile.photos.length
    ? profile.photos
    : profile.photo ? [profile.photo] : [];
  const hasPhotos = photos.length > 0;

  const setPrimaryPhoto = index => {
    if (!photos[index]) return;
    const next = [photos[index], ...photos.filter((_, photoIndex) => photoIndex !== index)];
    onChange({ ...profile, photo: next[0], photos: next });
  };

  const removePhoto = index => {
    const next = photos.filter((_, photoIndex) => photoIndex !== index);
    onChange({ ...profile, photo: next[0] || '', photos: next });
  };

  // Validate fields in current step before moving forward
  const canContinue = () => {
    if (step === 1) {
      return hasPhotos && Boolean(profile?.fullName) && Boolean(profile?.age) && Boolean(profile?.instagram);
    }
    if (step === 2) {
      return Boolean(profile?.profession) && Boolean(profile?.college) && Boolean(profile?.city);
    }
    return true;
  };

  // Cities List for card selector
  const citiesList = [
    { name: 'Mumbai', vibe: 'Bandra Sunsets & Cafes ☕', code: 'BOM' },
    { name: 'Delhi NCR', vibe: 'GK Cafes & Khan Market 🍂', code: 'DEL' },
    { name: 'Bangalore', vibe: 'Bookstores & Brews 📖', code: 'BLR' },
    { name: 'Pune', vibe: 'KP Greenery & Jazz 🎷', code: 'PNQ' },
    { name: 'Goa', vibe: 'Beachside Coworking & Sunsets 🌊', code: 'GOA' }
  ];

  // Dating Intentions for card grid
  const intentsList = [
    { 
      id: 'Long-term, curated dating', 
      title: 'Curated Romance', 
      desc: 'Committed, high-value partnership.', 
      icon: Heart
    },
    { 
      id: 'Slow dating & deep talk', 
      title: 'Slow Dating', 
      desc: 'Deep talk & bookstores first.', 
      icon: Clock
    },
    { 
      id: 'Offline events first', 
      title: 'Offline Mixers', 
      desc: 'Members-only cocktail mixers.', 
      icon: Users
    },
    { 
      id: 'Cafe dates & book trades', 
      title: 'Cafe Vibe', 
      desc: 'Connecting over coffee & books.', 
      icon: MapPin
    }
  ];

  // Vibes signatures
  const vibesList = [
    { id: 'Cafe partner vibe', label: 'Cafe Partner ☕' },
    { id: 'Concert Vibe', label: 'Concert Vibe 🎵' },
    { id: 'Travel Buddy vibe', label: 'Travel Buddy ✈️' },
    { id: 'Art Gallery vibe', label: 'Art Gallery 🎨' },
    { id: 'Startup Founder vibe', label: 'Founder Vibe 💡' }
  ];

  // Bio suggestions to make writing a bio frictionless
  const bioSuggestions = [
    "Slow-dating, vinyl records, specialty coffees, and real conversations.",
    "Always hunting for the best flat white and indie bookstores in town.",
    "Down for rooftop jazz, weekend tennis, and deep midnight talks."
  ];

  // Holographic scan effect during saving
  const [scanIndex, setScanIndex] = React.useState(0);
  React.useEffect(() => {
    if (saving) {
      const interval = setInterval(() => {
        setScanIndex(prev => (prev < 3 ? prev + 1 : prev));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setScanIndex(0);
    }
  }, [saving]);

  return (
    <motion.div 
      className="fixed inset-0 z-[90] bg-black/85 px-4 py-5 backdrop-blur-2xl flex items-center justify-center overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* SVG Noise overlay definition */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <filter id="profileNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
        </filter>
      </svg>

      <motion.div 
        className="relative w-full max-w-xl flex flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#07040b] shadow-[0_24px_80px_rgba(0,0,0,0.85)] max-h-[92vh]" 
        initial={{ y: 50, scale: 0.95, opacity: 0 }} 
        animate={{ y: 0, scale: 1, opacity: 1 }} 
        exit={{ y: 30, scale: 0.98, opacity: 0 }} 
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      >
        {/* Subtle noise grain */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          filter: 'url(#profileNoise)',
          pointerEvents: 'none',
          zIndex: 1
        }} />

        {/* Ambient drift colors */}
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-[#ff2e93]/10 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 p-5 bg-[#0a060e]/80 backdrop-blur-md">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-fuchsia-400">Profile Studio</p>
            <h2 className="font-['Outfit'] text-2xl font-black text-white">Complete Profile</h2>
          </div>
          <button 
            onClick={onClose} 
            className="inline-flex h-10 min-w-16 items-center justify-center rounded-xl border border-white/18 bg-white/[0.075] px-3 text-center text-xs font-black leading-none text-white/82 transition hover:border-white/28 hover:bg-white/[0.1] hover:text-white active:scale-95"
          >
            Close
          </button>
        </div>

        {saving ? (
          /* HOLOGRAPHIC VIP CARD SCANNER LOADING SCREEN */
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 min-h-[420px] text-center space-y-6">
            <div className="relative w-48 h-72 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-950/20 to-black/80 shadow-[0_0_40px_rgba(0,215,245,0.15)] flex flex-col items-center justify-between p-4 overflow-hidden">
              {/* Scan sweep line */}
              <motion.div 
                className="absolute left-0 right-0 h-1 bg-cyan-400/80 shadow-[0_0_12px_#00d7f5]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              />
              
              {/* Floating micro chip */}
              <div className="w-10 h-8 rounded-md bg-gradient-to-br from-amber-400 to-amber-600 opacity-60 self-start shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
              
              {/* Glowing avatar mask */}
              <div className="w-20 h-20 rounded-full border border-cyan-400/20 bg-cyan-950/30 flex items-center justify-center animate-pulse">
                <ShieldCheck className="w-10 h-10 text-cyan-400/80" />
              </div>
              
              <div className="w-full space-y-1.5 text-left">
                <div className="h-2 w-16 bg-cyan-400/40 rounded" />
                <div className="h-1.5 w-full bg-cyan-400/20 rounded" />
                <div className="h-1.5 w-3/4 bg-cyan-400/20 rounded" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-['Outfit'] text-xl font-black text-white animate-pulse">Encrypting Lounge Passport</h3>
              
              <div className="space-y-1.5 max-w-xs mx-auto text-xs text-white/50 text-left font-mono">
                <p className={scanIndex >= 0 ? "text-cyan-400 font-semibold" : ""}>
                  {scanIndex >= 0 ? "✓" : "●"} Verifying portrait biometrics...
                </p>
                <p className={scanIndex >= 1 ? "text-cyan-400 font-semibold" : ""}>
                  {scanIndex >= 1 ? "✓" : "●"} Authenticating Instagram link...
                </p>
                <p className={scanIndex >= 2 ? "text-cyan-400 font-semibold" : ""}>
                  {scanIndex >= 2 ? "✓" : "●"} Establishing Speakeasy security key...
                </p>
                <p className={scanIndex >= 3 ? "text-fuchsia-400 font-semibold" : ""}>
                  {scanIndex >= 3 ? "✓ VIP Lounge Unlocked!" : "● Finalizing vetting credentials..."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 px-6 pt-5 bg-[#0a060e]/30 flex flex-col space-y-3">
              <div className="relative flex justify-between items-center max-w-sm mx-auto w-full">
                {/* Timeline connecting line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2 -z-10" />
                <div 
                  className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-[#ff2e93] to-[#00d7f5] -translate-y-1/2 -z-10 transition-all duration-300"
                  style={{ width: `${step === 1 ? '0%' : step === 2 ? '25%' : step === 3 ? '50%' : step === 4 ? '75%' : '100%'}` }}
                />

                {/* Node 1 */}
                <button 
                  onClick={() => setStep(1)}
                  type="button"
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    step === 1 
                      ? 'border-[#ff2e93] bg-[#ff2e93]/10 text-white shadow-[0_0_15px_rgba(255,46,147,0.45)]' 
                      : step > 1 
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(0,215,245,0.2)]'
                        : 'border-white/10 bg-[#0f0a15] text-white/40'
                  }`}
                >
                  {step > 1 ? <CheckCircle2 className="w-4 h-4 text-cyan-300" /> : <Camera className="w-4 h-4" />}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider text-white/50 whitespace-nowrap">VIBE</span>
                </button>

                {/* Node 2 */}
                <button 
                  onClick={() => canContinue() || step > 2 ? setStep(2) : null}
                  disabled={!hasPhotos || !profile.fullName || !profile.age || !profile.instagram}
                  type="button"
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    step === 2 
                      ? 'border-[#9b30ff] bg-[#9b30ff]/10 text-white shadow-[0_0_15px_rgba(155,48,255,0.45)]' 
                      : step > 2 
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(0,215,245,0.2)]'
                        : 'border-white/10 bg-[#0f0a15] text-white/40 disabled:opacity-50'
                  }`}
                >
                  {step > 2 ? <CheckCircle2 className="w-4 h-4 text-cyan-300" /> : <Briefcase className="w-4 h-4" />}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider text-white/50 whitespace-nowrap">CREDS</span>
                </button>

                {/* Node 3 */}
                <button 
                  onClick={() => (hasPhotos && profile.fullName && profile.age && profile.instagram && profile.profession && profile.college && profile.city) ? setStep(3) : null}
                  disabled={!hasPhotos || !profile.fullName || !profile.age || !profile.instagram || !profile.profession || !profile.college || !profile.city}
                  type="button"
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    step === 3 
                      ? 'border-[#00d7f5] bg-[#00d7f5]/10 text-white shadow-[0_0_15px_rgba(0,215,245,0.45)]' 
                      : step > 3
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(0,215,245,0.2)]'
                        : 'border-white/10 bg-[#0f0a15] text-white/40 disabled:opacity-50'
                  }`}
                >
                  {step > 3 ? <CheckCircle2 className="w-4 h-4 text-cyan-300" /> : <Pencil className="w-4 h-4" />}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider text-white/50 whitespace-nowrap">BIO</span>
                </button>

                {/* Node 4 */}
                <button 
                  onClick={() => (hasPhotos && profile.fullName && profile.age && profile.instagram && profile.profession && profile.college && profile.city && profile.bio) ? setStep(4) : null}
                  disabled={!hasPhotos || !profile.fullName || !profile.age || !profile.instagram || !profile.profession || !profile.college || !profile.city || !profile.bio}
                  type="button"
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    step === 4 
                      ? 'border-[#9b30ff] bg-[#9b30ff]/10 text-white shadow-[0_0_15px_rgba(155,48,255,0.45)]' 
                      : step > 4
                        ? 'border-cyan-400 bg-cyan-950 text-cyan-300 shadow-[0_0_10px_rgba(0,215,245,0.2)]'
                        : 'border-white/10 bg-[#0f0a15] text-[#ff2e93]/50 disabled:opacity-50'
                  }`}
                >
                  {step > 4 ? <CheckCircle2 className="w-4 h-4 text-cyan-300" /> : <Sparkles className="w-4 h-4" />}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider text-white/50 whitespace-nowrap">INTEL</span>
                </button>

                {/* Node 5 */}
                <button 
                  onClick={() => (hasPhotos && profile.fullName && profile.age && profile.instagram && profile.profession && profile.college && profile.city && profile.bio && (profile.interests || []).length) ? setStep(5) : null}
                  disabled={!hasPhotos || !profile.fullName || !profile.age || !profile.instagram || !profile.profession || !profile.college || !profile.city || !profile.bio}
                  type="button"
                  className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    step === 5 
                      ? 'border-[#ff2e93] bg-[#ff2e93]/10 text-white shadow-[0_0_15px_rgba(255,46,147,0.45)]' 
                      : 'border-white/10 bg-[#0f0a15] text-[#ff2e93]/50 disabled:opacity-50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider text-white/50 whitespace-nowrap">PREFS</span>
                </button>
              </div>

              {/* Glowing spacer */}
              <div className="h-[2px] w-full" />
            </div>

            {/* Form Body Scroll Area */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 max-h-[58vh] no-scrollbar">
              
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Portrait photo uploader */}
                  <div className="flex flex-col items-center justify-center py-2">
                    <label className="group relative cursor-pointer flex flex-col items-center">
                      <input className="sr-only" type="file" accept="image/*" multiple onChange={onPhoto} />
                      
                      {/* Pulse rings */}
                      <div className="absolute inset-0 -m-3 rounded-full border border-fuchsia-500/25 bg-fuchsia-500/5 animate-pulse" />
                      <div className="absolute inset-0 -m-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 animate-pulse delay-75" />

                      <div className="relative w-28 h-28 rounded-full border-2 border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/5 shadow-[0_0_30px_rgba(255,46,147,0.25)] flex items-center justify-center overflow-hidden transition group-hover:scale-105 group-hover:border-fuchsia-300">
                        {photos[0] ? (
                          <div className="relative w-full h-full">
                            <img src={photos[0]} alt="Portrait" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] font-black uppercase text-white tracking-widest transition">
                              Change Photo
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-3 text-fuchsia-200">
                            <Camera className="w-7 h-7 mb-1.5 text-fuchsia-300" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-fuchsia-100">Upload Portrait</span>
                          </div>
                        )}
                      </div>

                      {/* Small badge */}
                      <span className="absolute bottom-0 right-1 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-[#0f0a15] shadow-xl text-fuchsia-300 transition group-hover:scale-110">
                        <ImagePlus className="h-4 w-4" />
                      </span>
                    </label>
                    <p className="text-[11px] text-white/68 text-center mt-3 max-w-xs font-semibold leading-relaxed">
                      Upload at least 1 photo to continue. You can add up to 6 pictures; the first photo becomes your main portrait.
                    </p>
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.028] p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-white">Dating profile photos</p>
                        <p className="text-[10px] text-white/70">{photos.length}/6 uploaded - 1 required</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, index) => {
                        const image = photos[index];
                        return image ? (
                          <div key={index} className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                            <img src={image} alt="" className="h-full w-full object-cover" />
                            <div className="absolute inset-x-1 top-1 flex justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => setPrimaryPhoto(index)}
                                className={`rounded-full px-2 py-1 text-[8px] font-black uppercase ${index === 0 ? 'bg-cyan-300 text-black' : 'bg-black/65 text-white'}`}
                              >
                                {index === 0 ? 'Main' : 'Make main'}
                              </button>
                              <button
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"
                                aria-label="Remove photo"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label key={index} className="grid aspect-[4/5] cursor-pointer place-items-center rounded-2xl border-2 border-dashed border-white/22 bg-white/[0.04] text-white/50 transition hover:border-fuchsia-200/35 hover:bg-white/[0.065] active:scale-95">
                            <input className="sr-only" type="file" accept="image/*" multiple onChange={onPhoto} />
                            <span className="grid gap-1 text-center">
                              <ImagePlus className="mx-auto h-5 w-5" />
                              <span className="text-[9px] font-black uppercase">Add</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tactile input fields */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                      <UserCheck className="w-5 h-5 text-fuchsia-300/70" />
                      <div className="flex-1">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Full Name</span>
                        <input 
                          value={profile.fullName || ''} 
                          onChange={event => onChange({ ...profile, fullName: event.target.value })} 
                          placeholder="e.g. Ishaan Sharma"
                          className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                        />
                      </div>
                      {profile.fullName && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Age */}
                      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-cyan-300/70" />
                        <div className="flex-1">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Age</span>
                          <input 
                            value={profile.age || ''} 
                            onChange={event => onChange({ ...profile, age: event.target.value.replace(/\D/g, '').slice(0, 2) })} 
                            placeholder="e.g. 22"
                            inputMode="numeric"
                            className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                          />
                        </div>
                        {profile.age && parseInt(profile.age) >= 18 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>

                      {/* Instagram */}
                      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                        <Instagram className="w-5 h-5 text-fuchsia-400/70" />
                        <div className="flex-1">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Instagram</span>
                          <input 
                            value={profile.instagram || ''} 
                            onChange={event => onChange({ ...profile, instagram: event.target.value })} 
                            placeholder="e.g. @ishaan_s"
                            className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                          />
                        </div>
                        {profile.instagram && profile.instagram.startsWith('@') && profile.instagram.length > 2 && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <div className="space-y-4">
                    {/* Profession */}
                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-[#9b30ff]/70" />
                      <div className="flex-1">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Profession</span>
                        <input 
                          value={profile.profession || ''} 
                          onChange={event => onChange({ ...profile, profession: event.target.value })} 
                          placeholder="e.g. Product Designer"
                          className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                        />
                      </div>
                      {profile.profession && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>

                    {/* College */}
                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                      <Award className="w-5 h-5 text-amber-300/70" />
                      <div className="flex-1">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">College / University</span>
                        <input 
                          value={profile.college || ''} 
                          onChange={event => onChange({ ...profile, college: event.target.value })} 
                          placeholder="e.g. NMIMS Mumbai"
                          className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                        />
                      </div>
                      {profile.college && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Interactive City Selector Cards */}
                  <div className="space-y-3">
                    <span className="block text-xs font-black uppercase tracking-wider text-white/60">Active Lounge City</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {citiesList.map(c => {
                        const isSelected = profile.city === c.name;
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => onChange({ ...profile, city: c.name })}
                            className={`relative overflow-hidden rounded-2xl p-3 text-left border flex items-center justify-between transition-all duration-300 active:scale-95 ${
                              isSelected 
                                ? 'border-[#ff2e93] bg-[#ff2e93]/5 shadow-[0_0_15px_rgba(255,46,147,0.12)]' 
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            {isSelected && (
                              <motion.div 
                                layoutId="citySpotlight"
                                className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,46,147,0.06),transparent_10rem)] pointer-events-none" 
                              />
                            )}
                            <div className="min-w-0 pr-2">
                              <h4 className="font-['Outfit'] text-xs font-black text-white">{c.name}</h4>
                              <p className="text-[10px] text-white/45 truncate mt-0.5">{c.vibe}</p>
                            </div>
                            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-mono text-[9px] font-black border transition ${
                              isSelected 
                                ? 'border-[#ff2e93]/35 text-[#ff2e93] bg-[#ff2e93]/10' 
                                : 'border-white/10 text-white/30 bg-white/[0.02]'
                            }`}>
                              {c.code}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Intent Selector Grid */}
                  <div className="space-y-2.5">
                    <span className="block text-xs font-black uppercase tracking-wider text-white/60">Dating Intention</span>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      {intentsList.map(item => {
                        const isSelected = profile.intent === item.id;
                        const IconComponent = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => onChange({ ...profile, intent: item.id })}
                            className={`group relative overflow-hidden rounded-2xl p-3 text-left border flex flex-col justify-between min-h-[92px] transition active:scale-95 ${
                              isSelected 
                                ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(0,215,245,0.1)]' 
                                : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex justify-between items-start w-full">
                              <span className={`w-7 h-7 rounded-lg flex items-center justify-center border transition ${
                                isSelected 
                                  ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10' 
                                  : 'border-white/10 text-white/40 bg-white/[0.02] group-hover:text-white/60'
                              }`}>
                                <IconComponent className="w-3.5 h-3.5" />
                              </span>
                              
                              {isSelected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00d7f5]" />
                              )}
                            </div>
                            
                            <div className="mt-2.5">
                              <h4 className="font-['Outfit'] text-[11px] font-black text-white">{item.title}</h4>
                              <p className="text-[9px] text-white/45 leading-tight mt-0.5 truncate">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Vibe Selector Chips */}
                  <div className="space-y-2.5">
                    <span className="block text-xs font-black uppercase tracking-wider text-white/60">Primary Vibe Signature</span>
                    
                    <div className="flex flex-wrap gap-2">
                      {vibesList.map(v => {
                        const isSelected = profile.vibe === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => onChange({ ...profile, vibe: v.id })}
                            className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide border transition-all duration-200 active:scale-95 ${
                              isSelected 
                                ? 'border-[#9b30ff] bg-[#9b30ff]/20 text-[#bf86ff] shadow-[0_0_10px_rgba(155,48,255,0.2)]' 
                                : 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.04] hover:text-white'
                            }`}
                          >
                            {v.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Weekend Status</span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/15 bg-cyan-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-cyan-200">
                        <Calendar className="h-3 w-3" />
                        Visible on profile
                      </span>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 transition focus-within:border-cyan-300/30 focus-within:bg-white/[0.04]">
                      <textarea
                        value={profile.weekendStatus || ''}
                        onChange={event => onChange({ ...profile, weekendStatus: event.target.value })}
                        rows={2}
                        placeholder="Looking for coffee, live music, a gallery walk, or a quiet dinner this weekend..."
                        className="w-full resize-none bg-transparent text-xs leading-relaxed text-white outline-none placeholder-white/20"
                      />
                    </div>
                  </div>

                  {/* Dating Bio Area with Assistive Suggestions */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Speakeasy Biography Cues</span>
                      <span className={`text-[10px] font-mono ${
                        (profile.bio || '').length > 120 
                          ? 'text-cyan-400' 
                          : (profile.bio || '').length > 20 
                            ? 'text-emerald-400' 
                            : 'text-rose-400'
                      }`}>
                        {(profile.bio || '').length} chars
                      </span>
                    </div>

                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-3 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition flex flex-col gap-2">
                      <textarea 
                        value={profile.bio || ''} 
                        onChange={event => onChange({ ...profile, bio: event.target.value })} 
                        rows={3} 
                        placeholder="Share a bit about your books, values, favorite vinyls, weekend escapes..."
                        className="w-full bg-transparent text-xs text-white leading-relaxed outline-none resize-none placeholder-white/20"
                      />
                      
                      {/* Floating suggestion pills */}
                      <div className="flex flex-col gap-1 border-t border-white/5 pt-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Select Vibe Template to Fill</span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {bioSuggestions.map((s, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => onChange({ ...profile, bio: s })}
                              className="rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 px-2 py-1 text-[8.5px] font-semibold text-white/60 text-left transition truncate max-w-full"
                            >
                              "{s.slice(0, 48)}..."
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar"
                >
                  {/* Intents Selector */}
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Dating & Connection Goals</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Select all goals that apply to your connection style.</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {['Relationship', 'Dating', 'Marriage', 'Friends', 'Activity Partner', 'Event Networking'].map(goal => {
                        const currentIntents = Array.isArray(profile.intents) ? profile.intents : [];
                        const isSelected = currentIntents.includes(goal);
                        return (
                          <button
                            key={goal}
                            type="button"
                            onClick={() => {
                              const nextIntents = isSelected 
                                ? currentIntents.filter(g => g !== goal) 
                                : [...currentIntents, goal];
                              onChange({ ...profile, intents: nextIntents });
                            }}
                            className={`rounded-xl px-3 py-2 text-left border text-xs font-bold transition-all duration-300 active:scale-95 ${
                              isSelected 
                                ? 'border-[#ff2e93] bg-[#ff2e93]/10 text-white shadow-[0_0_10px_rgba(255,46,147,0.15)]' 
                                : 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span>{goal}</span>
                              <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                isSelected ? 'border-[#ff2e93] bg-[#ff2e93] text-white' : 'border-white/20 bg-transparent'
                              }`}>
                                {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Weighted Interests */}
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Interest Engine Weights</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Tap an interest to toggle, and set how much you love it.</p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {['Movies', 'Coffee', 'Road Trips', 'Night Outs', 'Pickleball', 'Gaming', 'Fitness', 'Travel', 'Food', 'Music', 'Startups', 'Photography', 'Sports', 'Reading', 'Networking'].map(interestName => {
                        const currentInterests = Array.isArray(profile.interests) ? profile.interests : [];
                        const existing = currentInterests.find(i => i.interest === interestName);
                        const isSelected = Boolean(existing);
                        const currentWeight = existing ? existing.weight : 1;

                        const setWeight = (w) => {
                          const nextInterests = isSelected 
                            ? currentInterests.map(i => i.interest === interestName ? { ...i, weight: w } : i)
                            : [...currentInterests, { interest: interestName, weight: w }];
                          onChange({ ...profile, interests: nextInterests });
                        };

                        const toggleInterest = () => {
                          const nextInterests = isSelected 
                            ? currentInterests.filter(i => i.interest !== interestName) 
                            : [...currentInterests, { interest: interestName, weight: 1 }];
                          onChange({ ...profile, interests: nextInterests });
                        };

                        return (
                          <div 
                            key={interestName} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border p-2.5 transition-all duration-300 gap-2 ${
                              isSelected ? 'border-white/10 bg-white/[0.04]' : 'border-white/5 bg-transparent'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={toggleInterest}
                              className="flex items-center gap-2 text-left animate-none"
                            >
                              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                                isSelected ? 'border-[#00d7f5] bg-[#00d7f5]' : 'border-white/20 bg-transparent'
                              }`} />
                              <span className={`text-xs font-black uppercase tracking-wide transition-all ${
                                isSelected ? 'text-white' : 'text-white/40'
                              }`}>
                                {interestName}
                              </span>
                            </button>

                            {isSelected && (
                              <div className="flex gap-1.5 shrink-0 self-end sm:self-auto">
                                {[
                                  { label: 'Interested', weight: 1, colorClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/25' },
                                  { label: 'Like', weight: 3, colorClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-400/25' },
                                  { label: 'Love', weight: 5, colorClass: 'bg-purple-600/20 text-purple-300 border-purple-500/30 font-extrabold shadow-[0_0_8px_rgba(155,48,255,0.2)]' }
                                ].map(btn => {
                                  const isWeightSelected = currentWeight === btn.weight;
                                  return (
                                    <button
                                      key={btn.weight}
                                      type="button"
                                      onClick={() => setWeight(btn.weight)}
                                      className={`rounded-lg border px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                                        isWeightSelected 
                                          ? btn.colorClass
                                          : 'border-white/5 bg-transparent text-white/30 hover:text-white/50'
                                      }`}
                                    >
                                      {btn.label}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar"
                >
                  {/* Preferred Gender */}
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Preferred Matching Gender</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Filter candidate pool based on gender identity.</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {['Male', 'Female', 'All'].map(genderOpt => {
                        const currentPref = profile.preferred_gender || 'All';
                        const isSelected = currentPref === genderOpt;
                        return (
                          <button
                            key={genderOpt}
                            type="button"
                            onClick={() => onChange({ ...profile, preferred_gender: genderOpt })}
                            className={`rounded-xl px-3 py-2 text-center border text-xs font-black uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                              isSelected 
                                ? 'border-[#ff2e93] bg-[#ff2e93]/15 text-white shadow-[0_0_10px_rgba(255,46,147,0.15)]' 
                                : 'border-white/5 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
                            }`}
                          >
                            {genderOpt}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preferred Age Range */}
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Preferred Age Limits</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Define compatible age ranges for matching.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Min Age */}
                      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                        <div className="flex-1">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Minimum Age</span>
                          <input 
                            value={profile.min_age !== undefined ? profile.min_age : 18} 
                            onChange={event => onChange({ ...profile, min_age: Math.max(18, Number(event.target.value.replace(/\D/g, '').slice(0, 2))) })} 
                            placeholder="18"
                            inputMode="numeric"
                            className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                          />
                        </div>
                      </div>

                      {/* Max Age */}
                      <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                        <div className="flex-1">
                          <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Maximum Age</span>
                          <input 
                            value={profile.max_age !== undefined ? profile.max_age : 99} 
                            onChange={event => onChange({ ...profile, max_age: Math.min(99, Number(event.target.value.replace(/\D/g, '').slice(0, 2))) })} 
                            placeholder="99"
                            inputMode="numeric"
                            className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferred Distance */}
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-black uppercase tracking-wider text-white/60">Preferred Distance Radius</span>
                      <p className="text-[10px] text-white/40 mt-0.5">Maximum geographical range in kilometers.</p>
                    </div>

                    <div className="relative rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 focus-within:border-fuchsia-400/30 focus-within:bg-white/[0.04] transition duration-200 flex items-center gap-3">
                      <div className="flex-1">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-white/45">Max Distance (KM)</span>
                        <input 
                          value={profile.preferred_distance_km !== undefined ? profile.preferred_distance_km : 100} 
                          onChange={event => onChange({ ...profile, preferred_distance_km: Number(event.target.value.replace(/\D/g, '').slice(0, 4)) })} 
                          placeholder="100"
                          inputMode="numeric"
                          className="w-full bg-transparent text-sm text-white font-semibold outline-none py-0.5 placeholder-white/20"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </div>
          </>
        )}

        {/* Footer Actions */}
        <div className="relative z-10 border-t border-white/10 p-5 bg-[#0a060e]/80 flex gap-3 backdrop-blur-md">
          {step > 1 && !saving && (
            <button 
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="flex min-h-[46px] px-5 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-white/80 hover:text-white font-bold text-xs transition active:scale-95 hover:bg-white/[0.08]"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          {step < 5 && !saving ? (
            <button 
              type="button"
              disabled={!canContinue()}
              onClick={() => setStep(prev => prev + 1)}
              className="flex-1 flex min-h-[46px] items-center justify-center gap-1.5 rounded-xl bg-white text-[#050506] font-black text-xs uppercase tracking-wider transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-white/90 shadow-[0_4px_12px_rgba(255,255,255,0.15)]"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : !saving ? (
            <button 
              type="button"
              disabled={saving}
              onClick={onSave}
              className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff2e93] via-[#9b30ff] to-[#00d7f5] text-white font-black text-xs uppercase tracking-wider transition active:scale-95 shadow-[0_8px_25px_rgba(255,46,147,0.35)] disabled:opacity-40 disabled:pointer-events-none hover:brightness-105"
            >
              Complete Admissions Studio <Sparkles className="h-4.5 w-4.5" />
            </button>
          ) : (
            <div className="flex-1 flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-950/20 text-cyan-300 font-black text-xs uppercase tracking-widest animate-pulse">
              Securing Pass...
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function Section({ eyebrow, title, action, children }) {
  return (
    <MotionSection className="mt-7" data-profile-card>
      <SectionHeader eyebrow={eyebrow} title={title} action={action} />
      {children}
    </MotionSection>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-fuchsia-300/70">{eyebrow}</p>
        <h2 className="mt-1 font-['Outfit'] text-3xl font-black tracking-normal">{title}</h2>
      </div>
      {action && <button className="hidden rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-black text-white/72 transition hover:bg-white/10 sm:block">{action}</button>}
    </div>
  );
}

function MotionSection({ className = '', children, ...props }) {
  return <motion.section variants={fadeUp} className={className} {...props}>{children}</motion.section>;
}

function GlassCard({ className = '', children }) {
  return (
    <motion.div whileTap={{ scale: 0.985 }} className={`rounded-[26px] border border-white/10 bg-white/[0.055] shadow-[0_18px_60px_rgba(0,0,0,.28)] backdrop-blur-xl transition hover:border-fuchsia-200/20 hover:bg-white/[0.075] ${className}`} data-profile-card>
      {children}
    </motion.div>
  );
}

function StatWidget({ label, value, hint, sub, icon: Icon }) {
  return (
    <GlassCard className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.07] text-fuchsia-100"><Icon className="h-5 w-5" /></span>
        {hint && <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] font-black text-cyan-100">{hint}</span>}
      </div>
      <motion.p className="font-['Outfit'] text-3xl font-black" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>{value}</motion.p>
      <p className="mt-1 text-sm font-bold text-white/72">{label}</p>
      {sub && <p className="mt-1 text-xs text-white/42">{sub}</p>}
    </GlassCard>
  );
}

function Progress({ value }) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/10">
      <motion.div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300" initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.9, ease: 'easeOut' }} />
    </div>
  );
}

function ProgressRing({ value, label, color = 'pink' }) {
  const ring = color === 'cyan' ? '#67e8f9' : '#f0abfc';
  return (
    <div className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(${ring} ${value * 3.6}deg, rgba(255,255,255,.09) 0deg)` }}>
      <div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[#0b090f] text-center">
        <div>
          <p className="font-['Outfit'] text-2xl font-black">{value}%</p>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
        </div>
      </div>
    </div>
  );
}

function TapButton({ className = '', children, onClick }) {
  return <motion.button whileTap={{ scale: 0.965 }} onClick={onClick} className={`min-h-14 rounded-[22px] px-5 text-base font-black transition ${className}`}>{children}</motion.button>;
}

function Badge({ icon: Icon, text, tone = 'pink' }) {
  const tones = {
    pink: 'border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100',
    cyan: 'border-cyan-300/25 bg-cyan-300/10 text-cyan-100',
    gold: 'border-amber-200/25 bg-amber-200/10 text-amber-100',
    blue: 'border-blue-300/25 bg-blue-300/10 text-blue-100',
    emerald: 'border-emerald-300/25 bg-emerald-300/10 text-emerald-100'
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${tones[tone]}`}><Icon className="h-3.5 w-3.5" />{text}</span>;
}

function Chip({ children }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-bold text-white/68">{children}</span>;
}

function MiniMetric({ value, label }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center"><p className="font-['Outfit'] text-xl font-black">{value}</p><p className="text-[11px] text-white/42">{label}</p></div>;
}

function Row({ label, icon: Icon, danger, onClick }) {
  return (
    <button onClick={onClick} className={`flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition active:scale-[.99] ${danger ? 'text-rose-200' : 'text-white/76'}`}>
      <span className="flex items-center gap-3"><Icon className="h-5 w-5" /> <span className="text-sm font-bold">{label}</span></span>
      <ChevronRight className="h-5 w-5 text-white/25" />
    </button>
  );
}

function UserInitials({ name }) {
  const initials = (name || 'ID').split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase();
  return <span className="font-['Outfit'] text-3xl font-black">{initials}</span>;
}

function TicketIcon(props) {
  return <Gem {...props} />;
}

// Satisfying animated counter component for high-converting social proof
function AnimatedCounter({ value, duration = 1.6, suffix = "" }) {
  const [count, setCount] = React.useState(0);
  
  React.useEffect(() => {
    let start = 0;
    // Extract numerical values
    const end = parseInt(value.replace(/[^0-9]/g, ''));
    if (isNaN(end)) {
      setCount(value);
      return;
    }
    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / 50), 16);
    const step = Math.ceil(end / 50);
    
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);
    
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}{suffix}</span>;
}

function GatekeeperAdmissions({ onApply, onDemoLogin, authUser, onGoogleLogin }) {
  const [inviteCode, setInviteCode] = React.useState('');
  const [inviteStatus, setInviteStatus] = React.useState(null); // 'checking' | 'valid' | 'invalid'
  const [liveMatches, setLiveMatches] = React.useState(14);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setLiveMatches(prev => prev + (Math.random() > 0.75 ? 1 : 0));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  function handleInviteVerify() {
    if (!inviteCode.trim()) return;
    setInviteStatus('checking');
    setTimeout(() => {
      const code = inviteCode.trim().toUpperCase();
      if (['VIP777', 'CLUB2026', 'ELITE2026', 'LOVE2026'].includes(code)) {
        setInviteStatus('valid');
        setTimeout(() => {
          onApply();
        }, 900);
      } else {
        setInviteStatus('invalid');
      }
    }, 850);
  }

  const reviews = [
    { name: "Natasha R.", city: "Bandra West", match: "94% Match", time: "Admitted 2m ago", tone: "pink" },
    { name: "Kabir K.", city: "GK-2, Delhi", match: "98% Match", time: "Admitted 12m ago", tone: "purple" },
    { name: "Ishaan V.", city: "Juhu, Mumbai", match: "92% Match", time: "Under Review", tone: "cyan" }
  ];

  return (
    <div className="flex flex-col gap-6 py-4 overflow-hidden">
      
      {/* 1. TOP HERO SECTION */}
      <motion.div 
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-white/[0.065] to-white/[0.01] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
      >
        {/* Ambient Drifts */}
        <div className="pointer-events-none absolute -left-16 -top-24 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-[#ff2e93]/10 blur-3xl" />

        {/* Intertwined Heart Logo */}
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-400/10 shadow-[0_0_30px_rgba(245,158,11,0.15)]">
          <svg className="h-8 w-8 text-amber-300" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21C12 21 3 13.5 3 7.5C3 4.5 5.5 2 8.5 2C10.5 2 11.5 3 12 4C12.5 3 13.5 2 15.5 2C18.5 2 21 4.5 21 7.5C21 13.5 12 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 18C12 18 6 12.5 6 7.5C6 5.5 7.5 4 9.5 4C11 4 11.5 5 12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <span className="mt-4 inline-flex items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/5 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-amber-200">
          Admissions speakeasy
        </span>

        <h1 className="mt-3 font-['Outfit'] text-3xl font-black leading-[1.08] tracking-tight text-white">
          Your social life,<br /><span className="bg-gradient-to-r from-[#ff2e93] via-purple-400 to-[#00d7f5] bg-clip-text text-transparent">on demand.</span>
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-xs font-semibold leading-relaxed text-white/50">
          Find people for movies, coffee, games, trips, events, and whatever you are doing next.
        </p>

        {/* Action CTAs */}
        <div className="mt-6 flex flex-col gap-2.5 px-2">
          {!authUser && (
            <motion.button 
              whileTap={{ scale: 0.975 }}
              onClick={onGoogleLogin}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-black text-[#111827] shadow-[0_12px_30px_rgba(255,255,255,0.14)]"
            >
              <UserCheck className="h-4.5 w-4.5 text-[#4285f4]" /> Continue with Google
            </motion.button>
          )}
          <motion.button 
            whileTap={{ scale: 0.975 }}
            onClick={onApply}
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff2e93] via-[#9b30ff] to-[#00d7f5] text-sm font-black text-white shadow-[0_12px_30px_rgba(255,46,147,0.25)]"
          >
            <Crown className="h-4.5 w-4.5" /> Request Club Admissions
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={onApply}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-[#120f18] text-[11px] font-black text-white"
            >
              <Instagram className="h-3.5 w-3.5 text-[#ff2e93]" /> Instagram
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.97 }}
              onClick={onApply}
              className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-[#0c121a] text-[11px] font-black text-white"
            >
              <Radio className="h-3.5 w-3.5 text-[#00d7f5]" /> Phone Sign-in
            </motion.button>
          </div>

          <button 
            onClick={onDemoLogin}
            className="mt-3 text-[10px] font-black tracking-wider text-amber-200 hover:text-amber-300 transition uppercase underline decoration-dashed shrink-0"
          >
            Already an Approved Member? Concierge Login
          </button>
        </div>
      </motion.div>

      {/* 2. THE SNEAK PEEK & FOMO (Curiosity Locked Previews) */}
      <GlassCard className="p-4 relative overflow-hidden">
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-fuchsia-300/70">Inside the speakeasy tonight</p>
            <h3 className="font-['Outfit'] text-lg font-black text-white">Active Members Feed</h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] text-white/40 font-bold bg-white/[0.04] px-2 py-0.5 rounded">
            <Lock className="h-3 w-3 text-amber-200" /> Locked Preview
          </span>
        </div>

        {/* Locked Gallery Scroll */}
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1.5 select-none pointer-events-none">
          <div className="relative min-w-[200px] max-w-[200px] shrink-0 rounded-2xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-xl">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 rounded-2xl backdrop-blur-[5.5px]">
              <Lock className="h-4 w-4 text-amber-200/80" />
              <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-amber-100/60">Apply to view</p>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-violet-500/20 shrink-0" />
              <div>
                <h4 className="font-['Outfit'] text-xs font-black text-white/80">Kavya S., 22</h4>
                <p className="text-[10px] text-[#ff2e93] font-bold">98% Vibe Match</p>
              </div>
            </div>
            <p className="mt-2.5 text-[9.5px] text-white/30 italic">"100% deep talker on the balcony, aux tech-house..."</p>
          </div>

          <div className="relative min-w-[200px] max-w-[200px] shrink-0 rounded-2xl border border-white/5 bg-white/[0.03] p-3 backdrop-blur-xl">
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 rounded-2xl backdrop-blur-[5.5px]">
              <Lock className="h-4 w-4 text-cyan-200/80" />
              <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-cyan-100/60">Apply to view</p>
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-500/20 shrink-0" />
              <div>
                <h4 className="font-['Outfit'] text-xs font-black text-white/80">Zara C., 23</h4>
                <p className="text-[10px] text-cyan-200 font-bold">96% Vibe Match</p>
              </div>
            </div>
            <p className="mt-2.5 text-[9.5px] text-white/30 italic">"Indie bookstores, film portraits, coffee hops..."</p>
          </div>
        </div>

        {/* Live matching indicator bar */}
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-bold text-white/70">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#ff2e93] animate-ping" />
            <span>{liveMatches} matches active in Mumbai tonight</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-[#00d7f5]">High Outing Activity</span>
        </div>
      </GlassCard>

      {/* 3. ADMISSIONS VETTING BOARD & VIP CODE */}
      <GlassCard className="p-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">Vetting board status</p>
            <h3 className="font-['Outfit'] text-base font-black text-white mt-0.5">Capacity Reached: 92%</h3>
          </div>
          <span className="rounded-lg bg-white/[0.04] px-2.5 py-1 text-[10px] font-black text-cyan-200 shrink-0">
            3 Invites Open Today
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2.5 text-center text-xs">
          <div className="rounded-xl bg-white/[0.02] py-2">
            <p className="font-['Outfit'] font-black text-amber-200"><AnimatedCounter value="7" suffix=".2%" /></p>
            <p className="text-[8.5px] text-white/40 uppercase tracking-wider mt-0.5">Admit Rate</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] py-2">
            <p className="font-['Outfit'] font-black text-fuchsia-300"><AnimatedCounter value="187" /></p>
            <p className="text-[8.5px] text-white/40 uppercase tracking-wider mt-0.5">Vetting Queue</p>
          </div>
          <div className="rounded-xl bg-white/[0.02] py-2">
            <p className="font-['Outfit'] font-black text-cyan-200"><AnimatedCounter value="14" /></p>
            <p className="text-[8.5px] text-white/40 uppercase tracking-wider mt-0.5">Approved</p>
          </div>
        </div>

        {/* Live Review Queue Feed */}
        <div className="mt-4 pt-3.5 border-t border-white/5 space-y-1.5">
          {reviews.map((r, i) => (
            <div key={i} className="flex items-center justify-between text-[11px] text-white/40">
              <span className="flex items-center gap-1.5">
                <span className={`h-1 w-1 rounded-full ${r.tone === 'pink' ? 'bg-[#ff2e93]' : r.tone === 'purple' ? 'bg-purple-400' : 'bg-cyan-300'}`} />
                <strong className="text-white/70 font-semibold">{r.name}</strong> ({r.city})
              </span>
              <span>{r.time}</span>
            </div>
          ))}
        </div>

        {/* VIP Invite Code Field embedded directly */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/50 mb-2">Have a VIP Invite Code?</p>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="e.g. VIP777" 
              value={inviteCode} 
              onChange={(e) => {
                setInviteCode(e.target.value);
                setInviteStatus(null);
              }}
              className="flex-1 h-9 px-3 rounded-lg bg-white/[0.03] border border-white/5 text-white placeholder-white/20 text-xs font-black tracking-widest outline-none transition focus:border-amber-300/30 text-center uppercase"
            />
            <button 
              onClick={handleInviteVerify} 
              className="px-4 rounded-lg bg-[#ff2e93] text-white font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              {inviteStatus === 'checking' ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : inviteStatus === 'valid' ? (
                'Approved'
              ) : (
                'Unlock 🔑'
              )}
            </button>
          </div>
          {inviteStatus === 'invalid' && (
            <p className="text-[10px] text-rose-400 mt-1.5 font-bold">Invalid or expired VIP invitation code.</p>
          )}
          {inviteStatus === 'valid' && (
            <p className="text-[10px] text-emerald-400 mt-1.5 font-bold">Lounge unlocked! Opening admissions studio...</p>
          )}
          <div className="mt-3 flex items-center justify-between text-[10.5px] font-bold text-white/40">
            <span>Tip: Try bypass code "VIP777"</span>
            <button onClick={onDemoLogin} className="text-amber-200 hover:text-amber-300 transition">
              Concierge Login 🔑
            </button>
          </div>
        </div>
      </GlassCard>

      {/* 4. FOOTER */}
      <footer className="mt-4 border-t border-white/5 pt-6 pb-2 text-center text-[9px] text-white/25 space-y-3">
        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 font-bold uppercase tracking-wider">
          <a href="#" className="hover:text-white transition">About</a>
          <a href="#" className="hover:text-white transition">Safety</a>
          <a href="#" className="hover:text-white transition">Privacy</a>
          <a href="#" className="hover:text-white transition">Terms</a>
          <a href="#" className="hover:text-white transition">Guidelines</a>
        </div>
        <p>© 2026 Instadate Speakeasy. Manually Reviewed Offline Outing Club.</p>
      </footer>

    </div>
  );
}

// --- MATCHMAKING & CURATION INTELLIGENCE HUB ---
function MatchmakingHub({ appState, onApiCall }) {
  const [activeTab, setActiveTab] = React.useState('topMatches');
  const [matchingNote, setMatchingNote] = React.useState({});
  const [vibeRequestOpen, setVibeRequestOpen] = React.useState({});

  const categories = [
    { id: 'topMatches', label: 'Top Matches 🏆', list: appState?.discovery?.topMatches || [] },
    { id: 'nearYou', label: 'Near You 📍', list: appState?.discovery?.nearYou || [] },
    { id: 'similarVibes', label: 'Similar Vibes ✨', list: appState?.discovery?.similarVibes || [] },
    { id: 'activeMembers', label: 'Active ⚡', list: appState?.discovery?.activeMembers || [] },
    { id: 'newMembers', label: 'New Members 🆕', list: appState?.discovery?.newMembers || [] },
    { id: 'trendingMembers', label: 'Trending 🔥', list: appState?.discovery?.trendingMembers || [] }
  ];

  const currentList = categories.find(c => c.id === activeTab)?.list || [];

  async function handleMatch(candidateId, name) {
    const note = matchingNote[candidateId] || 'Curated match request!';
    await onApiCall('/api/matches', 'POST', {
      memberId: candidateId,
      memberName: name,
      note
    });
    setVibeRequestOpen(prev => ({ ...prev, [candidateId]: false }));
  }

  async function handleReject(candidateId) {
    await onApiCall('/api/rejections', 'POST', { targetId: candidateId });
  }

  async function handleBlock(candidateId) {
    await onApiCall('/api/blocks', 'POST', { targetId: candidateId });
  }

  return (
    <div className="mt-8 rounded-[32px] border border-white/10 bg-gradient-to-br from-white/[0.045] to-white/[0.025] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl relative overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,46,147,0.08),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(0,215,245,0.06),transparent_50%)] pointer-events-none" />

      <div className="relative mb-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-lg">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.24em] text-fuchsia-400">Instadate Intelligence</span>
        </div>
        <h3 className="font-['Outfit'] text-2xl font-black text-white">Curated Speakeasy Matches</h3>
        <p className="text-xs text-white/60 mt-2 font-semibold max-w-2xl">Real compatibility scoring. No generic swipes, just high-value discoveries.</p>
      </div>

      {/* Categories horizontal list */}
      <div className="relative no-scrollbar flex gap-2 overflow-x-auto pb-3">
        {categories.map(cat => {
          const isSelected = activeTab === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`relative rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wide border transition-all duration-300 active:scale-95 shrink-0 ${
                isSelected
                  ? 'border-fuchsia-500/50 bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 text-white shadow-[0_0_20px_rgba(255,46,147,0.3)]'
                  : 'border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:border-white/20 hover:text-white/70'
              }`}
            >
              <span className="relative z-10">{cat.label} {cat.icon} ({cat.list.length})</span>
              {isSelected && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

      {/* Grid of matched cards */}
      {currentList.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-white/10 p-8 text-center bg-black/10">
          <Sparkles className="mx-auto h-8 w-8 text-white/20 animate-pulse" />
          <h4 className="mt-3 font-semibold text-sm text-white/60">Finding Speakeasy Partners...</h4>
          <p className="text-xs text-white/40 max-w-xs mx-auto mt-1">Complete more profile questions or interests to optimize compatibility indexing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mt-3">
          {currentList.map(cand => {
            const hasSent = appState?.vibeRequests?.[cand.id];
            const isNoteOpen = vibeRequestOpen[cand.id];
            return (
              <div 
                key={cand.id} 
                className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 flex flex-col sm:flex-row gap-4 transition-all duration-300 hover:border-white/12 hover:bg-white/[0.035] group"
              >
                {/* Photo and dynamic glow match score */}
                <div className="relative h-28 w-full sm:w-24 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]">
                  {cand.profile.photo ? (
                    <img src={cand.profile.photo} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 flex items-center justify-center font-['Outfit'] font-black text-xl text-white/50">
                      {cand.profile.fullName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Glowing match badge */}
                  <span className="absolute top-1.5 right-1.5 rounded-lg bg-black/75 border border-cyan-400/35 px-1.5 py-0.5 text-[9px] font-black tracking-wide text-cyan-300 shadow-[0_0_8px_rgba(0,215,245,0.3)]">
                    {cand.score}% Match
                  </span>
                </div>

                {/* Candidate credentials & explanations */}
                <div className="flex-1 min-w-0">
                  <h4 className="flex items-center gap-1.5 font-['Outfit'] text-lg font-black text-white leading-tight">
                    {cand.profile.fullName}, {cand.profile.age}
                    {renderVerificationBadge(cand.profile.verification_level)}
                  </h4>
                  <p className="text-[11px] text-white/60 font-semibold mt-1">
                    {cand.profile.profession || 'Creative Professional'} at {cand.profile.college || 'Verified College'}
                  </p>
                  <p className="text-[10px] text-[#ff2e93] font-bold mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" /> {cand.profile.city || 'Mumbai Lounge'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-md border border-cyan-400/20 bg-cyan-400/5 px-2 py-0.5 font-black text-cyan-200">
                      Reliability: {cand.trustScore || cand.profile.trustMetrics?.trustScore || 90}%
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-fuchsia-400/20 bg-fuchsia-400/5 px-2 py-0.5 font-black text-fuchsia-200">
                      Would Meet Again: {cand.profile.trustMetrics?.would_meet_again_pct || 100}%
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-2 py-0.5 font-black text-emerald-200">
                      Attendance: {cand.profile.trustMetrics?.attendance_score || 100}%
                    </span>
                  </div>

                  {/* Matching Factors / Reasons */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {cand.explanation.map((reason, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center gap-1 rounded-md border border-cyan-300/15 bg-cyan-400/5 px-2 py-0.5 text-[9px] font-bold text-cyan-200"
                      >
                        ✓ {reason}
                      </span>
                    ))}
                  </div>

                  <p className="mt-2 text-xs italic leading-relaxed text-white/50 line-clamp-2">
                    "{cand.profile.bio || 'Admitted speakeasy member.'}"
                  </p>

                  {/* Curated Action buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {hasSent ? (
                      <span className="inline-flex min-h-[34px] px-4 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-950/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider animate-pulse">
                        ✓ Match Request Active
                      </span>
                    ) : isNoteOpen ? (
                      <div className="flex flex-col gap-2 w-full mt-2">
                        <input 
                          type="text"
                          placeholder="Include a bespoke note to match (e.g. coffee this Saturday?)"
                          value={matchingNote[cand.id] || ''}
                          onChange={(e) => setMatchingNote(prev => ({ ...prev, [cand.id]: e.target.value }))}
                          className="h-9 w-full px-3 rounded-lg bg-white/[0.04] border border-white/10 text-white placeholder-white/20 text-xs font-semibold outline-none focus:border-[#ff2e93]/30"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleMatch(cand.id, cand.profile.fullName)}
                            className="h-8 px-4 rounded-lg bg-[#ff2e93] text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-[0_4px_12px_rgba(255,46,147,0.2)]"
                          >
                            Send Vibe Request ✉
                          </button>
                          <button
                            onClick={() => setVibeRequestOpen(prev => ({ ...prev, [cand.id]: false }))}
                            className="h-8 px-3 rounded-lg border border-white/10 bg-white/[0.02] text-white/70 text-[10px] font-bold transition hover:bg-white/[0.05]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setVibeRequestOpen(prev => ({ ...prev, [cand.id]: true }))}
                          className="inline-flex min-h-[34px] px-4 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#ff2e93] to-purple-500 text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-[0_4px_12px_rgba(255,46,147,0.2)] hover:brightness-105"
                        >
                          Request Vibe Match <Heart className="h-3.5 w-3.5 fill-white" />
                        </button>
                        <button
                          onClick={() => handleReject(cand.id)}
                          className="inline-flex min-h-[34px] px-3 items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/40 hover:text-rose-400 transition"
                          title="Reject"
                        >
                          <X className="h-4.5 w-4.5" />
                        </button>
                        <button
                          onClick={() => handleBlock(cand.id)}
                          className="inline-flex min-h-[34px] px-3 items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/40 hover:text-white/60 transition"
                          title="Block"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- INSTANT PLANS LOUNGE ---
function InstantPlansLounge({ appState, onApiCall }) {
  const [creatorOpen, setCreatorOpen] = React.useState(false);
  const [newPlan, setNewPlan] = React.useState({
    title: '',
    activity: 'Coffee Meetup',
    time: 'Tonight at 8 PM',
    location: 'Bandra Brew Room',
    capacity: 4
  });

  const activePlans = appState?.instantPlans || [];

  async function handleJoin(planId) {
    await onApiCall(`/api/instant-plans/${planId}/join`, 'POST');
  }

  async function handleLeave(planId) {
    await onApiCall(`/api/instant-plans/${planId}/join`, 'DELETE');
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newPlan.title.trim()) return;
    await onApiCall('/api/instant-plans', 'POST', { plan: newPlan });
    setNewPlan({
      title: '',
      activity: 'Coffee Meetup',
      time: 'Tonight at 8 PM',
      location: 'Bandra Brew Room',
      capacity: 4
    });
    setCreatorOpen(false);
  }

  return (
    <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">Instant Outings</span>
          <h3 className="font-['Outfit'] text-2xl font-black text-white mt-1">Immediate Outing Plans</h3>
        </div>
        <button
          onClick={() => setCreatorOpen(prev => !prev)}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-[#9b30ff] px-4 text-xs font-black uppercase tracking-wider text-white shadow-[0_4px_12px_rgba(0,215,245,0.2)] transition active:scale-95 hover:brightness-105"
        >
          {creatorOpen ? 'Close Form' : 'Propose Plan 🚀'}
        </button>
      </div>

      {creatorOpen && (
        <form onSubmit={handleCreate} className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
          <h4 className="font-['Outfit'] text-sm font-black text-white uppercase tracking-wider">Bespoke Outing Proposal</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/45">Outing Activity</span>
              <select 
                value={newPlan.activity}
                onChange={(e) => setNewPlan(prev => ({ ...prev, activity: e.target.value }))}
                className="h-10 w-full rounded-xl bg-[#120f18] border border-white/10 text-white text-xs font-semibold px-3 outline-none"
              >
                {['Coffee Meetup', 'Movie Tonight', 'Road Trip', 'Pickleball Match', 'Night Out'].map(act => (
                  <option key={act} value={act}>{act}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/45">Outing Catchphrase</span>
              <input 
                type="text"
                placeholder="e.g. Flat white & indie bookstore chat"
                value={newPlan.title}
                onChange={(e) => setNewPlan(prev => ({ ...prev, title: e.target.value }))}
                className="h-10 w-full rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-semibold px-3 outline-none focus:border-cyan-300/30"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/45">Outing Time</span>
              <input 
                type="text"
                placeholder="e.g. Tonight after 8:30"
                value={newPlan.time}
                onChange={(e) => setNewPlan(prev => ({ ...prev, time: e.target.value }))}
                className="h-10 w-full rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-semibold px-3 outline-none focus:border-cyan-300/30"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/45">Lounge / Spot Location</span>
              <input 
                type="text"
                placeholder="e.g. Subko Bandra West"
                value={newPlan.location}
                onChange={(e) => setNewPlan(prev => ({ ...prev, location: e.target.value }))}
                className="h-10 w-full rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs font-semibold px-3 outline-none focus:border-cyan-300/30"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black uppercase tracking-wider text-white/45">Outing Capacity (Size Limit)</span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">{newPlan.capacity} seats</span>
              </div>
              <input 
                type="range"
                min="2"
                max="12"
                value={newPlan.capacity}
                onChange={(e) => setNewPlan(prev => ({ ...prev, capacity: Number(e.target.value) }))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-2"
              />
            </div>
          </div>

          <button 
            type="submit"
            className="w-full flex min-h-[38px] items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-[#ff2e93] text-xs font-black uppercase tracking-wider text-white shadow-lg active:scale-95"
          >
            Broadcast Proposal 📡
          </button>
        </form>
      )}

      {/* Plans feed */}
      {activePlans.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center bg-black/10">
          <CalendarCheck className="mx-auto h-8 w-8 text-white/20 animate-bounce" />
          <h4 className="mt-3 font-semibold text-sm text-white/60">No Instant Plans Tonight</h4>
          <p className="text-xs text-white/40 max-w-xs mx-auto mt-1">Be the first to propose a movie, coffee mixer, road trip, or night out tonight!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {activePlans.map(plan => {
            const hasJoined = plan.members.some(m => m.id === appState?.profile?.user_id || m.id === appState?.profile?.id);
            const isCreator = plan.creatorId === appState?.profile?.user_id || plan.creatorId === appState?.profile?.id;
            
            return (
              <div 
                key={plan.id}
                className="rounded-2xl border border-white/5 bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.025] transition duration-300 p-4 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="inline-flex rounded-lg bg-cyan-900/30 border border-cyan-400/20 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-cyan-200">
                      {plan.activity}
                    </span>
                    {plan.score > 50 && (
                      <span className="ml-2 inline-flex rounded-lg bg-purple-900/30 border border-purple-400/20 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-purple-200">
                        Match Score {plan.score}%
                      </span>
                    )}
                    <h4 className="font-['Outfit'] text-base font-black text-white mt-1.5 leading-tight">{plan.title}</h4>
                    <p className="text-[11px] text-white/60 font-semibold mt-1 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-cyan-300 shrink-0" /> {plan.time} • <MapPin className="h-3.5 w-3.5 text-fuchsia-300 shrink-0" /> {plan.location}
                    </p>
                  </div>

                  {/* Creator detail */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-wider text-white/30">Host</p>
                      <p className="text-[10px] font-bold text-white/70 leading-none mt-0.5">{plan.creatorName}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-white/[0.04] flex items-center justify-center font-['Outfit'] text-xs font-black">
                      {plan.creatorAvatar ? <img src={plan.creatorAvatar} alt="" className="h-full w-full object-cover" /> : plan.creatorName.slice(0, 1)}
                    </div>
                  </div>
                </div>

                {/* Sub-explanations if match score is high */}
                {plan.explanations && plan.explanations.length > 0 && (
                  <div className="mt-2.5 rounded-lg bg-white/[0.02] p-2 flex items-center gap-1.5 text-[9px] font-bold text-[#ff2e93]">
                    <span>✓</span> <span>{plan.explanations[0]}</span>
                  </div>
                )}

                {/* Attending checklist and join action */}
                <div className="mt-4 pt-3.5 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/30">Seat Count</span>
                    <span className="text-xs text-white font-black">{plan.attendeeCount} / {plan.capacity} joined</span>
                    
                    {/* Tiny member avatars */}
                    <div className="flex -space-x-1.5 ml-2">
                      {plan.members.map((m, idx) => (
                        <div key={idx} className="w-5 h-5 rounded-full border border-[#08060d] overflow-hidden bg-white/[0.04] shrink-0" title={m.fullName}>
                          {m.avatarUrl ? <img src={m.avatarUrl} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[7px] font-black uppercase">{m.fullName.slice(0, 1)}</div>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {isCreator ? (
                    <span className="inline-flex min-h-[30px] px-3.5 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-950/20 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                      ★ Hosting Outing
                    </span>
                  ) : hasJoined ? (
                    <button
                      onClick={() => handleLeave(plan.id)}
                      className="inline-flex min-h-[30px] px-3.5 items-center justify-center rounded-lg border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 text-[10px] font-black uppercase tracking-wider transition active:scale-95"
                    >
                      Leave Plan ✖
                    </button>
                  ) : plan.attendeeCount >= plan.capacity ? (
                    <span className="text-[10px] font-black uppercase tracking-wider text-white/30">Lounge Full</span>
                  ) : (
                    <button
                      onClick={() => handleJoin(plan.id)}
                      className="inline-flex min-h-[30px] px-3.5 items-center justify-center rounded-lg bg-white hover:bg-white/90 text-[#050506] text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-[0_4px_12px_rgba(255,255,255,0.1)]"
                    >
                      Join Instantly ⚡
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- CURATED EVENTS RECOMMENDATION INTELLIGENCE ---
function RecommendedEventsSection({ appState, onApiCall }) {
  const recommendedEventsList = appState?.recommendedEvents || [];

  async function handleRSVP(eventId) {
    const isJoined = appState?.rsvps?.[eventId];
    if (isJoined) {
      await onApiCall(`/api/events/${eventId}/attendees/me`, 'DELETE');
    } else {
      await onApiCall(`/api/events/${eventId}/attendees/me`, 'POST');
    }
  }

  if (recommendedEventsList.length === 0) return null;

  return (
    <div className="mt-8 rounded-[32px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-2xl">
      <div className="mb-4">
        <span className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-400">Curated Outings</span>
        <h3 className="font-['Outfit'] text-2xl font-black text-white mt-1">Recommended Social Mixers</h3>
        <p className="text-xs text-white/50 mt-1 font-semibold">Smarter matchmaking. Recommended based on your active interests, goals, and city lounge.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {recommendedEventsList.slice(0, 3).map(event => {
          const isJoined = appState?.rsvps?.[event.id];
          return (
            <div 
              key={event.id}
              className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.015] hover:border-white/10 hover:bg-white/[0.025] transition duration-300 p-4 flex flex-col sm:flex-row gap-4"
            >
              {/* Event Mixer Image and custom glows */}
              <div className="relative h-32 w-full sm:w-28 shrink-0 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]">
                <img src={event.image} alt="" className="h-full w-full object-cover" />
                <span className="absolute top-1.5 right-1.5 rounded-lg bg-black/75 border border-fuchsia-400/35 px-1.5 py-0.5 text-[8.5px] font-black tracking-wide text-fuchsia-300 shadow-[0_0_8px_rgba(255,46,147,0.3)]">
                  {event.score}% Match
                </span>
              </div>

              {/* Event mixer description & matched reasons */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex rounded-lg bg-fuchsia-950/20 border border-fuchsia-400/20 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-fuchsia-300">
                    {event.category}
                  </span>
                  <span className="inline-flex rounded-lg bg-cyan-950/20 border border-cyan-400/20 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-cyan-300">
                    {event.activityType}
                  </span>
                </div>

                <h4 className="font-['Outfit'] text-base font-black text-white mt-1.5 leading-tight">{event.title}</h4>
                <p className="text-[11px] text-white/50 font-bold mt-1">
                  {event.date} • {event.time} • {event.place}
                </p>

                {/* Match factors explanations list */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {event.explanations && event.explanations.map((reason, idx) => (
                    <span 
                      key={idx} 
                      className="inline-flex items-center gap-1 rounded-md border border-fuchsia-300/15 bg-[#ff2e93]/5 px-2 py-0.5 text-[8.5px] font-bold text-fuchsia-200"
                    >
                      ✓ {reason}
                    </span>
                  ))}
                </div>

                <p className="mt-2 text-xs leading-relaxed text-white/50 line-clamp-2">
                  {event.description}
                </p>

                {/* RSVP attending details */}
                <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold text-white/40">
                    {event.attendeeCount} / {event.capacity} seats taken • {event.approval}
                  </span>

                  <button
                    onClick={() => handleRSVP(event.id)}
                    className={`inline-flex min-h-[30px] px-3.5 items-center justify-center rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 ${
                      isJoined 
                        ? 'border border-fuchsia-500/20 bg-[#ff2e93]/10 text-[#ff2e93] hover:bg-[#ff2e93]/15' 
                        : 'bg-white hover:bg-white/90 text-[#050506] shadow-[0_4px_12px_rgba(255,255,255,0.1)]'
                    }`}
                  >
                    {isJoined ? 'Cancel RSVP ✖' : 'Request Invite 🎟'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
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
    <div className="fixed inset-0 bg-[#08060d]/80 backdrop-blur-md flex items-center justify-center p-4" style={{ zIndex: 1000 }}>
      <div className="rounded-[32px] border border-white/10 bg-[#0f0a19]/95 w-[640px] max-w-full p-6 shadow-[0_30px_110px_rgba(0,0,0,.65)] relative overflow-hidden">
        <button className="absolute top-4 right-4 text-white/50 hover:text-white" onClick={onClose} aria-label="Close modal"><X className="w-6 h-6" /></button>
        
        {!selectedActivity ? (
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-400">Real-World Action</span>
            <h2 className="font-['Outfit'] text-2xl font-black text-white mt-1 mb-2">Meet Someone This Week ⚡</h2>
            <p className="text-xs text-white/60 mb-5 font-semibold">
              Stop browsing profiles. Choose what you want to do, and we will connect you immediately with active members, mixers, and instant plans nearby.
            </p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activities.map(act => (
                <button
                  key={act.id}
                  onClick={() => setSelectedActivity(act.id)}
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-white font-['Outfit'] text-sm font-black text-center cursor-pointer transition-all duration-300 hover:border-fuchsia-500/50 hover:bg-fuchsia-500/5"
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <button 
                onClick={() => { setSelectedActivity(null); setActiveTab('members'); }}
                className="bg-white/[0.05] border-none text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"
              >
                ←
              </button>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-400">Active Lounges</span>
                <h2 className="font-['Outfit'] text-xl font-black text-white leading-tight">Doing: {selectedActivity}</h2>
              </div>
            </div>

            <div className="flex gap-1.5 bg-white/[0.03] p-1 rounded-[14px] border border-white/5 mb-4">
              {[
                { id: 'members', label: `Partners (${matchingMembers.length})` },
                { id: 'events', label: `Mixers (${matchingEvents.length})` },
                { id: 'plans', label: `Plans (${matchingPlans.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 rounded-xl border-none text-xs font-black cursor-pointer transition-all duration-200 ${
                    activeTab === tab.id ? 'bg-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/25' : 'bg-transparent text-white/50 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="max-h-[320px] overflow-y-auto pr-1 grid gap-3">
              {activeTab === 'members' && (
                matchingMembers.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-white/40">
                    <Users className="mx-auto h-8 w-8 text-white/20 mb-2" />
                    <h4 className="font-['Outfit'] text-sm font-black text-white">No Members Yet</h4>
                    <p className="text-[11px] mt-1 max-w-xs mx-auto">Nobody has updated their status for this activity. Be the first!</p>
                  </div>
                ) : (
                  matchingMembers.map(member => (
                    <div key={member.id} className="grid grid-cols-[auto_1fr_auto] items-center p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
                      <div className="w-11 h-11 rounded-full border border-white/10 overflow-hidden bg-gradient-to-br from-fuchsia-500/10 to-cyan-500/10 shrink-0">
                        {member.photos?.[0] ? <img src={member.photos[0]} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center font-black text-sm">{member.name.slice(0, 1)}</div>}
                      </div>
                      <div className="min-w-0">
                        <strong className="flex items-center gap-1 font-['Outfit'] text-sm font-black text-white">
                          {(member.name || '').split(',')[0].trim().split(' ')[0]}, {member.age || (member.name || '').split(',')[1]?.trim()}
                          {member.verification_level === 'highly_verified' && <ShieldCheck className="w-3.5 h-3.5 text-amber-400 fill-amber-400/10 shrink-0" />}
                          {member.verification_level === 'identity' && <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                          {member.verification_level === 'basic' && <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
                        </strong>
                        <span className="block text-[10px] text-white/40 mt-1 truncate">
                          Reliability: {member.trustScore || 94}% • {member.city}
                        </span>
                      </div>
                      <button 
                        className="h-8 px-4 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-[10px] font-black uppercase tracking-wider transition active:scale-95 shadow-lg shadow-fuchsia-500/20"
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
                  <div className="text-center py-8 px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-white/40">
                    <CalendarCheck className="mx-auto h-8 w-8 text-white/20 mb-2" />
                    <h4 className="font-['Outfit'] text-sm font-black text-white">No Events Available</h4>
                    <p className="text-[11px] mt-1 max-w-xs mx-auto">No social mixers scheduled for this activity category currently.</p>
                  </div>
                ) : (
                  matchingEvents.map(event => {
                    const isJoined = Boolean(appState.rsvps[event.id]);
                    return (
                      <div key={event.id} className="grid grid-cols-[auto_1fr_auto] items-center p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
                        <img src={event.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <strong className="block font-['Outfit'] text-sm font-black text-white truncate">{event.title}</strong>
                          <span className="block text-[10px] text-white/40 mt-1 truncate">
                            {event.date} • {event.place}
                          </span>
                        </div>
                        <button 
                          className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 ${
                            isJoined ? 'border border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-300' : 'bg-white hover:bg-white/90 text-black'
                          }`}
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
                  <div className="text-center py-8 px-4 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-white/40">
                    <Zap className="mx-auto h-8 w-8 text-white/20 mb-2" />
                    <h4 className="font-['Outfit'] text-sm font-black text-white">No Meetups Planned</h4>
                    <p className="text-[11px] mt-1 max-w-xs mx-auto">No fast-join instant plans exist for this activity right now.</p>
                  </div>
                ) : (
                  matchingPlans.map(plan => {
                    const hasJoined = plan.members.some(m => m.id === appState.profile.id);
                    return (
                      <div key={plan.id} className="grid grid-cols-[1fr_auto] items-center p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl gap-3">
                        <div className="min-w-0">
                          <strong className="block font-['Outfit'] text-sm font-black text-white truncate">{plan.title}</strong>
                          <span className="block text-[10px] text-white/40 mt-1 truncate">
                            Activity: {plan.activity} • {plan.time} • Host: {plan.creatorName} ({plan.creatorTrustScore}% Trust)
                          </span>
                        </div>
                        <button 
                          className={`h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-wider transition active:scale-95 ${
                            hasJoined ? 'border border-cyan-400/20 bg-cyan-950/20 text-cyan-300' : 'bg-white hover:bg-white/90 text-black'
                          }`}
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

        <button className="w-full mt-5 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/70 text-xs font-black transition-all" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}



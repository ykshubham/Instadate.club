import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
  ArrowLeft, ArrowRight, BadgeCheck, CalendarCheck, Camera, CheckCircle2,
  ChevronRight, Crown, Gem, HeartHandshake, Lock, MapPin, MessageCircle,
  ShieldCheck, Sparkles, Star, Ticket, UserCheck, Users, WandSparkles, X, Zap
} from 'lucide-react';

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
    title: 'Know who is going before you show up.',
    text: 'Events are just the vehicle. Instadate shows people, vibe, interests, and social context first.',
    accent: 'from-emerald-300 via-cyan-300 to-fuchsia-300',
    primary: 'I like this',
    trust: [
      ['Identity check', 'Active', ShieldCheck],
      ['Selfie check', 'Ready', Camera],
      ['Voice gate', 'Locked', Lock],
      ['Report flow', 'One tap', BadgeCheck]
    ],
    visual: 'trust'
  },
  {
    eyebrow: 'Compatibility setup',
    title: 'Make new friends as an adult.',
    text: 'Expand beyond the same contacts and meet people who already share your interests.',
    accent: 'from-violet-300 via-fuchsia-300 to-cyan-300',
    primary: 'Save my vibe',
    visual: 'choices'
  },
  {
    eyebrow: 'Members only',
    title: 'Become the center of the social circle.',
    text: 'Host the plan you want, build your own tribe, and meet people faster than waiting to be invited.',
    image: '/assets/rooftop_sunset_soiree.png',
    accent: 'from-amber-200 via-fuchsia-300 to-cyan-300',
    primary: 'View final step',
    perks: [
      ['Host status', Crown],
      ['Small groups', Ticket],
      ['Instant plans', Zap],
      ['Local tribe', Gem]
    ],
    visual: 'club'
  },
  {
    eyebrow: 'Ready',
    title: 'Your Instadate pass is almost ready.',
    text: 'Not every connection has to be romantic. Start with the plan, then let the connection grow naturally.',
    accent: 'from-[#ff2e93] via-[#7c3aed] to-[#00d7f5]',
    primary: 'Apply now',
    visual: 'finish'
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
  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const [goal, setGoal] = React.useState('Long-term');
  const [energy, setEnergy] = React.useState('Coffee date');
  const [applying, setApplying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const shellRef = React.useRef(null);
  const current = slides[index];
  const isLast = index === slides.length - 1;

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

  React.useEffect(() => {
    if (!applying) return undefined;
    setProgress(0);
    const timer = window.setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + 8, 100);
        if (next >= 100) {
          window.clearInterval(timer);
          window.setTimeout(() => {
            setApplying(false);
            onComplete?.();
          }, 350);
        }
        return next;
      });
    }, 110);
    return () => window.clearInterval(timer);
  }, [applying, onComplete]);

  function goTo(nextIndex) {
    if (nextIndex < 0 || nextIndex >= slides.length || nextIndex === index) return;
    setDirection(nextIndex > index ? 1 : -1);
    setIndex(nextIndex);
  }

  function next() {
    if (isLast) {
      setApplying(true);
      return;
    }
    goTo(index + 1);
  }

  function back() {
    goTo(index - 1);
  }

  return (
    <div ref={shellRef} className="relative h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#050507] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,rgba(255,46,147,.12),transparent_30%,rgba(0,215,245,.08)_60%,transparent),linear-gradient(180deg,#08060d_0%,#050507_52%,#09050c_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:42px_42px]" />
      <span data-beam className="pointer-events-none absolute left-[-16%] top-[15%] h-px w-[62%] rotate-[-18deg] bg-gradient-to-r from-transparent via-fuchsia-300/60 to-transparent blur-[1px]" />
      <span data-beam className="pointer-events-none absolute right-[-18%] top-[58%] h-px w-[70%] rotate-[-18deg] bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent blur-[1px]" />

      <main className="relative z-10 mx-auto flex h-full min-h-0 w-full max-w-[520px] flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))]">
        <TopBar onClose={onExplore} />

        <CarouselIndicator index={index} total={slides.length} goTo={goTo} accent={current.accent} />

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
              <SlideHeader slide={current} />
              <VisualPanel slide={current} goal={goal} setGoal={setGoal} energy={energy} setEnergy={setEnergy} applying={applying} progress={progress} />
            </motion.div>
          </AnimatePresence>
        </section>

        <Controls
          index={index}
          isLast={isLast}
          applying={applying}
          primary={current.primary}
          onBack={back}
          onNext={next}
          onExplore={onExplore}
        />
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

function VisualPanel(props) {
  const { slide } = props;

  if (slide.visual === 'hero') return <HeroVisual slide={slide} />;
  if (slide.visual === 'timeline') return <TimelineVisual slide={slide} />;
  if (slide.visual === 'trust') return <TrustVisual slide={slide} />;
  if (slide.visual === 'choices') return <ChoicesVisual {...props} />;
  if (slide.visual === 'club') return <ClubVisual slide={slide} />;
  return <FinishVisual slide={slide} applying={props.applying} progress={props.progress} />;
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

function ChoicesVisual({ goal, setGoal, energy, setEnergy }) {
  const goals = ['Long-term', 'Slow dating', 'Events first'];
  const energies = ['Coffee date', 'Live music', 'Rooftop', 'Bookstore'];

  return (
    <GlassCard className="p-4">
      <div className="rounded-[26px] border border-white/10 bg-black/26 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Vibe card preview</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-400 font-['Outfit'] text-xl font-black">IS</span>
          <div>
            <p className="font-['Outfit'] text-xl font-black">Ishaan, 22</p>
            <p className="flex items-center gap-1.5 text-xs font-semibold text-white/50"><MapPin className="h-3.5 w-3.5" /> Mumbai</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-fuchsia-200/12 bg-fuchsia-300/8 p-3">
          <p className="text-sm font-bold leading-6 text-white">Looking for {energy.toLowerCase()} with {goal.toLowerCase()} energy this weekend.</p>
        </div>
      </div>

      <ChoiceGroup title="Dating intention" value={goal} values={goals} setValue={setGoal} />
      <ChoiceGroup title="Weekend energy" value={energy} values={energies} setValue={setEnergy} />
    </GlassCard>
  );
}

function ChoiceGroup({ title, value, values, setValue }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/45">{title}</p>
      <div className="flex flex-wrap gap-2">
        {values.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => setValue(item)}
            className={cn(
              'rounded-full border px-3.5 py-2 text-xs font-black transition active:scale-95',
              value === item
                ? 'border-fuchsia-200/30 bg-gradient-to-r from-fuchsia-500 to-violet-500 text-white shadow-[0_12px_28px_rgba(255,46,147,.22)]'
                : 'border-white/10 bg-white/[0.04] text-white/55'
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClubVisual({ slide }) {
  return (
    <GlassCard className="overflow-hidden p-3">
      <div className="relative overflow-hidden rounded-[26px]">
        <img src={slide.image} alt="" className="h-[240px] w-full object-cover sm:h-[290px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge tone="gold" icon={Crown}>Inner Circle</Badge>
          <h3 className="mt-3 font-['Outfit'] text-2xl font-black">Secret rooftop sunset</h3>
          <p className="mt-1 text-sm font-semibold text-white/58">Invite-only tables for verified members.</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {slide.perks.map(([title, Icon]) => (
          <div key={title} className="rounded-[20px] border border-white/8 bg-white/[0.04] p-3">
            <Icon className="h-4.5 w-4.5 text-amber-200" />
            <p className="mt-2 text-xs font-black">{title}</p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function FinishVisual({ applying, progress }) {
  if (applying) {
    return (
      <GlassCard className="p-5 text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-[32px] border border-cyan-200/20 bg-cyan-300/10">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}>
            <ShieldCheck className="h-12 w-12 text-cyan-200" />
          </motion.div>
        </div>
        <h3 className="mt-5 font-['Outfit'] text-2xl font-black">Creating your pass</h3>
        <p className="mt-2 text-sm font-semibold text-white/52">Checking profile signal, trust status, and match access.</p>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" animate={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs font-black text-cyan-100">{progress}%</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <div className="grid gap-3">
        {[
          ['Profile reviewed', 'Your identity dashboard is ready.', UserCheck],
          ['Matches waiting', 'Curated members refresh daily.', Users],
          ['Weekend status', 'Show what kind of plan you want.', HeartHandshake]
        ].map(([title, text, Icon]) => (
          <div key={title} className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.035] p-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.06] text-fuchsia-200">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-['Outfit'] text-base font-black">{title}</p>
              <p className="text-xs font-semibold text-white/50">{text}</p>
            </div>
            <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-300" />
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function Controls({ index, isLast, applying, primary, onBack, onNext, onExplore }) {
  return (
    <div className="fixed inset-x-5 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto max-w-[480px] space-y-3 rounded-[28px] border border-white/10 bg-[#050507]/72 p-2.5 shadow-[0_-18px_70px_rgba(0,0,0,.55)] backdrop-blur-2xl">
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={onBack}
          disabled={index === 0 || applying}
          className="grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.055] text-white/80 disabled:opacity-30"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.975 }}
          onClick={onNext}
          disabled={applying}
          className="relative h-14 overflow-hidden rounded-2xl bg-white font-['Outfit'] text-sm font-black text-black shadow-[0_18px_40px_rgba(255,255,255,.16)] disabled:opacity-70"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-white via-fuchsia-100 to-cyan-100" />
          <span className="relative inline-flex items-center gap-2">
            {isLast ? 'Apply now' : primary}
            {isLast ? <Crown className="h-4.5 w-4.5" /> : <ArrowRight className="h-4.5 w-4.5" />}
          </span>
        </motion.button>
      </div>
      <button
        type="button"
        onClick={onExplore}
        disabled={applying}
        className="w-full rounded-2xl border border-white/8 bg-white/[0.035] py-3 text-xs font-black uppercase tracking-[0.18em] text-white/45 transition active:scale-[.98]"
      >
        Explore app first
      </button>
    </div>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, ...spring }}
      className={cn('rounded-[32px] border border-white/10 bg-white/[0.055] shadow-[0_28px_90px_rgba(0,0,0,.45)] backdrop-blur-2xl', className)}
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

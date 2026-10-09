import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Terminal, Compass, ArrowUpRight, Volume2, ShieldCheck } from 'lucide-react';
import { hapticFeedback } from '../utils/haptics';

interface WelcomeIntroOverlayProps {
  onComplete: () => void;
  appName?: string;
  tagline?: string;
}

/**
 * Editorial Creative-Dev Welcome Preloader & Entrance Animation
 * Inspired by Ricardo Chance (landing.love) & Awwwards Design Engineering:
 * - High-contrast charcoal / warm stone architectural aesthetic (#121212 / #ebeae5 / #10b981)
 * - Kinetic numerical counter (00 -> 100%) with realistic ease-out deceleration
 * - Synchronized rotating editorial greetings & manifesto phrases
 * - Tactile geometric shutter reveals (dual horizontal & vertical split curtains)
 * - Ambient sound / haptic pulse on threshold completion
 * - Clean manual replay or skip capability
 */
export const WelcomeIntroOverlay: React.FC<WelcomeIntroOverlayProps> = ({
  onComplete,
  appName = 'ECOQUEST',
  tagline = 'BIO-ACOUSTIC EXPEDITION ENGINE'
}) => {
  const [progress, setProgress] = useState(0);
  const [greetingIndex, setGreetingIndex] = useState(0);
  const [phase, setPhase] = useState<'counting' | 'completed' | 'revealing' | 'done'>('counting');
  const [isSkipped, setIsSkipped] = useState(false);

  // Editorial cycling phrases reminiscent of Ricardo Chance's chapter intros & greetings
  const manifestoPhrases = [
    { primary: 'WELCOME, EXPLORER', sub: 'INITIALIZING ENVIRONMENTAL SENSORS', coord: 'LAT 37.77° N' },
    { primary: 'TOUCH REAL EARTH', sub: 'CALIBRATING GEOLOCATION TELEMETRY', coord: 'WMO · 0.98 ATM' },
    { primary: 'CONNECT WITH NATURE', sub: 'SYNCING VOICE & FIELD MISSIONS', coord: 'ALT · 42M ELEV' },
    { primary: 'SHAPING THE EXPEDITION', sub: 'SYSTEMS READY · ENTER THE SOIL', coord: 'ECOQUEST v2.4' }
  ];

  // Counter loop from 00 to 100 with dynamic non-linear acceleration & deceleration
  useEffect(() => {
    if (isSkipped) return;

    let start = 0;
    const duration = 2200; // 2.2 seconds total immersive intro
    const startTime = performance.now();

    const animateProgress = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);

      // Custom cubic bezier-like easeInOut with sudden fast surge at 40-70% and smooth landing at 100%
      let eased = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const currentVal = Math.min(100, Math.floor(eased * 100));
      setProgress(currentVal);

      // Rotate manifesto greetings at milestones
      if (currentVal < 25) setGreetingIndex(0);
      else if (currentVal < 55) setGreetingIndex(1);
      else if (currentVal < 85) setGreetingIndex(2);
      else setGreetingIndex(3);

      if (t < 1) {
        requestAnimationFrame(animateProgress);
      } else {
        setProgress(100);
        setPhase('completed');
        
        // Haptic feedback upon reaching 100%
        try {
          hapticFeedback.tactileClick();
        } catch (_) {}

        // Trigger cinematic curtain lift after a brief 300ms hold at 100%
        const timer1 = setTimeout(() => {
          setPhase('revealing');
        }, 350);

        // Notify parent when curtain wipe has completed
        const timer2 = setTimeout(() => {
          setPhase('done');
          onComplete();
        }, 1250);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    };

    const animFrame = requestAnimationFrame(animateProgress);
    return () => cancelAnimationFrame(animFrame);
  }, [isSkipped, onComplete]);

  // Handle instant user skip
  const handleSkip = () => {
    setIsSkipped(true);
    setPhase('revealing');
    try {
      hapticFeedback.tactileClick();
    } catch (_) {}
    setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 400);
  };

  if (phase === 'done') return null;

  const currentPhrase = manifestoPhrases[greetingIndex];

  return (
    <aside
      aria-label="Welcome experience"
      className={`fixed inset-0 z-[100] select-none pointer-events-auto transition-opacity duration-700 ${
        phase === 'revealing' ? 'pointer-events-none' : ''
      }`}
    >
      {/* =========================================================================
          RICARDO CHANCE SIGNATURE ARCHITECTURAL SPLIT CURTAINS (TOP & BOTTOM WIPE)
          ========================================================================= */}
      {/* Top Half Curtain Shutter */}
      <div
        className={`absolute inset-x-0 top-0 h-1/2 bg-[#0d0d0d] border-b border-stone-800/80 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform origin-top ${
          phase === 'revealing' ? '-translate-y-full' : 'translate-y-0'
        }`}
      />
      {/* Bottom Half Curtain Shutter */}
      <div
        className={`absolute inset-x-0 bottom-0 h-1/2 bg-[#0d0d0d] border-t border-stone-800/80 transition-transform duration-700 ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform origin-bottom ${
          phase === 'revealing' ? 'translate-y-full' : 'translate-y-0'
        }`}
      />

      {/* Decorative vertical guide rails (Brutalist grid aesthetic) */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          phase === 'revealing' ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="max-w-7xl mx-auto h-full px-6 sm:px-12 flex justify-between">
          <div className="w-[1px] h-full bg-stone-800/40" />
          <div className="hidden sm:block w-[1px] h-full bg-stone-800/30" />
          <div className="hidden lg:block w-[1px] h-full bg-stone-800/30" />
          <div className="w-[1px] h-full bg-stone-800/40" />
        </div>
      </div>

      {/* =========================================================================
          EDITORIAL WELCOME STAGE & KINETIC TYPOGRAPHY
          ========================================================================= */}
      <div
        className={`relative z-10 w-full h-full flex flex-col justify-between p-6 sm:p-10 lg:p-14 text-stone-100 transition-all duration-500 ${
          phase === 'revealing' ? 'opacity-0 scale-95 blur-xs' : 'opacity-100 scale-100'
        }`}
      >
        {/* Top Header Row: Brandmark, Live Status & Quick Skip Actuator */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            <span className="font-display font-black tracking-widest text-sm sm:text-base text-stone-100">
              {appName}
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-stone-900 border border-stone-800 font-mono text-[10px] text-emerald-400 tracking-wider">
              {tagline}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-stone-500 hidden md:inline">
              [ BUENOS AIRES · GLOBAL TERRAIN ]
            </span>
            <button
              onClick={handleSkip}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-850 text-stone-400 hover:text-stone-100 border border-stone-800 font-mono text-xs transition-all cursor-pointer"
            >
              <span>SKIP</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-emerald-400" />
            </button>
          </div>
        </header>

        {/* Center Editorial Focus: Kinetic Wordmark & Rotating Manifesto */}
        <div className="max-w-4xl mx-auto w-full my-auto py-8 flex flex-col items-center text-center">
          {/* Eyebrow chapter badge with live GPS telemetry */}
          <div className="flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800/80 shadow-inner">
            <Compass className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '10s' }} />
            <span className="font-mono text-[11px] uppercase tracking-widest text-stone-400">
              EXPEDITION SYSTEM PHASE 0{greetingIndex + 1} &middot; {currentPhrase.coord}
            </span>
          </div>

          {/* Kinetic Headline with fluid letter-masked transition */}
          <div className="overflow-hidden min-h-[50px] sm:min-h-[76px] lg:min-h-[96px] flex items-center justify-center">
            <h1
              key={greetingIndex}
              className="text-3xl sm:text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white leading-tight animate-[fadeInUp_0.45s_cubic-bezier(0.16,1,0.3,1)_forwards]"
            >
              {currentPhrase.primary}
            </h1>
          </div>

          {/* Editorial Subtitle with typewriter/smooth ease */}
          <div className="overflow-hidden mt-3 max-w-lg">
            <p
              key={greetingIndex + '-sub'}
              className="font-mono text-xs sm:text-sm text-stone-400 tracking-wider uppercase animate-[fadeInUp_0.5s_cubic-bezier(0.16,1,0.3,1)_0.1s_forwards]"
            >
              {currentPhrase.sub}
            </p>
          </div>
        </div>

        {/* Bottom Dock: Giant Ricardo-Chance-Style Numerical Counter & Progress Bar */}
        <footer className="w-full flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 border-t border-stone-850/80 pt-6">
          {/* Left telemetry readouts */}
          <div className="flex items-center gap-4 text-xs font-mono text-stone-500">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-stone-600" />
              <span>VOICE ENGINE: STANDBY</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>SOIL MATRIX: ACTIVE</span>
            </div>
          </div>

          {/* Center progress track bar */}
          <div className="w-full sm:max-w-md mx-auto order-3 sm:order-2 flex flex-col gap-1.5">
            <div className="h-1 w-full bg-stone-900 rounded-full overflow-hidden border border-stone-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-150 ease-out shadow-[0_0_8px_#10b981]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-stone-500">
              <span>INITIALIZING SYSTEM ASSETS</span>
              <span className="text-emerald-400 font-bold">{progress}%</span>
            </div>
          </div>

          {/* Right Giant Kinetic Counter */}
          <div className="order-2 sm:order-3 flex items-baseline gap-1 font-mono tracking-tighter">
            <span className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tabular-nums">
              {progress < 10 ? `0${progress}` : progress}
            </span>
            <span className="text-xl sm:text-2xl font-bold text-emerald-400">%</span>
          </div>
        </footer>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import { CharacterCanvas } from './components/CharacterCanvas';
import { MissionHUD } from './components/MissionHUD';
import { DailyChallengesView } from './components/DailyChallengesView';
import { StickerAlbumView } from './components/StickerAlbumView';
import { PocketModeHUD } from './components/PocketModeHUD';
import { NatureTopoBackground } from './components/NatureTopoBackground';
import { WelcomeIntroOverlay } from './components/WelcomeIntroOverlay';
import { StickerEntry } from './components/StickerBookModal';
import { BioCardsDeck } from './components/BioCardsDeck';
import { EnvironmentalWeatherPod } from './components/EnvironmentalWeatherPod';
import { ArchitectureBlueprint } from './components/ArchitectureBlueprint';
import { TacticalGoogleMap } from './components/TacticalGoogleMap';
import { SoothingSoundtrackHUD } from './components/SoothingSoundtrackHUD';
import { CharacterGender, OutfitColor, GamePage, LocalityWaypoint } from './types';
import { hapticFeedback } from './utils/haptics';
import { ambientAudioService } from './services/ambientAudioService';
import {
  movementTrackingService,
  MovementTelemetry,
} from './services/movementTrackingService';
import {
  DailyNatureChallenge,
  fetchDailyNatureChallenges
} from './services/geminiMissionService';
import {
  OutdoorWeatherData,
  fetchCurrentWeather,
} from './services/weatherService';
import {
  ArrowRight,
  Smartphone,
  X,
  Compass,
  RotateCcw,
  Headphones,
  Sparkles,
  Award,
  BookOpen,
  Calendar,
  MapPin,
  LocateFixed,
  Radio,
  CloudSun,
  Layers,
  Cpu,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  Volume2,
} from 'lucide-react';

export default function App() {
  // Navigation & Page State (Explorer, Mission, Map, Daily Challenges, My Stickers)
  const [currentPage, setCurrentPage] = useState<GamePage>('welcome');
  const [isPocketModalOpen, setIsPocketModalOpen] = useState(false);

  // Real-time GPS movement telemetry
  const [telemetry, setTelemetry] = useState<MovementTelemetry>(
    movementTrackingService.getTelemetry()
  );

  useEffect(() => {
    const unsub = movementTrackingService.subscribe((t) => {
      setTelemetry(t);
    });
    return () => unsub();
  }, []);

  // Real-time Outdoor Atmospheric Weather Telemetry
  const [weather, setWeather] = useState<OutdoorWeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const loadWeather = async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchCurrentWeather(telemetry.latitude, telemetry.longitude, true);
      setWeather(data);
    } catch (err) {
      console.warn('Weather fetch fallback:', err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, [telemetry.latitude, telemetry.longitude]);

  // Waypoints for full-screen Tactical Google Map
  const [activeMapWaypoint, setActiveMapWaypoint] = useState<LocalityWaypoint | null>(null);
  const appWaypoints: LocalityWaypoint[] = React.useMemo(() => [
    {
      id: 'wp-app-1',
      name: 'Broad Fallen Leaves Cache',
      category: 'Botanical',
      description: 'Look beneath shaded oak or maple canopy for broad fallen leaves.',
      audioPrompt: 'Find two broad fallen leaves on the ground for your craft dragon wings.',
      lat: (telemetry.latitude || 37.7749) + 0.0006,
      lng: (telemetry.longitude || -122.4194) + 0.0008,
      icon: '🍃',
      completed: false,
      distanceMeters: 75,
    },
    {
      id: 'wp-app-2',
      name: 'Curved Twig Haven',
      category: 'Canopy',
      description: 'Search near fallen branches for a sturdy, curved dry twig.',
      audioPrompt: 'Pick up one curved twig about the length of your hand for the dragon spine.',
      lat: (telemetry.latitude || 37.7749) - 0.0005,
      lng: (telemetry.longitude || -122.4194) + 0.0007,
      icon: '🪵',
      completed: false,
      distanceMeters: 60,
    },
    {
      id: 'wp-app-3',
      name: 'Polished River Pebbles',
      category: 'Geo',
      description: 'Locate two smooth round pebbles on the path.',
      audioPrompt: 'Gather two smooth pebbles from the soil to serve as glowing dragon eyes.',
      lat: (telemetry.latitude || 37.7749) + 0.0003,
      lng: (telemetry.longitude || -122.4194) - 0.0009,
      icon: '🪨',
      completed: false,
      distanceMeters: 90,
    },
  ], [telemetry.latitude, telemetry.longitude]);

  // Welcome Intro Preloader
  const [showWelcomeIntro, setShowWelcomeIntro] = useState(true);
  const [introAnimated, setIntroAnimated] = useState(false);

  // Character Customization State
  const [selectedGender, setSelectedGender] = useState<CharacterGender>('male');
  const [selectedOutfitColor, setSelectedOutfitColor] = useState<OutfitColor>('charcoal');
  const [explorerName, setExplorerName] = useState<string>('Ranger_01');

  // Welcome Time-of-Day Dynamic Greeting State & Simulator
  const [greetingTimeMode, setGreetingTimeMode] = useState<'auto' | 'morning' | 'afternoon' | 'evening' | 'night'>('auto');
  const [currentHourClock, setCurrentHourClock] = useState(() => new Date().getHours());
  const [currentTimeFormatted, setCurrentTimeFormatted] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentHourClock(now.getHours());
      setCurrentTimeFormatted(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const activeHour = React.useMemo(() => {
    if (greetingTimeMode === 'morning') return 8;
    if (greetingTimeMode === 'afternoon') return 14;
    if (greetingTimeMode === 'evening') return 18;
    if (greetingTimeMode === 'night') return 22;
    return currentHourClock;
  }, [greetingTimeMode, currentHourClock]);

  const greetingInfo = React.useMemo(() => {
    if (activeHour >= 5 && activeHour < 12) {
      return {
        key: 'morning',
        salutation: 'Good morning',
        emoji: '🌅',
        periodLabel: 'DAWN & MORNING CANOPY',
        subTitle: 'Crisp morning dew on woodland trails · Prime time for canopy birdsong & fresh leaf gathering',
        fieldGuidance: 'The early morning light filters gently through the upper boughs. Optimal time for collecting fallen foliage with intact moisture and spotting early songbirds.',
      };
    }
    if (activeHour >= 12 && activeHour < 17) {
      return {
        key: 'afternoon',
        salutation: 'Good afternoon',
        emoji: '☀️',
        periodLabel: 'HIGH SUN RECONNAISSANCE',
        subTitle: 'Peak overhead sunlight · Rich contrast on forest ground & tree bark',
        fieldGuidance: 'Direct ambient illumination highlights deep crevices in tree bark, smooth river pebbles, and vibrant moss textures. Ideal conditions for outdoor ground crafting.',
      };
    }
    if (activeHour >= 17 && activeHour < 21) {
      return {
        key: 'evening',
        salutation: 'Good evening',
        emoji: '🌇',
        periodLabel: 'GOLDEN HOUR EXPEDITION',
        subTitle: 'Warm amber glow across the canopy · Crepuscular forest wildlife stirring',
        fieldGuidance: 'Soft golden hour rays cast long silhouettes across the path. Crepuscular wildlife begins moving through the brush. Listen for dusk calls in your earphones.',
      };
    }
    return {
      key: 'night',
      salutation: 'Good night',
      emoji: '🌙',
      periodLabel: 'NOCTURNAL CANOPY & STARLIGHT',
      subTitle: 'Quiet starlit skies · Bio-acoustic immersion for night sounds',
      fieldGuidance: 'The woodland enters its tranquil night phase. Switch on earphones, listen for night crickets, owls, and rustling nocturnal flora beneath the starlit sky.',
    };
  }, [activeHour]);

  // Gameplay movement state
  const [isWalking, setIsWalking] = useState(false);

  // Progression & Score State
  const [currentLevel, setCurrentLevel] = useState(3);
  const [totalXp, setTotalXp] = useState(850);

  // Daily Nature Challenges State
  const [dailyChallenges, setDailyChallenges] = useState<DailyNatureChallenge[]>([
    {
      id: 'daily-leaf-default',
      title: 'Find 2 Broad Leaves',
      description: 'Scan beneath mature canopy trees for two intact leaves with clear veining.',
      category: 'Flora',
      icon: '🍃',
      difficulty: 'Quick',
      xpReward: 100,
      completed: true,
    },
    {
      id: 'daily-bird-default',
      title: 'Identify a Local Bird',
      description: 'Stop silently for 60 seconds and locate a wild bird in the branches. Note its song.',
      category: 'Fauna',
      icon: '🐦',
      difficulty: 'Explorer',
      xpReward: 150,
      completed: false,
    },
    {
      id: 'daily-bark-default',
      title: 'Inspect Tree Bark Texture',
      description: 'Feel the ridges and fissures of a tree trunk and check for green moss or velvet lichen.',
      category: 'Tactile',
      icon: '🪵',
      difficulty: 'Tracker',
      xpReward: 125,
      completed: false,
    },
  ]);
  const [isFetchingChallenges, setIsFetchingChallenges] = useState(false);

  // Field Sticker Codex State
  const [unlockedStickers, setUnlockedStickers] = useState<StickerEntry[]>([
    {
      id: 'stk-dragon',
      name: 'Verdant Leaf Dragon',
      badgeEmoji: '🐉',
      rarity: 'Mythic',
      category: 'craft',
      biome: 'Oak & Redwood Woodland',
      dateUnlocked: 'Stage 1 Complete',
      lore: 'A gentle woodland guardian crafted on the soil from fallen autumn leaves and river pebbles.',
      ingredients: ['2x Fallen Leaves (Wings)', '1x Curved Twig (Spine)', '2x River Pebbles (Eyes)'],
      xpEarned: 350,
    },
    {
      id: 'stk-turtle',
      name: 'Moss Pebble Turtle',
      badgeEmoji: '🐢',
      rarity: 'Rare',
      category: 'craft',
      biome: 'Riparian Creek',
      dateUnlocked: 'Stage 2 Complete',
      lore: 'Sculpted from river stones and damp moss fronds. Absorbs cool mountain water currents.',
      ingredients: ['1x Flat Palm Stone', '4x Small Pebbles', '1x Moss Frond'],
      xpEarned: 300,
    },
  ]);

  const handleWelcomeComplete = () => {
    setShowWelcomeIntro(false);
    setTimeout(() => {
      setIntroAnimated(true);
    }, 100);
  };

  const handleReplayIntro = () => {
    setIntroAnimated(false);
    setShowWelcomeIntro(true);
  };

  const handleToggleDailyChallenge = (challengeId: string) => {
    setDailyChallenges((prev) =>
      prev.map((c) => {
        if (c.id === challengeId) {
          const nextState = !c.completed;
          if (nextState) {
            hapticFeedback.challengeCompleted();
            setTotalXp((xp) => xp + c.xpReward);
          } else {
            hapticFeedback.tactileClick();
            setTotalXp((xp) => Math.max(0, xp - c.xpReward));
          }
          return { ...c, completed: nextState };
        }
        return c;
      })
    );
  };

  const handleRefreshChallenges = async () => {
    setIsFetchingChallenges(true);
    try {
      const fresh = await fetchDailyNatureChallenges({
        biome: 'Oak Woodland',
        timeOfDay: 'Afternoon',
      });
      setDailyChallenges(fresh);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setIsFetchingChallenges(false);
    }
  };

  const completedChallengesCount = dailyChallenges.filter((c) => c.completed).length;

  return (
    <div className="relative min-h-screen bg-[#ebeae5] text-stone-900 selection:bg-stone-900 selection:text-stone-50 font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* RICARDO CHANCE STYLE WELCOME PRELOADER */}
      {showWelcomeIntro && (
        <WelcomeIntroOverlay
          onComplete={handleWelcomeComplete}
          appName="ECOQUEST"
          tagline="BIO-ACOUSTIC EXPEDITION ENGINE"
        />
      )}

      {/* NATURE TOPOGRAPHICAL BACKGROUND */}
      <NatureTopoBackground />

      {/* =========================================================================
          TOP BAR: STRICT 3-ZONE LAYOUT (BRAND · UNIFIED NAV BAR · ACTION)
          Now features seamless direct navigation for:
          01. EXPLORER | 02. MISSION | 03. DAILY CHALLENGES | 04. MY STICKERS
          ========================================================================= */}
      <header className="relative z-40 sticky top-0 flex items-center justify-between px-3 sm:px-6 lg:px-10 py-2.5 sm:py-3.5 bg-[#ebeae5]/85 backdrop-blur-md border-b border-stone-800/10 select-none">
        {/* Zone 1: Wordmark */}
        <div
          onClick={() => {
            hapticFeedback.tactileClick();
            setCurrentPage('welcome');
          }}
          className="flex items-center gap-2 cursor-pointer group"
        >
          <span className="font-display font-extrabold text-base sm:text-lg lg:text-xl tracking-tight text-stone-900 group-hover:text-emerald-900 transition-colors">
            ECOQUEST
          </span>
          <span className="hidden sm:inline text-[9px] lg:text-[10px] font-mono text-emerald-800 tracking-wider uppercase font-bold bg-emerald-700/10 px-2 py-0.5 rounded-md border border-emerald-800/20">
            FIELD EDITION
          </span>
        </div>

        {/* Zone 2: Navigation Bar (Tactile Segmented Control) */}
        <nav className="flex items-center gap-1 p-1 bg-stone-300/75 backdrop-blur-xs rounded-xl text-xs font-mono border border-stone-400/40 shadow-inner overflow-x-auto max-w-[calc(100vw-200px)] sm:max-w-none">
          {/* 01. EXPLORER (Character Selection) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('welcome');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'welcome'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">01. </span>
            <span>EXPLORER</span>
          </button>

          {/* 02. MISSION (Active Playing Game) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('playing');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'playing'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">02. </span>
            <span>MISSION</span>
          </button>

          {/* 03. DAILY CHALLENGES (Direct Nav Access) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('challenges');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'challenges'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">03. </span>
            <span>CHALLENGES</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                currentPage === 'challenges'
                  ? 'bg-emerald-500 text-stone-950'
                  : 'bg-stone-200 text-stone-800'
              }`}
            >
              {completedChallengesCount}/{dailyChallenges.length}
            </span>
          </button>

          {/* 04. MY STICKERS (Direct Nav Access) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('stickers');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'stickers'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">04. </span>
            <span>STICKERS</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                currentPage === 'stickers'
                  ? 'bg-amber-400 text-stone-950'
                  : 'bg-stone-200 text-stone-800'
              }`}
            >
              {unlockedStickers.length}
            </span>
          </button>

          {/* 05. BIO CARDS (Ecosystem Pet Deck) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('biocards');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'biocards'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">05. </span>
            <span>BIO CARDS</span>
          </button>

          {/* 06. WEATHER (Atmospheric Sensors) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('weather');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'weather'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">06. </span>
            <span>WEATHER</span>
            {weather && (
              <span className="text-[10px] font-bold text-emerald-800 bg-stone-200 px-1.5 py-0.5 rounded">
                {weather.temperatureC}°C
              </span>
            )}
          </button>

          {/* 07. BLUEPRINT (Spatial Architecture) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('blueprint');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'blueprint'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">07. </span>
            <span>BLUEPRINT</span>
          </button>

          {/* 08. MAP (Tactical Google Map) */}
          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setCurrentPage('map');
            }}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all font-medium whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              currentPage === 'map'
                ? 'bg-stone-900 text-stone-50 font-bold shadow-[0_2px_0_0_#0c0a09]'
                : 'text-stone-700 hover:text-stone-900'
            }`}
          >
            <span className="hidden xl:inline">08. </span>
            <span>MAP</span>
          </button>
        </nav>

        {/* Zone 3: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {weather && (
            <button
              onClick={() => {
                hapticFeedback.tactileClick();
                setCurrentPage('weather');
              }}
              title="Click for full outdoor weather & trail report"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-stone-200/90 hover:bg-stone-300 text-stone-800 text-xs font-mono font-bold rounded-lg transition-colors border border-stone-300 cursor-pointer"
            >
              <span>{weather.emoji}</span>
              <span>{weather.temperatureC}°C</span>
            </button>
          )}

          <SoothingSoundtrackHUD />

          <button
            onClick={handleReplayIntro}
            title="Replay Welcome Intro Animation"
            className="flex items-center gap-1 px-2 py-1.5 bg-stone-200/90 hover:bg-stone-300 text-stone-700 text-xs font-mono rounded-lg transition-colors border border-stone-300/80 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
            <span className="hidden xl:inline text-[11px]">INTRO</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.tactileClick();
              setIsPocketModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-50 text-xs font-mono rounded-lg transition-colors border-t border-stone-700/40 shadow-[0_2px_0_0_#0c0a09] active:translate-y-0.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">POCKET</span>
          </button>
        </div>
      </header>

      {/* =========================================================================
          PAGE 1: WELCOME & CHARACTER SELECT (THE USER'S BELOVED PAGE)
          ========================================================================= */}
      {currentPage === 'welcome' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)] flex flex-col justify-between p-4 sm:p-8 lg:p-12">
          {/* Typographic Intro with Dynamic Time-of-Day Welcome Greeting */}
          <div className="max-w-3xl mx-auto text-center space-y-3 select-none">
            {/* Dynamic Time & Weather Banner Pill */}
            <div
              className={`inline-flex flex-wrap items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl bg-stone-200/90 border border-stone-300 shadow-sm text-xs font-mono transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                introAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <div className="flex items-center gap-1.5 text-stone-800 font-bold">
                <span className="text-base select-none">{greetingInfo.emoji}</span>
                <span className="tracking-wider uppercase text-[11px] font-bold text-emerald-800">
                  {greetingInfo.periodLabel}
                </span>
              </div>
              <span className="text-stone-400">·</span>
              <span className="text-stone-600 font-mono text-[11px]">{currentTimeFormatted}</span>
              {weather && (
                <>
                  <span className="text-stone-400">·</span>
                  <div className="flex items-center gap-1 text-emerald-900 font-bold text-[11px]">
                    <span>{weather.emoji}</span>
                    <span className="font-extrabold">{weather.temperatureC}°C</span>
                    <span className="text-stone-500 font-normal hidden sm:inline">({weather.conditionLabel})</span>
                  </div>
                </>
              )}
            </div>

            {/* Time of Day Test Selector Chips */}
            <div
              className={`flex flex-wrap items-center justify-center gap-1 text-[10px] font-mono transition-all duration-700 delay-75 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                introAnimated ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
              }`}
            >
              <span className="text-stone-500 mr-1 hidden sm:inline">Preview Mode:</span>
              {(['auto', 'morning', 'afternoon', 'evening', 'night'] as const).map((tMode) => (
                <button
                  key={tMode}
                  onClick={() => {
                    hapticFeedback.tactileClick();
                    setGreetingTimeMode(tMode);
                  }}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer capitalize ${
                    greetingTimeMode === tMode
                      ? 'bg-stone-900 text-stone-50 font-bold shadow-xs'
                      : 'bg-stone-200/70 hover:bg-stone-300 text-stone-600'
                  }`}
                  title={`Preview ${tMode} greeting`}
                >
                  {tMode === 'auto'
                    ? '⏱️ Auto'
                    : tMode === 'morning'
                    ? '🌅 Morning'
                    : tMode === 'afternoon'
                    ? '☀️ Afternoon'
                    : tMode === 'evening'
                    ? '🌇 Evening'
                    : '🌙 Night'}
                </button>
              ))}
            </div>

            {/* Dynamic Salutation Heading */}
            <div className="overflow-hidden">
              <div
                className={`font-mono text-sm sm:text-base md:text-lg font-bold text-emerald-800 uppercase tracking-wider transition-all duration-700 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  introAnimated ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                }`}
              >
                {greetingInfo.emoji} {greetingInfo.salutation},{' '}
                <span className="text-stone-900 underline decoration-emerald-500 decoration-2 underline-offset-4">
                  {explorerName.trim() ? explorerName : 'Explorer'}
                </span>
                !
              </div>

              <h1
                className={`text-3xl sm:text-5xl lg:text-7xl font-display font-extrabold text-stone-900 tracking-tight leading-[1.05] mt-1 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  introAnimated
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-full opacity-0'
                }`}
              >
                Choose Your Explorer
              </h1>
            </div>

            <div className="overflow-hidden">
              <p
                className={`text-xs sm:text-sm md:text-base font-mono text-stone-600 max-w-2xl mx-auto transition-all duration-700 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  introAnimated
                    ? 'translate-y-0 opacity-100'
                    : 'translate-y-full opacity-0'
                }`}
              >
                {greetingInfo.subTitle}. Outdoor nature gamification featuring authentic 3D human explorer, real-time GPS tactical radar, soothing ambient soundscapes, and soil crafting.
              </p>
            </div>
          </div>

          {/* Mobile Gender Select Dock */}
          <div className="lg:hidden w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center gap-1.5 my-2 z-20">
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
              Explorer Avatar
            </span>
            <div className="w-full grid grid-cols-2 gap-2 p-1 bg-stone-300/70 backdrop-blur-xs rounded-xl border border-stone-400/50 shadow-inner">
              <button
                onClick={() => setSelectedGender('male')}
                className={`relative py-2.5 px-3 rounded-lg font-mono text-xs font-bold transition-all select-none cursor-pointer flex items-center justify-center gap-2 ${
                  selectedGender === 'male'
                    ? 'bg-stone-900 text-stone-50 border-t border-stone-600 shadow-[0_3px_0_0_#0c0a09] translate-y-0'
                    : 'bg-stone-200/90 hover:bg-stone-300 text-stone-800'
                }`}
              >
                <span className="text-sm">♂</span>
                <span>MALE</span>
              </button>
              <button
                onClick={() => setSelectedGender('female')}
                className={`relative py-2.5 px-3 rounded-lg font-mono text-xs font-bold transition-all select-none cursor-pointer flex items-center justify-center gap-2 ${
                  selectedGender === 'female'
                    ? 'bg-stone-900 text-stone-50 border-t border-stone-600 shadow-[0_3px_0_0_#0c0a09] translate-y-0'
                    : 'bg-stone-200/90 hover:bg-stone-300 text-stone-800'
                }`}
              >
                <span className="text-sm">♀</span>
                <span>FEMALE</span>
              </button>
            </div>
          </div>

          {/* 3D Character Viewport Stage */}
          <div className="relative w-full max-w-4xl h-[360px] sm:h-[440px] lg:h-[520px] mx-auto my-1 sm:my-2 flex items-center justify-center">
            {/* Centered 3D WebGL Canvas */}
            <div className="w-full h-full">
              <CharacterCanvas
                gender={selectedGender}
                outfitColor={selectedOutfitColor}
                isWalking={false}
                gamePage="welcome"
              />
            </div>

            {/* Desktop Left Dock: Gender Select */}
            <div className="hidden lg:flex absolute left-4 xl:left-6 top-1/2 -translate-y-1/2 flex-col gap-3 z-20">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
                Explorer Avatar
              </span>

              <button
                onClick={() => setSelectedGender('male')}
                className={`relative px-4 py-3 rounded-xl font-mono text-xs font-bold transition-all select-none cursor-pointer flex items-center gap-2.5 ${
                  selectedGender === 'male'
                    ? 'bg-stone-900 text-stone-50 border-t border-stone-600 shadow-[0_5px_0_0_#0c0a09] translate-y-0'
                    : 'bg-stone-200/90 hover:bg-stone-300 text-stone-800 border-t border-white/60 shadow-[0_4px_0_0_#a8a29e] active:translate-y-1 active:shadow-none'
                }`}
              >
                <span className="text-sm">♂</span>
                <span>MALE EXPLORER</span>
              </button>

              <button
                onClick={() => setSelectedGender('female')}
                className={`relative px-4 py-3 rounded-xl font-mono text-xs font-bold transition-all select-none cursor-pointer flex items-center gap-2.5 ${
                  selectedGender === 'female'
                    ? 'bg-stone-900 text-stone-50 border-t border-stone-600 shadow-[0_5px_0_0_#0c0a09] translate-y-0'
                    : 'bg-stone-200/90 hover:bg-stone-300 text-stone-800 border-t border-white/60 shadow-[0_4px_0_0_#a8a29e] active:translate-y-1 active:shadow-none'
                }`}
              >
                <span className="text-sm">♀</span>
                <span>FEMALE EXPLORER</span>
              </button>
            </div>

            {/* Desktop Right Dock: Tech Gear Styling */}
            <div className="hidden lg:flex absolute right-4 xl:right-6 top-1/2 -translate-y-1/2 flex-col items-end gap-3 z-20">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
                Gear Palette
              </span>

              {(['charcoal', 'forest', 'sand'] as OutfitColor[]).map((col) => (
                <button
                  key={col}
                  onClick={() => setSelectedOutfitColor(col)}
                  className={`relative px-4 py-2.5 rounded-xl font-mono text-xs capitalize transition-all select-none cursor-pointer flex items-center gap-2 ${
                    selectedOutfitColor === col
                      ? 'bg-stone-900 text-stone-50 font-bold border-t border-stone-600 shadow-[0_5px_0_0_#0c0a09]'
                      : 'bg-stone-200/90 hover:bg-stone-300 text-stone-800 font-medium border-t border-white/60 shadow-[0_4px_0_0_#a8a29e] active:translate-y-1 active:shadow-none'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        col === 'charcoal' ? '#27272a' : col === 'forest' ? '#1b4332' : '#926c48',
                    }}
                  />
                  <span>{col} Finish</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Gear Palette Dock */}
          <div className="lg:hidden w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center gap-1.5 my-2 z-20">
            <span className="text-[10px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
              Tech Gear Palette
            </span>
            <div className="w-full grid grid-cols-3 gap-2">
              {(['charcoal', 'forest', 'sand'] as OutfitColor[]).map((col) => (
                <button
                  key={col}
                  onClick={() => setSelectedOutfitColor(col)}
                  className={`relative py-2 px-2 rounded-xl font-mono text-xs capitalize transition-all select-none cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedOutfitColor === col
                      ? 'bg-stone-900 text-stone-50 font-bold border-t border-stone-600 shadow-[0_3px_0_0_#0c0a09]'
                      : 'bg-stone-200/90 hover:bg-stone-300 text-stone-800 font-medium border-t border-white/60 shadow-[0_2px_0_0_#a8a29e]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{
                      backgroundColor:
                        col === 'charcoal' ? '#27272a' : col === 'forest' ? '#1b4332' : '#926c48',
                    }}
                  />
                  <span>{col}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Explorer Deck & Launch Actuator */}
          <div
            className={`max-w-md w-full mx-auto space-y-3 pt-2 transition-all duration-700 delay-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              introAnimated ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 p-1.5 bg-stone-200/80 rounded-xl border border-stone-300 shadow-inner">
              <span className="pl-3 text-xs font-mono text-stone-500 uppercase font-semibold">CODENAME:</span>
              <input
                type="text"
                value={explorerName}
                onChange={(e) => setExplorerName(e.target.value)}
                placeholder="Enter explorer name..."
                className="flex-1 bg-transparent text-sm font-mono font-bold text-stone-900 outline-none px-2"
              />
            </div>

            {/* Launch Game Actuator */}
            <button
              onClick={() => {
                hapticFeedback.startPlaying();
                setCurrentPage('playing');
                ambientAudioService.start();
              }}
              className="relative w-full py-3.5 sm:py-4 px-6 bg-stone-900 hover:bg-stone-800 active:bg-stone-900 text-stone-50 font-display font-bold text-base rounded-2xl transition-all border-t border-stone-600/50 shadow-[0_6px_0_0_#0c0a09] active:shadow-[0_1px_0_0_#0c0a09] active:translate-y-1.5 flex items-center justify-center gap-3 cursor-pointer group"
            >
              <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>START PLAYING · ENTER EXPEDITION</span>
              <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform ml-auto" />
            </button>

            {/* Direct Daily Challenges Actuator */}
            <button
              onClick={() => {
                hapticFeedback.tactileClick();
                setCurrentPage('challenges');
              }}
              className="w-full py-3 px-5 bg-stone-200/90 hover:bg-stone-300 text-stone-900 font-mono text-xs font-bold rounded-2xl transition-all border border-stone-300 shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>VIEW DAILY NATURE CHALLENGES ({completedChallengesCount}/{dailyChallenges.length})</span>
            </button>
            {/* Direct Feature Launchers Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setCurrentPage('map');
                }}
                className="p-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-mono text-[11px] font-bold border border-stone-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-emerald-700" />
                <span>Google Map</span>
              </button>

              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setCurrentPage('biocards');
                }}
                className="p-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-mono text-[11px] font-bold border border-stone-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Bio Cards</span>
              </button>

              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setCurrentPage('weather');
                }}
                className="p-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-mono text-[11px] font-bold border border-stone-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <CloudSun className="w-4 h-4 text-amber-600" />
                <span>Weather Pod</span>
              </button>

              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setCurrentPage('blueprint');
                }}
                className="p-2 rounded-xl bg-stone-200/80 hover:bg-stone-300 text-stone-800 font-mono text-[11px] font-bold border border-stone-300 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-purple-700" />
                <span>Blueprint</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* =========================================================================
          PAGE 2: PLAYING GAME (MISSION HUD, 3D HERO STAGE, NATURE GPS, EASY UI)
          No virtual map! Minimal text, hands-free earphone voice first!
          ========================================================================= */}
      {currentPage === 'playing' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)]">
          <MissionHUD
            gender={selectedGender}
            outfitColor={selectedOutfitColor}
            explorerName={explorerName}
            isWalking={isWalking}
            setIsWalking={setIsWalking}
            onOpenPocketMode={() => setIsPocketModalOpen(true)}
            onBackToCharacterSelect={() => setCurrentPage('welcome')}
            onOpenDailyChallenges={() => setCurrentPage('challenges')}
            onOpenStickers={() => setCurrentPage('stickers')}
            onOpenBioCards={() => setCurrentPage('biocards')}
            onOpenWeather={() => setCurrentPage('weather')}
            onOpenBlueprint={() => setCurrentPage('blueprint')}
            weather={weather}
            isLoadingWeather={isWeatherLoading}
            onRefreshWeather={loadWeather}
            unlockedStickers={unlockedStickers}
            setUnlockedStickers={setUnlockedStickers}
            currentLevel={currentLevel}
            setCurrentLevel={setCurrentLevel}
            totalXp={totalXp}
            setTotalXp={setTotalXp}
            dailyChallenges={dailyChallenges}
          />
        </main>
      )}

      {/* =========================================================================
          PAGE 3: DAILY CHALLENGES (DEDICATED FULL VIEW)
          ========================================================================= */}
      {currentPage === 'challenges' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)]">
          <DailyChallengesView
            challenges={dailyChallenges}
            onToggleChallenge={handleToggleDailyChallenge}
            onRefreshChallenges={handleRefreshChallenges}
            isRefreshing={isFetchingChallenges}
            onStartMission={() => setCurrentPage('playing')}
            selectedBiome="Redwood & Oak Woodland"
            totalXp={totalXp}
          />
        </main>
      )}

      {/* =========================================================================
          PAGE 4: MY FIELD STICKERS (DEDICATED FULL VIEW)
          ========================================================================= */}
      {currentPage === 'stickers' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)]">
          <StickerAlbumView
            unlockedStickers={unlockedStickers}
            onStartMission={() => setCurrentPage('playing')}
          />
        </main>
      )}

      {/* =========================================================================
          PAGE 5: ECOSYSTEM BIO CARDS & 3D PET COMPANION DECK
          ========================================================================= */}
      {currentPage === 'biocards' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)] py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-300">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                BIOLOGICAL ARTIFACT CODEX
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-stone-900">
                Ecosystem Specimen Deck & Pet Companion
              </h2>
            </div>
            <button
              onClick={() => setCurrentPage('playing')}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-50 font-mono text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>TO MISSION</span>
            </button>
          </div>
          <BioCardsDeck onStartMission={() => setCurrentPage('playing')} />
        </main>
      )}

      {/* =========================================================================
          PAGE 6: REAL-TIME ATMOSPHERIC WEATHER & TRAIL CONDITIONS
          ========================================================================= */}
      {currentPage === 'weather' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)] py-6 px-3 sm:px-6 max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-300">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                FIELD INSTRUMENTATION
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-stone-900">
                Atmospheric Weather & Trail Sensors
              </h2>
            </div>
            <button
              onClick={() => setCurrentPage('playing')}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-50 font-mono text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>TO MISSION</span>
            </button>
          </div>
          <EnvironmentalWeatherPod
            weather={weather}
            isLoading={isWeatherLoading}
            onRefreshWeather={loadWeather}
            onStartMission={() => setCurrentPage('playing')}
            variant="full"
          />
        </main>
      )}

      {/* =========================================================================
          PAGE 7: SYSTEM ARCHITECTURE & SPATIAL AUDIO BLUEPRINT
          ========================================================================= */}
      {currentPage === 'blueprint' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)] py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-300">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-purple-800 tracking-wider">
                ENGINEERING SPECIFICATIONS
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-stone-900">
                System Blueprint & Spatial Audio Compass
              </h2>
            </div>
            <button
              onClick={() => setCurrentPage('playing')}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-50 font-mono text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>TO MISSION</span>
            </button>
          </div>
          <ArchitectureBlueprint />
        </main>
      )}

      {/* =========================================================================
          PAGE 8: FULL TACTICAL GOOGLE MAP & REAL-WORLD SATELLITE RADAR
          ========================================================================= */}
      {currentPage === 'map' && (
        <main className="relative z-10 min-h-[calc(100vh-69px)] py-6 px-3 sm:px-6 max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-300">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                TACTICAL RADAR · GOOGLE MAPS PLATFORM
              </span>
              <h2 className="text-xl sm:text-2xl font-display font-extrabold text-stone-900">
                Satellite Field Radar & Waypoints
              </h2>
            </div>
            <button
              onClick={() => setCurrentPage('playing')}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 text-stone-50 font-mono text-xs font-bold hover:bg-stone-800 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>TO MISSION</span>
            </button>
          </div>

          <TacticalGoogleMap
            telemetry={telemetry}
            waypoints={appWaypoints}
            activeWaypoint={activeMapWaypoint}
            onSelectWaypoint={setActiveMapWaypoint}
            explorerName={explorerName}
          />
        </main>
      )}

      {/* FULLSCREEN OLED POCKET MODE MODAL */}
      {isPocketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-black border border-white/20 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2 font-mono text-sm text-white font-bold">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span>OLED POCKET MODE SIMULATOR</span>
              </div>
              <button
                onClick={() => setIsPocketModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PocketModeHUD isFullScreen={true} onClose={() => setIsPocketModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

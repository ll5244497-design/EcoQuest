import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Camera,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Square,
  CheckCircle2,
  Smartphone,
  Flame,
  ArrowRight,
  Shield,
  Radio,
  Footprints,
  MapPin,
  Compass,
  X,
  Sliders,
  Music,
} from 'lucide-react';
import { CharacterGender, OutfitColor } from '../types';
import { CharacterCanvas } from './CharacterCanvas';
import { PhotoScavengerModal } from './PhotoScavengerModal';
import { StickerBookModal, StickerEntry } from './StickerBookModal';
import { SoothingSoundtrackHUD } from './SoothingSoundtrackHUD';
import { ambientAudioService, SOUNDTRACK_PLAYLIST } from '../services/ambientAudioService';
import {
  GeneratedMission,
  generateOutdoorMission,
  getCurrentTimeOfDay,
  DailyNatureChallenge,
} from '../services/geminiMissionService';
import {
  movementTrackingService,
  MovementTelemetry,
} from '../services/movementTrackingService';
import { LocalityWaypoint } from '../types';
import { hapticFeedback } from '../utils/haptics';
import { OutdoorWeatherData } from '../services/weatherService';
import { DynamicWeatherIcon } from './EnvironmentalWeatherPod';
import { TacticalGoogleMap } from './TacticalGoogleMap';

interface MissionHUDProps {
  gender: CharacterGender;
  outfitColor?: OutfitColor;
  explorerName: string;
  isWalking: boolean;
  setIsWalking: (walking: boolean) => void;
  onOpenPocketMode: () => void;
  onBackToCharacterSelect: () => void;
  onOpenDailyChallenges?: () => void;
  onOpenStickers?: () => void;
  onOpenBioCards?: () => void;
  onOpenWeather?: () => void;
  onOpenBlueprint?: () => void;
  weather?: OutdoorWeatherData | null;
  isLoadingWeather?: boolean;
  onRefreshWeather?: () => void;
  unlockedStickers: StickerEntry[];
  setUnlockedStickers: React.Dispatch<React.SetStateAction<StickerEntry[]>>;
  currentLevel: number;
  setCurrentLevel: React.Dispatch<React.SetStateAction<number>>;
  totalXp: number;
  setTotalXp: React.Dispatch<React.SetStateAction<number>>;
  dailyChallenges?: DailyNatureChallenge[];
}

export const MissionHUD: React.FC<MissionHUDProps> = ({
  gender,
  outfitColor = 'charcoal',
  explorerName,
  isWalking,
  setIsWalking,
  onOpenPocketMode,
  onBackToCharacterSelect,
  onOpenDailyChallenges,
  onOpenStickers,
  onOpenBioCards,
  onOpenWeather,
  onOpenBlueprint,
  weather,
  isLoadingWeather,
  onRefreshWeather,
  unlockedStickers,
  setUnlockedStickers,
  currentLevel,
  setCurrentLevel,
  totalXp,
  setTotalXp,
  dailyChallenges = [],
}) => {
  // Modals
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isStickerBookModalOpen, setIsStickerBookModalOpen] = useState(false);

  // Soothing Ambient Audio State
  const [audioState, setAudioState] = useState(ambientAudioService.getState());

  useEffect(() => {
    const unsubAudio = ambientAudioService.subscribe((s) => setAudioState(s));
    // Ensure ambient soothing audio starts softly when game HUD loads
    ambientAudioService.start();
    return () => unsubAudio();
  }, []);

  // Movement Telemetry (Runs in background)
  const [telemetry, setTelemetry] = useState<MovementTelemetry>(
    movementTrackingService.getTelemetry()
  );

  useEffect(() => {
    const unsub = movementTrackingService.subscribe((t) => {
      setTelemetry(t);
      setIsWalking(t.state === 'MOVING');
    });
    return () => unsub();
  }, [setIsWalking]);

  // GPS Nature Waypoints for Locality Google Map
  const [localWaypoints, setLocalWaypoints] = useState<LocalityWaypoint[]>([]);
  const [activeWaypoint, setActiveWaypoint] = useState<LocalityWaypoint | null>(null);
  const [waypointSectionView, setWaypointSectionView] = useState<'map' | 'split' | 'cards'>('split');
  const mapSectionRef = useRef<HTMLDivElement | null>(null);

  // Compute live distance between current telemetry lat/lng and waypoints
  const liveWaypoints = React.useMemo(() => {
    return localWaypoints.map((wp) => {
      const R = 6371e3;
      const p1 = (telemetry.latitude * Math.PI) / 180;
      const p2 = (wp.lat * Math.PI) / 180;
      const dp = ((wp.lat - telemetry.latitude) * Math.PI) / 180;
      const dl = ((wp.lng - telemetry.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dp / 2) ** 2 +
        Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = Math.round(R * c);
      return {
        ...wp,
        distanceMeters: dist,
      };
    });
  }, [localWaypoints, telemetry.latitude, telemetry.longitude]);

  useEffect(() => {
    const baseLat = telemetry.latitude || 37.7749;
    const baseLng = telemetry.longitude || -122.4194;

    const initialWaypoints: LocalityWaypoint[] = [
      {
        id: 'wp-dragon-1',
        name: 'Broad Fallen Leaves Cache',
        category: 'Botanical',
        description: 'Look beneath shaded oak or maple canopy for broad fallen leaves.',
        audioPrompt: 'Find two broad fallen leaves on the ground for your craft dragon wings.',
        lat: baseLat + 0.0006,
        lng: baseLng + 0.0008,
        icon: '🍃',
        completed: false,
        distanceMeters: 75,
      },
      {
        id: 'wp-dragon-2',
        name: 'Curved Twig Haven',
        category: 'Canopy',
        description: 'Search near fallen branches for a sturdy, curved dry twig.',
        audioPrompt: 'Pick up one curved twig about the length of your hand for the dragon spine.',
        lat: baseLat - 0.0005,
        lng: baseLng + 0.0007,
        icon: '🪵',
        completed: false,
        distanceMeters: 60,
      },
      {
        id: 'wp-dragon-3',
        name: 'Polished River Pebbles',
        category: 'Geo',
        description: 'Locate two smooth round pebbles on the path.',
        audioPrompt: 'Gather two smooth pebbles from the soil to serve as glowing dragon eyes.',
        lat: baseLat + 0.0003,
        lng: baseLng - 0.0009,
        icon: '🪨',
        completed: false,
        distanceMeters: 90,
      },
    ];

    setLocalWaypoints(initialWaypoints);
    setActiveWaypoint(initialWaypoints[0]);
  }, [telemetry.isGpsActive]);

  const handleWaypointCompleted = (id: string) => {
    setLocalWaypoints((prev) =>
      prev.map((wp) => (wp.id === id ? { ...wp, completed: true } : wp))
    );
    setTotalXp((prev) => prev + 150);
  };

  // Active Outdoor Mission
  const [activeMission, setActiveMission] = useState<GeneratedMission>({
    id: 'mission-dragon-default',
    title: 'The Forest Leaf Dragon',
    objective: 'Gather natural items and craft a miniature dragon on the soil.',
    audioScript:
      'Scan the ground around your feet. Find two broad fallen leaves, a sturdy twig, and two smooth pebbles. Assemble a forest dragon on the earth, then snap a photo for your Field Codex!',
    biome: 'Redwood & Oak Woodland',
    timeOfDay: 'Afternoon',
    scavengerItems: [
      '2x Broad Leaves (Wings)',
      '1x Curved Twig (Spine)',
      '2x River Pebbles (Eyes)',
    ],
    craftInstructions:
      'Lay the curved twig flat as the dragon spine. Place the two broad leaves on either side as wings. Crown the top with two pebbles as dragon eyes!',
    targetLandmark: 'Ancient Canopy Clearing',
    targetDistanceMeters: 180,
    targetBearingDegrees: 335,
    rewardXp: 350,
    stickerReward: {
      id: 'stk-dragon',
      name: 'Verdant Leaf Dragon',
      rarity: 'Mythic',
      badgeEmoji: '🐉',
      lore: 'A gentle woodland guardian crafted on the soil from autumn leaves and river pebbles.',
    },
  });

  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [isExpeditionStarted, setIsExpeditionStarted] = useState(true);

  // Toggle Expedition state and soothing game background audio
  const handleToggleExpedition = (forceStart?: boolean) => {
    hapticFeedback.startPlaying();
    const shouldStart = forceStart !== undefined ? forceStart : !isExpeditionStarted;
    movementTrackingService.setExpeditionActive(shouldStart);
    setIsExpeditionStarted(shouldStart);

    if (shouldStart) {
      ambientAudioService.start();
    }
  };

  // Gemini AI New Mission Generator
  const handleGenerateGeminiMission = async () => {
    setIsGeneratingMission(true);
    try {
      hapticFeedback.buttonPress();
      const newMission = await generateOutdoorMission({
        biome: activeMission.biome,
        timeOfDay: getCurrentTimeOfDay(),
        difficulty: 'Adventurer',
      });
      setActiveMission(newMission);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingMission(false);
    }
  };

  // Complete mission with photo craft
  const handleMissionCompleted = (photoDataUrl: string) => {
    hapticFeedback.missionCompleted();
    setIsPhotoModalOpen(false);
    setTotalXp((prev) => prev + activeMission.rewardXp);
    setCurrentLevel((prev) => Math.min(prev + 1, 7));

    const newSticker: StickerEntry = {
      id: `stk-${Date.now()}`,
      name: activeMission.stickerReward.name,
      badgeEmoji: activeMission.stickerReward.badgeEmoji,
      rarity: activeMission.stickerReward.rarity,
      category: 'craft',
      biome: activeMission.biome,
      dateUnlocked: 'Just Now',
      lore: activeMission.stickerReward.lore,
      ingredients: activeMission.scavengerItems,
      photoUrl: photoDataUrl,
      xpEarned: activeMission.rewardXp,
    };

    setUnlockedStickers((prev) => [newSticker, ...prev]);
    if (onOpenStickers) {
      onOpenStickers();
    } else {
      setIsStickerBookModalOpen(true);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-6 py-3 sm:py-6 space-y-5 select-none font-['Plus_Jakarta_Sans',sans-serif]">
      {/* =========================================================================
          HERO STATUS STRIP: CLEAN GAME STATS + SOOTHING AUDIO CONTROLLER
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-stone-300/75 backdrop-blur-md rounded-2xl border border-stone-400/50 shadow-inner">
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 font-bold text-stone-900">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isExpeditionStarted ? 'bg-emerald-600 animate-pulse' : 'bg-stone-500'
              }`}
            />
            <span className="text-[11px] sm:text-xs">
              {isExpeditionStarted ? 'EXPEDITION LIVE' : 'EXPEDITION READY'}
            </span>
          </div>
          <span className="text-stone-400">/</span>
          <span className="text-stone-700 text-[11px] sm:text-xs">
            <strong>{explorerName}</strong>
          </span>
          <span className="hidden sm:inline text-stone-400">/</span>
          <span className="hidden sm:inline font-bold text-stone-900 text-xs">
            Stage {currentLevel}/7
          </span>
          <span className="hidden sm:inline text-stone-400">/</span>
          <span className="hidden sm:inline font-bold text-emerald-800 text-xs tabular-nums">
            {totalXp} XP
          </span>
        </div>

        {/* Action Controls: Soothing Music Controller & Pocket Mode */}
        <div className="flex items-center gap-2">
          {/* Soothing Soundtrack HUD Component */}
          <SoothingSoundtrackHUD />

          {/* Real-world Weather Status Button */}
          {weather && (
            <button
              onClick={() => {
                hapticFeedback.tactileClick();
                if (onOpenWeather) onOpenWeather();
              }}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-200/90 hover:bg-stone-300 text-stone-900 font-mono text-[11px] sm:text-xs font-bold border-t border-white/60 shadow-[0_2px_0_0_#a8a29e] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
              title="View full atmospheric weather & trail conditions"
            >
              <DynamicWeatherIcon iconType={weather.iconType} className="w-3.5 h-3.5" />
              <span className="tabular-nums font-bold text-emerald-900">{weather.temperatureC}°C</span>
              <span className="hidden md:inline text-stone-600">· {weather.conditionLabel}</span>
            </button>
          )}

          {/* Pocket Mode Quick Dim */}
          <button
            onClick={onOpenPocketMode}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-mono text-[11px] sm:text-xs font-bold border-t border-stone-600 shadow-[0_2px_0_0_#0c0a09] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden xs:inline">POCKET</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          HERO 3D EXPLORER AVATAR VIEWPORT (AUTHENTIC HUMAN CHARACTER)
          ========================================================================= */}
      <div className="relative w-full h-[240px] sm:h-[300px] mx-auto flex items-center justify-center rounded-3xl overflow-hidden bg-stone-300/40 border border-stone-400/40 shadow-inner">
        <CharacterCanvas
          gender={gender}
          outfitColor={outfitColor}
          isWalking={isWalking}
          gamePage="playing"
        />

        {/* Ambient Overlay Tag */}
        <div className="absolute bottom-3 left-3 sm:left-4 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/85 backdrop-blur-md text-stone-50 text-[11px] font-mono border border-stone-700/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Explorer {explorerName}</span>
          <span className="text-stone-400">·</span>
          <span>{isWalking ? '🏃 Walking' : '🛑 Stationary'}</span>
        </div>
      </div>

      {/* =========================================================================
          1. BRIEF TASK INFO (MINIMAL TEXT · 3D PHYSICAL CARD)
          ========================================================================= */}
      <section className="p-4 sm:p-6 rounded-3xl bg-stone-100/95 border border-stone-300/80 shadow-[0_6px_0_0_#d6d3d1] space-y-3.5">
        {/* Header with Title and Re-roll */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-stone-300/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center font-bold text-base shadow-sm">
              🎯
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                CURRENT EXPEDITION TASK
              </span>
              <h2 className="text-lg sm:text-2xl font-display font-extrabold text-stone-900 tracking-tight leading-tight">
                {activeMission.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleGenerateGeminiMission}
            disabled={isGeneratingMission}
            className="px-2.5 py-1.5 rounded-xl bg-stone-200/90 hover:bg-stone-300 text-stone-800 font-mono text-[11px] sm:text-xs font-bold border-t border-white/60 shadow-[0_2px_0_0_#a8a29e] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-stone-600 ${isGeneratingMission ? 'animate-spin' : ''}`} />
            <span>{isGeneratingMission ? 'Generating...' : 'New Task'}</span>
          </button>
        </div>

        {/* 1-Sentence Brief Objective */}
        <p className="text-xs sm:text-sm font-mono text-stone-800 font-medium leading-relaxed bg-stone-200/70 p-2.5 sm:p-3 rounded-xl border border-stone-300/70">
          {activeMission.objective}
        </p>

        {/* Scavenger Items */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono text-stone-500 uppercase font-semibold">
            Gather Items:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {activeMission.scavengerItems.map((item, idx) => (
              <div
                key={idx}
                className="p-2 sm:p-2.5 rounded-xl bg-stone-200/90 border border-stone-300 flex items-center gap-2 text-[11px] sm:text-xs font-mono font-medium text-stone-800"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reward & Craft Photo Button */}
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-stone-700 bg-stone-200/70 px-2.5 py-1.5 rounded-xl border border-stone-300">
            <span className="text-base">{activeMission.stickerReward.badgeEmoji}</span>
            <span>+{activeMission.rewardXp} XP · {activeMission.stickerReward.name}</span>
          </div>

          <button
            onClick={() => {
              hapticFeedback.buttonPress();
              setIsPhotoModalOpen(true);
            }}
            className="py-2.5 sm:py-3 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-stone-900 hover:bg-stone-800 text-stone-50 border-t border-stone-600 shadow-[0_4px_0_0_#0c0a09] active:shadow-[0_1px_0_0_#0c0a09] active:translate-y-1 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>CRAFT ON SOIL & SNAP PHOTO</span>
          </button>
        </div>
      </section>

      {/* =========================================================================
          2. SOOTHING GAME BACKGROUND SOUNDSCAPE POD
          ========================================================================= */}
      <section className="p-4 sm:p-5 rounded-3xl bg-stone-100/95 border border-stone-300/80 shadow-[0_6px_0_0_#d6d3d1] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-stone-300/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center font-bold text-sm shadow-sm">
              <Music className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-800 tracking-wider">
                SOOTHING BACKGROUND SOUND
              </span>
              <h3 className="text-sm sm:text-base font-display font-extrabold text-stone-900">
                Procedural Ambient Nature Soundscape
              </h3>
            </div>
          </div>

          {/* Sound State Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-200/90 border border-stone-300 font-mono text-xs font-bold text-stone-800">
            {audioState.isPlaying && !audioState.isMuted ? (
              <>
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-1 bg-emerald-600 h-2 animate-bounce" />
                  <span className="w-1 bg-emerald-600 h-3 animate-bounce delay-75" />
                  <span className="w-1 bg-emerald-600 h-1.5 animate-bounce delay-150" />
                </div>
                <span className="text-emerald-800">PLAYING RELAXING AUDIO</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-stone-500" />
                <span>AUDIO PAUSED</span>
              </>
            )}
          </div>
        </div>

        {/* Game Soundtrack Track Switcher */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
            <span>SOUNDTRACK PLAYLIST</span>
            <span className="text-emerald-700 font-semibold">{audioState.currentTrack.title}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {SOUNDTRACK_PLAYLIST.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => {
                  hapticFeedback.tactileClick();
                  ambientAudioService.selectTrack(idx);
                }}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  audioState.currentTrackIndex === idx
                    ? 'bg-stone-900 text-stone-50 border-stone-700 shadow-md ring-2 ring-emerald-500/40'
                    : 'bg-stone-200/80 hover:bg-stone-300 text-stone-800 border-stone-300'
                }`}
              >
                <div className="font-mono text-xs font-bold truncate flex items-center gap-1.5">
                  {audioState.currentTrackIndex === idx && audioState.isPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                  <span>{track.title}</span>
                </div>
                <div className="text-[10px] opacity-75 truncate">{track.mood}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Audio Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 bg-stone-200/70 p-3 rounded-2xl border border-stone-300/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                hapticFeedback.tactileClick();
                ambientAudioService.togglePlay();
              }}
              className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-50 font-mono text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {audioState.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PAUSE SOUND</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>PLAY SOUND</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                hapticFeedback.tactileClick();
                ambientAudioService.toggleMute();
              }}
              className="p-2 rounded-xl bg-stone-300 hover:bg-stone-400 text-stone-800 transition-colors cursor-pointer"
              title={audioState.isMuted ? 'Unmute' : 'Mute'}
            >
              {audioState.isMuted || audioState.volume === 0 ? (
                <VolumeX className="w-4 h-4 text-stone-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-700" />
              )}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 flex-1 max-w-[200px]">
            <span className="text-[10px] font-mono text-stone-600 uppercase font-semibold">VOL</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioState.volume}
              onChange={(e) => ambientAudioService.setVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-stone-900"
            />
            <span className="text-[10px] font-mono font-bold text-stone-700 w-7 text-right">
              {Math.round(audioState.volume * 100)}%
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. START EXPEDITION (PROMINENT TACTILE 3D ACTUATOR)
          ========================================================================= */}
      <section className="space-y-2">
        <button
          onClick={() => handleToggleExpedition()}
          className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-display font-extrabold text-sm sm:text-base uppercase tracking-wider transition-all flex items-center justify-center gap-3 cursor-pointer select-none ${
            isExpeditionStarted
              ? 'bg-emerald-700 hover:bg-emerald-600 text-stone-50 border-t border-emerald-400 shadow-[0_6px_0_0_#064e3b] active:translate-y-1.5 active:shadow-[0_1px_0_0_#064e3b]'
              : 'bg-stone-900 hover:bg-stone-800 text-stone-50 border-t border-stone-600 shadow-[0_6px_0_0_#0c0a09] active:translate-y-1.5 active:shadow-[0_1px_0_0_#0c0a09]'
          }`}
        >
          {isExpeditionStarted ? (
            <>
              <Square className="w-4 h-4 text-emerald-300 fill-emerald-300 animate-pulse" />
              <span>EXPEDITION ACTIVE · AMBIENT SOUND ON</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 text-emerald-400" />
              <span>RESUME EXPEDITION & PLAY SOUND</span>
              <ArrowRight className="w-5 h-5 text-emerald-400 ml-auto" />
            </>
          )}
        </button>
      </section>

      {/* =========================================================================
          4. LOCALITY NATURE WAYPOINTS & GOOGLE MAPS GPS RADAR
          ========================================================================= */}
      <section ref={mapSectionRef} className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-700" />
            <h3 className="font-display font-extrabold text-sm sm:text-base text-stone-900">
              Tactical Google Map & GPS Radar
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-stone-200/80 p-0.5 rounded-xl border border-stone-300 text-xs font-mono">
              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setWaypointSectionView('map');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  waypointSectionView === 'map'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                🗺️ Map View
              </button>
              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setWaypointSectionView('split');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  waypointSectionView === 'split'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                🔲 Split View
              </button>
              <button
                onClick={() => {
                  hapticFeedback.tactileClick();
                  setWaypointSectionView('cards');
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  waypointSectionView === 'cards'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-stone-700 hover:text-stone-900'
                }`}
              >
                📋 Cards Only
              </button>
            </div>

            <button
              onClick={() => {
                movementTrackingService.requestCurrentLocation();
              }}
              className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              🎯 Refresh GPS
            </button>
          </div>
        </div>

        {/* 4.A Tactical Google Map Layer */}
        {(waypointSectionView === 'map' || waypointSectionView === 'split') && (
          <TacticalGoogleMap
            telemetry={telemetry}
            waypoints={liveWaypoints}
            activeWaypoint={activeWaypoint}
            onSelectWaypoint={setActiveWaypoint}
            explorerName={explorerName}
          />
        )}

        {/* 4.B Tactical GPS & Waypoints Deck */}
        {(waypointSectionView === 'split' || waypointSectionView === 'cards') && (
          <div className="p-4 sm:p-5 rounded-3xl bg-stone-900 text-white border border-stone-800 shadow-xl space-y-4">
            {/* Real-time GPS Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-800 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-bold">{telemetry.localityName || 'Local Outdoor Sector'}</span>
                {telemetry.isSimulating && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 animate-pulse">
                    SIMULATING WALK
                  </span>
                )}
              </div>
              <div className="text-stone-400 flex items-center gap-3">
                <span>{telemetry.latitude.toFixed(4)}°N, {Math.abs(telemetry.longitude).toFixed(4)}°W</span>
                <span className="text-stone-600">|</span>
                <span className="text-emerald-400 font-bold">±{Math.round(telemetry.accuracy || 5)}m ACCURACY</span>
              </div>
            </div>

            {/* Waypoints Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {liveWaypoints.map((wp) => {
                const isSelected = activeWaypoint?.id === wp.id;
                return (
                  <div
                    key={wp.id}
                    onClick={() => {
                      hapticFeedback.tactileClick();
                      setActiveWaypoint(wp);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                      wp.completed
                        ? 'bg-stone-950/70 border-stone-800 opacity-60'
                        : isSelected
                        ? 'bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg'
                        : 'bg-stone-850 hover:bg-stone-800 border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{wp.icon}</span>
                        <div>
                          <h4 className="font-bold text-xs text-white leading-tight">{wp.name}</h4>
                          <span className="text-[10px] font-mono text-emerald-400">{wp.category}</span>
                        </div>
                      </div>
                      {wp.completed && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>

                    <p className="text-[11px] text-stone-300 font-sans leading-relaxed line-clamp-2">
                      {wp.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[10px] font-mono">
                      <span className="text-stone-400">{wp.distanceMeters}m away</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticFeedback.buttonPress();
                            movementTrackingService.walkTowards(wp.lat, wp.lng);
                          }}
                          className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 cursor-pointer font-bold"
                          title="Simulate walking toward this waypoint"
                        >
                          <Footprints className="w-3 h-3 text-emerald-400" />
                          <span>Walk</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            hapticFeedback.tactileClick();
                            handleWaypointCompleted(wp.id);
                          }}
                          className="px-2.5 py-1 rounded bg-emerald-800/80 hover:bg-emerald-700 text-white flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          <span>Check</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* =========================================================================
          MODALS: PHOTO SCAVENGER & STICKER BOOK (OPENED ON DEMAND)
          ========================================================================= */}
      {isPhotoModalOpen && (
        <PhotoScavengerModal
          mission={activeMission}
          onClose={() => setIsPhotoModalOpen(false)}
          onMissionCompleted={handleMissionCompleted}
        />
      )}

      {isStickerBookModalOpen && (
        <StickerBookModal
          onClose={() => setIsStickerBookModalOpen(false)}
          unlockedStickers={unlockedStickers}
        />
      )}
    </div>
  );
};

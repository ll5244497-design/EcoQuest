import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Radio, Compass, Footprints, Shield, Zap, Sparkles, Smartphone, ChevronRight, Headphones, Music } from 'lucide-react';
import { ambientAudioService } from '../services/ambientAudioService';
import { movementTrackingService, MovementTelemetry } from '../services/movementTrackingService';
import { hapticFeedback } from '../utils/haptics';

interface PocketModeHUDProps {
  onClose?: () => void;
  isFullScreen?: boolean;
}

export const PocketModeHUD: React.FC<PocketModeHUDProps> = ({
  onClose,
  isFullScreen = false,
}) => {
  const [isRadarPinging, setIsRadarPinging] = useState(false);
  const [hapticCount, setHapticCount] = useState(0);
  const [currentDistance, setCurrentDistance] = useState(128); // meters
  const [soundType, setSoundType] = useState<'cricket' | 'leaf_rustle' | 'stream'>('cricket');

  const [telemetry, setTelemetry] = useState<MovementTelemetry>(
    movementTrackingService.getTelemetry()
  );
  const [audioState, setAudioState] = useState(ambientAudioService.getState());

  useEffect(() => {
    const unsubMotion = movementTrackingService.subscribe((t) => setTelemetry(t));
    const unsubAudio = ambientAudioService.subscribe((a) => setAudioState(a));
    return () => {
      unsubMotion();
      unsubAudio();
    };
  }, []);

  // Trigger simulated tactile radar ping
  const triggerPing = () => {
    hapticFeedback.radarPulse();
    setIsRadarPinging(true);
    setHapticCount((prev) => prev + 1);
    setCurrentDistance((prev) => Math.max(8, prev - 12));
    setTimeout(() => {
      setIsRadarPinging(false);
    }, 1200);
  };

  const toggleAmbientSound = () => {
    hapticFeedback.tactileClick();
    ambientAudioService.togglePlay();
  };

  return (
    <div
      className={`relative w-full rounded-2xl bg-[#09090b] text-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden border border-white/10 select-none ${
        isFullScreen ? 'min-h-[520px]' : 'min-h-[460px]'
      }`}
    >
      {/* OLED Energy Saver Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-neutral-500 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${telemetry.state === 'MOVING' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
          <span className="text-white font-semibold">
            {telemetry.state === 'MOVING'
              ? `TRACKING: MOVING (${telemetry.speedMps} M/S · ${telemetry.distanceCoveredMeters}M)`
              : `TRACKING: AT REST (${telemetry.timeAtRestSeconds}s)`}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-bold bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-500/30">
          <Music className="w-3.5 h-3.5 animate-pulse" />
          <span>{audioState.isPlaying ? 'SOOTHING SOUNDSCAPE ACTIVE' : 'SOUNDSCAPE PAUSED'}</span>
        </div>
      </div>

      {/* Center Tactical Audio Radar Display */}
      <div className="my-auto py-8 text-center flex flex-col items-center">
        {/* Pulsing Radar Ring */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center my-4">
          {/* Concentric rings */}
          <div className="absolute inset-0 rounded-full border border-emerald-500/20" />
          <div className="absolute inset-4 rounded-full border border-emerald-500/30" />
          <div className="absolute inset-10 rounded-full border border-emerald-500/40" />

          {/* Radar Sweep Line */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className="w-full h-full animate-radar-sweep origin-center bg-gradient-to-tr from-transparent via-transparent to-emerald-500/25" />
          </div>

          {/* Interactive Ping Wave */}
          {isRadarPinging && (
            <div className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
          )}

          {/* Central Target Bearing Indicator */}
          <div className="relative z-10 flex flex-col items-center">
            <Compass className="w-8 h-8 text-emerald-400 animate-pulse mb-1" />
            <div className="text-3xl font-mono font-bold tracking-tight text-white">
              {currentDistance}m
            </div>
            <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest mt-0.5">
              BEARING 335° NW
            </div>
          </div>
        </div>

        {/* Spatial Stereo Panning Visualizer */}
        <div className="w-full max-w-sm mt-2">
          <div className="flex justify-between text-xs font-mono text-neutral-400 mb-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Volume2 className="w-3.5 h-3.5" />
              <span>LEFT EAR: 72%</span>
            </div>
            <span className="text-[10px] text-neutral-500">STEREO BIPAN</span>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span>RIGHT EAR: 28%</span>
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Visual Stereo Panning Wave */}
          <div className="relative w-full h-3 bg-neutral-900 rounded-full overflow-hidden border border-white/10">
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-neutral-600 z-10" />
            <div
              className="absolute top-0 bottom-0 bg-emerald-500 transition-all duration-300"
              style={{
                left: '25%',
                width: '35%',
              }}
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-neutral-500 mt-2">
            <span>Nature Audio: Gentle Mountain Breeze</span>
            <span>Target: Ancient Redwood Grove</span>
          </div>
        </div>
      </div>

      {/* Tactile Touch Targets for Pocket Blind Operation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/10">
        <button
          onClick={triggerPing}
          className="w-full py-4 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-black font-mono font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer"
        >
          <Radio className="w-5 h-5 shrink-0" />
          <span>PING RADAR</span>
        </button>

        {/* Soothing Soundscape Play/Pause */}
        <button
          onClick={toggleAmbientSound}
          className={`w-full py-4 px-4 font-mono font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 border cursor-pointer ${
            audioState.isPlaying
              ? 'bg-neutral-900 text-emerald-400 border-emerald-500/40 active:scale-[0.98]'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-500'
          }`}
        >
          <Music className="w-5 h-5 shrink-0" />
          <span>{audioState.isPlaying ? 'PAUSE AMBIENT AUDIO' : 'PLAY SOOTHING AUDIO'}</span>
        </button>

        <button
          onClick={() => {
            setSoundType((prev) =>
              prev === 'cricket' ? 'leaf_rustle' : prev === 'leaf_rustle' ? 'stream' : 'cricket'
            );
          }}
          className="w-full py-4 px-4 bg-neutral-900 hover:bg-neutral-800 border border-white/10 active:scale-[0.98] text-white font-mono text-xs rounded-xl transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2 text-left truncate">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="truncate">
              <div className="text-[10px] text-neutral-400 uppercase">BEACON CUE</div>
              <div className="font-semibold text-white capitalize truncate">{soundType.replace('_', ' ')}</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-500 shrink-0" />
        </button>
      </div>

      {/* Blind Haptic Feedback Notification */}
      {isRadarPinging && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-emerald-500 text-black px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider animate-bounce shadow-md">
          HAPTIC PULSE SENT (120ms) · RADAR RE-ACQUIRED
        </div>
      )}
    </div>
  );
};

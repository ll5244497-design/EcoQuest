import React, { useEffect, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Sliders,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Sparkles,
  ListMusic,
} from 'lucide-react';
import {
  ambientAudioService,
  SOUNDTRACK_PLAYLIST,
  SoundtrackTrack,
} from '../services/ambientAudioService';
import { hapticFeedback } from '../utils/haptics';

interface SoothingSoundtrackHUDProps {
  className?: string;
}

export const SoothingSoundtrackHUD: React.FC<SoothingSoundtrackHUDProps> = ({
  className = '',
}) => {
  const [audioState, setAudioState] = useState(ambientAudioService.getState());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsub = ambientAudioService.subscribe((s) => setAudioState(s));
    return () => unsub();
  }, []);

  const handleTogglePlay = () => {
    hapticFeedback.tactileClick();
    ambientAudioService.togglePlay();
  };

  const handleToggleMute = () => {
    hapticFeedback.tactileClick();
    ambientAudioService.toggleMute();
  };

  const handleNext = () => {
    hapticFeedback.tactileClick();
    ambientAudioService.nextTrack();
  };

  const handlePrev = () => {
    hapticFeedback.tactileClick();
    ambientAudioService.prevTrack();
  };

  const handleSelectTrack = (index: number) => {
    hapticFeedback.tactileClick();
    ambientAudioService.selectTrack(index);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    ambientAudioService.setVolume(vol);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Sleek Soundtrack Capsule */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-stone-900/95 text-stone-100 backdrop-blur-md px-2.5 sm:px-3 py-1.5 rounded-full border border-stone-700/60 shadow-lg text-xs font-mono">
        {/* Play/Pause Button */}
        <button
          onClick={handleTogglePlay}
          title={audioState.isPlaying ? 'Pause Music' : 'Play Music'}
          className="p-1 rounded-full bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 transition-colors cursor-pointer"
        >
          {audioState.isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>

        {/* Previous Track */}
        <button
          onClick={handlePrev}
          title="Previous Track"
          className="p-0.5 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer hidden xs:inline"
        >
          <SkipBack className="w-3 h-3" />
        </button>

        {/* Next Track */}
        <button
          onClick={handleNext}
          title="Next Track"
          className="p-0.5 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer hidden xs:inline"
        >
          <SkipForward className="w-3 h-3" />
        </button>

        {/* Live Audio Waves */}
        <div className="flex items-center gap-0.5 h-3.5 px-0.5">
          {[40, 75, 100, 60, 30].map((h, i) => (
            <span
              key={i}
              className={`w-0.5 rounded-full transition-all duration-300 ${
                audioState.isPlaying && !audioState.isMuted
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-stone-600 h-1'
              }`}
              style={{
                height:
                  audioState.isPlaying && !audioState.isMuted
                    ? `${Math.max(4, (h * audioState.volume) / 6)}px`
                    : '3px',
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </div>

        {/* Current Track Info */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="cursor-pointer flex items-center gap-1.5 hover:text-emerald-300 transition-colors"
          title="Click to view playlist"
        >
          <span className="text-[11px] font-bold text-stone-200 max-w-[110px] sm:max-w-[140px] truncate">
            {audioState.currentTrack.title}
          </span>
          <span className="text-[10px] text-stone-400 hidden md:inline">
            ({audioState.currentTrack.mood})
          </span>
        </div>

        {/* Mute Toggle */}
        <button
          onClick={handleToggleMute}
          title={audioState.isMuted ? 'Unmute' : 'Mute'}
          className="p-1 hover:text-emerald-300 text-stone-400 transition-colors cursor-pointer"
        >
          {audioState.isMuted || audioState.volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-stone-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
        </button>

        {/* Open Playlist / Drawer */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          title="Soundtrack Playlist"
          className={`p-1 rounded transition-colors cursor-pointer ${
            isOpen ? 'text-emerald-300 bg-stone-800' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <ListMusic className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded Playlist & Volume Modal Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-3.5 bg-stone-900/95 backdrop-blur-md rounded-2xl border border-stone-700/80 shadow-2xl text-stone-100 text-xs font-mono z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-800 text-[10px] text-stone-400 font-bold uppercase tracking-wider">
            <span>GAME SOUNDTRACK PLAYLIST</span>
            <span className="text-emerald-400 font-bold">● High Fidelity</span>
          </div>

          {/* Track Selection List */}
          <div className="space-y-1.5 mb-3">
            {SOUNDTRACK_PLAYLIST.map((track, idx) => {
              const isCurrent = audioState.currentTrackIndex === idx;
              return (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(idx)}
                  className={`w-full p-2 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs'
                      : 'bg-stone-800/80 hover:bg-stone-800 text-stone-300 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-[11px] flex items-center gap-1.5">
                      {isCurrent && audioState.isPlaying && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      )}
                      <span>{track.title}</span>
                    </div>
                    <div className="text-[10px] text-stone-400 truncate">{track.artist}</div>
                  </div>
                  <span className="text-[10px] text-stone-500 shrink-0 font-semibold">
                    {track.mood.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Volume Control */}
          <div className="space-y-1.5 pt-2 border-t border-stone-800">
            <div className="flex justify-between text-[11px] text-stone-300 font-semibold">
              <span>Master Music Volume</span>
              <span className="text-emerald-400">{Math.round(audioState.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={audioState.volume}
              onChange={handleVolumeChange}
              className="w-full h-1.5 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

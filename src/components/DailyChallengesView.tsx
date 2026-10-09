import React from 'react';
import {
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Award,
  ArrowRight,
  Flame,
  Calendar,
  Compass,
  Footprints
} from 'lucide-react';
import { DailyNatureChallenge } from '../services/geminiMissionService';
import { hapticFeedback } from '../utils/haptics';

interface DailyChallengesViewProps {
  challenges: DailyNatureChallenge[];
  onToggleChallenge: (challengeId: string) => void;
  onRefreshChallenges: () => void;
  isRefreshing: boolean;
  onStartMission: () => void;
  selectedBiome: string;
  totalXp: number;
}

export const DailyChallengesView: React.FC<DailyChallengesViewProps> = ({
  challenges,
  onToggleChallenge,
  onRefreshChallenges,
  isRefreshing,
  onStartMission,
  selectedBiome,
  totalXp,
}) => {
  const completedCount = challenges.filter((c) => c.completed).length;
  const allCompleted = completedCount === challenges.length && challenges.length > 0;

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 select-none">
      {/* Editorial Header (Matching 1st Page Style) */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-300/70 border border-stone-400/50 rounded-xl text-xs font-mono text-stone-700 font-semibold mb-1">
          <Calendar className="w-3.5 h-3.5 text-emerald-800" />
          <span>EXPEDITION LOG · DAILY PROTOCOLS</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-stone-900 tracking-tight">
          Daily Nature Challenges
        </h1>
        <p className="text-xs sm:text-sm font-mono text-stone-600 max-w-lg mx-auto">
          Tactile real-world sensory prompts to explore outdoors. Complete them to earn bonus XP and boost your scout rank.
        </p>
      </div>

      {/* Progress & Stat Dock (Tactile 3D Box Model) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
        <div className="p-4 rounded-2xl bg-stone-200/90 border-t border-white/80 border-b-2 border-stone-400 shadow-[0_3px_0_0_#a8a29e] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-stone-500 uppercase font-semibold">Today's Progress</div>
            <div className="text-xl font-display font-extrabold text-stone-900 mt-0.5">
              {completedCount} of {challenges.length} Done
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-900 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm shadow-inner">
            {Math.round((completedCount / (challenges.length || 1)) * 100)}%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-200/90 border-t border-white/80 border-b-2 border-stone-400 shadow-[0_3px_0_0_#a8a29e] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-stone-500 uppercase font-semibold">Daily Streak</div>
            <div className="text-xl font-display font-extrabold text-stone-900 mt-0.5 flex items-center gap-1.5">
              <span>5 Days</span>
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-mono font-bold text-sm border border-amber-600/30">
            🔥
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-200/90 border-t border-white/80 border-b-2 border-stone-400 shadow-[0_3px_0_0_#a8a29e] flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-stone-500 uppercase font-semibold">Scout Telemetry</div>
            <div className="text-xl font-display font-extrabold text-stone-900 mt-0.5">
              {totalXp} XP Total
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-800 flex items-center justify-center font-mono font-bold text-sm border border-emerald-600/30">
            🌿
          </div>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-3xl mx-auto pt-1">
        <div className="text-xs font-mono text-stone-600 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Synced with Biome: <strong>{selectedBiome}</strong></span>
        </div>

        <button
          onClick={onRefreshChallenges}
          disabled={isRefreshing}
          className="relative px-4 py-2 bg-stone-200/90 hover:bg-stone-300 text-stone-800 font-mono text-xs font-bold rounded-xl border-t border-white/60 shadow-[0_3px_0_0_#a8a29e] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-stone-700 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Summoning Gemini...' : 'Re-roll 3 Challenges (Gemini AI)'}</span>
        </button>
      </div>

      {/* 3 Physical 3D Challenge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {challenges.map((c) => {
          const isDone = !!c.completed;
          return (
            <div
              key={c.id}
              className={`relative rounded-3xl p-6 transition-all duration-200 flex flex-col justify-between gap-5 border select-none ${
                isDone
                  ? 'bg-stone-900 text-stone-100 border-stone-800 shadow-[0_8px_24px_rgba(0,0,0,0.25)]'
                  : 'bg-stone-100/95 text-stone-900 border-stone-300/80 shadow-[0_6px_0_0_#d6d3d1]'
              }`}
            >
              {/* Card Top: Category Icon & Reward */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{c.icon || '🍃'}</span>
                  <span className={`text-[11px] font-mono uppercase font-bold tracking-wider ${isDone ? 'text-emerald-400' : 'text-stone-600'}`}>
                    {c.category}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg ${
                    isDone
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-stone-200 text-stone-800'
                  }`}>
                    +{c.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-2">
                <h3 className={`font-display font-extrabold text-lg tracking-tight ${
                  isDone ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-stone-900'
                }`}>
                  {c.title}
                </h3>
                <p className={`text-xs font-mono leading-relaxed ${
                  isDone ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  {c.description}
                </p>
              </div>

              {/* Tactile 3D Physical Actuator Button */}
              <button
                onClick={() => onToggleChallenge(c.id)}
                className={`relative w-full py-3.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all select-none cursor-pointer flex items-center justify-center gap-2 ${
                  isDone
                    ? 'bg-emerald-500 text-stone-950 border-t border-emerald-200 shadow-[0_2px_0_0_#064e3b] active:translate-y-0.5'
                    : 'bg-stone-900 hover:bg-stone-800 text-stone-50 border-t border-stone-600 shadow-[0_4px_0_0_#0c0a09] active:shadow-[0_1px_0_0_#0c0a09] active:translate-y-1'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-stone-950' : 'text-stone-400'}`} />
                <span>{isDone ? 'OBJECTIVE LOGGED' : 'MARK COMPLETED'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA to Return / Jump into Expedition */}
      <div className="max-w-md mx-auto pt-4">
        <button
          onClick={onStartMission}
          className="relative w-full py-4 px-6 bg-stone-900 hover:bg-stone-800 text-stone-50 font-display font-bold text-sm sm:text-base rounded-2xl transition-all border-t border-stone-600/50 shadow-[0_5px_0_0_#0c0a09] active:shadow-[0_1px_0_0_#0c0a09] active:translate-y-1 flex items-center justify-center gap-3 cursor-pointer group"
        >
          <Compass className="w-5 h-5 text-emerald-400 group-hover:rotate-45 transition-transform" />
          <span>RETURN TO ACTIVE EXPEDITION</span>
          <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform ml-auto" />
        </button>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Sparkles, Shield, Zap, Activity, Info, ChevronRight, Check } from 'lucide-react';

interface BioCard {
  id: string;
  name: string;
  scientific: string;
  rarity: 'Common' | 'Rare' | 'Mythic' | 'Legendary';
  biome: string;
  level: number;
  stepsRequired: number;
  stats: {
    resonance: number;
    canopyAffinity: number;
    audioRadius: number; // meters
  };
  ability: string;
  flavor: string;
  color: string;
  glowColor: string;
}

const CARDS: BioCard[] = [
  {
    id: 'card-1',
    name: 'Verdant Moss Fox',
    scientific: 'Vulpes muscus',
    rarity: 'Mythic',
    biome: 'Ancient Undergrowth',
    level: 4,
    stepsRequired: 8400,
    stats: {
      resonance: 88,
      canopyAffinity: 94,
      audioRadius: 180,
    },
    ability: 'Spore Scent — Amplifies audio cues toward hidden fungal colonies within 200m.',
    flavor: 'Found only near century-old oak roots where dew never evaporates completely.',
    color: 'from-emerald-900 to-stone-900',
    glowColor: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'card-2',
    name: 'Aura Canopy Monarch',
    scientific: 'Danaus phosphor',
    rarity: 'Rare',
    biome: 'Solar Meadow',
    level: 2,
    stepsRequired: 4200,
    stats: {
      resonance: 72,
      canopyAffinity: 86,
      audioRadius: 120,
    },
    ability: 'Sun Flutter — Warns user of rain showers and guides toward warm sunlit glades.',
    flavor: 'Wings scatter micro-reflections that guide pollinators through dense forest shade.',
    color: 'from-amber-950 to-stone-900',
    glowColor: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'card-3',
    name: 'Whispering Lichen Sprite',
    scientific: 'Cladonia cantus',
    rarity: 'Legendary',
    biome: 'Alpine Basalt Peak',
    level: 6,
    stepsRequired: 14500,
    stats: {
      resonance: 98,
      canopyAffinity: 65,
      audioRadius: 320,
    },
    ability: 'Stone Echo — Web Audio radar pulses bounce off rock faces with binaural reverbs.',
    flavor: 'Grows millimeter by millimeter over centuries on windswept granite crags.',
    color: 'from-cyan-950 to-stone-900',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'card-4',
    name: 'Silver Willow Dryad',
    scientific: 'Salix argentum',
    rarity: 'Rare',
    biome: 'Riparian Marshland',
    level: 3,
    stepsRequired: 6100,
    stats: {
      resonance: 81,
      canopyAffinity: 91,
      audioRadius: 150,
    },
    ability: 'Stream Whisper — Converts running water sounds into harmonic guidance tones.',
    flavor: 'Roots stabilize wetlands and signal safe river crossing points to hikers.',
    color: 'from-teal-950 to-stone-900',
    glowColor: 'rgba(20, 184, 166, 0.4)',
  },
];

interface BioCardsDeckProps {
  onStartMission?: () => void;
}

export const BioCardsDeck: React.FC<BioCardsDeckProps> = ({ onStartMission }) => {
  const [selectedCardId, setSelectedCardId] = useState<string>('card-1');
  const [activeCompanionId, setActiveCompanionId] = useState<string>('card-1');

  const activeCard = CARDS.find((c) => c.id === selectedCardId) || CARDS[0];

  return (
    <div className="w-full">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {CARDS.map((card) => {
          const isSelected = card.id === selectedCardId;
          const isCompanion = card.id === activeCompanionId;

          return (
            <div
              key={card.id}
              onClick={() => setSelectedCardId(card.id)}
              className={`group relative rounded-xl p-5 cursor-pointer transition-all duration-300 border ${
                isSelected
                  ? 'border-emerald-600 bg-stone-900 text-stone-100 shadow-md scale-[1.02]'
                  : 'border-stone-800/10 bg-[#ebeae5]/90 hover:bg-[#ebeae5] text-stone-900 hover:border-stone-400'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-[10px] font-mono tracking-wider uppercase text-emerald-600 font-semibold">
                    {card.rarity} · LVL {card.level}
                  </div>
                  <h4 className="text-base font-display font-bold mt-0.5 truncate">
                    {card.name}
                  </h4>
                  <p className="text-[11px] italic opacity-60 font-serif">
                    {card.scientific}
                  </p>
                </div>
                {isCompanion && (
                  <span className="flex items-center gap-1 text-[9px] font-mono bg-emerald-600 text-stone-950 px-2 py-0.5 rounded font-bold">
                    <Check className="w-3 h-3" />
                    EQUIPPED
                  </span>
                )}
              </div>

              {/* Holographic Specimen Emblem */}
              <div
                className={`relative w-full aspect-4/3 rounded-lg flex items-center justify-center overflow-hidden mb-4 bg-gradient-to-br ${card.color} border border-white/10`}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                  style={{
                    boxShadow: `0 0 30px ${card.glowColor}`,
                    background: card.glowColor,
                  }}
                >
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] font-mono text-stone-300">
                  {card.biome}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="opacity-60">Audio Radius</span>
                  <span className="font-semibold">{card.stats.audioRadius}m</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Resonance</span>
                  <span className="font-semibold">{card.stats.resonance}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Card Spec & Companion Sync Drawer */}
      <div className="p-6 rounded-2xl bg-stone-900 text-stone-100 border border-stone-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
              <span>ACTIVE SPECIMEN INSPECTOR</span>
              <span>·</span>
              <span>{activeCard.biome}</span>
            </div>
            <h3 className="text-2xl font-display font-bold text-white mt-1">
              {activeCard.name} <span className="text-sm font-normal text-stone-400 font-serif italic">({activeCard.scientific})</span>
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveCompanionId(activeCard.id)}
              className={`px-5 py-2.5 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                activeCompanionId === activeCard.id
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-stone-950 shadow-sm'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{activeCompanionId === activeCard.id ? 'ACTIVE 3D COMPANION' : 'SET AS 3D PET COMPANION'}</span>
            </button>

            {onStartMission && (
              <button
                onClick={onStartMission}
                className="px-5 py-2.5 rounded-lg text-xs font-mono font-semibold bg-stone-100 hover:bg-white text-stone-900 transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <span>LAUNCH EXPEDITION</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5">
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-stone-400">Ecosystem Ability</div>
            <p className="text-sm text-stone-200 leading-relaxed">
              {activeCard.ability}
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-mono uppercase text-stone-400">Field Naturalist Notes</div>
            <p className="text-sm text-stone-300 italic font-serif leading-relaxed">
              "{activeCard.flavor}"
            </p>
          </div>

          <div className="space-y-3 bg-stone-950/60 p-4 rounded-xl border border-stone-800">
            <div className="text-xs font-mono uppercase text-stone-400">Companion Growth Specs</div>
            <div className="space-y-2 text-xs font-mono">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-stone-400">Canopy Affinity</span>
                  <span className="text-emerald-400">{activeCard.stats.canopyAffinity}%</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${activeCard.stats.canopyAffinity}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-stone-400">Steps to Next Evolution</span>
                  <span className="text-white">6,420 / {activeCard.stepsRequired}</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${(6420 / activeCard.stepsRequired) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

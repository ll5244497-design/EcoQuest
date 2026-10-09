import React, { useState } from 'react';
import { BookOpen, Sparkles, Star, Trophy, X, Calendar, MapPin, Search, Tag, Eye } from 'lucide-react';
import { StickerReward } from '../services/geminiMissionService';

export interface StickerEntry {
  id: string;
  name: string;
  badgeEmoji: string;
  rarity: 'Common' | 'Rare' | 'Mythic' | 'Legendary';
  category: 'craft' | 'flora' | 'fauna' | 'relic';
  biome: string;
  dateUnlocked: string;
  lore: string;
  ingredients?: string[];
  photoUrl?: string;
  xpEarned: number;
}

interface StickerBookModalProps {
  onClose: () => void;
  unlockedStickers: StickerEntry[];
}

export const StickerBookModal: React.FC<StickerBookModalProps> = ({
  onClose,
  unlockedStickers = [],
}) => {
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(
    unlockedStickers[0]?.id || 'stk-dragon'
  );
  const [filterCategory, setFilterCategory] = useState<'all' | 'craft' | 'flora' | 'fauna'>('all');

  // Default rich sticker encyclopedia list
  const allStickerCatalog: StickerEntry[] = [
    {
      id: 'stk-dragon',
      name: 'Verdant Leaf Dragon',
      badgeEmoji: '🐉',
      rarity: 'Mythic',
      category: 'craft',
      biome: 'Oak & Redwood Woodland',
      dateUnlocked: 'Today',
      lore: 'Crafted from two broad leaves, a curved twig spine, and two smooth stone eyes. Said to ward off damp forest chills.',
      ingredients: ['2x Fallen Broad Leaves', '1x Dry Twig', '2x River Pebbles'],
      photoUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%232b261f"/><circle cx="200" cy="150" r="100" fill="%233a3228"/><path d="M120,160 Q200,100 280,160" stroke="%235c4033" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="150" cy="120" rx="45" ry="22" fill="%23166534" transform="rotate(-25 150 120)"/><ellipse cx="250" cy="120" rx="45" ry="22" fill="%2315803d" transform="rotate(25 250 120)"/><circle cx="265" cy="140" r="8" fill="%2378716c"/><circle cx="280" cy="140" r="8" fill="%23a8a29e"/><text x="200" y="260" font-family="monospace" font-size="12" fill="%23a7f3d0" text-anchor="middle">AUTHENTIC NATURE DRAGON CRAFT</text></svg>',
      xpEarned: 350,
    },
    {
      id: 'stk-turtle',
      name: 'Moss Pebble Turtle',
      badgeEmoji: '🐢',
      rarity: 'Rare',
      category: 'craft',
      biome: 'Riparian Creekbed',
      dateUnlocked: 'Yesterday',
      lore: 'Sculpted from river stones and fern tufts. Ancient creek turtles that absorb cool mountain water currents.',
      ingredients: ['1x Flat Palm Stone', '4x Small Pebbles', '1x Moss Frond'],
      photoUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231f2937"/><ellipse cx="200" cy="150" rx="70" ry="50" fill="%234b5563"/><ellipse cx="200" cy="150" rx="55" ry="38" fill="%2315803d"/><circle cx="270" cy="150" r="14" fill="%236b7280"/><circle cx="150" cy="115" r="10" fill="%239ca3af"/><circle cx="250" cy="115" r="10" fill="%239ca3af"/><circle cx="150" cy="185" r="10" fill="%239ca3af"/><circle cx="250" cy="185" r="10" fill="%239ca3af"/><text x="200" y="260" font-family="monospace" font-size="12" fill="%2386efac" text-anchor="middle">PEBBLE MOSS TURTLE CRAFT</text></svg>',
      xpEarned: 300,
    },
    {
      id: 'stk-owl',
      name: 'Pinecone Sentry Owl',
      badgeEmoji: '🦉',
      rarity: 'Rare',
      category: 'craft',
      biome: 'Alpine Conifer Ridge',
      dateUnlocked: 'Unlocked Level 2',
      lore: 'A silent sentry built from pinecones and acorn caps to watch over explorers trekking high elevation trails.',
      ingredients: ['1x Pinecone', '2x Acorn Caps', '2x Small Leaves'],
      xpEarned: 280,
    },
    {
      id: 'stk-mandala',
      name: 'Solar Sunburst Mandala',
      badgeEmoji: '☀️',
      rarity: 'Legendary',
      category: 'craft',
      biome: 'Golden Meadow',
      dateUnlocked: 'Unlocked Level 3',
      lore: 'Sacred geometry radiating pine needles and golden wildflower petals honoring the sun azimuth.',
      ingredients: ['8x Pine Needles', '1x Acorn Core', '4x Yellow Petals'],
      xpEarned: 400,
    },
    {
      id: 'stk-redwood',
      name: 'Ancient Sequoia Sentinel',
      badgeEmoji: '🌲',
      rarity: 'Legendary',
      category: 'flora',
      biome: 'Redwood Sanctuary',
      dateUnlocked: 'GPS Encounter',
      lore: 'A 600-year-old coastal giant with deep acoustic root resonance.',
      xpEarned: 500,
    },
    {
      id: 'stk-fox',
      name: 'Verdant Moss Fox',
      badgeEmoji: '🦊',
      rarity: 'Mythic',
      category: 'fauna',
      biome: 'Ancient Undergrowth',
      dateUnlocked: 'GPS Encounter',
      lore: 'A mystical spirit covered in velvet ferns; leaves behind trail markers for scouts.',
      xpEarned: 450,
    },
  ];

  // Merge user's newly unlocked entries with catalog
  const catalog = allStickerCatalog.map((item) => {
    const userMatch = unlockedStickers.find((u) => u.id === item.id || u.name === item.name);
    if (userMatch) {
      return { ...item, ...userMatch, dateUnlocked: 'Just Now!' };
    }
    return item;
  });

  const filtered = catalog.filter((s) => {
    if (filterCategory === 'all') return true;
    return s.category === filterCategory;
  });

  const activeSticker = catalog.find((s) => s.id === selectedStickerId) || catalog[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-hidden rounded-3xl bg-[#f5f3ec] border border-stone-800/20 shadow-2xl flex flex-col text-stone-900">
        {/* Top Album Header */}
        <div className="px-6 py-4 bg-[#ece8de] border-b border-stone-300 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-800 text-white rounded-xl shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-display font-extrabold text-stone-900 leading-tight">
                Field Naturalist Sticker Book & Encyclopedia
              </h2>
              <p className="text-xs font-mono text-stone-600">
                Your scrapbook of outdoor scavenger crafts, photograph records, and nature discoveries.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-stone-200/80 px-3 py-1.5 rounded-xl text-stone-700">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span>{catalog.length} Collectibles Discovered</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-stone-300 hover:bg-stone-400 text-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs Ribbon */}
        <div className="px-6 py-2.5 bg-[#f0ece1] border-b border-stone-300/80 flex items-center gap-2 text-xs font-mono">
          <span className="text-stone-500 uppercase">Filter:</span>
          {(['all', 'craft', 'flora', 'fauna'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                filterCategory === cat
                  ? 'bg-stone-900 text-stone-50 font-bold'
                  : 'bg-stone-200/80 hover:bg-stone-300 text-stone-700'
              }`}
            >
              {cat === 'all' ? 'All Stickers' : `${cat}s`}
            </button>
          ))}
        </div>

        {/* Main Content: Sticker Album Grid on Left + Detailed Polaroid Inspector on Right */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#fbf9f4]">
          {/* Sticker Grid (Scrapbook Page) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3.5 auto-rows-max">
            {filtered.map((stk) => {
              const isSelected = stk.id === selectedStickerId;
              return (
                <div
                  key={stk.id}
                  onClick={() => setSelectedStickerId(stk.id)}
                  className={`group relative p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col items-center text-center shadow-xs ${
                    isSelected
                      ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/30 scale-102 shadow-md'
                      : 'bg-white/80 hover:bg-white border-stone-300 hover:border-stone-400'
                  }`}
                >
                  {/* Adhesive tape graphic at top */}
                  <div className="w-8 h-2 bg-amber-200/60 rounded-xs mb-1 -mt-1 shadow-2xs transform -rotate-2" />

                  {/* Sticker Badge Core */}
                  <div className="w-14 h-14 rounded-full bg-emerald-900/10 border border-emerald-600/30 flex items-center justify-center my-1 group-hover:scale-110 transition-transform">
                    <span className="text-3xl filter drop-shadow-sm">{stk.badgeEmoji}</span>
                  </div>

                  <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold mt-1">
                    {stk.rarity}
                  </div>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1 mt-0.5">
                    {stk.name}
                  </h4>
                  <span className="text-[10px] font-mono text-stone-500">{stk.dateUnlocked}</span>
                </div>
              );
            })}
          </div>

          {/* Detailed Inspector & User Polaroid View */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-300 shadow-sm flex flex-col justify-between">
            <div>
              {/* Polaroid Photo Frame */}
              <div className="bg-stone-100 p-3 rounded-xl border border-stone-300 shadow-inner mb-4">
                <div className="aspect-4/3 rounded-lg overflow-hidden bg-stone-900 flex items-center justify-center border border-stone-200 relative">
                  {activeSticker.photoUrl ? (
                    <img
                      src={activeSticker.photoUrl}
                      alt={activeSticker.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-stone-400 text-xs font-mono">
                      <span className="text-5xl mb-2">{activeSticker.badgeEmoji}</span>
                      <span>Field Botanical Stamp</span>
                    </div>
                  )}

                  {/* Foil Rarity Badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-stone-900/80 backdrop-blur-sm text-amber-300 text-[10px] font-mono font-bold rounded">
                    {activeSticker.rarity} SEAL
                  </div>
                </div>

                <div className="text-center pt-2">
                  <div className="text-xs font-display font-bold text-stone-800">
                    "{activeSticker.name}"
                  </div>
                  <div className="text-[10px] font-mono text-stone-500">
                    Logged in {activeSticker.biome}
                  </div>
                </div>
              </div>

              {/* Naturalist Lore & Ingredients */}
              <div className="space-y-3 text-xs font-mono">
                <div>
                  <span className="text-stone-500 uppercase block mb-0.5">Field Naturalist Lore:</span>
                  <p className="text-stone-800 font-serif italic text-sm leading-relaxed">
                    "{activeSticker.lore}"
                  </p>
                </div>

                {activeSticker.ingredients && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                    <span className="text-[10px] text-stone-500 uppercase block mb-1 font-bold">
                      Organic Materials Used in Craft:
                    </span>
                    <ul className="list-disc list-inside text-[11px] text-stone-700 space-y-0.5">
                      {activeSticker.ingredients.map((ing, i) => (
                        <li key={i}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex items-center justify-between text-xs font-mono text-stone-600">
              <span className="text-emerald-700 font-bold">+{activeSticker.xpEarned} Explorer XP</span>
              <span>Encylopedia Verified ✔</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

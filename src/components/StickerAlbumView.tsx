import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Trophy,
  Compass,
  ArrowRight,
  Camera,
  Calendar,
  Tag,
  Star,
  CheckCircle2,
  X
} from 'lucide-react';
import { StickerEntry } from './StickerBookModal';
import { hapticFeedback } from '../utils/haptics';

interface StickerAlbumViewProps {
  unlockedStickers: StickerEntry[];
  onStartMission: () => void;
}

export const StickerAlbumView: React.FC<StickerAlbumViewProps> = ({
  unlockedStickers = [],
  onStartMission,
}) => {
  const [filterCategory, setFilterCategory] = useState<'all' | 'craft' | 'flora' | 'fauna'>('all');
  const [selectedSticker, setSelectedSticker] = useState<StickerEntry | null>(
    unlockedStickers[0] || null
  );

  // Default fallback catalog if few unlocked
  const defaultCatalog: StickerEntry[] = [
    {
      id: 'stk-dragon',
      name: 'Verdant Leaf Dragon',
      badgeEmoji: '🐉',
      rarity: 'Mythic',
      category: 'craft',
      biome: 'Oak & Redwood Forest',
      dateUnlocked: 'Today',
      lore: 'Crafted on the earth from two broad fallen leaves, a curved twig spine, and smooth river pebbles. A guardian of the forest floor.',
      ingredients: ['2x Fallen Leaves (Wings)', '1x Curved Twig (Spine)', '2x River Pebbles (Eyes)'],
      xpEarned: 350,
      photoUrl:
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%232b261f"/><circle cx="200" cy="150" r="100" fill="%233a3228"/><path d="M120,160 Q200,100 280,160" stroke="%235c4033" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="150" cy="120" rx="45" ry="22" fill="%23166534" transform="rotate(-25 150 120)"/><ellipse cx="250" cy="120" rx="45" ry="22" fill="%2315803d" transform="rotate(25 250 120)"/><circle cx="265" cy="140" r="8" fill="%2378716c"/><circle cx="280" cy="140" r="8" fill="%23a8a29e"/><text x="200" y="260" font-family="monospace" font-size="12" fill="%23a7f3d0" text-anchor="middle">LEAF DRAGON NATURE CRAFT</text></svg>',
    },
    {
      id: 'stk-turtle',
      name: 'Moss Pebble Turtle',
      badgeEmoji: '🐢',
      rarity: 'Rare',
      category: 'craft',
      biome: 'Riparian Creek',
      dateUnlocked: 'Yesterday',
      lore: 'Sculpted from river stones and damp moss. Creek turtles said to absorb fresh mountain streams.',
      ingredients: ['1x Flat Palm Stone', '4x Small Pebbles', '1x Moss Frond'],
      xpEarned: 300,
    },
    {
      id: 'stk-owl',
      name: 'Pinecone Sentry Owl',
      badgeEmoji: '🦉',
      rarity: 'Rare',
      category: 'craft',
      biome: 'Alpine Ridge',
      dateUnlocked: 'Stage 2 Complete',
      lore: 'A silent sentry built from pinecones and acorn caps to watch over highland trails.',
      ingredients: ['1x Pinecone', '2x Acorn Caps', '2x Small Leaves'],
      xpEarned: 280,
    },
    {
      id: 'stk-mandala',
      name: 'Sunburst Flora Mandala',
      badgeEmoji: '☀️',
      rarity: 'Legendary',
      category: 'craft',
      biome: 'Wildflower Meadow',
      dateUnlocked: 'Stage 3 Complete',
      lore: 'Sacred radial geometry radiating pine needles and golden wildflower petals.',
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
      dateUnlocked: 'Locality Encounter',
      lore: 'A 600-year-old coastal giant with deep acoustic root resonance.',
      xpEarned: 500,
    },
  ];

  // Merge unlocked with catalog without duplicates
  const stickerMap = new Map<string, StickerEntry>();
  defaultCatalog.forEach((s) => stickerMap.set(s.id, s));
  unlockedStickers.forEach((s) => stickerMap.set(s.id, s));
  const stickers = Array.from(stickerMap.values());

  const filtered = stickers.filter((s) => {
    if (filterCategory === 'all') return true;
    return s.category === filterCategory;
  });

  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 select-none">
      {/* Editorial Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-stone-300/70 border border-stone-400/50 rounded-xl text-xs font-mono text-stone-700 font-semibold mb-1">
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>FIELD CODEX · BIO-STICKER ALBUM</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-stone-900 tracking-tight">
          My Field Stickers
        </h1>
        <p className="text-xs sm:text-sm font-mono text-stone-600 max-w-lg mx-auto">
          Badges and crafts gathered during outdoor expeditions. Each sticker archives an organic artifact crafted on the soil.
        </p>
      </div>

      {/* Filter Tabs (3D Tactile Segmented Control) */}
      <div className="flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto">
        <div className="inline-flex p-1 bg-stone-300/80 rounded-xl border border-stone-400/50 text-xs font-mono">
          {(['all', 'craft', 'flora', 'fauna'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => {
                hapticFeedback.tactileClick();
                setFilterCategory(cat);
              }}
              className={`px-4 py-2 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                filterCategory === cat
                  ? 'bg-stone-900 text-stone-50 shadow-[0_2px_0_0_#0c0a09]'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              {cat === 'all' ? 'All Stickers' : cat}
            </button>
          ))}
        </div>

        <div className="text-xs font-mono text-stone-600">
          Collected: <strong className="text-stone-900">{stickers.length} Artifacts</strong>
        </div>
      </div>

      {/* Sticker Album Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {filtered.map((sticker) => {
          const isSelected = selectedSticker?.id === sticker.id;
          return (
            <div
              key={sticker.id}
              onClick={() => {
                hapticFeedback.tactileClick();
                setSelectedSticker(sticker);
              }}
              className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-center ${
                isSelected
                  ? 'bg-stone-900 text-stone-50 border-stone-700 shadow-[0_6px_0_0_#0c0a09] scale-[1.02]'
                  : 'bg-stone-100/90 hover:bg-stone-200/90 text-stone-900 border-stone-300/90 shadow-[0_4px_0_0_#d6d3d1]'
              }`}
            >
              {/* Badge Icon Display */}
              <div className="relative w-20 h-20 mx-auto rounded-2xl bg-stone-200/80 border border-stone-300/80 flex items-center justify-center text-4xl shadow-inner group">
                <span>{sticker.badgeEmoji}</span>
                <span className={`absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                  sticker.rarity === 'Legendary'
                    ? 'bg-amber-400 text-stone-950'
                    : sticker.rarity === 'Mythic'
                    ? 'bg-purple-400 text-stone-950'
                    : 'bg-emerald-400 text-stone-950'
                }`}>
                  {sticker.rarity}
                </span>
              </div>

              {/* Title & XP */}
              <div>
                <h4 className="font-display font-bold text-sm tracking-tight truncate">
                  {sticker.name}
                </h4>
                <div className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-stone-400' : 'text-stone-500'}`}>
                  +{sticker.xpEarned} XP · {sticker.category.toUpperCase()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sticker Detail Drawer / Inspector */}
      {selectedSticker && (
        <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-stone-900 text-stone-50 border border-stone-800 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-stone-800">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{selectedSticker.badgeEmoji}</span>
              <div>
                <h3 className="font-display font-extrabold text-xl sm:text-2xl text-white">
                  {selectedSticker.name}
                </h3>
                <div className="text-xs font-mono text-stone-400 flex items-center gap-2 mt-0.5">
                  <span className="text-emerald-400 font-bold uppercase">{selectedSticker.rarity}</span>
                  <span>·</span>
                  <span>{selectedSticker.biome}</span>
                  <span>·</span>
                  <span>{selectedSticker.dateUnlocked}</span>
                </div>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-stone-800 font-mono text-xs text-emerald-400 font-bold border border-stone-700">
              +{selectedSticker.xpEarned} XP
            </div>
          </div>

          <p className="text-xs sm:text-sm font-mono text-stone-300 leading-relaxed italic">
            "{selectedSticker.lore}"
          </p>

          {/* Crafted Ingredients */}
          {selectedSticker.ingredients && selectedSticker.ingredients.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-stone-400 uppercase font-semibold">
                Gathered Soil Ingredients:
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSticker.ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-stone-950 text-stone-300 text-xs font-mono border border-stone-800"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Photo Preview if crafted */}
          {selectedSticker.photoUrl && (
            <div className="rounded-xl overflow-hidden border border-stone-800 max-h-48 flex items-center justify-center bg-stone-950">
              <img
                src={selectedSticker.photoUrl}
                alt={selectedSticker.name}
                className="w-full h-full object-cover max-h-48"
              />
            </div>
          )}
        </div>
      )}

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

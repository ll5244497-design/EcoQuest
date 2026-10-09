import React from 'react';
import { Compass, Smartphone, MapPin } from 'lucide-react';
import { SoothingSoundtrackHUD } from './SoothingSoundtrackHUD';

interface NavbarHUDProps {
  onOpenMap: () => void;
  onOpenPocketMode: () => void;
  activeSection: number;
}

export const NavbarHUD: React.FC<NavbarHUDProps> = ({
  onOpenMap,
  onOpenPocketMode,
  activeSection,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-12 py-3 sm:py-4 bg-[#ebeae5]/80 backdrop-blur-md border-b border-stone-800/10">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#hero"
        className="text-base sm:text-lg font-display font-extrabold tracking-tight text-stone-900 flex items-center gap-2"
      >
        <span>ECOQUEST AI</span>
      </a>

      {/* Zone 2: 4-5 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-stone-600">
        <a
          href="#map-section"
          className="hover:text-stone-900 transition-colors"
        >
          01. TRANSPARENT MAP HUD
        </a>
        <a
          href="#pocket-section"
          className="hover:text-stone-900 transition-colors"
        >
          02. POCKET MODE
        </a>
        <a
          href="#bio-deck-section"
          className="hover:text-stone-900 transition-colors"
        >
          03. ECOSYSTEM PET & CARDS
        </a>
        <a
          href="#architecture-section"
          className="hover:text-stone-900 transition-colors"
        >
          04. SYSTEM BLUEPRINT
        </a>
      </nav>

      {/* Zone 3: Soothing Audio HUD + primary actions */}
      <div className="flex items-center gap-2">
        <SoothingSoundtrackHUD />

        <button
          onClick={onOpenPocketMode}
          className="hidden sm:flex px-3 py-1.5 text-xs font-mono font-medium text-stone-800 hover:text-stone-950 bg-stone-200/80 hover:bg-stone-300 rounded-lg transition-colors whitespace-nowrap items-center gap-1.5"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>POCKET</span>
        </button>

        <button
          onClick={onOpenMap}
          className="px-3 py-1.5 text-xs font-mono font-semibold text-stone-50 bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
        >
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>MAP</span>
        </button>
      </div>
    </header>
  );
};

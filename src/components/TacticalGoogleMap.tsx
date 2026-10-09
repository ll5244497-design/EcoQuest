import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import {
  Compass,
  Footprints,
  MapPin,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Navigation,
  Layers,
  Sparkles,
  LocateFixed,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { LocalityWaypoint } from '../types';
import { MovementTelemetry, movementTrackingService } from '../services/movementTrackingService';
import { hapticFeedback } from '../utils/haptics';

interface TacticalGoogleMapProps {
  telemetry: MovementTelemetry;
  waypoints: LocalityWaypoint[];
  activeWaypoint: LocalityWaypoint | null;
  onSelectWaypoint: (wp: LocalityWaypoint) => void;
  explorerName: string;
}

export const TacticalGoogleMap: React.FC<TacticalGoogleMapProps> = ({
  telemetry,
  waypoints,
  activeWaypoint,
  onSelectWaypoint,
  explorerName,
}) => {
  const apiKey =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
    'AIzaSyCouOCwfceINtENkyw7zhGkCFTkAtJs79k';

  const [selectedPinWaypoint, setSelectedPinWaypoint] = useState<LocalityWaypoint | null>(null);
  const [mapType, setMapType] = useState<'hybrid' | 'satellite' | 'roadmap' | 'terrain'>('hybrid');
  const [clickToWalkMode, setClickToWalkMode] = useState<boolean>(true);
  const [simSpeed, setSimSpeedPreset] = useState<number>(1.4);

  // Sync selected pin with active waypoint
  useEffect(() => {
    if (activeWaypoint) {
      setSelectedPinWaypoint(activeWaypoint);
    }
  }, [activeWaypoint]);

  const isSimulating = Boolean(telemetry.isSimulating);

  const handleToggleSimulation = () => {
    hapticFeedback.tactileClick();
    movementTrackingService.toggleSimulation(simSpeed);
  };

  const handleSpeedChange = (speed: number) => {
    hapticFeedback.tactileClick();
    setSimSpeedPreset(speed);
    movementTrackingService.setSimSpeed(speed);
  };

  const handleMapClick = (e: any) => {
    if (!clickToWalkMode) return;
    const latLng = e.detail?.latLng;
    if (latLng) {
      hapticFeedback.buttonPress();
      movementTrackingService.walkTowards(latLng.lat, latLng.lng, simSpeed);
    }
  };

  const handleTeleportPreset = (name: string, lat: number, lng: number) => {
    hapticFeedback.tactileClick();
    movementTrackingService.teleportTo(lat, lng, name);
  };

  const categoryColor = (cat: LocalityWaypoint['category']) => {
    switch (cat) {
      case 'Canopy':
        return { bg: '#059669', glyph: '#10b981', ring: 'ring-emerald-400' };
      case 'Botanical':
        return { bg: '#65a30d', glyph: '#84cc16', ring: 'ring-lime-400' };
      case 'Geo':
        return { bg: '#d97706', glyph: '#f59e0b', ring: 'ring-amber-400' };
      case 'Fauna':
        return { bg: '#0284c7', glyph: '#38bdf8', ring: 'ring-sky-400' };
      default:
        return { bg: '#10b981', glyph: '#34d399', ring: 'ring-emerald-400' };
    }
  };

  return (
    <div className="w-full rounded-3xl overflow-hidden border border-stone-800 bg-stone-950 shadow-2xl flex flex-col">
      {/* 1. Tactical HUD Header & Map Control Strip */}
      <div className="p-3 sm:p-4 bg-stone-900 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Signal & Locality */}
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Google Maps Tactical Radar
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-stone-400">
              {telemetry.localityName || 'GPS Nature Sector'} · ±{Math.round(telemetry.accuracy)}m accuracy
            </p>
          </div>
        </div>

        {/* Center: Layer Switcher */}
        <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs font-mono">
          <Layers className="w-3.5 h-3.5 text-stone-400 ml-1.5" />
          {(['hybrid', 'terrain', 'roadmap'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                hapticFeedback.tactileClick();
                setMapType(type);
              }}
              className={`px-2.5 py-1 rounded-lg uppercase text-[10px] font-bold transition-all ${
                mapType === type
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Right: GPS Re-center & Click-to-walk switch */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setClickToWalkMode(!clickToWalkMode)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
              clickToWalkMode
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-700/80'
                : 'bg-stone-800 text-stone-400 border-stone-700'
            }`}
            title="When active, clicking anywhere on the map will walk your scout there"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Click-To-Walk:</span>
            <span className="font-bold">{clickToWalkMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              hapticFeedback.buttonPress();
              movementTrackingService.requestCurrentLocation();
            }}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            title="Re-query Real Device GPS"
          >
            <LocateFixed className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 2. Interactive Google Map Container */}
      <div className="relative w-full h-[460px] sm:h-[540px] bg-stone-950">
        <APIProvider apiKey={apiKey} libraries={['marker']}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: telemetry.latitude, lng: telemetry.longitude }}
            center={{ lat: telemetry.latitude, lng: telemetry.longitude }}
            defaultZoom={17}
            mapTypeId={mapType}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onClick={handleMapClick}
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            className="w-full h-full"
          >
            {/* Explorer Player Marker with Animated Compass Pulse */}
            <AdvancedMarker
              position={{ lat: telemetry.latitude, lng: telemetry.longitude }}
              title={`${explorerName} (Explorer)`}
            >
              <div className="relative flex flex-col items-center">
                {/* Heading Arrow */}
                <div
                  className="w-7 h-7 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white transition-transform duration-300 relative z-20"
                  style={{
                    transform: `rotate(${telemetry.headingDegrees}deg)`,
                  }}
                >
                  <Navigation className="w-4 h-4 fill-white" />
                </div>

                {/* Animated Pulsing Beacon Halo */}
                <div className="absolute top-0 w-7 h-7 rounded-full bg-emerald-400/60 animate-ping z-10" />
                <div className="absolute -top-2 w-11 h-11 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />

                {/* Explorer Callout Pill */}
                <div className="mt-1 px-2 py-0.5 rounded-md bg-stone-900/95 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/50 shadow-md whitespace-nowrap z-20">
                  {explorerName || 'Scout'}
                  {isSimulating && ' · 🚶 Walking'}
                </div>
              </div>
            </AdvancedMarker>

            {/* Field Waypoint Markers */}
            {waypoints.map((wp) => {
              const isSelected = activeWaypoint?.id === wp.id;
              const { bg, glyph } = categoryColor(wp.category);

              return (
                <AdvancedMarker
                  key={wp.id}
                  position={{ lat: wp.lat, lng: wp.lng }}
                  title={wp.name}
                  onClick={() => {
                    hapticFeedback.tactileClick();
                    setSelectedPinWaypoint(wp);
                    onSelectWaypoint(wp);
                  }}
                >
                  <Pin
                    background={isSelected ? '#059669' : bg}
                    glyphColor={glyph}
                    borderColor={isSelected ? '#34d399' : '#ffffff'}
                    scale={isSelected ? 1.25 : 1.0}
                  >
                    <span className="text-sm select-none">{wp.icon}</span>
                  </Pin>
                </AdvancedMarker>
              );
            })}

            {/* Waypoint InfoWindow Popup */}
            {selectedPinWaypoint && (
              <InfoWindow
                position={{
                  lat: selectedPinWaypoint.lat,
                  lng: selectedPinWaypoint.lng,
                }}
                onCloseClick={() => setSelectedPinWaypoint(null)}
              >
                <div className="p-1 max-w-[240px] text-stone-900">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-lg">{selectedPinWaypoint.icon}</span>
                    <div>
                      <h4 className="font-bold text-xs leading-tight text-stone-950">
                        {selectedPinWaypoint.name}
                      </h4>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold uppercase">
                        {selectedPinWaypoint.category}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-600 line-clamp-3 mb-2 font-sans leading-tight">
                    {selectedPinWaypoint.description}
                  </p>

                  <div className="flex items-center gap-1 pt-1 border-t border-stone-200">
                    <button
                      onClick={() => {
                        hapticFeedback.buttonPress();
                        onSelectWaypoint(selectedPinWaypoint);
                      }}
                      className="flex-1 py-1 px-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Track Target</span>
                    </button>

                    <button
                      onClick={() => {
                        hapticFeedback.buttonPress();
                        movementTrackingService.walkTowards(
                          selectedPinWaypoint.lat,
                          selectedPinWaypoint.lng,
                          simSpeed
                        );
                      }}
                      className="py-1 px-1.5 rounded bg-stone-800 hover:bg-stone-900 text-white text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                      title="Simulate walking directly to this waypoint"
                    >
                      <Footprints className="w-3 h-3 text-emerald-400" />
                      <span>Walk Here</span>
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Floating Top Floating Compass Badge */}
        <div className="absolute top-3 left-3 bg-stone-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-700/80 shadow-lg text-[11px] font-mono text-white flex items-center gap-2 pointer-events-none">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span>Bearing: {telemetry.headingDegrees}°</span>
          <span className="text-stone-500">|</span>
          <span className="text-emerald-400 font-bold">{telemetry.speedKmh} km/h</span>
        </div>
      </div>

      {/* 3. Laptop Testing & Movement Simulation Command Center */}
      <div className="p-3 sm:p-4 bg-stone-900 border-t border-stone-800 space-y-3">
        {/* Testing Info Notice for Laptops */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-stone-950 border border-stone-800 text-xs font-mono">
          <div className="flex items-center gap-2 text-stone-300">
            <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Laptop / Stationary Testing Mode:</strong> Laptops stay still, so GPS speed is 0. Use the buttons below or click anywhere on the map to test walking movement!
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <span>Steps: <strong className="text-white">{telemetry.stepCount}</strong></span>
            <span className="text-stone-600">·</span>
            <span>Dist: <strong className="text-emerald-400">{telemetry.distanceCoveredMeters}m</strong></span>
          </div>
        </div>

        {/* Simulation Controls: Play/Pause, Pace presets, and Scenic Jumps */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Play/Pause Walk Simulation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSimulation}
              className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md ${
                isSimulating
                  ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause Walk Simulation</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Walk Simulation</span>
                </>
              )}
            </button>

            {/* Speed Presets */}
            <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-xl border border-stone-800 text-[11px] font-mono">
              {[
                { label: 'Stroll (1.4 m/s)', speed: 1.4 },
                { label: 'Brisk (2.2 m/s)', speed: 2.2 },
                { label: 'Jog (3.2 m/s)', speed: 3.2 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handleSpeedChange(preset.speed)}
                  className={`px-2 py-1 rounded-lg transition-all ${
                    simSpeed === preset.speed
                      ? 'bg-stone-800 text-emerald-400 font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Teleport to Nature Parks for Laptop Exploration */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-stone-500 hidden md:inline">Scenic Trails:</span>
            <button
              onClick={() => handleTeleportPreset('Central Park Ramble', 40.778, -73.971)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              🌲 Central Park
            </button>
            <button
              onClick={() => handleTeleportPreset('Muir Woods Redwood', 37.897, -122.581)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              🪵 Muir Woods
            </button>
            <button
              onClick={() => handleTeleportPreset('Yosemite Valley', 37.745, -119.593)}
              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-colors"
            >
              ⛰️ Yosemite
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

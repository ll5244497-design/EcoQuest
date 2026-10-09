import React from 'react';
import {
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudLightning,
  Snowflake,
  CloudFog,
  Wind,
  Navigation,
  Compass,
  Droplets,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { OutdoorWeatherData } from '../services/weatherService';
import { hapticFeedback } from '../utils/haptics';

interface EnvironmentalWeatherPodProps {
  weather: OutdoorWeatherData | null;
  isLoading: boolean;
  onRefreshWeather: () => void;
  variant?: 'full' | 'compact';
  onStartMission?: () => void;
}

/**
 * Returns the appropriate dynamic Lucide icon with responsive kinetic styling
 */
export const DynamicWeatherIcon: React.FC<{
  iconType: OutdoorWeatherData['iconType'];
  className?: string;
}> = ({ iconType, className = 'w-6 h-6' }) => {
  switch (iconType) {
    case 'sun':
      return <Sun className={`${className} text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]`} />;
    case 'moon':
      return <Moon className={`${className} text-indigo-300 drop-shadow-[0_0_8px_rgba(165,180,252,0.5)]`} />;
    case 'cloud-sun':
      return <CloudSun className={`${className} text-amber-300 drop-shadow-[0_0_6px_rgba(252,211,77,0.4)]`} />;
    case 'cloud':
      return <Cloud className={`${className} text-stone-300 drop-shadow-[0_0_6px_rgba(214,211,209,0.3)]`} />;
    case 'rain':
      return <CloudRain className={`${className} text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]`} />;
    case 'drizzle':
      return <CloudDrizzle className={`${className} text-sky-300 drop-shadow-[0_0_6px_rgba(125,211,252,0.4)]`} />;
    case 'lightning':
      return <CloudLightning className={`${className} text-yellow-300 drop-shadow-[0_0_10px_rgba(253,224,71,0.7)] animate-pulse`} />;
    case 'snow':
      return <Snowflake className={`${className} text-cyan-200 drop-shadow-[0_0_8px_rgba(165,243,252,0.6)]`} />;
    case 'fog':
      return <CloudFog className={`${className} text-stone-400 drop-shadow-[0_0_6px_rgba(168,162,158,0.3)]`} />;
    case 'wind':
      return <Wind className={`${className} text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.4)]`} />;
    default:
      return <Sun className={`${className} text-amber-400`} />;
  }
};

export const EnvironmentalWeatherPod: React.FC<EnvironmentalWeatherPodProps> = ({
  weather,
  isLoading,
  onRefreshWeather,
  variant = 'full',
  onStartMission,
}) => {
  const handleSyncClick = () => {
    hapticFeedback.tactileClick();
    onRefreshWeather();
  };

  if (!weather && isLoading) {
    return (
      <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 text-stone-400 font-mono text-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Navigation className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>INITIALIZING BROWSER GEOLOCATION & WEATHER SENSORS...</span>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  // COMPACT VARIANT: Designed for the top command status strip
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-stone-950/70 border border-stone-800 text-xs font-mono text-stone-200">
        <DynamicWeatherIcon iconType={weather.iconType} className="w-4 h-4" />
        <span className="font-bold text-emerald-400 tabular-nums">
          {weather.temperatureC}°C
        </span>
        <span className="text-stone-400 text-[10px] hidden sm:inline tabular-nums">
          ({weather.temperatureF}°F)
        </span>
        <span className="text-stone-500 hidden sm:inline" aria-hidden="true">·</span>
        <span className="text-stone-400 hidden sm:inline truncate max-w-[140px]">
          {weather.conditionLabel}
        </span>
        <button
          onClick={handleSyncClick}
          disabled={isLoading}
          title="Refresh real-world weather for current GPS position"
          className="ml-1 p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-emerald-400 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  // FULL INDUSTRIAL 3D BOX MODEL VARIANT
  return (
    <div className="relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-stone-950 border border-stone-800 shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex flex-col justify-between gap-5 group">
      {/* Instrument Top Plate */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono pb-3 border-b border-stone-800/80">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                weather.isLiveGps ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                weather.isLiveGps ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="text-stone-200 font-bold tracking-wider uppercase">
            ATMOSPHERIC & ENVIRONMENTAL TELEMETRY (CELSIUS)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
              weather.isLiveGps
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
            }`}
          >
            {weather.isLiveGps ? 'LIVE BROWSER GEOLOCATION' : 'BASE OUTDOOR CALIBRATION'}
          </span>
          <span className="text-stone-500 text-[11px] font-mono">{weather.updatedAt}</span>
        </div>
      </div>

      {/* Main Meteorological Display Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Dynamic Weather Icon & Core Thermal Metrics (5 cols) */}
        <div className="lg:col-span-5 flex items-center gap-4 sm:gap-5 p-4 rounded-2xl bg-stone-900/70 border border-stone-800/80">
          {/* Dynamic Environmental Icon Box */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0 shadow-inner">
            <DynamicWeatherIcon iconType={weather.iconType} className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-display font-extrabold text-emerald-400 tracking-tight tabular-nums">
                {weather.temperatureC}°C
              </span>
              <span className="text-sm font-mono text-stone-400 tabular-nums">
                / {weather.temperatureF}°F
              </span>
            </div>

            <div className="font-mono text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>{weather.conditionLabel}</span>
              <span className="text-base select-none">{weather.emoji}</span>
            </div>

            <div className="text-[11px] font-mono text-stone-400">
              Condition: <strong className="text-stone-300">{weather.outdoorRating}</strong>
            </div>
          </div>
        </div>

        {/* Right: Environmental Sensor Data & Field Advice (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Telemetry Micro Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-stone-900/50 border border-stone-800 flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <div className="truncate">
                <span className="text-stone-500 block text-[10px]">GPS FIX</span>
                <span className="text-stone-200 font-semibold truncate text-[11px]">{weather.locationLabel}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-stone-900/50 border border-stone-800 flex items-center gap-2">
              <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <div>
                <span className="text-stone-500 block text-[10px]">WIND VECTOR</span>
                <span className="text-stone-200 font-semibold text-[11px]">
                  {weather.windSpeedKmh} km/h ({weather.windSpeedMph} mph)
                </span>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-stone-900/50 border border-stone-800 flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-stone-500 block text-[10px]">HUMIDITY / CYCLE</span>
                <span className="text-stone-200 font-semibold text-[11px]">
                  {weather.humidity ? `${weather.humidity}%` : 'Normal'} · {weather.isDay ? 'Daylight' : 'Night'}
                </span>
              </div>
            </div>
          </div>

          {/* Scout Tactical Field Advice */}
          <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-start gap-2.5 font-mono text-xs text-stone-300">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-emerald-300 mr-1.5 uppercase tracking-wide">Outdoor Field Note:</strong>
              {weather.scoutGuidance}
            </p>
          </div>
        </div>
      </div>

      {/* Machined 3D Mechanical Button: Sync Geolocation & Weather */}
      <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] font-mono text-stone-500 flex items-center gap-2">
          <Navigation className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time outdoor sensors update mission context dynamically.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncClick}
            disabled={isLoading}
            className="relative py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-stone-100 select-none cursor-pointer bg-stone-800 hover:bg-stone-750 active:bg-stone-800 border-t border-stone-600/50 shadow-[0_3px_0_0_#09090b] active:shadow-[0_1px_0_0_#09090b] active:translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'SYNCING GPS SENSORS...' : 'SYNC GEOLOCATION & WEATHER'}</span>
          </button>

          {onStartMission && (
            <button
              onClick={onStartMission}
              className="relative py-2.5 px-4 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-stone-900 select-none cursor-pointer bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-400 border-t border-emerald-200 shadow-[0_3px_0_0_#064e3b] active:translate-y-0.5 transition-all flex items-center gap-2"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>START EXPEDITION</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

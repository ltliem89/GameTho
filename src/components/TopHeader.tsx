import React from 'react';
import { DiscoveryStats, WeatherType } from '../types';
import { Volume2, VolumeX, Music, Music2, Sparkles, Map, HelpCircle, Sun, Sunset, Moon, CloudRain, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TopHeaderProps {
  stats: DiscoveryStats;
  currentZone: string;
  weather: WeatherType;
  onWeatherChange: (w: WeatherType) => void;
  soundActive: boolean;
  musicActive: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  speedMultiplier: number;
  onToggleSpeed: () => void;
  onOpenWardrobe: () => void;
  onOpenMap: () => void;
  onOpenHelp: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  stats,
  currentZone,
  weather,
  onWeatherChange,
  soundActive,
  musicActive,
  onToggleSound,
  onToggleMusic,
  speedMultiplier,
  onToggleSpeed,
  onOpenWardrobe,
  onOpenMap,
  onOpenHelp,
}) => {
  return (
    <header id="top-game-header" className="fixed top-3 inset-x-3 sm:inset-x-6 z-35 pointer-events-none flex flex-col gap-2.5">
      {/* Top Bar Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Location Zone Badge & Collectible Counters */}
        <div className="pointer-events-auto flex items-center flex-wrap gap-2">
          {/* Current Forest Zone Pill */}
          <div
            id="zone-indicator-badge"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-emerald-400/40 shadow-[0_4px_16px_rgba(16,185,129,0.25)] text-xs font-black text-white cursor-pointer hover:bg-slate-900 hover:border-emerald-300 transition-all active:scale-95"
            onClick={onOpenMap}
            title="Nhấn để xem bản đồ"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-300 font-extrabold tracking-wide">{currentZone}</span>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-2xl shadow-xl text-xs font-black">
            <span className="flex items-center gap-1.5 text-amber-400 font-extrabold" title="Cà rốt đã ăn">
              <span className="text-base">🥕</span>
              <span className="bg-amber-500/20 px-1.5 py-0.5 rounded-lg border border-amber-400/30 text-amber-300">{stats.carrots}</span>
            </span>
            <span className="text-white/20 font-light">|</span>
            <span className="flex items-center gap-1.5 text-pink-400 font-extrabold" title="Dâu rừng">
              <span className="text-base">🫐</span>
              <span className="bg-pink-500/20 px-1.5 py-0.5 rounded-lg border border-pink-400/30 text-pink-300">{stats.berries}</span>
            </span>
            <span className="text-white/20 font-light">|</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold" title="Cỏ 4 lá may mắn">
              <span className="text-base">🍀</span>
              <span className="bg-emerald-500/20 px-1.5 py-0.5 rounded-lg border border-emerald-400/30 text-emerald-300">{stats.clovers}</span>
            </span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Weather / Time Selector */}
          <div className="flex items-center bg-slate-900/85 backdrop-blur-md border border-white/20 p-1 rounded-2xl shadow-xl">
            <button
              id="weather-btn-sunny"
              onClick={() => onWeatherChange('sunny')}
              className={`p-1.5 rounded-xl transition-all ${
                weather === 'sunny'
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 shadow-[0_2px_10px_rgba(245,158,11,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Trời nắng ấm"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              id="weather-btn-afternoon"
              onClick={() => onWeatherChange('afternoon')}
              className={`p-1.5 rounded-xl transition-all ${
                weather === 'afternoon'
                  ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-[0_2px_10px_rgba(249,115,22,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Hoàng hôn vàng"
            >
              <Sunset className="w-4 h-4" />
            </button>
            <button
              id="weather-btn-night"
              onClick={() => onWeatherChange('night')}
              className={`p-1.5 rounded-xl transition-all ${
                weather === 'night'
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-indigo-100 shadow-[0_2px_10px_rgba(99,102,241,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Đêm trăng sao & nấm phát sáng"
            >
              <Moon className="w-4 h-4" />
            </button>
            <button
              id="weather-btn-rainy"
              onClick={() => onWeatherChange('rainy')}
              className={`p-1.5 rounded-xl transition-all ${
                weather === 'rainy'
                  ? 'bg-gradient-to-tr from-sky-600 to-teal-400 text-white shadow-[0_2px_10px_rgba(14,165,233,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Mưa phùn mát lành"
            >
              <CloudRain className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Boost */}
          <button
            id="btn-speed-toggle"
            onClick={onToggleSpeed}
            className={`p-2 rounded-2xl backdrop-blur-md border shadow-xl transition-all active:scale-90 ${
              speedMultiplier > 1
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 border-amber-300 shadow-[0_4px_15px_rgba(245,158,11,0.5)] font-black'
                : 'bg-slate-900/85 border-white/20 text-slate-300 hover:text-white'
            }`}
            title={speedMultiplier > 1 ? 'Đang chạy nhanh' : 'Chạy nhanh'}
          >
            <Zap className={`w-4 h-4 ${speedMultiplier > 1 ? 'fill-current animate-pulse' : ''}`} />
          </button>

          {/* Sound & Music Controls */}
          <button
            id="btn-sfx-toggle"
            onClick={onToggleSound}
            className={`p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-90 ${
              soundActive
                ? 'bg-slate-900/85 text-emerald-400 border-emerald-400/40 shadow-[0_2px_12px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900/85 text-slate-500'
            }`}
            title={soundActive ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            id="btn-music-toggle"
            onClick={onToggleMusic}
            className={`p-2 rounded-2xl backdrop-blur-md border border-white/20 shadow-xl transition-all active:scale-90 ${
              musicActive
                ? 'bg-slate-900/85 text-amber-300 border-amber-400/40 shadow-[0_2px_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/85 text-slate-500'
            }`}
            title={musicActive ? 'Tắt nhạc nền rừng' : 'Bật nhạc nền rừng'}
          >
            {musicActive ? <Music className="w-4 h-4 animate-bounce" /> : <Music2 className="w-4 h-4" />}
          </button>

          {/* Wardrobe Button */}
          <button
            id="btn-open-wardrobe-header"
            onClick={() => {
              sounds.playChirp();
              onOpenWardrobe();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs shadow-[0_4px_16px_rgba(244,63,94,0.35)] active:scale-95 transition-all border border-pink-300/40"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Tủ Đồ</span>
          </button>

          {/* Map Button */}
          <button
            id="btn-open-map-header"
            onClick={() => {
              sounds.playChime();
              onOpenMap();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow-[0_4px_16px_rgba(20,184,166,0.35)] active:scale-95 transition-all border border-teal-300/40"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bản Đồ</span>
          </button>

          {/* Help Button */}
          <button
            id="btn-open-help-header"
            onClick={onOpenHelp}
            className="p-2 rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white shadow-xl transition-all active:scale-90 hover:border-amber-400/40"
            title="Hướng dẫn chơi"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

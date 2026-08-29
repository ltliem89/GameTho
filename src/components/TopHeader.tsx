import React from 'react';
import { DiscoveryStats, WeatherType } from '../types';
import { Volume2, VolumeX, Music, Music2, Sparkles, Map, HelpCircle, Sun, Sunset, Moon, CloudRain, Zap, Award, ArrowUpCircle } from 'lucide-react';
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
  onOpenQuests: () => void;
  onOpenUpgrades: () => void;
  onOpenAchievements: () => void;
  readyQuestsCount: number;
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
  onOpenQuests,
  onOpenUpgrades,
  onOpenAchievements,
  readyQuestsCount,
  onOpenHelp,
}) => {
  const currentLevel = stats.playerLevel || 1;
  const currentXp = stats.xp || 0;
  const xpInCurrentLevel = currentXp % 100;
  const xpPercent = Math.min(100, Math.round(xpInCurrentLevel));

  return (
    <header id="top-game-header" className="fixed top-2 sm:top-3 inset-x-2 sm:inset-x-6 z-35 pointer-events-none flex flex-col gap-1.5 sm:gap-2">
      {/* Top Bar Container: 2-Row Stack on Mobile, Single Row on Desktop */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2">
        {/* Left / Top Row: Level Bar, Zone & Collectible Counters */}
        <div className="pointer-events-auto flex items-center justify-between sm:justify-start flex-wrap gap-1 sm:gap-2">
          {/* Bunny Level & XP Bar */}
          <div
            id="bunny-level-xp-card"
            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-400/40 shadow-sm sm:shadow-[0_4px_16px_rgba(245,158,11,0.25)] text-xs font-black text-white cursor-pointer hover:border-amber-300 transition-all active:scale-95 select-none"
            onClick={onOpenUpgrades}
            title="Nhấn để xem bảng Nâng Cấp & Cấp Độ"
          >
            <div className="flex items-center gap-1 text-amber-300">
              <span className="text-xs sm:text-sm">🐰</span>
              <span className="text-[11px] sm:text-xs">
                <span className="hidden sm:inline">CẤP </span>Lv.{currentLevel}
              </span>
            </div>
            <div className="w-10 sm:w-20 h-2 sm:h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${xpPercent}%` }}
              />
            </div>
            <span className="hidden sm:inline text-[10px] text-amber-400 font-bold">{xpInCurrentLevel}/100 XP</span>
          </div>

          {/* Current Forest Zone Pill */}
          <div
            id="zone-indicator-badge"
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl bg-slate-900/85 backdrop-blur-md border border-emerald-400/40 shadow-sm text-[11px] sm:text-xs font-black text-white cursor-pointer hover:bg-slate-900 hover:border-emerald-300 transition-all active:scale-95 select-none"
            onClick={onOpenMap}
            title="Nhấn để xem bản đồ"
          >
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-300 font-bold truncate max-w-[100px] sm:max-w-none">{currentZone}</span>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-900/85 backdrop-blur-md border border-white/20 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl shadow-md sm:shadow-xl text-[11px] sm:text-xs font-black select-none">
            <span className="flex items-center gap-0.5 sm:gap-1 text-amber-400 font-extrabold" title="Cà rốt đã ăn">
              <span className="text-xs sm:text-sm">🥕</span>
              <span className="bg-amber-500/20 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg border border-amber-400/30 text-amber-300">{stats.carrots}</span>
            </span>
            <span className="text-white/20 font-light">|</span>
            <span className="flex items-center gap-0.5 sm:gap-1 text-pink-400 font-extrabold" title="Dâu rừng">
              <span className="text-xs sm:text-sm">🫐</span>
              <span className="bg-pink-500/20 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg border border-pink-400/30 text-pink-300">{stats.berries}</span>
            </span>
            <span className="text-white/20 font-light">|</span>
            <span className="flex items-center gap-0.5 sm:gap-1 text-emerald-400 font-extrabold" title="Cỏ 4 lá may mắn">
              <span className="text-xs sm:text-sm">🍀</span>
              <span className="bg-emerald-500/20 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg border border-emerald-400/30 text-emerald-300">{stats.clovers}</span>
            </span>
            {(stats.apples || 0) > 0 && (
              <>
                <span className="text-white/20 font-light">|</span>
                <span className="flex items-center gap-0.5 sm:gap-1 text-red-400 font-extrabold" title="Táo ngọt đã hái">
                  <span className="text-xs sm:text-sm">🍎</span>
                  <span className="bg-red-500/20 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg border border-red-400/30 text-red-300">{stats.apples}</span>
                </span>
              </>
            )}
            {(stats.acorns || 0) > 0 && (
              <>
                <span className="text-white/20 font-light">|</span>
                <span className="flex items-center gap-0.5 sm:gap-1 text-amber-400 font-extrabold" title="Quả sồi đã thu thập">
                  <span className="text-xs sm:text-sm">🌰</span>
                  <span className="bg-amber-700/30 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg border border-amber-500/30 text-amber-300">{stats.acorns}</span>
                </span>
              </>
            )}
            {(stats.goldenCarrots > 0 || (stats.goldenAcorns || 0) > 0) && (
              <>
                <span className="text-white/20 font-light">|</span>
                <span className="flex items-center gap-0.5 sm:gap-1 text-yellow-300 font-black animate-pulse" title="Vật phẩm Hoàng Kim">
                  <span className="text-xs sm:text-sm">✨</span>
                  <span className="bg-yellow-500/20 px-1 sm:px-1.5 py-0.5 rounded-md sm:rounded-lg border border-yellow-400/40 text-yellow-200">
                    {stats.goldenCarrots + (stats.goldenAcorns || 0)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right / Bottom Row on Mobile: Compact Action Controls */}
        <div className="pointer-events-auto flex items-center justify-end flex-wrap gap-1 sm:gap-1.5">
          {/* Achievements Button */}
          <button
            id="btn-open-achievements-header"
            onClick={() => {
              sounds.playChirp();
              onOpenAchievements();
            }}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-amber-950 font-black text-xs shadow-md active:scale-90 transition-all border border-amber-300/40 hover:from-amber-500 hover:to-yellow-400 flex items-center gap-1.5"
            title="Xem bảng thành tích"
          >
            <span className="text-xs sm:text-sm">🏆</span>
            <span className="hidden sm:inline">Thành Tích</span>
          </button>

          {/* Bunny Upgrades Button */}
          <button
            id="btn-open-upgrades-header"
            onClick={() => {
              sounds.playChime();
              onOpenUpgrades();
            }}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-amber-950 font-black text-xs shadow-sm sm:shadow-[0_4px_16px_rgba(245,158,11,0.4)] active:scale-90 transition-all border border-amber-100 hover:from-amber-400 hover:to-yellow-300 flex items-center gap-1.5"
            title="Nâng cấp kỹ năng Thỏ con"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-950 animate-bounce" />
            <span className="hidden sm:inline">Nâng Cấp</span>
            <span className="hidden sm:inline bg-amber-950/20 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              Lv.{currentLevel}
            </span>
          </button>

          {/* Quests Button with active notification badge */}
          <button
            id="btn-open-quests-header"
            onClick={() => {
              sounds.playChime();
              onOpenQuests();
            }}
            className={`relative p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl font-black text-xs shadow-sm sm:shadow-xl active:scale-90 transition-all border flex items-center gap-1.5 ${
              readyQuestsCount > 0
                ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white border-pink-200 shadow-[0_0_15px_rgba(236,72,153,0.6)] animate-pulse'
                : 'bg-slate-900/85 backdrop-blur-md border-purple-400/40 text-purple-300 hover:bg-slate-900 hover:border-purple-300'
            }`}
            title="Xem danh sách nhiệm vụ"
          >
            <Award className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${readyQuestsCount > 0 ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Nhiệm Vụ</span>
            {readyQuestsCount > 0 && (
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500 border border-white animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Weather / Time Selector */}
          <div className="flex items-center bg-slate-900/85 backdrop-blur-md border border-white/20 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl shadow-sm sm:shadow-xl gap-0.5">
            <button
              id="weather-btn-sunny"
              onClick={() => onWeatherChange('sunny')}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all ${
                weather === 'sunny'
                  ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 shadow-[0_2px_8px_rgba(245,158,11,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Trời nắng ấm"
            >
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              id="weather-btn-afternoon"
              onClick={() => onWeatherChange('afternoon')}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all ${
                weather === 'afternoon'
                  ? 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-[0_2px_8px_rgba(249,115,22,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Hoàng hôn vàng"
            >
              <Sunset className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              id="weather-btn-night"
              onClick={() => onWeatherChange('night')}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all ${
                weather === 'night'
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-500 text-indigo-100 shadow-[0_2px_8px_rgba(99,102,241,0.4)] scale-105 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Đêm trăng sao & nấm phát sáng"
            >
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              id="weather-btn-rain"
              onClick={() => onWeatherChange(weather === 'rainy' || weather === 'rain' ? 'sunny' : 'rain')}
              className={`p-1 sm:p-1.5 rounded-lg sm:rounded-xl transition-all ${
                weather === 'rainy' || weather === 'rain'
                  ? 'bg-gradient-to-tr from-sky-600 to-teal-400 text-white shadow-[0_2px_8px_rgba(14,165,233,0.4)] scale-105 font-bold animate-pulse'
                  : 'text-slate-300 hover:text-white'
              }`}
              title="Thời tiết Mưa (Rain) & Tiếng mưa rơi thư giãn"
            >
              <CloudRain className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Speed Boost */}
          <button
            id="btn-speed-toggle"
            onClick={onToggleSpeed}
            className={`p-1.5 sm:p-2 rounded-xl sm:rounded-2xl backdrop-blur-md border shadow-sm sm:shadow-xl transition-all active:scale-90 ${
              speedMultiplier > 1
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-amber-950 border-amber-300 shadow-[0_2px_10px_rgba(245,158,11,0.5)] font-black'
                : 'bg-slate-900/85 border-white/20 text-slate-300 hover:text-white'
            }`}
            title={speedMultiplier > 1 ? 'Đang chạy nhanh' : 'Chạy nhanh'}
          >
            <Zap className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${speedMultiplier > 1 ? 'fill-current animate-pulse' : ''}`} />
          </button>

          {/* Sound & Music Controls */}
          <button
            id="btn-sfx-toggle"
            onClick={onToggleSound}
            className={`p-1.5 sm:p-2 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/20 shadow-sm sm:shadow-xl transition-all active:scale-90 ${
              soundActive
                ? 'bg-slate-900/85 text-emerald-400 border-emerald-400/40 shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
                : 'bg-slate-900/85 text-slate-500'
            }`}
            title={soundActive ? 'Tắt âm thanh hiệu ứng' : 'Bật âm thanh hiệu ứng'}
          >
            {soundActive ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          <button
            id="btn-music-toggle"
            onClick={onToggleMusic}
            className={`p-1.5 sm:p-2 rounded-xl sm:rounded-2xl backdrop-blur-md border border-white/20 shadow-sm sm:shadow-xl transition-all active:scale-90 ${
              musicActive
                ? 'bg-slate-900/85 text-amber-300 border-amber-400/40 shadow-[0_2px_8px_rgba(245,158,11,0.25)]'
                : 'bg-slate-900/85 text-slate-500'
            }`}
            title={musicActive ? 'Tắt nhạc nền rừng' : 'Bật nhạc nền rừng'}
          >
            {musicActive ? <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-bounce" /> : <Music2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>

          {/* Wardrobe Button */}
          <button
            id="btn-open-wardrobe-header"
            onClick={() => {
              sounds.playChirp();
              onOpenWardrobe();
            }}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 hover:from-pink-400 hover:to-rose-400 text-white font-black text-xs shadow-sm sm:shadow-[0_4px_16px_rgba(244,63,94,0.35)] active:scale-90 transition-all border border-pink-300/40 flex items-center gap-1.5"
            title="Mở tủ đồ trang phục"
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
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-xs shadow-sm sm:shadow-[0_4px_16px_rgba(20,184,166,0.35)] active:scale-90 transition-all border border-teal-300/40 flex items-center gap-1.5"
            title="Mở bản đồ khu rừng"
          >
            <Map className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bản Đồ</span>
          </button>

          {/* Help Button */}
          <button
            id="btn-open-help-header"
            onClick={onOpenHelp}
            className="p-1.5 sm:p-2 rounded-xl sm:rounded-2xl bg-slate-900/85 backdrop-blur-md border border-white/20 text-slate-300 hover:text-white shadow-sm sm:shadow-xl transition-all active:scale-90 hover:border-amber-400/40 flex items-center"
            title="Hướng dẫn chơi"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

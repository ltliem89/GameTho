import React from 'react';
import { Play, RotateCcw, Trophy, HelpCircle, Volume2, VolumeX, Music, Sparkles, MapPin, Shield } from 'lucide-react';
import { DiscoveryStats } from '../types';
import { sounds } from '../utils/audio';

interface MainMenuScreenProps {
  hasSavedGame: boolean;
  stats: DiscoveryStats;
  soundActive: boolean;
  musicActive: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onContinueGame: () => void;
  onNewGame: () => void;
  onOpenAchievements: () => void;
  onOpenHelp: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({
  hasSavedGame,
  stats,
  soundActive,
  musicActive,
  onToggleSound,
  onToggleMusic,
  onContinueGame,
  onNewGame,
  onOpenAchievements,
  onOpenHelp,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 select-none">
      {/* Background Animated Forest Glow Rings */}
      <div className="absolute w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse -top-20 -left-20" />
      <div className="absolute w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse -bottom-20 -right-20" />

      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900/95 via-slate-900/95 to-slate-950/95 border-2 border-emerald-500/40 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(16,185,129,0.25)] p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden">
        {/* Decorative Nature Leaf / Badge */}
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center shadow-[0_10px_30px_rgba(16,185,129,0.4)] border-2 border-emerald-200/50 mb-3 animate-bounce">
          <span className="text-5xl filter drop-shadow-md">🐰</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2">
          <span>THỎ TRONG RỪNG</span>
          <Sparkles className="w-6 h-6 text-amber-400 fill-current animate-pulse" />
        </h1>
        <p className="text-xs sm:text-sm text-emerald-300 font-semibold mt-1">
          Phiêu Lưu Thám Hiểm Thế Giới Rừng Xanh Diệu Kỳ
        </p>

        {/* Saved Game Status Card if available */}
        {hasSavedGame && (
          <div className="w-full mt-5 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-xl border border-emerald-400/30">
                ⭐
              </div>
              <div>
                <div className="text-xs font-black text-emerald-200">
                  Cấp Độ Thỏ: <span className="text-amber-300">Cấp {stats.playerLevel || 1}</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2 mt-0.5 font-medium">
                  <span>🥕 {stats.carrots}</span>
                  <span>🫐 {stats.berries}</span>
                  <span>🍀 {stats.clovers}</span>
                  <span>🍎 {stats.apples || 0}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Đã Lưu
              </span>
            </div>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="w-full space-y-3 mt-6">
          {hasSavedGame ? (
            <button
              onClick={() => {
                sounds.playMunch();
                onContinueGame();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(16,185,129,0.4)] transition-all active:scale-98 flex items-center justify-center gap-2 border border-emerald-200/60"
            >
              <Play className="w-6 h-6 fill-current" />
              CHƠI TIẾP HÀNH TRÌNH
            </button>
          ) : (
            <button
              onClick={() => {
                sounds.playMunch();
                onNewGame();
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(16,185,129,0.4)] transition-all active:scale-98 flex items-center justify-center gap-2 border border-emerald-200/60"
            >
              <Play className="w-6 h-6 fill-current" />
              BẮT ĐẦU THÁM HIỂM
            </button>
          )}

          {hasSavedGame && (
            <button
              onClick={() => {
                if (window.confirm('Bạn có chắc muốn bắt đầu lại hành trình từ đầu không?')) {
                  sounds.playHop();
                  onNewGame();
                }
              }}
              className="w-full py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white font-bold text-sm transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              Chơi Lại Từ Đầu
            </button>
          )}

          {/* Secondary Buttons Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={() => {
                sounds.playChirp();
                onOpenAchievements();
              }}
              className="py-3 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Thành Tích
            </button>

            <button
              onClick={() => {
                sounds.playChirp();
                onOpenHelp();
              }}
              className="py-3 px-4 rounded-2xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              Hướng Dẫn
            </button>
          </div>
        </div>

        {/* Audio Toggles Footer */}
        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-800/80 w-full">
          <button
            onClick={() => {
              onToggleSound();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              soundActive
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            {soundActive ? 'Âm Thanh: Bật' : 'Âm Thanh: Tắt'}
          </button>

          <button
            onClick={() => {
              onToggleMusic();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
              musicActive
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            {musicActive ? 'Nhạc Rừng: Bật' : 'Nhạc Rừng: Tắt'}
          </button>
        </div>
      </div>
    </div>
  );
};

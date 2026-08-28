import React from 'react';
import { Achievement } from '../types';
import { Trophy, CheckCircle, Sparkles, X, Award, Star } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
  totalScore: number;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  isOpen,
  onClose,
  achievements,
  totalScore,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg border border-amber-200/50">
              <Trophy className="w-6 h-6 text-amber-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <span>Danh Hiệu & Thành Tích</span>
                <Sparkles className="w-5 h-5 text-amber-400 fill-current animate-pulse" />
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/80 font-medium">
                Đã hoàn thành <strong className="text-amber-300">{unlockedCount}/{totalCount}</strong> mục tiêu thám hiểm
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playChirp();
              onClose();
            }}
            className="w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700 active:scale-95"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Overview Bar */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1 text-amber-300">
                <Award className="w-4 h-4 text-amber-400" /> Tiến Độ Khám Phá Rừng
              </span>
              <span className="text-amber-400">{progressPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Tổng Điểm</div>
            <div className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-1 justify-end">
              <Star className="w-4 h-4 fill-current text-amber-400" />
              {totalScore}
            </div>
          </div>
        </div>

        {/* Achievements List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`relative p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                ach.unlocked
                  ? 'bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900 border-amber-500/50 shadow-md'
                  : 'bg-slate-900/40 border-slate-800 opacity-70'
              }`}
            >
              {/* Icon Badge */}
              <div
                className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 border ${
                  ach.unlocked
                    ? 'bg-gradient-to-br from-amber-500/30 to-amber-900/30 border-amber-400/60 shadow-inner'
                    : 'bg-slate-800/60 border-slate-700 grayscale'
                }`}
              >
                {ach.icon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={`font-black text-sm sm:text-base ${ach.unlocked ? 'text-amber-200' : 'text-slate-300'}`}>
                    {ach.titleVi}
                  </h3>
                  {ach.unlocked && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-0.5">
                      <CheckCircle className="w-3 h-3" /> Đã Đạt
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                  {ach.descVi}
                </p>

                {/* Rewards Info */}
                <div className="mt-2.5 flex items-center gap-3 text-xs font-bold">
                  <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                    🥕 +{ach.rewardCarrots} Cà rốt
                  </span>
                  <span className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                    ⭐ +{ach.rewardXp} XP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sounds.playChirp();
              onClose();
            }}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-amber-950 font-black text-sm shadow-lg transition-all active:scale-95 border border-amber-300/40"
          >
            Đóng Bảng Thành Tích
          </button>
        </div>
      </div>
    </div>
  );
};

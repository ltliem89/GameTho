import React from 'react';
import { Quest, BunnySkin, BunnyAccessory } from '../types';
import { CheckCircle2, Gift, Sparkles, X, Target, Award, ArrowRight } from 'lucide-react';

interface QuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quests: Quest[];
  onClaimReward: (quest: Quest) => void;
  onSelectWardrobe?: () => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  isOpen,
  onClose,
  quests,
  onClaimReward,
  onSelectWardrobe,
}) => {
  if (!isOpen) return null;

  const completedCount = quests.filter((q) => q.completed).length;
  const claimedCount = quests.filter((q) => q.rewardClaimed).length;
  const totalCount = quests.length;

  return (
    <div
      id="quests-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="quests-modal-card"
        className="relative w-full max-w-xl max-h-[90vh] bg-slate-900/95 border-2 border-amber-400/40 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_35px_rgba(245,158,11,0.2)] text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 font-black shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Nhiệm Vụ Khám Phá Rừng</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {completedCount}/{totalCount}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Hoàn thành nhiệm vụ để nhận cà rốt và mở khóa trang phục hiếm!</p>
            </div>
          </div>
          <button
            id="close-quests-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tiến độ hoàn thành
            </span>
            <span className="text-slate-300">
              {claimedCount} đã nhận quà / {totalCount} nhiệm vụ
            </span>
          </div>
          <div className="w-full h-2.5 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Quest List (Scrollable) */}
        <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {quests.map((quest) => {
            const isReadyToClaim = quest.completed && !quest.rewardClaimed;
            const isFinished = quest.rewardClaimed;

            return (
              <div
                key={quest.id}
                id={`quest-card-${quest.id}`}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  isFinished
                    ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
                    : isReadyToClaim
                    ? 'bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Quest Icon & Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-black/30 border border-white/15 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                      {quest.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-black text-white tracking-wide">{quest.titleVi}</h3>
                        {isFinished && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Đã nhận thưởng
                          </span>
                        )}
                        {isReadyToClaim && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 font-black animate-bounce shadow-sm">
                            Đã xong! Nhận quà ngay ✨
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{quest.descVi}</p>

                      {/* Reward preview */}
                      <div className="mt-2 text-xs font-bold text-amber-300 flex items-center gap-1.5 flex-wrap">
                        <Gift className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" />
                        <span>Thưởng: {quest.rewardTextVi}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action / Progress Button */}
                  <div className="flex flex-col items-end justify-center self-center flex-shrink-0">
                    {isReadyToClaim ? (
                      <button
                        id={`claim-reward-btn-${quest.id}`}
                        onClick={() => onClaimReward(quest)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-yellow-200 text-amber-950 font-black text-xs shadow-[0_4px_15px_rgba(245,158,11,0.5)] transition-all active:scale-95 flex items-center gap-1.5 border border-amber-100"
                      >
                        <Sparkles className="w-4 h-4 fill-current" /> Nhận Thưởng
                      </button>
                    ) : isFinished ? (
                      <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Hoàn tất
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-300 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
                          {quest.currentCount} / {quest.targetCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          {onSelectWardrobe && (
            <button
              onClick={() => {
                onClose();
                onSelectWardrobe();
              }}
              className="text-xs font-bold text-pink-300 hover:text-pink-200 flex items-center gap-1 transition-colors"
            >
              <span>Xem Tủ Đồ Thỏ Con</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            id="quests-close-btn"
            onClick={onClose}
            className="ml-auto px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};

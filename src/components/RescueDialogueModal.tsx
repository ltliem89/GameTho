import React, { useState, useEffect } from 'react';
import { EnvironmentalRescue } from '../types';
import { Shield, Sparkles, CheckCircle, Heart, X, Award, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/audio';

interface RescueDialogueModalProps {
  rescue: EnvironmentalRescue | null;
  onClose: () => void;
  onCompleteRescue: (rescue: EnvironmentalRescue) => void;
}

export const RescueDialogueModal: React.FC<RescueDialogueModalProps> = ({
  rescue,
  onClose,
  onCompleteRescue,
}) => {
  const [rescuing, setRescuing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  useEffect(() => {
    if (rescue) {
      setProgress(rescue.status === 'saved' ? 100 : 0);
      setCompleted(rescue.status === 'saved');
      setRescuing(false);
    }
  }, [rescue]);

  if (!rescue) return null;

  const handleStartRescue = () => {
    if (completed || rescuing) return;
    setRescuing(true);

    if (rescue.type === 'wildfire_ember') {
      sounds.playExtinguishFire();
    } else {
      sounds.playChirp();
    }

    let current = 0;
    const interval = window.setInterval(() => {
      current += 10;
      setProgress(current);
      if (current >= 100) {
        clearInterval(interval);
        setRescuing(false);
        setCompleted(true);
        sounds.playRescueSuccess();
        onCompleteRescue({ ...rescue, status: 'saved', progress: 100 });
      }
    }, 120);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-2 border-emerald-400/50 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(16,185,129,0.3)] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border-b border-emerald-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg border border-emerald-200/50 text-2xl">
              {rescue.icon}
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>NHIỆM VỤ GIẢI CỨU MÔI TRƯỜNG</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                {rescue.titleVi}
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playChirp();
              onClose();
            }}
            className="w-9 h-9 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700 active:scale-95"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Situation Box */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-1.5">
              <span className="text-base">{completed ? '🎉' : '📢'}</span>
              <span>{rescue.victimNameVi}</span>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
              {completed ? rescue.dialogueSaved : rescue.dialogueBefore}
            </p>
          </div>

          {/* Rescue Progress Bar when active */}
          {(rescuing || completed) && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-emerald-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  {completed ? 'Đã Giải Cứu Thành Công!' : 'Đang Giải Cứu...'}
                </span>
                <span className="text-emerald-400 font-mono">{progress}%</span>
              </div>
              <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-green-300 rounded-full transition-all duration-150 shadow-sm"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Eco Tip Education Note */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
            <span className="text-lg">🌿</span>
            <div className="text-xs text-amber-200/90 leading-relaxed font-medium">
              <strong className="text-amber-300 block font-bold mb-0.5">Lời Khuyên Xanh:</strong>
              {rescue.ecoTipVi}
            </div>
          </div>

          {/* Rewards Preview */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-400 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-400" /> Phần thưởng Hiệp Sĩ:
            </span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30">
                🥕 +{rescue.rewardCarrots} Cà rốt
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30">
                ⭐ +{rescue.rewardXp} XP
              </span>
              {rescue.rewardItemVi && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {rescue.rewardItemVi}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          {completed ? (
            <button
              onClick={() => {
                sounds.playChirp();
                onClose();
              }}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-emerald-950 font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border border-emerald-200/50"
            >
              <CheckCircle className="w-4 h-4" />
              ĐÃ HOÀN THÀNH XUẤT SẮC
            </button>
          ) : (
            <button
              onClick={handleStartRescue}
              disabled={rescuing}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 border ${
                rescuing
                  ? 'bg-slate-700 text-slate-400 border-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 border-emerald-200/60 shadow-[0_4px_20px_rgba(16,185,129,0.35)] animate-pulse'
              }`}
            >
              <Heart className="w-4 h-4 fill-current text-rose-500" />
              {rescuing ? 'Đang Thực Hiện...' : `HÀNH ĐỘNG: ${rescue.rescueActionVi}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

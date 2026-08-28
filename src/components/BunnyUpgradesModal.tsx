import React from 'react';
import { BunnyUpgrades } from '../types';
import { Sparkles, Zap, Shield, Magnet, ArrowUpCircle, X, Check, Award, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BunnyUpgradesModalProps {
  isOpen: boolean;
  onClose: () => void;
  carrots: number;
  upgrades: BunnyUpgrades;
  onUpgradeSkill: (skillKey: keyof Omit<BunnyUpgrades, 'level'>, cost: number) => void;
  onLevelUpBunny: (cost: number) => void;
}

const LEVEL_NAMES = [
  { level: 1, nameVi: 'Thỏ Con Tập Đi 🐰', descVi: 'Thỏ con hiền lành, khám phá thiên nhiên tươi đẹp.', bonusVi: 'Tốc độ cơ bản' },
  { level: 2, nameVi: 'Thỏ Nhí Nhanh Nhẹn 💨', descVi: 'Bước chân thoăn thoắt, lướt êm trên bãi cỏ.', bonusVi: '+15% Tốc độ & Bán kính phát hiện vật phẩm' },
  { level: 3, nameVi: 'Thỏ Phiêu Lưu Quả Cảm 🎒', descVi: 'Khám phá mọi ngóc ngách bí ẩn trong rừng sâu.', bonusVi: '+30% Tốc độ & Mở khóa từ tính cà rốt tự nhiên' },
  { level: 4, nameVi: 'Thỏ Thần Rừng Xanh 🌿', descVi: 'Bảo hộ khu rừng cổ thụ, được muôn thú mến yêu.', bonusVi: '+50% Tốc độ & Kháng 50% sát thương độc' },
  { level: 5, nameVi: 'Thần Thú Hoàng Kim Tối Thượng ✨', descVi: 'Hào quang vàng rực rỡ, bước đi tỏa sao lấp lánh.', bonusVi: 'Tốc độ cực hạn, Hào quang hút cà rốt & Miễn nhiễm gai!' },
];

const SKILLS_CONFIG: {
  key: keyof Omit<BunnyUpgrades, 'level'>;
  titleVi: string;
  descVi: string;
  icon: string;
  color: string;
  maxLevel: number;
  costs: number[];
}[] = [
  {
    key: 'speedLevel',
    titleVi: 'Bước Chân Siêu Tốc',
    descVi: 'Tăng tốc độ di chuyển và lướt trên mọi địa hình mượt mà.',
    icon: '⚡',
    color: 'from-amber-500 to-yellow-400',
    maxLevel: 5,
    costs: [15, 30, 50, 80, 120],
  },
  {
    key: 'magnetLevel',
    titleVi: 'Hào Quang Nam Châm',
    descVi: 'Tự động hút cà rốt, dâu rừng và cỏ 4 lá từ khoảng cách xa!',
    icon: '🧲',
    color: 'from-cyan-500 to-blue-500',
    maxLevel: 5,
    costs: [20, 40, 70, 100, 150],
  },
  {
    key: 'shieldLevel',
    titleVi: 'Khiên Hào Quang Hộ Thể',
    descVi: 'Miễn nhiễm hoặc giảm hình phạt khi chạm phải nấm độc, bụi gai cào.',
    icon: '🛡️',
    color: 'from-emerald-500 to-teal-400',
    maxLevel: 4,
    costs: [25, 50, 90, 140],
  },
  {
    key: 'superHopLevel',
    titleVi: 'Bật Cao Bay Bổng',
    descVi: 'Nhảy cao hơn, lơ lửng trên không trung êm ái như bay.',
    icon: '🦘',
    color: 'from-pink-500 to-rose-400',
    maxLevel: 4,
    costs: [20, 35, 60, 95],
  },
  {
    key: 'harvestLuckLevel',
    titleVi: 'Phước Lành Thu Hoạch',
    descVi: 'Cà rốt mọc lại nhanh hơn + Tỉ lệ x2 số cà rốt khi thu hoạch!',
    icon: '🍀',
    color: 'from-purple-500 to-indigo-500',
    maxLevel: 4,
    costs: [30, 60, 100, 160],
  },
];

export const BunnyUpgradesModal: React.FC<BunnyUpgradesModalProps> = ({
  isOpen,
  onClose,
  carrots,
  upgrades,
  onUpgradeSkill,
  onLevelUpBunny,
}) => {
  if (!isOpen) return null;

  const currentLevelInfo = LEVEL_NAMES.find((l) => l.level === upgrades.level) || LEVEL_NAMES[0];
  const nextLevelInfo = LEVEL_NAMES.find((l) => l.level === upgrades.level + 1);
  const levelUpCost = upgrades.level * 45;
  const canLevelUp = nextLevelInfo && carrots >= levelUpCost;

  return (
    <div
      id="upgrades-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="upgrades-modal-card"
        className="relative w-full max-w-xl max-h-[92vh] bg-slate-900/95 border-2 border-yellow-400/40 rounded-3xl p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_40px_rgba(234,179,8,0.25)] text-slate-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-500 to-orange-500 text-amber-950 font-black shadow-lg">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">Nâng Cấp Kỹ Năng Thỏ Con</h2>
              </div>
              <p className="text-xs text-slate-300">Dùng Cà Rốt thu thập được để cường hóa sức mạnh cho bé Thỏ!</p>
            </div>
          </div>
          <button
            id="close-upgrades-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Carrots Balance & Bunny Level Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-emerald-500/20 border-2 border-amber-400/40 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                  Cấp Độ Hiện Tại
                </span>
                <span className="text-xs text-slate-300">Cấp {upgrades.level}/5</span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">{currentLevelInfo.nameVi}</h3>
              <p className="text-xs text-slate-300 leading-snug mt-0.5">{currentLevelInfo.bonusVi}</p>
            </div>

            {/* Level up CTA or Max badge */}
            <div className="flex items-center gap-3 self-end sm:self-center">
              <div className="text-right">
                <div className="text-[11px] text-slate-300">Cà rốt sở hữu:</div>
                <div className="text-base font-black text-amber-300 flex items-center gap-1 justify-end">
                  <span>🥕</span> {carrots}
                </div>
              </div>

              {nextLevelInfo ? (
                <button
                  id="btn-level-up-bunny"
                  disabled={!canLevelUp}
                  onClick={() => {
                    sounds.playChime();
                    onLevelUpBunny(levelUpCost);
                  }}
                  className={`px-4 py-2 rounded-xl font-black text-xs shadow-lg transition-all flex items-center gap-1.5 border ${
                    canLevelUp
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border-amber-100 hover:from-amber-300 hover:to-yellow-200 shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 animate-pulse'
                      : 'bg-white/5 border-white/10 text-slate-400 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>Lên Cấp {upgrades.level + 1} ({levelUpCost} 🥕)</span>
                </button>
              ) : (
                <span className="px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-xs flex items-center gap-1">
                  <Award className="w-4 h-4" /> Cực Hạn Hoàng Kim
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Skills Upgrade List */}
        <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
          {SKILLS_CONFIG.map((skill) => {
            const currentSkillLevel = upgrades[skill.key] || 0;
            const isMax = currentSkillLevel >= skill.maxLevel;
            const nextCost = isMax ? 0 : skill.costs[currentSkillLevel];
            const canAfford = !isMax && carrots >= nextCost;

            return (
              <div
                key={skill.key}
                id={`skill-card-${skill.key}`}
                className="p-3.5 sm:p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between gap-3">
                  {/* Skill icon & info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
                      {skill.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white truncate">{skill.titleVi}</h4>
                        <span className="text-[11px] font-black text-amber-300 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30">
                          Lv.{currentSkillLevel}/{skill.maxLevel}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 leading-snug line-clamp-1">{skill.descVi}</p>

                      {/* Level progress dots */}
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: skill.maxLevel }).map((_, idx) => (
                          <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all ${
                              idx < currentSkillLevel
                                ? 'w-4 bg-gradient-to-r from-amber-400 to-yellow-300 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                                : 'w-2 bg-white/15'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Upgrade Button */}
                  <div className="flex-shrink-0">
                    {isMax ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Tối Đa
                      </span>
                    ) : (
                      <button
                        id={`btn-upgrade-${skill.key}`}
                        disabled={!canAfford}
                        onClick={() => {
                          sounds.playChime();
                          onUpgradeSkill(skill.key, nextCost);
                        }}
                        className={`px-3.5 py-2 rounded-xl font-black text-xs shadow-md transition-all flex items-center gap-1.5 border ${
                          canAfford
                            ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 border-amber-100 hover:from-amber-300 hover:to-yellow-200 active:scale-95 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                            : 'bg-white/5 border-white/10 text-slate-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <span>Nâng Cấp</span>
                        <span className="font-bold">({nextCost} 🥕)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-slate-400">Cà rốt và dâu rừng tự động mọc lại sau khi ăn! 🌿</span>
          <button
            id="upgrades-close-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all active:scale-95"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BunnyAccessory, BunnySkin, CharacterType, SquirrelSkin } from '../types';
import { X, Sparkles, Check, Lock } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BunnyWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterType: CharacterType;
  onSelectCharacter: (type: CharacterType) => void;
  currentSkin: BunnySkin | SquirrelSkin;
  currentAccessory: BunnyAccessory;
  unlockedSkins?: BunnySkin[];
  unlockedSquirrelSkins?: SquirrelSkin[];
  unlockedAccessories?: BunnyAccessory[];
  onSelectSkin: (skin: BunnySkin | SquirrelSkin) => void;
  onSelectAccessory: (acc: BunnyAccessory) => void;
}

const BUNNY_SKINS: { id: BunnySkin; nameVi: string; descVi: string; color: string; gradient?: string; questHint?: string }[] = [
  { id: 'white', nameVi: 'Thỏ Trắng Tuyết', descVi: 'Bộ lông trắng muốt như bông gòn.', color: '#ffffff' },
  { id: 'caramel', nameVi: 'Thỏ Vàng Caramel', descVi: 'Màu nâu vàng óng ánh ấm áp.', color: '#fcd34d' },
  { id: 'pink', nameVi: 'Thỏ Hồng Đào', descVi: 'Sắc hồng ngọt ngào cánh hoa anh đào.', color: '#fbcfe8' },
  { id: 'spotted', nameVi: 'Thỏ Đốm Dễ Thương', descVi: 'Đốm đen trắng tinh nghịch hiếu động.', color: '#94a3b8' },
  { id: 'shadow', nameVi: 'Thỏ Bóng Đêm', descVi: 'Huyền bí với đôi mắt phát sáng lấp lánh.', color: '#334155' },
  {
    id: 'golden',
    nameVi: 'Thỏ Vàng Hoàng Kim ✨',
    descVi: 'Tỏa sáng hào quang hoàng kim diệu kỳ.',
    color: '#fbbf24',
    gradient: 'linear-gradient(135deg, #f59e0b, #fef08a, #d97706)',
    questHint: 'Thưởng Nhiệm vụ Cà Rốt Hoàng Kim',
  },
  {
    id: 'galaxy',
    nameVi: 'Thỏ Vũ Trụ Galaxy 🌌',
    descVi: 'Huyền ảo với tinh tú và bụi sao vũ trụ.',
    color: '#818cf8',
    gradient: 'linear-gradient(135deg, #4f46e5, #a855f7, #ec4899)',
    questHint: 'Thưởng Nhiệm vụ Khám phá Hang Cổ',
  },
];

const SQUIRREL_SKINS: { id: SquirrelSkin; nameVi: string; descVi: string; color: string; gradient?: string; questHint?: string }[] = [
  { id: 'chestnut', nameVi: 'Sóc Nâu Hạt Dẻ', descVi: 'Bộ lông nâu hạt dẻ ấm áp, đuôi xù mượt mà.', color: '#b45309' },
  { id: 'red_fur', nameVi: 'Sóc Đỏ Rừng Phong', descVi: 'Màu đỏ cam rực rỡ như chiếc lá phong mùa thu.', color: '#ea580c' },
  { id: 'golden_autumn', nameVi: 'Sóc Vàng Mùa Thu ✨', descVi: 'Óng ánh sắc vàng nắng rọi qua kẽ lá.', color: '#eab308', gradient: 'linear-gradient(135deg, #ca8a04, #fef08a, #eab308)' },
  { id: 'silver_frost', nameVi: 'Sóc Bạc Tuyết Trắng ❄️', descVi: 'Sắc xám bạc mùa đông tinh anh, nhanh nhẹn.', color: '#cbd5e1' },
  { id: 'shadow_night', nameVi: 'Sóc Bóng Đêm 🌙', descVi: 'Huyền bí lướt nhẹ trên cành cây ban đêm.', color: '#1e293b' },
  {
    id: 'galaxy_star',
    nameVi: 'Sóc Tinh Vân Galaxy 🌌',
    descVi: 'Tỏa sáng lấp lánh tinh tú vũ trụ kì ảo.',
    color: '#9333ea',
    gradient: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
    questHint: 'Thưởng Nhiệm vụ Thần Rừng',
  },
];

const ACCESSORIES: { id: BunnyAccessory; nameVi: string; icon: string; descVi: string; questHint?: string }[] = [
  { id: 'none', nameVi: 'Tự Nhiên', icon: '✨', descVi: 'Đơn giản, mộc mạc và đáng yêu.' },
  { id: 'flower', nameVi: 'Hoa Cài Tai', icon: '🌸', descVi: 'Bông hoa hồng cài bên vành tai mềm mại.' },
  { id: 'straw_hat', nameVi: 'Nón Rơm Thám Hiểm', icon: '👒', descVi: 'Che nắng khi dạo chơi quanh khu rừng.', questHint: 'Nhiệm vụ 8 Cà Rốt' },
  { id: 'red_ribbon', nameVi: 'Nơ Đỏ Quý Phái', icon: '🎀', descVi: 'Chiếc nơ đỏ rực rỡ trước cổ áo.' },
  { id: 'carrot_pack', nameVi: 'Balo Rừng Xanh', icon: '🎒', descVi: 'Đựng đầy quả sồi, dâu và cà rốt mọng.', questHint: 'Nhiệm vụ Giúp Sóc Nhí' },
  { id: 'glasses', nameVi: 'Kính Bác Học', icon: '👓', descVi: 'Cặp kính tròn thông thái, đáng yêu.', questHint: 'Nhiệm vụ Gặp Vịt Cốm' },
  { id: 'rainbow_wreath', nameVi: 'Vòng Hoa Cầu Vồng', icon: '🌈', descVi: 'Vòng hoa ngát hương do bé Nhím kết.', questHint: 'Nhiệm vụ Cỏ 4 Lá' },
  { id: 'fairy_wings', nameVi: 'Cánh Tiên Bướm', icon: '🧚', descVi: 'Cánh bướm thần tiên bay bổng.', questHint: 'Nhiệm vụ Tàn Tích Cổ' },
  { id: 'crown', nameVi: 'Vương Miện Rừng Xanh', icon: '👑', descVi: 'Vương miện lấp lánh của thủ lĩnh rừng xanh.' },
];

export const BunnyWardrobeModal: React.FC<BunnyWardrobeModalProps> = ({
  isOpen,
  onClose,
  characterType,
  onSelectCharacter,
  currentSkin,
  currentAccessory,
  unlockedSkins = ['white', 'caramel', 'pink', 'spotted', 'shadow', 'golden', 'galaxy'],
  unlockedSquirrelSkins = ['chestnut', 'red_fur', 'golden_autumn', 'silver_frost', 'shadow_night', 'galaxy_star'],
  unlockedAccessories = ['none', 'flower', 'straw_hat', 'red_ribbon', 'carrot_pack', 'glasses', 'rainbow_wreath', 'fairy_wings', 'crown'],
  onSelectSkin,
  onSelectAccessory,
}) => {
  if (!isOpen) return null;

  const currentSkinList = characterType === 'squirrel' ? SQUIRREL_SKINS : BUNNY_SKINS;
  const currentUnlockedSkins = characterType === 'squirrel' ? unlockedSquirrelSkins : unlockedSkins;

  return (
    <div id="wardrobe-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div
        id="wardrobe-modal-card"
        className="relative w-full max-w-lg bg-slate-900/95 border-2 border-pink-500/30 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(244,63,94,0.15)] text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide">Nhân Vật & Tủ Đồ</h2>
              <p className="text-xs text-slate-300">Chọn hóa thân thành Thỏ Con hoặc Sóc Nhí trèo cây</p>
            </div>
          </div>
          <button
            id="btn-close-wardrobe"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Character Selector Toggle */}
        <div className="mt-4 p-1.5 bg-black/40 rounded-2xl border border-white/10 flex items-center gap-2">
          <button
            id="btn-select-char-bunny"
            onClick={() => {
              sounds.playHop();
              onSelectCharacter('bunny');
              onSelectSkin('white');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
              characterType === 'bunny'
                ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-lg">🐰</span>
            <span>Thỏ Con Nhút Nhát</span>
          </button>

          <button
            id="btn-select-char-squirrel"
            onClick={() => {
              sounds.playClimb();
              onSelectCharacter('squirrel');
              onSelectSkin('chestnut');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all ${
              characterType === 'squirrel'
                ? 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-amber-950 shadow-md scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-lg">🐿️</span>
            <span>Sóc Nhí Trèo Cây</span>
          </button>
        </div>

        {/* Character Trait Banner */}
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-amber-400/20 text-[11px] text-amber-300 flex items-center gap-2">
          <span className="text-base">{characterType === 'squirrel' ? '🌰' : '🥕'}</span>
          <span>
            {characterType === 'squirrel'
              ? 'Sóc nhí có thể nhảy cao, trèo thân cây, chạy dọc dây leo và hái quả sồi, táo ngọt mọng nước!'
              : 'Thỏ con di chuyển êm ái, bứt tốc độ cao, có khả năng đào hang và nhặt cà rốt siêu nhanh!'}
          </span>
        </div>

        {/* Section 1: Fur Skin */}
        <div className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
            <span>✨</span> 1. Màu Sắc Bộ Lông ({characterType === 'squirrel' ? 'Sóc Nhí' : 'Thỏ Con'})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {currentSkinList.map((s) => {
              const isSelected = currentSkin === s.id;
              const isUnlocked = currentUnlockedSkins.includes(s.id as any);

              return (
                <button
                  key={s.id}
                  id={`skin-opt-${s.id}`}
                  disabled={!isUnlocked}
                  onClick={() => {
                    if (characterType === 'squirrel') sounds.playAcornMunch();
                    else sounds.playMunch();
                    onSelectSkin(s.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all relative ${
                    !isUnlocked
                      ? 'bg-black/30 border-white/5 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-4 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white/40 shadow-md flex items-center justify-center flex-shrink-0"
                    style={{
                      background: s.gradient || s.color,
                      backgroundColor: s.color,
                    }}
                  >
                    {!isUnlocked ? (
                      <Lock className="w-4 h-4 text-white" />
                    ) : (
                      isSelected && <Check className={`w-5 h-5 ${s.id === 'white' || s.id === 'pink' ? 'text-slate-900 font-black' : 'text-white font-black'}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-sm text-white flex items-center gap-1.5 truncate">
                      {s.nameVi}
                    </div>
                    <div className="text-xs text-slate-300 leading-tight truncate">
                      {!isUnlocked ? s.questHint || 'Cần mở khóa nhiệm vụ' : s.descVi}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Accessories */}
        <div className="mt-6">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-3 flex items-center gap-1.5">
            <span>🎀</span> 2. Phụ Kiện Đáng Yêu
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ACCESSORIES.map((acc) => {
              const isSelected = currentAccessory === acc.id;
              const isUnlocked = unlockedAccessories.includes(acc.id);

              return (
                <button
                  key={acc.id}
                  id={`accessory-opt-${acc.id}`}
                  disabled={!isUnlocked}
                  onClick={() => {
                    sounds.playChirp();
                    onSelectAccessory(acc.id);
                  }}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all relative ${
                    !isUnlocked
                      ? 'bg-black/30 border-white/5 opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 ring-4 ring-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {!isUnlocked ? (
                    <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center mb-1 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                  ) : (
                    <span className="text-2xl mb-1.5 transform hover:scale-110 transition-transform">{acc.icon}</span>
                  )}
                  <span className="font-extrabold text-xs text-white">{acc.nameVi}</span>
                  <span className="text-[11px] text-slate-300 mt-1 line-clamp-1">
                    {!isUnlocked ? acc.questHint || 'Cần nhiệm vụ' : acc.descVi}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            id="btn-confirm-wardrobe"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 hover:from-amber-400 hover:to-amber-200 text-amber-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all text-sm border border-amber-200/50"
          >
            Hoàn Tất Tuyệt Vời ✨
          </button>
        </div>
      </div>
    </div>
  );
};

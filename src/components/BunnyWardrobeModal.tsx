import React from 'react';
import { BunnyAccessory, BunnySkin } from '../types';
import { X, Sparkles, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface BunnyWardrobeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkin: BunnySkin;
  currentAccessory: BunnyAccessory;
  onSelectSkin: (skin: BunnySkin) => void;
  onSelectAccessory: (acc: BunnyAccessory) => void;
}

const SKINS: { id: BunnySkin; nameVi: string; descVi: string; color: string }[] = [
  { id: 'white', nameVi: 'Thỏ Trắng Tuyết', descVi: 'Bộ lông trắng muốt như bông gòn.', color: '#ffffff' },
  { id: 'caramel', nameVi: 'Thỏ Vàng Caramel', descVi: 'Màu nâu vàng óng ánh ấm áp như mật ong.', color: '#fcd34d' },
  { id: 'pink', nameVi: 'Thỏ Hồng Đào', descVi: 'Sắc hồng ngọt ngào cánh hoa anh đào.', color: '#fbcfe8' },
  { id: 'spotted', nameVi: 'Thỏ Đốm Dễ Thương', descVi: 'Đốm đen trắng tinh nghịch hiếu động.', color: '#94a3b8' },
  { id: 'shadow', nameVi: 'Thỏ Bóng Đêm', descVi: 'Huyền bí với đôi mắt phát sáng lấp lánh.', color: '#334155' },
];

const ACCESSORIES: { id: BunnyAccessory; nameVi: string; icon: string; descVi: string }[] = [
  { id: 'none', nameVi: 'Tự Nhiên', icon: '🐰', descVi: 'Đơn giản, mộc mạc và đáng yêu.' },
  { id: 'flower', nameVi: 'Hoa Cài Tai', icon: '🌸', descVi: 'Bông hoa hồng cài bên vành tai mềm mại.' },
  { id: 'straw_hat', nameVi: 'Nón Cói Thám Hiểm', icon: '👒', descVi: 'Che nắng khi dạo chơi quanh khu rừng.' },
  { id: 'red_ribbon', nameVi: 'Nơ Đỏ Quý Phái', icon: '🎀', descVi: 'Chiếc nơ đỏ rực rỡ trước cổ áo.' },
  { id: 'carrot_pack', nameVi: 'Balo Cà Rốt', icon: '🎒', descVi: 'Đựng đầy cà rốt thơm ngon giòn rụm.' },
  { id: 'glasses', nameVi: 'Kính Bác Học', icon: '👓', descVi: 'Cặp kính tròn thông thái, đáng yêu.' },
];

export const BunnyWardrobeModal: React.FC<BunnyWardrobeModalProps> = ({
  isOpen,
  onClose,
  currentSkin,
  currentAccessory,
  onSelectSkin,
  onSelectAccessory,
}) => {
  if (!isOpen) return null;

  return (
    <div id="wardrobe-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        id="wardrobe-modal-card"
        className="relative w-full max-w-lg bg-slate-900/95 border-2 border-pink-500/30 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(244,63,94,0.15)] text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-lg">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide">Tủ Đồ Chú Thỏ</h2>
              <p className="text-xs text-slate-300">Chọn màu lông và phụ kiện thời trang cho bạn thỏ</p>
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

        {/* Section 1: Fur Skin */}
        <div className="mt-5">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
            <span>✨</span> 1. Màu Sắc Bộ Lông
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SKINS.map((s) => {
              const isSelected = currentSkin === s.id;
              return (
                <button
                  key={s.id}
                  id={`skin-opt-${s.id}`}
                  onClick={() => {
                    sounds.playMunch();
                    onSelectSkin(s.id);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-4 ring-amber-400/20 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-white/40 shadow-md flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  >
                    {isSelected && <Check className={`w-5 h-5 ${s.id === 'white' || s.id === 'pink' ? 'text-slate-900 font-black' : 'text-white font-black'}`} />}
                  </div>
                  <div>
                    <div className="font-extrabold text-sm text-white">{s.nameVi}</div>
                    <div className="text-xs text-slate-300 leading-tight">{s.descVi}</div>
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
              return (
                <button
                  key={acc.id}
                  id={`accessory-opt-${acc.id}`}
                  onClick={() => {
                    sounds.playChirp();
                    onSelectAccessory(acc.id);
                  }}
                  className={`flex flex-col items-center text-center p-3 rounded-2xl border-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-400 ring-4 ring-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <span className="text-2xl mb-1.5 transform hover:scale-110 transition-transform">{acc.icon}</span>
                  <span className="font-extrabold text-xs text-white">{acc.nameVi}</span>
                  <span className="text-[11px] text-slate-300 mt-1 line-clamp-1">{acc.descVi}</span>
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
            Hoàn Tất Xinh Đẹp ✨
          </button>
        </div>
      </div>
    </div>
  );
};

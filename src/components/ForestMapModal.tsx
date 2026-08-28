import React from 'react';
import { DiscoveryStats } from '../types';
import { FOREST_ZONES } from '../utils/forestWorld';
import { X, Map, Compass, Award, Footprints } from 'lucide-react';

interface ForestMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DiscoveryStats;
  currentZone: string;
}

export const ForestMapModal: React.FC<ForestMapModalProps> = ({
  isOpen,
  onClose,
  stats,
  currentZone,
}) => {
  if (!isOpen) return null;

  return (
    <div id="forest-map-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        id="forest-map-modal-card"
        className="relative w-full max-w-2xl bg-slate-900/95 border-2 border-emerald-500/30 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide">Bản Đồ Khu Rừng Diệu Kỳ</h2>
              <p className="text-xs text-slate-300">Khám phá các vùng đất và theo dõi hành trình của bạn</p>
            </div>
          </div>
          <button
            id="btn-close-map"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Discovery Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div className="bg-gradient-to-b from-amber-500/15 to-transparent border-2 border-amber-400/30 rounded-2xl p-3 text-center shadow-lg">
            <span className="text-2xl">🥕</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{stats.carrots}</div>
            <div className="text-[10px] text-amber-300/80 uppercase tracking-widest font-black">Cà Rốt Đã Ăn</div>
          </div>
          <div className="bg-gradient-to-b from-pink-500/15 to-transparent border-2 border-pink-400/30 rounded-2xl p-3 text-center shadow-lg">
            <span className="text-2xl">🫐</span>
            <div className="text-2xl font-black text-pink-400 mt-1">{stats.berries}</div>
            <div className="text-[10px] text-pink-300/80 uppercase tracking-widest font-black">Dâu Rừng Hái</div>
          </div>
          <div className="bg-gradient-to-b from-emerald-500/15 to-transparent border-2 border-emerald-400/30 rounded-2xl p-3 text-center shadow-lg">
            <span className="text-2xl">🍀</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{stats.clovers}</div>
            <div className="text-[10px] text-emerald-300/80 uppercase tracking-widest font-black">Cỏ May Mắn</div>
          </div>
          <div className="bg-gradient-to-b from-sky-500/15 to-transparent border-2 border-sky-400/30 rounded-2xl p-3 text-center shadow-lg">
            <span className="text-2xl">🐾</span>
            <div className="text-2xl font-black text-sky-400 mt-1">{stats.stepsCount}</div>
            <div className="text-[10px] text-sky-300/80 uppercase tracking-widest font-black">Bước Chân Nhảy</div>
          </div>
        </div>

        {/* Forest Zones List & Map Overview */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-400" /> Các Vùng Rừng & Vị Trí Hiện Tại
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FOREST_ZONES.map((zone) => {
              const isCurrent = currentZone === zone.nameVi;
              const isVisited = stats.areasVisited.includes(zone.nameVi);

              return (
                <div
                  key={zone.nameVi}
                  className={`p-4 rounded-2xl border-2 transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] ring-4 ring-emerald-400/20 scale-[1.01]'
                      : isVisited
                      ? 'bg-white/5 border-white/15'
                      : 'bg-black/40 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{zone.icon}</span>
                      <div>
                        <div className="font-extrabold text-sm text-white flex items-center gap-2">
                          {zone.nameVi}
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-400 text-emerald-950 font-black shadow-sm">
                              ĐANG Ở ĐÂY
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-300 leading-tight mt-0.5">{zone.descriptionVi}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secret Tips */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-400/30 text-amber-100 text-xs leading-relaxed space-y-1.5 shadow-lg">
          <div className="font-extrabold flex items-center gap-1.5 text-amber-300 text-sm">
            <Award className="w-4 h-4 text-amber-400" /> Bí Quyết Thám Hiểm Rừng Xanh:
          </div>
          <p>• Dẫn chú thỏ lại gần <strong>Tổ Thỏ</strong> hoặc <strong>Hang Bí Mật</strong> rồi nhấn phím <kbd className="px-1.5 py-0.5 bg-black/50 rounded border border-white/20 font-mono text-amber-200">Cách (Space)</kbd> / nút Nhảy để dịch chuyển tức thời!</p>
          <p>• Dạo bước qua <strong>Cầu Gỗ</strong> bắc qua suối để gặp bác Vịt Cốm và đến Rừng Nấm Phát Sáng.</p>
          <p>• Dẫn thỏ lại gần các bạn động vật rừng (Sóc Nhí, Nhím, Hươu Sao) để trò chuyện và kết bạn!</p>
        </div>

        {/* Close Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            id="btn-confirm-map"
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black shadow-[0_4px_20px_rgba(20,184,166,0.4)] active:scale-95 transition-all text-sm border border-teal-200/50"
          >
            Tiếp Tục Đi Dạo 🐇
          </button>
        </div>
      </div>
    </div>
  );
};

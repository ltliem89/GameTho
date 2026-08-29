import React from 'react';
import { X, Gamepad2, MousePointer, Sparkles, Footprints } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="help-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        id="help-modal-card"
        className="relative w-full max-w-lg bg-slate-900/95 border-2 border-amber-400/30 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)] text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 shadow-lg font-black">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide">Cách Dẫn Chú Thỏ Đi Rừng</h2>
              <p className="text-xs text-slate-300">Hướng dẫn điều khiển và khám phá</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Affirmation Box */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-emerald-500/25 border-2 border-emerald-400/40 shadow-lg">
          <div className="flex items-center gap-2 text-emerald-300 font-black text-base">
            <span>✨</span> Hoàn toàn được nhé!
          </div>
          <p className="text-xs text-slate-100 mt-1 leading-relaxed font-medium">
            Bạn có thể tự do dẫn chú thỏ đi dạo tới lui khắp khu rừng rộng lớn, qua suối, thăm vườn cà rốt thơm ngon và khám phá những điều kỳ thú!
          </p>
        </div>

        {/* Controls Guide */}
        <div className="mt-5 space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <span>🎮</span> Các Cách Điều Khiển:
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-sky-500/15 to-transparent border-2 border-sky-400/30 shadow-md">
              <div className="font-black text-white flex items-center gap-1.5 mb-1.5 text-sm text-sky-300">
                <Gamepad2 className="w-4 h-4 text-sky-400" /> Bàn Phím (Máy tính)
              </div>
              <p className="text-slate-200 leading-relaxed">
                • Dùng phím <strong>Mũi tên</strong> hoặc <strong>W, A, S, D</strong> để đi tới lui.<br />
                • Phím <strong>Cách (Space)</strong>: Nhảy lò cò.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-pink-500/15 to-transparent border-2 border-pink-400/30 shadow-md">
              <div className="font-black text-white flex items-center gap-1.5 mb-1.5 text-sm text-pink-300">
                <MousePointer className="w-4 h-4 text-pink-400" /> Chạm / Nhấn Chuột
              </div>
              <p className="text-slate-200 leading-relaxed">
                • Nhấn hoặc chạm trực tiếp vào bất cứ vị trí nào trên bãi cỏ, chú thỏ sẽ tự chạy tới đó!
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-amber-500/15 to-transparent border-2 border-amber-400/30 shadow-md sm:col-span-2">
              <div className="font-black text-white flex items-center gap-1.5 mb-1.5 text-sm text-amber-300">
                <Footprints className="w-4 h-4 text-amber-400" /> Màn Hình Cảm Ứng (Điện thoại / iPad)
              </div>
              <p className="text-slate-200 leading-relaxed">
                • Sử dụng <strong>Cần xoay ảo Joypad tròn</strong> ở góc dưới bên trái để dẫn thỏ đi mượt mà.<br />
                • Nhấn nút tròn <strong>Nhảy</strong> ở góc dưới bên phải.
              </p>
            </div>
          </div>
        </div>

        {/* Activities */}
        <div className="mt-5 space-y-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-pink-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-400" /> Hoạt Động Thú Vị:
          </h3>
          <ul className="text-xs text-slate-200 space-y-1.5 list-disc list-inside leading-relaxed bg-white/5 p-3.5 rounded-2xl border-2 border-white/10">
            <li>Thu hoạch <span className="text-amber-400 font-black">Cà rốt giòn</span> và quả <span className="text-pink-400 font-black">Dâu rừng</span> thơm phức.</li>
            <li>Đi qua chiếc <span className="text-sky-300 font-black">Cầu Gỗ</span> bắc qua dòng suối róc rách.</li>
            <li>Gặp gỡ và nói chuyện với các bạn động vật rừng: Sóc Nhí, Bé Nhím, Vịt Cốm, Hươu Sao.</li>
            <li>Mở <span className="text-purple-300 font-black">Tủ Đồ</span> để thử nhiều bộ lông và nón cói, nơ đỏ đáng yêu!</li>
            <li>Bật chế độ thời tiết <span className="text-sky-300 font-black">Trời Mưa (Rain)</span> để ngắm mưa rơi lất phất kèm tiếng mưa rào êm dịu và vòng sóng nước!</li>
            <li>Đổi thời tiết sang <span className="text-indigo-300 font-black">Ban Đêm</span> để chiêm ngưỡng nấm phát sáng và đàn đom đóm lung linh!</li>
          </ul>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 text-amber-950 font-black shadow-[0_4px_20px_rgba(245,158,11,0.4)] active:scale-95 transition-all text-sm border border-amber-200/50"
          >
            Bắt Đầu Chơi Ngay 🐇✨
          </button>
        </div>
      </div>
    </div>
  );
};

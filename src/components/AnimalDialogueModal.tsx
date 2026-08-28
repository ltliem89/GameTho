import React from 'react';
import { ForestAnimal } from '../types';
import { X, MessageCircleHeart, Heart } from 'lucide-react';
import { sounds } from '../utils/audio';

interface AnimalDialogueModalProps {
  animal: ForestAnimal | null;
  onClose: () => void;
}

export const AnimalDialogueModal: React.FC<AnimalDialogueModalProps> = ({ animal, onClose }) => {
  if (!animal) return null;

  const getAnimalIcon = (type: ForestAnimal['type']) => {
    switch (type) {
      case 'squirrel': return '🐿️';
      case 'duck': return '🦆';
      case 'hedgehog': return '🦔';
      case 'deer': return '🦌';
      case 'frog': return '🐸';
      case 'bird': return '🐦';
      default: return '🐾';
    }
  };

  return (
    <div id="animal-dialogue-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        id="animal-dialogue-card"
        className="relative w-full max-w-md bg-slate-900/95 border-2 border-pink-500/30 rounded-3xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(244,63,94,0.15)] text-slate-100 animate-scaleUp"
      >
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
              <MessageCircleHeart className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="font-extrabold text-lg text-white">Bạn Động Vật Trong Rừng</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col items-center text-center my-5">
          <div className="w-22 h-22 rounded-full bg-gradient-to-tr from-emerald-500/30 via-teal-500/20 to-emerald-400/30 border-3 border-emerald-400/50 flex items-center justify-center text-5xl shadow-[0_0_25px_rgba(16,185,129,0.3)] mb-3 animate-bounce">
            {getAnimalIcon(animal.type)}
          </div>
          <h4 className="text-2xl font-black text-white">{animal.name}</h4>
          <span className="text-xs px-3.5 py-1 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 text-emerald-300 border border-emerald-400/30 rounded-full font-black mt-1 shadow-sm">
            Bạn thân rừng xanh 🌲
          </span>

          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border-2 border-white/15 text-slate-100 text-sm font-medium italic relative shadow-inner">
            <span className="text-pink-400 font-black text-lg">“</span>
            <span className="leading-relaxed">{animal.currentDialogue || animal.dialogueVi[0]}</span>
            <span className="text-pink-400 font-black text-lg">”</span>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playChirp();
              const randomMsg = animal.dialogueVi[Math.floor(Math.random() * animal.dialogueVi.length)];
              animal.currentDialogue = randomMsg;
            }}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30 border-2 border-pink-400/40 text-pink-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
          >
            <Heart className="w-4 h-4 text-pink-400 fill-current animate-pulse" /> Nói Chuyện Thêm
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 text-amber-950 font-black text-xs shadow-[0_4px_15px_rgba(245,158,11,0.4)] transition-all active:scale-95 border border-amber-200/50"
          >
            Tạm Biệt Nhé 🥕
          </button>
        </div>
      </div>
    </div>
  );
};

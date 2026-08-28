import React, { useRef, useState, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

interface TouchControlsProps {
  onVectorChange: (vector: { x: number; y: number } | null) => void;
  onJump: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({ onVectorChange, onJump }) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeTouchId = useRef<number | null>(null);
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);

  // D-Pad button handlers
  const handleButtonPress = (dir: 'up' | 'down' | 'left' | 'right') => {
    setActiveKey(dir);
    if (dir === 'up') onVectorChange({ x: 0, y: -1 });
    if (dir === 'down') onVectorChange({ x: 0, y: 1 });
    if (dir === 'left') onVectorChange({ x: -1, y: 0 });
    if (dir === 'right') onVectorChange({ x: 1, y: 0 });
  };

  const handleButtonRelease = () => {
    setActiveKey(null);
    onVectorChange(null);
  };

  // Virtual Analog Stick Touch Handlers
  const handleJoystickTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const touch = e.changedTouches[0];
      activeTouchId.current = touch.identifier;
      setIsJoystickActive(true);
      updateJoystickVector(touch.clientX, touch.clientY);
    },
    []
  );

  const handleJoystickTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!isJoystickActive) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          updateJoystickVector(touch.clientX, touch.clientY);
          break;
        }
      }
    },
    [isJoystickActive]
  );

  const handleJoystickTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      e.stopPropagation();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === activeTouchId.current) {
          activeTouchId.current = null;
          setIsJoystickActive(false);
          setKnobPos({ x: 0, y: 0 });
          onVectorChange(null);
          break;
        }
      }
    },
    [onVectorChange]
  );

  const updateJoystickVector = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;
    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const maxRadius = rect.width / 2 - 10;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance === 0) {
      setKnobPos({ x: 0, y: 0 });
      onVectorChange(null);
      return;
    }

    const clampedDist = Math.min(distance, maxRadius);
    const normalizedX = dx / distance;
    const normalizedY = dy / distance;

    setKnobPos({
      x: normalizedX * clampedDist,
      y: normalizedY * clampedDist,
    });

    onVectorChange({
      x: (dx / maxRadius),
      y: (dy / maxRadius),
    });
  };

  return (
    <div id="touch-controls-container" className="pointer-events-none fixed inset-x-0 bottom-6 z-20 flex justify-between items-end px-6 md:px-12">
      {/* Left side: Analog Joypad + DPad */}
      <div className="pointer-events-auto flex items-center gap-4">
        {/* Virtual Joystick for fluid walking */}
        <div
          ref={joystickBaseRef}
          id="virtual-joystick-base"
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className="relative w-28 h-28 rounded-full bg-slate-900/75 backdrop-blur-lg border-2 border-emerald-400/30 shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_2px_8px_rgba(16,185,129,0.15)] flex items-center justify-center select-none touch-none"
        >
          <div className="absolute w-12 h-12 rounded-full border border-emerald-400/20" />
          <div
            id="virtual-joystick-knob"
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
            className={`w-13 h-13 rounded-full shadow-2xl flex items-center justify-center transition-all ${
              isJoystickActive
                ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-amber-950 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-amber-200'
                : 'bg-white/90 text-slate-800 border-2 border-white/40'
            }`}
          >
            <span className="text-base font-extrabold">🐰</span>
          </div>
        </div>

        {/* Small D-Pad for discrete click controls */}
        <div id="dpad-buttons" className="hidden sm:grid grid-cols-3 gap-1.5 p-2.5 rounded-2xl bg-slate-900/75 backdrop-blur-lg border border-white/20 shadow-xl">
          <div />
          <button
            id="btn-dpad-up"
            onMouseDown={() => handleButtonPress('up')}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
            onTouchStart={() => handleButtonPress('up')}
            onTouchEnd={handleButtonRelease}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all font-bold ${
              activeKey === 'up'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-95 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
            aria-label="Đi lên"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            id="btn-dpad-left"
            onMouseDown={() => handleButtonPress('left')}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
            onTouchStart={() => handleButtonPress('left')}
            onTouchEnd={handleButtonRelease}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all font-bold ${
              activeKey === 'left'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-95 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
            aria-label="Đi sang trái"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            id="btn-dpad-down"
            onMouseDown={() => handleButtonPress('down')}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
            onTouchStart={() => handleButtonPress('down')}
            onTouchEnd={handleButtonRelease}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all font-bold ${
              activeKey === 'down'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-95 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
            aria-label="Đi xuống"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          <button
            id="btn-dpad-right"
            onMouseDown={() => handleButtonPress('right')}
            onMouseUp={handleButtonRelease}
            onMouseLeave={handleButtonRelease}
            onTouchStart={() => handleButtonPress('right')}
            onTouchEnd={handleButtonRelease}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all font-bold ${
              activeKey === 'right'
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 scale-95 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                : 'bg-white/10 hover:bg-white/20 border border-white/10'
            }`}
            aria-label="Đi sang phải"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Right side: Action Jump Button */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          id="btn-jump-action"
          onClick={onJump}
          onTouchStart={(e) => {
            e.stopPropagation();
            onJump();
          }}
          className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-amber-950 font-black flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(245,158,11,0.5)] active:scale-90 transition-transform border-3 border-amber-100 hover:shadow-[0_8px_35px_rgba(245,158,11,0.7)]"
          aria-label="Nhảy lò cò"
        >
          <Sparkles className="w-7 h-7 animate-pulse text-amber-900" />
          <span className="text-xs tracking-widest uppercase font-black mt-0.5">Nhảy</span>
        </button>
      </div>
    </div>
  );
};

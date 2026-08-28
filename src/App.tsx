import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TouchControls } from './components/TouchControls';
import { TopHeader } from './components/TopHeader';
import { BunnyWardrobeModal } from './components/BunnyWardrobeModal';
import { ForestMapModal } from './components/ForestMapModal';
import { AnimalDialogueModal } from './components/AnimalDialogueModal';
import { HelpModal } from './components/HelpModal';
import { BunnyAccessory, BunnySkin, DiscoveryStats, ForestAnimal, WeatherType } from './types';
import { sounds } from './utils/audio';
import { Sparkles, ArrowRight, Gamepad2 } from 'lucide-react';

export default function App() {
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [bunnySkin, setBunnySkin] = useState<BunnySkin>('white');
  const [bunnyAccessory, setBunnyAccessory] = useState<BunnyAccessory>('flower');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [currentZone, setCurrentZone] = useState<string>('Thảm Cỏ Nhà Thỏ');
  
  const [stats, setStats] = useState<DiscoveryStats>({
    carrots: 0,
    berries: 0,
    clovers: 0,
    animalsTalked: [],
    burrowsFound: 0,
    areasVisited: ['Thảm Cỏ Nhà Thỏ'],
    stepsCount: 0,
  });

  // Audio state
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [musicActive, setMusicActive] = useState<boolean>(false);

  // Modals state
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [selectedAnimal, setSelectedAnimal] = useState<ForestAnimal | null>(null);

  // Virtual Joypad & Jump controls
  const [joystickVector, setJoystickVector] = useState<{ x: number; y: number } | null>(null);
  const [jumpSignal, setJumpSignal] = useState<number>(0);

  // Welcome Toast / Intro popup banner
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Handle first user interaction to unlock Web Audio API
  useEffect(() => {
    const handleFirstGesture = () => {
      sounds.init();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  const handleToggleSound = () => {
    const nextState = sounds.toggleSound();
    setSoundActive(nextState);
  };

  const handleToggleMusic = () => {
    const nextState = sounds.toggleMusic();
    setMusicActive(nextState);
  };

  const handleToggleSpeed = () => {
    sounds.playHop();
    setSpeedMultiplier((prev) => (prev === 1 ? 1.65 : 1));
  };

  const handleJumpAction = () => {
    setJumpSignal((prev) => prev + 1);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 select-none touch-none">
      {/* 1. Top HUD Header */}
      <TopHeader
        stats={stats}
        currentZone={currentZone}
        weather={weather}
        onWeatherChange={(w) => {
          sounds.playChirp();
          setWeather(w);
        }}
        soundActive={soundActive}
        musicActive={musicActive}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        speedMultiplier={speedMultiplier}
        onToggleSpeed={handleToggleSpeed}
        onOpenWardrobe={() => setIsWardrobeOpen(true)}
        onOpenMap={() => setIsMapOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Interactive 2D Canvas Forest Engine */}
      <main className="w-full h-full">
        <GameCanvas
          weather={weather}
          bunnySkin={bunnySkin}
          bunnyAccessory={bunnyAccessory}
          speedMultiplier={speedMultiplier}
          onStatsUpdate={setStats}
          onZoneChange={setCurrentZone}
          onAnimalInteract={setSelectedAnimal}
          joystickVector={joystickVector}
          onJumpTriggered={handleJumpAction}
          jumpSignal={jumpSignal}
        />
      </main>

      {/* 3. On-Screen Touch / Joystick & Jump Controls */}
      <TouchControls
        onVectorChange={setJoystickVector}
        onJump={handleJumpAction}
      />

      {/* 4. Welcome Quick Greeting Banner */}
      {showWelcome && (
        <div
          id="welcome-greeting-banner"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-sm sm:max-w-md w-[92%] bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-400/50 rounded-3xl p-4.5 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.25)] animate-bounce"
        >
          <div className="flex items-center gap-3.5">
            <span className="text-3xl sm:text-4xl filter drop-shadow-md">🐰</span>
            <div className="flex-1">
              <h1 className="text-sm font-black text-white flex items-center gap-1.5">
                <span>Được chứ! Đi rừng cùng Chú Thỏ nào!</span>
                <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
              </h1>
              <p className="text-xs text-slate-200 mt-1 leading-snug font-medium">
                Dùng phím <strong className="text-amber-300">Mũi tên / WASD</strong>, cần xoay cảm ứng hoặc <strong className="text-emerald-300">nhấn chuột</strong> vào bãi cỏ để dẫn chú thỏ đi dạo khắp khu rừng nhé!
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playMunch();
                setShowWelcome(false);
              }}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1 border border-emerald-200/50 whitespace-nowrap"
            >
              Chơi ngay <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      <BunnyWardrobeModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        currentSkin={bunnySkin}
        currentAccessory={bunnyAccessory}
        onSelectSkin={setBunnySkin}
        onSelectAccessory={setBunnyAccessory}
      />

      <ForestMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        stats={stats}
        currentZone={currentZone}
      />

      <AnimalDialogueModal
        animal={selectedAnimal}
        onClose={() => setSelectedAnimal(null)}
      />

      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { TouchControls } from './components/TouchControls';
import { TopHeader } from './components/TopHeader';
import { BunnyWardrobeModal } from './components/BunnyWardrobeModal';
import { ForestMapModal } from './components/ForestMapModal';
import { AnimalDialogueModal } from './components/AnimalDialogueModal';
import { HelpModal } from './components/HelpModal';
import { BunnyUpgradesModal } from './components/BunnyUpgradesModal';
import { QuestsModal } from './components/QuestsModal';
import { BunnyAccessory, BunnySkin, BunnyUpgrades, DiscoveryStats, ForestAnimal, Quest, WeatherType } from './types';
import { sounds } from './utils/audio';
import { Sparkles, ArrowRight } from 'lucide-react';

const INITIAL_UPGRADES: BunnyUpgrades = {
  level: 1,
  speedLevel: 0,
  magnetLevel: 0,
  shieldLevel: 0,
  superHopLevel: 0,
  harvestLuckLevel: 0,
};

const INITIAL_QUESTS: Quest[] = [
  {
    id: 'quest_carrots_1',
    titleVi: 'Bữa Tiệc Cà Rốt Tươi',
    descVi: 'Ăn 5 củ cà rốt ngon lành trên bãi cỏ nông trại.',
    icon: '🥕',
    category: 'carrot',
    targetCount: 5,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+10 Cà rốt & Nón Rơm Thám Hiểm 👒',
    rewardCarrots: 10,
    rewardAccessory: 'straw_hat',
  },
  {
    id: 'quest_berries_1',
    titleVi: 'Hái Dâu Rừng Mọng Nước',
    descVi: 'Thu hoạch 4 chùm dâu rừng ngọt lịm ven bờ suối.',
    icon: '🫐',
    category: 'explore',
    targetCount: 4,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+15 Cà rốt & Nơ Đỏ Quý Phái 🎀',
    rewardCarrots: 15,
    rewardAccessory: 'red_ribbon',
  },
  {
    id: 'quest_clover_1',
    titleVi: 'Cỏ 4 Lá May Mắn',
    descVi: 'Tìm thấy 2 nhánh cỏ 4 lá huyền bí giữa rừng sâu.',
    icon: '🍀',
    category: 'secret',
    targetCount: 2,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+20 Cà rốt & Vòng Hoa Cầu Vồng 🌈',
    rewardCarrots: 20,
    rewardAccessory: 'rainbow_wreath',
  },
  {
    id: 'quest_animals_1',
    titleVi: 'Kết Bạn Muôn Thú',
    descVi: 'Trò chuyện và giao lưu cùng 3 bạn thú rừng đáng yêu.',
    icon: '🐿️',
    category: 'animal',
    targetCount: 3,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+25 Cà rốt & Kính Bác Học 👓',
    rewardCarrots: 25,
    rewardAccessory: 'glasses',
  },
  {
    id: 'quest_explore_zones',
    titleVi: 'Thám Hiểm Rừng Xanh',
    descVi: 'Ghé thăm 4 vùng đất khác nhau trên bản đồ khu rừng.',
    icon: '🗺️',
    category: 'explore',
    targetCount: 4,
    currentCount: 1,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+30 Cà rốt & Balo Cà Rốt 🎒',
    rewardCarrots: 30,
    rewardAccessory: 'carrot_pack',
  },
  {
    id: 'quest_golden_carrot',
    titleVi: 'Kho Báu Cà Rốt Hoàng Kim',
    descVi: 'Thu hoạch ít nhất 1 củ Cà Rốt Hoàng Kim lấp lánh.',
    icon: '✨',
    category: 'secret',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+50 Cà rốt & Thỏ Vàng Hoàng Kim ✨',
    rewardCarrots: 50,
    rewardSkin: 'golden',
  },
  {
    id: 'quest_burrow_secret',
    titleVi: 'Hang Cổ Thần Bí',
    descVi: 'Tìm thấy hang thỏ bí mật và kích hoạt dịch chuyển tức thời.',
    icon: '🕳️',
    category: 'secret',
    targetCount: 1,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+40 Cà rốt & Thỏ Vũ Trụ Galaxy 🌌 & Cánh Tiên Bướm 🧚',
    rewardCarrots: 40,
    rewardSkin: 'galaxy',
    rewardAccessory: 'fairy_wings',
  },
];

export default function App() {
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [bunnySkin, setBunnySkin] = useState<BunnySkin>('white');
  const [bunnyAccessory, setBunnyAccessory] = useState<BunnyAccessory>('flower');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [currentZone, setCurrentZone] = useState<string>('Thảm Cỏ Nhà Thỏ');

  const [stats, setStats] = useState<DiscoveryStats>({
    score: 0,
    carrots: 15, // Starting bonus for immediate fun
    berries: 0,
    clovers: 0,
    goldenCarrots: 0,
    animalsTalked: [],
    burrowsFound: 0,
    areasVisited: ['Thảm Cỏ Nhà Thỏ'],
    stepsCount: 0,
    hazardsAvoidedOrHit: 0,
    questsCompletedCount: 0,
    unlockedSkins: ['white', 'caramel', 'pink', 'spotted', 'shadow'],
    unlockedAccessories: ['none', 'flower', 'red_ribbon', 'crown'],
    upgrades: INITIAL_UPGRADES,
  });

  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);

  // Audio state
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [musicActive, setMusicActive] = useState<boolean>(false);

  // Modals state
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState<boolean>(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState<boolean>(false);
  const [selectedAnimal, setSelectedAnimal] = useState<ForestAnimal | null>(null);

  // Virtual Joypad & Jump controls
  const [joystickVector, setJoystickVector] = useState<{ x: number; y: number } | null>(null);
  const [jumpSignal, setJumpSignal] = useState<number>(0);

  // Welcome Toast / Intro popup banner
  const [showWelcome, setShowWelcome] = useState<boolean>(true);

  // Update Quests progress dynamically when stats change
  useEffect(() => {
    setQuests((prevQuests) =>
      prevQuests.map((quest) => {
        let currentCount = quest.currentCount;
        if (quest.id === 'quest_carrots_1') {
          currentCount = stats.carrots;
        } else if (quest.id === 'quest_berries_1') {
          currentCount = stats.berries;
        } else if (quest.id === 'quest_clover_1') {
          currentCount = stats.clovers;
        } else if (quest.id === 'quest_animals_1') {
          currentCount = stats.animalsTalked.length;
        } else if (quest.id === 'quest_explore_zones') {
          currentCount = stats.areasVisited.length;
        } else if (quest.id === 'quest_golden_carrot') {
          currentCount = stats.goldenCarrots;
        } else if (quest.id === 'quest_burrow_secret') {
          currentCount = stats.burrowsFound;
        }

        const isCompleted = currentCount >= quest.targetCount;
        return {
          ...quest,
          currentCount,
          completed: isCompleted,
        };
      })
    );
  }, [stats]);

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

  // Upgrades skill handler
  const handleUpgradeSkill = (skillKey: keyof Omit<BunnyUpgrades, 'level'>, cost: number) => {
    if (stats.carrots < cost) return;

    setStats((prev) => ({
      ...prev,
      carrots: prev.carrots - cost,
      upgrades: {
        ...prev.upgrades,
        [skillKey]: (prev.upgrades[skillKey] || 0) + 1,
      },
    }));
  };

  // Bunny Level Up handler
  const handleLevelUpBunny = (cost: number) => {
    if (stats.carrots < cost) return;

    setStats((prev) => ({
      ...prev,
      carrots: prev.carrots - cost,
      upgrades: {
        ...prev.upgrades,
        level: Math.min(5, (prev.upgrades.level || 1) + 1),
      },
    }));
  };

  // Claim Quest Reward handler
  const handleClaimQuestReward = (quest: Quest) => {
    if (!quest.completed || quest.rewardClaimed) return;

    sounds.playQuestComplete();

    setQuests((prev) =>
      prev.map((q) => (q.id === quest.id ? { ...q, rewardClaimed: true } : q))
    );

    setStats((prev) => {
      const newUnlockedSkins = quest.rewardSkin && !prev.unlockedSkins.includes(quest.rewardSkin)
        ? [...prev.unlockedSkins, quest.rewardSkin]
        : prev.unlockedSkins;

      const newUnlockedAccessories = quest.rewardAccessory && !prev.unlockedAccessories.includes(quest.rewardAccessory)
        ? [...prev.unlockedAccessories, quest.rewardAccessory]
        : prev.unlockedAccessories;

      return {
        ...prev,
        carrots: prev.carrots + (quest.rewardCarrots || 0),
        questsCompletedCount: prev.questsCompletedCount + 1,
        unlockedSkins: newUnlockedSkins,
        unlockedAccessories: newUnlockedAccessories,
      };
    });
  };

  const readyQuestsCount = quests.filter((q) => q.completed && !q.rewardClaimed).length;

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
        onOpenQuests={() => setIsQuestsOpen(true)}
        onOpenUpgrades={() => setIsUpgradesOpen(true)}
        readyQuestsCount={readyQuestsCount}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Interactive 2D Canvas Forest Engine */}
      <main className="w-full h-full">
        <GameCanvas
          weather={weather}
          bunnySkin={bunnySkin}
          bunnyAccessory={bunnyAccessory}
          speedMultiplier={speedMultiplier}
          upgrades={stats.upgrades}
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
                <span>Đi rừng cùng Chú Thỏ nào!</span>
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
        unlockedSkins={stats.unlockedSkins}
        unlockedAccessories={stats.unlockedAccessories}
        onSelectSkin={setBunnySkin}
        onSelectAccessory={setBunnyAccessory}
      />

      <ForestMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        stats={stats}
        currentZone={currentZone}
      />

      <BunnyUpgradesModal
        isOpen={isUpgradesOpen}
        onClose={() => setIsUpgradesOpen(false)}
        carrots={stats.carrots}
        upgrades={stats.upgrades}
        onUpgradeSkill={handleUpgradeSkill}
        onLevelUpBunny={handleLevelUpBunny}
      />

      <QuestsModal
        isOpen={isQuestsOpen}
        onClose={() => setIsQuestsOpen(false)}
        quests={quests}
        onClaimReward={handleClaimQuestReward}
        onSelectWardrobe={() => {
          setIsQuestsOpen(false);
          setIsWardrobeOpen(true);
        }}
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

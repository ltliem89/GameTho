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
import { AchievementsModal } from './components/AchievementsModal';
import { RescueDialogueModal } from './components/RescueDialogueModal';
import {
  BunnyAccessory,
  BunnySkin,
  BunnyUpgrades,
  CharacterType,
  DiscoveryStats,
  EnvironmentalRescue,
  ForestAnimal,
  Quest,
  SquirrelSkin,
  WeatherType,
} from './types';
import { getInitialAchievements, getInitialRescues } from './utils/forestWorld';
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
    id: 'quest_eco_hero',
    titleVi: 'Hiệp Sĩ Giải Cứu Môi Trường',
    descVi: 'Hoàn thành ít nhất 2 nhiệm vụ giải cứu muôn thú và dọn sạch rừng xanh.',
    icon: '🛡️',
    category: 'animal',
    targetCount: 2,
    currentCount: 0,
    completed: false,
    rewardClaimed: false,
    rewardTextVi: '+50 Cà rốt & Vòng Nguyệt Quế Rừng Xanh 🌿',
    rewardCarrots: 50,
    rewardAccessory: 'rainbow_wreath',
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
    rewardTextVi: '+20 Cà rốt & Vương Miện Hoàng Gia 👑',
    rewardCarrots: 20,
    rewardAccessory: 'crown',
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
  const [characterType, setCharacterType] = useState<CharacterType>('bunny');
  const [bunnySkin, setBunnySkin] = useState<BunnySkin>('white');
  const [squirrelSkin, setSquirrelSkin] = useState<SquirrelSkin>('chestnut');
  const [bunnyAccessory, setBunnyAccessory] = useState<BunnyAccessory>('flower');
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [currentZone, setCurrentZone] = useState<string>('Thảm Cỏ Nhà Thỏ');

  const [stats, setStats] = useState<DiscoveryStats>({
    score: 0,
    carrots: 15, // Starting bonus for immediate fun
    berries: 0,
    clovers: 0,
    goldenCarrots: 0,
    apples: 0,
    acorns: 0,
    treesClimbed: 0,
    vinesTraversed: 0,
    characterType: 'bunny',
    witheredPlantsRevived: 0,
    rescuesCompleted: [],
    ecoScore: 0,
    xp: 0,
    playerLevel: 1,
    animalsTalked: [],
    burrowsFound: 0,
    areasVisited: ['Thảm Cỏ Nhà Thỏ'],
    bridgesCrossed: [],
    stepsCount: 0,
    hazardsAvoidedOrHit: 0,
    questsCompletedCount: 0,
    unlockedSkins: ['white', 'caramel', 'pink', 'spotted', 'shadow'],
    unlockedSquirrelSkins: ['chestnut', 'red_fur', 'golden_autumn', 'silver_frost', 'shadow_night'],
    unlockedAccessories: ['none', 'flower', 'red_ribbon', 'crown'],
    upgrades: INITIAL_UPGRADES,
    achievements: getInitialAchievements(),
  });

  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [rescues, setRescues] = useState<EnvironmentalRescue[]>(getInitialRescues());

  // Audio state
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [musicActive, setMusicActive] = useState<boolean>(false);

  // Modals state
  const [isWardrobeOpen, setIsWardrobeOpen] = useState<boolean>(false);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState<boolean>(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState<boolean>(false);
  const [isAchievementsOpen, setIsAchievementsOpen] = useState<boolean>(false);
  const [selectedAnimal, setSelectedAnimal] = useState<ForestAnimal | null>(null);
  const [selectedRescue, setSelectedRescue] = useState<EnvironmentalRescue | null>(null);

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
        } else if (quest.id === 'quest_eco_hero') {
          currentCount = (stats.rescuesCompleted || []).length;
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

  // Synchronize Weather & Rain Ambient Audio
  useEffect(() => {
    sounds.setWeather(weather);
  }, [weather, soundActive]);

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

  // Rescue completion handler
  const handleCompleteRescue = (completedRescue: EnvironmentalRescue) => {
    setRescues((prev) =>
      prev.map((r) => (r.id === completedRescue.id ? { ...r, status: 'saved', progress: 100 } : r))
    );

    setStats((prev) => {
      const alreadySaved = prev.rescuesCompleted?.includes(completedRescue.id);
      if (alreadySaved) return prev;

      const newRescuesCompleted = [...(prev.rescuesCompleted || []), completedRescue.id];
      const newEcoScore = (prev.ecoScore || 0) + 25;
      const newCarrots = prev.carrots + completedRescue.rewardCarrots;
      const newXp = (prev.xp || 0) + completedRescue.rewardXp;
      const newPlayerLevel = Math.min(5, Math.floor(newXp / 100) + 1);

      return {
        ...prev,
        carrots: newCarrots,
        xp: newXp,
        playerLevel: newPlayerLevel,
        rescuesCompleted: newRescuesCompleted,
        ecoScore: newEcoScore,
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
          sounds.setWeather(w);
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
        onOpenAchievements={() => setIsAchievementsOpen(true)}
        readyQuestsCount={readyQuestsCount}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 2. Interactive 2D Canvas Forest Engine */}
      <main className="w-full h-full">
        <GameCanvas
          weather={weather}
          characterType={characterType}
          bunnySkin={bunnySkin}
          squirrelSkin={squirrelSkin}
          bunnyAccessory={bunnyAccessory}
          speedMultiplier={speedMultiplier}
          upgrades={stats.upgrades}
          rescues={rescues}
          onStatsUpdate={setStats}
          onZoneChange={setCurrentZone}
          onAnimalInteract={setSelectedAnimal}
          onRescueInteract={setSelectedRescue}
          joystickVector={joystickVector}
          onJumpTriggered={handleJumpAction}
          jumpSignal={jumpSignal}
        />
      </main>

      {/* 3. On-Screen Touch / Joystick & Jump Controls */}
      <TouchControls
        characterType={characterType}
        onVectorChange={setJoystickVector}
        onJump={handleJumpAction}
      />

      {/* 4. Welcome Quick Greeting Banner */}
      {showWelcome && (
        <div
          id="welcome-greeting-banner"
          className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-sm sm:max-w-md w-[92%] bg-slate-900/95 backdrop-blur-xl border-2 border-emerald-400/50 rounded-2xl sm:rounded-3xl p-3 sm:p-4.5 shadow-[0_15px_40px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.25)] animate-bounce select-none"
        >
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <span className="text-2xl sm:text-4xl filter drop-shadow-md">{characterType === 'squirrel' ? '🐿️' : '🐰'}</span>
            <div className="flex-1 min-w-0">
              <h1 className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                <span>{characterType === 'squirrel' ? 'Dạo chơi cùng Bé Sóc Tinh Nghịch!' : 'Đi rừng cùng Chú Thỏ!'}</span>
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400 fill-current animate-pulse" />
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-200 mt-0.5 sm:mt-1 leading-snug font-medium line-clamp-2 sm:line-clamp-none">
                Dùng <strong className="text-amber-300">cần xoay ảo / chạm cỏ</strong> hoặc phím <strong className="text-emerald-300">WASD / Mũi tên</strong> để dạo chơi, leo cây và hái quả nhé!
              </p>
            </div>
            <button
              onClick={() => {
                sounds.playMunch();
                setShowWelcome(false);
              }}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-emerald-950 font-black text-[11px] sm:text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1 border border-emerald-200/50 whitespace-nowrap"
            >
              Chơi ngay <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 5. Modals */}
      <BunnyWardrobeModal
        isOpen={isWardrobeOpen}
        onClose={() => setIsWardrobeOpen(false)}
        characterType={characterType}
        onSelectCharacter={(type) => {
          setCharacterType(type);
          setStats((prev) => ({ ...prev, characterType: type }));
        }}
        currentSkin={characterType === 'squirrel' ? squirrelSkin : bunnySkin}
        currentAccessory={bunnyAccessory}
        unlockedSkins={stats.unlockedSkins}
        unlockedSquirrelSkins={stats.unlockedSquirrelSkins}
        unlockedAccessories={stats.unlockedAccessories}
        onSelectSkin={(skin) => {
          if (characterType === 'squirrel') {
            setSquirrelSkin(skin as SquirrelSkin);
          } else {
            setBunnySkin(skin as BunnySkin);
          }
        }}
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

      <AchievementsModal
        isOpen={isAchievementsOpen}
        onClose={() => setIsAchievementsOpen(false)}
        achievements={stats.achievements || getInitialAchievements()}
        totalScore={stats.score || stats.carrots * 10}
      />

      <RescueDialogueModal
        rescue={selectedRescue}
        onClose={() => setSelectedRescue(null)}
        onCompleteRescue={handleCompleteRescue}
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

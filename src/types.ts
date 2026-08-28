export type Direction = 'left' | 'right' | 'up' | 'down';

export type BunnySkin = 'white' | 'caramel' | 'spotted' | 'pink' | 'shadow' | 'golden' | 'galaxy';
export type BunnyAccessory = 'none' | 'flower' | 'straw_hat' | 'red_ribbon' | 'carrot_pack' | 'glasses' | 'crown' | 'fairy_wings' | 'witch_hat' | 'rainbow_wreath';

export type WeatherType = 'sunny' | 'afternoon' | 'night' | 'rainy';

export interface Position {
  x: number;
  y: number;
}

export interface BunnyUpgrades {
  level: number; // 1 to 5
  speedLevel: number; // +move speed
  magnetLevel: number; // magnet pull radius
  shieldLevel: number; // hazard immunity / resistance
  superHopLevel: number; // jump height and flight duration
  harvestLuckLevel: number; // bonus carrot multiplier / double drops
}

export interface BunnyEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  targetX?: number;
  targetY?: number;
  isMoving: boolean;
  facing: 'left' | 'right';
  hopPhase: number;
  jumpHeight: number;
  isJumping: boolean;
  skin: BunnySkin;
  accessory: BunnyAccessory;
  carrotsEaten: number;
  cloversFound: number;
  berriesPicked: number;
  hurtTimer: number; // for flashing red when touching hazardous plants
  shieldTimer: number; // golden shield active timer
  auraPhase: number;
}

export interface CollectibleItem {
  id: string;
  type: 'carrot' | 'berry' | 'clover' | 'golden_carrot' | 'flower_sniff' | 'chest_treasure';
  x: number;
  y: number;
  collected: boolean;
  respawnTimer?: number; // countdown until regrowth (0 = regrown)
  maxRespawnTimer?: number;
  regrowProgress?: number; // 0 to 1 for visual sprout scaling
  bobPhase: number;
}

export type HazardType = 'poison_mushroom' | 'thorn_bush' | 'wild_chili' | 'toxic_nightshade';

export interface HazardPlant {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  nameVi: string;
  warningVi: string;
  penaltyCarrots: number;
  pulsePhase: number;
  eatenCooldown: number;
}

export interface ForestDecor {
  id: string;
  type:
    | 'tree_oak'
    | 'tree_pine'
    | 'tree_blossom'
    | 'tree_apple'
    | 'tree_golden'
    | 'tree_willow'
    | 'tree_birch'
    | 'tree_maple'
    | 'bush'
    | 'mushroom_red'
    | 'mushroom_glow'
    | 'mushroom_giant'
    | 'flower_cluster'
    | 'lotus_pad'
    | 'rock'
    | 'stump'
    | 'carrot_patch'
    | 'burrow'
    | 'bridge'
    | 'wooden_fence'
    | 'bench'
    | 'water_pond'
    | 'ancient_ruin'
    | 'lantern_pole';
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: 'back' | 'obstacle' | 'front';
  collidable?: boolean;
  interactive?: boolean;
}

export interface ForestAnimal {
  id: string;
  type:
    | 'bird'
    | 'squirrel'
    | 'hedgehog'
    | 'duck'
    | 'deer'
    | 'frog'
    | 'fox'
    | 'owl'
    | 'panda'
    | 'turtle'
    | 'fairy_butterfly';
  name: string;
  nameVi: string;
  x: number;
  y: number;
  initialX: number;
  initialY: number;
  facing: 'left' | 'right';
  state: 'idle' | 'walking' | 'sleeping' | 'happy';
  stateTimer: number;
  dialogueVi: string[];
  currentDialogue?: string;
  dialogueTimer: number;
  questHintVi?: string;
  hasQuestAvailable?: boolean;
  questCompletedForAnimal?: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'dust' | 'leaf' | 'sparkle' | 'rain' | 'splash' | 'heart' | 'firefly' | 'ripple' | 'petal' | 'smoke' | 'skull' | 'magnet_spark';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
  life: number;
  maxLife: number;
  isPositive: boolean;
}

export interface Footstep {
  x: number;
  y: number;
  alpha: number;
  facing: 'left' | 'right';
}

export interface Quest {
  id: string;
  titleVi: string;
  descVi: string;
  icon: string;
  category: 'carrot' | 'animal' | 'explore' | 'secret';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardClaimed: boolean;
  rewardTextVi: string;
  rewardCarrots: number;
  rewardSkin?: BunnySkin;
  rewardAccessory?: BunnyAccessory;
  targetId?: string;
}

export interface InteractivePlant {
  id: string;
  nameVi: string;
  x: number;
  y: number;
  state: 'withered' | 'watered' | 'bloomed';
  waterProgress: number; // 0 to 100
  bloomTimer: number;
  bloomType: 'rainbow_lotus' | 'sun_sunflower' | 'crystal_orchid';
  hintVi: string;
}

export interface Achievement {
  id: string;
  titleVi: string;
  descVi: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'explore' | 'collect' | 'nature' | 'social';
  rewardCarrots: number;
  rewardXp: number;
}

export interface DiscoveryStats {
  score: number;
  carrots: number;
  berries: number;
  clovers: number;
  goldenCarrots: number;
  apples: number;
  witheredPlantsRevived: number;
  xp: number;
  playerLevel: number;
  animalsTalked: string[];
  burrowsFound: number;
  areasVisited: string[];
  bridgesCrossed: string[]; // ids of 3 bridges crossed
  stepsCount: number;
  hazardsAvoidedOrHit: number;
  questsCompletedCount: number;
  unlockedSkins: BunnySkin[];
  unlockedAccessories: BunnyAccessory[];
  upgrades: BunnyUpgrades;
  achievements: Achievement[];
}


export type Direction = 'left' | 'right' | 'up' | 'down';

export type CharacterType = 'bunny' | 'squirrel';

export type BunnySkin = 'white' | 'caramel' | 'spotted' | 'pink' | 'shadow' | 'golden' | 'galaxy';
export type SquirrelSkin = 'chestnut' | 'red_fur' | 'golden_autumn' | 'silver_frost' | 'shadow_night' | 'galaxy_star';

export type BunnyAccessory = 'none' | 'flower' | 'straw_hat' | 'red_ribbon' | 'carrot_pack' | 'glasses' | 'crown' | 'fairy_wings' | 'witch_hat' | 'rainbow_wreath';

export type WeatherType = 'sunny' | 'afternoon' | 'night' | 'rainy' | 'rain';

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
  characterType?: CharacterType;
  skin: BunnySkin | SquirrelSkin;
  accessory: BunnyAccessory;
  carrotsEaten: number;
  cloversFound: number;
  berriesPicked: number;
  acornsEaten?: number;
  applesEaten?: number;
  hurtTimer: number; // for flashing red when touching hazardous plants
  shieldTimer: number; // golden shield active timer
  auraPhase: number;
  isClimbing?: boolean;
  climbTreeId?: string;
  climbProgress?: number; // 0 to 1 along trunk/branch
  onVineId?: string;
  vineProgress?: number; // 0 to 1 along vine
  isGliding?: boolean;
}

export type CollectibleType =
  | 'carrot'
  | 'berry'
  | 'clover'
  | 'golden_carrot'
  | 'flower_sniff'
  | 'chest_treasure'
  | 'apple'
  | 'acorn'
  | 'fallen_fruit'
  | 'golden_acorn';

export interface CollectibleItem {
  id: string;
  type: CollectibleType;
  x: number;
  y: number;
  collected: boolean;
  respawnTimer?: number; // countdown until regrowth (0 = regrown)
  maxRespawnTimer?: number;
  regrowProgress?: number; // 0 to 1 for visual sprout scaling
  bobPhase: number;
  isTreeFruit?: boolean;
  attachedTreeId?: string;
  isFallenFruit?: boolean;
}

export interface ForestVine {
  id: string;
  fromTreeId: string;
  toTreeId: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  sag: number;
  leaves?: {
    t: number;
    side: number;
    size: number;
    angle: number;
  }[];
  fruits: {
    id: string;
    type: 'acorn' | 'apple' | 'berry';
    t: number; // 0 to 1 along vine
    collected: boolean;
    respawnTimer: number;
  }[];
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

export interface TreeFruit {
  id: string;
  type: 'apple' | 'acorn' | 'golden_acorn';
  relX: number;
  relY: number;
  collected: boolean;
  respawnTimer: number;
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
    | 'tree_acorn_oak'
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
    | 'lantern_pole'
    | 'squirrel_hollow';
  x: number;
  y: number;
  width: number;
  height: number;
  layer?: 'back' | 'obstacle' | 'front';
  collidable?: boolean;
  interactive?: boolean;
  fruits?: TreeFruit[];
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
    | 'fairy_butterfly'
    | 'crocodile';
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
  category: 'carrot' | 'animal' | 'explore' | 'secret' | 'nature';
  targetCount: number;
  currentCount: number;
  completed: boolean;
  rewardClaimed: boolean;
  rewardTextVi: string;
  rewardCarrots: number;
  rewardSkin?: BunnySkin;
  rewardSquirrelSkin?: SquirrelSkin;
  rewardAccessory?: BunnyAccessory;
  targetId?: string;
}

export interface EnvironmentalRescue {
  id: string;
  type: 'hedgehog_thorns' | 'stream_trash' | 'wildfire_ember' | 'fallen_nest' | 'withered_sprout';
  titleVi: string;
  victimNameVi: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'in_distress' | 'rescuing' | 'saved';
  progress: number; // 0 to 100
  rescueActionVi: string; // e.g. "Gỡ Bụi Gai", "Dọn Rác Thải", "Dập Tắt Lửa", "Cứu Tổ Chim", "Tưới Mát Cây"
  icon: string;
  dialogueBefore: string;
  dialogueSaved: string;
  rewardCarrots: number;
  rewardXp: number;
  rewardItemVi?: string;
  ecoTipVi: string;
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
  category: 'explore' | 'collect' | 'nature' | 'social' | 'secret';
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
  acorns: number;
  treesClimbed: number;
  vinesTraversed: number;
  characterType: CharacterType;
  witheredPlantsRevived: number;
  rescuesCompleted: string[]; // ids of rescued environmental missions
  ecoScore: number;
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
  unlockedSquirrelSkins: SquirrelSkin[];
  unlockedAccessories: BunnyAccessory[];
  upgrades: BunnyUpgrades;
  achievements: Achievement[];
}


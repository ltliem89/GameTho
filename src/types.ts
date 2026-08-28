export type Direction = 'left' | 'right' | 'up' | 'down';

export type BunnySkin = 'white' | 'caramel' | 'spotted' | 'pink' | 'shadow' | 'golden' | 'galaxy';
export type BunnyAccessory = 'none' | 'flower' | 'straw_hat' | 'red_ribbon' | 'carrot_pack' | 'glasses' | 'crown' | 'fairy_wings' | 'witch_hat' | 'rainbow_wreath';

export type WeatherType = 'sunny' | 'afternoon' | 'night' | 'rainy';

export interface Position {
  x: number;
  y: number;
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
}

export interface CollectibleItem {
  id: string;
  type: 'carrot' | 'berry' | 'clover' | 'golden_carrot' | 'flower_sniff' | 'chest_treasure';
  x: number;
  y: number;
  collected: boolean;
  respawnTimer?: number;
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
  type: 'bird' | 'squirrel' | 'hedgehog' | 'duck' | 'deer' | 'frog';
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
  type: 'dust' | 'leaf' | 'sparkle' | 'rain' | 'splash' | 'heart' | 'firefly' | 'ripple' | 'petal' | 'smoke' | 'skull';
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

export interface DiscoveryStats {
  score: number;
  carrots: number;
  berries: number;
  clovers: number;
  goldenCarrots: number;
  animalsTalked: string[];
  burrowsFound: number;
  areasVisited: string[];
  stepsCount: number;
  hazardsAvoidedOrHit: number;
  questsCompletedCount: number;
  unlockedSkins: BunnySkin[];
  unlockedAccessories: BunnyAccessory[];
}


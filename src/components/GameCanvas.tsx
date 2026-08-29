import React, { useEffect, useRef, useCallback } from 'react';
import {
  BunnyAccessory,
  BunnyEntity,
  BunnySkin,
  CollectibleItem,
  DiscoveryStats,
  Footstep,
  ForestAnimal,
  ForestDecor,
  Particle,
  WeatherType,
  BunnyUpgrades,
  EnvironmentalRescue,
} from '../types';
import {
  FOREST_BIOMES,
  generateInitialWorld,
  getInitialRescues,
  checkBunnyCollision,
  getRiverCenterX,
  RIVER_HALF_WIDTH,
  BRIDGES,
  isPointInRiver,
  isPointOnBridge,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../utils/forestWorld';
import { sounds } from '../utils/audio';

interface GameCanvasProps {
  weather: WeatherType;
  bunnySkin: BunnySkin;
  bunnyAccessory: BunnyAccessory;
  speedMultiplier: number;
  upgrades?: BunnyUpgrades;
  rescues?: EnvironmentalRescue[];
  onRescueInteract?: (rescue: EnvironmentalRescue) => void;
  onStatsUpdate: (updater: (prev: DiscoveryStats) => DiscoveryStats) => void;
  onZoneChange: (zoneNameVi: string) => void;
  onAnimalInteract: (animal: ForestAnimal) => void;
  joystickVector: { x: number; y: number } | null;
  onJumpTriggered: () => void;
  jumpSignal: number;
}

export interface RiverFish {
  id: string;
  y: number;
  speed: number;
  dirY: number; // 1 = down, -1 = up
  offsetX: number; // -45 to 45
  size: number; // 10 to 18
  colorType: 'koi_gold' | 'trout_silver' | 'minnow_cyan' | 'koi_calico';
  swimPhase: number;
  wiggleSpeed: number;
  jumpTimer: number;
  isJumping: boolean;
  jumpProgress: number;
  jumpArcHeight: number;
}

export interface SparseGrassClump {
  x: number;
  y: number;
  blades: Array<{
    dx: number;
    h: number;
    bend: number;
    shade: string;
  }>;
  flower?: {
    type: 'daisy' | 'lavender' | 'pink_petal' | 'clover_sprout';
    color: string;
    centerColor?: string;
  };
}

const DEFAULT_UPGRADES: BunnyUpgrades = {
  level: 1,
  speedLevel: 0,
  magnetLevel: 0,
  shieldLevel: 0,
  superHopLevel: 0,
  harvestLuckLevel: 0,
};

export const GameCanvas: React.FC<GameCanvasProps> = ({
  weather,
  bunnySkin,
  bunnyAccessory,
  speedMultiplier,
  upgrades = DEFAULT_UPGRADES,
  rescues,
  onRescueInteract,
  onStatsUpdate,
  onZoneChange,
  onAnimalInteract,
  joystickVector,
  jumpSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core Game State
  const bunnyRef = useRef<BunnyEntity>({
    x: 450,
    y: 450,
    vx: 0,
    vy: 0,
    speed: 3.8,
    isMoving: false,
    facing: 'right',
    hopPhase: 0,
    jumpHeight: 0,
    isJumping: false,
    skin: bunnySkin,
    accessory: bunnyAccessory,
    carrotsEaten: 0,
    cloversFound: 0,
    berriesPicked: 0,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const clickTarget = useRef<{ x: number; y: number; active: boolean; timer: number } | null>(null);

  const decorsRef = useRef<ForestDecor[]>([]);
  const collectiblesRef = useRef<CollectibleItem[]>([]);
  const animalsRef = useRef<ForestAnimal[]>([]);
  const rescuesRef = useRef<EnvironmentalRescue[]>(rescues || getInitialRescues());
  const particlesRef = useRef<Particle[]>([]);
  const footstepsRef = useRef<Footstep[]>([]);
  const butterFliesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; phase: number }>>([]);
  const firefliesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; glow: number }>>([]);
  const riverFishRef = useRef<RiverFish[]>([]);
  const sparseGrassRef = useRef<SparseGrassClump[]>([]);
  const rainDropsRef = useRef<Array<{ x: number; y: number; length: number; speed: number; vx: number; vy: number; opacity: number; width: number; targetY: number }>>([]);
  const rainRipplesRef = useRef<Array<{ x: number; y: number; radius: number; maxRadius: number; alpha: number; speed: number }>>([]);
  const lightningFlashRef = useRef<{ alpha: number; nextFlashTimer: number }>({ alpha: 0, nextFlashTimer: 600 });

  const currentZoneRef = useRef<string>('Thảm Cỏ Nhà Thỏ');
  const animationFrameId = useRef<number>(0);
  const prevJumpSignal = useRef<number>(jumpSignal);
  const hazardCooldownRef = useRef<number>(0);

  // Sync Skin & Accessory to ref
  useEffect(() => {
    bunnyRef.current.skin = bunnySkin;
    bunnyRef.current.accessory = bunnyAccessory;
  }, [bunnySkin, bunnyAccessory]);

  // Sync Rescues from props
  useEffect(() => {
    if (rescues && rescues.length > 0) {
      rescuesRef.current = rescues;
    }
  }, [rescues]);

  // Jump action
  const doJump = useCallback(() => {
    const bunny = bunnyRef.current;
    if (!bunny.isJumping) {
      bunny.isJumping = true;
      bunny.jumpHeight = 0.01;
      sounds.playHop();

      // Create hop dust particles
      for (let i = 0; i < 6; i++) {
        particlesRef.current.push({
          x: bunny.x + (Math.random() * 16 - 8),
          y: bunny.y + 12,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -Math.random() * 0.8,
          size: Math.random() * 3 + 2,
          color: '#d1d5db',
          alpha: 0.7,
          life: 0,
          maxLife: 20,
          type: 'dust',
        });
      }
    }
  }, []);

  // Handle jump signal from external UI button
  useEffect(() => {
    if (jumpSignal !== prevJumpSignal.current) {
      prevJumpSignal.current = jumpSignal;
      doJump();
    }
  }, [jumpSignal, doJump]);

  // Initialize World Once
  useEffect(() => {
    const initial = generateInitialWorld();
    decorsRef.current = initial.decors;
    collectiblesRef.current = initial.collectibles;
    animalsRef.current = initial.animals;

    // Butterflies
    const bFlies = [];
    for (let i = 0; i < 28; i++) {
      bFlies.push({
        x: 300 + Math.random() * (WORLD_WIDTH - 600),
        y: 300 + Math.random() * (WORLD_HEIGHT - 600),
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        color: ['#f472b6', '#fbbf24', '#a78bfa', '#60a5fa', '#f87171', '#34d399'][Math.floor(Math.random() * 6)],
        phase: Math.random() * Math.PI * 2,
      });
    }
    butterFliesRef.current = bFlies;

    // Fireflies
    const fFlies = [];
    for (let i = 0; i < 45; i++) {
      fFlies.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        glow: Math.random(),
      });
    }
    firefliesRef.current = fFlies;

    // River Swimming Fish (Cá lội mương / suối)
    const fishColors: Array<'koi_gold' | 'trout_silver' | 'minnow_cyan' | 'koi_calico'> = [
      'koi_gold',
      'koi_calico',
      'trout_silver',
      'minnow_cyan',
      'koi_gold',
      'trout_silver',
    ];
    const fishes: RiverFish[] = [];
    for (let i = 0; i < 24; i++) {
      const startY = 120 + (i * (WORLD_HEIGHT - 240)) / 24 + (Math.random() * 60 - 30);
      fishes.push({
        id: `river_fish_${i}`,
        y: startY,
        speed: 0.6 + Math.random() * 0.7,
        dirY: Math.random() < 0.5 ? 1 : -1,
        offsetX: (Math.random() - 0.5) * (RIVER_HALF_WIDTH * 1.2),
        size: 11 + Math.random() * 6,
        colorType: fishColors[i % fishColors.length],
        swimPhase: Math.random() * Math.PI * 2,
        wiggleSpeed: 0.08 + Math.random() * 0.05,
        jumpTimer: 180 + Math.floor(Math.random() * 600),
        isJumping: false,
        jumpProgress: 0,
        jumpArcHeight: 14 + Math.random() * 10,
      });
    }
    riverFishRef.current = fishes;

    // Sparse Grass Clusters Across Ground (Cỏ lưa thưa dưới chân)
    const grassClumps: SparseGrassClump[] = [];
    const grassShades = ['#15803d', '#16a34a', '#22c55e', '#4ade80', '#84cc16', '#65a30d'];
    for (let i = 0; i < 360; i++) {
      const gx = 100 + Math.random() * (WORLD_WIDTH - 200);
      const gy = 100 + Math.random() * (WORLD_HEIGHT - 200);

      // Skip inside deep river stream
      if (isPointInRiver(gx, gy)) continue;

      const bladeCount = 3 + Math.floor(Math.random() * 3);
      const blades = [];
      for (let b = 0; b < bladeCount; b++) {
        blades.push({
          dx: (b - bladeCount / 2) * 3.5 + (Math.random() * 2 - 1),
          h: 8 + Math.random() * 10,
          bend: (Math.random() - 0.5) * 6,
          shade: grassShades[Math.floor(Math.random() * grassShades.length)],
        });
      }

      let flower: SparseGrassClump['flower'] = undefined;
      const flowerRoll = Math.random();
      if (flowerRoll < 0.12) {
        flower = { type: 'daisy', color: '#ffffff', centerColor: '#facc15' };
      } else if (flowerRoll < 0.2) {
        flower = { type: 'lavender', color: '#c084fc', centerColor: '#e9d5ff' };
      } else if (flowerRoll < 0.28) {
        flower = { type: 'pink_petal', color: '#f472b6', centerColor: '#fde047' };
      } else if (flowerRoll < 0.36) {
        flower = { type: 'clover_sprout', color: '#22c55e' };
      }

      grassClumps.push({
        x: gx,
        y: gy,
        blades,
        flower,
      });
    }
    sparseGrassRef.current = grassClumps;
  }, []);

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }
      keysPressed.current[e.key.toLowerCase()] = true;
      if (e.key === 'ArrowUp') keysPressed.current['arrowup'] = true;
      if (e.key === 'ArrowDown') keysPressed.current['arrowdown'] = true;
      if (e.key === 'ArrowLeft') keysPressed.current['arrowleft'] = true;
      if (e.key === 'ArrowRight') keysPressed.current['arrowright'] = true;
      if (e.key === ' ' || e.code === 'Space') {
        doJump();
      }
      clickTarget.current = null;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
      if (e.key === 'ArrowUp') keysPressed.current['arrowup'] = false;
      if (e.key === 'ArrowDown') keysPressed.current['arrowdown'] = false;
      if (e.key === 'ArrowLeft') keysPressed.current['arrowleft'] = false;
      if (e.key === 'ArrowRight') keysPressed.current['arrowright'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [doJump]);

  // Canvas Click/Touch to navigate
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickScreenX = (clientX - rect.left) * scaleX;
    const clickScreenY = (clientY - rect.top) * scaleY;

    // Convert Screen to World Coords
    const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunnyRef.current.x - canvas.width / 2));
    const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunnyRef.current.y - canvas.height / 2));

    const worldTargetX = clickScreenX + cameraX;
    const worldTargetY = clickScreenY + cameraY;

    // Check if clicked near an Environmental Rescue
    for (const rescue of rescuesRef.current) {
      const dist = Math.hypot(rescue.x - worldTargetX, rescue.y - worldTargetY);
      if (dist < 55) {
        onRescueInteract?.(rescue);
        sounds.playChirp();
        return;
      }
    }

    clickTarget.current = {
      x: worldTargetX,
      y: worldTargetY,
      active: true,
      timer: 0,
    };

    sounds.playChirp();
  };

  // Trigger Animal Dialogue
  const triggerAnimalDialogue = (animal: ForestAnimal) => {
    animal.dialogueTimer = 180;
    const dialogues = animal.dialogueVi || [];
    if (dialogues.length > 0) {
      const randomIdx = Math.floor(Math.random() * dialogues.length);
      animal.currentDialogue = dialogues[randomIdx];
    }
    sounds.playAnimalSound(animal.type);
    onAnimalInteract(animal);

    onStatsUpdate((prev) => {
      if (!prev.animalsTalked.includes(animal.id)) {
        return {
          ...prev,
          animalsTalked: [...prev.animalsTalked, animal.id],
        };
      }
      return prev;
    });
  };

  // Main Game Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Responsive Canvas Resizing
    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    let stepTimer = 0;
    let rainSpawnTimer = 0;

    const gameLoop = (currentTime: number) => {
      if (!canvas || !ctx) return;

      const bunny = bunnyRef.current;

      // 1. Calculate Upgraded Speed
      const speedBonus = 1 + (upgrades.speedLevel * 0.15);
      const superHopBonus = 1 + (upgrades.superHopLevel * 0.25);
      const baseSpeed = bunny.speed * speedMultiplier * speedBonus;

      let moveX = 0;
      let moveY = 0;

      // Joystick Vector Input
      if (joystickVector && (Math.abs(joystickVector.x) > 0.05 || Math.abs(joystickVector.y) > 0.05)) {
        moveX = joystickVector.x * baseSpeed;
        moveY = joystickVector.y * baseSpeed;
      }
      // Keyboard Controls
      else {
        const k = keysPressed.current;
        if (k['arrowleft'] || k['a']) moveX -= baseSpeed;
        if (k['arrowright'] || k['d']) moveX += baseSpeed;
        if (k['arrowup'] || k['w']) moveY -= baseSpeed;
        if (k['arrowdown'] || k['s']) moveY += baseSpeed;
      }

      // Click-to-Move Target
      if (clickTarget.current && clickTarget.current.active) {
        const dx = clickTarget.current.x - bunny.x;
        const dy = clickTarget.current.y - bunny.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 8) {
          moveX = (dx / dist) * baseSpeed;
          moveY = (dy / dist) * baseSpeed;
        } else {
          clickTarget.current.active = false;
        }
      }

      // Normalize diagonal speed
      if (moveX !== 0 || moveY !== 0) {
        const len = Math.hypot(moveX, moveY);
        if (len > 0) {
          moveX = (moveX / len) * baseSpeed;
          moveY = (moveY / len) * baseSpeed;
        }
        bunny.isMoving = true;
        if (moveX < -0.1) bunny.facing = 'left';
        if (moveX > 0.1) bunny.facing = 'right';

        // Hop animation phase
        bunny.hopPhase += 0.24 * speedBonus;
        stepTimer++;
        if (stepTimer > 15) {
          stepTimer = 0;
          sounds.playHop();
          onStatsUpdate((prev) => ({
            ...prev,
            stepsCount: prev.stepsCount + 1,
          }));

          // Footstep marker
          footstepsRef.current.push({
            x: bunny.x,
            y: bunny.y + 10,
            alpha: 0.5,
            facing: bunny.facing,
          });

          // Dust puff
          particlesRef.current.push({
            x: bunny.x,
            y: bunny.y + 12,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 0.4,
            size: Math.random() * 2.5 + 1.5,
            color: '#cbd5e1',
            alpha: 0.5,
            life: 0,
            maxLife: 15,
            type: 'dust',
          });
        }
      } else {
        bunny.isMoving = false;
        bunny.hopPhase = 0;
      }

      // Jump Physics
      if (bunny.isJumping) {
        bunny.jumpHeight += 0.12 * superHopBonus;
        if (bunny.jumpHeight >= Math.PI) {
          bunny.isJumping = false;
          bunny.jumpHeight = 0;
          // Landing puff
          for (let i = 0; i < 4; i++) {
            particlesRef.current.push({
              x: bunny.x + (Math.random() * 12 - 6),
              y: bunny.y + 12,
              vx: (Math.random() - 0.5) * 1.2,
              vy: -Math.random() * 0.5,
              size: 2.5,
              color: '#94a3b8',
              alpha: 0.6,
              life: 0,
              maxLife: 16,
              type: 'dust',
            });
          }
        }
      }

      // Move bunny with COLLISION DETECTION against:
      // 1. River water (cannot cross except over bridge)
      // 2. Fences (cannot pass solid fences, only gates/openings)
      // 3. Tree trunks, dense hedge bushes & rocks
      const targetNextX = bunny.x + moveX;
      const targetNextY = bunny.y + moveY;

      if (moveX !== 0) {
        const colX = checkBunnyCollision(targetNextX, bunny.y, decorsRef.current, bunny.isJumping);
        if (!colX.blocked) {
          bunny.x = Math.max(60, Math.min(WORLD_WIDTH - 60, targetNextX));
        } else if (colX.hitObstacleName?.includes('suối') && Math.random() < 0.15) {
          particlesRef.current.push({
            x: targetNextX,
            y: bunny.y,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2 - 1,
            size: 3,
            color: '#38bdf8',
            alpha: 0.8,
            life: 0,
            maxLife: 18,
            type: 'ripple',
          });
        }
      }

      if (moveY !== 0) {
        const colY = checkBunnyCollision(bunny.x, targetNextY, decorsRef.current, bunny.isJumping);
        if (!colY.blocked) {
          bunny.y = Math.max(60, Math.min(WORLD_HEIGHT - 60, targetNextY));
        } else if (colY.hitObstacleName?.includes('suối') && Math.random() < 0.15) {
          particlesRef.current.push({
            x: bunny.x,
            y: targetNextY,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 2 - 1,
            size: 3,
            color: '#38bdf8',
            alpha: 0.8,
            life: 0,
            maxLife: 18,
            type: 'ripple',
          });
        }
      }

      // Biome Zone Detection
      for (const zone of FOREST_BIOMES) {
        if (
          bunny.x >= zone.bounds.minX &&
          bunny.x <= zone.bounds.maxX &&
          bunny.y >= zone.bounds.minY &&
          bunny.y <= zone.bounds.maxY
        ) {
          if (currentZoneRef.current !== zone.nameVi) {
            currentZoneRef.current = zone.nameVi;
            onZoneChange(zone.nameVi);
            sounds.playChime();
            onStatsUpdate((prev) => {
              if (!prev.areasVisited.includes(zone.nameVi)) {
                return {
                  ...prev,
                  areasVisited: [...prev.areasVisited, zone.nameVi],
                };
              }
              return prev;
            });
          }
          break;
        }
      }

      // Fast-Travel Burrow Interactions
      for (const decor of decorsRef.current) {
        if (decor.type === 'burrow') {
          const dist = Math.hypot(decor.x - bunny.x, decor.y - bunny.y);
          if (dist < 34 && bunny.isJumping) {
            sounds.playBurrowPop();
            onStatsUpdate((prev) => ({
              ...prev,
              burrowsFound: prev.burrowsFound + 1,
            }));

            // Burrow sparkle particles
            for (let i = 0; i < 16; i++) {
              particlesRef.current.push({
                x: decor.x,
                y: decor.y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 4,
                color: '#fbbf24',
                alpha: 0.9,
                life: 0,
                maxLife: 30,
                type: 'sparkle',
              });
            }

            // Teleport to opposite burrow
            if (decor.id === 'bunny_home_burrow') {
              bunny.x = 2650;
              bunny.y = 1950;
            } else {
              bunny.x = 450;
              bunny.y = 450;
            }
            break;
          }
        }
      }

      // Hazard Bush & Toxic Mushroom Interactions with Shield logic
      if (hazardCooldownRef.current > 0) {
        hazardCooldownRef.current--;
      } else {
        for (const decor of decorsRef.current) {
          if (decor.isHazard) {
            const dist = Math.hypot(decor.x - bunny.x, decor.y - bunny.y);
            if (dist < 32) {
              hazardCooldownRef.current = 60; // 1s cooldown

              if (upgrades.shieldLevel >= 2) {
                // Shield absorbs completely with sparkling barrier!
                sounds.playChime();
                for (let p = 0; p < 10; p++) {
                  particlesRef.current.push({
                    x: bunny.x,
                    y: bunny.y,
                    vx: (Math.random() - 0.5) * 3,
                    vy: (Math.random() - 0.5) * 3,
                    size: 3.5,
                    color: '#34d399',
                    alpha: 1,
                    life: 0,
                    maxLife: 20,
                    type: 'sparkle',
                  });
                }
              } else {
                // Take minor prickly penalty
                sounds.playHazardPrick();
                for (let p = 0; p < 8; p++) {
                  particlesRef.current.push({
                    x: bunny.x,
                    y: bunny.y,
                    vx: (Math.random() - 0.5) * 2.5,
                    vy: -Math.random() * 2,
                    size: 3,
                    color: '#ef4444',
                    alpha: 0.9,
                    life: 0,
                    maxLife: 20,
                    type: 'dust',
                  });
                }
              }
              break;
            }
          }
        }
      }

      // Magnet Pull Radius for Carrots & Berries
      const magnetRadius = upgrades.magnetLevel > 0 ? 80 + upgrades.magnetLevel * 45 : 0;

      // Update Collectibles & Respawning Regrowth Loop
      for (const item of collectiblesRef.current) {
        // Respawn Logic: If eaten, count down timer and regrow slowly
        if (item.collected) {
          if (item.respawnTimer !== undefined && item.respawnTimer > 0) {
            // Harvest luck reduces respawn timer faster
            const respawnSpeed = 1 + (upgrades.harvestLuckLevel * 0.3);
            item.respawnTimer -= respawnSpeed;
            if (item.maxRespawnTimer) {
              item.regrowProgress = 1 - (item.respawnTimer / item.maxRespawnTimer);
            }
            if (item.respawnTimer <= 0) {
              item.collected = false;
              item.regrowProgress = 1;
              // Little sprout pop effect
              for (let p = 0; p < 6; p++) {
                particlesRef.current.push({
                  x: item.x,
                  y: item.y,
                  vx: (Math.random() - 0.5) * 1.5,
                  vy: -Math.random() * 1.5,
                  size: 2.5,
                  color: '#4ade80',
                  alpha: 0.8,
                  life: 0,
                  maxLife: 20,
                  type: 'sparkle',
                });
              }
            }
          }
          continue;
        }

        item.bobPhase += 0.05;

        // Magnet attraction
        const dist = Math.hypot(item.x - bunny.x, item.y - bunny.y);
        if (magnetRadius > 0 && dist < magnetRadius && dist > 20) {
          const pullSpeed = 2.8 + upgrades.magnetLevel * 0.8;
          item.x += ((bunny.x - item.x) / dist) * pullSpeed;
          item.y += ((bunny.y - item.y) / dist) * pullSpeed;
        }

        // Collection Contact Check
        if (dist < 36) {
          item.collected = true;
          // Set respawn timer: slowed down by 2x (30-50 seconds instead of 15-25s)
          item.maxRespawnTimer = 1800 + Math.random() * 1200;
          item.respawnTimer = item.maxRespawnTimer;
          item.regrowProgress = 0;

          const luckMultiplier = Math.random() < (upgrades.harvestLuckLevel * 0.2) ? 2 : 1;

          if (item.type === 'carrot') {
            sounds.playMunch();
            const gain = 1 * luckMultiplier;
            bunny.carrotsEaten += gain;
            onStatsUpdate((prev) => ({
              ...prev,
              carrots: prev.carrots + gain,
            }));
          } else if (item.type === 'golden_carrot') {
            sounds.playChime();
            const gain = 5 * luckMultiplier;
            bunny.carrotsEaten += gain;
            onStatsUpdate((prev) => ({
              ...prev,
              carrots: prev.carrots + gain,
              goldenCarrots: prev.goldenCarrots + 1,
            }));
          } else if (item.type === 'berry') {
            sounds.playMunch();
            const gain = 1 * luckMultiplier;
            bunny.berriesPicked += gain;
            onStatsUpdate((prev) => ({
              ...prev,
              berries: prev.berries + gain,
            }));
          } else if (item.type === 'clover') {
            sounds.playChime();
            bunny.cloversFound += 1;
            onStatsUpdate((prev) => ({
              ...prev,
              clovers: prev.clovers + 1,
            }));
          }

          // Spawn floating hearts or golden sparkles
          for (let p = 0; p < 8; p++) {
            particlesRef.current.push({
              x: item.x,
              y: item.y,
              vx: (Math.random() - 0.5) * 2,
              vy: -Math.random() * 2 - 1,
              size: Math.random() * 3 + 2,
              color:
                item.type === 'golden_carrot'
                  ? '#f59e0b'
                  : item.type === 'clover'
                  ? '#22c55e'
                  : item.type === 'berry'
                  ? '#ec4899'
                  : '#f97316',
              alpha: 1,
              life: 0,
              maxLife: 25,
              type: item.type === 'golden_carrot' ? 'sparkle' : 'heart',
            });
          }
        }
      }

      // Animals AI & Interaction Proximity
      for (const animal of animalsRef.current) {
        if (animal.dialogueTimer > 0) {
          animal.dialogueTimer--;
        }

        animal.stateTimer++;
        if (animal.stateTimer > 120 + Math.random() * 120) {
          animal.stateTimer = 0;
          animal.state = Math.random() < 0.35 ? 'walking' : 'idle';
          if (animal.state === 'walking') {
            animal.facing = Math.random() < 0.5 ? 'left' : 'right';
          }
        }

        if (animal.state === 'walking') {
          const moveDir = animal.facing === 'left' ? -0.4 : 0.4;
          animal.x += moveDir;
          if (Math.abs(animal.x - animal.initialX) > 65) {
            animal.facing = animal.x > animal.initialX ? 'left' : 'right';
          }
        }

        const distToBunny = Math.hypot(animal.x - bunny.x, animal.y - bunny.y);
        if (distToBunny < 55 && animal.dialogueTimer <= 0) {
          triggerAnimalDialogue(animal);
        }
      }

      // Environmental Rescues Loop & Dynamic Particles
      for (const rescue of rescuesRef.current) {
        if (rescue.status === 'in_distress') {
          // Wildfire ember emits smoke puffs
          if (rescue.type === 'wildfire_ember' && Math.random() < 0.35) {
            particlesRef.current.push({
              x: rescue.x + (Math.random() * 24 - 12),
              y: rescue.y + 4,
              vx: (Math.random() - 0.5) * 0.7,
              vy: -Math.random() * 1.5 - 0.6,
              size: Math.random() * 3 + 2,
              color: Math.random() < 0.4 ? '#f97316' : '#64748b',
              alpha: 0.8,
              life: 0,
              maxLife: 26,
              type: 'dust',
            });
          }

          // Check if Bunny walked very close & jumped to trigger rescue
          const distToBunny = Math.hypot(rescue.x - bunny.x, rescue.y - bunny.y);
          if (distToBunny < 48 && (bunny.isJumping || Math.hypot(bunny.vx, bunny.vy) < 0.5)) {
            // Can be activated via interaction or click
          }
        }
      }

      // Real-Time Weather System (Rain Particles, Puddle Splashes & Atmosphere)
      const isRaining = weather === 'rainy' || weather === 'rain';
      const camX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
      const camY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));

      if (isRaining) {
        // Maintain continuous falling raindrops across camera view
        const targetRainCount = 240;
        while (rainDropsRef.current.length < targetRainCount) {
          const dropX = camX - 60 + Math.random() * (canvas.width + 120);
          const dropY = camY - 80 + Math.random() * (canvas.height + 80);
          const speed = 18 + Math.random() * 9;
          rainDropsRef.current.push({
            x: dropX,
            y: dropY,
            length: 16 + Math.random() * 14,
            speed,
            vx: -2.2 - Math.random() * 1.2,
            vy: speed,
            opacity: 0.35 + Math.random() * 0.45,
            width: Math.random() < 0.25 ? 1.6 : 1.1,
            targetY: dropY + 80 + Math.random() * (canvas.height - 80),
          });
        }

        // Update falling raindrops
        for (let i = rainDropsRef.current.length - 1; i >= 0; i--) {
          const drop = rainDropsRef.current[i];
          drop.x += drop.vx;
          drop.y += drop.vy;

          // Check if drop hit the ground or left screen
          if (drop.y >= drop.targetY || drop.y > camY + canvas.height + 15 || drop.x < camX - 80) {
            // Spawn water ripple on the terrain
            if (drop.y <= camY + canvas.height + 5) {
              rainRipplesRef.current.push({
                x: drop.x,
                y: Math.min(drop.y, camY + canvas.height - 2),
                radius: 1,
                maxRadius: 4 + Math.random() * 5,
                alpha: 0.55,
                speed: 0.4,
              });

              // 30% chance for a tiny splash droplet bounce
              if (Math.random() < 0.3) {
                particlesRef.current.push({
                  x: drop.x,
                  y: drop.y,
                  vx: (Math.random() - 0.5) * 1.8,
                  vy: -1.2 - Math.random() * 1.8,
                  size: 1.2,
                  color: '#bae6fd',
                  alpha: 0.65,
                  life: 0,
                  maxLife: 12,
                  type: 'leaf',
                });
              }
            }

            // Recycle drop to top of camera
            drop.x = camX - 40 + Math.random() * (canvas.width + 100);
            drop.y = camY - 30 - Math.random() * 50;
            drop.speed = 18 + Math.random() * 9;
            drop.vy = drop.speed;
            drop.vx = -2.2 - Math.random() * 1.2;
            drop.targetY = drop.y + 100 + Math.random() * canvas.height;
          }
        }

        // Ambient sheet lightning flash timer
        lightningFlashRef.current.nextFlashTimer--;
        if (lightningFlashRef.current.nextFlashTimer <= 0) {
          lightningFlashRef.current.alpha = 0.25;
          lightningFlashRef.current.nextFlashTimer = 650 + Math.floor(Math.random() * 850);
        }
        if (lightningFlashRef.current.alpha > 0) {
          lightningFlashRef.current.alpha = Math.max(0, lightningFlashRef.current.alpha - 0.012);
        }
      } else {
        // Clear falling raindrops smoothly when rain is off
        for (let i = rainDropsRef.current.length - 1; i >= 0; i--) {
          const drop = rainDropsRef.current[i];
          drop.x += drop.vx;
          drop.y += drop.vy;
          drop.opacity -= 0.05;
          if (drop.opacity <= 0) {
            rainDropsRef.current.splice(i, 1);
          }
        }
      }

      // Update rain ground ripples
      for (let i = rainRipplesRef.current.length - 1; i >= 0; i--) {
        const rip = rainRipplesRef.current[i];
        rip.radius += rip.speed;
        rip.alpha = 0.55 * (1 - rip.radius / rip.maxRadius);
        if (rip.radius >= rip.maxRadius || rip.alpha <= 0) {
          rainRipplesRef.current.splice(i, 1);
        }
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Footsteps fade
      for (let i = footstepsRef.current.length - 1; i >= 0; i--) {
        const fs = footstepsRef.current[i];
        fs.alpha -= 0.002;
        if (fs.alpha <= 0) {
          footstepsRef.current.splice(i, 1);
        }
      }

      // Update Butterflies
      for (const bf of butterFliesRef.current) {
        bf.phase += 0.08;
        bf.x += bf.vx + Math.sin(bf.phase) * 0.8;
        bf.y += bf.vy + Math.cos(bf.phase * 0.7) * 0.8;
        if (bf.x < 100 || bf.x > WORLD_WIDTH - 100) bf.vx *= -1;
        if (bf.y < 100 || bf.y > WORLD_HEIGHT - 100) bf.vy *= -1;
      }

      // Update Fireflies
      for (const ff of firefliesRef.current) {
        ff.x += ff.vx;
        ff.y += ff.vy;
        ff.glow = (Math.sin(currentTime * 0.003 + ff.x) + 1) / 2;
        if (ff.x < 50 || ff.x > WORLD_WIDTH - 50) ff.vx *= -1;
        if (ff.y < 50 || ff.y > WORLD_HEIGHT - 50) ff.vy *= -1;
      }

      // Update River Swimming Fish (Cá lội mương / suối)
      for (const fish of riverFishRef.current) {
        fish.swimPhase += fish.wiggleSpeed;

        if (!fish.isJumping) {
          // Normal swimming along the river stream current
          fish.y += fish.speed * fish.dirY;

          // Reverse direction at top and bottom bounds of river
          if (fish.y < 90) {
            fish.y = 90;
            fish.dirY = 1;
          } else if (fish.y > WORLD_HEIGHT - 90) {
            fish.y = WORLD_HEIGHT - 90;
            fish.dirY = -1;
          }

          // Periodic jumping / leaping animation
          fish.jumpTimer--;
          if (fish.jumpTimer <= 0) {
            fish.isJumping = true;
            fish.jumpProgress = 0;
            fish.jumpArcHeight = 12 + Math.random() * 14;

            // Water ripple ring at start of leap
            const fx = getRiverCenterX(fish.y) + fish.offsetX;
            particlesRef.current.push({
              x: fx,
              y: fish.y,
              vx: 0,
              vy: 0,
              size: 5,
              color: '#ffffff',
              alpha: 0.75,
              life: 0,
              maxLife: 22,
              type: 'ripple',
            });
          }
        } else {
          // In-air leap arc
          fish.jumpProgress += 0.035;
          fish.y += fish.speed * fish.dirY * 0.4;

          if (fish.jumpProgress >= 1) {
            fish.isJumping = false;
            fish.jumpProgress = 0;
            fish.jumpTimer = 280 + Math.floor(Math.random() * 650);

            // Water splash droplets & ripple on landing back into stream
            const fx = getRiverCenterX(fish.y) + fish.offsetX;
            sounds.playWaterDrop();
            for (let sp = 0; sp < 4; sp++) {
              particlesRef.current.push({
                x: fx + (Math.random() * 8 - 4),
                y: fish.y + (Math.random() * 4 - 2),
                vx: (Math.random() - 0.5) * 1.8,
                vy: -Math.random() * 2 - 1,
                size: 2.5,
                color: '#e0f2fe',
                alpha: 0.9,
                life: 0,
                maxLife: 20,
                type: 'dust',
              });
            }
            particlesRef.current.push({
              x: fx,
              y: fish.y,
              vx: 0,
              vy: 0,
              size: 6,
              color: '#ffffff',
              alpha: 0.8,
              life: 0,
              maxLife: 26,
              type: 'ripple',
            });
          }
        }
      }

      // Bunny hopping grass particle effect (Cỏ lưa thưa vương dưới chân thỏ)
      if (bunny.isMoving && !isPointInRiver(bunny.x, bunny.y) && Math.random() < 0.22) {
        particlesRef.current.push({
          x: bunny.x + (Math.random() * 14 - 7),
          y: bunny.y + 10,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -Math.random() * 1.4,
          size: 2.5,
          color: Math.random() < 0.5 ? '#86efac' : '#4ade80',
          alpha: 0.8,
          life: 0,
          maxLife: 22,
          type: 'leaf',
        });
      }

      // --- RENDERING PASS ---
      const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
      const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(-cameraX, -cameraY);

      // 1. Forest Ground & Paths (with Sparse Grass Tufts & Wild Florets)
      drawForestBackground(ctx, weather, bunny, currentTime);

      // 2. River Stream (Animated with swimming fish, jumping trout/koi, ripples & riverbanks)
      drawRiverStream(ctx, currentTime, weather);

      // 3. Wooden Bridges
      drawBridges(ctx);

      // 4. Footsteps
      drawFootsteps(ctx);

      // 5. Navigation Target Marker
      if (clickTarget.current && clickTarget.current.active) {
        drawClickTargetMarker(ctx, clickTarget.current.x, clickTarget.current.y, currentTime);
      }

      // 6. Collectibles (Carrots, berries, clovers, regrowing sprouts)
      drawCollectibles(ctx);

      // 7. Background Decors (Burrows, flowers, ponds)
      drawBackgroundDecors(ctx);

      // 7.5 Environmental Rescue Missions (Thorn trapped hedgehog, stream trash, wildfire ember, fallen nest)
      drawRescues(ctx, currentTime);

      // 8. Animals
      drawForestAnimals(ctx);

      // 9. Bunny (with upgrades aura, halo, and speed lines)
      drawBunny(ctx, bunny, upgrades, currentTime);

      // 10. Foreground Decors (Trees with realistic foliage, fences, gates, bushes)
      drawForegroundDecors(ctx);

      // 11. Butterflies
      drawButterflies(ctx);

      // 12. Particles
      drawParticles(ctx);

      // 13. Weather Atmosphere & Lighting
      drawWeatherAndLighting(ctx, canvas.width, canvas.height, cameraX, cameraY, bunny, weather);

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [weather, speedMultiplier, upgrades, onStatsUpdate, onZoneChange, onAnimalInteract, joystickVector]);

  // --- DRAWING FUNCTIONS ---

  const drawForestBackground = (
    ctx: CanvasRenderingContext2D,
    currentW: WeatherType,
    bunny: BunnyEntity,
    time: number
  ) => {
    let topColor = '#4ade80';
    let bottomColor = '#22c55e';
    if (currentW === 'night') {
      topColor = '#1e3a2f';
      bottomColor = '#132a21';
    } else if (currentW === 'afternoon') {
      topColor = '#84cc16';
      bottomColor = '#4d7c0f';
    } else if (currentW === 'rainy' || currentW === 'rain') {
      topColor = '#3f6212';
      bottomColor = '#283618';
    }

    const bgGrad = ctx.createLinearGradient(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    bgGrad.addColorStop(0, topColor);
    bgGrad.addColorStop(1, bottomColor);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Forest Walking Dirt Trails
    ctx.save();
    ctx.strokeStyle = currentW === 'night' ? '#44342833' : '#d9770633';
    ctx.lineWidth = 60;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(450, 450);
    ctx.bezierCurveTo(800, 500, 1100, 400, 1360, 450);
    ctx.bezierCurveTo(1800, 520, 2000, 600, 2200, 620);
    ctx.bezierCurveTo(2450, 1000, 2300, 1500, 2200, 1800);
    ctx.bezierCurveTo(1600, 1850, 1000, 1750, 600, 1700);
    ctx.stroke();
    ctx.restore();

    // 1. Sparse Natural Grass Clusters (Cỏ lưa thưa rải rác khắp mặt đất)
    ctx.save();
    ctx.lineCap = 'round';

    for (const clump of sparseGrassRef.current) {
      const gx = clump.x;
      const gy = clump.y;

      // Draw each curved grass blade in the clump
      for (const blade of clump.blades) {
        ctx.strokeStyle = currentW === 'night' ? '#14532d' : blade.shade;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(gx + blade.dx, gy);
        ctx.quadraticCurveTo(
          gx + blade.dx + blade.bend * 0.5,
          gy - blade.h * 0.6,
          gx + blade.dx + blade.bend,
          gy - blade.h
        );
        ctx.stroke();

        // Tip highlight
        ctx.strokeStyle = currentW === 'night' ? '#166534' : '#bef264';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx + blade.dx + blade.bend * 0.7, gy - blade.h * 0.75);
        ctx.lineTo(gx + blade.dx + blade.bend, gy - blade.h);
        ctx.stroke();
      }

      // Small Wild Florets & Clovers in sparse grass clumps
      if (clump.flower) {
        const fl = clump.flower;
        if (fl.type === 'daisy') {
          // Chamomile 5-petal white daisy
          ctx.fillStyle = currentW === 'night' ? '#94a3b8' : '#ffffff';
          for (let p = 0; p < 5; p++) {
            const angle = (p * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.ellipse(gx + Math.cos(angle) * 3.5, gy - 6 + Math.sin(angle) * 3.5, 2.5, 1.4, angle, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(gx, gy - 6, 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (fl.type === 'lavender') {
          // Lavender purple floret
          ctx.fillStyle = currentW === 'night' ? '#6b21a8' : '#c084fc';
          ctx.beginPath();
          ctx.ellipse(gx, gy - 9, 2, 3, 0, 0, Math.PI * 2);
          ctx.ellipse(gx, gy - 5, 2.5, 3, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (fl.type === 'pink_petal') {
          // Pink blossom
          ctx.fillStyle = currentW === 'night' ? '#9d174d' : '#f472b6';
          for (let p = 0; p < 4; p++) {
            const angle = (p * Math.PI * 2) / 4 + Math.PI / 4;
            ctx.beginPath();
            ctx.arc(gx + Math.cos(angle) * 3, gy - 7 + Math.sin(angle) * 3, 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(gx, gy - 7, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (fl.type === 'clover_sprout') {
          // 3-leaf clover sprout
          ctx.fillStyle = currentW === 'night' ? '#14532d' : '#22c55e';
          ctx.beginPath();
          ctx.arc(gx - 2.5, gy - 4, 2, 0, Math.PI * 2);
          ctx.arc(gx + 2.5, gy - 4, 2, 0, Math.PI * 2);
          ctx.arc(gx, gy - 7, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // 2. Dynamic Sparse Grass Under Bunny's Feet (Cỏ lưa thưa dưới chân thỏ nhún nhảy)
    if (!isPointInRiver(bunny.x, bunny.y)) {
      const swayOffset = bunny.isMoving ? Math.sin(time * 0.015) * 4 : 0;
      const grassColor = currentW === 'night' ? '#166534' : '#4ade80';

      ctx.strokeStyle = grassColor;
      ctx.lineWidth = 1.6;

      // 4 grass blades directly under / adjacent to bunny's paws
      const underfootOffsets = [
        { dx: -12, h: 9, bend: -3 + swayOffset },
        { dx: -6, h: 12, bend: -1 + swayOffset * 0.8 },
        { dx: 4, h: 11, bend: 2 - swayOffset * 0.8 },
        { dx: 11, h: 8, bend: 4 - swayOffset },
      ];

      for (const b of underfootOffsets) {
        ctx.beginPath();
        ctx.moveTo(bunny.x + b.dx, bunny.y + 11);
        ctx.quadraticCurveTo(
          bunny.x + b.dx + b.bend * 0.5,
          bunny.y + 11 - b.h * 0.6,
          bunny.x + b.dx + b.bend,
          bunny.y + 11 - b.h
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  // Render the River Stream with Swimming Fish (Cá lội mương), jumping trout/koi & river currents
  const drawRiverStream = (ctx: CanvasRenderingContext2D, time: number, currentW: WeatherType) => {
    ctx.save();
    const waterColor = currentW === 'night' ? '#1e3a8a' : '#38bdf8';
    const deepWaterColor = currentW === 'night' ? '#172554' : '#0284c7';

    // 1. Sandy/Muddy Riverbanks & Stone Borders (Outer boundary)
    ctx.strokeStyle = currentW === 'night' ? '#3d2616' : '#78350f44';
    ctx.lineWidth = RIVER_HALF_WIDTH * 2 + 50;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = 0; y <= WORLD_HEIGHT; y += 30) {
      const x = getRiverCenterX(y);
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 2. Main Deep River Water Body
    ctx.strokeStyle = deepWaterColor;
    ctx.lineWidth = RIVER_HALF_WIDTH * 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = 0; y <= WORLD_HEIGHT; y += 30) {
      const x = getRiverCenterX(y);
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 3. Inner Flowing Water Center Stream
    ctx.strokeStyle = waterColor;
    ctx.lineWidth = RIVER_HALF_WIDTH * 1.35;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let y = 0; y <= WORLD_HEIGHT; y += 30) {
      const x = getRiverCenterX(y);
      if (y === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // 4. Shimmering Surface Wave Currents & Water Ripples
    ctx.fillStyle = currentW === 'night' ? '#93c5fd33' : '#ffffff88';
    for (let y = 40; y < WORLD_HEIGHT; y += 95) {
      const waveOffset = Math.sin(time * 0.003 + y * 0.015) * 28;
      const x = getRiverCenterX(y) + waveOffset;
      ctx.beginPath();
      ctx.ellipse(x - 18, y, 16, 3.5, 0.15, 0, Math.PI * 2);
      ctx.ellipse(x + 22, y + 18, 12, 3, -0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. River Swimming Fish & Leaping Fish (Cá lội mương / suối)
    for (const fish of riverFishRef.current) {
      const fx = getRiverCenterX(fish.y) + fish.offsetX + Math.sin(fish.swimPhase * 0.6) * 4;
      const fy = fish.y;
      const tailWiggle = Math.sin(fish.swimPhase * 1.6) * 0.45;
      const isJumping = fish.isJumping;
      const jumpYOffset = isJumping ? Math.sin(fish.jumpProgress * Math.PI) * fish.jumpArcHeight : 0;

      ctx.save();
      ctx.translate(fx, fy - jumpYOffset);

      // Rotate fish along swimming direction (up or down along stream curve)
      const streamSlope = (Math.cos(fish.y * 0.002) * 180 * 0.002);
      const baseAngle = fish.dirY === 1 ? Math.PI / 2 + streamSlope : -Math.PI / 2 - streamSlope;
      ctx.rotate(baseAngle + tailWiggle * 0.2);

      // Swimming Water Wake Rings behind fish
      if (!isJumping) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, -fish.size * 0.8, fish.size * 0.35, fish.size * 0.15, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Caudal Tail Fin (Wiggling)
      ctx.save();
      ctx.translate(0, -fish.size * 0.65);
      ctx.rotate(tailWiggle);

      if (fish.colorType === 'koi_gold') {
        ctx.fillStyle = '#f97316';
      } else if (fish.colorType === 'koi_calico') {
        ctx.fillStyle = '#ea580c';
      } else if (fish.colorType === 'trout_silver') {
        ctx.fillStyle = '#94a3b8';
      } else {
        ctx.fillStyle = '#06b6d4';
      }

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-fish.size * 0.4, -fish.size * 0.6);
      ctx.quadraticCurveTo(0, -fish.size * 0.4, fish.size * 0.4, -fish.size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Pectoral Side Fins
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(-fish.size * 0.45, 0, fish.size * 0.3, fish.size * 0.15, 0.6 + tailWiggle * 0.3, 0, Math.PI * 2);
      ctx.ellipse(fish.size * 0.45, 0, fish.size * 0.3, fish.size * 0.15, -0.6 - tailWiggle * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Main Hydrodynamic Fish Body
      let bodyGrad = ctx.createLinearGradient(-fish.size * 0.3, 0, fish.size * 0.3, 0);
      if (fish.colorType === 'koi_gold') {
        bodyGrad.addColorStop(0, '#ea580c');
        bodyGrad.addColorStop(0.5, '#f59e0b');
        bodyGrad.addColorStop(1, '#ea580c');
      } else if (fish.colorType === 'koi_calico') {
        bodyGrad.addColorStop(0, '#f8fafc');
        bodyGrad.addColorStop(0.5, '#ffffff');
        bodyGrad.addColorStop(1, '#f8fafc');
      } else if (fish.colorType === 'trout_silver') {
        bodyGrad.addColorStop(0, '#64748b');
        bodyGrad.addColorStop(0.5, '#cbd5e1');
        bodyGrad.addColorStop(1, '#64748b');
      } else {
        bodyGrad.addColorStop(0, '#0284c7');
        bodyGrad.addColorStop(0.5, '#38bdf8');
        bodyGrad.addColorStop(1, '#0284c7');
      }

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, fish.size * 0.38, fish.size * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fish Pattern Markings (Koi spots / Trout stripe)
      if (fish.colorType === 'koi_gold' || fish.colorType === 'koi_calico') {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.ellipse(0, fish.size * 0.2, fish.size * 0.18, fish.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (fish.colorType === 'koi_calico') {
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.ellipse(fish.size * 0.15, -fish.size * 0.2, fish.size * 0.14, fish.size * 0.2, 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (fish.colorType === 'trout_silver') {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -fish.size * 0.5);
        ctx.lineTo(0, fish.size * 0.5);
        ctx.stroke();

        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(0, fish.size * 0.1, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fish Eyes (Left & Right)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-fish.size * 0.22, fish.size * 0.45, 1.6, 0, Math.PI * 2);
      ctx.arc(fish.size * 0.22, fish.size * 0.45, 1.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-fish.size * 0.24, fish.size * 0.43, 0.7, 0, Math.PI * 2);
      ctx.arc(fish.size * 0.2, fish.size * 0.43, 0.7, 0, Math.PI * 2);
      ctx.fill();

      // In-air leap sparkle glint
      if (isJumping) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    // 6. Riverbank Stones / Pebbles on West and East banks
    for (let y = 80; y < WORLD_HEIGHT; y += 160) {
      const rx = getRiverCenterX(y);
      // Skip near bridges
      const nearBridge = BRIDGES.some((b) => Math.abs(y - b.y) < 70);
      if (nearBridge) continue;

      ctx.fillStyle = currentW === 'night' ? '#475569' : '#94a3b8';
      ctx.beginPath();
      ctx.ellipse(rx - RIVER_HALF_WIDTH - 6, y, 7, 5, 0.2, 0, Math.PI * 2);
      ctx.ellipse(rx + RIVER_HALF_WIDTH + 6, y + 25, 8, 5.5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Render the 3 Wooden Bridges (Top, Middle, Bottom) with railings, posts, lanterns & nameplates
  const drawBridges = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const decor of decorsRef.current) {
      if (decor.type === 'bridge') {
        const bridgeX = decor.x;
        const bridgeY = decor.y;
        const halfW = decor.width / 2;
        const halfH = decor.height / 2;

        // 1. Stone Foundation Anchors on both river banks (West & East)
        ctx.fillStyle = '#475569';
        ctx.fillRect(bridgeX - halfW - 8, bridgeY - halfH, 18, decor.height);
        ctx.fillRect(bridgeX + halfW - 10, bridgeY - halfH, 18, decor.height);

        // 2. Bridge Shadow over water
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fillRect(bridgeX - halfW + 6, bridgeY - halfH + 12, decor.width - 12, decor.height);

        // 3. Wooden Support Beams beneath
        ctx.fillStyle = '#451a03';
        ctx.fillRect(bridgeX - halfW, bridgeY - halfH + 8, decor.width, 10);
        ctx.fillRect(bridgeX - halfW, bridgeY + halfH - 18, decor.width, 10);

        // 4. Main Timber Deck Planks
        ctx.fillStyle = '#92400e';
        ctx.fillRect(bridgeX - halfW, bridgeY - halfH, decor.width, decor.height);

        // 5. Individual Timber Planks & Gaps
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        for (let bx = bridgeX - halfW; bx <= bridgeX + halfW; bx += 20) {
          ctx.beginPath();
          ctx.moveTo(bx, bridgeY - halfH);
          ctx.lineTo(bx, bridgeY + halfH);
          ctx.stroke();

          // Brass nail rivets on each plank
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(bx + 10, bridgeY - halfH + 10, 2, 0, Math.PI * 2);
          ctx.arc(bx + 10, bridgeY + halfH - 10, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // 6. Bridge Top and Bottom Wooden Guardrails
        ctx.fillStyle = '#b45309';
        ctx.fillRect(bridgeX - halfW - 5, bridgeY - halfH - 6, decor.width + 10, 10);
        ctx.fillRect(bridgeX - halfW - 5, bridgeY + halfH - 4, decor.width + 10, 10);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(bridgeX - halfW - 5, bridgeY - halfH - 3, decor.width + 10, 3);
        ctx.fillRect(bridgeX - halfW - 5, bridgeY + halfH + 3, decor.width + 10, 3);

        // 7. Fence Baluster Posts along the railings
        ctx.fillStyle = '#451a03';
        for (let bx = bridgeX - halfW; bx <= bridgeX + halfW; bx += 36) {
          ctx.fillRect(bx - 4, bridgeY - halfH - 12, 8, 14);
          ctx.fillRect(bx - 4, bridgeY + halfH - 2, 8, 14);
        }

        // 8. Bridge Nameplate / Badge
        const bridgeMatch = BRIDGES.find((b) => b.id === decor.id);
        const bridgeLabel = bridgeMatch?.nameVi || 'Cầu Gỗ Qua Suối';

        ctx.font = 'bold 12px Plus Jakarta Sans, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Wooden signboard background
        const textWidth = ctx.measureText(`🌉 ${bridgeLabel}`).width;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;

        const badgeX = bridgeX;
        const badgeY = bridgeY - halfH - 24;
        ctx.beginPath();
        ctx.roundRect(badgeX - textWidth / 2 - 10, badgeY - 10, textWidth + 20, 20, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fef08a';
        ctx.fillText(`🌉 ${bridgeLabel}`, badgeX, badgeY);
      }
    }
    ctx.restore();
  };

  const drawFootsteps = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const fs of footstepsRef.current) {
      // Paw imprint
      ctx.fillStyle = `rgba(120, 53, 15, ${fs.alpha * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(fs.x - (fs.facing === 'left' ? 4 : -4), fs.y, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(fs.x + (fs.facing === 'left' ? 4 : -4), fs.y + 2, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sparse flattened grass blade impressions underfoot
      ctx.strokeStyle = `rgba(22, 101, 52, ${fs.alpha * 0.45})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(fs.x - 5, fs.y + 2);
      ctx.lineTo(fs.x - 7, fs.y - 2);
      ctx.moveTo(fs.x + 5, fs.y + 2);
      ctx.lineTo(fs.x + 7, fs.y - 1);
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawClickTargetMarker = (ctx: CanvasRenderingContext2D, x: number, y: number, time: number) => {
    ctx.save();
    const pulse = (Math.sin(time * 0.008) + 1) / 2;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 16 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#fb7185';
    for (let i = 0; i < 5; i++) {
      const angle = (i * Math.PI * 2) / 5;
      const px = x + Math.cos(angle) * 7;
      const py = y + Math.sin(angle) * 7;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Draw Collectibles with Respawning Sprout Animation
  const drawCollectibles = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const item of collectiblesRef.current) {
      // Regrowth state (sprout popping from ground)
      if (item.collected) {
        if (item.regrowProgress && item.regrowProgress > 0.1) {
          const sproutScale = item.regrowProgress;
          ctx.fillStyle = '#86efac';
          ctx.beginPath();
          ctx.ellipse(item.x, item.y + 8, 6 * sproutScale, 2 * sproutScale, 0, 0, Math.PI * 2);
          ctx.fill();

          // Little green shoot
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(item.x - 3 * sproutScale, item.y - 2 * sproutScale, 2 * sproutScale, 5 * sproutScale, -0.4, 0, Math.PI * 2);
          ctx.ellipse(item.x + 3 * sproutScale, item.y - 2 * sproutScale, 2 * sproutScale, 5 * sproutScale, 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        continue;
      }

      const floatY = item.y + Math.sin(item.bobPhase) * 4;

      if (item.type === 'carrot' || item.type === 'golden_carrot') {
        const isGold = item.type === 'golden_carrot';
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + 12, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Carrot Green leafy top
        ctx.fillStyle = isGold ? '#fde047' : '#16a34a';
        ctx.beginPath();
        ctx.ellipse(item.x - 3, floatY - 14, 4, 9, -0.3, 0, Math.PI * 2);
        ctx.ellipse(item.x + 3, floatY - 14, 4, 9, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Carrot Body
        ctx.fillStyle = isGold ? '#f59e0b' : '#f97316';
        ctx.beginPath();
        ctx.moveTo(item.x - 7, floatY - 8);
        ctx.lineTo(item.x + 7, floatY - 8);
        ctx.lineTo(item.x, floatY + 11);
        ctx.closePath();
        ctx.fill();

        // Carrot ridges
        ctx.strokeStyle = isGold ? '#fef08a' : '#ea580c';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(item.x - 4, floatY - 4);
        ctx.lineTo(item.x + 3, floatY - 4);
        ctx.moveTo(item.x - 3, floatY + 1);
        ctx.lineTo(item.x + 2, floatY + 1);
        ctx.stroke();

        if (isGold) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x - 2, floatY - 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (item.type === 'berry') {
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.beginPath();
        ctx.ellipse(item.x, item.y + 8, 8, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(item.x - 4, floatY - 2, 5, 0, Math.PI * 2);
        ctx.arc(item.x + 4, floatY - 2, 5, 0, Math.PI * 2);
        ctx.arc(item.x, floatY + 3, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(item.x, floatY - 7, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.type === 'clover') {
        ctx.fillStyle = '#15803d';
        for (let l = 0; l < 4; l++) {
          const angle = (l * Math.PI) / 2;
          const cx = item.x + Math.cos(angle) * 5;
          const cy = floatY + Math.sin(angle) * 5;
          ctx.beginPath();
          ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(item.x, floatY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const drawBackgroundDecors = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const decor of decorsRef.current) {
      if (decor.type === 'burrow') {
        ctx.fillStyle = '#3f220f';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, decor.width / 2, decor.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.fillRect(decor.x - 30, decor.y - 45, 60, 18);
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 11px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(decor.id === 'bunny_home_burrow' ? '🏡 TỔ THỎ' : '✨ HANG BÍ MẬT', decor.x, decor.y - 32);
      } else if (decor.type === 'flower_cluster') {
        const flowerColors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24', '#38bdf8'];
        for (let f = 0; f < 5; f++) {
          const fx = decor.x + (f % 3) * 12 - 12;
          const fy = decor.y + Math.floor(f / 3) * 10 - 5;
          ctx.fillStyle = flowerColors[f % flowerColors.length];
          ctx.beginPath();
          ctx.arc(fx, fy, 4, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(fx, fy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.restore();
  };

  // Draw Rich Animals (Squirrel, Duck, Hedgehog, Deer, Frog, Fox, Owl, Panda, Turtle, Fairy Butterfly)
  const drawForestAnimals = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const animal of animalsRef.current) {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(animal.x, animal.y + 12, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.save();
      ctx.translate(animal.x, animal.y);
      if (animal.facing === 'left') {
        ctx.scale(-1, 1);
      }

      if (animal.type === 'squirrel') {
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.arc(-14, -10, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 13, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -12, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(10, -19, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(11, -13, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(6, -2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'duck') {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, -8, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(14, -7, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(10, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'hedgehog') {
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.arc(-2, -4, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        for (let s = 0; s < 7; s++) {
          const sa = (s * Math.PI) / 6 + Math.PI;
          ctx.beginPath();
          ctx.moveTo(-2 + Math.cos(sa) * 11, -4 + Math.sin(sa) * 11);
          ctx.lineTo(-2 + Math.cos(sa) * 16, -4 + Math.sin(sa) * 16);
          ctx.stroke();
        }
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(9, -2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(14, -2, 2, 0, Math.PI * 2);
        ctx.arc(11, -5, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'deer') {
        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(14, -14, 6, 12, 0.4, 0, Math.PI * 2);
        ctx.arc(18, -22, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, -28);
        ctx.lineTo(20, -36);
        ctx.moveTo(20, -32);
        ctx.lineTo(24, -34);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, -4, 2, 0, Math.PI * 2);
        ctx.arc(-1, 3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'fox') {
        // Fluffy Orange Fox
        ctx.fillStyle = '#ea580c';
        // Tail
        ctx.beginPath();
        ctx.ellipse(-16, -6, 14, 7, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // White tail tip
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-26, -9, 5, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.ellipse(0, 0, 13, 11, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head & snout
        ctx.beginPath();
        ctx.arc(10, -10, 8, 0, Math.PI * 2);
        ctx.fill();
        // Snout
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(10, -8);
        ctx.lineTo(18, -8);
        ctx.lineTo(12, -4);
        ctx.closePath();
        ctx.fill();
        // Nose & eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(18, -8, 1.8, 0, Math.PI * 2);
        ctx.arc(12, -12, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#9a3412';
        ctx.beginPath();
        ctx.moveTo(8, -17);
        ctx.lineTo(12, -25);
        ctx.lineTo(15, -17);
        ctx.closePath();
        ctx.fill();
      } else if (animal.type === 'owl') {
        // Wise Owl
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(0, -6, 12, 16, 0, 0, Math.PI * 2);
        ctx.fill();
        // Belly feathers
        ctx.fillStyle = '#fef3c7';
        ctx.beginPath();
        ctx.ellipse(0, -4, 8, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Big yellow eyes
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-5, -12, 5, 0, Math.PI * 2);
        ctx.arc(5, -12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-5, -12, 2.5, 0, Math.PI * 2);
        ctx.arc(5, -12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Beak
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(-2.5, -6);
        ctx.lineTo(2.5, -6);
        ctx.closePath();
        ctx.fill();
      } else if (animal.type === 'panda') {
        // Cute Mini Panda
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 14, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        // Black limbs & ears
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-9, -15, 4, 0, Math.PI * 2);
        ctx.arc(9, -15, 4, 0, Math.PI * 2);
        ctx.arc(-7, 7, 5, 0, Math.PI * 2);
        ctx.arc(7, 7, 5, 0, Math.PI * 2);
        ctx.fill();
        // Eye patches
        ctx.beginPath();
        ctx.ellipse(-5, -7, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.ellipse(5, -7, 4, 3, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-5, -7, 1.2, 0, Math.PI * 2);
        ctx.arc(5, -7, 1.2, 0, Math.PI * 2);
        ctx.fill();
        // Bamboo stalk in paw
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(8, -14, 3, 18);
      } else if (animal.type === 'turtle') {
        // Green Turtle
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(0, 0, 13, 0, Math.PI * 2);
        ctx.fill();
        // Shell ridges
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Head
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(14, -2, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#022c22';
        ctx.beginPath();
        ctx.arc(15, -4, 1.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'crocodile') {
        // Swamp & River Crocodile (Cá sấu đầm lầy / mương nước)
        const tailSway = Math.sin(Date.now() * 0.003 + animal.x) * 0.3;

        // Water ripple wake around crocodile if in or near water
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 2, 28, 14, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Tail (Sinuous wavy scaly tail)
        ctx.save();
        ctx.translate(-14, 0);
        ctx.rotate(tailSway);
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(-24, 0);
        ctx.lineTo(0, 6);
        ctx.closePath();
        ctx.fill();

        // Saw tooth scutes along tail (Gai đuôi)
        ctx.fillStyle = '#14532d';
        for (let t = -4; t > -22; t -= 5) {
          ctx.beginPath();
          ctx.moveTo(t, -2);
          ctx.lineTo(t - 2, -6);
          ctx.lineTo(t - 4, -2);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Back Legs & Webbed Claws
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(-8, -10, 6, 3.5, -0.4, 0, Math.PI * 2);
        ctx.ellipse(-8, 10, 6, 3.5, 0.4, 0, Math.PI * 2);
        ctx.ellipse(8, -10, 6, 3.5, 0.4, 0, Math.PI * 2);
        ctx.ellipse(8, 10, 6, 3.5, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Main Scaly Body
        const crocBodyGrad = ctx.createLinearGradient(0, -9, 0, 9);
        crocBodyGrad.addColorStop(0, '#15803d');
        crocBodyGrad.addColorStop(0.5, '#16a34a');
        crocBodyGrad.addColorStop(1, '#166534');
        ctx.fillStyle = crocBodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 9, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dorsal Saw Scutes along spine (Gai lưng cá sấu)
        ctx.fillStyle = '#14532d';
        for (let sx = -10; sx <= 6; sx += 4) {
          ctx.beginPath();
          ctx.moveTo(sx, -4);
          ctx.lineTo(sx + 2, -8);
          ctx.lineTo(sx + 4, -4);
          ctx.closePath();
          ctx.fill();
        }

        // Long Snout & Head
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.moveTo(10, -7);
        ctx.lineTo(26, -4);
        ctx.quadraticCurveTo(30, 0, 26, 4);
        ctx.lineTo(10, 7);
        ctx.closePath();
        ctx.fill();

        // Nostrils (Lỗ mũi)
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(26, -2, 1, 0, Math.PI * 2);
        ctx.arc(26, 2, 1, 0, Math.PI * 2);
        ctx.fill();

        // Sharp White Teeth (Răng cá sấu)
        ctx.fillStyle = '#ffffff';
        for (let tx = 14; tx <= 24; tx += 3.5) {
          ctx.beginPath();
          ctx.moveTo(tx, -4.5);
          ctx.lineTo(tx + 1.2, -6.5);
          ctx.lineTo(tx + 2.4, -4.5);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(tx, 4.5);
          ctx.lineTo(tx + 1.2, 6.5);
          ctx.lineTo(tx + 2.4, 4.5);
          ctx.closePath();
          ctx.fill();
        }

        // Golden Reptilian Slit Eyes (Mắt vàng rực rỡ với con ngươi dọc)
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(12, -5, 2.5, 0, Math.PI * 2);
        ctx.arc(12, 5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Black Slit Pupils
        ctx.fillStyle = '#022c22';
        ctx.fillRect(11.5, -6.5, 1, 3);
        ctx.fillRect(11.5, 3.5, 1, 3);
      } else {
        // Frog
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(-4, -7, 4, 0, Math.PI * 2);
        ctx.arc(4, -7, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#022c22';
        ctx.beginPath();
        ctx.arc(-4, -7, 2, 0, Math.PI * 2);
        ctx.arc(4, -7, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Dialogue Speech Bubble
      if (animal.dialogueTimer > 0 && animal.currentDialogue) {
        ctx.save();
        const text = animal.currentDialogue;
        ctx.font = 'bold 12px Nunito, sans-serif';
        const metrics = ctx.measureText(text);
        const padX = 12;
        const boxW = metrics.width + padX * 2;
        const boxH = 28;
        const bubbleX = animal.x - boxW / 2;
        const bubbleY = animal.y - 48;

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, boxW, boxH, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.beginPath();
        ctx.moveTo(animal.x - 6, bubbleY + boxH);
        ctx.lineTo(animal.x + 6, bubbleY + boxH);
        ctx.lineTo(animal.x, bubbleY + boxH + 6);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(text, animal.x, bubbleY + 18);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // Draw Bunny with dynamic upgrade auras, shield bubble & accessories
  const drawBunny = (ctx: CanvasRenderingContext2D, bunny: BunnyEntity, currentUpgrades: BunnyUpgrades | undefined, time: number) => {
    ctx.save();
    const upg = currentUpgrades || DEFAULT_UPGRADES;
    const hopYOffset =
      Math.abs(Math.sin(bunny.hopPhase)) * 9 +
      (bunny.isJumping ? Math.sin(bunny.jumpHeight) * (26 + (upg.superHopLevel || 0) * 8) : 0);
    const squash = bunny.isMoving ? 1 + Math.sin(bunny.hopPhase * 2) * 0.08 : 1;

    // Ground Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    const shadowScale = Math.max(0.4, 1 - hopYOffset / 40);
    ctx.ellipse(bunny.x, bunny.y + 12, 13 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // 1. Level Aura Glow (Higher Bunny Level = Glowing Golden/Cyan Rings)
    if ((upg.level || 1) >= 2) {
      const auraPulse = (Math.sin(time * 0.006) + 1) / 2;
      ctx.strokeStyle = (upg.level || 1) >= 5 ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.4 + auraPulse * 0.3;
      ctx.beginPath();
      ctx.arc(bunny.x, bunny.y - hopYOffset, 22 + (upg.level || 1) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // 2. Shield Protective Bubble (if upgraded)
    if ((upg.shieldLevel || 0) >= 1) {
      const shieldGlow = (Math.sin(time * 0.008) + 1) / 2;
      ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + shieldGlow * 0.4})`;
      ctx.fillStyle = `rgba(52, 211, 153, 0.08)`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(bunny.x, bunny.y - hopYOffset - 4, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.translate(bunny.x, bunny.y - hopYOffset);

    if (bunny.facing === 'left') {
      ctx.scale(-1, 1);
    }

    let bodyColor = '#ffffff';
    let earInnerColor = '#fda4af';
    let cheekColor = '#fecdd3';
    let eyeColor = '#1e293b';

    if (bunny.skin === 'caramel') {
      bodyColor = '#fcd34d';
      earInnerColor = '#f87171';
      cheekColor = '#fbbf24';
    } else if (bunny.skin === 'pink') {
      bodyColor = '#fbcfe8';
      earInnerColor = '#f472b6';
      cheekColor = '#f43f5e';
    } else if (bunny.skin === 'spotted') {
      bodyColor = '#f1f5f9';
      earInnerColor = '#fb7185';
      cheekColor = '#fecdd3';
    } else if (bunny.skin === 'shadow') {
      bodyColor = '#334155';
      earInnerColor = '#64748b';
      cheekColor = '#475569';
      eyeColor = '#38bdf8';
    }

    // Fluffy Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(-14, 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // Bunny Ears
    const earBounce = Math.sin(bunny.hopPhase) * 0.25;

    // Back Ear
    ctx.save();
    ctx.translate(-2, -14);
    ctx.rotate(-0.15 - earBounce);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -12, 4.5, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = earInnerColor;
    ctx.beginPath();
    ctx.ellipse(0, -12, 2.5, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Front Ear
    ctx.save();
    ctx.translate(4, -14);
    ctx.rotate(0.15 + earBounce);
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, -13, 5, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = earInnerColor;
    ctx.beginPath();
    ctx.ellipse(0, -13, 2.8, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 * squash, 14 / squash, 0.1, 0, Math.PI * 2);
    ctx.fill();

    if (bunny.skin === 'spotted') {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(-4, -2, 5, 0, Math.PI * 2);
      ctx.arc(6, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(6, -8, 10.5, 0, Math.PI * 2);
    ctx.fill();

    // Cheek Blush
    ctx.fillStyle = cheekColor;
    ctx.beginPath();
    ctx.ellipse(8, -4, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(9, -8, 2.8, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8.2, -9.2, 1.2, 0, Math.PI * 2);
    ctx.arc(10, -7.5, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(14, -6);
    ctx.lineTo(16, -7);
    ctx.lineTo(16, -5);
    ctx.closePath();
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = bunny.skin === 'shadow' ? '#94a3b8' : '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, -5);
    ctx.lineTo(19, -7);
    ctx.moveTo(13, -4);
    ctx.lineTo(19, -3);
    ctx.stroke();

    // Accessories
    if (bunny.accessory === 'flower') {
      ctx.fillStyle = '#ec4899';
      for (let p = 0; p < 5; p++) {
        const pa = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(1 + Math.cos(pa) * 4, -16 + Math.sin(pa) * 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(1, -16, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bunny.accessory === 'straw_hat') {
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.ellipse(3, -17, 13, 3.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(3, -20, 6.5, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-2, -18, 10, 2);
    } else if (bunny.accessory === 'red_ribbon') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(7, 1);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, 5);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(7, 1);
      ctx.lineTo(11, -3);
      ctx.lineTo(11, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(7, 1, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (bunny.accessory === 'carrot_pack') {
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(-8, -1, 5, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(-9, -9, 2, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (bunny.accessory === 'glasses') {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(9, -8, 4.2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(5, -8);
      ctx.lineTo(1, -9);
      ctx.stroke();
    }

    ctx.restore();
  };

  // Draw Foreground Decors (Trees: Oak, Pine, Blossom, Apple, Willow, Birch, Maple, Golden; Fences & Gates; Hazards)
  const drawForegroundDecors = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const decor of decorsRef.current) {
      if (decor.type === 'wooden_fence') {
        // Solid Fence Barricade
        ctx.fillStyle = '#a16207';
        ctx.fillRect(decor.x - decor.width / 2, decor.y - 12, decor.width, 6);
        ctx.fillRect(decor.x - decor.width / 2, decor.y + 4, decor.width, 6);
        ctx.fillStyle = '#ca8a04';
        for (let fx = decor.x - decor.width / 2; fx <= decor.x + decor.width / 2; fx += 18) {
          ctx.beginPath();
          ctx.moveTo(fx, decor.y - 20);
          ctx.lineTo(fx + 5, decor.y - 25);
          ctx.lineTo(fx + 10, decor.y - 20);
          ctx.lineTo(fx + 10, decor.y + 16);
          ctx.lineTo(fx, decor.y + 16);
          ctx.closePath();
          ctx.fill();
        }
      } else if (decor.type === 'fence_gate') {
        // Open Gate (Permeable passage)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(decor.x - decor.width / 2, decor.y - 24, 12, 40);
        ctx.fillRect(decor.x + decor.width / 2 - 12, decor.y - 24, 12, 40);
        // Gate Archway
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(decor.x - decor.width / 2, decor.y - 26, decor.width, 8);
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 10px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚪 CỔNG', decor.x, decor.y - 14);
      } else if (decor.type === 'thorn_bush') {
        // Hazardous Bramble Bush
        ctx.fillStyle = '#3f1828';
        ctx.beginPath();
        ctx.arc(decor.x - 10, decor.y, 16, 0, Math.PI * 2);
        ctx.arc(decor.x + 10, decor.y, 16, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 8, 18, 0, Math.PI * 2);
        ctx.fill();
        // Sharp Spikes
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        for (let sp = 0; sp < 6; sp++) {
          const spa = (sp * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(decor.x + Math.cos(spa) * 12, decor.y + Math.sin(spa) * 12);
          ctx.lineTo(decor.x + Math.cos(spa) * 22, decor.y + Math.sin(spa) * 22);
          ctx.stroke();
        }
      } else if (decor.type === 'bush') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y, 16, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y, 16, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 8, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'rock') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, decor.width / 2, decor.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(decor.x - 4, decor.y - 4, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'stump') {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 6, decor.width / 2, decor.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 2, decor.width / 2.2, decor.height / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_oak') {
        // Detailed Majestic Oak Tree
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 38, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprawling Roots
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(decor.x - 22, decor.y + 10);
        ctx.quadraticCurveTo(decor.x - 8, decor.y - 5, decor.x - 14, decor.y - 25);
        ctx.lineTo(decor.x + 14, decor.y - 25);
        ctx.quadraticCurveTo(decor.x + 8, decor.y - 5, decor.x + 22, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Sturdy Trunk
        ctx.fillStyle = '#5c2c16';
        ctx.beginPath();
        ctx.moveTo(decor.x - 14, decor.y + 8);
        ctx.lineTo(decor.x - 11, decor.y - 38);
        ctx.lineTo(decor.x + 11, decor.y - 38);
        ctx.lineTo(decor.x + 14, decor.y + 8);
        ctx.closePath();
        ctx.fill();

        // Trunk bark striations & branches
        ctx.strokeStyle = '#381a08';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(decor.x - 4, decor.y + 6);
        ctx.lineTo(decor.x - 5, decor.y - 32);
        ctx.moveTo(decor.x + 4, decor.y + 6);
        ctx.lineTo(decor.x + 3, decor.y - 32);
        // Left & right branches reaching into canopy
        ctx.moveTo(decor.x - 8, decor.y - 30);
        ctx.lineTo(decor.x - 24, decor.y - 52);
        ctx.moveTo(decor.x + 8, decor.y - 30);
        ctx.lineTo(decor.x + 24, decor.y - 52);
        ctx.stroke();

        // Layer 1: Base Dark Green Shadow Canopy
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(decor.x - 30, decor.y - 58, 30, 0, Math.PI * 2);
        ctx.arc(decor.x + 30, decor.y - 58, 30, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 82, 38, 0, Math.PI * 2);
        ctx.arc(decor.x - 18, decor.y - 88, 28, 0, Math.PI * 2);
        ctx.arc(decor.x + 18, decor.y - 88, 28, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Lush Forest Green Midtone
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(decor.x - 24, decor.y - 62, 26, 0, Math.PI * 2);
        ctx.arc(decor.x + 24, decor.y - 62, 26, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 84, 32, 0, Math.PI * 2);
        ctx.arc(decor.x - 12, decor.y - 92, 24, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y - 92, 24, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Vibrant Leaf Green Canopy Lobes
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(decor.x - 16, decor.y - 68, 20, 0, Math.PI * 2);
        ctx.arc(decor.x + 16, decor.y - 68, 20, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 92, 24, 0, Math.PI * 2);
        ctx.arc(decor.x - 8, decor.y - 98, 16, 0, Math.PI * 2);
        ctx.arc(decor.x + 8, decor.y - 98, 16, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Sunny Highlights
        ctx.fillStyle = '#86efac';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y - 74, 11, 0, Math.PI * 2);
        ctx.arc(decor.x + 14, decor.y - 72, 10, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 98, 13, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_pine') {
        // Pine Tree (kept original as requested)
        ctx.fillStyle = '#451a03';
        ctx.fillRect(decor.x - 9, decor.y - 20, 18, 35);
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.moveTo(decor.x, decor.y - 110);
        ctx.lineTo(decor.x + 35, decor.y - 70);
        ctx.lineTo(decor.x - 35, decor.y - 70);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(decor.x, decor.y - 80);
        ctx.lineTo(decor.x + 45, decor.y - 40);
        ctx.lineTo(decor.x - 45, decor.y - 40);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(decor.x, decor.y - 50);
        ctx.lineTo(decor.x + 55, decor.y - 10);
        ctx.lineTo(decor.x - 55, decor.y - 10);
        ctx.closePath();
        ctx.fill();
      } else if (decor.type === 'tree_blossom') {
        // Detailed Cherry Blossom Tree with blooming sakura flowers & fallen petals
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fallen pink flower petals on grass
        const petalColors = ['#f472b6', '#fbcfe8', '#fda4af', '#fb7185'];
        const fallenPetals = [
          { dx: -24, dy: 10, r: 2.2 },
          { dx: -16, dy: 14, r: 1.8 },
          { dx: -8, dy: 8, r: 2.4 },
          { dx: 12, dy: 11, r: 2.0 },
          { dx: 22, dy: 13, r: 2.3 },
          { dx: 28, dy: 8, r: 1.7 },
        ];
        fallenPetals.forEach((fp, idx) => {
          ctx.fillStyle = petalColors[idx % petalColors.length];
          ctx.beginPath();
          ctx.ellipse(decor.x + fp.dx, decor.y + fp.dy, fp.r * 1.4, fp.r * 0.8, 0.4, 0, Math.PI * 2);
          ctx.fill();
        });

        // Detailed Cherry Tree Trunk & Roots
        ctx.fillStyle = '#4a2211';
        ctx.beginPath();
        ctx.moveTo(decor.x - 18, decor.y + 10);
        ctx.quadraticCurveTo(decor.x - 6, decor.y - 5, decor.x - 12, decor.y - 32);
        ctx.lineTo(decor.x + 12, decor.y - 32);
        ctx.quadraticCurveTo(decor.x + 6, decor.y - 5, decor.x + 18, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Bark highlights & wood grain
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(decor.x - 3, decor.y + 6);
        ctx.lineTo(decor.x - 4, decor.y - 28);
        ctx.moveTo(decor.x + 3, decor.y + 6);
        ctx.lineTo(decor.x + 4, decor.y - 28);
        ctx.stroke();

        // Branch forks extending into pink canopy
        ctx.strokeStyle = '#381a0d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(decor.x - 8, decor.y - 25);
        ctx.quadraticCurveTo(decor.x - 18, decor.y - 42, decor.x - 26, decor.y - 50);
        ctx.moveTo(decor.x + 8, decor.y - 25);
        ctx.quadraticCurveTo(decor.x + 18, decor.y - 42, decor.x + 26, decor.y - 50);
        ctx.moveTo(decor.x, decor.y - 30);
        ctx.lineTo(decor.x, decor.y - 65);
        ctx.stroke();

        // Layer 1: Deep Rose Shadow Blossom Canopy
        ctx.fillStyle = '#9d174d';
        ctx.beginPath();
        ctx.arc(decor.x - 28, decor.y - 54, 28, 0, Math.PI * 2);
        ctx.arc(decor.x + 28, decor.y - 54, 28, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 76, 36, 0, Math.PI * 2);
        ctx.arc(decor.x - 16, decor.y - 84, 26, 0, Math.PI * 2);
        ctx.arc(decor.x + 16, decor.y - 84, 26, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Vibrant Cherry Blossom Pink
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(decor.x - 24, decor.y - 58, 25, 0, Math.PI * 2);
        ctx.arc(decor.x + 24, decor.y - 58, 25, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 78, 32, 0, Math.PI * 2);
        ctx.arc(decor.x - 12, decor.y - 86, 24, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y - 86, 24, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Soft Pastel Sakura Puffs
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(decor.x - 15, decor.y - 64, 20, 0, Math.PI * 2);
        ctx.arc(decor.x + 15, decor.y - 64, 20, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 84, 26, 0, Math.PI * 2);
        ctx.arc(decor.x - 8, decor.y - 92, 17, 0, Math.PI * 2);
        ctx.arc(decor.x + 8, decor.y - 92, 17, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Light Powder Highlights
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y - 70, 12, 0, Math.PI * 2);
        ctx.arc(decor.x + 14, decor.y - 68, 11, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 92, 14, 0, Math.PI * 2);
        ctx.fill();

        // Distinct Blooming Sakura 5-Petal Flowers with Golden Centers
        const blossoms = [
          { bx: -32, by: -52, size: 5.5 },
          { bx: -20, by: -75, size: 6.0 },
          { bx: -10, by: -50, size: 5.0 },
          { bx: -2, by: -96, size: 6.5 },
          { bx: 14, by: -88, size: 5.5 },
          { bx: 28, by: -62, size: 6.0 },
          { bx: 8, by: -60, size: 5.0 },
          { bx: -22, by: -90, size: 5.0 },
          { bx: 22, by: -46, size: 5.2 },
          { bx: 0, by: -76, size: 6.5 },
        ];

        for (const b of blossoms) {
          const fx = decor.x + b.bx;
          const fy = decor.y + b.by;
          const r = b.size;

          // 5 Flower Petals
          ctx.fillStyle = '#ffe4e6';
          for (let p = 0; p < 5; p++) {
            const pa = (p * Math.PI * 2) / 5 - Math.PI / 2;
            const px = fx + Math.cos(pa) * (r * 0.75);
            const py = fy + Math.sin(pa) * (r * 0.75);
            ctx.beginPath();
            ctx.arc(px, py, r * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }

          // Flower Core
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.arc(fx, fy, r * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Golden Pistil / Stamen
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(fx, fy, r * 0.22, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (decor.type === 'tree_apple') {
        // Detailed Apple Tree with 3D apples, stems, and apple blossoms
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk & Roots
        ctx.fillStyle = '#4a2211';
        ctx.beginPath();
        ctx.moveTo(decor.x - 16, decor.y + 10);
        ctx.quadraticCurveTo(decor.x - 5, decor.y - 5, decor.x - 11, decor.y - 30);
        ctx.lineTo(decor.x + 11, decor.y - 30);
        ctx.quadraticCurveTo(decor.x + 5, decor.y - 5, decor.x + 16, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Branches
        ctx.strokeStyle = '#381a0d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(decor.x - 6, decor.y - 25);
        ctx.lineTo(decor.x - 20, decor.y - 45);
        ctx.moveTo(decor.x + 6, decor.y - 25);
        ctx.lineTo(decor.x + 20, decor.y - 45);
        ctx.stroke();

        // Layer 1: Dark Green Canopy
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(decor.x - 22, decor.y - 55, 26, 0, Math.PI * 2);
        ctx.arc(decor.x + 22, decor.y - 55, 26, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 75, 34, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Vibrant Orchard Leaf Green
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(decor.x - 18, decor.y - 58, 23, 0, Math.PI * 2);
        ctx.arc(decor.x + 18, decor.y - 58, 23, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 78, 28, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Sunlit Highlights
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(decor.x - 10, decor.y - 64, 16, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y - 64, 16, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 84, 18, 0, Math.PI * 2);
        ctx.fill();

        // White-Pink Apple Blossoms
        const appleBlossoms = [
          { bx: -26, by: -62 },
          { bx: 24, by: -72 },
          { bx: -4, by: -94 },
          { bx: 16, by: -48 },
        ];
        appleBlossoms.forEach((ab) => {
          const afx = decor.x + ab.bx;
          const afy = decor.y + ab.by;
          ctx.fillStyle = '#fff1f2';
          for (let p = 0; p < 5; p++) {
            const pa = (p * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.arc(afx + Math.cos(pa) * 3, afy + Math.sin(pa) * 3, 2.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(afx, afy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Juicy Red Apples with stems, leaf and shine
        const applePositions = [
          { dx: -20, dy: -46 },
          { dx: -12, dy: -74 },
          { dx: 8, dy: -56 },
          { dx: 22, dy: -52 },
          { dx: -2, dy: -80 },
          { dx: 18, dy: -78 },
        ];
        applePositions.forEach((ap) => {
          const ax = decor.x + ap.dx;
          const ay = decor.y + ap.dy;

          // Apple Stem
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ax, ay - 4);
          ctx.lineTo(ax + 2, ay - 7);
          ctx.stroke();

          // Apple Leaf
          ctx.fillStyle = '#4ade80';
          ctx.beginPath();
          ctx.ellipse(ax + 3, ay - 6, 2, 1, 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Apple Body (Deep red with bright red gradient)
          ctx.fillStyle = '#b91c1c';
          ctx.beginPath();
          ctx.arc(ax, ay, 5.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(ax - 0.8, ay - 0.8, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Specular Glint
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ax - 1.8, ay - 1.8, 1.4, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (decor.type === 'tree_golden') {
        // Detailed Ancient Mystic Golden Tree
        // Ground shadow with golden aura
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 42, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(251, 191, 36, 0.12)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 55, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ancient Golden Trunk & Roots
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.moveTo(decor.x - 20, decor.y + 10);
        ctx.quadraticCurveTo(decor.x - 6, decor.y - 5, decor.x - 13, decor.y - 34);
        ctx.lineTo(decor.x + 13, decor.y - 34);
        ctx.quadraticCurveTo(decor.x + 6, decor.y - 5, decor.x + 20, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Golden Bark Inscriptions
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(decor.x - 4, decor.y + 6);
        ctx.lineTo(decor.x - 5, decor.y - 30);
        ctx.moveTo(decor.x + 4, decor.y + 6);
        ctx.lineTo(decor.x + 5, decor.y - 30);
        ctx.stroke();

        // Layer 1: Warm Amber Base Canopy
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.arc(decor.x - 28, decor.y - 58, 28, 0, Math.PI * 2);
        ctx.arc(decor.x + 28, decor.y - 58, 28, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 82, 38, 0, Math.PI * 2);
        ctx.arc(decor.x - 16, decor.y - 88, 26, 0, Math.PI * 2);
        ctx.arc(decor.x + 16, decor.y - 88, 26, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Shimmering Gold Midtone
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(decor.x - 24, decor.y - 62, 25, 0, Math.PI * 2);
        ctx.arc(decor.x + 24, decor.y - 62, 25, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 84, 32, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Brilliant Golden Foliage
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(decor.x - 16, decor.y - 68, 20, 0, Math.PI * 2);
        ctx.arc(decor.x + 16, decor.y - 68, 20, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 90, 26, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Luminous Highlights
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y - 74, 12, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y - 74, 12, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 96, 14, 0, Math.PI * 2);
        ctx.fill();

        // Golden Star Flower/Spore Motifs
        const goldStars = [
          { gx: -24, gy: -56 },
          { gx: 22, gy: -60 },
          { gx: -6, gy: -82 },
          { gx: 16, gy: -94 },
          { gx: -18, gy: -96 },
        ];
        goldStars.forEach((gs) => {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(decor.x + gs.gx, decor.y + gs.gy, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(decor.x + gs.gx, decor.y + gs.gy, 3.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(decor.x + gs.gx, decor.y + gs.gy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (decor.type === 'tree_willow') {
        // Detailed Weeping Willow with cascading vine braids & leaf nodes
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 40, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk & Roots
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(decor.x - 18, decor.y + 10);
        ctx.quadraticCurveTo(decor.x - 6, decor.y - 5, decor.x - 14, decor.y - 32);
        ctx.lineTo(decor.x + 14, decor.y - 32);
        ctx.quadraticCurveTo(decor.x + 6, decor.y - 5, decor.x + 18, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Bark texture
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(decor.x - 4, decor.y + 6);
        ctx.lineTo(decor.x - 4, decor.y - 28);
        ctx.moveTo(decor.x + 4, decor.y + 6);
        ctx.lineTo(decor.x + 4, decor.y - 28);
        ctx.stroke();

        // Canopy Crown Base
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 74, 44, 32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 78, 38, 26, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 84, 28, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cascading Weeping Willow Vine Braids
        const willowVines = [-36, -26, -16, -8, 0, 8, 16, 26, 36];
        willowVines.forEach((vx, idx) => {
          const lengthVar = (idx % 2 === 0 ? 60 : 75) + Math.sin(idx) * 8;
          ctx.strokeStyle = idx % 2 === 0 ? '#16a34a' : '#4ade80';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(decor.x + vx, decor.y - 70);
          ctx.quadraticCurveTo(
            decor.x + vx + (idx % 2 === 0 ? 8 : -8),
            decor.y - 70 + lengthVar * 0.5,
            decor.x + vx + (idx % 2 === 0 ? 3 : -3),
            decor.y - 70 + lengthVar
          );
          ctx.stroke();

          // Leaf Nodes along the vine
          ctx.fillStyle = '#86efac';
          for (let step = 15; step < lengthVar - 5; step += 14) {
            ctx.beginPath();
            ctx.ellipse(
              decor.x + vx + (idx % 2 === 0 ? 4 : -4),
              decor.y - 70 + step,
              2.5,
              1.4,
              0.5,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        });
      } else if (decor.type === 'tree_birch') {
        // Detailed Birch Tree with realistic white bark, lenticels & golden foliage
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Slender White Birch Trunk
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(decor.x - 10, decor.y + 10);
        ctx.lineTo(decor.x - 7, decor.y - 42);
        ctx.lineTo(decor.x + 7, decor.y - 42);
        ctx.lineTo(decor.x + 10, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Birch Bark Dark Lenticels & Markings
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(decor.x - 9, decor.y + 2, 7, 3);
        ctx.fillRect(decor.x + 1, decor.y - 8, 8, 3.5);
        ctx.fillRect(decor.x - 8, decor.y - 18, 6, 2.5);
        ctx.fillRect(decor.x + 2, decor.y - 28, 7, 3);
        ctx.fillRect(decor.x - 7, decor.y - 36, 5, 2.5);

        // Birch Branches
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(decor.x - 6, decor.y - 35);
        ctx.lineTo(decor.x - 18, decor.y - 55);
        ctx.moveTo(decor.x + 6, decor.y - 35);
        ctx.lineTo(decor.x + 18, decor.y - 55);
        ctx.stroke();

        // Layer 1: Dark Amber Canopy
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 78, 30, 42, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Vibrant Golden Yellow Birch Canopy
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 82, 26, 36, 0, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Sunlit Golden Highlights
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(decor.x - 8, decor.y - 86, 15, 0, Math.PI * 2);
        ctx.arc(decor.x + 8, decor.y - 86, 15, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 100, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_maple') {
        // Detailed Autumn Crimson/Orange Maple Tree
        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 12, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk & Roots
        ctx.fillStyle = '#4a2211';
        ctx.beginPath();
        ctx.moveTo(decor.x - 16, decor.y + 10);
        ctx.quadraticCurveTo(decor.x - 5, decor.y - 5, decor.x - 12, decor.y - 32);
        ctx.lineTo(decor.x + 12, decor.y - 32);
        ctx.quadraticCurveTo(decor.x + 5, decor.y - 5, decor.x + 16, decor.y + 10);
        ctx.closePath();
        ctx.fill();

        // Branches
        ctx.strokeStyle = '#381a0d';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(decor.x - 6, decor.y - 25);
        ctx.lineTo(decor.x - 22, decor.y - 50);
        ctx.moveTo(decor.x + 6, decor.y - 25);
        ctx.lineTo(decor.x + 22, decor.y - 50);
        ctx.stroke();

        // Layer 1: Deep Crimson Red Base
        ctx.fillStyle = '#991b1b';
        ctx.beginPath();
        ctx.arc(decor.x - 26, decor.y - 56, 26, 0, Math.PI * 2);
        ctx.arc(decor.x + 26, decor.y - 56, 26, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 78, 34, 0, Math.PI * 2);
        ctx.fill();

        // Layer 2: Rich Autumn Scarlet
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(decor.x - 20, decor.y - 60, 24, 0, Math.PI * 2);
        ctx.arc(decor.x + 20, decor.y - 60, 24, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 82, 30, 0, Math.PI * 2);
        ctx.fill();

        // Layer 3: Vibrant Orange Canopy
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(decor.x - 14, decor.y - 66, 18, 0, Math.PI * 2);
        ctx.arc(decor.x + 14, decor.y - 66, 18, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 88, 24, 0, Math.PI * 2);
        ctx.fill();

        // Layer 4: Warm Amber Highlights
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(decor.x - 10, decor.y - 72, 12, 0, Math.PI * 2);
        ctx.arc(decor.x + 10, decor.y - 72, 12, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 94, 14, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'mushroom_red' || decor.type === 'mushroom_glow') {
        const isGlow = decor.type === 'mushroom_glow';
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(decor.x - 4, decor.y - 6, 8, 14);
        ctx.fillStyle = isGlow ? '#a855f7' : '#ef4444';
        ctx.beginPath();
        ctx.arc(decor.x, decor.y - 6, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = isGlow ? '#67e8f9' : '#ffffff';
        ctx.beginPath();
        ctx.arc(decor.x - 5, decor.y - 10, 2, 0, Math.PI * 2);
        ctx.arc(decor.x + 4, decor.y - 11, 2, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 14, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  const drawButterflies = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const bf of butterFliesRef.current) {
      const wingFlap = Math.abs(Math.sin(bf.phase * 3)) * 4 + 2;
      ctx.fillStyle = bf.color;
      ctx.beginPath();
      ctx.ellipse(bf.x - 3, bf.y, wingFlap, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(bf.x + 3, bf.y, wingFlap, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(bf.x, bf.y, 1, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawParticles = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const p of particlesRef.current) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'rain') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * 2, p.y + p.vy * 2);
        ctx.stroke();
      } else if (p.type === 'ripple') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.size * (1 + p.life), p.size * 0.5 * (1 + p.life), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'heart') {
        ctx.beginPath();
        ctx.arc(p.x - 2, p.y - 2, p.size * 0.5, 0, Math.PI * 2);
        ctx.arc(p.x + 2, p.y - 2, p.size * 0.5, 0, Math.PI * 2);
        ctx.moveTo(p.x - 4, p.y - 1);
        ctx.lineTo(p.x, p.y + 4);
        ctx.lineTo(p.x + 4, p.y - 1);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  };

  const drawRescues = (ctx: CanvasRenderingContext2D, time: number) => {
    ctx.save();
    for (const rescue of rescuesRef.current) {
      const { x, y, type, status, icon, titleVi } = rescue;
      const isSaved = status === 'saved';

      ctx.save();
      ctx.translate(x, y);

      // Pulse calculation for animations
      const pulse = (Math.sin(time * 0.005 + x) + 1) / 2;

      if (type === 'hedgehog_thorns') {
        if (!isSaved) {
          // 1. Spiky Thorn Bush
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            const rad = 24 + (a % 2 === 0 ? 6 : -4);
            ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
          }
          ctx.closePath();
          ctx.fillStyle = '#451a0344';
          ctx.fill();
          ctx.stroke();

          // Red sharp thorns
          ctx.fillStyle = '#ef4444';
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
            const tx = Math.cos(a) * 22;
            const ty = Math.sin(a) * 22;
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          // Trembling Hedgehog Body inside
          const tremble = Math.sin(time * 0.03) * 1.5;
          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.ellipse(tremble, tremble, 14, 11, 0, 0, Math.PI * 2);
          ctx.fill();

          // Hedgehog quills
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          for (let s = 0; s < 6; s++) {
            const sa = (s * Math.PI) / 5 + Math.PI;
            ctx.beginPath();
            ctx.moveTo(tremble + Math.cos(sa) * 8, tremble + Math.sin(sa) * 8);
            ctx.lineTo(tremble + Math.cos(sa) * 15, tremble + Math.sin(sa) * 15);
            ctx.stroke();
          }

          // Teary eyes
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(tremble + 4, tremble - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Happy Saved Hedgehog with Flower Wreath
          const hop = Math.abs(Math.sin(time * 0.006)) * 8;
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.ellipse(0, -hop, 15, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Smiling face & rosy cheeks
          ctx.fillStyle = '#fbcfe8';
          ctx.beginPath();
          ctx.arc(8, -hop + 2, 3, 0, Math.PI * 2);
          ctx.fill();

          // Flower crown
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(2, -hop - 10, 4, 0, Math.PI * 2);
          ctx.arc(-4, -hop - 8, 3, 0, Math.PI * 2);
          ctx.arc(6, -hop - 8, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'stream_trash') {
        if (!isSaved) {
          // Murky Water Ripple
          ctx.fillStyle = 'rgba(113, 63, 18, 0.45)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 32, 18, 0, 0, Math.PI * 2);
          ctx.fill();

          // Floating Plastic bottles and cans
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-16, -6, 14, 7);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(4, -4, 12, 8);
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.ellipse(-2, 4, 10, 6, 0.3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Sparkling Clear Waters & Leaping Fish
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 36, 20, 0, 0, Math.PI * 2);
          ctx.fill();

          const fishHop = Math.sin(time * 0.005) * 14;
          if (fishHop < 0) {
            ctx.fillStyle = '#fb923c';
            ctx.beginPath();
            ctx.ellipse(0, fishHop, 8, 4, -0.4, 0, Math.PI * 2);
            ctx.fill();
            // Tail
            ctx.beginPath();
            ctx.moveTo(-6, fishHop);
            ctx.lineTo(-10, fishHop - 4);
            ctx.lineTo(-10, fishHop + 4);
            ctx.closePath();
            ctx.fill();
          }

          // Water lilies
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(14, 4, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'wildfire_ember') {
        if (!isSaved) {
          // Charred ground & burning logs
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.ellipse(0, 4, 28, 16, 0, 0, Math.PI * 2);
          ctx.fill();

          // Glowing red/orange embers
          ctx.fillStyle = `rgba(239, 68, 68, ${0.6 + pulse * 0.4})`;
          ctx.beginPath();
          ctx.arc(-8, 2, 7, 0, Math.PI * 2);
          ctx.arc(6, 4, 8, 0, Math.PI * 2);
          ctx.arc(0, -3, 6, 0, Math.PI * 2);
          ctx.fill();

          // Charred logs
          ctx.fillStyle = '#27272a';
          ctx.fillRect(-18, 0, 36, 6);
        } else {
          // Blooming Forest Garden with Magical Sprout
          ctx.fillStyle = '#86efac';
          ctx.beginPath();
          ctx.ellipse(0, 6, 26, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // Glowing flower
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-2, -14, 4, 16);
          ctx.fillStyle = '#a855f7';
          ctx.beginPath();
          ctx.arc(0, -16, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, -16, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (type === 'fallen_nest') {
        if (!isSaved) {
          // Fallen twigs nest on ground
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 4, 18, 0, Math.PI);
          ctx.stroke();

          // Two baby chicks
          const tweet = Math.sin(time * 0.01) * 2;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(-6, tweet, 7, 0, Math.PI * 2);
          ctx.arc(6, -tweet, 7, 0, Math.PI * 2);
          ctx.fill();

          // Orange beaks
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-1, tweet - 1);
          ctx.lineTo(2, tweet);
          ctx.lineTo(-1, tweet + 1);
          ctx.closePath();
          ctx.fill();
        } else {
          // Restored nest & Mama bird
          ctx.fillStyle = '#86efac44';
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Mama bluebird perched
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.ellipse(0, -10, 10, 7, -0.2, 0, Math.PI * 2);
          ctx.arc(6, -15, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Overhead Floating Alert Banner
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      const badgeY = -34 - Math.sin(time * 0.005) * 4;

      if (!isSaved) {
        // Red / Orange Glowing SOS Badge
        const tagText = `${icon} ${titleVi}`;
        const tagWidth = ctx.measureText(tagText).width + 16;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-tagWidth / 2, badgeY - 14, tagWidth, 22, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(tagText, 0, badgeY + 1);
      } else {
        // Green Saved Badge
        const tagText = `✅ Đã Giải Cứu!`;
        const tagWidth = ctx.measureText(tagText).width + 14;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-tagWidth / 2, badgeY - 12, tagWidth, 20, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#a7f3d0';
        ctx.fillText(tagText, 0, badgeY + 1);
      }

      ctx.restore();
    }
    ctx.restore();
  };

  const drawWeatherAndLighting = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    camX: number,
    camY: number,
    bunny: BunnyEntity,
    wType: WeatherType
  ) => {
    ctx.save();
    if (wType === 'night') {
      const nightGrad = ctx.createRadialGradient(bunny.x, bunny.y, 30, bunny.x, bunny.y, 220);
      nightGrad.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
      nightGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.7)');
      nightGrad.addColorStop(1, 'rgba(10, 15, 30, 0.88)');

      ctx.fillStyle = nightGrad;
      ctx.fillRect(camX, camY, width, height);

      for (const ff of firefliesRef.current) {
        ctx.fillStyle = `rgba(250, 204, 21, ${ff.glow * 0.9})`;
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(253, 224, 71, ${ff.glow * 0.25})`;
        ctx.beginPath();
        ctx.arc(ff.x, ff.y, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (wType === 'afternoon') {
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fillRect(camX, camY, width, height);
    } else if (wType === 'rainy' || wType === 'rain') {
      // 1. Atmospheric rainy overcast tint
      ctx.fillStyle = 'rgba(23, 37, 56, 0.32)';
      ctx.fillRect(camX, camY, width, height);

      // 2. Soft moving rain mist layers
      const mistOffset = (Date.now() * 0.02) % width;
      const mistGrad = ctx.createLinearGradient(camX, camY, camX + width, camY + height);
      mistGrad.addColorStop(0, 'rgba(186, 230, 253, 0.04)');
      mistGrad.addColorStop(0.5, 'rgba(147, 197, 253, 0.08)');
      mistGrad.addColorStop(1, 'rgba(186, 230, 253, 0.03)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(camX, camY, width, height);

      // 3. Ground Rain Puddle Ripples
      ctx.lineWidth = 1.2;
      for (const rip of rainRipplesRef.current) {
        ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Falling Raindrop Particles (Streaks across screen)
      for (const drop of rainDropsRef.current) {
        ctx.lineWidth = drop.width;
        ctx.strokeStyle = `rgba(224, 242, 254, ${drop.opacity})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.vx * 0.85, drop.y - drop.length);
        ctx.stroke();
      }

      // 5. Ambient Lightning Flash
      if (lightningFlashRef.current.alpha > 0) {
        ctx.fillStyle = `rgba(240, 249, 255, ${lightningFlashRef.current.alpha})`;
        ctx.fillRect(camX, camY, width, height);
      }
    } else if (wType === 'sunny') {
      ctx.fillStyle = 'rgba(254, 240, 138, 0.05)';
      ctx.beginPath();
      ctx.moveTo(camX, camY);
      ctx.lineTo(camX + 300, camY);
      ctx.lineTo(camX + 500, camY + height);
      ctx.lineTo(camX + 200, camY + height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };

  return (
    <canvas
      ref={canvasRef}
      id="forest-game-canvas"
      className="w-full h-full block cursor-pointer select-none"
      onClick={handleCanvasClick}
      onTouchStart={handleCanvasClick}
    />
  );
};

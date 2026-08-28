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
} from '../types';
import {
  FOREST_BIOMES,
  generateInitialWorld,
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
  onStatsUpdate: (updater: (prev: DiscoveryStats) => DiscoveryStats) => void;
  onZoneChange: (zoneNameVi: string) => void;
  onAnimalInteract: (animal: ForestAnimal) => void;
  joystickVector: { x: number; y: number } | null;
  onJumpTriggered: () => void;
  jumpSignal: number;
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
  const particlesRef = useRef<Particle[]>([]);
  const footstepsRef = useRef<Footstep[]>([]);
  const butterFliesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; phase: number }>>([]);
  const firefliesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; glow: number }>>([]);

  const currentZoneRef = useRef<string>('Thảm Cỏ Nhà Thỏ');
  const animationFrameId = useRef<number>(0);
  const prevJumpSignal = useRef<number>(jumpSignal);
  const hazardCooldownRef = useRef<number>(0);

  // Sync Skin & Accessory to ref
  useEffect(() => {
    bunnyRef.current.skin = bunnySkin;
    bunnyRef.current.accessory = bunnyAccessory;
  }, [bunnySkin, bunnyAccessory]);

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
          // Set respawn timer: 15-25 seconds
          item.maxRespawnTimer = 900 + Math.random() * 600;
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

      // Weather Particles (Rain / Fireflies)
      if (weather === 'rainy') {
        rainSpawnTimer++;
        if (rainSpawnTimer % 2 === 0) {
          const camX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
          const camY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));
          for (let r = 0; r < 5; r++) {
            particlesRef.current.push({
              x: camX + Math.random() * canvas.width,
              y: camY - 10,
              vx: -1.5,
              vy: 9 + Math.random() * 4,
              size: 1.5,
              color: '#bae6fd',
              alpha: 0.6,
              life: 0,
              maxLife: 45,
              type: 'rain',
            });
          }
        }
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;

        if (p.type === 'rain' && p.life >= p.maxLife) {
          particlesRef.current.push({
            x: p.x,
            y: p.y,
            vx: 0,
            vy: 0,
            size: 2,
            color: '#e0f2fe',
            alpha: 0.5,
            life: 0,
            maxLife: 10,
            type: 'ripple',
          });
        }

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

      // --- RENDERING PASS ---
      const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
      const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.translate(-cameraX, -cameraY);

      // 1. Forest Ground & Paths
      drawForestBackground(ctx, weather);

      // 2. River Stream (Animated with ripples)
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

  const drawForestBackground = (ctx: CanvasRenderingContext2D, currentW: WeatherType) => {
    let topColor = '#4ade80';
    let bottomColor = '#22c55e';
    if (currentW === 'night') {
      topColor = '#1e3a2f';
      bottomColor = '#132a21';
    } else if (currentW === 'afternoon') {
      topColor = '#84cc16';
      bottomColor = '#4d7c0f';
    } else if (currentW === 'rainy') {
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

    // Grass Tuft Accents
    ctx.fillStyle = currentW === 'night' ? '#14532d' : '#86efac44';
    for (let gx = 120; gx < WORLD_WIDTH; gx += 180) {
      for (let gy = 120; gy < WORLD_HEIGHT; gy += 180) {
        ctx.fillRect(gx + Math.sin(gy) * 20, gy, 4, 10);
        ctx.fillRect(gx + 6 + Math.sin(gy) * 20, gy + 2, 4, 8);
      }
    }
  };

  // Render the River Stream (realistic sine curve with water foam, riverbanks, and flow currents)
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

    // 5. Riverbank Stones / Pebbles on West and East banks
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
      ctx.fillStyle = `rgba(120, 53, 15, ${fs.alpha * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(fs.x - (fs.facing === 'left' ? 4 : -4), fs.y, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.ellipse(fs.x + (fs.facing === 'left' ? 4 : -4), fs.y + 2, 3.5, 2, 0, 0, Math.PI * 2);
      ctx.fill();
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
        // Oak Tree
        ctx.fillStyle = '#5c2c16';
        ctx.fillRect(decor.x - 12, decor.y - 30, 24, 45);
        ctx.fillStyle = '#166534';
        ctx.beginPath();
        ctx.arc(decor.x - 24, decor.y - 55, 30, 0, Math.PI * 2);
        ctx.arc(decor.x + 24, decor.y - 55, 30, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 75, 35, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(decor.x - 15, decor.y - 65, 22, 0, Math.PI * 2);
        ctx.arc(decor.x + 15, decor.y - 65, 22, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 85, 26, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_pine') {
        // Pine Tree
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
        // Sakura Blossom Tree
        ctx.fillStyle = '#582f1b';
        ctx.fillRect(decor.x - 11, decor.y - 28, 22, 42);
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(decor.x - 22, decor.y - 50, 28, 0, Math.PI * 2);
        ctx.arc(decor.x + 22, decor.y - 50, 28, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 70, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y - 60, 20, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y - 60, 20, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 78, 24, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_apple') {
        // Apple Tree with red apples
        ctx.fillStyle = '#5c2c16';
        ctx.fillRect(decor.x - 12, decor.y - 28, 24, 42);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(decor.x, decor.y - 65, 36, 0, Math.PI * 2);
        ctx.fill();
        // Red Apples
        ctx.fillStyle = '#ef4444';
        for (let ap = 0; ap < 5; ap++) {
          const apx = decor.x + Math.sin(ap * 2) * 20;
          const apy = decor.y - 65 + Math.cos(ap * 2) * 18;
          ctx.beginPath();
          ctx.arc(apx, apy, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (decor.type === 'tree_golden') {
        // Golden Tree with sparkling leaves
        ctx.fillStyle = '#78350f';
        ctx.fillRect(decor.x - 12, decor.y - 28, 24, 42);
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(decor.x, decor.y - 70, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y - 75, 22, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y - 75, 22, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_willow') {
        // Willow Tree with drooping vines
        ctx.fillStyle = '#451a03';
        ctx.fillRect(decor.x - 14, decor.y - 30, 28, 45);
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 70, 42, 30, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 3;
        for (let v = -30; v <= 30; v += 12) {
          ctx.beginPath();
          ctx.moveTo(decor.x + v, decor.y - 65);
          ctx.quadraticCurveTo(decor.x + v + 8, decor.y - 30, decor.x + v, decor.y - 10);
          ctx.stroke();
        }
      } else if (decor.type === 'tree_birch') {
        // Birch Tree with white trunk & notches
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(decor.x - 10, decor.y - 35, 20, 50);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(decor.x - 10, decor.y - 25, 8, 3);
        ctx.fillRect(decor.x + 2, decor.y - 12, 8, 3);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 75, 28, 36, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_maple') {
        // Autumn Red/Orange Maple Tree
        ctx.fillStyle = '#5c2c16';
        ctx.fillRect(decor.x - 12, decor.y - 30, 24, 45);
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(decor.x - 20, decor.y - 60, 28, 0, Math.PI * 2);
        ctx.arc(decor.x + 20, decor.y - 60, 28, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 80, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(decor.x, decor.y - 70, 24, 0, Math.PI * 2);
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
    } else if (wType === 'rainy') {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.28)';
      ctx.fillRect(camX, camY, width, height);
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

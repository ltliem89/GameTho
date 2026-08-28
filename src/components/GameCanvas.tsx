import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BunnyAccessory, BunnyEntity, BunnySkin, CollectibleItem, DiscoveryStats, Footstep, ForestAnimal, ForestDecor, Particle, WeatherType } from '../types';
import { FOREST_ZONES, generateInitialWorld, WORLD_HEIGHT, WORLD_WIDTH } from '../utils/forestWorld';
import { sounds } from '../utils/audio';

interface GameCanvasProps {
  weather: WeatherType;
  bunnySkin: BunnySkin;
  bunnyAccessory: BunnyAccessory;
  speedMultiplier: number;
  onStatsUpdate: (stats: DiscoveryStats) => void;
  onZoneChange: (zoneNameVi: string) => void;
  onAnimalInteract: (animal: ForestAnimal) => void;
  joystickVector: { x: number; y: number } | null;
  onJumpTriggered: () => void;
  jumpSignal: number;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  weather,
  bunnySkin,
  bunnyAccessory,
  speedMultiplier,
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

  const statsRef = useRef<DiscoveryStats>({
    carrots: 0,
    berries: 0,
    clovers: 0,
    animalsTalked: [],
    burrowsFound: 0,
    areasVisited: ['Thảm Cỏ Nhà Thỏ'],
    stepsCount: 0,
  });

  const currentZoneRef = useRef<string>('Thảm Cỏ Nhà Thỏ');
  const animationFrameId = useRef<number>(0);
  const prevJumpSignal = useRef<number>(jumpSignal);

  // Sync Skin & Accessory to ref
  useEffect(() => {
    bunnyRef.current.skin = bunnySkin;
    bunnyRef.current.accessory = bunnyAccessory;
  }, [bunnySkin, bunnyAccessory]);

  // Handle jump signal from external UI button
  useEffect(() => {
    if (jumpSignal !== prevJumpSignal.current) {
      prevJumpSignal.current = jumpSignal;
      doJump();
    }
  }, [jumpSignal]);

  const doJump = useCallback(() => {
    const bunny = bunnyRef.current;
    if (!bunny.isJumping) {
      bunny.isJumping = true;
      bunny.jumpHeight = 1;
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

  // Initialize World
  useEffect(() => {
    const initial = generateInitialWorld();
    decorsRef.current = initial.decors;
    collectiblesRef.current = initial.collectibles;
    animalsRef.current = initial.animals;

    // Butterflies
    const bFlies = [];
    for (let i = 0; i < 18; i++) {
      bFlies.push({
        x: 300 + Math.random() * 1000,
        y: 1200 + Math.random() * 900,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        color: ['#f472b6', '#fbbf24', '#a78bfa', '#60a5fa', '#f87171'][Math.floor(Math.random() * 5)],
        phase: Math.random() * Math.PI * 2,
      });
    }
    butterFliesRef.current = bFlies;

    // Fireflies
    const fFlies = [];
    for (let i = 0; i < 35; i++) {
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
      // Prevent scrolling when playing with arrow keys / space
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

      // Clear click target if keyboard used
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

  // Handle Canvas Click to Walk / Tap to Move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e) {
      if (e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const mouseCanvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const mouseCanvasY = (clientY - rect.top) * (canvas.height / rect.height);

    const bunny = bunnyRef.current;
    const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
    const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));

    const worldTargetX = mouseCanvasX + cameraX;
    const worldTargetY = mouseCanvasY + cameraY;

    // Check if clicked near an animal to interact directly
    for (const animal of animalsRef.current) {
      const dist = Math.hypot(animal.x - worldTargetX, animal.y - worldTargetY);
      if (dist < 60) {
        triggerAnimalDialogue(animal);
        return;
      }
    }

    clickTarget.current = {
      x: Math.max(80, Math.min(WORLD_WIDTH - 80, worldTargetX)),
      y: Math.max(80, Math.min(WORLD_HEIGHT - 80, worldTargetY)),
      active: true,
      timer: 0,
    };
  };

  const triggerAnimalDialogue = (animal: ForestAnimal) => {
    sounds.playChirp();
    const dialogues = animal.dialogueVi;
    const nextText = dialogues[Math.floor(Math.random() * dialogues.length)];
    animal.currentDialogue = nextText;
    animal.dialogueTimer = 180; // 3 seconds at 60fps
    animal.state = 'happy';

    if (!statsRef.current.animalsTalked.includes(animal.id)) {
      statsRef.current.animalsTalked.push(animal.id);
      onStatsUpdate({ ...statsRef.current });
      sounds.playChime();
    }
    onAnimalInteract(animal);
  };

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let stepTimer = 0;
    let rainSpawnTimer = 0;

    const gameLoop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // 1. Handle Resize dynamically
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }

      const bunny = bunnyRef.current;
      const baseSpeed = bunny.speed * speedMultiplier;
      let moveX = 0;
      let moveY = 0;

      // Input from Keyboard
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveY -= 1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveY += 1;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX -= 1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX += 1;

      // Input from Touch Joystick
      if (joystickVector && (joystickVector.x !== 0 || joystickVector.y !== 0)) {
        moveX = joystickVector.x;
        moveY = joystickVector.y;
        clickTarget.current = null;
      }

      // Input from Click-to-move
      if (clickTarget.current && clickTarget.current.active) {
        const dx = clickTarget.current.x - bunny.x;
        const dy = clickTarget.current.y - bunny.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 10) {
          clickTarget.current.active = false;
        } else {
          moveX = dx / dist;
          moveY = dy / dist;
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
        bunny.hopPhase += 0.22;
        stepTimer++;
        if (stepTimer > 16) {
          stepTimer = 0;
          sounds.playHop();
          statsRef.current.stepsCount++;
          onStatsUpdate({ ...statsRef.current });

          // Leave a subtle footstep
          footstepsRef.current.push({
            x: bunny.x,
            y: bunny.y + 10,
            alpha: 0.5,
            facing: bunny.facing,
          });

          // Small dust puff
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
        bunny.jumpHeight += 0.12;
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

      // Move bunny with soft boundaries
      const nextX = bunny.x + moveX;
      const nextY = bunny.y + moveY;

      // World Boundary Constraints
      bunny.x = Math.max(60, Math.min(WORLD_WIDTH - 60, nextX));
      bunny.y = Math.max(60, Math.min(WORLD_HEIGHT - 60, nextY));

      // Zone Checking
      for (const zone of FOREST_ZONES) {
        if (
          bunny.x >= zone.bounds.minX &&
          bunny.x <= zone.bounds.maxX &&
          bunny.y >= zone.bounds.minY &&
          bunny.y <= zone.bounds.maxY
        ) {
          if (currentZoneRef.current !== zone.nameVi) {
            currentZoneRef.current = zone.nameVi;
            onZoneChange(zone.nameVi);
            if (!statsRef.current.areasVisited.includes(zone.nameVi)) {
              statsRef.current.areasVisited.push(zone.nameVi);
              sounds.playChime();
              onStatsUpdate({ ...statsRef.current });
            }
          }
          break;
        }
      }

      // Burrow / Hole Teleport Interaction (Fast-Travel)
      for (const decor of decorsRef.current) {
        if (decor.type === 'burrow') {
          const dist = Math.hypot(decor.x - bunny.x, decor.y - bunny.y);
          if (dist < 32) {
            // Check if we are jumping into it
            if (bunny.isJumping) {
              sounds.playBurrowPop();
              statsRef.current.burrowsFound++;
              onStatsUpdate({ ...statsRef.current });

              // Burrow particles
              for (let i = 0; i < 15; i++) {
                particlesRef.current.push({
                  x: decor.x,
                  y: decor.y,
                  vx: (Math.random() - 0.5) * 3,
                  vy: (Math.random() - 0.5) * 3,
                  size: 4,
                  color: '#fbbf24',
                  alpha: 0.9,
                  life: 0,
                  maxLife: 30,
                  type: 'sparkle',
                });
              }

              // Teleport to the opposite burrow
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
      }

      // Check Collectibles
      for (const item of collectiblesRef.current) {
        if (!item.collected) {
          item.bobPhase += 0.05;
          const dist = Math.hypot(item.x - bunny.x, item.y - bunny.y);
          if (dist < 35) {
            item.collected = true;
            if (item.type === 'carrot' || item.type === 'golden_carrot') {
              sounds.playMunch();
              bunny.carrotsEaten += item.type === 'golden_carrot' ? 5 : 1;
              statsRef.current.carrots += item.type === 'golden_carrot' ? 5 : 1;
            } else if (item.type === 'berry') {
              sounds.playMunch();
              bunny.berriesPicked += 1;
              statsRef.current.berries += 1;
            } else if (item.type === 'clover') {
              sounds.playChime();
              bunny.cloversFound += 1;
              statsRef.current.clovers += 1;
            }

            onStatsUpdate({ ...statsRef.current });

            // Spawn floating hearts / sparkles
            for (let p = 0; p < 8; p++) {
              particlesRef.current.push({
                x: item.x,
                y: item.y,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 2 - 1,
                size: Math.random() * 3 + 2,
                color: item.type === 'golden_carrot' ? '#f59e0b' : item.type === 'clover' ? '#22c55e' : item.type === 'berry' ? '#ec4899' : '#f97316',
                alpha: 1,
                life: 0,
                maxLife: 25,
                type: item.type === 'golden_carrot' ? 'sparkle' : 'heart',
              });
            }
          }
        }
      }

      // Update Animals & Proximity interactions
      for (const animal of animalsRef.current) {
        if (animal.dialogueTimer > 0) {
          animal.dialogueTimer--;
        }

        // Random subtle movements
        animal.stateTimer++;
        if (animal.stateTimer > 120 + Math.random() * 120) {
          animal.stateTimer = 0;
          animal.state = Math.random() < 0.3 ? 'walking' : 'idle';
          if (animal.state === 'walking') {
            animal.facing = Math.random() < 0.5 ? 'left' : 'right';
          }
        }

        if (animal.state === 'walking') {
          const moveDir = animal.facing === 'left' ? -0.4 : 0.4;
          animal.x += moveDir;
          // Keep near initial territory
          if (Math.abs(animal.x - animal.initialX) > 60) {
            animal.facing = animal.x > animal.initialX ? 'left' : 'right';
          }
        }

        // Auto show dialogue bubble when bunny is very close
        const distToBunny = Math.hypot(animal.x - bunny.x, animal.y - bunny.y);
        if (distToBunny < 55 && animal.dialogueTimer <= 0) {
          triggerAnimalDialogue(animal);
        }
      }

      // Update Weather Particles (Rain / Fireflies / Leaves)
      if (weather === 'rainy') {
        rainSpawnTimer++;
        if (rainSpawnTimer % 2 === 0) {
          const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
          const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));
          for (let r = 0; r < 5; r++) {
            particlesRef.current.push({
              x: cameraX + Math.random() * canvas.width,
              y: cameraY - 10,
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
          // Splash ripple
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
      // Camera positioning centered on Bunny with boundary clamping
      const cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvas.width, bunny.x - canvas.width / 2));
      const cameraY = Math.max(0, Math.min(WORLD_HEIGHT - canvas.height, bunny.y - canvas.height / 2));

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Translate Canvas Viewport
      ctx.translate(-cameraX, -cameraY);

      // 1. Draw Forest Base Grass & Biome Transitions
      drawForestBackground(ctx, weather);

      // 2. Draw Footsteps
      drawFootsteps(ctx);

      // 3. Draw Water Ponds / River & Bridges
      drawWaterwaysAndBridges(ctx, weather);

      // 4. Draw Click/Tap Navigation Marker if active
      if (clickTarget.current && clickTarget.current.active) {
        drawClickTargetMarker(ctx, clickTarget.current.x, clickTarget.current.y, currentTime);
      }

      // 5. Draw Collectibles
      drawCollectibles(ctx);

      // 6. Draw Lower Decor (Flowers, burrows, grass tufts)
      drawBackgroundDecors(ctx);

      // 7. Draw Animals
      drawForestAnimals(ctx);

      // 8. Draw Bunny
      drawBunny(ctx, bunny);

      // 9. Draw Upper Decor (Trees, Bushes, Obstacles) with Y-sorting for depth
      drawForegroundDecors(ctx);

      // 10. Draw Butterflies
      drawButterflies(ctx);

      // 11. Draw Particles (Dust, Sparkles, Splashes)
      drawParticles(ctx);

      // 12. Weather & Lighting Overlay (Atmosphere, Night darkness, Sunbeams, Lantern glows)
      drawWeatherAndLighting(ctx, canvas.width, canvas.height, cameraX, cameraY, bunny, weather);

      ctx.restore();

      animationFrameId.current = requestAnimationFrame(gameLoop);
    };

    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [weather, speedMultiplier, onStatsUpdate, onZoneChange, onAnimalInteract, joystickVector]);

  // Helper Drawing Functions
  const drawForestBackground = (ctx: CanvasRenderingContext2D, currentW: WeatherType) => {
    // Base lush grass gradient
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

    // Dirt Walking Trails between Meadow, Carrot Patch & River
    ctx.save();
    ctx.strokeStyle = currentW === 'night' ? '#443428' : '#d9770633';
    ctx.lineWidth = 55;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    // Trail 1: From Burrow to Carrot Farm
    ctx.moveTo(450, 450);
    ctx.bezierCurveTo(800, 500, 1100, 400, 1360, 450);
    // Trail 2: From Carrot Farm to River Bridge
    ctx.bezierCurveTo(1800, 520, 2100, 580, 2400, 600);
    // Trail 3: From River Bridge down to Mystic Grove
    ctx.bezierCurveTo(2450, 1000, 2300, 1400, 2200, 1800);
    // Trail 4: Down into Flower Hills
    ctx.bezierCurveTo(1600, 1850, 1000, 1750, 600, 1700);
    ctx.stroke();
    ctx.restore();

    // Soft decorative grass blades
    ctx.fillStyle = currentW === 'night' ? '#14532d' : '#86efac44';
    for (let gx = 100; gx < WORLD_WIDTH; gx += 160) {
      for (let gy = 100; gy < WORLD_HEIGHT; gy += 160) {
        ctx.fillRect(gx + (Math.sin(gy) * 20), gy, 4, 10);
        ctx.fillRect(gx + 6 + (Math.sin(gy) * 20), gy + 2, 4, 8);
      }
    }
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

  const drawWaterwaysAndBridges = (ctx: CanvasRenderingContext2D, currentW: WeatherType) => {
    ctx.save();
    for (const decor of decorsRef.current) {
      if (decor.type === 'water_pond') {
        const waterGrad = ctx.createRadialGradient(decor.x, decor.y, 10, decor.x, decor.y, decor.width / 2);
        if (currentW === 'night') {
          waterGrad.addColorStop(0, '#1e3a8a');
          waterGrad.addColorStop(1, '#172554');
        } else {
          waterGrad.addColorStop(0, '#7dd3fc');
          waterGrad.addColorStop(1, '#0284c7');
        }
        ctx.fillStyle = waterGrad;
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, decor.width / 2, decor.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Water sparkles / ripples
        ctx.fillStyle = '#ffffff66';
        ctx.beginPath();
        ctx.arc(decor.x - 20, decor.y - 10, 4, 0, Math.PI * 2);
        ctx.arc(decor.x + 25, decor.y + 15, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'bridge') {
        // Wooden planks across river
        ctx.fillStyle = '#78350f';
        ctx.fillRect(decor.x - decor.width / 2, decor.y - decor.height / 2, decor.width, decor.height);

        // Plank lines
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        for (let bx = decor.x - decor.width / 2; bx <= decor.x + decor.width / 2; bx += 18) {
          ctx.beginPath();
          ctx.moveTo(bx, decor.y - decor.height / 2);
          ctx.lineTo(bx, decor.y + decor.height / 2);
          ctx.stroke();
        }

        // Bridge Side Rails
        ctx.fillStyle = '#92400e';
        ctx.fillRect(decor.x - decor.width / 2, decor.y - decor.height / 2 - 4, decor.width, 6);
        ctx.fillRect(decor.x - decor.width / 2, decor.y + decor.height / 2 - 2, decor.width, 6);
      }
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

    // Cute Flower Marker
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

  const drawCollectibles = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const item of collectiblesRef.current) {
      if (item.collected) continue;
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

        // Carrot Cone Body
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
          // Golden sparkle
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(item.x - 2, floatY - 6, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (item.type === 'berry') {
        // Red juicy berry bunch
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
        // Lucky 4-leaf clover
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
        // Bunny underground burrow entrance
        ctx.fillStyle = '#3f220f';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, decor.width / 2, decor.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 6;
        ctx.stroke();

        // Wooden sign / Welcome arch
        ctx.fillStyle = '#b45309';
        ctx.fillRect(decor.x - 28, decor.y - 45, 56, 18);
        ctx.fillStyle = '#fef3c7';
        ctx.font = 'bold 11px Quicksand, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(decor.id === 'bunny_home_burrow' ? '🏡 TỔ THỎ' : '✨ HANG BÍ MẬT', decor.x, decor.y - 32);
      } else if (decor.type === 'flower_cluster') {
        // Cute wildflower patch
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

  const drawForestAnimals = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const animal of animalsRef.current) {
      // Ground shadow
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
        // Cute Bushy Squirrel
        ctx.fillStyle = '#b45309';
        // Tail
        ctx.beginPath();
        ctx.arc(-14, -10, 12, 0, Math.PI * 2);
        ctx.fill();
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 13, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(8, -12, 8, 0, Math.PI * 2);
        ctx.fill();
        // Ear
        ctx.beginPath();
        ctx.arc(10, -19, 3, 0, Math.PI * 2);
        ctx.fill();
        // Eye & Acorn
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(11, -13, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // Acorn in paws
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(6, -2, 4, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'duck') {
        // Yellow duckling
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.ellipse(0, 0, 12, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(8, -8, 7, 0, Math.PI * 2);
        ctx.fill();
        // Orange Bill
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.ellipse(14, -7, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Eye
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(10, -9, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'hedgehog') {
        // Spiky round hedgehog
        ctx.fillStyle = '#713f12';
        ctx.beginPath();
        ctx.arc(-2, -4, 12, 0, Math.PI * 2);
        ctx.fill();
        // Spikes
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        for (let s = 0; s < 7; s++) {
          const sa = (s * Math.PI) / 6 + Math.PI;
          ctx.beginPath();
          ctx.moveTo(-2 + Math.cos(sa) * 11, -4 + Math.sin(sa) * 11);
          ctx.lineTo(-2 + Math.cos(sa) * 16, -4 + Math.sin(sa) * 16);
          ctx.stroke();
        }
        // Face
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(9, -2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#18181b';
        ctx.beginPath();
        ctx.arc(14, -2, 2, 0, Math.PI * 2); // Black nose
        ctx.arc(11, -5, 1.5, 0, Math.PI * 2); // Eye
        ctx.fill();
      } else if (animal.type === 'deer') {
        // Gentle Deer
        ctx.fillStyle = '#c2410c';
        // Body
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Neck & Head
        ctx.beginPath();
        ctx.ellipse(14, -14, 6, 12, 0.4, 0, Math.PI * 2);
        ctx.arc(18, -22, 7, 0, Math.PI * 2);
        ctx.fill();
        // Antlers
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, -28);
        ctx.lineTo(20, -36);
        ctx.moveTo(20, -32);
        ctx.lineTo(24, -34);
        ctx.stroke();
        // White spots
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(3, -4, 2, 0, Math.PI * 2);
        ctx.arc(-1, 3, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (animal.type === 'frog') {
        // Green frog
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

        // Bubble rounded box
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(bubbleX, bubbleY, boxW, boxH, 12);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Tail pointer
        ctx.beginPath();
        ctx.moveTo(animal.x - 6, bubbleY + boxH);
        ctx.lineTo(animal.x + 6, bubbleY + boxH);
        ctx.lineTo(animal.x, bubbleY + boxH + 6);
        ctx.closePath();
        ctx.fill();

        // Text
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'center';
        ctx.fillText(text, animal.x, bubbleY + 18);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  const drawBunny = (ctx: CanvasRenderingContext2D, bunny: BunnyEntity) => {
    ctx.save();
    // Vertical hop offset
    const hopYOffset = Math.abs(Math.sin(bunny.hopPhase)) * 9 + (bunny.isJumping ? Math.sin(bunny.jumpHeight) * 26 : 0);
    const squash = bunny.isMoving ? 1 + Math.sin(bunny.hopPhase * 2) * 0.08 : 1;

    // Soft dynamic shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    const shadowScale = Math.max(0.4, 1 - hopYOffset / 35);
    ctx.ellipse(bunny.x, bunny.y + 12, 13 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(bunny.x, bunny.y - hopYOffset);

    // Flip if facing left
    if (bunny.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // Bunny Colors by Skin
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

    // 1. Fluffy Tail
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(-14, 2, 6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Bunny Ears (with floppy bounce animation)
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

    // 3. Bunny Main Body (Egg-shaped & fluffy)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 13 * squash, 14 / squash, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Spotted skin patches
    if (bunny.skin === 'spotted') {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(-4, -2, 5, 0, Math.PI * 2);
      ctx.arc(6, 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Bunny Head
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(6, -8, 10.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Cute Face Features
    // Pink Cheek Blush
    ctx.fillStyle = cheekColor;
    ctx.beginPath();
    ctx.ellipse(8, -4, 3.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big Sparkly Eye
    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.ellipse(9, -8, 2.8, 3.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye catchlights / sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8.2, -9.2, 1.2, 0, Math.PI * 2);
    ctx.arc(10, -7.5, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Pink Nose
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

    // 6. Accessories
    if (bunny.accessory === 'flower') {
      // Cute Daisy behind ear
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
      // Explorer Straw Hat
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
      // Red Bow Tie
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
      // Cute Little Carrot Backpack
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
      // Round gold glasses
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

  const drawForegroundDecors = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const decor of decorsRef.current) {
      if (decor.type === 'wooden_fence') {
        // Wooden garden fence post
        ctx.fillStyle = '#a16207';
        ctx.fillRect(decor.x - decor.width / 2, decor.y - 12, decor.width, 6);
        ctx.fillRect(decor.x - decor.width / 2, decor.y + 4, decor.width, 6);
        // Vertical picket posts
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
      } else if (decor.type === 'rock') {
        // Soft mossy rock
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y, decor.width / 2, decor.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        ctx.arc(decor.x - 4, decor.y - 4, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'stump') {
        // Wood tree stump with growth rings
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y + 6, decor.width / 2, decor.height / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(decor.x, decor.y - 2, decor.width / 2.2, decor.height / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'mushroom_red' || decor.type === 'mushroom_glow') {
        const isGlow = decor.type === 'mushroom_glow';
        // Stem
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(decor.x - 4, decor.y - 6, 8, 14);
        // Cap
        ctx.fillStyle = isGlow ? '#a855f7' : '#ef4444';
        ctx.beginPath();
        ctx.arc(decor.x, decor.y - 6, 12, Math.PI, 0);
        ctx.fill();
        // White or cyan dots
        ctx.fillStyle = isGlow ? '#67e8f9' : '#ffffff';
        ctx.beginPath();
        ctx.arc(decor.x - 5, decor.y - 10, 2, 0, Math.PI * 2);
        ctx.arc(decor.x + 4, decor.y - 11, 2, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 14, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'bush') {
        // Fluffy green bush
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(decor.x - 12, decor.y, 16, 0, Math.PI * 2);
        ctx.arc(decor.x + 12, decor.y, 16, 0, Math.PI * 2);
        ctx.arc(decor.x, decor.y - 8, 18, 0, Math.PI * 2);
        ctx.fill();
      } else if (decor.type === 'tree_oak') {
        // Lush Oak Tree
        // Trunk
        ctx.fillStyle = '#5c2c16';
        ctx.fillRect(decor.x - 12, decor.y - 30, 24, 45);

        // Foliage Crown
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
        // Tall Evergreen Pine Tree
        ctx.fillStyle = '#451a03';
        ctx.fillRect(decor.x - 9, decor.y - 20, 18, 35);

        ctx.fillStyle = '#065f46';
        // Tier 1
        ctx.beginPath();
        ctx.moveTo(decor.x, decor.y - 110);
        ctx.lineTo(decor.x + 35, decor.y - 70);
        ctx.lineTo(decor.x - 35, decor.y - 70);
        ctx.closePath();
        ctx.fill();

        // Tier 2
        ctx.beginPath();
        ctx.moveTo(decor.x, decor.y - 80);
        ctx.lineTo(decor.x + 45, decor.y - 40);
        ctx.lineTo(decor.x - 45, decor.y - 40);
        ctx.closePath();
        ctx.fill();

        // Tier 3
        ctx.beginPath();
        ctx.moveTo(decor.x, decor.y - 50);
        ctx.lineTo(decor.x + 55, decor.y - 10);
        ctx.lineTo(decor.x - 55, decor.y - 10);
        ctx.closePath();
        ctx.fill();
      } else if (decor.type === 'tree_blossom') {
        // Pink Sakura Blossom Tree
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
      }
    }
    ctx.restore();
  };

  const drawButterflies = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    for (const bf of butterFliesRef.current) {
      const wingFlap = Math.abs(Math.sin(bf.phase * 3)) * 4 + 2;
      ctx.fillStyle = bf.color;
      // Left wing
      ctx.beginPath();
      ctx.ellipse(bf.x - 3, bf.y, wingFlap, 4, -0.4, 0, Math.PI * 2);
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.ellipse(bf.x + 3, bf.y, wingFlap, 4, 0.4, 0, Math.PI * 2);
      ctx.fill();
      // Body
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
      // Deep blue/purple nighttime overlay with soft light circle around Bunny
      const nightGrad = ctx.createRadialGradient(bunny.x, bunny.y, 30, bunny.x, bunny.y, 220);
      nightGrad.addColorStop(0, 'rgba(15, 23, 42, 0.2)');
      nightGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.7)');
      nightGrad.addColorStop(1, 'rgba(10, 15, 30, 0.88)');

      ctx.fillStyle = nightGrad;
      ctx.fillRect(camX, camY, width, height);

      // Fireflies glowing in dark
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
      // Warm golden hour sunset tint
      ctx.fillStyle = 'rgba(245, 158, 11, 0.16)';
      ctx.fillRect(camX, camY, width, height);
    } else if (wType === 'rainy') {
      // Moody cool blue-gray rain tint
      ctx.fillStyle = 'rgba(30, 41, 59, 0.28)';
      ctx.fillRect(camX, camY, width, height);
    } else if (wType === 'sunny') {
      // Gentle sunbeam rays
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

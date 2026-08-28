import { Achievement, CollectibleItem, ForestAnimal, ForestDecor, HazardPlant, InteractivePlant, Quest } from '../types';

export const WORLD_WIDTH = 4400;
export const WORLD_HEIGHT = 3200;

export interface ForestBiome {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  color: string;
  icon: string;
}

export const FOREST_BIOMES: ForestBiome[] = [
  {
    id: 'cozy_meadow',
    nameVi: 'Thảm Cỏ Nhà Thỏ & Vườn Hoa',
    nameEn: 'Bunny Cozy Meadow',
    descriptionVi: 'Nơi khởi hành êm đềm với thảm cỏ mềm, hoa thơm ngát và tổ thỏ ấm áp.',
    bounds: { minX: 100, maxX: 1350, minY: 100, maxY: 1350 },
    color: '#86efac',
    icon: '🏡',
  },
  {
    id: 'carrot_farm',
    nameVi: 'Nông Trại Cà Rốt & Hàng Rào Gỗ',
    nameEn: 'Carrot Patch & Farm Fences',
    descriptionVi: 'Nông trại rực rỡ có hàng rào gỗ vững chắc bao quanh với những luống cà rốt mọng nước.',
    bounds: { minX: 1350, maxX: 2600, minY: 100, maxY: 1350 },
    color: '#fdba74',
    icon: '🥕',
  },
  {
    id: 'sparkling_river',
    nameVi: 'Dòng Suối Thơ Mộng & 3 Cầu Gỗ',
    nameEn: 'Sparkling River & Bridges',
    descriptionVi: 'Dòng suối nước sâu trong vắt, bèo sen hoa súng và 3 cây cầu gỗ mộc nối hai bờ.',
    bounds: { minX: 2600, maxX: 3300, minY: 100, maxY: 3100 },
    color: '#93c5fd',
    icon: '🌊',
  },
  {
    id: 'cherry_hills',
    nameVi: 'Đồi Hoa Anh Đào & Cỏ 4 Lá',
    nameEn: 'Cherry Blossom Hills',
    descriptionVi: 'Đồi hoa rực sắc anh đào rơi lả tả, hoa cúc thơm ngát và bạn Nhím vui tươi.',
    bounds: { minX: 100, maxX: 1500, minY: 1350, maxY: 3100 },
    color: '#f472b6',
    icon: '🌸',
  },
  {
    id: 'mystic_grove',
    nameVi: 'Rừng Thông Cổ & Nấm Phát Sáng',
    nameEn: 'Mystic Glowing Grove',
    descriptionVi: 'Khu rừng cổ thụ lung linh với nấm phát sáng kỳ ảo, cây hoàng kim và tàn tích cổ xưa.',
    bounds: { minX: 1500, maxX: 2600, minY: 1350, maxY: 3100 },
    color: '#a78bfa',
    icon: '🍄',
  },
  {
    id: 'bamboo_haven',
    nameVi: 'Rừng Trúc & Thung Lũng Muôn Thú',
    nameEn: 'Bamboo Valley & Animal Haven',
    descriptionVi: 'Vùng đất phương đông với những rặng phong đỏ, cụ Rùa, Gấu Trúc và Cáo nhỏ thân thiện.',
    bounds: { minX: 3300, maxX: 4300, minY: 100, maxY: 3100 },
    color: '#34d399',
    icon: '🎋',
  },
];

// River curve formula function
export function getRiverCenterX(y: number): number {
  return 2850 + Math.sin(y * 0.002) * 180;
}
export const RIVER_HALF_WIDTH = 85; // total width ~170px

// 3 Wooden Bridges information for safe crossing (Top, Middle, Bottom)
export interface BridgeInfo {
  id: string;
  nameVi: string;
  y: number;
  width: number;
  height: number;
}
export const BRIDGES: BridgeInfo[] = [
  { id: 'bridge_top', nameVi: 'Cầu Gỗ Phía Trên', y: 680, width: 270, height: 110 },
  { id: 'bridge_mid', nameVi: 'Cầu Gỗ Ở Giữa', y: 1600, width: 270, height: 110 },
  { id: 'bridge_bot', nameVi: 'Cầu Gỗ Phía Dưới', y: 2520, width: 270, height: 110 },
];

export function isPointOnBridge(x: number, y: number): boolean {
  for (const b of BRIDGES) {
    const rx = getRiverCenterX(b.y);
    const minX = rx - b.width / 2 - 20;
    const maxX = rx + b.width / 2 + 20;
    const minY = b.y - b.height / 2;
    const maxY = b.y + b.height / 2;

    if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
      return true;
    }
  }
  return false;
}

export function isPointInRiver(x: number, y: number): boolean {
  const rx = getRiverCenterX(y);
  return Math.abs(x - rx) < RIVER_HALF_WIDTH;
}

export function getInitialQuests(): Quest[] {
  return [
    {
      id: 'quest_harvest_carrots',
      titleVi: 'Thu Hoạch Cà Rốt Ngọt Lành',
      descVi: 'Tìm và ăn 8 củ cà rốt mọng nước trong vườn hoặc bãi cỏ rừng.',
      icon: '🥕',
      category: 'carrot',
      targetCount: 8,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+20 Cà rốt & Nón Rơm Thám Hiểm 👒',
      rewardCarrots: 20,
      rewardAccessory: 'straw_hat',
    },
    {
      id: 'quest_help_squirrel',
      titleVi: 'Hái Dâu Giúp Bạn Sóc Nhí',
      descVi: 'Thu thập 4 quả dâu rừng chín mọng và trò chuyện với Sóc Nhí ở bãi cỏ.',
      icon: '🫐',
      category: 'animal',
      targetCount: 4,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+25 Cà rốt & Giỏ Cà Rốt Đeo Lưng 🎒',
      rewardCarrots: 25,
      rewardAccessory: 'carrot_pack',
      targetId: 'animal_squirrel',
    },
    {
      id: 'quest_cross_river_duck',
      titleVi: 'Qua Cầu Gỗ Thăm Bác Vịt Cốm',
      descVi: 'Băng qua cây cầu gỗ bắc qua dòng suối và trò chuyện cùng bác Vịt Cốm.',
      icon: '🦆',
      category: 'explore',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+25 Cà rốt & Kính Mắt Bác Học 👓',
      rewardCarrots: 25,
      rewardAccessory: 'glasses',
      targetId: 'animal_duck',
    },
    {
      id: 'quest_lucky_clovers',
      titleVi: 'Cỏ 4 Lá May Mắn Tặng Bé Nhím',
      descVi: 'Tìm 2 nhánh cỏ 4 lá may mắn trên đồi hoa anh đào và gặp bé Nhím.',
      icon: '🍀',
      category: 'animal',
      targetCount: 2,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+30 Cà rốt & Vòng Hoa Cầu Vồng 🌈',
      rewardCarrots: 30,
      rewardAccessory: 'rainbow_wreath',
      targetId: 'animal_hedgehog',
    },
    {
      id: 'quest_bamboo_friends',
      titleVi: 'Gặp Gỡ Gấu Trúc & Bé Cáo Bên Kia Suối',
      descVi: 'Vượt qua cầu suối sang Thung Lũng Trúc gặp bạn Gấu Trúc và Bé Cáo.',
      icon: '🐼',
      category: 'animal',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+40 Cà rốt & Vương Miện Rừng Xanh 👑',
      rewardCarrots: 40,
      rewardAccessory: 'crown',
      targetId: 'animal_panda',
    },
    {
      id: 'quest_secret_golden_carrot',
      titleVi: 'Tìm Cà Rốt Hoàng Kim Ẩn Giấu',
      descVi: 'Khám phá bí mật trong rừng sâu và tìm thấy 1 củ Cà Rốt Hoàng Kim rực rỡ.',
      icon: '✨',
      category: 'secret',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+60 Cà rốt & Bộ Lông Vàng Hoàng Kim 🌟',
      rewardCarrots: 60,
      rewardSkin: 'golden',
    },
    {
      id: 'quest_mystic_burrow_shrine',
      titleVi: 'Khám Phá Hang Cổ & Tàn Tích Bí Mật',
      descVi: 'Đi sâu vào góc rừng nấm phát sáng, viếng thăm Đài Tàn Tích và Hang Cổ.',
      icon: '🏛️',
      category: 'secret',
      targetCount: 1,
      currentCount: 0,
      completed: false,
      rewardClaimed: false,
      rewardTextVi: '+80 Cà rốt & Bộ Lông Dải Ngân Hà Galaxy 🌌 & Cánh Tiên Bướm 🧚',
      rewardCarrots: 80,
      rewardSkin: 'galaxy',
      rewardAccessory: 'fairy_wings',
    },
  ];
}

export function getInitialAchievements(): Achievement[] {
  return [
    {
      id: 'ach_cross_bridges',
      titleVi: 'Vượt Suối An Toàn',
      descVi: 'Băng qua an toàn trên cả 3 cây Cầu Gỗ bắc qua suối (Trên, Giữa, Dưới).',
      icon: '🌉',
      unlocked: false,
      category: 'explore',
      rewardCarrots: 30,
      rewardXp: 80,
    },
    {
      id: 'ach_plant_healer',
      titleVi: 'Bác Sĩ Cây Rừng',
      descVi: 'Dùng giọt sương mai tưới mát và hồi sinh 3 mầm cây hoa đang héo.',
      icon: '🌱',
      unlocked: false,
      category: 'nature',
      rewardCarrots: 35,
      rewardXp: 100,
    },
    {
      id: 'ach_apple_shake',
      titleVi: 'Mùa Táo Ngọt Lành',
      descVi: 'Nhảy gần cây táo trong vườn để rung rụng và thu hoạch quả táo đỏ mọng.',
      icon: '🍎',
      unlocked: false,
      category: 'collect',
      rewardCarrots: 25,
      rewardXp: 60,
    },
    {
      id: 'ach_carrot_lover',
      titleVi: 'Bậc Thầy Cà Rốt',
      descVi: 'Thu hoạch từ 30 củ cà rốt giòn ngọt trong trang trại và bãi cỏ rừng.',
      icon: '🥕',
      unlocked: false,
      category: 'collect',
      rewardCarrots: 40,
      rewardXp: 120,
    },
    {
      id: 'ach_speed_rabbit',
      titleVi: 'Thỏ Nhẹ Như Gió',
      descVi: 'Nâng cấp kỹ năng Bước Chân Thần Tốc lên Cấp 2+ trong bảng Nâng Cấp.',
      icon: '⚡',
      unlocked: false,
      category: 'explore',
      rewardCarrots: 30,
      rewardXp: 90,
    },
    {
      id: 'ach_secret_burrow',
      titleVi: 'Thám Hiểm Hang Thần',
      descVi: 'Khám phá hang thỏ thần bí và kích hoạt dịch chuyển tức thời.',
      icon: '🕳️',
      unlocked: false,
      category: 'explore',
      rewardCarrots: 40,
      rewardXp: 110,
    },
    {
      id: 'ach_meet_all_animals',
      titleVi: 'Bạn Của Muôn Loài',
      descVi: 'Trò chuyện và giao lưu cùng ít nhất 5 cư dân động vật trong rừng.',
      icon: '🐾',
      unlocked: false,
      category: 'social',
      rewardCarrots: 50,
      rewardXp: 150,
    },
    {
      id: 'ach_golden_legend',
      titleVi: 'Huyền Thoại Hoàng Kim',
      descVi: 'Tìm thấy ít nhất 1 củ Cà Rốt Hoàng Kim quý hiếm ẩn giấu.',
      icon: '👑',
      unlocked: false,
      category: 'secret',
      rewardCarrots: 60,
      rewardXp: 200,
    },
  ];
}

export function getInitialPlants(): InteractivePlant[] {
  return [
    {
      id: 'withered_plant_meadow',
      nameVi: 'Mầm Sen Cầu Vồng Đang Héo',
      x: 620,
      y: 950,
      state: 'withered',
      waterProgress: 0,
      bloomTimer: 0,
      bloomType: 'rainbow_lotus',
      hintVi: 'Cây đang khát nước! Lại gần và bấm Tưới Nước 💧 để hồi sinh hoa nở nhé!',
    },
    {
      id: 'withered_plant_cherry',
      nameVi: 'Mầm Hướng Dương Pha Lê Đang Héo',
      x: 850,
      y: 2450,
      state: 'withered',
      waterProgress: 0,
      bloomTimer: 0,
      bloomType: 'sun_sunflower',
      hintVi: 'Đất khô cằn! Hãy mang giọt sương mát lành tưới cho hoa bừng sáng! 💧',
    },
    {
      id: 'withered_plant_bamboo',
      nameVi: 'Mầm Phong Lan Dạ Quang Đang Héo',
      x: 3750,
      y: 2200,
      state: 'withered',
      waterProgress: 0,
      bloomTimer: 0,
      bloomType: 'crystal_orchid',
      hintVi: 'Mầm hoa quý hiếm đang thiếu nước! Tưới mát để nhận Cỏ 4 Lá và XP! 💧',
    },
  ];
}

export function generateInitialWorld(): {
  decors: ForestDecor[];
  collectibles: CollectibleItem[];
  animals: ForestAnimal[];
  hazards: HazardPlant[];
} {
  const decors: ForestDecor[] = [];
  const collectibles: CollectibleItem[] = [];
  const animals: ForestAnimal[] = [];
  const hazards: HazardPlant[] = [];

  const seedRandom = (s: number) => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
  let seed = 123;

  // 1. Winding Deep River with Lotus Pads
  for (let y = 60; y < WORLD_HEIGHT; y += 65) {
    const riverX = getRiverCenterX(y);
    decors.push({
      id: `river_seg_${y}`,
      type: 'water_pond',
      x: riverX,
      y: y,
      width: RIVER_HALF_WIDTH * 2 + 10,
      height: 85,
      layer: 'back',
      collidable: false,
    });

    if (y % 180 === 0) {
      decors.push({
        id: `lotus_pad_${y}`,
        type: 'lotus_pad',
        x: riverX + (seedRandom(seed++) * 70 - 35),
        y: y + 15,
        width: 42,
        height: 32,
        layer: 'back',
        collidable: false,
      });
    }
  }

  // 2. 3 Sturdy Wooden Bridges over the river (Safe crossing passages)
  BRIDGES.forEach((b) => {
    const bridgeX = getRiverCenterX(b.y);
    decors.push({
      id: b.id,
      type: 'bridge',
      x: bridgeX,
      y: b.y,
      width: b.width,
      height: b.height,
      layer: 'back',
      collidable: false,
    });
  });

  // 3. Bunny's Home Burrow at (520, 520)
  decors.push({
    id: 'bunny_home_burrow',
    type: 'burrow',
    x: 520,
    y: 520,
    width: 140,
    height: 110,
    layer: 'back',
    interactive: true,
  });

  // 4. Secret Mystic Burrow at (2150, 2650)
  decors.push({
    id: 'secret_mystic_burrow',
    type: 'burrow',
    x: 2150,
    y: 2650,
    width: 135,
    height: 105,
    layer: 'back',
    interactive: true,
  });

  // 5. Ancient Stone Ruins in the Mystic Forest
  decors.push({
    id: 'ancient_ruin_monolith_1',
    type: 'ancient_ruin',
    x: 1950,
    y: 2450,
    width: 145,
    height: 120,
    layer: 'obstacle',
    collidable: true,
  });
  decors.push({
    id: 'ancient_ruin_monolith_2',
    type: 'ancient_ruin',
    x: 2120,
    y: 2520,
    width: 100,
    height: 90,
    layer: 'obstacle',
    collidable: true,
  });

  // 6. Magic Lantern Poles along the path & at each of the 3 Wooden Bridges
  const lanternPositions = [
    { x: 620, y: 460 },
    { x: 1460, y: 650 },
    { x: 1850, y: 2350 },
    { x: 3800, y: 1200 },
  ];

  // Add glowing lantern poles at West and East entryways of all 3 bridges
  BRIDGES.forEach((b) => {
    const rx = getRiverCenterX(b.y);
    lanternPositions.push({ x: rx - 155, y: b.y - 45 });
    lanternPositions.push({ x: rx + 155, y: b.y - 45 });
  });

  lanternPositions.forEach((lp, idx) => {
    decors.push({
      id: `lantern_pole_${idx}`,
      type: 'lantern_pole',
      x: lp.x,
      y: lp.y,
      width: 34,
      height: 75,
      layer: 'obstacle',
      collidable: true,
    });
  });

  // 7. Carrot Farm Wooden Fence Boundaries (Solid Obstacles with clear Gate Openings)
  // Top horizontal fence (x: 1450 to 2450 at y: 280) with Gate at x: 1890-1990
  for (let fx = 1450; fx <= 2450; fx += 55) {
    if (fx >= 1890 && fx <= 1990) continue; // Entrance Gate!
    decors.push({
      id: `fence_top_${fx}`,
      type: 'wooden_fence',
      x: fx,
      y: 280,
      width: 58,
      height: 38,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Bottom horizontal fence (x: 1450 to 2450 at y: 1180) with Gate at x: 1890-1990
  for (let fx = 1450; fx <= 2450; fx += 55) {
    if (fx >= 1890 && fx <= 1990) continue; // Entrance Gate!
    decors.push({
      id: `fence_bot_${fx}`,
      type: 'wooden_fence',
      x: fx,
      y: 1180,
      width: 58,
      height: 38,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Left vertical fence of farm (y: 310 to 1150 at x: 1430) with Gate at y: 690-790
  for (let fy = 310; fy <= 1150; fy += 55) {
    if (fy >= 690 && fy <= 790) continue; // Left Gate!
    decors.push({
      id: `fence_left_${fy}`,
      type: 'wooden_fence',
      x: 1430,
      y: fy,
      width: 38,
      height: 58,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Right vertical fence of farm (y: 310 to 1150 at x: 2470) with Gate at y: 690-790
  for (let fy = 310; fy <= 1150; fy += 55) {
    if (fy >= 690 && fy <= 790) continue; // Right Gate!
    decors.push({
      id: `fence_right_${fy}`,
      type: 'wooden_fence',
      x: 2470,
      y: fy,
      width: 38,
      height: 58,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // 8. Natural Boundary Trees around world perimeter (Solid realistic trunks)
  for (let x = 70; x < WORLD_WIDTH; x += 120) {
    decors.push({
      id: `border_tree_t_${x}`,
      type: 'tree_pine',
      x: x + Math.sin(x * 0.1) * 15,
      y: 80,
      width: 125,
      height: 160,
      layer: 'obstacle',
      collidable: true,
    });
    decors.push({
      id: `border_tree_b_${x}`,
      type: 'tree_pine',
      x: x + Math.cos(x * 0.1) * 15,
      y: WORLD_HEIGHT - 85,
      width: 125,
      height: 160,
      layer: 'obstacle',
      collidable: true,
    });
  }
  for (let y = 100; y < WORLD_HEIGHT - 100; y += 130) {
    decors.push({
      id: `border_tree_l_${y}`,
      type: 'tree_oak',
      x: 80,
      y: y + Math.sin(y * 0.1) * 15,
      width: 130,
      height: 150,
      layer: 'obstacle',
      collidable: true,
    });
    decors.push({
      id: `border_tree_r_${y}`,
      type: 'tree_oak',
      x: WORLD_WIDTH - 80,
      y: y + Math.cos(y * 0.1) * 15,
      width: 130,
      height: 150,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // 9. Majestic Trees in forest zones (Oak, Pine, Blossom, Apple, Golden, Willow, Birch, Maple)
  // Mystic Golden Tree in secret glade
  decors.push({
    id: 'mystic_golden_tree',
    type: 'tree_golden',
    x: 2050,
    y: 2580,
    width: 175,
    height: 190,
    layer: 'obstacle',
    collidable: true,
  });

  // Apple Trees in orchard
  const appleTreePositions = [
    { x: 1020, y: 440 },
    { x: 1180, y: 560 },
    { x: 960, y: 700 },
    { x: 1160, y: 820 },
  ];
  appleTreePositions.forEach((pos, idx) => {
    decors.push({
      id: `apple_tree_${idx}`,
      type: 'tree_apple',
      x: pos.x,
      y: pos.y,
      width: 140,
      height: 150,
      layer: 'obstacle',
      collidable: true,
    });
  });

  // Willow Trees along river banks (avoiding the 3 bridge crossing areas)
  for (let y = 250; y < WORLD_HEIGHT - 250; y += 380) {
    // Leave safe corridor around all 3 bridges
    if (
      Math.abs(y - 680) < 130 ||
      Math.abs(y - 1600) < 130 ||
      Math.abs(y - 2520) < 130
    ) {
      continue;
    }

    const rx = getRiverCenterX(y);
    decors.push({
      id: `willow_left_${y}`,
      type: 'tree_willow',
      x: rx - 145,
      y: y,
      width: 150,
      height: 165,
      layer: 'obstacle',
      collidable: true,
    });
    decors.push({
      id: `willow_right_${y}`,
      type: 'tree_willow',
      x: rx + 145,
      y: y + 80,
      width: 150,
      height: 165,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Red Maple & Birch Trees in Eastern Bamboo/Animal Valley
  const maplePositions = [
    { x: 3500, y: 550 },
    { x: 3750, y: 750 },
    { x: 4050, y: 620 },
    { x: 3600, y: 1450 },
    { x: 3950, y: 1680 },
    { x: 3700, y: 2450 },
    { x: 4100, y: 2350 },
  ];
  maplePositions.forEach((pos, idx) => {
    decors.push({
      id: `maple_tree_${idx}`,
      type: 'tree_maple',
      x: pos.x,
      y: pos.y,
      width: 145,
      height: 155,
      layer: 'obstacle',
      collidable: true,
    });
  });

  const birchPositions = [
    { x: 3450, y: 950 },
    { x: 3900, y: 1100 },
    { x: 3550, y: 2050 },
    { x: 3850, y: 2750 },
  ];
  birchPositions.forEach((pos, idx) => {
    decors.push({
      id: `birch_tree_${idx}`,
      type: 'tree_birch',
      x: pos.x,
      y: pos.y,
      width: 125,
      height: 160,
      layer: 'obstacle',
      collidable: true,
    });
  });

  // Natural scattered trees throughout the forest
  for (let i = 0; i < 110; i++) {
    const rx = 180 + seedRandom(seed++) * (WORLD_WIDTH - 360);
    const ry = 180 + seedRandom(seed++) * (WORLD_HEIGHT - 360);

    const inHome = rx > 420 && rx < 650 && ry > 420 && ry < 650;
    const inGarden = rx > 1440 && rx < 2460 && ry > 290 && ry < 1170;
    const inRiver = isPointInRiver(rx, ry) || Math.abs(rx - getRiverCenterX(ry)) < 135;
    const inRuins = rx > 1850 && rx < 2250 && ry > 2350 && ry < 2750;

    if (inHome || inGarden || inRiver || inRuins) continue;

    let treeType: ForestDecor['type'] = 'tree_oak';
    if (ry > 1350) {
      if (rx < 1500) {
        treeType = 'tree_blossom';
      } else if (rx < 2700) {
        treeType = seedRandom(seed++) < 0.6 ? 'tree_pine' : 'tree_oak';
      } else {
        treeType = seedRandom(seed++) < 0.5 ? 'tree_maple' : 'tree_birch';
      }
    } else if (rx > 3200) {
      treeType = seedRandom(seed++) < 0.5 ? 'tree_birch' : 'tree_maple';
    } else if (rx > 2400) {
      treeType = 'tree_pine';
    }

    decors.push({
      id: `forest_tree_${i}`,
      type: treeType,
      x: rx,
      y: ry,
      width: treeType === 'tree_pine' || treeType === 'tree_birch' ? 120 : 140,
      height: treeType === 'tree_pine' || treeType === 'tree_birch' ? 165 : 145,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // 10. Bushes, Rocks, Stumps, Flower clusters, Mushrooms
  for (let i = 0; i < 140; i++) {
    const rx = 150 + seedRandom(seed++) * (WORLD_WIDTH - 300);
    const ry = 150 + seedRandom(seed++) * (WORLD_HEIGHT - 300);
    if (isPointInRiver(rx, ry)) continue;

    const rTypeVal = seedRandom(seed++);
    let decorType: ForestDecor['type'] = 'bush';
    let isCollidable = false;
    let width = 52;
    let height = 42;

    if (rTypeVal < 0.42) {
      decorType = 'bush';
      isCollidable = true;
      width = 60;
      height = 46;
    } else if (rTypeVal < 0.65) {
      decorType = 'flower_cluster';
      isCollidable = false;
      width = 46;
      height = 36;
    } else if (rTypeVal < 0.8) {
      decorType = 'rock';
      isCollidable = true;
      width = 48;
      height = 38;
    } else if (rTypeVal < 0.9) {
      decorType = 'stump';
      isCollidable = true;
      width = 44;
      height = 38;
    } else {
      decorType = ry > 1350 && rx > 1500 && rx < 2700 ? 'mushroom_glow' : 'mushroom_red';
      isCollidable = false;
      width = 36;
      height = 36;
    }

    decors.push({
      id: `forest_prop_${i}`,
      type: decorType,
      x: rx,
      y: ry,
      width,
      height,
      layer: decorType === 'flower_cluster' ? 'back' : 'obstacle',
      collidable: isCollidable,
    });
  }

  // 11. HAZARDOUS PLANTS
  const hazardLocations = [
    { x: 1650, y: 1850, type: 'poison_mushroom' as const, name: 'Nấm Độc Tím Ma Quái', warning: 'Tránh xa nấm độc tím phát quang nguy hiểm!', penalty: 3 },
    { x: 1920, y: 2150, type: 'poison_mushroom' as const, name: 'Nấm Độc Tím Ma Quái', warning: 'Đừng chạm vào nấm tím!', penalty: 3 },
    { x: 2380, y: 2720, type: 'toxic_nightshade' as const, name: 'Cây Cà Độc Dược Đen', warning: 'Cây có chất độc làm tê đầu lưỡi thỏ!', penalty: 5 },
    { x: 1780, y: 2850, type: 'poison_mushroom' as const, name: 'Nấm Độc Tím', warning: 'Ôi nấm độc!', penalty: 3 },
    { x: 920, y: 1550, type: 'thorn_bush' as const, name: 'Bụi Gai Cào Nhọn Hoắt', warning: 'Bụi gai cào xước làm rơi cà rốt!', penalty: 2 },
    { x: 1220, y: 1880, type: 'thorn_bush' as const, name: 'Bụi Gai Cào Nhọn Hoắt', warning: 'Gai đâm đau quá!', penalty: 2 },
    { x: 2150, y: 1450, type: 'thorn_bush' as const, name: 'Bụi Gai Rừng', warning: 'Gai sắc bén cẩn thận!', penalty: 2 },
    { x: 3480, y: 1750, type: 'thorn_bush' as const, name: 'Bụi Gai Rừng Trúc', warning: 'Cẩn thận gai nhọn!', penalty: 2 },
    { x: 1520, y: 1100, type: 'wild_chili' as const, name: 'Cây Ớt Rừng Cay Xè', warning: 'Ớt rừng siêu cay làm thỏ nóng bừng!', penalty: 3 },
    { x: 2380, y: 350, type: 'wild_chili' as const, name: 'Cây Ớt Rừng Đỏ Chót', warning: 'Ớt cay xè lưỡi thỏ rồi!', penalty: 3 },
    { x: 550, y: 2150, type: 'wild_chili' as const, name: 'Cây Ớt Rừng Đỏ', warning: 'Cay nồng quá!', penalty: 3 },
    { x: 2750, y: 520, type: 'toxic_nightshade' as const, name: 'Cà Độc Dược Ven Suối', warning: 'Độc dược nguy hiểm!', penalty: 4 },
  ];

  hazardLocations.forEach((h, idx) => {
    hazards.push({
      id: `hazard_plant_${idx}`,
      type: h.type,
      x: h.x,
      y: h.y,
      width: h.type === 'thorn_bush' ? 54 : 40,
      height: h.type === 'thorn_bush' ? 46 : 40,
      nameVi: h.name,
      warningVi: h.warning,
      penaltyCarrots: h.penalty,
      pulsePhase: Math.random() * Math.PI * 2,
      eatenCooldown: 0,
    });
  });

  // 12. Collectibles with Regrow/Respawn
  let cId = 0;
  for (let gx = 1520; gx <= 2380; gx += 85) {
    for (let gy = 380; gy <= 1080; gy += 75) {
      collectibles.push({
        id: `carrot_${cId++}`,
        type: 'carrot',
        x: gx + (seedRandom(seed++) * 24 - 12),
        y: gy + (seedRandom(seed++) * 24 - 12),
        collected: false,
        respawnTimer: 0,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  for (let i = 0; i < 75; i++) {
    const rx = 200 + seedRandom(seed++) * (WORLD_WIDTH - 400);
    const ry = 200 + seedRandom(seed++) * (WORLD_HEIGHT - 400);
    if (isPointInRiver(rx, ry)) continue;

    const typeRoll = seedRandom(seed++);
    let colType: CollectibleItem['type'] = 'carrot';
    if (typeRoll < 0.42) colType = 'berry';
    else if (typeRoll < 0.72) colType = 'clover';
    else colType = 'carrot';

    collectibles.push({
      id: `wild_col_${i}`,
      type: colType,
      x: rx,
      y: ry,
      collected: false,
      respawnTimer: 0,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  // Golden Carrots
  const goldenSpots = [
    { x: 3150, y: 420 },
    { x: 520, y: 2650 },
    { x: 2280, y: 2750 },
    { x: 1950, y: 730 },
    { x: 3950, y: 1550 },
  ];
  goldenSpots.forEach((spot, idx) => {
    collectibles.push({
      id: `golden_carrot_${idx}`,
      type: 'golden_carrot',
      x: spot.x,
      y: spot.y,
      collected: false,
      respawnTimer: 0,
      bobPhase: 0,
    });
  });

  // 13. Forest Animals
  animals.push({
    id: 'animal_squirrel',
    type: 'squirrel',
    name: 'Squirrel',
    nameVi: 'Sóc Nhí Nhanh Nhẹn',
    x: 820,
    y: 580,
    initialX: 820,
    initialY: 580,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    questHintVi: 'Bạn Thỏ ơi! Bạn hái giúp tớ 4 quả dâu rừng đỏ mọng nhé!',
    hasQuestAvailable: true,
    dialogueVi: [
      'Xin chào bạn Thỏ! Hôm nay trời trong xanh thật đẹp!',
      'Bạn đã nếm thử dâu rừng chưa? Dâu sau khi hái sẽ tự động mọc lại sau một lát đó!',
      'Tớ đang tích trữ hạt dẻ thơm ngon cho mùa đông nè!',
      'Chúc bạn thỏ nhảy thật vui và tránh xa các bụi gai nhọn nhé!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_duck',
    type: 'duck',
    name: 'Duck',
    nameVi: 'Bác Vịt Cốm',
    x: 2950,
    y: 780,
    initialX: 2950,
    initialY: 780,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    questHintVi: 'Quạc quạc! Dạo bước qua cầu gỗ suối gặp tớ nhé bạn Thỏ!',
    hasQuestAvailable: true,
    dialogueVi: [
      'Quạc quạc! Nước suối ở đây sâu và mát rượi lắm!',
      'Thỏ con không được nhảy liều qua dòng nước sâu đâu nhé, phải đi qua 3 cây cầu gỗ vững chắc!',
      'Dạo qua suối để nhận Kính Mắt Bác Học và ngắm hoa súng bồng bềnh nha!',
      'Cẩn thận đừng ăn phải Cà Độc Dược mọc ven bờ nước nhé!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_hedgehog',
    type: 'hedgehog',
    name: 'Hedgehog',
    nameVi: 'Bé Nhím Gai Tròn',
    x: 680,
    y: 2200,
    initialX: 680,
    initialY: 2200,
    facing: 'right',
    questHintVi: 'Khịt khịt... Bạn tìm giúp tớ 2 nhánh Cỏ 4 Lá May Mắn nhé!',
    hasQuestAvailable: true,
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Khịt khịt... Đồi hoa anh đào này thơm ngát dịu dàng quá!',
      'Nếu bạn tìm thấy 2 nhánh cỏ 4 lá may mắn, tớ sẽ kết tặng bạn Vòng Hoa Cầu Vồng rực rỡ!',
      'Cỏ 4 lá và cà rốt ăn xong sẽ đâm chồi mọc lại để bạn thu hoạch thỏa thích!',
      'Tớ vừa thấy một củ cà rốt hoàng kim lấp lánh ở sâu trong đồi hoa kìa!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_deer',
    type: 'deer',
    name: 'Deer',
    nameVi: 'Hươu Sao Hiền Lành',
    x: 1850,
    y: 2250,
    initialX: 1850,
    initialY: 2250,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Chào chú thỏ hiền lành! Phía trước là Rừng Nấm Phát Sáng và Tàn Tích Cổ kính.',
      'Cẩn thận các cây Nấm Độc Tím mọc lẫn trong cỏ nhé, chúng có chất độc làm tê chân thỏ đấy.',
      'Thu thập thật nhiều cà rốt để Nâng Cấp Kỹ Năng chạy nhanh và Hào Quang Hút Cà Rốt nhé!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_frog',
    type: 'frog',
    name: 'Frog',
    nameVi: 'Chú Ếch Cốm',
    x: 2880,
    y: 1720,
    initialX: 2880,
    initialY: 1720,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Ộp ộp! Nhảy lò cò nào! Bạn thỏ đã nâng cấp kỹ năng Bật Cao Siêu Cấp chưa?',
      'Dòng suối nước sâu chảy xiết, chú thỏ nhớ đi qua cầu gỗ an toàn nhé!',
      'Ớt rừng rất cay, thỏ ăn vào là xè lưỡi nhảy tưng bừng luôn đó nha!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_fox',
    type: 'fox',
    name: 'Fox',
    nameVi: 'Bé Cáo Cam Thân Thiện',
    x: 3650,
    y: 850,
    initialX: 3650,
    initialY: 850,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Chào bạn Thỏ trắng dễ thương! Tớ là Cáo Cam ăn hoa quả và hạt dẻ, rất thích kết bạn!',
      'Bên này dòng suối là Rừng Phong Đỏ và Rừng Trúc yên bình!',
      'Hãy ghé thăm cụ Rùa và bạn Gấu Trúc ở phía nam nhé!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_panda',
    type: 'panda',
    name: 'Panda',
    nameVi: 'Gấu Trúc Tròn Xoe',
    x: 3850,
    y: 1850,
    initialX: 3850,
    initialY: 1850,
    facing: 'right',
    questHintVi: 'Chào bạn Thỏ! Dạo bước qua Thung Lũng Trúc gặp tớ nhận Vương Miện nhé!',
    hasQuestAvailable: true,
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Gấu trúc xin chào! Tớ đang thưởng thức những đọt măng non ngọt lành!',
      'Bạn thỏ thật giỏi khi vượt qua suối sang tận đây thăm tớ!',
      'Tặng bạn chiếc Vương Miện Rừng Xanh lấp lánh làm kỷ niệm nha!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_owl',
    type: 'owl',
    name: 'Owl',
    nameVi: 'Cụ Cú Mèo Thông Thái',
    x: 1550,
    y: 2800,
    initialX: 1550,
    initialY: 2800,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Cú... Cú... Chào nhà thám hiểm nhí! Đêm về khu rừng nấm lại tỏa sáng diệu kỳ.',
      'Cà rốt trong rừng có phép màu tự tái sinh, cứ sau 25 giây là mọc lại mọng nước!',
      'Hãy dùng cà rốt để mở khóa Hào Quang Nam Châm, hút vật phẩm cực kỳ tiện lợi!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_turtle',
    type: 'turtle',
    name: 'Turtle',
    nameVi: 'Cụ Rùa Thảnh Thơi',
    x: 2880,
    y: 2620,
    initialX: 2880,
    initialY: 2620,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Chậm mà chắc... Chào bé thỏ nhanh nhẹn!',
      'Ta đã sống bên dòng suối này trăm năm, ngắm nhìn bao mùa hoa nở rộ.',
      'Cây cầu gỗ phía trên rất vững chãi, hãy an tâm dạo bước qua hai bờ suối nhé.',
    ],
    dialogueTimer: 0,
  });

  return { decors, collectibles, animals, hazards };
}

/**
 * Realistic Physics Collision Engine for Bunny
 * - Fences: Solid wall collision boxes that bunny CANNOT pass through (even jumping).
 * - River / Dòng mương: Deep water stream that bunny CANNOT walk or jump into, EXCEPT on Wooden Bridges!
 * - Trees: Realistic trunk collision boxes (at bottom center of tree)
 * - Bushes / Rocks / Stumps: Realistic firm obstacles
 * - World boundaries: Strictly bounded
 */
export function checkBunnyCollision(
  newX: number,
  newY: number,
  decors: ForestDecor[],
  isJumping: boolean = false
): { blocked: boolean; hitObstacleName?: string } {
  // 1. World Boundaries (with padding)
  const padding = 28;
  if (newX < padding || newX > WORLD_WIDTH - padding || newY < padding || newY > WORLD_HEIGHT - padding) {
    return { blocked: true, hitObstacleName: 'Biên giới khu rừng' };
  }

  // Bunny collision radius
  const bunnyRadius = 14;

  // 2. Realistic River Water Obstacle (CANNOT CROSS EXCEPT ON BRIDGES!)
  if (isPointInRiver(newX, newY)) {
    if (!isPointOnBridge(newX, newY)) {
      return { blocked: true, hitObstacleName: 'Dòng suối nước sâu (Hãy đi qua cầu gỗ!)' };
    }
  }

  // 3. Check each collidable decor
  for (const d of decors) {
    if (!d.collidable) continue;

    if (d.type === 'wooden_fence') {
      // Solid fence rectangular boundary box (cannot be passed even by hopping)
      const fMinX = d.x - d.width / 2;
      const fMaxX = d.x + d.width / 2;
      const fMinY = d.y - d.height / 2;
      const fMaxY = d.y + d.height / 2;

      if (
        newX + bunnyRadius > fMinX &&
        newX - bunnyRadius < fMaxX &&
        newY + bunnyRadius > fMinY &&
        newY - bunnyRadius < fMaxY
      ) {
        return { blocked: true, hitObstacleName: 'Hàng rào gỗ' };
      }
    } else if (
      d.type === 'tree_oak' ||
      d.type === 'tree_pine' ||
      d.type === 'tree_blossom' ||
      d.type === 'tree_apple' ||
      d.type === 'tree_golden' ||
      d.type === 'tree_willow' ||
      d.type === 'tree_birch' ||
      d.type === 'tree_maple'
    ) {
      // Realistic Tree Trunk Collision:
      const trunkX = d.x;
      const trunkY = d.y + d.height * 0.36;
      const trunkRadius = d.type === 'tree_golden' ? 24 : d.type === 'tree_willow' ? 20 : 18;

      const dist = Math.hypot(newX - trunkX, newY - trunkY);
      if (dist < bunnyRadius + trunkRadius) {
        return { blocked: true, hitObstacleName: 'Thân cây cổ thụ' };
      }
    } else if (d.type === 'bush') {
      const bushX = d.x;
      const bushY = d.y + 4;
      const bushRadiusX = d.width * 0.38;
      const bushRadiusY = d.height * 0.32;

      const dx = (newX - bushX) / (bushRadiusX + bunnyRadius);
      const dy = (newY - bushY) / (bushRadiusY + bunnyRadius);

      if (dx * dx + dy * dy < 1.0) {
        if (!isJumping) {
          return { blocked: true, hitObstacleName: 'Bụi cây rậm rạp' };
        }
      }
    } else if (d.type === 'rock' || d.type === 'stump') {
      const propRadius = d.width * 0.36;
      const dist = Math.hypot(newX - d.x, newY - d.y);
      if (dist < bunnyRadius + propRadius) {
        return { blocked: true, hitObstacleName: d.type === 'rock' ? 'Tảng đá cuội' : 'Gốc cây khô' };
      }
    } else if (d.type === 'ancient_ruin') {
      const ruinMinX = d.x - d.width / 2;
      const ruinMaxX = d.x + d.width / 2;
      const ruinMinY = d.y - d.height / 2;
      const ruinMaxY = d.y + d.height / 2;

      if (
        newX + bunnyRadius > ruinMinX &&
        newX - bunnyRadius < ruinMaxX &&
        newY + bunnyRadius > ruinMinY &&
        newY - bunnyRadius < ruinMaxY
      ) {
        return { blocked: true, hitObstacleName: 'Cột đá tàn tích' };
      }
    } else if (d.type === 'lantern_pole') {
      const dist = Math.hypot(newX - d.x, newY - (d.y + 20));
      if (dist < bunnyRadius + 12) {
        return { blocked: true, hitObstacleName: 'Cột đèn lồng' };
      }
    }
  }

  return { blocked: false };
}

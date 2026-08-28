import { CollectibleItem, ForestAnimal, ForestDecor } from '../types';

export const WORLD_WIDTH = 3200;
export const WORLD_HEIGHT = 2400;

export interface ForestZone {
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  color: string;
  icon: string;
}

export const FOREST_ZONES: ForestZone[] = [
  {
    nameVi: 'Thảm Cỏ Nhà Thỏ',
    nameEn: 'Bunny Cozy Meadow',
    descriptionVi: 'Nơi khởi hành êm đềm với những khóm hoa xinh và tổ thỏ ấm áp.',
    bounds: { minX: 200, maxX: 1100, minY: 200, maxY: 1100 },
    color: '#86efac',
    icon: '🏡',
  },
  {
    nameVi: 'Vườn Cà Rốt Mọng Nước',
    nameEn: 'Sunny Carrot Patch',
    descriptionVi: 'Khu vườn rực rỡ bạt ngàn củ cà rốt giòn ngọt thơm ngon.',
    bounds: { minX: 1200, maxX: 2100, minY: 200, maxY: 1000 },
    color: '#fdba74',
    icon: '🥕',
  },
  {
    nameVi: 'Dòng Suối Thơ Mộng & Cầu Gỗ',
    nameEn: 'Sparkling River & Bridges',
    descriptionVi: 'Con suối trong vắt róc rách chảy, những phiến đá cuội và chú vịt bơi lội.',
    bounds: { minX: 2200, maxX: 3000, minY: 200, maxY: 1200 },
    color: '#93c5fd',
    icon: '🌊',
  },
  {
    nameVi: 'Đồi Hoa Bướm Rực Rỡ',
    nameEn: 'Butterfly Flower Hills',
    descriptionVi: 'Đồi cỏ rực sắc cẩm chướng, hoa cúc và đàn bướm dập dìu.',
    bounds: { minX: 200, maxX: 1200, minY: 1200, maxY: 2200 },
    color: '#f472b6',
    icon: '🌸',
  },
  {
    nameVi: 'Rừng Thông & Nấm Phát Sáng',
    nameEn: 'Mystic Glowing Grove',
    descriptionVi: 'Khu rừng cổ thụ lung linh với những cụm nấm phát sáng kỳ ảo.',
    bounds: { minX: 1300, maxX: 3000, minY: 1300, maxY: 2200 },
    color: '#a78bfa',
    icon: '🍄',
  },
];

export function generateInitialWorld(): {
  decors: ForestDecor[];
  collectibles: CollectibleItem[];
  animals: ForestAnimal[];
} {
  const decors: ForestDecor[] = [];
  const collectibles: CollectibleItem[] = [];
  const animals: ForestAnimal[] = [];

  // 1. Initial River Path (S-shaped winding river on the right side)
  // River decor / water ponds
  for (let y = 100; y < WORLD_HEIGHT; y += 90) {
    const riverX = 2400 + Math.sin(y * 0.003) * 180;
    decors.push({
      id: `river_seg_${y}`,
      type: 'water_pond',
      x: riverX,
      y: y,
      width: 140,
      height: 110,
      layer: 'back',
      collidable: false,
    });
  }

  // Wooden Bridges over the river
  decors.push({
    id: 'bridge_top',
    type: 'bridge',
    x: 2390 + Math.sin(600 * 0.003) * 180,
    y: 600,
    width: 160,
    height: 70,
    layer: 'back',
    collidable: false,
  });

  decors.push({
    id: 'bridge_bottom',
    type: 'bridge',
    x: 2390 + Math.sin(1700 * 0.003) * 180,
    y: 1700,
    width: 160,
    height: 70,
    layer: 'back',
    collidable: false,
  });

  // Bunny's Home Burrow at (450, 450)
  decors.push({
    id: 'bunny_home_burrow',
    type: 'burrow',
    x: 450,
    y: 450,
    width: 110,
    height: 90,
    layer: 'back',
    interactive: true,
  });

  // Secret Mystic Burrow at (2650, 1950)
  decors.push({
    id: 'secret_mystic_burrow',
    type: 'burrow',
    x: 2650,
    y: 1950,
    width: 110,
    height: 90,
    layer: 'back',
    interactive: true,
  });

  // Garden fence in Carrot Patch
  for (let fx = 1300; fx <= 2000; fx += 80) {
    decors.push({
      id: `fence_top_${fx}`,
      type: 'wooden_fence',
      x: fx,
      y: 250,
      width: 70,
      height: 40,
      layer: 'obstacle',
      collidable: true,
    });
    decors.push({
      id: `fence_bot_${fx}`,
      type: 'wooden_fence',
      x: fx,
      y: 950,
      width: 70,
      height: 40,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Large dense Trees along border & clusters
  const treeTypes: ('tree_oak' | 'tree_pine' | 'tree_blossom')[] = ['tree_oak', 'tree_pine', 'tree_blossom'];
  
  // Boundary trees
  for (let x = 60; x < WORLD_WIDTH; x += 130) {
    decors.push({
      id: `border_tree_t_${x}`,
      type: 'tree_pine',
      x: x + (Math.sin(x) * 20),
      y: 70,
      width: 120,
      height: 140,
      layer: 'obstacle',
      collidable: true,
    });
    decors.push({
      id: `border_tree_b_${x}`,
      type: 'tree_pine',
      x: x + (Math.cos(x) * 20),
      y: WORLD_HEIGHT - 90,
      width: 120,
      height: 140,
      layer: 'obstacle',
      collidable: true,
    });
  }
  for (let y = 100; y < WORLD_HEIGHT - 100; y += 140) {
    decors.push({
      id: `border_tree_l_${y}`,
      type: 'tree_oak',
      x: 70,
      y: y + (Math.sin(y) * 20),
      width: 120,
      height: 140,
      layer: 'obstacle',
      collidable: true,
    });
    decors.push({
      id: `border_tree_r_${y}`,
      type: 'tree_oak',
      x: WORLD_WIDTH - 80,
      y: y + (Math.cos(y) * 20),
      width: 120,
      height: 140,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Scattered Forest Trees, Bushes, Flowers & Mushrooms
  const seedRandom = (s: number) => {
    const x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };

  let seed = 42;
  // Natural scattered trees inside the forest
  for (let i = 0; i < 90; i++) {
    const rx = 150 + seedRandom(seed++) * (WORLD_WIDTH - 300);
    const ry = 150 + seedRandom(seed++) * (WORLD_HEIGHT - 300);

    // Keep clearings open (Carrot garden interior & bunny meadow center)
    const inHome = rx > 380 && rx < 600 && ry > 380 && ry < 600;
    const inGarden = rx > 1350 && rx < 1950 && ry > 320 && ry < 880;
    const inRiver = Math.abs(rx - (2400 + Math.sin(ry * 0.003) * 180)) < 100;

    if (inHome || inGarden || inRiver) continue;

    let treeType: 'tree_oak' | 'tree_pine' | 'tree_blossom' = 'tree_oak';
    if (ry > 1300) {
      treeType = rx > 1200 ? 'tree_pine' : 'tree_blossom';
    } else if (rx > 1800) {
      treeType = 'tree_pine';
    }

    decors.push({
      id: `forest_tree_${i}`,
      type: treeType,
      x: rx,
      y: ry,
      width: treeType === 'tree_pine' ? 110 : 130,
      height: treeType === 'tree_pine' ? 150 : 135,
      layer: 'obstacle',
      collidable: true,
    });
  }

  // Bushes, rocks, stumps, flower clusters
  for (let i = 0; i < 110; i++) {
    const rx = 120 + seedRandom(seed++) * (WORLD_WIDTH - 240);
    const ry = 120 + seedRandom(seed++) * (WORLD_HEIGHT - 240);
    const rTypeVal = seedRandom(seed++);

    let decorType: ForestDecor['type'] = 'bush';
    if (rTypeVal < 0.35) decorType = 'bush';
    else if (rTypeVal < 0.6) decorType = 'flower_cluster';
    else if (rTypeVal < 0.75) decorType = 'rock';
    else if (rTypeVal < 0.9) decorType = 'stump';
    else decorType = ry > 1200 ? 'mushroom_glow' : 'mushroom_red';

    decors.push({
      id: `forest_prop_${i}`,
      type: decorType,
      x: rx,
      y: ry,
      width: decorType === 'bush' ? 60 : 40,
      height: decorType === 'bush' ? 45 : 35,
      layer: decorType === 'flower_cluster' ? 'back' : 'obstacle',
      collidable: decorType === 'rock' || decorType === 'stump',
    });
  }

  // Collectibles Generation:
  // 1. Lots of delicious carrots in Carrot Patch!
  let cId = 0;
  for (let gx = 1360; gx <= 1940; gx += 75) {
    for (let gy = 340; gy <= 860; gy += 70) {
      collectibles.push({
        id: `carrot_${cId++}`,
        type: 'carrot',
        x: gx + (seedRandom(seed++) * 20 - 10),
        y: gy + (seedRandom(seed++) * 20 - 10),
        collected: false,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  // 2. Wild carrots, sweet berries, & lucky clovers scattered throughout the map
  for (let i = 0; i < 45; i++) {
    const rx = 200 + seedRandom(seed++) * (WORLD_WIDTH - 400);
    const ry = 200 + seedRandom(seed++) * (WORLD_HEIGHT - 400);
    const typeRoll = seedRandom(seed++);

    let colType: CollectibleItem['type'] = 'carrot';
    if (typeRoll < 0.4) colType = 'berry';
    else if (typeRoll < 0.75) colType = 'clover';
    else colType = 'carrot';

    collectibles.push({
      id: `wild_col_${i}`,
      type: colType,
      x: rx,
      y: ry,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  // 3. Golden Carrots in special secret spots!
  const goldenSpots = [
    { x: 2680, y: 350 },  // Near river source
    { x: 380, y: 2050 },  // In the center of flower hills
    { x: 2200, y: 2050 }, // Deep inside glowing mushroom grove
    { x: 1680, y: 600 },  // Center of carrot farm
  ];
  goldenSpots.forEach((spot, idx) => {
    collectibles.push({
      id: `golden_carrot_${idx}`,
      type: 'golden_carrot',
      x: spot.x,
      y: spot.y,
      collected: false,
      bobPhase: Math.random() * Math.PI * 2,
    });
  });

  // Friendly Forest Animals with Vietnamese Dialogue
  animals.push({
    id: 'animal_squirrel',
    type: 'squirrel',
    name: 'Sóc Nhí Nhanh Nhẹn',
    nameVi: 'Sóc Nhí',
    x: 750,
    y: 520,
    initialX: 750,
    initialY: 520,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Xin chào bạn Thỏ! Hôm nay trời trong xanh thật đẹp!',
      'Bạn đã nếm thử cà rốt ở trang trại phía đông chưa? Ngọt lắm đó!',
      'Tớ đang tích trữ hạt dẻ thơm ngon cho mùa đông nè!',
      'Chúc bạn thỏ nhảy thật vui và dạo chơi an lành nha!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_duck',
    type: 'duck',
    name: 'Vịt Cốm Lội Nước',
    nameVi: 'Vịt Cốm',
    x: 2360,
    y: 720,
    initialX: 2360,
    initialY: 720,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Quạc quạc! Nước suối mát rượi luôn bạn Thỏ ơi!',
      'Cẩn thận không ướt bộ lông trắng xù mềm mại nha!',
      'Đi qua cầu gỗ là đến rừng thông lộng gió đấy!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_hedgehog',
    type: 'hedgehog',
    name: 'Bé Nhím Gai Mũm Mĩm',
    nameVi: 'Bé Nhím',
    x: 580,
    y: 1650,
    initialX: 580,
    initialY: 1650,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Khịt khịt... Đồi hoa hồng này thơm ngát dịu dàng quá!',
      'Tớ vừa thấy một củ cà rốt hoàng kim lấp lánh ở gần đây!',
      'Những chú bướm đang bay lượn quanh hoa cúc xinh xắn kìa!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_deer',
    type: 'deer',
    name: 'Chú Hươu Sao Hiền Lành',
    nameVi: 'Hươu Sao',
    x: 1850,
    y: 1750,
    initialX: 1850,
    initialY: 1750,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Chào chú thỏ hiền! Khu rừng đêm có những cây nấm phát sáng diệu kỳ.',
      'Nếu bạn tìm thấy cỏ 4 lá may mắn, ước nguyện sẽ thành hiện thực!',
      'Cứ thong thả dạo bước, khu rừng luôn chào đón bạn!',
    ],
    dialogueTimer: 0,
  });

  animals.push({
    id: 'animal_frog',
    type: 'frog',
    name: 'Ếch Xanh Vui Nhộn',
    nameVi: 'Ếch Xanh',
    x: 2480,
    y: 1450,
    initialX: 2480,
    initialY: 1450,
    facing: 'left',
    state: 'idle',
    stateTimer: 0,
    dialogueVi: [
      'Ộp ộp! Nhảy lò cò nào! Bạn thỏ nhảy cao được bao nhiêu?',
      'Nhảy qua các phiến đá cuội qua suối thật là thích thú!',
    ],
    dialogueTimer: 0,
  });

  return { decors, collectibles, animals };
}

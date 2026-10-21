// Level 7: Hick Town. A top-down open world of farms, fields and back roads.
// Find Big Al's Liquor Store in the far north-east corner.

const W = 150;
const H = 100;
const ROAD_W = 5;
const H_ROADS = [20, 50, 80]; // y centres of the east-west roads
const V_ROADS = [20, 70, 120]; // x centres of the north-south roads

// tiny deterministic random numbers, so the town is the same every time
function lcg(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// a clockwise loop of waypoints around a block, driving in the right-hand lane
function loop(x1, y1, x2, y2, lane = 1.4) {
  return [
    { x: x1 + 4, y: y1 + lane },
    { x: x2 - 4, y: y1 + lane },
    { x: x2 - lane, y: y1 + 4 },
    { x: x2 - lane, y: y2 - 4 },
    { x: x2 - 4, y: y2 - lane },
    { x: x1 + 4, y: y2 - lane },
    { x: x1 + lane, y: y2 - 4 },
    { x: x1 + lane, y: y1 + 4 },
  ];
}

export function buildTown() {
  const grid = new Uint8Array(W * H); // 0 grass, 1 asphalt, 2 dirt, 3 crop field, 4 water
  const solid = new Uint8Array(W * H); // 1 building/pond, 2 tree
  const roads = [];
  const fields = [];
  const buildings = [];
  const ponds = [];
  const trees = [];
  const signs = [];
  const pickups = [];
  const parked = [];
  const traffic = [];
  const peds = [];

  const paint = (arr, x, y, w, h, val) => {
    for (let ty = Math.floor(y); ty < Math.ceil(y + h); ty++)
      for (let tx = Math.floor(x); tx < Math.ceil(x + w); tx++) if (tx >= 0 && ty >= 0 && tx < W && ty < H) arr[ty * W + tx] = val;
  };
  const addRoad = (x, y, w, h) => {
    roads.push({ x, y, w, h });
    paint(grid, x, y, w, h, 1);
  };
  const addField = (x, y, w, h, crop) => {
    fields.push({ x, y, w, h, crop });
    paint(grid, x, y, w, h, 3);
  };
  const addBuilding = (x, y, w, h, kind, label = '') => {
    buildings.push({ x, y, w, h, kind, label });
    paint(solid, x, y, w, h, 1);
  };

  // --- roads
  H_ROADS.forEach((y) => addRoad(6, y - ROAD_W / 2, 138, ROAD_W));
  V_ROADS.forEach((x) => addRoad(x - ROAD_W / 2, 6, ROAD_W, 88));
  addRoad(126, 15, 16, 2.5); // Big Al's parking lot

  // --- fields
  addField(26, 66, 18, 10, 'hay');
  addField(76, 24, 18, 12, 'wheat');
  addField(98, 24, 18, 21, 'corn');
  addField(76, 54, 12, 8, 'corn');
  addField(124, 54, 18, 12, 'corn');
  addField(58, 24, 8, 20, 'wheat');
  addField(7, 40, 9, 7, 'hay');

  // --- buildings: [x, y, w, h, kind, label]
  [
    [7, 86, 2, 2.4, 'outhouse', ''],
    [24, 6, 16, 9, 'junkyard', 'JUNKYARD'],
    [60, 8, 7, 8, 'church', ''],
    [76, 8, 9, 7, 'barn', ''],
    [88, 9, 6, 5, 'house', ''],
    [96, 8, 3, 3, 'silo', ''],
    [126, 5, 16, 10, 'store', "BIG AL'S LIQUOR"],
    [24, 25, 6, 5, 'house', ''],
    [24, 33, 6, 5, 'house', ''],
    [24, 41, 6, 5, 'house', ''],
    [40, 27, 7, 3, 'trailer', ''],
    [40, 32, 7, 3, 'trailer', ''],
    [40, 37, 7, 3, 'trailer', ''],
    [50, 27, 7, 3, 'trailer', ''],
    [50, 32, 7, 3, 'trailer', ''],
    [76, 39, 8, 6, 'barn', ''],
    [87, 40, 3, 3, 'silo', ''],
    [28, 54, 10, 6, 'diner', 'DINER'],
    [42, 54, 9, 6, 'gas', 'GAS'],
    [54, 54, 10, 7, 'general', 'GENERAL STORE'],
    [48, 64, 9, 7, 'barn', ''],
    [58, 66, 3, 3, 'silo', ''],
    [76, 66, 6, 5, 'house', ''],
    [76, 72, 6, 4, 'house', ''],
    [110, 56, 6, 3, 'trailer', ''],
    [126, 68, 9, 7, 'barn', ''],
    [138, 69, 5, 5, 'house', ''],
    [24, 85, 6, 5, 'house', ''],
    [36, 86, 7, 6, 'barn', ''],
    [48, 85, 9, 6, 'bar', 'HONKY TONK'],
    [76, 85, 8, 6, 'house', ''],
    [90, 86, 8, 5, 'house', ''],
    [102, 84, 10, 8, 'depot', 'TRASH DEPOT'],
    [126, 85, 8, 6, 'house', ''],
    [138, 86, 5, 5, 'house', ''],
    [7, 24, 7, 5, 'house', ''],
    [7, 33, 7, 5, 'house', ''],
    [7, 60, 7, 5, 'house', ''],
    [7, 68, 7, 5, 'house', ''],
  ].forEach((b) => addBuilding(...b));

  const pond = { x: 92, y: 64, w: 16, h: 10 };
  ponds.push(pond);
  paint(grid, pond.x, pond.y, pond.w, pond.h, 4);
  paint(solid, pond.x, pond.y, pond.w, pond.h, 1);

  // --- trees, scattered on open grass
  const rnd = lcg(7);
  const isFree = (x, y, pad) => {
    for (let ty = Math.floor(y - pad); ty <= Math.floor(y + pad); ty++)
      for (let tx = Math.floor(x - pad); tx <= Math.floor(x + pad); tx++) {
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) return false;
        if (grid[ty * W + tx] !== 0 || solid[ty * W + tx] !== 0) return false;
      }
    return true;
  };
  for (let i = 0, placed = 0; i < 4000 && placed < 130; i++) {
    const x = 4 + rnd() * (W - 8);
    const y = 4 + rnd() * (H - 8);
    if (!isFree(x, y, 1.8)) continue;
    if (Math.hypot(x - 11.5, y - 87.5) < 6) continue; // keep the spawn clear
    if (trees.some((t) => Math.hypot(t.x - x, t.y - y) < 3.5)) continue;
    trees.push({ x, y });
    solid[Math.floor(y) * W + Math.floor(x)] = 2;
    placed++;
  }

  // --- road signs: follow them to Big Al's (one is a prankster's decoy)
  [
    { x: 24.5, y: 84.5, text: "BIG AL'S ➜ EAST" },
    { x: 66.5, y: 84.5, text: "BIG AL'S ➜" },
    { x: 116, y: 84.5, text: "BIG AL'S ⬆ NORTH" },
    { x: 116, y: 54, text: "BIG AL'S ⬆" },
    { x: 116, y: 24, text: "BIG AL'S ➜ 2 MILES" },
    { x: 24.5, y: 54, text: "BIG AL'S ⬆ (JK, JUNKYARD)" }, // decoy
  ].forEach((s) => signs.push(s));

  // --- collectibles: jugs of moonshine, plus two hidden 1UPs
  const jugSpots = [
    [30, 80], [46, 80], [60, 80], [80, 80], [96, 80], [110, 80], [128, 80], [140, 80],
    [20, 70], [20, 60], [20, 40], [20, 30], [70, 70], [70, 60], [70, 40], [70, 30], [120, 70], [120, 60], [120, 40], [120, 30],
    [34, 50], [50, 50], [60, 50], [86, 50], [100, 50], [112, 50], [130, 50], [32, 20], [46, 20], [56, 20], [84, 20], [100, 20], [110, 20], [130, 20],
    [35, 71], [85, 58], [133, 60], [87, 29],
  ];
  jugSpots.forEach(([x, y]) => pickups.push({ x, y, kind: 'jug' }));
  pickups.push({ x: 34.5, y: 74.5, kind: 'life' }); // hidden in the hay field, behind the tractor
  pickups.push({ x: 111, y: 69, kind: 'life' }); // on the far side of the pond

  // --- parked vehicles: pick one and drive away
  [
    ['pickup', 15, 84, 0, '#b5472a'],
    ['tractor', 30, 70, -1.57, '#2e8b3a'],
    ['trash', 115, 88, -1.57, '#3f7f3a'],
    ['pickup', 46, 80 + 9, 0, '#2f5fb8'],
    ['tractor', 80, 30, 1.57, '#c9a227'],
    ['trash', 64.5, 64, 1.57, '#6b7d3a'],
    ['pickup', 100, 60, 3.14, '#d8d2c0'],
    ['pickup', 130, 61, 0, '#7a4a8a'],
  ].forEach(([type, x, y, h, color]) => parked.push({ type, x, y, h, color }));

  // --- traffic: hillbillies driving loops around the blocks, in the right-hand lane
  const loops = [
    [20, 20, 70, 50],
    [70, 20, 120, 50],
    [20, 50, 70, 80],
    [70, 50, 120, 80],
  ];
  const mix = [['pickup', 'tractor'], ['trash', 'pickup'], ['pickup', 'tractor'], ['trash', 'pickup']];
  const colors = ['#2f5fb8', '#b5472a', '#c9a227', '#3f7f3a', '#7a4a8a', '#d8d2c0', '#6b7d3a', '#b86a2a'];
  loops.forEach(([x1, y1, x2, y2], i) => {
    const route = loop(x1, y1, x2, y2);
    mix[i].forEach((type, j) => traffic.push({ type, color: colors[(i * 2 + j) % colors.length], route, start: j === 0 ? 0 : 4 }));
  });

  // --- farmers wandering about on foot
  [[26, 23.5], [32, 36], [44, 50.5], [60, 52], [80, 64], [84, 70], [120, 53], [130, 66], [45, 83], [100, 82]].forEach(([x, y]) => peds.push({ x, y }));

  // points on the roads, for spawning cops
  const roadPoints = [];
  H_ROADS.forEach((y) => { for (let x = 10; x <= 140; x += 8) roadPoints.push({ x, y }); });
  V_ROADS.forEach((x) => { for (let y = 10; y <= 90; y += 8) roadPoints.push({ x, y }); });

  const intersections = [];
  H_ROADS.forEach((y) => V_ROADS.forEach((x) => intersections.push({ x: x - ROAD_W / 2, y: y - ROAD_W / 2, w: ROAD_W, h: ROAD_W })));

  const store = { x: 126, y: 5, w: 16, h: 10, door: { x: 131, y: 15, w: 6, h: 3 }, cx: 134, cy: 10 };

  return {
    kind: 'drive',
    id: 7,
    name: "Big Al's Liquor Store",
    theme: 'town',
    w: W,
    h: H,
    grid,
    solid,
    roads,
    intersections,
    fields,
    buildings,
    ponds,
    trees,
    signs,
    pickups,
    parked,
    traffic,
    peds,
    roadPoints,
    store,
    spawn: { x: 11.5, y: 88 },
    checkpoints: [{ x: 70, y: 50, r: 8 }],
    // fields the platformer code expects
    tiles: [],
    coins: [],
    lives: [],
    spawns: [],
    crates: {},
    gearPool: [],
    groundY: 9,
    startX: 2,
    checkpointX: 0,
    goalX: 0,
    goalJugs: 0,
    totalJugs: pickups.filter((p) => p.kind === 'jug').length,
    collectible: 'jug',
    goalKind: 'store',
    winScene: 'bigAl',
  };
}

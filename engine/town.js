// Level 7: Hick Town, a big top-down open world of farms, fields, woods and back roads.
//
// Finding Big Al's Liquor Store is a treasure hunt across the whole map:
//   1. A note on the outhouse says Al drinks at the Honky Tonk, in Buckeye Junction.
//   2. The Honky Tonk says to ask Pete at his junkyard, far south-east.
//   3. Pete says Al moved up to the north-west woods: look for the dead tree and take the dirt road.
//   4. The dirt road winds deep into the forest, to a store hidden among the trees.
// There are decoy signs, and a closed fake store (Little Al's) to waste your time.

const W = 300;
const H = 200;
const ROAD_W = 5;
const H_ROADS = [45, 90, 135, 170]; // y centres of the east-west highways
const V_ROADS = [55, 110, 165, 220, 265]; // x centres of the north-south highways
const XS = [8, ...V_ROADS, 292];
const YS = [8, ...H_ROADS, 192];
const DIRT_W = 3.5;

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
  const rnd = lcg(20260421);
  const grid = new Uint8Array(W * H); // 0 grass, 1 asphalt, 2 dirt, 3 crop field, 4 water
  const solid = new Uint8Array(W * H); // 1 building/pond, 2 tree
  const roads = [];
  const dirt = [];
  const fields = [];
  const buildings = [];
  const ponds = [];
  const trees = [];
  const signs = [];
  const pickups = [];
  const parked = [];
  const traffic = [];
  const peds = [];
  const fakeStores = [];
  const placed = []; // every rectangle that is taken, for collision-free placement

  const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
  const paint = (arr, x, y, w, h, val) => {
    for (let ty = Math.floor(y); ty < Math.ceil(y + h); ty++)
      for (let tx = Math.floor(x); tx < Math.ceil(x + w); tx++) if (tx >= 0 && ty >= 0 && tx < W && ty < H) arr[ty * W + tx] = val;
  };
  const addRoad = (x, y, w, h) => {
    roads.push({ x, y, w, h });
    paint(grid, x, y, w, h, 1);
    placed.push({ x, y, w, h });
  };
  const addDirt = (x, y, w, h) => {
    dirt.push({ x, y, w, h });
    paint(grid, x, y, w, h, 2);
    placed.push({ x, y, w, h });
  };
  const addField = (x, y, w, h, crop) => {
    fields.push({ x, y, w, h, crop });
    paint(grid, x, y, w, h, 3);
    placed.push({ x, y, w, h });
  };
  const addBuilding = (x, y, w, h, kind, label = '') => {
    const b = { x, y, w, h, kind, label };
    buildings.push(b);
    paint(solid, x, y, w, h, 1);
    placed.push({ x, y, w, h });
    return b;
  };

  // --- the highways
  H_ROADS.forEach((y) => addRoad(8, y - ROAD_W / 2, 284, ROAD_W));
  V_ROADS.forEach((x) => addRoad(x - ROAD_W / 2, 8, ROAD_W, 184));
  const intersections = [];
  H_ROADS.forEach((y) => V_ROADS.forEach((x) => intersections.push({ x: x - ROAD_W / 2, y: y - ROAD_W / 2, w: ROAD_W, h: ROAD_W })));

  // --- blocks between the highways
  const block = (i, j) => ({
    x: i === 0 ? 8 : XS[i] + 3.5,
    y: j === 0 ? 8 : YS[j] + 3.5,
    w: (i === 5 ? 292 : XS[i + 1] - 3.5) - (i === 0 ? 8 : XS[i] + 3.5),
    h: (j === 4 ? 192 : YS[j + 1] - 3.5) - (j === 0 ? 8 : YS[j] + 3.5),
  });
  const inside = (R, r) => r.x >= R.x && r.y >= R.y && r.x + r.w <= R.x + R.w && r.y + r.h <= R.y + R.h;
  const tryPlace = (R, w, h, pad = 2, tries = 40) => {
    for (let k = 0; k < tries; k++) {
      const r = { x: R.x + rnd() * Math.max(0, R.w - w), y: R.y + rnd() * Math.max(0, R.h - h), w, h };
      r.x = Math.round(r.x);
      r.y = Math.round(r.y);
      if (!inside(R, r)) continue;
      if (placed.some((p) => overlap(r, p, pad))) continue;
      return r;
    }
    return null;
  };

  // --- hand-placed landmarks
  // Big Al's, hidden in the north-west woods at the end of a winding dirt road
  addDirt(28.75, 26.5, 23.75, DIRT_W); // off the highway at the dead tree, heading west
  addDirt(28.75, 14.25, DIRT_W, 15.75); // north
  addDirt(21, 12.5, 11.25, DIRT_W); // west again, to the door
  const store = { x: 8, y: 10, w: 13, h: 9, door: { x: 21, y: 11.5, w: 2.5, h: 5.5 }, cx: 14.5, cy: 14.5 };
  addBuilding(store.x, store.y, store.w, store.h, 'store', "BIG AL'S LIQUOR");

  // Honky Tonk, in Buckeye Junction (the middle of the map)
  addBuilding(125, 95.5, 14, 8, 'bar', 'HONKY TONK');
  addRoad(125, 92.5, 14, 3); // its parking lot, joined to the highway
  // Pete's Junkyard, far south-east
  addBuilding(228, 142, 28, 20, 'junkyard', "PETE'S JUNKYARD");
  // a fake store to waste your time
  addBuilding(130, 76, 14, 9, 'store', "LITTLE AL'S LIQUOR");
  fakeStores.push({ door: { x: 135, y: 85, w: 6, h: 2.5 }, msg: "LITTLE AL'S: CLOSED. Wrong Al!" });
  // the quarry (a big hole in the ground you cannot drive into)
  addBuilding(226, 10, 32, 28, 'quarry', 'QUARRY');
  // the grain elevator
  addBuilding(126, 12, 14, 12, 'elevator', 'GRAIN ELEVATOR');
  addBuilding(142, 12, 4, 4, 'silo');
  addBuilding(142, 18, 4, 4, 'silo');
  // trash depot
  addBuilding(175, 176, 18, 12, 'depot', 'TRASH DEPOT');
  // the spawn: an outhouse in the south-west corner
  addBuilding(9, 186, 2, 2.4, 'outhouse');
  // a lake
  const lake = { x: 172, y: 52, w: 40, h: 30 };
  ponds.push(lake);
  paint(grid, lake.x, lake.y, lake.w, lake.h, 4);
  paint(solid, lake.x, lake.y, lake.w, lake.h, 1);
  placed.push(lake);
  addBuilding(168, 62, 4, 2.5, 'dock', ''); // boat ramp
  // the hunting lodge in the woods
  addBuilding(80, 14, 10, 7, 'lodge', '');

  placed.push({ x: 8, y: 178, w: 20, h: 14 }); // keep the starting area clear for Billy and his pickup

  // --- fill the blocks
  const crops = ['corn', 'wheat', 'hay'];
  const farm = (R) => {
    const nf = 1 + Math.floor(rnd() * 2);
    for (let k = 0; k < nf; k++) {
      const f = tryPlace(R, 14 + Math.floor(rnd() * 12), 8 + Math.floor(rnd() * 8), 2);
      if (f) addField(f.x, f.y, f.w, f.h, crops[Math.floor(rnd() * 3)]);
    }
    const barn = tryPlace(R, 9, 7, 2);
    if (barn) addBuilding(barn.x, barn.y, 9, 7, 'barn');
    const silo = tryPlace(R, 3, 3, 2);
    if (silo) addBuilding(silo.x, silo.y, 3, 3, 'silo');
    const house = tryPlace(R, 6, 5, 2);
    if (house) addBuilding(house.x, house.y, 6, 5, 'house');
  };
  const houses = (R, n) => {
    for (let k = 0; k < n; k++) {
      const h = tryPlace(R, 6, 5, 3);
      if (h) addBuilding(h.x, h.y, 6, 5, 'house');
    }
  };
  const trailers = (R, n) => {
    for (let k = 0; k < n; k++) {
      const t = tryPlace(R, 7, 3, 2.5);
      if (t) addBuilding(t.x, t.y, 7, 3, 'trailer');
    }
  };
  const town = (R, n = 1) => {
    const specs = [[10, 6, 'diner', 'DINER'], [9, 6, 'gas', 'GAS'], [10, 7, 'general', 'GENERAL STORE'], [7, 8, 'church', '']];
    specs.slice(0, 3 + n).forEach(([w, h, kind, label]) => {
      const r = tryPlace(R, w, h, 3);
      if (r) addBuilding(r.x, r.y, w, h, kind, label);
    });
  };

  const plan = [
    ['forest', 'forest', 'x', 'farm', 'x', 'farm'],
    ['houses', 'farm', 'houses', 'x', 'farm', 'trailers'],
    ['farm', 'trailers', 'town', 'houses', 'farm', 'houses'],
    ['farm', 'houses', 'town', 'farm', 'x', 'trailers'],
    ['farm', 'houses', 'farm', 'x', 'houses', 'farm'],
  ];
  const blockTypes = {};
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 6; i++) {
      const R = block(i, j);
      const type = plan[j][i];
      blockTypes[`${i},${j}`] = type;
      if (type === 'farm') farm(R);
      else if (type === 'houses') houses(R, 5);
      else if (type === 'trailers') trailers(R, 10);
      else if (type === 'town') town(R, i === 2 && j === 3 ? 1 : 0);
    }
  }

  // --- trees: sparse in the open, a thick forest in the north-west
  const isFree = (x, y, pad) => {
    for (let ty = Math.floor(y - pad); ty <= Math.floor(y + pad); ty++)
      for (let tx = Math.floor(x - pad); tx <= Math.floor(x + pad); tx++) {
        if (tx < 0 || ty < 0 || tx >= W || ty >= H) return false;
        if (grid[ty * W + tx] !== 0 || solid[ty * W + tx] !== 0) return false;
      }
    return true;
  };
  const scatter = (R, count, spacing, pad = 1.8) => {
    let n = 0;
    for (let i = 0; i < count * 40 && n < count; i++) {
      const x = R.x + rnd() * R.w;
      const y = R.y + rnd() * R.h;
      if (!isFree(x, y, pad)) continue;
      if (Math.hypot(x - 12.5, y - 183) < 6) continue; // keep the spawn clear
      if (trees.some((t) => Math.abs(t.x - x) < spacing && Math.abs(t.y - y) < spacing && Math.hypot(t.x - x, t.y - y) < spacing)) continue;
      trees.push({ x, y });
      solid[Math.floor(y) * W + Math.floor(x)] = 2;
      n++;
    }
  };
  for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) {
    const t = blockTypes[`${i},${j}`];
    const R = block(i, j);
    if (t === 'forest') scatter(R, 340, 2.4);
    else scatter(R, 5, 3.5);
  }
  scatter({ x: 8, y: 8, w: 284, h: 184 }, 60, 6); // stragglers
  // the DEAD TREE, the landmark at the turn-off to Big Al's
  const deadTree = { x: 60, y: 25 };
  trees.push({ ...deadTree, dead: true });
  solid[Math.floor(deadTree.y) * W + Math.floor(deadTree.x)] = 2;

  // --- road signs: town names, a hand-painted one at the turn-off, and some pranksters' decoys
  [
    { x: 100, y: 93.5, text: 'BUCKEYE JCT ➜' },
    { x: 124, y: 87, text: 'BUCKEYE JUNCTION' },
    { x: 52, y: 131, text: '⬆ PETE\'S: 40 MI' },
    { x: 216, y: 131, text: "PETE'S JUNKYARD ➜" },
    { x: 106, y: 41, text: 'ELEVATOR ➜' },
    { x: 161, y: 94, text: "BIG AL'S ➜ BAIT SHOP" }, // decoy
    { x: 216, y: 49, text: "BIG AL'S ⬆ 2 MILES" }, // decoy: leads to the quarry
    { x: 106, y: 138, text: "BIG AL'S ⬅ (JK)" }, // decoy
    { x: 50, y: 31, text: "AL'S ➜", hand: true }, // the real one, hand-painted at the dirt road
    { x: 262, y: 174, text: 'NO TURNING BACK' },
  ].forEach((s) => signs.push(s));

  // --- collectibles: jugs along the roads, plus hidden 1UPs
  const jugs = [];
  H_ROADS.forEach((y, k) => { for (let x = 20 + k * 3; x < 285; x += 22) jugs.push([x, y + (k % 2 ? 1 : -1)]); });
  V_ROADS.forEach((x, k) => { for (let y = 20 + k * 4; y < 188; y += 20) jugs.push([x + (k % 2 ? 1 : -1), y]); });
  jugs.filter(([x, y]) => !isBlockedAt(solid, x, y)).forEach(([x, y]) => pickups.push({ x, y, kind: 'jug' }));
  const freeSpot = (x, y, pad = 0.9) => {
    for (let r = 0; r < 24; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) if (Math.max(Math.abs(dx), Math.abs(dy)) === r && isFree(x + dx, y + dy, pad)) return { x: x + dx, y: y + dy };
    return { x, y };
  };
  [[30, 20], [24.5, 14.2], [165, 120], [240, 100]].forEach(([x, y]) => pickups.push({ ...freeSpot(x, y), kind: 'jug' }));
  // 1UPs: in the woods, beside the quarry, on the lake's boat ramp, out in a far field
  [[34, 20], [262, 24], [168, 68], [90, 150]].forEach(([x, y]) => pickups.push({ ...freeSpot(x, y), kind: 'life' }));

  // --- parked vehicles
  [
    ['pickup', 16.5, 183, 0, '#b5472a'], // your ride, next to the outhouse
    ['tractor', 40, 150, 0.4, '#2e8b3a'],
    ['pickup', 75, 100, 0, '#2f5fb8'],
    ['trash', 182, 174, -1.57, '#3f7f3a'], // by the depot
    ['trash', 190, 191 - 5, 0, '#6b7d3a'],
    ['pickup', 130, 110, 3.14, '#d8d2c0'],
    ['tractor', 190, 100, 1.57, '#c9a227'],
    ['pickup', 250, 100, 0, '#7a4a8a'],
    ['pickup', 235, 168, 3.14, '#b86a2a'],
    ['tractor', 80, 60, 0, '#c9a227'],
  ].forEach(([type, x, y, h, color]) => parked.push({ type, ...freeSpot(x, y, 2.6), h, color }));

  // --- traffic: farmers driving loops around the blocks in the right-hand lane
  const colors = ['#2f5fb8', '#b5472a', '#c9a227', '#3f7f3a', '#7a4a8a', '#d8d2c0', '#6b7d3a', '#b86a2a'];
  const types = ['pickup', 'tractor', 'trash', 'pickup', 'pickup', 'tractor'];
  let n = 0;
  for (let j = 1; j <= 3; j++) {
    for (let i = 1; i <= 4; i++) {
      const route = loop(XS[i], YS[j], XS[i + 1], YS[j + 1]);
      const count = (i + j) % 2 ? 2 : 1;
      for (let c = 0; c < count; c++) traffic.push({ type: types[n % types.length], color: colors[n % colors.length], route, start: c * 4 });
      n++;
    }
  }

  // --- farmers on foot, standing around outside buildings
  buildings
    .filter((b) => ['house', 'barn', 'trailer', 'diner', 'gas', 'general', 'bar'].includes(b.kind))
    .forEach((b, k) => {
      if (k % 3) return;
      const x = b.x + b.w / 2;
      const y = b.y + b.h + 1.2;
      if (!isBlockedAt(solid, x, y) && grid[Math.floor(y) * W + Math.floor(x)] !== 1) peds.push({ x, y });
    });

  // points on the roads, for spawning cops
  const roadPoints = [];
  H_ROADS.forEach((y) => { for (let x = 12; x <= 290; x += 10) roadPoints.push({ x, y }); });
  V_ROADS.forEach((x) => { for (let y = 12; y <= 190; y += 10) roadPoints.push({ x, y }); });

  // --- the treasure hunt
  const clues = [
    {
      name: 'Honky Tonk',
      x: 132,
      y: 101,
      r: 12,
      text: "Big Al's? Haven't seen him in ages. Try asking Pete at his junkyard, way out south-east.",
      objective: "Ask around at the Honky Tonk (middle of the map)",
    },
    {
      name: "Pete's Junkyard",
      x: 236,
      y: 152,
      r: 20,
      text: 'Al? He went off the grid. Look for the big DEAD TREE up in the north-west, then take the dirt road into the woods.',
      objective: "Ask Pete at the junkyard (far south-east)",
    },
    {
      name: 'The Dead Tree',
      x: 55,
      y: 28,
      r: 9,
      text: "This is it. Follow the dirt road into the dark woods. Don't get lost.",
      objective: 'Find the DEAD TREE in the north-west and take the dirt road',
    },
  ];

  return {
    kind: 'drive',
    id: 7,
    name: "Big Al's Liquor Store",
    theme: 'town',
    w: W,
    h: H,
    hRoads: H_ROADS,
    vRoads: V_ROADS,
    grid,
    solid,
    roads,
    dirt,
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
    fakeStores,
    roadPoints,
    store,
    clues,
    startNote: "A note on the outhouse says: \"Big Al's moved. Last I heard he drank at the Honky Tonk, in Buckeye Junction (the middle of the map).\"",
    startObjective: 'Find Big Al\'s Liquor Store. Start by asking at the Honky Tonk (middle of the map)',
    spawn: { x: 12.5, y: 183 },
    checkpoints: [],
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

function isBlockedAt(solid, x, y) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= W || gy >= H) return true;
  return solid[gy * W + gx] !== 0;
}

// Tile types
export const EMPTY = 0;
export const GROUND = 1;
export const HAY = 2;
export const CRATE = 3; // unhit "?" crate
export const USED = 4; // spent crate
export const STUMP = 5;

export const LEVEL_W = 150;
export const LEVEL_H = 11;
export const GROUND_Y = 9; // top row of the ground


// Shared level-building helpers
function builder(w, { h = LEVEL_H, groundY = GROUND_Y } = {}) {
  const tiles = Array.from({ length: h }, () => new Array(w).fill(EMPTY));
  const crates = {}; // "x,y" -> 'jug' | 'shine' | 'bees' | 'swarm:<kind>' | 'gear:<name>'
  const coins = [];
  const spawns = [];
  const lives = []; // static 1UP pickups
  const set = (x, y, t) => {
    tiles[y][x] = t;
  };
  const B = {
    w,
    h,
    groundY,
    tiles,
    crates,
    coins,
    spawns,
    ground(x0, x1) {
      for (let x = x0; x < x1; x++) for (let y = groundY; y < h; y++) set(x, y, GROUND);
    },
    stump(x, height) {
      for (let i = 1; i <= height; i++) set(x, groundY - i, STUMP);
    },
    hay(x, y, len = 1) {
      for (let i = 0; i < len; i++) set(x + i, y, HAY);
    },
    crate(x, y, what = 'jug') {
      set(x, y, CRATE);
      crates[`${x},${y}`] = what;
    },
    jugs(x, y, n, dx = 1) {
      for (let i = 0; i < n; i++) coins.push({ x: x + i * dx, y, taken: false });
    },
    enemy(kind, x, y) {
      spawns.push({ kind, x, y });
    },
    life(x, y) {
      lives.push({ x, y, taken: false });
    },
    // Fills in totals; the exit wants about half of all collectibles
    finish(extra) {
      const total = coins.length + Object.values(crates).filter((c) => c === 'jug').length;
      return {
        w,
        h,
        groundY,
        tiles,
        crates,
        coins,
        spawns,
        lives,
        startX: 2,
        totalJugs: total,
        goalJugs: Math.round(total * 0.5),
        gearPool: [],
        ...extra,
      };
    },
  };
  return B;
}

// Builds "Billy' Holler", the one and only level (for now).
function buildHoller() {
  const B = builder(LEVEL_W);
  const { w, h, tiles, crates, coins, spawns, ground, stump, hay, crate, jugs, enemy } = B;

  // Ground with pits
  [[0, 38], [42, 66], [69, 100], [104, 128], [131, w]].forEach(([a, b]) => ground(a, b));

  // --- Opening: the front yard ---
  jugs(9, 7, 4);
  crate(14, 5, 'jug');
  hay(15, 5);
  crate(16, 5, 'shine');
  hay(17, 5);
  crate(18, 5, 'jug');
  enemy('chicken', 24);

  // Stump staircase, raccoon lurking on the far side
  stump(27, 1);
  stump(30, 2);
  jugs(30, 5, 1);
  enemy('raccoon', 34);
  jugs(35, 7, 3);

  // Pit #1 (4 wide) with an arc of jugs
  jugs(38, 6, 4);

  // --- The creek bank ---
  hay(46, 6, 5);
  jugs(46, 5, 5);
  crate(52, 5, 'bees'); // surprise: a hive
  enemy('chicken', 48);
  enemy('hound', 57);
  jugs(58, 7, 3);

  // Pit #2 (3 wide)
  jugs(66, 6, 3);
  enemy('bee', 67, 5.5);
  enemy('turkey', 72);
  enemy('skunk', 78);
  jugs(76, 7, 2);

  // Stump pyramid
  stump(82, 1);
  stump(83, 2);
  stump(84, 3);
  stump(85, 2);
  stump(86, 1);
  jugs(83, 5, 3);
  enemy('chicken', 90);
  enemy('hound', 94);
  crate(92, 5, 'shine');

  // Pit #3 with a floating plank
  hay(101, 7, 2);
  jugs(101, 6, 2);

  // --- Barn country ---
  hay(108, 6, 3);
  crate(111, 6, 'jug');
  hay(112, 6, 3);
  jugs(108, 5, 7);
  enemy('skunk', 109);
  enemy('chicken', 116);
  enemy('raccoon', 121);
  enemy('turkey', 126);
  stump(118, 2);
  stump(124, 3);
  jugs(125, 5, 2);

  // Treetop trail: a stump to climb, then hay platforms high above the barn.
  // Needs the double jump; pays out a big row of jugs.
  stump(105, 3);
  hay(107, 3, 3);
  hay(112, 3, 3);
  hay(117, 3, 3);
  hay(122, 3, 4);
  jugs(107, 2, 3);
  jugs(112, 2, 3);
  jugs(117, 2, 3);
  jugs(122, 2, 4);
  B.life(110.5, 1); // 1UP above the gap
  enemy('bee', 114, 1.8);

  // Pit #4 (3 wide)
  jugs(128, 6, 3);

  // --- Home stretch ---
  enemy('hound', 136);
  crate(134, 5, 'bees');
  stump(139, 1);
  jugs(133, 7, 4);

  const checkpointX = 60;
  const goalX = 144;
  // The truck needs about half of all the moonshine in the level
  const total = coins.length + Object.values(crates).filter((c) => c === 'jug').length;
  const goalJugs = Math.round(total * 0.5);
  return B.finish({
    id: 1,
    name: "Billy's Holler",
    theme: 'holler',
    collectible: 'jug',
    goalKind: 'truck',
    checkpointX,
    goalX,
    goalJugs,
  });
}

// ---------------------------------------------------------------------------
// Level 2: Crash-Landed. A UFO has gone down on the ranch.
// Same mechanics as level 1; aliens drop ray gun ammo.
function buildAlienRanch() {
  const B = builder(150);
  const { ground, stump, hay, crate, jugs, enemy } = B;

  [[0, 30], [34, 60], [63, 92], [96, 120], [123, 150]].forEach(([a, b]) => ground(a, b));

  // Crash site: the first barrel holds an alien ray gun
  crate(10, 5, 'gear:raygun');
  hay(11, 5);
  crate(12, 5, 'jug');
  hay(13, 5);
  crate(14, 5, 'jug');
  jugs(7, 7, 3);
  enemy('alien', 22);
  jugs(19, 7, 3);
  stump(25, 1);
  enemy('alien', 27);
  jugs(30, 6, 4); // arc over pit #1

  // Ranch yard
  enemy('hopper', 40);
  stump(42, 2);
  crate(44, 5, 'gear:antenna');
  hay(45, 5);
  crate(46, 5, 'jug');
  enemy('tentacle', 50);
  enemy('alien', 54);
  jugs(37, 7, 4);
  jugs(52, 7, 3);
  jugs(57, 7, 2);
  enemy('drone', 61, 5.5); // over pit #2
  jugs(60, 6, 3);

  // Alien farmland
  enemy('hopper', 67);
  enemy('ufo', 71, 3.4);
  crate(72, 5, 'swarm:drone');
  hay(73, 5);
  crate(74, 5, 'jug');
  jugs(69, 7, 3);
  stump(78, 1);
  stump(79, 2);
  stump(80, 3);
  stump(81, 2);
  stump(82, 1);
  jugs(79, 5, 3);
  enemy('tentacle', 86);
  enemy('alien', 89);
  jugs(84, 7, 3);
  hay(93, 7, 2); // floating plank over pit #3
  jugs(93, 6, 2);

  // Mothership ledge: a high route that needs the double jump
  crate(98, 5, 'gear:vest');
  hay(99, 5);
  crate(100, 5, 'shine');
  stump(103, 3);
  hay(105, 3, 3);
  hay(110, 3, 3);
  hay(115, 3, 3);
  jugs(105, 2, 3);
  jugs(110, 2, 3);
  jugs(115, 2, 3);
  enemy('alien', 107);
  enemy('hopper', 112);
  enemy('ufo', 112, 1.8);
  enemy('tentacle', 117);
  jugs(108, 5, 4);
  jugs(121, 6, 3);
  B.life(113.5, 1.4); // 1UP above the gap in the ledge

  // Home stretch to the Time Booth
  enemy('alien', 129);
  crate(128, 5, 'swarm:drone');
  enemy('hopper', 134);
  enemy('tentacle', 138);
  stump(141, 1);
  jugs(131, 7, 4);

  return B.finish({
    id: 2,
    name: 'Crash-Landed',
    theme: 'alien',
    collectible: 'crystal',
    goalKind: 'booth',
    checkpointX: 64,
    goalX: 146,
    gearPool: ['raygun', 'antenna', 'vest'],
  });
}

// ---------------------------------------------------------------------------
// Level 3: The Time Booth drops Billy in the Middle Ages. Goblins, witches, a troll or
// two, and the Witch Queen guarding the castle gate.
function buildMedieval() {
  const B = builder(165);
  const { ground, stump, hay, crate, jugs, enemy } = B;

  [[0, 28], [32, 58], [61, 88], [92, 118], [121, 165]].forEach(([a, b]) => ground(a, b));

  // Arrival: a chest with a sword
  crate(10, 5, 'gear:sword');
  hay(11, 5);
  crate(12, 5, 'jug');
  hay(13, 5);
  crate(14, 5, 'jug');
  jugs(7, 7, 3);
  enemy('goblin', 20);
  enemy('skeleton', 24);
  jugs(19, 7, 4);
  jugs(28, 6, 4);

  // Village road
  enemy('goblin', 36);
  crate(40, 5, 'gear:shield');
  hay(41, 5);
  crate(42, 5, 'swarm:bat');
  enemy('witch', 47);
  enemy('skeleton', 52);
  jugs(34, 7, 3);
  jugs(44, 7, 4);
  jugs(54, 7, 3);
  enemy('bat', 59, 5.5);
  jugs(58, 6, 3);

  // Troll bridge country
  enemy('troll', 68);
  enemy('goblin', 74);
  enemy('witch', 80);
  jugs(64, 7, 3);
  jugs(71, 7, 3);
  stump(82, 1);
  stump(83, 2);
  stump(84, 3);
  stump(85, 2);
  stump(86, 1);
  jugs(83, 5, 3);
  hay(89, 7, 2); // floating plank over the moat
  jugs(89, 6, 2);

  // Castle outskirts, with a rampart walk above
  crate(95, 5, 'gear:knightHelm');
  hay(96, 5);
  crate(97, 5, 'shine');
  stump(101, 3);
  hay(103, 3, 3);
  hay(108, 3, 3);
  hay(113, 3, 3);
  jugs(103, 2, 3);
  jugs(108, 2, 3);
  jugs(113, 2, 3);
  enemy('goblin', 105);
  enemy('troll', 111);
  enemy('bat', 108, 1.8);
  crate(106, 5, 'gear:plate');
  hay(107, 5);
  jugs(104, 7, 3);
  jugs(110, 7, 3);
  jugs(118, 6, 3);
  B.life(111.5, 1.4); // 1UP above the gap in the rampart

  // Castle yard
  enemy('witch', 126);
  enemy('goblin', 130);
  crate(132, 5, 'swarm:bat');
  stump(134, 2);
  enemy('skeleton', 137);
  enemy('troll', 141);
  jugs(124, 7, 4);
  jugs(135, 5, 3);
  jugs(138, 7, 3);

  // The Witch Queen holds the gate
  enemy('boss', 153);

  return B.finish({
    id: 3,
    name: 'Dark Ages',
    theme: 'medieval',
    collectible: 'coin',
    goalKind: 'castle',
    boss: true,
    afterScene: 'wizard',
    checkpointX: 62,
    goalX: 161,
    gearPool: ['sword', 'shield', 'knightHelm', 'plate'],
  });
}

// ---------------------------------------------------------------------------
// Level 4: The Wizard's Fridge. A single-screen climb in the Donkey Kong style:
// zig-zag girders, rolling barrels, and Honkey Kong guarding the fridge at the top.
function buildTower() {
  const H = 14;
  const GY = 12;
  const B = builder(30, { h: H, groundY: GY });
  const { tiles } = B;
  B.ground(0, 30);
  const girder = (x0, x1, y) => {
    for (let x = x0; x <= x1; x++) tiles[y][x] = HAY;
  };
  girder(0, 26, 9); // gap at the right end
  girder(3, 29, 6); // gap at the left end
  girder(0, 26, 3); // gap at the right end; Honkey and the fridge are up here

  B.enemy('honkey', 1.2, 3); // stands on the top girder
  B.life(1, 11); // 1UP in the barrel graveyard at the bottom left (risky!)

  return B.finish({
    id: 4,
    name: "The Wizard's Fridge",
    theme: 'tower',
    collectible: 'none',
    goalKind: 'fridge',
    goalX: 5.6,
    goalFloor: 3,
    checkpointX: 14,
    checkpointFloor: 6,
    startX: 3,
    goalJugs: 0,
    totalJugs: 0,
    winScene: 'fridge',
  });
}

// ---------------------------------------------------------------------------
// Level 5: The Pagoda. Ninja cats and samurai cats, then Max, the big burly tabby.
function buildPagoda() {
  const B = builder(175);
  const { ground, stump, hay, crate, jugs, enemy } = B;

  [[0, 30], [34, 60], [63, 90], [94, 120], [123, 175]].forEach(([a, b]) => ground(a, b));

  // Courtyard
  crate(10, 5, 'jug');
  hay(11, 5);
  crate(12, 5, 'shine');
  hay(13, 5);
  crate(14, 5, 'jug');
  jugs(7, 7, 3);
  enemy('ninja', 20);
  enemy('samurai', 25);
  jugs(18, 7, 4);
  jugs(30, 6, 4);

  // Garden bridge
  enemy('ninja', 38);
  stump(41, 2); // stone lantern
  enemy('samurai', 46);
  crate(48, 5, 'swarm:crow');
  hay(49, 5);
  crate(50, 5, 'jug');
  jugs(36, 7, 3);
  jugs(53, 7, 3);
  enemy('crow', 59, 5.5);
  jugs(58, 6, 3);

  // Pagoda stairs
  enemy('ninja', 67);
  enemy('samurai', 72);
  enemy('ninja', 77);
  stump(82, 1);
  stump(83, 2);
  stump(84, 3);
  stump(85, 2);
  stump(86, 1);
  jugs(83, 5, 3);
  jugs(66, 7, 3);
  jugs(74, 7, 3);
  hay(91, 7, 2); // floating plank over the koi pond
  jugs(91, 6, 2);

  // Rooftops: climb the lantern, then run the pagoda roofs
  crate(96, 5, 'jug');
  hay(97, 5);
  crate(98, 5, 'life');
  stump(101, 3);
  hay(103, 3, 3);
  hay(108, 3, 3);
  hay(113, 3, 3);
  jugs(103, 2, 3);
  jugs(108, 2, 3);
  jugs(113, 2, 3);
  enemy('samurai', 105);
  enemy('ninja', 110);
  enemy('crow', 109, 1.8);
  enemy('samurai', 116);
  jugs(106, 7, 4);
  jugs(111, 7, 3);
  jugs(118, 6, 3);

  // Dojo yard
  enemy('ninja', 127);
  enemy('samurai', 131);
  crate(133, 5, 'swarm:crow');
  stump(135, 2);
  enemy('ninja', 138);
  enemy('samurai', 142);
  jugs(125, 7, 4);
  jugs(136, 5, 3);
  jugs(140, 7, 3);

  // Max's arena
  enemy('max', 162);

  return B.finish({
    id: 5,
    name: 'The Pagoda',
    theme: 'japan',
    collectible: 'fish',
    goalKind: 'dojo',
    boss: true,
    bossScene: 'finale',
    checkpointX: 62,
    goalX: 172,
    goalJugs: 0,
  });
}

export const LEVEL_COUNT = 5;
const BUILDERS = [buildHoller, buildAlienRanch, buildMedieval, buildTower, buildPagoda];

export function buildLevel(n = 1) {
  return BUILDERS[n - 1]();
}

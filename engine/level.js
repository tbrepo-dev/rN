import { buildTown } from './town.js';

// Tile types
export const EMPTY = 0;
export const GROUND = 1;
export const HAY = 2;
export const CRATE = 3; // unhit "?" crate
export const USED = 4; // spent crate
export const STUMP = 5;
export const BREAKABLE = 6; // cracked wall: shoot or slash it
export const DOOR_BLUE = 7; // opens when you shoot it
export const DOOR_RED = 8; // only a missile opens it
export const ACID = 10; // not solid, but it burns
export const VIEW_H = 11; // tile rows on screen in the big scrolling levels

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
    checkpointX: 65, // on solid ground (62 is over the pit)
    goalX: 172,
    goalJugs: 0,
  });
}

// ---------------------------------------------------------------------------
// Level 6: Hell. Billy wakes up here after the red pill. A gauntlet of imps and demons over lava,
// then Pack Billy, a big hungry hillbilly Pac-Man, guards the gates. Drink flaming tequila,
// belch five flame balls for him to eat, and he lets you leave.
function buildHell() {
  const B = builder(170);
  const { ground, stump, hay, crate, jugs, enemy } = B;

  [[0, 28], [32, 56], [59, 84], [88, 112], [115, 170]].forEach(([a, b]) => ground(a, b));

  // Wake-up ledge: the first barrel holds flaming tequila, so Billy can practise belching
  crate(10, 5, 'tequila');
  hay(11, 5);
  crate(12, 5, 'jug');
  hay(13, 5);
  crate(14, 5, 'jug');
  jugs(7, 7, 3);
  enemy('imp', 20);
  enemy('imp', 25);
  stump(26, 1);
  jugs(18, 7, 3);
  jugs(28, 6, 4); // over the first lava pit

  // Brimstone road
  enemy('demon', 38);
  crate(42, 5, 'tequila');
  hay(43, 5);
  crate(44, 5, 'swarm:ember');
  enemy('imp', 48);
  enemy('imp', 52);
  jugs(35, 7, 3);
  jugs(46, 7, 4);
  enemy('ember', 57, 5.5);
  jugs(56, 6, 3);

  // Bone yard
  enemy('demon', 66);
  enemy('imp', 71);
  enemy('imp', 76);
  stump(79, 1);
  stump(80, 2);
  stump(81, 3);
  stump(82, 2);
  stump(83, 1);
  jugs(80, 5, 3);
  jugs(63, 7, 3);
  jugs(72, 7, 3);
  hay(85, 7, 2); // floating slab over the lava
  jugs(85, 6, 2);

  // Obsidian ledges: a high route that needs the double jump
  crate(92, 5, 'tequila');
  hay(93, 5);
  crate(94, 5, 'shine');
  stump(97, 3);
  hay(99, 3, 3);
  hay(104, 3, 3);
  hay(109, 3, 3);
  jugs(99, 2, 3);
  jugs(104, 2, 3);
  jugs(109, 2, 3);
  B.life(102.5, 1.5); // 1UP above the gap
  enemy('demon', 101);
  enemy('imp', 106);
  enemy('ember', 105, 1.8);
  jugs(100, 7, 4);
  jugs(106, 7, 3);

  // The gates of Hell: Pack Billy's arena, with ledges to dodge on
  hay(128, 6, 4);
  hay(140, 6, 4);
  hay(152, 6, 4);
  enemy('packbilly', 148);

  const arena = [];
  [[129.5, 6], [141.5, 6], [153.5, 6], [135, 9], [147, 9], [159, 9], [124, 9], [163, 9]].forEach(([x, y]) => arena.push({ x, y }));

  return B.finish({
    id: 6,
    name: 'Hell',
    theme: 'hell',
    collectible: 'soul',
    goalKind: 'hellgate',
    boss: true,
    bossScene: 'hellExit',
    tequilaSpots: arena,
    checkpointX: 120,
    goalX: 167,
    goalJugs: 0,
  });
}

// ---------------------------------------------------------------------------
// Level 8: The Hive. A Metroid-style map: interconnected caves, blue and red doors, save stations,
// energy tanks, a secret wall that hides a portal to the Egg Chamber (where you harvest a bazooka
// from an alien egg), and the hillbilly Alien Queen waiting behind a door only a missile can open.
function buildHive() {
  const W8 = 200;
  const H8 = 60;
  const B = builder(W8, { h: H8, groundY: 50 });
  const { tiles } = B;
  const set = (x, y, t) => {
    if (x >= 0 && y >= 0 && x < W8 && y < H8) tiles[y][x] = t;
  };
  const fill = (x, y, w, h, t) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, t);
  };
  const carve = (x0, y0, x1, y1) => fill(x0, y0, x1 - x0 + 1, y1 - y0 + 1, EMPTY);
  const ledge = (x0, x1, feet) => fill(x0, feet, x1 - x0 + 1, 1, HAY);
  const acid = (x0, x1, y) => fill(x0, y, x1 - x0 + 1, 1, ACID);
  const door = (x, y0, y1, type) => fill(x, y0, 1, y1 - y0 + 1, type);
  fill(0, 0, W8, H8, GROUND); // all rock; now carve the caves out of it

  // R1: the crash bay, where Billy lands
  carve(2, 44, 29, 49);
  ledge(10, 13, 47);
  ledge(20, 22, 46);
  // the door to the first cavern
  carve(30, 46, 33, 49);
  door(31, 46, 49, DOOR_BLUE);
  // R2: the egg cavern, with a save station, a step, a pit, and a shaft up
  carve(34, 40, 70, 49);
  fill(52, 48, 5, 2, GROUND); // a step
  ledge(58, 60, 47); // a ledge for a spitter
  carve(63, 50, 66, 52); // a pit with acid at the bottom
  acid(63, 66, 52);
  // the shaft up to the gallery: ledges every 3 rows, alternating right and left
  carve(44, 21, 50, 39);
  const shaft1 = [[47, 'R'], [44, 'L'], [41, 'R'], [38, 'L'], [35, 'R'], [32, 'L'], [29, 'R'], [26, 'L'], [23, 'R']];
  shaft1.forEach(([f, side]) => (side === 'R' ? ledge(48, 50, f) : ledge(44, 46, f)));
  // the secret: a cracked wall in the east end of the cavern, hiding a little alcove with a sac-like portal
  carve(72, 47, 75, 49);
  door(71, 47, 49, BREAKABLE);

  // The gallery: a long hall across the top, with acid pits and a hidden energy tank
  carve(12, 9, 117, 20);
  ledge(38, 40, 18);
  ledge(33, 35, 15);
  ledge(28, 30, 12);
  ledge(22, 26, 12); // the tank sits here
  carve(62, 21, 66, 23); // pit 1
  acid(62, 66, 23);
  carve(76, 21, 86, 23); // pit 2, with a platform over it
  acid(76, 86, 23);
  ledge(79, 83, 19);
  carve(98, 21, 103, 23); // pit 3
  acid(98, 103, 23);
  ledge(100, 101, 20);
  fill(70, 17, 2, 4, GROUND); // a pillar to jump
  // the door out of the gallery, and a corridor to the second shaft
  door(118, 17, 20, DOOR_BLUE);
  carve(119, 17, 121, 20);
  // the second shaft down to the Hive Core, with ledges for climbing back up
  carve(122, 17, 128, 37);

  // R3: the Hive Core, full of eggs. Another energy tank is hidden up high on the right
  carve(100, 38, 149, 49);
  // (ledges go in after the Core is carved, since the lower ones stand inside it)
  const shaft2 = [[47, 'L'], [44, 'R'], [41, 'L'], [38, 'R'], [35, 'L'], [32, 'R'], [29, 'L'], [26, 'R'], [23, 'L']];
  shaft2.forEach(([f, side]) => (side === 'L' ? ledge(122, 124, f) : ledge(126, 128, f)));
  ledge(108, 112, 46);
  ledge(130, 136, 46);
  ledge(138, 141, 43);
  ledge(143, 147, 40);
  carve(114, 50, 118, 52); // a pit
  acid(114, 118, 52);
  // the red door, only a missile will open it
  door(150, 46, 49, DOOR_RED);
  // R4: the Queen's nest
  carve(151, 36, 198, 49);
  ledge(166, 170, 46);
  ledge(180, 184, 46);
  ledge(172, 176, 42);

  // --- creatures (y = the floor they stand on)
  const en = B.enemy;
  en('hugger', 14, 50);
  en('hugger', 25, 50);
  en('hugger', 38, 50);
  en('xeno', 46, 50);
  en('egg', 41, 50);
  en('egg', 60, 50);
  en('spitter', 59, 47);
  en('xeno', 67.5, 50);
  en('drone', 47, 28);
  en('spitter', 56, 21);
  en('hugger', 66, 21);
  en('xeno', 72, 21);
  en('egg', 56, 21);
  en('egg', 90, 21);
  en('spitter', 90, 21);
  en('hugger', 96, 21);
  en('egg', 108, 21);
  en('drone', 120, 28);
  en('spitter', 125, 50);
  en('xeno', 106, 50);
  en('xeno', 136, 46);
  en('xeno', 120, 50);
  en('egg', 104, 50);
  en('egg', 126, 50);
  en('egg', 134, 50);
  en('egg', 144, 50);
  en('spitter', 110, 46);
  en('spitter', 146, 40);
  en('hugger', 140, 50);
  en('queen', 188, 50);
  const eggSpots = [162, 170, 178, 192, 196].map((x) => ({ x, floor: 50 }));

  // --- things to find
  const saves = [{ x: 36, floor: 50 }, { x: 53, floor: 21 }, { x: 133, floor: 50 }, { x: 155, floor: 50 }];
  const tanks = [{ x: 24, y: 10.2, taken: false }, { x: 145, y: 38.2, taken: false }];
  const portals = [{ x: 73.2, y: 47, w: 1.8, h: 3, to: 'egg' }];
  B.jugs(8, 48.5, 3);
  B.jugs(60, 18, 4);
  B.jugs(104, 18, 5);
  B.jugs(162, 46, 4);
  B.life(29, 10); // a 1UP up in the rafters of the gallery

  return B.finish({
    id: 8,
    name: 'The Hive',
    theme: 'hive',
    collectible: 'jug',
    goalKind: 'queen',
    boss: true,
    bossScene: 'queenDead',
    scrollY: true,
    startX: 5,
    startFloor: 50,
    checkpointX: Infinity,
    goalX: 0,
    goalJugs: 0,
    saves,
    tanks,
    portals,
    eggSpots,
    // for the tests: the standing spots along the main route (x, floor) and the secret route
    route: [
      [5, 50], [28, 50], [36, 50], [49, 47], [45, 44], [49, 41], [45, 38], [49, 35], [45, 32], [49, 29], [45, 26], [49, 23], [53, 21],
      [60, 21], [68, 21], [74, 21], [81, 19], [88, 21], [96, 21], [100.5, 20], [105, 21], [116, 21], [120, 21],
      [123, 23], [127, 26], [123, 29], [127, 32], [123, 35], [127, 38], [123, 41], [127, 44], [123, 47], [126, 50],
      [133, 50], [148, 50], [153, 50], [165, 50], [188, 50],
    ],
    secretRoute: [[36, 50], [60, 50], [68, 50], [73, 50]],
  });
}

// The secret level inside the Hive: the Egg Chamber. Fight your way through the nest to the Queen
// Egg at the top, crack it open, and harvest the bazooka.
function buildEggChamber() {
  const W9 = 80;
  const H9 = 44;
  const B = builder(W9, { h: H9, groundY: 38 });
  const { tiles } = B;
  const set = (x, y, t) => {
    if (x >= 0 && y >= 0 && x < W9 && y < H9) tiles[y][x] = t;
  };
  const fill = (x, y, w, h, t) => {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) set(xx, yy, t);
  };
  const carve = (x0, y0, x1, y1) => fill(x0, y0, x1 - x0 + 1, y1 - y0 + 1, EMPTY);
  const ledge = (x0, x1, feet) => fill(x0, feet, x1 - x0 + 1, 1, HAY);
  const acid = (x0, x1, y) => fill(x0, y, x1 - x0 + 1, 1, ACID);
  fill(0, 0, W9, H9, GROUND);

  carve(2, 32, 18, 37); // E1: the way in
  carve(19, 32, 40, 37); // E2
  carve(20, 38, 23, 40); // pit 1
  acid(20, 23, 40);
  carve(41, 32, 50, 37); // pit 2 with a platform over it
  carve(41, 38, 50, 40);
  acid(41, 50, 40);
  ledge(44, 47, 36);
  carve(51, 32, 62, 37); // E3, with the shaft going up
  carve(56, 17, 62, 31);
  [[35, 'L'], [32, 'R'], [29, 'L'], [26, 'R'], [23, 'L'], [20, 'R']].forEach(([f, side]) => (side === 'L' ? ledge(56, 58, f) : ledge(60, 62, f)));
  carve(44, 6, 76, 16); // the Queen Egg chamber at the top

  const en = B.enemy;
  en('hugger', 12, 38);
  en('egg', 16, 38);
  en('hugger', 30, 38);
  en('spitter', 36, 38);
  en('egg', 26, 38);
  en('hugger', 52, 38);
  en('xeno', 54, 38);
  en('egg', 59, 38);
  en('spitter', 49, 17);
  en('hugger', 66, 17);
  en('queenegg', 69, 17);

  return B.finish({
    id: 9,
    name: 'The Egg Chamber',
    theme: 'egg',
    collectible: 'jug',
    goalKind: 'secret',
    scrollY: true,
    secret: true,
    startX: 4,
    startFloor: 38,
    checkpointX: Infinity,
    goalX: 0,
    goalJugs: 0,
    saves: [{ x: 6, floor: 38 }, { x: 53, floor: 38 }],
    tanks: [{ x: 47, y: 15.2, taken: false }],
    portals: [{ x: 74, y: 13, w: 2, h: 4, to: 'parent' }],
    eggSpots: [],
    route: [[4, 38], [19, 38], [24, 38], [40, 38], [45, 36], [52, 38], [57, 35], [61, 32], [57, 29], [61, 26], [57, 23], [61, 20], [65, 17], [70, 17]],
  });
}

export function buildSecret(id) {
  if (id === 'egg') return buildEggChamber();
  throw new Error(`no secret level ${id}`);
}

// Level 9: the cage match (a fighting game; see fight.js). No tiles, but it carries the fields the rest of the game reads.
function buildFight() {
  return {
    kind: 'fight',
    id: 9,
    name: 'Hillbilly Cage Match',
    theme: 'fight',
    w: 16,
    h: 8,
    groundY: 7,
    tiles: [[0]],
    crates: {},
    coins: [],
    spawns: [],
    lives: [],
    startX: 2,
    totalJugs: 0,
    goalJugs: 0,
    gearPool: [],
    collectible: 'none',
    goalKind: 'fight',
    winScene: 'champion',
  };
}

// Level 10: the penguin race (see race.js)
function buildRace() {
  return {
    kind: 'race',
    id: 10,
    name: 'Penguin Grand Prix',
    theme: 'race',
    w: 16,
    h: 8,
    groundY: 7,
    tiles: [[0]],
    crates: {},
    coins: [],
    spawns: [],
    lives: [],
    startX: 2,
    totalJugs: 0,
    goalJugs: 0,
    gearPool: [],
    collectible: 'none',
    goalKind: 'race',
    winScene: 'raceWin',
  };
}

// Level 11: Hillbilly Kart (see kart.js)
function buildKart() {
  return { ...buildRace(), kind: 'kart', id: 11, name: 'Hillbilly Kart', theme: 'kart', goalKind: 'kart', winScene: 'kartWin' };
}

export const LEVEL_COUNT = 11;
const BUILDERS = [buildHoller, buildAlienRanch, buildMedieval, buildTower, buildPagoda, buildHell, buildTown, buildHive, buildFight, buildRace, buildKart];

export function buildLevel(n = 1) {
  return BUILDERS[n - 1]();
}

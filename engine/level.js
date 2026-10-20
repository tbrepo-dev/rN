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

// Builds "Cletus' Holler", the one and only level (for now).
export function buildLevel() {
  const w = LEVEL_W;
  const h = LEVEL_H;
  const tiles = Array.from({ length: h }, () => new Array(w).fill(EMPTY));
  const crates = {}; // "x,y" -> 'jug' | 'shine'
  const coins = [];
  const spawns = [];
  const set = (x, y, t) => {
    tiles[y][x] = t;
  };

  const ground = (x0, x1) => {
    for (let x = x0; x < x1; x++) for (let y = GROUND_Y; y < h; y++) set(x, y, GROUND);
  };
  const stump = (x, height) => {
    for (let i = 1; i <= height; i++) set(x, GROUND_Y - i, STUMP);
  };
  const hay = (x, y, len = 1) => {
    for (let i = 0; i < len; i++) set(x + i, y, HAY);
  };
  const crate = (x, y, what = 'jug') => {
    set(x, y, CRATE);
    crates[`${x},${y}`] = what;
  };
  const jugs = (x, y, n, dx = 1) => {
    for (let i = 0; i < n; i++) coins.push({ x: x + i * dx, y, taken: false });
  };
  const enemy = (kind, x) => spawns.push({ kind, x });

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
  crate(52, 5, 'jug');
  enemy('chicken', 48);
  enemy('chicken', 56);
  jugs(58, 7, 3);

  // Pit #2 (3 wide)
  jugs(66, 6, 3);
  enemy('skunk', 74);
  jugs(76, 7, 2);

  // Stump pyramid
  stump(82, 1);
  stump(83, 2);
  stump(84, 3);
  stump(85, 2);
  stump(86, 1);
  jugs(83, 5, 3);
  enemy('chicken', 90);
  enemy('raccoon', 95);
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
  stump(118, 2);
  stump(124, 3);
  jugs(125, 5, 2);

  // Pit #4 (3 wide)
  jugs(128, 6, 3);

  // --- Home stretch ---
  enemy('chicken', 136);
  stump(139, 1);
  jugs(133, 7, 4);

  const checkpointX = 60;
  const goalX = 144;
  return { w, h, tiles, crates, coins, spawns, checkpointX, goalX, startX: 2 };
}

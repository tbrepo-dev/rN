import { buildLevel, LEVEL_COUNT, EMPTY, CRATE, USED, GROUND_Y } from './level.js';

export { LEVEL_COUNT };
export const STEP = 1 / 60;

export const SMALL_H = 0.95;
export const BIG_H = 1.4;
export const SHINE_MAX = 8;
export const AMMO_MAX = 30;
const PLAYER_W = 0.7;
const EPS = 1e-4;
const RUSH_TIME = 6;
const JUG_LIFETIME = 10;

const C = {
  gravity: 55,
  jumpV: 20.5,
  airJumpV: 19,
  airJumps: 1,
  releaseGravity: 3, // extra gravity multiplier when jump released while rising
  maxFall: 24,
  walk: 8,
  accelGround: 50,
  accelAir: 32,
  decel: 55,
  coyote: 0.1,
  buffer: 0.12,
  stompBounce: 12,
  stompBounceHeld: 17,
  rushSpeed: 1.35,
  rushJump: 1.12,
  shieldSpeed: 0.45,
  cobSpeed: 11,
  cobGravity: 38,
  throwCooldown: 0.3,
  maxCobs: 4,
  rayCooldown: 0.22,
  raySpeed: 20,
  slashTime: 0.28,
  slashCooldown: 0.34,
  slashReach: 1.7,
};

// Gear Billy can find. `armor` = extra hits absorbed (refilled on every respawn).
export const GEAR = {
  raygun: { name: 'Alien Ray Gun', slot: 'weapon', armor: 0, blurb: 'Kills aliens for ammo' },
  antenna: { name: 'Antenna Helmet', slot: 'head', armor: 0, blurb: 'Double ammo from kills' },
  vest: { name: 'Alien Vest', slot: 'body', armor: 1, blurb: '+1 armor' },
  sword: { name: 'Knight Sword', slot: 'melee', armor: 0, blurb: 'Fire button slashes up close' },
  shield: { name: 'Knight Shield', slot: 'offhand', armor: 0, blurb: 'Hold to block from the front' },
  knightHelm: { name: 'Knight-Alien Helm', slot: 'head', armor: 1, blurb: '+1 armor' },
  plate: { name: 'Knight-Alien Armor', slot: 'body', armor: 1, blurb: '+1 armor' },
};

// speed: patrol speed (tiles/s); hp: damage to kill (a stomp does 2, cobs/rays 1, sword 2);
// stomp: can be jumped on; ammo: ray-gun ammo dropped; ai picks the behaviour.
const ENEMY_KINDS = {
  chicken: { ai: 'walk', speed: 2, w: 0.8, h: 0.8, edgeTurn: true, hp: 1, stomp: true },
  raccoon: { ai: 'walk', speed: 3.6, w: 0.85, h: 0.75, edgeTurn: false, hp: 1, stomp: true },
  skunk: { ai: 'walk', speed: 2.4, w: 0.85, h: 0.7, edgeTurn: true, hp: 1, stomp: true },
  hound: { ai: 'chase', speed: 1.5, w: 0.95, h: 0.75, edgeTurn: true, hp: 1, stomp: true },
  turkey: { ai: 'charge', speed: 1.2, dash: 8.5, wind: 0.6, w: 0.95, h: 1.0, edgeTurn: true, hp: 2, stomp: true },
  bee: { ai: 'fly', w: 0.6, h: 0.6, hp: 1, stomp: false, fly: true },

  // Level 2: aliens (all drop ray gun ammo)
  alien: { ai: 'walk', speed: 2.2, w: 0.8, h: 0.9, edgeTurn: true, hp: 1, stomp: true, ammo: 3 },
  hopper: { ai: 'hop', speed: 2.6, w: 0.8, h: 0.8, edgeTurn: false, hp: 1, stomp: true, ammo: 2 },
  tentacle: { ai: 'shoot', speed: 0, w: 0.9, h: 0.9, edgeTurn: false, hp: 2, stomp: true, ammo: 4 },
  ufo: { ai: 'ufo', w: 1.1, h: 0.7, hp: 2, stomp: false, fly: true, amp: 4, ammo: 5 },
  drone: { ai: 'fly', w: 0.6, h: 0.6, hp: 1, stomp: false, fly: true, ammo: 1 },

  // Level 3: the Middle Ages
  goblin: { ai: 'walk', speed: 2.6, w: 0.8, h: 0.85, edgeTurn: true, hp: 2, stomp: true },
  skeleton: { ai: 'walk', speed: 1.8, w: 0.75, h: 0.95, edgeTurn: true, hp: 1, stomp: true },
  troll: { ai: 'charge', speed: 1, dash: 7.5, wind: 0.8, w: 1.1, h: 1.2, edgeTurn: true, hp: 4, stomp: true },
  witch: { ai: 'cast', speed: 0, w: 0.8, h: 1.0, edgeTurn: false, hp: 2, stomp: true },
  bat: { ai: 'fly', w: 0.6, h: 0.5, hp: 1, stomp: false, fly: true },
  boss: { ai: 'boss', speed: 2.2, w: 1.3, h: 1.6, edgeTurn: false, hp: 14, stomp: true, score: 2000 },
};

export function createGame({ enemies = true, level = 1 } = {}) {
  const g = {
    levelNo: 1,
    level: null,
    tiles: null,
    coins: null,
    enemiesEnabled: enemies,
    mode: 'playing', // intro | playing | dying | gameover | won
    time: 0,
    deathT: 0,
    score: 0,
    jugs: 0,
    shine: 0, // moonshine meter, spent on Rush
    lives: 3,
    gear: {}, // name -> true; carried across levels
    ammo: 0,
    checkpoint: 2,
    checkpointHit: false,
    bossDefeated: false,
    viewW: 20,
    camX: 0,
    version: 0, // bumped when the static tile layer changes
    enemies: [],
    items: [],
    cobs: [],
    rays: [],
    shots: [],
    effects: [],
    events: [], // sound cues for the UI to drain
    toast: null,
    loot: [],
    prevJump: false,
    prevThrow: false,
    prevRush: false,
    truckMsgT: 0,
    player: null,
  };
  loadLevel(g, level);
  if (g.mode === 'intro') g.mode = 'playing'; // the UI shows intros; tests and level 1 start right away
  return g;
}

// (Re)builds a level, keeping lives, score, gear, ammo and the shine meter.
export function loadLevel(g, n) {
  g.levelNo = n;
  g.level = buildLevel(n);
  g.tiles = g.level.tiles;
  g.coins = g.level.coins;
  g.jugs = 0;
  g.checkpoint = g.level.startX;
  g.checkpointHit = false;
  g.bossDefeated = false;
  g.truckMsgT = 0;
  g.loot = [];
  g.version++;
  respawn(g);
  if (n > 1) g.mode = 'intro';
}

export function nextLevel(g) {
  if (g.levelNo < LEVEL_COUNT) loadLevel(g, g.levelNo + 1);
}

export function startPlaying(g) {
  if (g.mode === 'intro') g.mode = 'playing';
}

export const armorMax = (g) => Object.keys(g.gear).reduce((n, k) => n + (g.gear[k] ? GEAR[k].armor : 0), 0);

function newPlayer(x) {
  return {
    x,
    y: GROUND_Y - SMALL_H,
    w: PLAYER_W,
    h: SMALL_H,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    big: false,
    armor: 0,
    invuln: 0,
    coyote: 0,
    buf: 0,
    jumping: false,
    airJumps: C.airJumps,
    throwCd: 0,
    slash: 0,
    shielding: false,
    rush: 0,
    run: 0,
  };
}

export function respawn(g) {
  g.player = newPlayer(g.checkpoint);
  g.player.armor = armorMax(g);
  g.mode = 'playing';
  g.deathT = 0;
  g.items = [];
  g.cobs = [];
  g.rays = [];
  g.shots = [];
  g.effects = [];
  g.prevJump = false;
  g.prevThrow = false;
  g.prevRush = false;
  g.enemies = g.enemiesEnabled
    ? g.level.spawns
        .filter((s) => s.x >= g.checkpoint - 2 && !(s.kind === 'boss' && g.bossDefeated))
        .map((s) => makeEnemy(s))
    : [];
  g.camX = clamp(g.player.x - g.viewW * 0.3, 0, g.level.w - g.viewW);
}

function makeEnemy(s) {
  const k = ENEMY_KINDS[s.kind];
  const y = k.fly ? s.y ?? GROUND_Y - 3 : GROUND_Y - k.h;
  return {
    kind: s.kind,
    x: s.x,
    y,
    ox: s.x,
    oy: y,
    phase: s.x * 0.7,
    w: k.w,
    h: k.h,
    vx: -(k.speed || 0),
    vy: 0,
    dir: -1,
    hp: k.hp,
    alive: true,
    squish: 0,
    squished: false,
    awake: false,
    t: 0,
    hit: 0,
    iframes: 0,
    state: 'walk',
    stateT: 0,
    cd: 0.5,
    shootT: 1 + (s.x % 3) * 0.3,
    hopT: 0.5,
  };
}

function spawnSwarm(g, kind, x, y) {
  const e = makeEnemy({ kind, x, y });
  e.swarm = true;
  e.life = 7;
  e.awake = true;
  e.vx = (Math.random() - 0.5) * 4;
  e.vy = -2;
  g.enemies.push(e);
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function solidAt(g, tx, ty) {
  if (tx < 0 || tx >= g.level.w) return true;
  if (ty < 0 || ty >= g.level.h) return false;
  return g.tiles[ty][tx] !== EMPTY;
}

// Moves a body through the tile grid. Returns {hitX, bump}.
// `bump` is the tile hit by the body's head, if any.
export function moveBody(g, b, dt) {
  let hitX = false;
  let bump = null;

  b.x += b.vx * dt;
  let y0 = Math.floor(b.y);
  let y1 = Math.floor(b.y + b.h - EPS);
  if (b.vx > 0) {
    const tx = Math.floor(b.x + b.w - EPS);
    for (let ty = y0; ty <= y1; ty++) {
      if (solidAt(g, tx, ty)) {
        b.x = tx - b.w;
        hitX = true;
        break;
      }
    }
  } else if (b.vx < 0) {
    const tx = Math.floor(b.x);
    for (let ty = y0; ty <= y1; ty++) {
      if (solidAt(g, tx, ty)) {
        b.x = tx + 1;
        hitX = true;
        break;
      }
    }
  }
  if (hitX) b.vx = 0;

  b.y += b.vy * dt;
  const x0 = Math.floor(b.x);
  const x1 = Math.floor(b.x + b.w - EPS);
  if (b.vy > 0) {
    const ty = Math.floor(b.y + b.h - EPS);
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(g, tx, ty)) {
        b.y = ty - b.h;
        b.vy = 0;
        break;
      }
    }
  } else if (b.vy < 0) {
    const ty = Math.floor(b.y);
    // Prefer the column the body overlaps most
    const cols = [];
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(g, tx, ty)) {
        const overlap = Math.min(b.x + b.w, tx + 1) - Math.max(b.x, tx);
        cols.push({ tx, overlap });
      }
    }
    if (cols.length) {
      cols.sort((a, c) => c.overlap - a.overlap);
      b.y = ty + 1;
      b.vy = 0;
      bump = { tx: cols[0].tx, ty };
    }
  }

  // Ground probe
  b.onGround = false;
  if (b.vy >= 0) {
    const ty = Math.floor(b.y + b.h + 0.02);
    for (let tx = x0; tx <= x1; tx++) {
      if (solidAt(g, tx, ty)) {
        b.onGround = true;
        break;
      }
    }
  }
  return { hitX, bump };
}

function approach(v, target, amount) {
  if (v < target) return Math.min(v + amount, target);
  return Math.max(v - amount, target);
}

function floatText(g, x, y, text) {
  g.effects.push({ kind: 'text', x, y, text, t: 0 });
}

const emit = (g, name) => g.events.push(name);

function toast(g, text) {
  g.toast = { text, t: 3.2 };
}

function collectJug(g) {
  g.jugs++;
  g.score += 100;
  g.shine = Math.min(SHINE_MAX, g.shine + 1);
  emit(g, 'coin');
}

export function equip(g, name) {
  if (g.gear[name]) return;
  g.gear[name] = true;
  if (g.player) g.player.armor += GEAR[name].armor;
  toast(g, `Equipped: ${GEAR[name].name}`);
  emit(g, 'gear');
}

const YEEHAWS = ['Yeehaw!', 'Hoo-wee!', 'Whoa nelly!', 'Dang!'];

export function step(g, input, dt = STEP) {
  g.time += dt;
  if (g.toast && (g.toast.t -= dt) <= 0) g.toast = null;
  if (g.mode === 'dying') return stepDying(g, dt);
  if (g.mode !== 'playing') return;

  updatePlayer(g, input, dt);
  updateCobs(g, dt);
  updateRays(g, dt);
  updateEnemies(g, dt);
  updateShots(g, dt);
  updateItems(g, dt);
  collide(g);
  updateEffects(g, dt);

  const p = g.player;
  if (g.mode === 'playing') {
    if (!g.checkpointHit && p.x >= g.level.checkpointX) {
      g.checkpointHit = true;
      g.checkpoint = g.level.checkpointX;
      floatText(g, p.x, p.y - 1, 'Checkpoint!');
    }
    if (p.y > g.level.h + 1) die(g);
    else checkGoal(g);
  }

  const target = clamp(p.x + p.w / 2 - g.viewW * 0.4, 0, g.level.w - g.viewW);
  g.camX += (target - g.camX) * Math.min(1, dt * 8);
}

const COLLECT_NAMES = { jug: 'jugs', crystal: 'crystals', coin: 'coins' };

function checkGoal(g) {
  const p = g.player;
  g.truckMsgT = Math.max(0, g.truckMsgT - STEP);
  if (Math.abs(p.x - g.level.goalX) > 1.6) return;
  const bossAlive = g.level.boss && g.enemiesEnabled && !g.bossDefeated;
  if (bossAlive) {
    if (g.truckMsgT === 0) {
      g.truckMsgT = 2;
      floatText(g, g.level.goalX - 2, GROUND_Y - 3.2, 'Defeat the Witch Queen!');
    }
  } else if (g.jugs >= g.level.goalJugs) {
    if (p.onGround) win(g);
  } else if (g.truckMsgT === 0) {
    g.truckMsgT = 2;
    floatText(g, g.level.goalX - 1.4, GROUND_Y - 3.2, `Need ${g.level.goalJugs - g.jugs} more ${COLLECT_NAMES[g.level.collectible]}!`);
  }
}

function updatePlayer(g, input, dt) {
  const p = g.player;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const jumpPressed = input.jump && !g.prevJump;
  const throwPressed = input.throw && !g.prevThrow;
  const rushPressed = input.rush && !g.prevRush;
  g.prevJump = input.jump;
  g.prevThrow = !!input.throw;
  g.prevRush = !!input.rush;

  if (rushPressed && p.rush <= 0 && g.shine >= SHINE_MAX) {
    p.rush = RUSH_TIME;
    g.shine = 0;
    floatText(g, p.x - 0.5, p.y - 1, 'MOONSHINE!');
    emit(g, 'rush');
  }
  if (p.rush > 0) p.rush -= dt;
  const rushing = p.rush > 0;
  p.shielding = !!(input.shield && g.gear.shield && p.slash <= 0);
  const walk = C.walk * (rushing ? C.rushSpeed : 1) * (p.shielding ? C.shieldSpeed : 1);
  const jumpV = C.jumpV * (rushing ? C.rushJump : 1);

  if (dir) {
    p.facing = dir;
    const accel = p.onGround ? C.accelGround : C.accelAir;
    p.vx = approach(p.vx, dir * walk, accel * dt * (rushing ? 1.3 : 1));
  } else {
    p.vx = approach(p.vx, 0, (p.onGround ? C.decel : C.accelAir * 0.4) * dt);
  }

  p.coyote = p.onGround ? C.coyote : Math.max(0, p.coyote - dt);
  p.buf = jumpPressed ? C.buffer : Math.max(0, p.buf - dt);
  if (p.buf > 0 && p.coyote > 0) {
    p.vy = -jumpV;
    p.buf = 0;
    p.coyote = 0;
    p.jumping = true;
    p.onGround = false;
    emit(g, 'jump');
  } else if (jumpPressed && !p.onGround && p.airJumps > 0) {
    // Double jump: one extra hop in mid-air, refilled on landing
    p.vy = -C.airJumpV * (rushing ? C.rushJump : 1);
    p.airJumps--;
    p.buf = 0;
    p.jumping = true;
    g.effects.push({ kind: 'puff', x: p.x + p.w / 2, y: p.y + p.h, t: 0 });
    if (Math.floor(g.time * 10) % 3 === 0) floatText(g, p.x - 0.3, p.y - 0.8, YEEHAWS[Math.floor(g.time * 7) % YEEHAWS.length]);
    emit(g, 'airjump');
  }
  if (p.onGround) p.airJumps = C.airJumps;

  p.throwCd = Math.max(0, p.throwCd - dt);
  p.slash = Math.max(0, p.slash - dt);
  if (throwPressed && p.throwCd <= 0 && !p.shielding) fire(g, rushing);

  let gravity = C.gravity;
  if (p.vy < 0 && !input.jump) gravity *= C.releaseGravity;
  p.vy = Math.min(p.vy + gravity * dt, C.maxFall);
  if (p.vy >= 0) p.jumping = false;

  const { bump } = moveBody(g, p, dt);
  if (bump) hitTile(g, bump.tx, bump.ty);

  if (p.invuln > 0) p.invuln -= dt;
  p.run = p.onGround && Math.abs(p.vx) > 0.5 ? p.run + Math.abs(p.vx) * dt : 0;

  for (const c of g.coins) {
    if (!c.taken && Math.abs(c.x + 0.5 - (p.x + p.w / 2)) < 0.7 && Math.abs(c.y + 0.5 - (p.y + p.h / 2)) < 0.4 + p.h / 2) {
      c.taken = true;
      collectJug(g);
    }
  }
}

// The fire button: sword up close, else the ray gun while there's ammo, else corn cobs.
function slashBox(g) {
  const p = g.player;
  const x = p.facing > 0 ? p.x + p.w - 0.1 : p.x - C.slashReach + 0.1;
  return { x, y: p.y - 0.3, w: C.slashReach, h: p.h + 0.6 };
}

function fire(g, triple) {
  const p = g.player;
  if (g.gear.sword) {
    const box = slashBox(g);
    if (g.enemies.some((e) => e.alive && overlap(box, e)) || g.shots.some((s) => overlap(box, s))) return slash(g, box);
  }
  if (g.gear.raygun && g.ammo > 0) return shootRay(g, triple);
  if (g.cobs.length < C.maxCobs) throwCobs(g, triple);
  p.throwCd = C.throwCooldown;
}

function slash(g, box) {
  const p = g.player;
  p.slash = C.slashTime;
  p.throwCd = C.slashCooldown;
  emit(g, 'slash');
  for (const e of g.enemies) if (e.alive && overlap(box, e)) damage(g, e, 2, 'sword');
  for (const s of g.shots) if (overlap(box, s)) s.dead = true;
  g.shots = g.shots.filter((s) => !s.dead);
}

function shootRay(g, triple) {
  const p = g.player;
  g.ammo--;
  p.throwCd = C.rayCooldown;
  g.rays.push({ x: p.x + p.w / 2 + p.facing * 0.5 - 0.3, y: p.y + p.h * 0.38 - 0.1, w: 0.6, h: 0.2, vx: p.facing * C.raySpeed, life: 1.2, pierce: 2 });
  emit(g, 'ray');
}

function throwCobs(g, triple) {
  const p = g.player;
  const volleys = triple ? [-4, -8, -12] : [-7];
  for (const vy of volleys) {
    g.cobs.push({
      x: p.x + p.w / 2 - 0.2 + p.facing * 0.4,
      y: p.y + p.h * 0.3,
      w: 0.4,
      h: 0.4,
      vx: p.facing * C.cobSpeed + p.vx * 0.3,
      vy,
      age: 0,
      bounces: 0,
    });
  }
  emit(g, 'throw');
}

function updateCobs(g, dt) {
  for (const c of g.cobs) {
    c.age += dt;
    c.vy = Math.min(c.vy + C.cobGravity * dt, C.maxFall);
    const fallV = c.vy;
    const { hitX } = moveBody(g, c, dt);
    if (hitX) c.dead = true;
    if (c.onGround && fallV > 1) {
      c.bounces++;
      if (c.bounces > 2) c.dead = true;
      else c.vy = -fallV * 0.55;
    }
    if (c.age > 2.5 || c.y > g.level.h + 1) c.dead = true;
  }
  g.cobs = g.cobs.filter((c) => !c.dead);
}

function updateRays(g, dt) {
  for (const r of g.rays) {
    r.life -= dt;
    r.x += r.vx * dt;
    if (r.life <= 0 || solidAt(g, Math.floor(r.x + r.w / 2), Math.floor(r.y + r.h / 2))) r.dead = true;
    if (r.dead) continue;
    for (const e of g.enemies) {
      if (!e.alive || r.hitSet?.has(e) || !overlap(r, e)) continue;
      (r.hitSet ??= new Set()).add(e);
      damage(g, e, 1, 'ray');
      if (r.pierce-- <= 0 || e.kind === 'boss') {
        r.dead = true;
        break;
      }
    }
  }
  g.rays = g.rays.filter((r) => !r.dead);
}

function spawnShot(g, x, y, vx, vy, kind, gravity = 0) {
  g.shots.push({ kind, x: x - 0.18, y: y - 0.18, w: 0.36, h: 0.36, vx, vy, gravity, life: 3.5 });
}

function updateShots(g, dt) {
  for (const s of g.shots) {
    s.life -= dt;
    s.vy += s.gravity * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    if (s.life <= 0 || s.y > g.level.h + 1 || solidAt(g, Math.floor(s.x + s.w / 2), Math.floor(s.y + s.h / 2))) s.dead = true;
  }
  g.shots = g.shots.filter((s) => !s.dead);
}

function hitTile(g, tx, ty) {
  if (g.tiles[ty][tx] !== CRATE) return;
  g.tiles[ty][tx] = USED;
  g.version++;
  emit(g, 'barrel');
  let what = g.level.crates[`${tx},${ty}`];
  if (what === 'bees') what = 'swarm:bee';
  const p = g.player;
  const away = p.x + p.w / 2 < tx + 0.5 ? 1 : -1; // pop out away from Billy so he can chase it
  if (what === 'shine') {
    g.items.push({ kind: 'shine', x: tx + 0.1, y: ty - 0.8, w: 0.8, h: 0.8, dir: away, vx: 3, vy: -7, age: 0 });
  } else if (what.startsWith('gear:')) {
    g.items.push({ kind: 'gear', gear: what.slice(5), x: tx + 0.1, y: ty - 0.8, w: 0.8, h: 0.8, dir: away, vx: 3, vy: -8, age: 0 });
  } else if (what.startsWith('swarm:')) {
    const kind = what.slice(6);
    floatText(g, tx - 0.5, ty - 1.2, kind === 'bee' ? 'Bees!' : kind === 'bat' ? 'Bats!' : 'Drones!');
    emit(g, 'bees');
    for (let i = 0; i < 3; i++) spawnSwarm(g, kind, tx + 0.2 + i * 0.2, ty - 0.8 - i * 0.3);
  } else {
    g.items.push({ kind: 'jug', x: tx + 0.1, y: ty - 0.8, w: 0.8, h: 0.8, dir: away, vx: 4.5 * away, vy: -11, age: 0, bounce: 0 });
  }
  // Anything standing on the barrel gets knocked off
  for (const e of g.enemies) {
    if (e.alive && !ENEMY_KINDS[e.kind].fly && Math.abs(e.y + e.h - ty) < 0.15 && e.x + e.w > tx && e.x < tx + 1) kill(g, e, false);
  }
}

function updateEnemies(g, dt) {
  const p = g.player;
  const right = g.camX + g.viewW + 3;
  for (const e of g.enemies) {
    if (!e.alive) {
      e.squish += dt;
      continue;
    }
    if (!e.awake) {
      if (e.x < right) e.awake = true;
      else continue;
    }
    e.t += dt;
    if (e.hit > 0) e.hit -= dt;
    if (e.iframes > 0) e.iframes -= dt;
    const k = ENEMY_KINDS[e.kind];
    if (k.fly) {
      updateFlyer(g, e, dt, k);
      continue;
    }

    let speed = k.speed;
    let edgeTurn = k.edgeTurn;
    const dx = p.x - e.x;
    const near = g.mode === 'playing' && Math.abs(p.y - e.y) < 3;
    const toward = dx > 0 ? 1 : -1;
    switch (k.ai) {
      case 'chase':
        e.chasing = near && Math.abs(dx) < 9;
        if (e.chasing) {
          e.dir = toward;
          speed = 5.5;
          edgeTurn = false;
        }
        break;
      case 'charge':
        if (e.state === 'walk') {
          if (e.cd > 0) e.cd -= dt;
          else if (near && Math.abs(dx) < 6) {
            e.state = 'wind';
            e.stateT = k.wind;
            e.dir = toward;
          }
        } else if (e.state === 'wind') {
          speed = 0;
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'dash';
            e.stateT = 0.9;
          }
        } else if (e.state === 'dash') {
          speed = k.dash;
          edgeTurn = false;
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'rest';
            e.stateT = 1.2;
          }
        } else if (e.state === 'rest') {
          speed = 0;
          e.stateT -= dt;
          if (e.stateT <= 0) {
            e.state = 'walk';
            e.cd = 1.5;
          }
        }
        break;
      case 'hop':
        if (near && Math.abs(dx) < 8) e.dir = toward;
        e.hopT -= dt;
        if (e.onGround && e.hopT <= 0) {
          e.vy = -12;
          e.hopT = 1.1;
        }
        if (!e.onGround) edgeTurn = false;
        break;
      case 'shoot': // tentacle gunner: stands still, spits plasma
        e.dir = toward;
        e.shootT -= dt;
        e.warn = e.shootT < 0.4 && near && Math.abs(dx) < 10;
        if (e.shootT <= 0) {
          e.shootT = 2.2;
          if (near && Math.abs(dx) < 10) {
            spawnShot(g, e.x + e.w / 2, e.y + e.h * 0.4, toward * 7, 0, 'plasma');
            emit(g, 'enemyshot');
          }
        }
        break;
      case 'cast': // witch: lobs magic orbs
        e.dir = toward;
        e.shootT -= dt;
        e.warn = e.shootT < 0.4 && Math.abs(dx) < 11;
        if (e.shootT <= 0) {
          e.shootT = 2.6;
          if (Math.abs(dx) < 11) {
            spawnShot(g, e.x + e.w / 2, e.y + 0.2, clamp(dx * 0.8, -7, 7), -8, 'orb', 16);
            emit(g, 'enemyshot');
          }
        }
        break;
      case 'boss':
        updateBoss(g, e, dt, k);
        speed = e.hp <= k.hp / 2 ? 3.4 : k.speed;
        break;
      default:
        break;
    }

    e.vx = e.dir * speed;
    e.vy = Math.min(e.vy + C.gravity * dt, C.maxFall);
    const wasGround = e.onGround;
    const { hitX } = moveBody(g, e, dt);
    if (hitX) {
      if (e.state === 'dash') {
        e.state = 'rest';
        e.stateT = 1.2;
      }
      e.dir = -e.dir;
    } else if (edgeTurn && wasGround && e.onGround && speed > 0) {
      const frontX = Math.floor(e.dir > 0 ? e.x + e.w + 0.05 : e.x - 0.05);
      const footY = Math.floor(e.y + e.h + 0.1);
      if (!solidAt(g, frontX, footY)) e.dir = -e.dir;
    }
    if (e.y > g.level.h + 2) e.alive = false;
  }
  g.enemies = g.enemies.filter((e) => e.alive || e.squish < 0.5);
}

// The Witch Queen paces her arena and throws fans of orbs, faster once hurt.
function updateBoss(g, e, dt, k) {
  const p = g.player;
  const minX = e.ox - 6;
  const maxX = e.ox + 5;
  if (e.x < minX) e.dir = 1;
  else if (e.x + e.w > maxX) e.dir = -1;
  const enraged = e.hp <= k.hp / 2;
  e.shootT -= dt;
  e.warn = e.shootT < 0.4;
  if (e.shootT <= 0) {
    e.shootT = enraged ? 1.2 : 2;
    const toward = p.x > e.x ? 1 : -1;
    if (Math.abs(p.x - e.x) < 14) {
      for (const vy of [-2, -6, -10]) spawnShot(g, e.x + e.w / 2, e.y + 0.6, toward * (enraged ? 9 : 7.5), vy, 'orb', 12);
      emit(g, 'enemyshot');
    }
  }
}

function updateFlyer(g, e, dt, k) {
  const p = g.player;
  if (e.swarm) {
    e.life -= dt;
    if (e.life <= 0) {
      e.alive = false;
      e.squish = 1; // fades away with no fanfare
      return;
    }
    const tx = p.x + p.w / 2 - (e.x + e.w / 2);
    const ty = p.y + p.h / 2 - (e.y + e.h / 2);
    const d = Math.hypot(tx, ty) || 1;
    e.vx += (tx / d) * 16 * dt + Math.sin(e.t * 9 + e.phase) * 12 * dt;
    e.vy += (ty / d) * 16 * dt + Math.cos(e.t * 11 + e.phase) * 12 * dt;
    const sp = Math.hypot(e.vx, e.vy);
    if (sp > 3.2) {
      e.vx *= 3.2 / sp;
      e.vy *= 3.2 / sp;
    }
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.dir = e.vx >= 0 ? 1 : -1;
  } else {
    const amp = k.amp ?? 2.6;
    const nx = e.ox + Math.sin(e.t * 1.4 + e.phase) * amp;
    e.dir = nx >= e.x ? 1 : -1;
    e.x = nx;
    e.y = e.oy + Math.sin(e.t * 2.6 + e.phase) * 0.7;
    if (k.ai === 'ufo') {
      // fires a plasma bolt straight down when Billy walks underneath
      e.shootT -= dt;
      if (e.shootT <= 0 && Math.abs(p.x + p.w / 2 - (e.x + e.w / 2)) < 1.8 && p.y > e.y) {
        e.shootT = 2.2;
        spawnShot(g, e.x + e.w / 2, e.y + e.h, 0, 7, 'plasma');
        emit(g, 'enemyshot');
      } else if (e.shootT < -5) e.shootT = 0;
    }
  }
}

function updateItems(g, dt) {
  for (const it of g.items) {
    it.age += dt;
    it.vy = Math.min(it.vy + C.gravity * dt, C.maxFall);
    if (it.kind !== 'jug') it.vx = it.dir * 3;
    const fallV = it.vy;
    const vxBefore = it.vx;
    const { hitX } = moveBody(g, it, dt);
    if (it.kind !== 'jug') {
      if (hitX) it.dir = -it.dir;
    } else {
      if (hitX) it.vx = -vxBefore * 0.5;
      if (it.onGround && fallV > 1) {
        it.bounce++;
        if (it.bounce < 3) it.vy = -fallV * 0.45;
        it.vx *= 0.75;
      }
      if (it.onGround && it.bounce >= 3) it.vx = approach(it.vx, 0, 8 * dt);
    }
  }
  g.items = g.items.filter((it) => it.y < g.level.h + 2 && (it.kind !== 'jug' || it.age < JUG_LIFETIME));
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

const frontOf = (p, o) => (o.x + o.w / 2 - (p.x + p.w / 2)) * p.facing > -0.1;

function collide(g) {
  const p = g.player;

  g.items = g.items.filter((it) => {
    if (!overlap(p, it)) return true;
    if (it.kind === 'jug') {
      collectJug(g);
      floatText(g, it.x, it.y - 0.3, '+100');
      return false;
    }
    if (it.kind === 'gear') {
      equip(g, it.gear);
      g.score += 300;
      return false;
    }
    if (!p.big) {
      p.big = true;
      p.y -= BIG_H - SMALL_H;
      p.h = BIG_H;
    }
    g.score += 500;
    floatText(g, p.x, p.y - 0.5, 'Shine! +500');
    emit(g, 'powerup');
    return false;
  });

  // Corn cobs vs critters
  for (const c of g.cobs) {
    for (const e of g.enemies) {
      if (!e.alive || !overlap(c, e)) continue;
      c.dead = true;
      damage(g, e, 1, 'cob');
      break;
    }
  }
  g.cobs = g.cobs.filter((c) => !c.dead);

  // Enemy projectiles vs Billy
  for (const s of g.shots) {
    if (!overlap(p, s)) continue;
    s.dead = true;
    if (p.rush > 0) continue;
    if (p.shielding && frontOf(p, s)) {
      emit(g, 'block');
      floatText(g, s.x, s.y - 0.3, 'Clang!');
    } else if (p.invuln <= 0) {
      hurt(g);
      if (g.mode !== 'playing') return;
    }
  }
  g.shots = g.shots.filter((s) => !s.dead);

  let chain = 0;
  for (const e of g.enemies) {
    if (!e.alive || !overlap(p, e)) continue;
    const k = ENEMY_KINDS[e.kind];
    if (p.rush > 0) {
      // Rush makes Billy invincible: critters (even bees) get plowed through
      damage(g, e, 99, 'rush');
      continue;
    }
    const stomping = k.stomp && p.vy > 0 && p.y + p.h - e.y < 0.65;
    if (stomping) {
      if (e.iframes > 0) {
        p.vy = -C.stompBounce;
        continue;
      }
      chain++;
      p.vy = -(g.prevJump ? C.stompBounceHeld : C.stompBounce);
      g.score += 200 * chain;
      floatText(g, e.x, e.y - 0.5, `+${200 * chain}`);
      damage(g, e, 2, 'stomp');
    } else if (p.shielding && frontOf(p, e)) {
      // The shield stops it cold and shoves it back
      e.x += p.facing * 0.35;
      e.dir = p.facing;
      if (e.state === 'dash') {
        e.state = 'rest';
        e.stateT = 1.2;
      }
      emit(g, 'block');
    } else if (p.invuln <= 0) {
      hurt(g);
      if (g.mode !== 'playing') return;
    }
  }
}

// Applies damage to an enemy and handles the reward when it dies.
function damage(g, e, dmg, how) {
  if (!e.alive || e.iframes > 0) return;
  e.hp -= dmg;
  const k = ENEMY_KINDS[e.kind];
  if (e.kind === 'boss') e.iframes = 0.6;
  if (e.hp <= 0) {
    kill(g, e, how === 'stomp');
    if (how !== 'stomp') {
      g.score += k.score ?? 150;
      floatText(g, e.x, e.y - 0.5, `+${k.score ?? 150}`);
    }
    emit(g, 'stomp');
  } else {
    e.hit = 0.25;
    emit(g, 'hit');
  }
}

function kill(g, e, squished) {
  if (!e.alive) return;
  e.alive = false;
  e.squish = 0;
  e.squished = squished;
  const k = ENEMY_KINDS[e.kind];
  if (e.kind === 'boss') {
    g.bossDefeated = true;
    toast(g, 'The Witch Queen is defeated! The gate is open!');
  }
  if (k.ammo) {
    const n = k.ammo * (g.gear.antenna ? 2 : 1);
    g.ammo = Math.min(AMMO_MAX, g.ammo + n);
    floatText(g, e.x + 0.2, e.y - 0.9, `+${n} ⚡`);
    emit(g, 'ammo');
  }
}

export function hurt(g) {
  const p = g.player;
  if (p.rush > 0) return; // invincible while rushing
  if (p.armor > 0) {
    p.armor--;
    p.invuln = 1.2;
    emit(g, 'block');
    floatText(g, p.x - 0.3, p.y - 0.6, 'Armor!');
  } else if (p.big) {
    p.big = false;
    p.y += BIG_H - SMALL_H;
    p.h = SMALL_H;
    p.invuln = 1.6;
    emit(g, 'hurt');
    floatText(g, p.x - 0.4, p.y - 0.6, 'Dagnabbit!');
  } else {
    die(g);
  }
}

function die(g) {
  if (g.mode !== 'playing') return;
  g.mode = 'dying';
  g.deathT = 0;
  g.player.vx = 0;
  g.player.vy = 0;
  emit(g, 'die');
}

function stepDying(g, dt) {
  g.deathT += dt;
  const p = g.player;
  if (g.deathT > 0.4) {
    if (!p.dead) {
      p.dead = true;
      p.vy = -14;
    }
    p.vy += C.gravity * dt;
    p.y += p.vy * dt;
  }
  if (g.deathT > 1.8) {
    g.lives--;
    if (g.lives <= 0) {
      g.mode = 'gameover';
      emit(g, 'gameover');
    } else respawn(g);
  }
}

function win(g) {
  g.mode = 'won';
  g.score += 1000 + g.lives * 500 + (g.jugs - g.level.goalJugs) * 100;
  // Any of this level's gear that Billy missed is waiting in the loot chest
  g.loot = g.level.gearPool.map((name) => ({ name, found: !!g.gear[name] }));
  for (const name of g.level.gearPool) if (!g.gear[name]) equip(g, name);
  emit(g, 'win');
}

function updateEffects(g, dt) {
  for (const f of g.effects) f.t += dt;
  g.effects = g.effects.filter((f) => f.t < 0.9);
}

import { buildLevel, EMPTY, CRATE, USED, GROUND_Y } from './level.js';

export const STEP = 1 / 60;

export const SMALL_H = 0.95;
export const BIG_H = 1.4;
const PLAYER_W = 0.7;
const EPS = 1e-4;

const C = {
  gravity: 55,
  jumpV: 20.5,
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
};

const ENEMY_KINDS = {
  chicken: { speed: 2, w: 0.8, h: 0.8, edgeTurn: true },
  raccoon: { speed: 3.6, w: 0.85, h: 0.75, edgeTurn: false },
  skunk: { speed: 2.4, w: 0.85, h: 0.7, edgeTurn: true },
};

export function createGame({ enemies = true } = {}) {
  const level = buildLevel();
  const g = {
    level,
    tiles: level.tiles,
    coins: level.coins,
    enemiesEnabled: enemies,
    mode: 'playing', // playing | dying | gameover | won
    time: 0,
    deathT: 0,
    score: 0,
    jugs: 0,
    lives: 3,
    checkpoint: level.startX,
    checkpointHit: false,
    viewW: 20,
    camX: 0,
    version: 0, // bumped when the static tile layer changes
    enemies: [],
    items: [],
    effects: [],
    prevJump: false,
    player: null,
  };
  respawn(g);
  return g;
}

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
    invuln: 0,
    coyote: 0,
    buf: 0,
    jumping: false,
    run: 0,
  };
}

export function respawn(g) {
  g.player = newPlayer(g.checkpoint);
  g.mode = 'playing';
  g.deathT = 0;
  g.items = [];
  g.effects = [];
  g.prevJump = false;
  g.enemies = g.enemiesEnabled
    ? g.level.spawns.filter((s) => s.x >= g.checkpoint - 2).map((s) => makeEnemy(s))
    : [];
  g.camX = clamp(g.player.x - g.viewW * 0.3, 0, g.level.w - g.viewW);
}

function makeEnemy(s) {
  const k = ENEMY_KINDS[s.kind];
  return {
    kind: s.kind,
    x: s.x,
    y: GROUND_Y - k.h,
    w: k.w,
    h: k.h,
    vx: -k.speed,
    vy: 0,
    dir: -1,
    alive: true,
    squish: 0,
    awake: false,
  };
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

export function step(g, input, dt = STEP) {
  g.time += dt;
  if (g.mode === 'dying') return stepDying(g, dt);
  if (g.mode !== 'playing') return;

  updatePlayer(g, input, dt);
  updateEnemies(g, dt);
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
    else if (Math.abs(p.x - g.level.goalX) < 1.2 && p.onGround) win(g);
  }

  const target = clamp(p.x + p.w / 2 - g.viewW * 0.4, 0, g.level.w - g.viewW);
  g.camX += (target - g.camX) * Math.min(1, dt * 8);
}

function updatePlayer(g, input, dt) {
  const p = g.player;
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const jumpPressed = input.jump && !g.prevJump;
  g.prevJump = input.jump;

  if (dir) {
    p.facing = dir;
    const accel = p.onGround ? C.accelGround : C.accelAir;
    p.vx = approach(p.vx, dir * C.walk, accel * dt);
  } else {
    p.vx = approach(p.vx, 0, (p.onGround ? C.decel : C.accelAir * 0.4) * dt);
  }

  p.coyote = p.onGround ? C.coyote : Math.max(0, p.coyote - dt);
  p.buf = jumpPressed ? C.buffer : Math.max(0, p.buf - dt);
  if (p.buf > 0 && p.coyote > 0) {
    p.vy = -C.jumpV;
    p.buf = 0;
    p.coyote = 0;
    p.jumping = true;
    p.onGround = false;
  }

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
      g.jugs++;
      g.score += 100;
    }
  }
}

function hitTile(g, tx, ty) {
  if (g.tiles[ty][tx] !== CRATE) return;
  g.tiles[ty][tx] = USED;
  g.version++;
  const what = g.level.crates[`${tx},${ty}`];
  if (what === 'shine') {
    g.items.push({ kind: 'shine', x: tx + 0.1, y: ty - 0.8, w: 0.8, h: 0.8, dir: 1, vx: 3, vy: -7 });
  } else {
    g.jugs++;
    g.score += 100;
    g.effects.push({ kind: 'jug', x: tx, y: ty - 1, t: 0 });
  }
  // Anything standing on the crate gets knocked off
  for (const e of g.enemies) {
    if (e.alive && Math.abs(e.y + e.h - ty) < 0.15 && e.x + e.w > tx && e.x < tx + 1) kill(g, e, false);
  }
}

function updateEnemies(g, dt) {
  const left = g.camX - 2;
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
    const k = ENEMY_KINDS[e.kind];
    e.vx = e.dir * k.speed;
    e.vy = Math.min(e.vy + C.gravity * dt, C.maxFall);
    const wasGround = e.onGround;
    const { hitX } = moveBody(g, e, dt);
    if (hitX) {
      e.dir = -e.dir;
    } else if (k.edgeTurn && wasGround && e.onGround) {
      const frontX = Math.floor(e.dir > 0 ? e.x + e.w + 0.05 : e.x - 0.05);
      const footY = Math.floor(e.y + e.h + 0.1);
      if (!solidAt(g, frontX, footY)) e.dir = -e.dir;
    }
    if (e.y > g.level.h + 2 || e.x < left - 30) e.alive = false;
  }
  g.enemies = g.enemies.filter((e) => e.alive || e.squish < 0.5);
}

function updateItems(g, dt) {
  for (const it of g.items) {
    it.vx = it.dir * 3;
    it.vy = Math.min(it.vy + C.gravity * dt, C.maxFall);
    const { hitX } = moveBody(g, it, dt);
    if (hitX) it.dir = -it.dir;
  }
  g.items = g.items.filter((it) => it.y < g.level.h + 2);
}

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function collide(g) {
  const p = g.player;

  g.items = g.items.filter((it) => {
    if (!overlap(p, it)) return true;
    if (!p.big) {
      p.big = true;
      p.y -= BIG_H - SMALL_H;
      p.h = BIG_H;
    }
    g.score += 500;
    floatText(g, p.x, p.y - 0.5, 'Shine! +500');
    return false;
  });

  let chain = 0;
  for (const e of g.enemies) {
    if (!e.alive || !overlap(p, e)) continue;
    const stomping = p.vy > 0 && p.y + p.h - e.y < 0.65;
    if (stomping) {
      kill(g, e, true);
      chain++;
      p.vy = -(g.prevJump ? C.stompBounceHeld : C.stompBounce);
      g.score += 200 * chain;
      floatText(g, e.x, e.y - 0.5, `+${200 * chain}`);
    } else if (p.invuln <= 0) {
      hurt(g);
      if (g.mode !== 'playing') return;
    }
  }
}

function kill(g, e, squished) {
  e.alive = false;
  e.squish = 0;
  e.squished = squished;
}

export function hurt(g) {
  const p = g.player;
  if (p.big) {
    p.big = false;
    p.y += BIG_H - SMALL_H;
    p.h = SMALL_H;
    p.invuln = 1.6;
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
    if (g.lives <= 0) g.mode = 'gameover';
    else respawn(g);
  }
}

function win(g) {
  g.mode = 'won';
  g.score += 1000 + g.lives * 500;
}

function updateEffects(g, dt) {
  for (const f of g.effects) f.t += dt;
  g.effects = g.effects.filter((f) => f.t < 0.9);
}

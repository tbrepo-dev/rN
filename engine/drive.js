// Top-down driving: pickups, tractors and trash trucks, carjacking, hillbilly traffic, and cops.
// Pure game logic. The UI reads `g.drive`; game.js owns lives, scenes and the platformer.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angDiff = (a, b) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
};

export const VEHICLES = {
  pickup: { name: 'Pickup', len: 2.6, wid: 1.3, max: 13, accel: 9, turn: 2.5, mass: 1, hp: 100, ram: 1 },
  tractor: { name: 'Tractor', len: 2.4, wid: 1.7, max: 6.5, accel: 4.5, turn: 1.9, mass: 1.7, hp: 170, ram: 1.4 },
  trash: { name: 'Trash truck', len: 3.8, wid: 1.8, max: 9.5, accel: 5.5, turn: 1.6, mass: 2.5, hp: 240, ram: 1.9 },
  cop: { name: 'Cop car', len: 2.7, wid: 1.35, max: 10.5, accel: 8, turn: 2.3, mass: 1.0, hp: 90, ram: 0.7 },
};
export const FOOT_SPEED = 3.6;
export const MAX_STARS = 3;
const BUST_TIME = 2.6; // seconds a cop has to sit on you
const COP_GIVE_UP = 5; // seconds of being left far behind before a cop gives up

const HINT_DIRS = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
const SHOUTS = ['YEEHAW!', 'WATCH IT, CLETUS!', 'MY TRUCK!', 'DANG IT!', 'HEY NOW!', 'THAT AIN\'T YOURS!'];

// ---------------------------------------------------------------------------
// World queries
export function surfaceAt(L, x, y) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= L.w || gy >= L.h) return 0;
  return L.grid[gy * L.w + gx];
}

export function isBlocked(L, x, y) {
  const gx = Math.floor(x);
  const gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= L.w || gy >= L.h) return true;
  return L.solid[gy * L.w + gx] !== 0;
}

function rnd(D) {
  D.seed = (D.seed * 1664525 + 1013904223) % 4294967296;
  return D.seed / 4294967296;
}

// A circle pushed out of an axis-aligned rectangle; returns the contact or null
function circleVsRect(c, r) {
  const nx = clamp(c.x, r.x, r.x + r.w);
  const ny = clamp(c.y, r.y, r.y + r.h);
  const dx = c.x - nx;
  const dy = c.y - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= c.r * c.r) return null;
  if (d2 === 0) {
    // centre is inside: leave by the nearest edge
    const left = c.x - r.x;
    const right = r.x + r.w - c.x;
    const top = c.y - r.y;
    const bottom = r.y + r.h - c.y;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { nx: -1, ny: 0, pen: left + c.r };
    if (m === right) return { nx: 1, ny: 0, pen: right + c.r };
    if (m === top) return { nx: 0, ny: -1, pen: top + c.r };
    return { nx: 0, ny: 1, pen: bottom + c.r };
  }
  const d = Math.sqrt(d2);
  return { nx: dx / d, ny: dy / d, pen: c.r - d };
}

// Everything solid and static is bucketed into 12x12 cells so the big map stays fast
function indexFor(L) {
  if (L._idx) return L._idx;
  const cs = 12;
  const cols = Math.ceil(L.w / cs);
  const rows = Math.ceil(L.h / cs);
  const cb = Array.from({ length: cols * rows }, () => []);
  const ct = Array.from({ length: cols * rows }, () => []);
  const addRect = (r) => {
    for (let cy = Math.floor(r.y / cs); cy <= Math.floor((r.y + r.h) / cs); cy++)
      for (let cx = Math.floor(r.x / cs); cx <= Math.floor((r.x + r.w) / cs); cx++) if (cx >= 0 && cy >= 0 && cx < cols && cy < rows) cb[cy * cols + cx].push(r);
  };
  L.buildings.forEach(addRect);
  L.ponds.forEach(addRect);
  L.trees.forEach((t) => {
    const cx = clamp(Math.floor(t.x / cs), 0, cols - 1);
    const cy = clamp(Math.floor(t.y / cs), 0, rows - 1);
    ct[cy * cols + cx].push(t);
  });
  L._idx = { cs, cols, rows, cb, ct, stamp: 0 };
  return L._idx;
}

function staticContacts(L, c) {
  const I = indexFor(L);
  const out = [];
  const reach = c.r + 0.7;
  const x0 = clamp(Math.floor((c.x - reach) / I.cs), 0, I.cols - 1);
  const x1 = clamp(Math.floor((c.x + reach) / I.cs), 0, I.cols - 1);
  const y0 = clamp(Math.floor((c.y - reach) / I.cs), 0, I.rows - 1);
  const y1 = clamp(Math.floor((c.y + reach) / I.cs), 0, I.rows - 1);
  I.stamp++;
  for (let cy = y0; cy <= y1; cy++) {
    for (let cx = x0; cx <= x1; cx++) {
      for (const r of I.cb[cy * I.cols + cx]) {
        if (r._s === I.stamp) continue;
        r._s = I.stamp;
        const hit = circleVsRect(c, r);
        if (hit) out.push(hit);
      }
      for (const t of I.ct[cy * I.cols + cx]) {
        const dx = c.x - t.x;
        const dy = c.y - t.y;
        const rr = c.r + 0.45;
        if (Math.abs(dx) > rr || Math.abs(dy) > rr) continue;
        const dd = Math.hypot(dx, dy);
        if (dd < rr) out.push(dd === 0 ? { nx: 1, ny: 0, pen: rr } : { nx: dx / dd, ny: dy / dd, pen: rr - dd });
      }
    }
  }
  // the edge of the map
  if (c.x < c.r + 1) out.push({ nx: 1, ny: 0, pen: c.r + 1 - c.x });
  if (c.x > L.w - c.r - 1) out.push({ nx: -1, ny: 0, pen: c.x - (L.w - c.r - 1) });
  if (c.y < c.r + 1) out.push({ nx: 0, ny: 1, pen: c.r + 1 - c.y });
  if (c.y > L.h - c.r - 1) out.push({ nx: 0, ny: -1, pen: c.y - (L.h - c.r - 1) });
  return out;
}

function circlesOf(v) {
  const s = VEHICLES[v.type];
  const r = s.wid / 2 + 0.05;
  const off = Math.max(0, s.len / 2 - r);
  const c = Math.cos(v.h);
  const sn = Math.sin(v.h);
  return [
    { x: v.x + c * off, y: v.y + sn * off, r },
    { x: v.x - c * off, y: v.y - sn * off, r },
  ];
}

export const speedOf = (v) => Math.hypot(v.vx, v.vy);

// ---------------------------------------------------------------------------
// Setup
let nextId = 1;
function addVehicle(D, type, x, y, h, opts = {}) {
  const s = VEHICLES[type];
  const v = {
    id: nextId++,
    type,
    x,
    y,
    h,
    vx: 0,
    vy: 0,
    hp: s.hp,
    maxHp: s.hp,
    color: opts.color || '#b5472a',
    driver: opts.driver || null, // null (empty) | 'player' | 'civ' | 'cop' (chasing) | 'patrol' (cruising)
    wreck: false,
    burn: 0,
    route: opts.route || null,
    wp: opts.wp || 0,
    inp: { steer: 0, gas: false, brake: false },
    stuck: 0,
    reverseT: 0,
    hornT: 0,
    panic: 0,
    lastHitBy: null,
    cruise: s.max * (0.38 + (opts.jitter || 0) * 0.12),
  };
  D.vehicles.push(v);
  return v;
}

function addPed(D, x, y) {
  const p = { id: nextId++, x, y, h: 0, home: { x, y }, state: 'wander', t: Math.random() * 0, stun: 0, vx: 0, vy: 0, walkT: 0, dir: 0 };
  D.peds.push(p);
  return p;
}

export function createDrive(L, { traffic = true, cops = true, respawn = null } = {}) {
  const D = {
    time: 0,
    seed: 4242,
    vehicles: [],
    peds: [],
    pickups: L.pickups.map((p) => ({ ...p, taken: false })),
    effects: [],
    heat: 0,
    copsEnabled: cops,
    copSpawnT: 2,
    randCopT: 18,
    drunk: 0, // seconds of invincible drunk driving left
    alert: 0,
    bust: 0,
    found: false,
    stage: respawn?.stage ?? 0, // how far along the treasure hunt for Big Al's you are
    clueCd: 0,
    fakeCd: 0,
    prompt: null,
    hint: null,
    crimeCd: 0,
    honkCd: 0,
    crashCd: 0,
    prevAction: false,
    respawnAt: respawn,
    cam: { x: 0, y: 0 },
  };
  const start = respawn || L.spawn;
  D.player = { x: start.x, y: start.y, h: 0, vx: 0, vy: 0, vehicle: null, r: 0.35, invuln: 0 };
  for (const p of L.parked) addVehicle(D, p.type, p.x, p.y, p.h, { color: p.color });
  if (respawn) {
    // a pickup waiting nearby, on open ground
    const spot = [[3, 0], [-3, 0], [0, 3], [0, -3], [4, 4], [-4, -4]].map(([dx, dy]) => ({ x: respawn.x + dx, y: respawn.y + dy })).find((s) => !isBlocked(L, s.x, s.y) && !isBlocked(L, s.x + 1.5, s.y) && !isBlocked(L, s.x - 1.5, s.y));
    if (spot) addVehicle(D, 'pickup', spot.x, spot.y, 0, { color: '#b5472a' });
  } else {
    D.hint = { text: L.startNote, t: 10 };
  }
  if (traffic) {
    L.traffic.forEach((t, i) => {
      const a = t.route[t.start % t.route.length];
      const b = t.route[(t.start + 1) % t.route.length];
      addVehicle(D, t.type, a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x), { color: t.color, driver: 'civ', route: t.route, wp: (t.start + 1) % t.route.length, jitter: (i % 3) / 3 });
    });
  }
  if (traffic) {
    for (const p of L.patrols || []) {
      const a = p.route[p.start % p.route.length];
      const b = p.route[(p.start + 1) % p.route.length];
      addVehicle(D, 'cop', a.x, a.y, Math.atan2(b.y - a.y, b.x - a.x), { driver: 'patrol', color: '#f2f4f8', route: p.route, wp: (p.start + 1) % p.route.length });
    }
  }
  L.peds.forEach((p) => addPed(D, p.x, p.y));
  D.cam = { x: start.x, y: start.y };
  return D;
}

export const playerVehicle = (D) => (D.player.vehicle ? D.vehicles.find((v) => v.id === D.player.vehicle) : null);

// ---------------------------------------------------------------------------
// Effects
function fx(D, x, y, text) {
  D.effects.push({ kind: 'text', x, y, text, t: 0 });
}
function boom(D, x, y, size = 1) {
  D.effects.push({ kind: 'boom', x, y, size, t: 0 });
}
function spark(D, x, y) {
  D.effects.push({ kind: 'spark', x, y, t: 0 });
}

function addHeat(D, amount) {
  D.heat = Math.min(MAX_STARS + 0.99, D.heat + amount);
}
export const stars = (D) => Math.floor(D.heat);

// ---------------------------------------------------------------------------
// Vehicle physics
function physics(L, v, dt) {
  const s = VEHICLES[v.type];
  const surf = surfaceAt(L, v.x, v.y);
  const mult = surf === 1 ? 1 : surf === 2 ? 0.9 : surf === 3 ? 0.55 : 0.7;
  const boost = v.boost || 1;
  const c = Math.cos(v.h);
  const sn = Math.sin(v.h);
  let fwd = v.vx * c + v.vy * sn;
  let lat = -v.vx * sn + v.vy * c;
  const maxF = s.max * mult * boost;
  const inp = v.inp;
  if (inp.gas) fwd = fwd < maxF ? Math.min(maxF, fwd + s.accel * dt) : fwd;
  if (inp.brake) {
    // the brake stops you, going either way
    if (fwd > 0) fwd = Math.max(0, fwd - s.accel * 2 * dt);
    else fwd = Math.min(0, fwd + s.accel * 2 * dt);
  }
  if (inp.reverse) {
    // reverse gear: brakes hard if you're still rolling forward, then backs up
    if (fwd > 0.3) fwd = Math.max(0, fwd - s.accel * 2.2 * dt);
    else fwd = Math.max(-maxF * 0.55, fwd - s.accel * 0.9 * dt);
  }
  if (!inp.gas && !inp.brake && !inp.reverse) fwd *= Math.exp(-0.7 * dt);
  if (fwd > maxF) fwd = Math.max(maxF, fwd - 9 * dt); // bog down in the rough
  lat *= Math.exp(-7 * dt);
  const turn = inp.steer * s.turn * clamp(Math.abs(fwd) / 3, 0, 1) * (fwd >= 0 ? 1 : -1);
  v.h += turn * dt;
  const c2 = Math.cos(v.h);
  const s2 = Math.sin(v.h);
  v.vx = fwd * c2 - lat * s2;
  v.vy = fwd * s2 + lat * c2;
  v.x += v.vx * dt;
  v.y += v.vy * dt;
}

function bounce(v, nx, ny, e = 0.25) {
  const vn = v.vx * nx + v.vy * ny;
  if (vn >= 0) return 0;
  v.vx -= (1 + e) * vn * nx;
  v.vy -= (1 + e) * vn * ny;
  return -vn;
}

// ---------------------------------------------------------------------------
// Damage, explosions, ejections
function damageVehicle(g, api, v, dmg, src) {
  if (v.wreck || dmg <= 0) return;
  const D = g.drive;
  if (v.driver === 'player' && D.drunk > 0) return; // drunk and untouchable
  v.hp -= dmg;
  if (src) v.lastHitBy = src;
  if (v.hp <= 0) explode(g, api, v);
}

function sideSpot(L, v, preferRight = true) {
  const s = VEHICLES[v.type];
  const off = s.wid / 2 + 0.9;
  const nx = -Math.sin(v.h);
  const ny = Math.cos(v.h);
  const dirs = preferRight ? [1, -1] : [-1, 1];
  for (const d of dirs) {
    const x = v.x + nx * off * d;
    const y = v.y + ny * off * d;
    if (!isBlocked(L, x, y)) return { x, y };
  }
  return { x: v.x + Math.cos(v.h) * (s.len / 2 + 1), y: v.y + Math.sin(v.h) * (s.len / 2 + 1) };
}

function ejectDriver(g, v, shout = true) {
  const D = g.drive;
  const L = g.level;
  const spot = sideSpot(L, v, false);
  const ped = addPed(D, spot.x, spot.y);
  ped.state = 'flee';
  ped.t = 6;
  if (shout) fx(D, spot.x, spot.y - 1, SHOUTS[Math.floor(rnd(D) * SHOUTS.length)]);
  v.driver = null;
  return ped;
}

function explode(g, api, v) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  v.wreck = true;
  v.burn = 9;
  v.hp = 0;
  const wasPlayer = v.driver === 'player';
  const wasCiv = v.driver === 'civ';
  const wasCop = v.driver === 'cop' || v.driver === 'patrol';
  boom(D, v.x, v.y, 1.6);
  api.emit('boom');
  if (wasPlayer) {
    P.vehicle = null;
    const spot = sideSpot(L, v, true);
    P.x = spot.x;
    P.y = spot.y;
    P.vx = P.vy = 0;
    api.toast('Your ride blew up!');
    // the blast costs armor (or your size), but losing the ride alone never kills you
    if (g.player.armor > 0 || g.player.big) hurtPlayer(g, api);
  } else if (wasCiv) ejectDriver(g, v, true);
  v.driver = null;
  // the blast hurts and shoves whatever is close
  for (const o of D.vehicles) {
    if (o === v || o.wreck) continue;
    const d = dist(o, v);
    if (d < 4) {
      damageVehicle(g, api, o, 28 * (1 - d / 4), v.lastHitBy);
      const nx = (o.x - v.x) / (d || 1);
      const ny = (o.y - v.y) / (d || 1);
      o.vx += nx * 4;
      o.vy += ny * 4;
    }
  }
  for (const p of D.peds) if (dist(p, v) < 3.2) knockPed(D, p, v.x, v.y);
  if (!P.vehicle && dist(P, v) < 2.8 && P.invuln <= 0 && !wasPlayer) hurtPlayer(g, api);
  // who gets the credit?
  if (v.lastHitBy === 'player') {
    if (wasCiv) {
      g.score += 500;
      addHeat(D, 1);
      fx(D, v.x, v.y - 1.5, 'WRECKED! +500');
    } else if (wasCop) {
      g.score += 800;
      addHeat(D, 1.5);
      fx(D, v.x, v.y - 1.5, 'COP CAR DOWN! +800');
    } else {
      g.score += 100;
    }
  }
}

function hurtPlayer(g, api) {
  const P = g.drive.player;
  if (P.invuln > 0 || g.drive.drunk > 0) return;
  P.invuln = 1.4;
  api.hurt();
}

function knockPed(D, p, fromX, fromY) {
  const d = Math.hypot(p.x - fromX, p.y - fromY) || 1;
  p.state = 'stun';
  p.stun = 1.8;
  p.vx = ((p.x - fromX) / d) * 5;
  p.vy = ((p.y - fromY) / d) * 5;
}

// ---------------------------------------------------------------------------
// AI
function steerTo(v, tx, ty, gain = 2.4) {
  const want = Math.atan2(ty - v.y, tx - v.x);
  return clamp(angDiff(v.h, want) * gain, -1, 1);
}

// Is something solid or on four wheels in the way, a few tiles ahead?
function blockedAhead(D, L, v, reach = 4.5) {
  const c = Math.cos(v.h);
  const s = Math.sin(v.h);
  for (const d of [2.4, reach]) {
    const px = v.x + c * d;
    const py = v.y + s * d;
    if (isBlocked(L, px, py)) return true;
    for (const o of D.vehicles) if (o !== v && !o.wreck && Math.hypot(o.x - px, o.y - py) < 1.5) return true;
    if (!D.player.vehicle && Math.hypot(D.player.x - px, D.player.y - py) < 1.2) return true;
  }
  return false;
}

function aiCivilian(g, v, dt) {
  const D = g.drive;
  const L = g.level;
  const s = VEHICLES[v.type];
  v.hornT = Math.max(0, v.hornT - dt);
  v.panic = Math.max(0, v.panic - dt);
  const wp = v.route[v.wp];
  if (Math.hypot(wp.x - v.x, wp.y - v.y) < 3.2) {
    v.wp = (v.wp + 1) % v.route.length;
  }
  const target = v.route[v.wp];
  let steer = steerTo(v, target.x, target.y);
  const spd = speedOf(v);
  const cruise = v.panic > 0 ? s.max * 0.8 : v.cruise;
  let gas = spd < cruise;
  let brake = false;
  if (v.reverseT > 0) {
    v.reverseT -= dt;
    return { steer: -steer, gas: false, brake: false, reverse: true };
  }
  if (blockedAhead(D, L, v)) {
    gas = false;
    brake = spd > 1;
    if (v.hornT <= 0 && D.honkCd <= 0) {
      v.hornT = 2.5;
      D.honkCd = 0.8;
      g.events.push('honk');
      if (dist(v, D.player) < 12) fx(D, v.x, v.y - 1.5, SHOUTS[Math.floor(rnd(D) * SHOUTS.length)]);
    }
  }
  // wedged against something? back up and try again
  if (spd < 0.3 && (gas || brake)) v.stuck += dt;
  else v.stuck = 0;
  if (v.stuck > 1.8) {
    v.stuck = 0;
    v.reverseT = 1.0;
  }
  return { steer, gas, brake };
}

// --- cops follow the roads to you (a breadth-first distance field from the road nearest Billy)
function nearestRoadTile(L, x, y, maxR = 16) {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  let best = -1;
  let bestD = Infinity;
  for (let r = 0; r <= maxR; r++) {
    for (let ty = cy - r; ty <= cy + r; ty++) {
      for (let tx = cx - r; tx <= cx + r; tx++) {
        if (Math.max(Math.abs(tx - cx), Math.abs(ty - cy)) !== r) continue;
        if (tx < 0 || ty < 0 || tx >= L.w || ty >= L.h) continue;
        if (L.grid[ty * L.w + tx] !== 1) continue;
        const dd = (tx - x) ** 2 + (ty - y) ** 2;
        if (dd < bestD) {
          bestD = dd;
          best = ty * L.w + tx;
        }
      }
    }
    if (best >= 0 && r > Math.sqrt(bestD) + 1) break;
  }
  return best;
}

function computeField(L, D, sx, sy) {
  const dist = D.fieldDist || (D.fieldDist = new Int16Array(L.w * L.h));
  dist.fill(-1);
  const start = nearestRoadTile(L, sx, sy);
  D.fieldAt = D.time;
  if (start < 0) return;
  const queue = D.fieldQueue || (D.fieldQueue = new Int32Array(L.w * L.h));
  let head = 0;
  let tail = 0;
  dist[start] = 0;
  queue[tail++] = start;
  while (head < tail) {
    const idx = queue[head++];
    const x = idx % L.w;
    const y = (idx / L.w) | 0;
    const nd = dist[idx] + 1;
    if (x > 0 && L.grid[idx - 1] === 1 && dist[idx - 1] < 0) (dist[idx - 1] = nd), (queue[tail++] = idx - 1);
    if (x < L.w - 1 && L.grid[idx + 1] === 1 && dist[idx + 1] < 0) (dist[idx + 1] = nd), (queue[tail++] = idx + 1);
    if (y > 0 && L.grid[idx - L.w] === 1 && dist[idx - L.w] < 0) (dist[idx - L.w] = nd), (queue[tail++] = idx - L.w);
    if (y < L.h - 1 && L.grid[idx + L.w] === 1 && dist[idx + L.w] < 0) (dist[idx + L.w] = nd), (queue[tail++] = idx + L.w);
  }
}

function clearLine(L, x0, y0, x1, y1) {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.7);
  for (let i = 1; i < n; i++) {
    const t = i / n;
    if (isBlocked(L, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}

// where should this cop head right now?
function copTarget(g, v) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  if (dist(v, P) < 20 && clearLine(L, v.x, v.y, P.x, P.y)) return { x: P.x, y: P.y };
  if (!D.fieldDist || D.time - D.fieldAt > 0.7) computeField(L, D, P.x, P.y);
  let idx = Math.floor(v.y) * L.w + Math.floor(v.x);
  if (L.grid[idx] !== 1) idx = nearestRoadTile(L, v.x, v.y);
  if (idx < 0 || D.fieldDist[idx] < 0) return { x: P.x, y: P.y };
  let cur = idx;
  for (let k = 0; k < 6; k++) {
    let best = cur;
    let bestD = D.fieldDist[cur];
    const cx = cur % L.w;
    const cy = (cur / L.w) | 0;
    for (let oy = -1; oy <= 1; oy++) {
      for (let ox = -1; ox <= 1; ox++) {
        const nx = cx + ox;
        const ny = cy + oy;
        if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
        const ni = ny * L.w + nx;
        if (D.fieldDist[ni] >= 0 && D.fieldDist[ni] < bestD) {
          best = ni;
          bestD = D.fieldDist[ni];
        }
      }
    }
    if (best === cur) break;
    cur = best;
  }
  return { x: (cur % L.w) + 0.5, y: ((cur / L.w) | 0) + 0.5 };
}

function aiCop(g, v, dt) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  const spd = speedOf(v);
  if (v.reverseT > 0) {
    v.reverseT -= dt;
    return { steer: -1, gas: false, brake: false, reverse: true };
  }
  const tgt = copTarget(g, v);
  const steer = steerTo(v, tgt.x, tgt.y, 2.6);
  const d = dist(v, P);
  let gas = true;
  const turnAmt = Math.abs(angDiff(v.h, Math.atan2(tgt.y - v.y, tgt.x - v.x)));
  if (turnAmt > 1.1 && spd > 4) gas = false; // overshot: let him come round
  if (turnAmt > 0.5 && spd > 8) gas = false; // lift off for the corner
  if (spd < 0.3 && gas) v.stuck += dt;
  else v.stuck = 0;
  if (v.stuck > 1.2) {
    v.stuck = 0;
    v.reverseT = 0.9;
  }
  // don't plough straight into a building
  const ahead = isBlocked(L, v.x + Math.cos(v.h) * 3, v.y + Math.sin(v.h) * 3);
  const far = isBlocked(L, v.x + Math.cos(v.h) * 6.5, v.y + Math.sin(v.h) * 6.5);
  if (ahead) return { steer: steer >= 0 ? 1 : -1, gas: false, brake: spd > 4 };
  return { steer, gas: gas && !(far && spd > 7), brake: far && spd > 9 };
}

function updatePed(g, p, dt) {
  const D = g.drive;
  const L = g.level;
  p.t = Math.max(0, p.t - dt);
  if (p.state === 'stun') {
    p.stun -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.exp(-4 * dt);
    p.vy *= Math.exp(-4 * dt);
    if (p.stun <= 0) {
      p.state = 'flee';
      p.t = 4;
    }
    return;
  }
  // run from anything fast and close
  let threat = null;
  for (const v of D.vehicles) {
    if (v.wreck) continue;
    const d = dist(v, p);
    if (d < 7 && speedOf(v) > 3) {
      threat = v;
      break;
    }
  }
  if (threat) {
    p.state = 'flee';
    p.t = 2;
  }
  let sx = 0;
  let sy = 0;
  if (p.state === 'flee') {
    if (threat) {
      const d = dist(threat, p) || 1;
      sx = (p.x - threat.x) / d;
      sy = (p.y - threat.y) / d;
    } else {
      sx = Math.cos(p.dir);
      sy = Math.sin(p.dir);
    }
    if (!threat && p.t <= 0) p.state = 'wander';
    sx *= 3.6;
    sy *= 3.6;
  } else {
    p.walkT -= dt;
    if (p.walkT <= 0) {
      p.walkT = 1 + rnd(D) * 2.5;
      p.dir = rnd(D) < 0.35 ? -1 : rnd(D) * TAU; // -1 = stand around
    }
    if (p.dir >= 0) {
      sx = Math.cos(p.dir) * 1.2;
      sy = Math.sin(p.dir) * 1.2;
      if (Math.hypot(p.x - p.home.x, p.y - p.home.y) > 4) p.dir = Math.atan2(p.home.y - p.y, p.home.x - p.x);
    }
  }
  const nx = p.x + sx * dt;
  const ny = p.y + sy * dt;
  if (!isBlocked(L, nx, p.y)) p.x = nx;
  else p.dir = rnd(D) * TAU;
  if (!isBlocked(L, p.x, ny)) p.y = ny;
  else p.dir = rnd(D) * TAU;
  if (sx || sy) p.h = Math.atan2(sy, sx);
}

// ---------------------------------------------------------------------------
// Cops and the wanted level
function spawnCop(g) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  const spots = L.roadPoints.filter((r) => {
    const d = Math.hypot(r.x - P.x, r.y - P.y);
    return d > 36 && d < 56;
  });
  const pool = spots.length ? spots : L.roadPoints;
  const r = pool[Math.floor(rnd(D) * pool.length)];
  const v = addVehicle(D, 'cop', r.x, r.y, Math.atan2(P.y - r.y, P.x - r.x), { driver: 'cop', color: '#f2f4f8' });
  g.events.push('siren');
  return v;
}

// Patrol cops chase when you're wanted, speeding nearby, or just caused a scene
function alertPatrols(g, api) {
  const D = g.drive;
  const P = D.player;
  const pv = playerVehicle(D);
  const spd = pv ? speedOf(pv) : 0;
  for (const v of D.vehicles) {
    if (v.driver !== 'patrol' || v.wreck) continue;
    const d = dist(v, P);
    const wanted = stars(D) > 0 && d < 70;
    const speeding = spd > 10.5 && d < 22;
    const saw = (D.alert > 0 || v.panic > 0) && d < 35;
    if (!(wanted || speeding || saw)) continue;
    v.driver = 'cop';
    v.route = null;
    g.events.push('siren');
    if (stars(D) === 0) {
      addHeat(D, 1.1);
      api.toast(speeding ? 'Speeding! A cop is after you!' : 'A cop saw that! Lose him!');
    }
  }
}

function updateCops(g, api, dt) {
  const D = g.drive;
  const P = D.player;
  D.alert = Math.max(0, D.alert - dt);
  alertPatrols(g, api);
  const cops = D.vehicles.filter((v) => v.driver === 'cop' && !v.wreck);
  const want = D.copsEnabled && stars(D) > 0 ? Math.min(3, stars(D)) : 0; // one cop per star
  D.copSpawnT -= dt;
  if (cops.length < want && D.copSpawnT <= 0) {
    spawnCop(g);
    D.copSpawnT = 4.5;
  }
  // every so often a cop just decides to chase you
  D.randCopT -= dt;
  if (D.randCopT <= 0) {
    D.randCopT = 30 + rnd(D) * 25;
    if (D.copsEnabled && stars(D) === 0 && cops.length === 0) {
      addHeat(D, 1.1);
      spawnCop(g);
      api.toast('A cop spotted you! Lose him!');
    }
  }
  // the heat dies down when no cop is near
  const near = cops.some((c) => dist(c, P) < 22);
  D.heat = Math.max(0, D.heat - (near ? 0.04 : 0.4) * dt); // lose them and the heat drops fast
  // far-off cops go home
  // a cop left far behind gives up and goes home
  for (const c of cops) {
    c.lostT = dist(c, P) > 42 ? (c.lostT || 0) + dt : Math.max(0, (c.lostT || 0) - 2 * dt);
    if (c.lostT > COP_GIVE_UP || dist(c, P) > 90) {
      c.wreck = true;
      c.burn = 0;
      c.hp = 0;
    }
  }
  // busted: a cop right on top of you while you're not going anywhere
  const pv = playerVehicle(D);
  const slow = pv ? speedOf(pv) < 2.5 : true;
  const caught = cops.some((c) => dist(c, P) < 2.3);
  if (caught && slow && D.drunk <= 0) D.bust += dt;
  else D.bust = Math.max(0, D.bust - 1.5 * dt);
  if (D.bust >= BUST_TIME) {
    D.bust = 0;
    fx(D, P.x, P.y - 2, 'BUSTED!');
    api.toast('BUSTED!');
    api.die();
  }
}

function compass(from, to) {
  const ang = (Math.atan2(to.y - from.y, to.x - from.x) + TAU) % TAU;
  return HINT_DIRS[Math.round(ang / (TAU / 8)) % 8];
}

// What the farmer you just carjacked tells you, depending on how far along the hunt you are.
// Some of them don't know anything at all.
function hintText(D, L, P) {
  if (rnd(D) < 0.25) {
    const dud = ["Big Al's? Never heard of him. Ask somebody else!", "I'm just trying to get to church, buddy.", "Big Al's... was that the one that burned down? Or the other one?", "Hmm. Sounds familiar. Nope."];
    return dud[Math.floor(rnd(D) * dud.length)];
  }
  const s = D.stage;
  if (s < L.clues.length) {
    const c = L.clues[s];
    const where = s === 0 ? 'Honky Tonk, over in Buckeye Junction' : s === 1 ? "Pete's junkyard" : 'big dead tree up on the highway';
    return `Big Al's? Ask at the ${where}. It's ${compass(P, c)} of here.`;
  }
  return `Al's out in the woods ${compass(P, L.store)} of here. Take the dirt road from the dead tree.`;
}

// Checking in at a landmark gets you the next clue, and counts as a checkpoint
function checkClues(g, api) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  L.clues.forEach((c, idx) => {
    if (Math.hypot(c.x - P.x, c.y - P.y) > c.r) return;
    if (idx === D.stage) {
      D.stage++;
      D.hint = { text: c.text, t: 11 };
      api.toast(`Clue found at ${c.name}!`);
      api.emit('clue');
      g.score += 300;
      const rt = nearestRoadTile(L, c.x, c.y, 24);
      const spot = rt >= 0 ? { x: (rt % L.w) + 0.5, y: Math.floor(rt / L.w) + 0.5 } : { x: P.x, y: P.y };
      D.respawnAt = { ...spot, stage: D.stage };
      api.setCheckpoint(D.respawnAt);
    } else if (idx > D.stage && D.clueCd <= 0) {
      D.clueCd = 10;
      api.toast('Nobody here is talking. You are missing a lead...');
    }
  });
}

// ---------------------------------------------------------------------------
// The action button: get in, get out, or throw a farmer out of his truck
function nearestVehicle(D, P, maxD = 2.8) {
  let best = null;
  let bestD = maxD;
  for (const v of D.vehicles) {
    if (v.wreck) continue;
    const d = Math.min(...circlesOf(v).map((c) => Math.hypot(c.x - P.x, c.y - P.y) - c.r + 0.8));
    if (d < bestD) {
      best = v;
      bestD = d;
    }
  }
  return best;
}

function handleAction(g, api) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  const pv = playerVehicle(D);
  if (pv) {
    if (speedOf(pv) > 6) {
      fx(D, P.x, P.y - 1.5, 'Slow down first!');
      return;
    }
    const spot = sideSpot(L, pv, true);
    P.vehicle = null;
    P.x = spot.x;
    P.y = spot.y;
    P.h = pv.h;
    pv.driver = null;
    pv.inp = { steer: 0, gas: false, brake: false };
    api.emit('exit');
    return;
  }
  const v = nearestVehicle(D, P);
  if (!v) return;
  if (v.driver === 'cop' || v.driver === 'patrol') {
    fx(D, P.x, P.y - 1.5, "Can't steal a cop car");
    return;
  }
  if (v.driver === 'civ') {
    // pull him out! (and he tells you where Big Al's is, because hillbillies are like that)
    const ped = ejectDriver(g, v, false);
    fx(D, ped.x, ped.y - 1.2, SHOUTS[Math.floor(rnd(D) * SHOUTS.length)]);
    D.hint = { text: hintText(D, L, P), t: 7 };
    g.score += 200;
    addHeat(D, 1.3);
    api.emit('carjack');
    fx(D, P.x, P.y - 2, 'CARJACKED! +200');
    v.route = null;
  } else {
    api.emit('enter');
  }
  v.driver = 'player';
  v.inp = { steer: 0, gas: false, brake: false };
  P.vehicle = v.id;
}

// ---------------------------------------------------------------------------
// The step
export function stepDrive(g, input, dt, api) {
  const D = g.drive;
  const L = g.level;
  const P = D.player;
  D.time += dt;
  D.crimeCd = Math.max(0, D.crimeCd - dt);
  D.honkCd = Math.max(0, D.honkCd - dt);
  D.clueCd = Math.max(0, D.clueCd - dt);
  D.fakeCd = Math.max(0, D.fakeCd - dt);
  D.crashCd = Math.max(0, D.crashCd - dt);
  P.invuln = Math.max(0, P.invuln - dt);
  if (D.hint) D.hint.t -= dt, D.hint.t <= 0 && (D.hint = null);

  const action = !!input.rush && !D.prevAction;
  D.prevAction = !!input.rush;
  const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const gas = !!input.jump;
  const brake = !!input.throw;
  const reverse = !!input.shield; // REV button
  // drunk driving: invincible, a bit faster, and the steering has a mind of its own
  const wasDrunk = D.drunk > 0;
  D.drunk = Math.max(0, D.drunk - dt);
  if (wasDrunk && D.drunk === 0) api.toast('Sobering up...');
  const wobble = D.drunk > 0 ? Math.sin(D.time * 2.3) * 0.32 + Math.sin(D.time * 5.1) * 0.18 : 0;
  const steerIn = clamp(steer + wobble, -1, 1);

  // --- who is controlling what
  const pv = playerVehicle(D);
  if (pv) {
    pv.inp = { steer: steerIn, gas, brake, reverse };
    pv.boost = D.drunk > 0 ? 1.12 : 1;
    if (D.drunk > 0) pv.hp = pv.maxHp; // nothing can touch you
  }
  if (action) handleAction(g, api);

  const vehicleNow = playerVehicle(D);
  if (!vehicleNow) {
    P.h += steerIn * 3.4 * dt;
    const sp = gas ? FOOT_SPEED : brake || reverse ? -2 : 0;
    P.vx = Math.cos(P.h) * sp;
    P.vy = Math.sin(P.h) * sp;
    P.x += P.vx * dt;
    P.y += P.vy * dt;
  }

  // --- vehicles
  for (const v of D.vehicles) {
    if (v.wreck) {
      v.burn -= dt;
      v.vx = v.vy = 0;
      continue;
    }
    if ((v.driver === 'civ' || v.driver === 'patrol') && v.route) v.inp = aiCivilian(g, v, dt);
    else if (v.driver === 'cop') v.inp = aiCop(g, v, dt);
    else if (v.driver !== 'player') v.inp = { steer: 0, gas: false, brake: true }; // handbrake on
    physics(L, v, dt);
  }
  D.vehicles = D.vehicles.filter((v) => !v.wreck || v.burn > 0 || v === playerVehicle(D));

  // --- vehicles vs the world
  for (const v of D.vehicles) {
    if (v.wreck) continue;
    for (let pass = 0; pass < 2; pass++) {
      for (const c of circlesOf(v)) {
        for (const hit of staticContacts(L, c)) {
          v.x += hit.nx * hit.pen;
          v.y += hit.ny * hit.pen;
          c.x += hit.nx * hit.pen;
          c.y += hit.ny * hit.pen;
          const impact = bounce(v, hit.nx, hit.ny, 0.25);
          if (impact > 3) {
            damageVehicle(g, api, v, (impact - 3) * 5, null);
            if (v.driver === 'player' && impact > 5 && D.crashCd <= 0) {
              D.crashCd = 0.5;
              spark(D, c.x, c.y);
              api.emit('crash');
            }
          }
        }
      }
    }
  }

  // --- vehicles vs each other
  const vs = D.vehicles;
  for (let i = 0; i < vs.length; i++) {
    for (let j = i + 1; j < vs.length; j++) {
      const a = vs[i];
      const b = vs[j];
      if (Math.abs(a.x - b.x) > 5 || Math.abs(a.y - b.y) > 5) continue;
      collideVehicles(g, api, a, b);
    }
  }

  // --- Billy on foot vs vehicles
  if (!playerVehicle(D)) {
    for (const pass of [0, 1]) {
      for (const hit of staticContacts(L, { x: P.x, y: P.y, r: P.r })) {
        P.x += hit.nx * hit.pen;
        P.y += hit.ny * hit.pen;
      }
      for (const v of D.vehicles) {
        for (const c of circlesOf(v)) {
          const dx = P.x - c.x;
          const dy = P.y - c.y;
          const d = Math.hypot(dx, dy);
          const rr = c.r + P.r;
          if (d < rr && d > 0) {
            // a moving vehicle hurts; a parked one just blocks the way
            if (speedOf(v) > 4 && !v.wreck && v.driver !== 'player') {
              hurtPlayer(g, api);
              if (api.mode() !== 'playing') return;
              P.x += (dx / d) * 2.2;
              P.y += (dy / d) * 2.2;
            } else {
              P.x += (dx / d) * (rr - d);
              P.y += (dy / d) * (rr - d);
            }
          }
        }
      }
      void pass;
    }
  } else {
    P.x = playerVehicle(D).x;
    P.y = playerVehicle(D).y;
    P.h = playerVehicle(D).h;
  }

  // --- pedestrians
  for (const p of D.peds) updatePed(g, p, dt);
  for (const v of D.vehicles) {
    if (v.wreck || speedOf(v) < 3) continue;
    for (const p of D.peds) {
      if (p.state === 'stun') continue;
      for (const c of circlesOf(v)) {
        if (Math.hypot(p.x - c.x, p.y - c.y) < c.r + 0.35) {
          knockPed(D, p, c.x, c.y);
          fx(D, p.x, p.y - 1, 'OOF!');
          if (v.driver === 'player' && D.crimeCd <= 0) {
            addHeat(D, 0.4);
            D.crimeCd = 1.2;
            g.score += 50;
          }
          break;
        }
      }
    }
  }
  D.peds = D.peds.filter((p) => p.state !== 'gone');

  // --- cops, pickups, goal, checkpoint
  updateCops(g, api, dt);
  if (api.mode() !== 'playing') return;

  const me = { x: P.x, y: P.y };
  for (const pk of D.pickups) {
    if (pk.taken || Math.hypot(pk.x - me.x, pk.y - me.y) > 1.4) continue;
    pk.taken = true;
    if (pk.kind === 'beer') {
      D.drunk = Math.min(20, D.drunk + 12);
      api.toast('DRUNK DRIVING! Invincible! (steering gets wobbly...)');
      api.emit('drink');
      fx(D, pk.x, pk.y - 0.8, 'GLUG!');
    } else if (pk.kind === 'life') api.addLife();
    else {
      api.collectJug();
      fx(D, pk.x, pk.y - 0.6, '+100');
    }
  }
  checkClues(g, api);
  if (!D.found && Math.hypot(L.store.cx - me.x, L.store.cy - me.y) < 18) {
    D.found = true;
    api.toast("There it is... Big Al's Liquor Store, hidden in the woods!");
  }
  for (const fs of L.fakeStores) {
    const dz = fs.door;
    if (me.x > dz.x && me.x < dz.x + dz.w && me.y > dz.y && me.y < dz.y + dz.h && D.fakeCd <= 0) {
      D.fakeCd = 6;
      fx(D, me.x, me.y - 2, 'CLOSED!');
      api.toast(fs.msg);
    }
  }
  const door = L.store.door;
  const inDoor = me.x > door.x && me.x < door.x + door.w && me.y > door.y && me.y < door.y + door.h;
  const pv2 = playerVehicle(D);
  if (inDoor && (!pv2 || speedOf(pv2) < 10)) {
    api.win();
    return;
  }

  // --- the action prompt on the button
  if (playerVehicle(D)) D.prompt = 'EXIT';
  else {
    const n = nearestVehicle(D, P);
    D.prompt = !n ? null : n.driver === 'cop' || n.driver === 'patrol' ? 'LOCKED' : n.driver === 'civ' ? 'CARJACK' : 'ENTER';
  }

  // --- camera and effects
  const lead = playerVehicle(D) ? 0.35 : 0;
  const pvx = playerVehicle(D) ? playerVehicle(D).vx : 0;
  const pvy = playerVehicle(D) ? playerVehicle(D).vy : 0;
  D.cam.x += (P.x + pvx * lead - D.cam.x) * Math.min(1, dt * 6);
  D.cam.y += (P.y + pvy * lead - D.cam.y) * Math.min(1, dt * 6);
  for (const e of D.effects) e.t += dt;
  D.effects = D.effects.filter((e) => e.t < (e.kind === 'boom' ? 0.7 : e.kind === 'spark' ? 0.25 : 1.1));
}

function collideVehicles(g, api, a, b) {
  const D = g.drive;
  const sa = VEHICLES[a.type];
  const sb = VEHICLES[b.type];
  const ma = a.wreck ? 6 : sa.mass;
  const mb = b.wreck ? 6 : sb.mass;
  for (const ca of circlesOf(a)) {
    for (const cb of circlesOf(b)) {
      const dx = cb.x - ca.x;
      const dy = cb.y - ca.y;
      const d = Math.hypot(dx, dy);
      const rr = ca.r + cb.r;
      if (d >= rr) continue;
      const nx = d === 0 ? 1 : dx / d;
      const ny = d === 0 ? 0 : dy / d;
      const pen = rr - d;
      const wa = mb / (ma + mb);
      const wb = ma / (ma + mb);
      if (!a.wreck) {
        a.x -= nx * pen * wa;
        a.y -= ny * pen * wa;
      }
      if (!b.wreck) {
        b.x += nx * pen * wb;
        b.y += ny * pen * wb;
      }
      const rvx = b.vx - a.vx;
      const rvy = b.vy - a.vy;
      const vn = rvx * nx + rvy * ny;
      if (vn < 0) {
        const j = (-(1 + 0.35) * vn) / (1 / ma + 1 / mb);
        if (!a.wreck) {
          a.vx -= (j * nx) / ma;
          a.vy -= (j * ny) / ma;
        }
        if (!b.wreck) {
          b.vx += (j * nx) / mb;
          b.vy += (j * ny) / mb;
        }
        const impact = -vn;
        if (impact > 2.5) {
          const srcA = a.driver === 'player' ? 'player' : null;
          const srcB = b.driver === 'player' ? 'player' : null;
          // the lighter ride takes the beating
          const drunkA = a.driver === 'player' && D.drunk > 0 ? 2 : 1;
          const drunkB = b.driver === 'player' && D.drunk > 0 ? 2 : 1;
          damageVehicle(g, api, a, (impact - 2.5) * 3.4 * wa * 2 * sb.ram * drunkB, srcB);
          damageVehicle(g, api, b, (impact - 2.5) * 3.4 * wb * 2 * sa.ram * drunkA, srcA);
          const involvesPlayer = a.driver === 'player' || b.driver === 'player';
          if (involvesPlayer && impact > 3) {
            const other = a.driver === 'player' ? b : a;
            if (D.crimeCd <= 0 && (other.driver === 'civ' || other.driver === 'cop' || other.driver === 'patrol')) {
              D.crimeCd = 1.2;
              addHeat(D, other.driver === 'civ' ? 0.5 : 0.35);
              g.score += 100;
              fx(D, (a.x + b.x) / 2, (a.y + b.y) / 2 - 1, 'CRASH! +100');
            }
            if (other.driver === 'civ' || other.driver === 'patrol') other.panic = 3;
            D.alert = 4;
            if (D.crashCd <= 0) {
              D.crashCd = 0.4;
              spark(D, (ca.x + cb.x) / 2, (ca.y + cb.y) / 2);
              api.emit('crash');
            }
          }
        }
      }
      return; // one contact per pair per step is plenty
    }
  }
}

// Used when the player respawns: a fresh world
export function resetDrive(g, opts) {
  g.drive = createDrive(g.level, opts);
}

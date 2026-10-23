// Level 10: a penguin race down an icy course. Pure logic, no UI.
// Distances are in tiles along the course. Three lanes. Billy and three rival penguin riders.

export const LANES = 3;
export const COURSE = 900;
export const RIVALS = [
  { name: 'WADDLES', color: '#4aa8ff', skill: 0.0, hat: 'scarf' },
  { name: 'CHILLY WILLY', color: '#ff5a4a', skill: 0.4, hat: 'goggles' },
  { name: 'EMPEROR PETE', color: '#ffd23a', skill: 0.8, hat: 'crown' },
];
const V_BASE = 12;
const V_DRUNK = 1.5; // speed multiplier while drunk
const ACCEL = 7;
const DRUNK_TIME = 5;
const DRUNK_MAX = 12;
const COUNTDOWN = 3.2;
const LANE_SPEED = 9; // lanes per second when switching
const GRAVITY = 36;
const JUMP_V = 11;
const PODIUM = 2; // top two win

function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Obstacles: 'spike' and 'crack' are low (jump them), 'snowman' and 'seal' are tall (change lanes)
export function buildCourse(seed = 4242) {
  const rnd = lcg(seed);
  const obstacles = [];
  const jugs = [];
  const ramps = [];
  let x = 60;
  while (x < COURSE - 60) {
    const roll = rnd();
    const lane = Math.floor(rnd() * LANES);
    if (roll < 0.28) {
      obstacles.push({ x, lane, kind: rnd() < 0.5 ? 'spike' : 'crack' });
      if (rnd() < 0.4) obstacles.push({ x: x + 1.2, lane: (lane + 1) % LANES, kind: 'spike' });
    } else if (roll < 0.5) {
      // a wall of two tall things, one lane left open
      const open = Math.floor(rnd() * LANES);
      for (let l = 0; l < LANES; l++) if (l !== open) obstacles.push({ x, lane: l, kind: rnd() < 0.5 ? 'snowman' : 'seal' });
      if (rnd() < 0.7) jugs.push({ x: x - 4, lane: open, taken: false });
    } else if (roll < 0.62) {
      ramps.push({ x, lane });
    } else if (roll < 0.9) {
      jugs.push({ x, lane, taken: false });
      if (rnd() < 0.5) jugs.push({ x: x + 2, lane, taken: false });
    }
    x += 14 + rnd() * 14;
  }
  return { obstacles, jugs, ramps };
}

function makeRacer(name, lane, o = {}) {
  return {
    name,
    lane,
    laneF: lane,
    x: 0,
    y: 0,
    vy: 0,
    v: 0,
    stun: 0,
    drunk: 0,
    boost: 0,
    cd: 0,
    flash: 0,
    finished: null,
    place: 0,
    jugs: 0,
    ai: o.ai || null,
    color: o.color || '#222',
    hat: o.hat || null,
    skill: o.skill || 0,
    laneIn: { up: false, down: false },
  };
}

export function createRace({ seed = 4242, hpBonus = 0 } = {}) {
  const course = buildCourse(seed);
  const rnd = lcg(seed + 7);
  const R = {
    t: 0,
    phase: 'countdown', // countdown | racing | finished
    count: COUNTDOWN,
    course,
    obstacles: course.obstacles.map((o) => ({ ...o, dead: false })),
    jugs: course.jugs.map((j) => ({ ...j })),
    ramps: course.ramps,
    p: makeRacer('BILLY', 1, { color: '#222' }),
    rivals: RIVALS.map((r, i) => makeRacer(r.name, [0, 2, 1][i], { ai: { t: 0.2 + i * 0.1 }, color: r.color, hat: r.hat, skill: r.skill })),
    cobs: [],
    snow: [],
    events: [],
    text: null,
    done: null,
    finishT: 0,
    order: [],
    prev: { jump: false, throw: false, up: false, down: false },
    rnd,
    shake: 0,
    place: 0,
  };
  R.rivals.forEach((r, i) => (r.x = -i * 0.0));
  return R;
}

const emit = (R, name) => R.events.push(name);
const all = (R) => [R.p, ...R.rivals];

export function placeOf(R, r) {
  const sorted = all(R).slice().sort((a, b) => (b.finished !== null ? 1e6 - b.finished : b.x) - (a.finished !== null ? 1e6 - a.finished : a.x));
  return sorted.indexOf(r) + 1;
}

function drink(R, r) {
  r.drunk = Math.min(DRUNK_MAX, r.drunk + DRUNK_TIME);
  r.jugs++;
  emit(R, r === R.p ? 'drink' : 'rivaldrink');
}

function hurtRacer(R, r) {
  if (r.drunk > 0) return;
  r.stun = 0.9;
  r.v *= 0.3;
  r.flash = 0.5;
  if (r === R.p) {
    emit(R, 'bump');
    R.shake = 0.3;
  }
}

function stepRacer(R, r, intent, dt) {
  r.flash = Math.max(0, r.flash - dt);
  r.cd = Math.max(0, r.cd - dt);
  r.stun = Math.max(0, r.stun - dt);
  r.boost = Math.max(0, r.boost - dt);
  r.drunk = Math.max(0, r.drunk - dt);
  if (R.phase === 'countdown') return;
  // lane changes
  if (intent.up && r.lane > 0) r.lane--;
  if (intent.down && r.lane < LANES - 1) r.lane++;
  const dl = r.lane - r.laneF;
  r.laneF += Math.sign(dl) * Math.min(Math.abs(dl), LANE_SPEED * dt);
  // jump
  if (intent.jump && r.y === 0 && r.stun <= 0) {
    r.vy = JUMP_V;
    if (r === R.p) emit(R, 'hop');
  }
  if (r.y > 0 || r.vy > 0) {
    r.vy -= GRAVITY * dt;
    r.y = Math.max(0, r.y + r.vy * dt);
    if (r.y === 0) r.vy = 0;
  }
  // speed
  let vmax = V_BASE + (r === R.p ? 0.6 : 1.2 * r.skill + rubber(R, r));
  if (r.drunk > 0) vmax *= V_DRUNK;
  if (r.boost > 0) vmax += 4;
  if (r.stun > 0) vmax *= 0.3;
  const acc = ACCEL * (r.drunk > 0 ? 2 : 1);
  r.v = r.v < vmax ? Math.min(vmax, r.v + acc * dt) : Math.max(vmax, r.v - 10 * dt);
  r.x += r.v * dt;
  // pickups, ramps and obstacles
  for (const j of R.jugs) {
    if (!j.taken && j.lane === r.lane && Math.abs(j.x - r.x) < 0.9 && r.y < 1.2) {
      j.taken = true;
      drink(R, r);
    }
  }
  for (const rp of R.ramps) {
    if (!rp.hit?.has(r) && rp.lane === r.lane && Math.abs(rp.x - r.x) < 0.7 && r.y < 0.5) {
      (rp.hit ??= new Set()).add(r);
      r.vy = 12;
      r.boost = 1.2;
      if (r === R.p) emit(R, 'ramp');
    }
  }
  for (const o of R.obstacles) {
    if (o.dead || Math.abs(o.x - r.x) > 0.7 || Math.abs(r.laneF - o.lane) > 0.55) continue;
    const low = o.kind === 'spike' || o.kind === 'crack';
    if (low && r.y > 0.7) continue; // hopped over it
    if (r.drunk > 0) {
      o.dead = true; // a drunk penguin plows straight through
      o.smashed = true;
      if (r === R.p) emit(R, 'smash');
    } else if (r.stun <= 0) {
      hurtRacer(R, r);
      if (!low) o.dead = true;
    }
  }
}

// How hard the rivals push depends on where Billy is, so the race stays close
function rubber(R, r) {
  const d = R.p.x - r.x;
  return Math.max(-1.6, Math.min(1.8, d / 25));
}

function aiIntent(R, r, dt) {
  const ai = r.ai;
  ai.t -= dt;
  const intent = {};
  if (ai.t > 0 || R.phase !== 'racing') return intent;
  ai.t = 0.12 + (1 - r.skill * 0.5) * 0.1 + R.rnd() * 0.1;
  const look = 3 + r.v * 0.45;
  const ahead = R.obstacles.filter((o) => !o.dead && o.x > r.x + 0.5 && o.x < r.x + look);
  const blocked = (lane) => ahead.some((o) => o.lane === lane);
  const here = ahead.filter((o) => o.lane === r.lane);
  if (here.length) {
    const tall = here.some((o) => o.kind === 'snowman' || o.kind === 'seal');
    const options = [r.lane - 1, r.lane + 1].filter((l) => l >= 0 && l < LANES && !blocked(l));
    if (tall || R.rnd() < 0.4) {
      if (options.length) {
        const l = options[Math.floor(R.rnd() * options.length)];
        if (l < r.lane) intent.up = true;
        else intent.down = true;
      }
    } else intent.jump = true;
    return intent;
  }
  // chase moonshine in a neighbouring lane
  const jug = R.jugs.find((j) => !j.taken && j.x > r.x + 1 && j.x < r.x + 10 && Math.abs(j.lane - r.lane) === 1 && !blocked(j.lane));
  if (jug && R.rnd() < 0.7) {
    if (jug.lane < r.lane) intent.up = true;
    else intent.down = true;
    return intent;
  }
  // now and then lob a snowball at Billy
  if (r.skill > 0.2 && r.cd <= 0 && R.p.lane === r.lane && R.p.x > r.x && R.p.x - r.x < 12 && R.rnd() < 0.25) {
    throwCob(R, r);
  }
  return intent;
}

function throwCob(R, r) {
  r.cd = 1.6;
  R.cobs.push({ x: r.x + 0.8, lane: r.lane, v: r.v + 14, owner: r, life: 1.2 });
  if (r === R.p) emit(R, 'throw');
}

function stepCobs(R, dt) {
  for (const c of R.cobs) {
    c.life -= dt;
    c.x += c.v * dt;
    for (const r of all(R)) {
      if (r === c.owner || c.dead || r.lane !== c.lane || Math.abs(r.x - c.x) > 0.8 || r.y > 1) continue;
      c.dead = true;
      if (r.drunk <= 0) {
        r.stun = 1.0;
        r.v *= 0.35;
        r.flash = 0.5;
        emit(R, r === R.p ? 'bump' : 'stomp');
      }
    }
    if (c.life <= 0) c.dead = true;
  }
  R.cobs = R.cobs.filter((c) => !c.dead);
}

// Advances the race. Returns 'won' or 'lost' once it is over.
export function stepRace(R, input, dt) {
  R.t += dt;
  R.shake = Math.max(0, R.shake - dt);
  const prev = R.prev;
  const pi = {
    up: !!input.up && !prev.up,
    down: !!input.down && !prev.down,
    jump: !!input.jump && !prev.jump,
    throw: !!input.throw && !prev.throw,
  };
  prev.up = !!input.up;
  prev.down = !!input.down;
  prev.jump = !!input.jump;
  prev.throw = !!input.throw;

  if (R.phase === 'countdown') {
    R.count -= dt;
    const n = Math.ceil(R.count - 0.2);
    const text = n > 0 ? String(n) : 'GO!';
    if (R.text !== text) {
      R.text = text;
      emit(R, n > 0 ? 'press' : 'round');
    }
    if (R.count <= 0.2 && R.phase === 'countdown') {
      R.phase = 'racing';
      setTimeout0(R);
    }
    return R.done;
  }
  if (R.text && R.t - R.goAt > 1) R.text = null;

  if (R.phase === 'racing' || R.phase === 'finished') {
    if (R.p.finished === null) {
      stepRacer(R, R.p, pi, dt);
      if (pi.throw && R.p.cd <= 0 && R.p.stun <= 0) throwCob(R, R.p);
    } else {
      // coasting across the line
      R.p.x += R.p.v * dt;
      R.p.v = Math.max(3, R.p.v - 6 * dt);
    }
    for (const r of R.rivals) {
      if (r.finished === null) stepRacer(R, r, aiIntent(R, r, dt), dt);
      else {
        r.x += r.v * dt;
        r.v = Math.max(3, r.v - 6 * dt);
      }
    }
    stepCobs(R, dt);
    for (const r of all(R)) {
      if (r.finished === null && r.x >= COURSE) {
        r.finished = R.t;
        R.order.push(r);
        r.place = R.order.length;
        if (r === R.p) {
          R.phase = 'finished';
          R.finishT = 0;
          emit(R, 'ko');
        }
      }
    }
    if (R.phase === 'finished') {
      R.finishT += dt;
      R.place = R.p.place;
      R.text = R.place === 1 ? '1ST PLACE!' : R.place === 2 ? '2ND PLACE!' : R.place === 3 ? '3RD PLACE' : 'LAST PLACE';
      if (R.finishT > 3.2) R.done = R.place <= PODIUM ? 'won' : 'lost';
    }
  }
  return R.done;
}

function setTimeout0(R) {
  R.goAt = R.t;
}

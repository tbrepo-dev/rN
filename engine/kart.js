// Level 11: Hillbilly Kart. A pseudo-3D kart race on a closed loop of road. Pure logic, no UI.
// The track is a list of segments, each with a curve. A kart has a distance along the road `s` and a
// sideways position `x` (-1 is the left edge of the road, +1 the right edge).

export const SEG = 10; // units per segment
export const LAPS = 3;
export const RIVALS = [
  { name: 'COUSIN CLETUS', color: '#5d6e3a', head: '🥸', skill: 0.0 },
  { name: 'GRANNY MAE', color: '#8a4fd1', head: '👵', skill: 0.25 },
  { name: 'BIG AL', color: '#8a2a7a', head: '🧔', skill: 0.5 },
  { name: 'MAX', color: '#e8873a', head: '🐈', skill: 0.7 },
  { name: 'JINXY', color: '#2a2f3d', head: '🐈‍⬛', skill: 1.0 },
];
const V_MAX = 80;
const V_OFF = 28; // top speed on the grass
const ACCEL = 38;
const BRAKE = 110;
const STEER = 1.9; // road-halves per second at full speed
const CURVE_PUSH = 2600; // how hard the bends fling you outwards
const BOOST_V = 118;
const DRUNK_TIME = 4;
const COUNTDOWN = 3.2;
const SPIN_TIME = 1.0;
const PODIUM = 3;
const ITEMS = ['shine', 'corn', 'pie', 'hay'];

// Sections of [length, curve]. Curve is how hard the road bends (positive = to the right).
const SECTIONS = [
  [300, 0],
  [250, 0.00016],
  [150, 0],
  [300, -0.00022],
  [140, 0.00019],
  [140, -0.00019],
  [180, 0],
  [200, 0.00034],
  [120, 0],
  [260, -0.00016],
  [160, 0],
];

export function buildTrack() {
  const curves = [];
  for (const [len, curve] of SECTIONS) {
    const n = Math.round(len / SEG);
    for (let i = 0; i < n; i++) {
      // ease in and out of each bend
      const e = Math.min(1, Math.min(i + 1, n - i) / 5);
      curves.push(curve * e);
    }
  }
  const length = curves.length * SEG;
  const boxes = [];
  for (const s of [380, 1000, 1700, 2150]) for (const x of [-0.5, 0, 0.5]) boxes.push({ s, x, back: 0 });
  const pads = [{ s: 720, x: 0 }, { s: 1500, x: -0.45 }, { s: 1980, x: 0.4 }, { s: 2330, x: 0 }];
  const hay = [
    { s: 620, x: 0.55 },
    { s: 880, x: -0.5 },
    { s: 1260, x: 0.1 },
    { s: 1650, x: -0.55 },
    { s: 1900, x: 0.3 },
    { s: 2250, x: -0.3 },
  ];
  return { curves, length, boxes, pads, hay };
}

export const curveAt = (T, s) => T.curves[((Math.floor(s / SEG) % T.curves.length) + T.curves.length) % T.curves.length];

function makeKart(name, x, s, o = {}) {
  return {
    name,
    s,
    x,
    v: 0,
    lap: 0, // completed laps
    prog: s,
    spin: 0,
    boost: 0,
    drunk: 0,
    off: false,
    item: null,
    hay: 0,
    drift: 0,
    driftCharge: 0,
    steer: 0,
    flash: 0,
    finished: null,
    place: 0,
    color: o.color || '#c0392b',
    head: o.head || '🤠',
    skill: o.skill || 0,
    ai: o.ai || null,
    itemCd: 0,
    bumps: 0,
  };
}

function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function createKart({ seed = 777 } = {}) {
  const T = buildTrack();
  const rnd = lcg(seed);
  const K = {
    T,
    t: 0,
    phase: 'countdown', // countdown | racing | finished
    count: COUNTDOWN,
    p: makeKart('BILLY', 0.0, -38, { head: '🤠' }),
    rivals: RIVALS.map((r, i) => makeKart(r.name, [-0.5, 0.5, -0.1, 0.8, -0.8][i], -(Math.floor(i / 2)) * 12 - (i % 2) * 5, { ...r, ai: { lane: [-0.5, 0.5, -0.1, 0.8, -0.8][i], t: 0 } })),
    boxes: T.boxes.map((b) => ({ ...b })),
    hazards: [], // cow pies dropped on the road
    hay: T.hay.map((h) => ({ ...h })),
    shots: [],
    events: [],
    text: null,
    done: null,
    finishT: 0,
    order: [],
    place: 0,
    prev: { throw: false },
    rnd,
    shake: 0,
    goAt: 0,
  };
  for (const k of all(K)) k.prog = k.s;
  return K;
}

const all = (K) => [K.p, ...K.rivals];
const emit = (K, name) => K.events.push(name);

export function placeOf(K, k) {
  return all(K).slice().sort((a, b) => rank(b) - rank(a)).indexOf(k) + 1;
}
const rank = (k) => (k.finished !== null ? 1e9 - k.finished : k.prog);

function spinOut(K, k) {
  if (k.hay > 0) {
    k.hay = 0;
    if (k === K.p) emit(K, 'block');
    return;
  }
  if (k.spin > 0 || k.drunk > 0) return;
  k.spin = SPIN_TIME;
  k.v *= 0.3;
  k.flash = 0.6;
  if (k === K.p) {
    emit(K, 'bump');
    K.shake = 0.35;
  }
}

function giveItem(K, k) {
  if (k.item) return;
  const r = K.rnd();
  // the guy in last place gets better luck
  const behind = placeOf(K, k) >= 4;
  k.item = behind && r < 0.5 ? 'shine' : ITEMS[Math.floor(K.rnd() * ITEMS.length)];
  if (k === K.p) emit(K, 'ammo');
}

function useItem(K, k) {
  const it = k.item;
  if (!it) return;
  k.item = null;
  if (it === 'shine') {
    k.drunk = Math.min(10, k.drunk + DRUNK_TIME);
    if (k === K.p) emit(K, 'drink');
  } else if (it === 'corn') {
    K.shots.push({ s: k.s + 8, x: k.x, v: k.v + 70, owner: k, life: 2.5 });
    if (k === K.p) emit(K, 'throw');
  } else if (it === 'pie') {
    K.hazards.push({ s: k.s - 7, x: k.x, life: 25 });
    if (k === K.p) emit(K, 'barrel');
  } else if (it === 'hay') {
    k.hay = 8;
    if (k === K.p) emit(K, 'gear');
  }
}

function stepKartPhysics(K, k, intent, dt) {
  k.flash = Math.max(0, k.flash - dt);
  k.itemCd = Math.max(0, k.itemCd - dt);
  k.hay = Math.max(0, k.hay - dt);
  k.boost = Math.max(0, k.boost - dt);
  k.drunk = Math.max(0, k.drunk - dt);
  k.spin = Math.max(0, k.spin - dt);
  if (K.phase === 'countdown') return;
  const finishing = k.finished !== null;
  // speed
  const off = Math.abs(k.x) > 1.05;
  k.off = off;
  let vmax = (intent.vcap || V_MAX) * (k.drunk > 0 ? 1.4 : 1);
  if (k.boost > 0) vmax = Math.max(vmax, BOOST_V);
  if (off) vmax = Math.min(vmax, k.boost > 0 ? 60 : V_OFF);
  if (k.spin > 0) vmax = 8;
  if (finishing) vmax = 40;
  if (intent.brake && !finishing) k.v = Math.max(0, k.v - BRAKE * dt);
  else if (k.v < vmax) k.v = Math.min(vmax, k.v + ACCEL * (k.drunk > 0 || k.boost > 0 ? 2 : 1) * dt);
  else k.v = Math.max(vmax, k.v - 60 * dt);
  // steering
  const speedF = Math.min(1, k.v / V_MAX);
  let steer = k.spin > 0 || finishing ? 0 : intent.steer || 0;
  if (k.drunk > 0) steer += Math.sin(K.t * 5 + k.s * 0.02) * 0.35; // a little wobbly
  k.steer = steer;
  const grip = intent.drift && steer ? 1.55 : 1;
  const curve = curveAt(K.T, k.s);
  k.x += (steer * STEER * grip * Math.max(0.35, speedF) - curve * CURVE_PUSH * speedF * speedF * (intent.drift && steer ? 0.55 : 1)) * dt;
  k.x = Math.max(-1.9, Math.min(1.9, k.x));
  // drifting builds a mini-turbo
  if (intent.drift && steer && k.v > 40 && k.spin <= 0) {
    k.driftCharge += dt;
    k.drift = steer > 0 ? 1 : -1;
  } else {
    if (k.driftCharge > 0.8 && k.spin <= 0) {
      k.boost = Math.min(1.8, 0.5 + k.driftCharge * 0.6);
      if (k === K.p) emit(K, 'rush');
    }
    k.driftCharge = 0;
    k.drift = 0;
  }
  // move
  k.s += k.v * dt;
  k.prog += k.v * dt;
  // pickups and hazards
  for (const b of K.boxes) {
    if (b.back <= 0 && Math.abs(b.s - k.s) < 5 && Math.abs(b.x - k.x) < 0.22) {
      b.back = 6;
      giveItem(K, k);
    }
  }
  for (const pd of K.T.pads) {
    if (Math.abs(pd.s - (k.s % K.T.length)) < 6 && Math.abs(pd.x - k.x) < 0.3 && k.boost < 0.8) {
      k.boost = 1.2;
      if (k === K.p) emit(K, 'ramp');
    }
  }
  const sm = ((k.s % K.T.length) + K.T.length) % K.T.length;
  for (const h of K.hay) {
    if (Math.abs(h.s - sm) < 5 && Math.abs(h.x - k.x) < 0.2) {
      if (k.drunk > 0) h.smashed = 2;
      else if (k.spin <= 0) {
        spinOut(K, k);
        k.x += (k.x >= h.x ? 1 : -1) * 0.25;
      }
    }
  }
  for (const hz of K.hazards) {
    if (hz.life > 0 && Math.abs(hz.s - sm) < 5 && Math.abs(hz.x - k.x) < 0.2) {
      hz.life = 0;
      spinOut(K, k);
    }
  }
}

function aiIntent(K, k, dt) {
  const ai = k.ai;
  ai.t -= dt;
  const intent = { steer: 0, drift: false, brake: false };
  // pick a lane that stays clear of hay and pies a little way ahead
  const sm = ((k.s % K.T.length) + K.T.length) % K.T.length;
  let target = ai.lane;
  for (const h of K.hay) {
    const ds = (h.s - sm + K.T.length) % K.T.length;
    if (ds > 0 && ds < 45 && Math.abs(h.x - target) < 0.35) target = h.x > 0 ? h.x - 0.5 : h.x + 0.5;
  }
  for (const hz of K.hazards) {
    const ds = (hz.s - sm + K.T.length) % K.T.length;
    if (hz.life > 0 && ds > 0 && ds < 35 && Math.abs(hz.x - target) < 0.3) target = hz.x > 0 ? hz.x - 0.45 : hz.x + 0.45;
  }
  // go after moonshine boxes if they are near
  const box = K.boxes.find((b) => b.back <= 0 && (((b.s - sm) + K.T.length) % K.T.length) < 60 && ((b.s - sm + K.T.length) % K.T.length) > 5);
  if (box && !k.item && k.skill > 0.2) target = box.x;
  target = Math.max(-0.85, Math.min(0.85, target));
  const speedF = Math.min(1, k.v / V_MAX);
  const curve = curveAt(K.T, k.s);
  // counter the push of the bend, and head for the target
  const need = (target - k.x) * 3 + (curve * CURVE_PUSH * speedF * speedF) / (STEER * Math.max(0.35, speedF));
  intent.steer = Math.max(-1, Math.min(1, need));
  if (Math.abs(need) < 0.08) intent.steer = 0;
  // rubber banding: a bit faster when behind, a bit slower when well ahead
  const lead = K.p.prog - k.prog;
  k.rubber = Math.max(-0.12, Math.min(0.14, lead / 900));
  if (ai.t <= 0) {
    ai.t = 0.4 + K.rnd() * 0.6;
    if (K.rnd() < 0.15) ai.lane = (K.rnd() - 0.5) * 1.4;
    if (k.item && K.rnd() < 0.6) {
      const ahead = all(K).some((o) => o !== k && o.prog > k.prog && o.prog - k.prog < 90 && Math.abs(o.x - k.x) < 0.4);
      if (k.item === 'corn' ? ahead : k.item === 'pie' ? !ahead : true) useItem(K, k);
    }
  }
  return intent;
}

function stepShots(K, dt) {
  for (const sh of K.shots) {
    sh.life -= dt;
    sh.s += sh.v * dt;
    for (const k of all(K)) {
      if (k === sh.owner || sh.dead) continue;
      const ds = (((k.s - sh.s) % K.T.length) + K.T.length) % K.T.length;
      if ((ds < 5 || ds > K.T.length - 5) && Math.abs(k.x - sh.x) < 0.3) {
        sh.dead = true;
        spinOut(K, k);
      }
    }
    if (sh.life <= 0) sh.dead = true;
  }
  K.shots = K.shots.filter((s) => !s.dead);
}

export function stepKart(K, input, dt) {
  K.t += dt;
  K.shake = Math.max(0, K.shake - dt);
  const pThrow = !!input.throw && !K.prev.throw;
  K.prev.throw = !!input.throw;
  for (const b of K.boxes) b.back = Math.max(0, b.back - dt);
  for (const h of K.hay) if (h.smashed) h.smashed = Math.max(0, h.smashed - dt);
  K.hazards.forEach((h) => (h.life -= dt));
  K.hazards = K.hazards.filter((h) => h.life > 0);

  if (K.phase === 'countdown') {
    K.count -= dt;
    const n = Math.ceil(K.count - 0.2);
    const text = n > 0 ? String(n) : 'GO!';
    if (K.text !== text) {
      K.text = text;
      emit(K, n > 0 ? 'press' : 'round');
    }
    if (K.count <= 0.2) {
      K.phase = 'racing';
      K.goAt = K.t;
    }
    return K.done;
  }
  if (K.text && K.t - K.goAt > 1) K.text = null;

  const pi = { steer: (input.right ? 1 : 0) - (input.left ? 1 : 0), drift: !!input.jump, brake: !!input.shield };
  if (K.p.finished === null || K.phase === 'finished') stepKartPhysics(K, K.p, K.p.finished === null ? pi : { steer: 0 }, dt);
  if (pThrow && K.p.finished === null) useItem(K, K.p);
  for (const r of K.rivals) {
    const intent = r.finished === null ? aiIntent(K, r, dt) : { steer: 0 };
    intent.vcap = V_MAX * (0.88 + r.skill * 0.1 + (r.rubber || 0)); // better drivers are faster
    stepKartPhysics(K, r, intent, dt);
  }
  stepShots(K, dt);
  // karts shove each other a little
  const ks = all(K);
  for (const a of ks) {
    for (const b of ks) {
      if (a === b) continue;
      const ds = Math.abs(((a.s - b.s + K.T.length / 2) % K.T.length) - K.T.length / 2);
      if (ds < 6 && Math.abs(a.x - b.x) < 0.25) {
        const dir = a.x >= b.x ? 1 : -1;
        a.x += dir * 0.6 * dt * 4;
      }
    }
  }
  // laps
  for (const k of ks) {
    if (k.finished === null) {
      k.lap = Math.max(0, Math.floor(k.prog / K.T.length));
      if (k.prog >= K.T.length * LAPS) {
        k.finished = K.t;
        K.order.push(k);
        k.place = K.order.length;
        if (k === K.p) {
          K.phase = 'finished';
          K.finishT = 0;
          emit(K, 'ko');
        }
      }
    }
  }
  if (K.phase === 'finished') {
    K.finishT += dt;
    K.place = K.p.place;
    K.text = ['', '1ST PLACE!', '2ND PLACE!', '3RD PLACE!', '4TH PLACE', '5TH PLACE', 'LAST PLACE'][K.place] || 'FINISHED';
    if (K.finishT > 3.2) K.done = K.place <= PODIUM ? 'won' : 'lost';
  }
  return K.done;
}

export const lapOf = (K, k) => Math.min(LAPS, Math.floor(k.prog / K.T.length) + 1);

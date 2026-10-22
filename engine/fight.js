// Level 9: a Street Fighter-style cage match. One-on-one, best of three rounds, punch / kick / block,
// a fireball, a spinning kick, an uppercut, and a few easy-to-enter fatalities after the last KO.
// Pure logic: all positions are in tiles, y is height above the floor.

export const ARENA_W = 16;
const WALL = 0.6;
const GRAVITY = 32;
const JUMP_V = 11.5;
const BODY_W = 0.8;
const BODY_H = 1.7;
export const ROUND_TIME = 45;
export const ROUNDS_TO_WIN = 2;
const FINISH_TIME = 7;
const FATALITY_TIME = 3.6;

// startup / active / recover are seconds; reach is how far the strike extends past the body
export const MOVES = {
  punch: { startup: 0.06, active: 0.1, recover: 0.18, dmg: 7, reach: 1.1, y0: 0.9, y1: 1.5, stun: 0.3, push: 0.6 },
  kick: { startup: 0.12, active: 0.12, recover: 0.28, dmg: 11, reach: 1.5, y0: 0.2, y1: 1.1, stun: 0.4, push: 1.1 },
  fireball: { startup: 0.3, active: 0, recover: 0.2, dmg: 13, cd: 1.1 },
  spin: { startup: 0.05, active: 0.6, recover: 0.25, dmg: 6, reach: 1.35, y0: 0.2, y1: 1.5, stun: 0.3, push: 0.5, cd: 2.6, hits: 3 },
  uppercut: { startup: 0.04, active: 0.26, recover: 0.3, dmg: 15, reach: 1.0, y0: 0.4, y1: 2.4, stun: 0.5, push: 1.2, cd: 2.2, knock: true },
};

export const FATALITIES = {
  cob: { name: 'CORN COB SMASH', seq: ['punch', 'kick'], label: 'PUNCH, then KICK' },
  outhouse: { name: 'OUTHOUSE EXPRESS', seq: ['kick', 'punch'], label: 'KICK, then PUNCH' },
  jug: { name: 'MOONSHINE MELTDOWN', seq: ['special', 'special'], label: 'SPECIAL, SPECIAL' },
  moon: { name: 'MOON SHOT', seq: ['punch', 'punch'], label: 'PUNCH, PUNCH' },
};

export const OPPONENTS = [
  { id: 'cletus', name: 'COUSIN CLETUS', hp: 80, speed: 2.7, react: 0.5, aggr: 0.4, block: 0.12, fire: 0, spin: false, up: false, dmg: 0.85, emoji: '🥸' },
  { id: 'mae', name: 'GRANNY MAE', hp: 100, speed: 3.1, react: 0.32, aggr: 0.55, block: 0.3, fire: 0.3, spin: true, up: false, dmg: 1, emoji: '👵' },
  { id: 'jinxy', name: 'JINXY', hp: 110, speed: 4.0, react: 0.2, aggr: 0.7, block: 0.4, fire: 0.3, spin: true, up: true, dmg: 1, emoji: '🐈‍⬛' },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function lcg(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeFighter(who, x, face, hp, speed) {
  return {
    who,
    x,
    y: 0,
    vx: 0,
    vy: 0,
    face,
    hp,
    maxHp: hp,
    speed,
    state: 'idle',
    t: 0,
    cd: { fire: 0, spin: 0, up: 0 },
    hitSet: null,
    spinHits: 0,
    shot: false,
    inv: 0,
    stun: 0,
    flash: 0,
    ai: { t: 0.5, intent: {} },
  };
}

export function createFight(idx = 0, { hpBonus = 0, seed = 1234 } = {}) {
  const def = OPPONENTS[Math.min(idx, OPPONENTS.length - 1)];
  const F = {
    idx,
    def,
    phase: 'intro',
    t: 0,
    round: 1,
    wins: { p: 0, o: 0 },
    timer: ROUND_TIME,
    p: makeFighter('billy', 5, 1, 100 + hpBonus, 3.5),
    o: makeFighter(def.id, 11, -1, def.hp, def.speed),
    shots: [],
    events: [],
    text: 'ROUND 1',
    roundWinner: null,
    finishT: 0,
    seq: [],
    fatality: null,
    done: null,
    hitStop: 0,
    shake: 0,
    rng: lcg(seed + idx * 77),
    prev: { punch: false, kick: false, special: false, jump: false },
    hpBonus,
  };
  return F;
}

const emit = (F, name) => F.events.push(name);

function resetRound(F) {
  const hpP = F.p.maxHp;
  F.p = Object.assign(makeFighter('billy', 5, 1, hpP, F.p.speed));
  F.o = makeFighter(F.def.id, 11, -1, F.def.hp, F.def.speed);
  F.shots = [];
  F.timer = ROUND_TIME;
  F.phase = 'intro';
  F.t = 0;
  F.text = `ROUND ${F.round}`;
  F.roundWinner = null;
}

function setState(f, state) {
  f.state = state;
  f.t = 0;
  f.hitSet = null;
  f.shot = false;
  f.spinHits = 0;
}

const grounded = (f) => f.y <= 0.001 && f.vy <= 0;
const attacking = (f) => f.state === 'punch' || f.state === 'kick' || f.state === 'spin' || f.state === 'uppercut' || f.state === 'fireball';
const free = (f) => f.state === 'idle' || f.state === 'walk' || f.state === 'jump' || f.state === 'block';

// An intent: { dir: -1|0|1 (world direction), punch, kick, special, jump (pressed this tick), block (held) }
function act(F, f, foe, intent, dt) {
  f.t += dt;
  f.flash = Math.max(0, f.flash - dt);
  f.inv = Math.max(0, f.inv - dt);
  for (const k of Object.keys(f.cd)) f.cd[k] = Math.max(0, f.cd[k] - dt);
  const dir = intent.dir || 0;
  const forward = dir !== 0 && dir === f.face;
  const backward = dir !== 0 && dir === -f.face;
  const isDown = f.state === 'down' || f.state === 'ko' || f.state === 'dizzy' || f.state === 'fatal';

  if (f.state === 'hit') {
    if (f.t >= f.stun) setState(f, grounded(f) ? 'idle' : 'jump');
  } else if (f.state === 'down') {
    if (grounded(f) && f.t >= 0.9) {
      setState(f, 'getup');
      f.inv = 0.4;
    }
  } else if (f.state === 'getup') {
    if (f.t >= 0.3) setState(f, 'idle');
  } else if (free(f) && !isDown) {
    if (grounded(f) && f.state !== 'jump') {
      if (intent.block && f.state !== 'block') setState(f, 'block');
    }
    if (f.state === 'block' && !intent.block) setState(f, 'idle');
    const canAct = f.state !== 'block';
    if (canAct && intent.special) {
      if (forward && f.cd.spin <= 0 && f.canSpin !== false) {
        setState(f, 'spin');
        f.cd.spin = MOVES.spin.cd;
        emit(F, 'spin');
      } else if (backward && f.cd.up <= 0 && f.canUp !== false) {
        setState(f, 'uppercut');
        f.cd.up = MOVES.uppercut.cd;
        f.vy = 9;
        f.vx = f.face * 1.5;
        f.inv = 0.3;
        emit(F, 'uppercut');
      } else if (!forward && !backward && f.cd.fire <= 0 && f.canFire !== false) {
        setState(f, 'fireball');
        f.cd.fire = MOVES.fireball.cd;
      }
    } else if (canAct && intent.punch) {
      setState(f, 'punch');
      emit(F, 'whiff');
    } else if (canAct && intent.kick) {
      setState(f, 'kick');
      emit(F, 'whiff');
    }
    if (free(f) && canAct) {
      if (intent.jump && grounded(f)) {
        f.vy = JUMP_V;
        f.vx = dir * 4.2;
        setState(f, 'jump');
        emit(F, 'jump');
      } else if (grounded(f) && f.state !== 'jump') {
        f.vx = dir * f.speed;
        f.state = dir ? 'walk' : 'idle';
      }
    } else if (f.state === 'block') f.vx = 0;
  }

  // Attacks play out over their startup / active / recover frames
  if (attacking(f)) {
    const m = MOVES[f.state];
    if (f.state === 'fireball') {
      f.vx = 0;
      if (!f.shot && f.t >= m.startup) {
        f.shot = true;
        F.shots.push({ x: f.x + f.face * 0.7, y: f.y + 1.0, vx: f.face * 8.5, owner: f === F.p ? 'p' : 'o', face: f.face, t: 0, dmg: m.dmg * (f === F.o ? F.def.dmg : 1) });
        emit(F, 'fire');
      }
      if (f.t >= m.startup + m.recover) setState(f, grounded(f) ? 'idle' : 'jump');
    } else {
      if (f.state === 'spin') f.vx = f.face * (f.t < m.startup + m.active ? 5.5 : 0);
      else if (f.state === 'uppercut') f.vx = f.face * 1.2;
      else if (grounded(f)) f.vx = 0;
      const t0 = m.startup;
      const t1 = m.startup + m.active;
      if (f.t >= t0 && f.t < t1) strike(F, f, foe, m);
      if (f.t >= t1 + m.recover) setState(f, grounded(f) ? 'idle' : 'jump');
    }
  }

  // Facing and physics
  if (grounded(f) && (f.state === 'idle' || f.state === 'walk' || f.state === 'block')) f.face = foe.x >= f.x ? 1 : -1;
  if (!grounded(f) || f.vy > 0) {
    f.vy -= GRAVITY * dt;
    f.y += f.vy * dt;
    if (f.y <= 0) {
      f.y = 0;
      f.vy = 0;
      if (f.state === 'jump') {
        setState(f, 'idle');
        f.vx = 0;
      }
      if (f.state === 'hit' || f.state === 'down' || f.state === 'ko') f.vx *= 0.3;
    }
  }
  if (isDown || f.state === 'hit') f.vx *= Math.max(0, 1 - 5 * dt);
  f.x = clamp(f.x + f.vx * dt, WALL, ARENA_W - WALL);
  if (f.state === 'getup' || f.state === 'idle') f.vx = 0;
}

// Keep the two fighters from standing inside each other (unless one is in the air)
function separate(F) {
  const { p, o } = F;
  if (p.y > 1.1 || o.y > 1.1) return;
  const d = o.x - p.x;
  if (Math.abs(d) < 0.75) {
    const push = (0.75 - Math.abs(d)) / 2;
    const s = d >= 0 ? 1 : -1;
    p.x = clamp(p.x - s * push, WALL, ARENA_W - WALL);
    o.x = clamp(o.x + s * push, WALL, ARENA_W - WALL);
  }
}

function strike(F, att, def, m) {
  const x0 = att.face > 0 ? att.x + 0.2 : att.x - 0.2 - m.reach;
  const box = { x: x0, w: m.reach, y: att.y + m.y0, h: m.y1 - m.y0 };
  if (att.state === 'spin') {
    // three separate hits across the spin
    const slot = Math.min(m.hits - 1, Math.floor((att.t - m.startup) / (m.active / m.hits)));
    if (slot < att.spinHits) return;
    att.spinHits = slot + 1;
    att.hitSet = null;
    box.x = att.x - m.reach / 2;
    box.w = m.reach;
  }
  if (att.hitSet) return;
  const hurt = { x: def.x - BODY_W / 2, w: BODY_W, y: def.y, h: BODY_H };
  if (box.x < hurt.x + hurt.w && box.x + box.w > hurt.x && box.y < hurt.y + hurt.h && box.y + box.h > hurt.y) {
    if (att.state !== 'spin') att.hitSet = true;
    landHit(F, att, def, m);
  }
}

export function landHit(F, att, def, m, dmgOverride) {
  if (def.inv > 0 || def.state === 'ko' || def.state === 'dizzy' || def.state === 'fatal') return false;
  if (def.state === 'down' || def.state === 'getup') return false;
  let dmg = (dmgOverride ?? m.dmg) * (att === F.o ? F.def.dmg : 1);
  const facing = def.face === -att.face;
  if (def.state === 'block' && facing && grounded(def)) {
    dmg = Math.max(1, Math.round(dmg * 0.15));
    def.hp = Math.max(1, def.hp - dmg);
    def.x = clamp(def.x + att.face * 0.3, WALL, ARENA_W - WALL);
    emit(F, 'block');
    return false;
  }
  def.hp = Math.max(0, def.hp - dmg);
  def.flash = 0.2;
  F.hitStop = 0.06;
  F.shake = 0.15;
  const knock = m.knock || def.hp <= 0 || m === MOVES.kick && def.y > 0;
  if (def.hp <= 0) {
    setState(def, 'ko');
    def.vy = 7;
    def.vx = att.face * 4;
  } else if (knock) {
    setState(def, 'down');
    def.vy = 6;
    def.vx = att.face * 3.5;
    emit(F, 'slam');
  } else {
    setState(def, 'hit');
    def.stun = m.stun;
    def.vx = att.face * (m.push ?? 0.5) * 3;
    emit(F, 'hit');
  }
  emit(F, att.state === 'kick' || att.state === 'spin' ? 'kick' : 'punch');
  return true;
}

function stepShots(F, dt) {
  for (const s of F.shots) {
    s.t += dt;
    s.x += s.vx * dt;
    const tgt = s.owner === 'p' ? F.o : F.p;
    const shooter = s.owner === 'p' ? F.p : F.o;
    if (s.x < -1 || s.x > ARENA_W + 1) s.dead = true;
    if (!s.dead && Math.abs(s.x - tgt.x) < 0.55 && s.y > tgt.y && s.y < tgt.y + BODY_H) {
      s.dead = true;
      landHit(F, shooter, tgt, { dmg: s.dmg, stun: 0.45, push: 1.4, knock: false }, s.dmg);
      emit(F, 'boom');
    }
  }
  // fireballs cancel each other out
  for (const a of F.shots) {
    for (const b of F.shots) if (a !== b && !a.dead && !b.dead && a.owner !== b.owner && Math.abs(a.x - b.x) < 0.6) a.dead = b.dead = true;
  }
  F.shots = F.shots.filter((s) => !s.dead);
}

// The computer opponents
function aiIntent(F, dt) {
  const o = F.o;
  const p = F.p;
  const def = F.def;
  const ai = o.ai;
  ai.t -= dt;
  const intent = { dir: 0, punch: false, kick: false, special: false, jump: false, block: false };
  const toward = p.x >= o.x ? 1 : -1;
  const d = Math.abs(p.x - o.x);
  if (ai.holdT > 0) {
    ai.holdT -= dt;
    Object.assign(intent, ai.hold);
    if (ai.holdT <= 0) ai.hold = null;
  }
  if (ai.t <= 0 && free(o) && o.state !== 'jump') {
    ai.t = def.react * (0.6 + F.rng() * 0.8);
    const r = F.rng();
    const threat = (p.state === 'punch' || p.state === 'kick' || p.state === 'spin' || p.state === 'fireball') && d < 2.2;
    let plan = null;
    if (threat && r < def.block) plan = { hold: { block: true }, holdT: 0.35 };
    else if (d > 6.5) {
      if (def.fire && o.cd.fire <= 0 && r < def.fire + 0.2) plan = { once: { special: true, dir: 0 } };
      else plan = { hold: { dir: toward }, holdT: 0.4 };
    } else if (d > 2.4) {
      if (def.spin && o.cd.spin <= 0 && d < 4 && r < def.aggr * 0.4) plan = { once: { special: true, dir: toward } };
      else if (def.fire && o.cd.fire <= 0 && r < def.fire * 0.5) plan = { once: { special: true, dir: 0 } };
      else if (r < def.aggr * 0.25) plan = { once: { jump: true, dir: toward, kick: false } };
      else if (r < 0.8) plan = { hold: { dir: toward }, holdT: 0.3 };
    } else {
      if (def.up && o.cd.up <= 0 && p.y > 0.6 && r < 0.7) plan = { once: { special: true, dir: -toward } };
      else if (r < def.aggr * 0.55) plan = { once: { punch: true } };
      else if (r < def.aggr * 1.0) plan = { once: { kick: true } };
      else if (r < def.aggr * 1.0 + 0.15) plan = { hold: { dir: -toward }, holdT: 0.35 };
      else plan = { hold: { block: true }, holdT: 0.3 };
    }
    if (plan) {
      if (plan.hold) {
        ai.hold = plan.hold;
        ai.holdT = plan.holdT;
        Object.assign(intent, plan.hold);
      }
      if (plan.once) Object.assign(intent, plan.once);
    }
  }
  o.canFire = !!def.fire;
  o.canSpin = !!def.spin;
  o.canUp = !!def.up;
  return intent;
}

function playerIntent(F, input) {
  const prev = F.prev;
  const intent = {
    dir: (input.right ? 1 : 0) - (input.left ? 1 : 0),
    punch: !!input.throw && !prev.punch,
    kick: !!input.rush && !prev.kick,
    special: !!input.baz && !prev.special,
    jump: !!input.jump && !prev.jump,
    block: !!input.shield,
  };
  prev.punch = !!input.throw;
  prev.kick = !!input.rush;
  prev.special = !!input.baz;
  prev.jump = !!input.jump;
  return intent;
}

const NO_INTENT = { dir: 0, punch: false, kick: false, special: false, jump: false, block: false };

// Advances the whole match. Returns 'won' once the opponent is beaten (and the fatality, if any, is over).
export function stepFight(F, input, dt) {
  F.t += dt;
  F.shake = Math.max(0, F.shake - dt);
  if (F.hitStop > 0) {
    F.hitStop -= dt;
    playerIntent(F, input);
    return F.done;
  }
  const pi = playerIntent(F, input);
  const p = F.p;
  const o = F.o;
  switch (F.phase) {
    case 'intro': {
      p.canFire = p.canSpin = p.canUp = true;
      act(F, p, o, NO_INTENT, dt);
      act(F, o, p, NO_INTENT, dt);
      if (F.t >= 1.5 && F.text !== 'FIGHT!') {
        F.text = 'FIGHT!';
        emit(F, 'round');
      }
      if (F.t >= 2.1) {
        F.phase = 'fight';
        F.t = 0;
        F.text = null;
      }
      break;
    }
    case 'fight': {
      p.canFire = p.canSpin = p.canUp = true;
      act(F, p, o, pi, dt);
      act(F, o, p, aiIntent(F, dt), dt);
      separate(F);
      stepShots(F, dt);
      F.timer -= dt;
      const koP = p.hp <= 0;
      const koO = o.hp <= 0;
      if (koP || koO || F.timer <= 0) {
        const byKo = koP || koO;
        F.roundWinner = koO && !koP ? 'p' : koP && !koO ? 'o' : koP && koO ? 'o' : p.hp > o.hp ? 'p' : 'o';
        F.wins[F.roundWinner]++;
        F.shots = [];
        F.t = 0;
        F.byKo = byKo;
        emit(F, 'ko');
        if (F.roundWinner === 'p' && F.wins.p >= ROUNDS_TO_WIN && byKo) {
          F.phase = 'finish';
          F.finishT = FINISH_TIME;
          F.seq = [];
          o.hp = 0;
          o.state = 'ko';
          F.text = 'FINISH HIM!';
        } else {
          F.phase = 'ko';
          F.text = byKo ? 'K.O.!' : 'TIME!';
        }
      }
      break;
    }
    case 'ko': {
      act(F, p, o, NO_INTENT, dt);
      act(F, o, p, NO_INTENT, dt);
      stepShots(F, dt);
      if (F.t >= 2.4) {
        if (F.wins.p >= ROUNDS_TO_WIN) {
          F.phase = 'won';
        } else if (F.wins.o >= ROUNDS_TO_WIN) {
          F.phase = 'lost';
        } else {
          F.round++;
          resetRound(F);
        }
      }
      break;
    }
    case 'finish': {
      // The loser kneels, dazed. Two button presses in a row do a fatality; or let the time run out.
      o.state = 'dizzy';
      o.vx = 0;
      o.y = 0;
      o.vy = 0;
      p.canFire = p.canSpin = p.canUp = false;
      act(F, p, o, { ...NO_INTENT, dir: pi.dir, jump: pi.jump }, dt);
      F.finishT -= dt;
      for (const b of ['punch', 'kick', 'special']) {
        if (pi[b]) {
          F.seq.push({ b, t: F.t });
          if (F.seq.length > 2) F.seq.shift();
          emit(F, 'press');
        }
      }
      if (F.seq.length === 2 && F.seq[1].t - F.seq[0].t < 1.2) {
        const hit = Object.entries(FATALITIES).find(([, fx]) => fx.seq[0] === F.seq[0].b && fx.seq[1] === F.seq[1].b);
        if (hit) {
          F.fatality = hit[0];
          F.phase = 'fatality';
          F.t = 0;
          F.text = FATALITIES[hit[0]].name + '!';
          o.state = 'fatal';
          emit(F, 'fatality');
          break;
        }
      }
      if (F.finishT <= 0) {
        F.phase = 'ko';
        F.t = 1.2;
        F.text = 'K.O.!';
        o.state = 'ko';
      }
      break;
    }
    case 'fatality': {
      act(F, p, o, NO_INTENT, dt);
      if (F.t >= FATALITY_TIME) F.phase = 'won';
      break;
    }
    case 'won':
      F.done = 'won';
      break;
    case 'lost':
      F.done = 'lost';
      break;
    default:
      break;
  }
  return F.done;
}

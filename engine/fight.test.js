import test from 'node:test';
import assert from 'node:assert/strict';
import { createFight, stepFight, MOVES, FATALITIES, OPPONENTS, ROUNDS_TO_WIN } from './fight.js';
import { createGame, createGameAt, step, STEP, startPlaying, advanceScene, loadLevel } from './game.js';
import { SCENES } from './story.js';
import { levelForCode } from './cheats.js';

const none = { left: false, right: false, jump: false };
const runF = (F, inp, secs) => {
  for (let i = 0; i < Math.round(secs / STEP); i++) stepFight(F, typeof inp === 'function' ? inp(F) : inp, STEP);
};
const fighting = (idx = 0) => {
  const F = createFight(idx);
  runF(F, none, 2.2);
  assert.equal(F.phase, 'fight');
  return F;
};
const tap = (F, key, after = 0.6) => {
  stepFight(F, { ...none, [key]: true }, STEP);
  stepFight(F, none, STEP);
  runF(F, none, after);
};
// Stop the computer from doing anything so the move under test is the only thing happening
const passive = (F) => {
  F.o.ai.t = 1e9;
};

test('a match starts with ROUND 1 / FIGHT and then hands over control', () => {
  const F = createFight(0);
  assert.equal(F.phase, 'intro');
  assert.equal(F.text, 'ROUND 1');
  runF(F, none, 1.7);
  assert.equal(F.text, 'FIGHT!');
  runF(F, none, 0.6);
  assert.equal(F.phase, 'fight');
});

test('billy walks, jumps and turns to face his opponent', () => {
  const F = fighting();
  passive(F);
  const x0 = F.p.x;
  runF(F, { ...none, right: true }, 0.4);
  assert.ok(F.p.x > x0 + 1);
  runF(F, { ...none, jump: true }, 0.2);
  assert.ok(F.p.y > 0.5, 'in the air');
  runF(F, none, 1.2);
  assert.equal(F.p.y, 0);
  assert.equal(F.p.face, 1);
});

test('punch and kick hit up close, kick hits harder and reaches farther', () => {
  const a = fighting();
  passive(a);
  a.o.x = a.p.x + 1.0;
  const hp0 = a.o.hp;
  tap(a, 'throw');
  assert.equal(hp0 - a.o.hp, MOVES.punch.dmg);
  const b = fighting();
  passive(b);
  b.o.x = b.p.x + 2.4;
  tap(b, 'throw');
  assert.equal(b.o.hp, b.o.maxHp, 'out of punch range');
  tap(b, 'rush');
  assert.ok(b.o.hp < b.o.maxHp, 'kick reaches');
  assert.ok(MOVES.kick.reach > MOVES.punch.reach * 1.3);
  assert.ok(b.o.maxHp - b.o.hp >= MOVES.kick.dmg - 0.1);
});

test('blocking soaks up almost all of the damage', () => {
  const F = fighting();
  passive(F);
  F.o.x = F.p.x + 1;
  F.o.face = -1;
  runF(F, { ...none, shield: true }, 0.1);
  // the opponent punches the blocking player
  F.o.ai.t = 1e9;
  stepFight(F, { ...none, shield: true }, STEP);
  F.o.state = 'punch';
  F.o.t = 0;
  F.o.hitSet = null;
  runF(F, { ...none, shield: true }, 0.4);
  assert.ok(F.p.hp >= F.p.maxHp - 2, `blocked hp ${F.p.hp}`);
});

test('the fireball travels across the arena and hurts, but only once every so often', () => {
  const F = fighting();
  passive(F);
  F.o.x = 12;
  tap(F, 'baz', 0.35);
  assert.equal(F.shots.length, 1);
  tap(F, 'baz', 0.2);
  assert.equal(F.shots.length, 1, 'a second fireball is on cooldown');
  runF(F, none, 1.2);
  assert.ok(F.o.hp < F.o.maxHp);
  assert.equal(F.shots.length, 0);
});

test('special + forward is a spinning kick that can hit several times', () => {
  const F = fighting();
  passive(F);
  F.o.x = F.p.x + 1.2;
  F.o.hp = 300;
  F.o.maxHp = 300;
  stepFight(F, { ...none, right: true, baz: true }, STEP);
  assert.equal(F.p.state, 'spin');
  runF(F, { ...none, right: true }, 0.9);
  assert.ok(300 - F.o.hp >= MOVES.spin.dmg * 2, `spin did ${300 - F.o.hp}`);
});

test('special + back is an uppercut that is invulnerable at the start and launches the foe', () => {
  const F = fighting();
  passive(F);
  F.o.x = F.p.x + 0.9;
  stepFight(F, { ...none, left: true, baz: true }, STEP);
  assert.equal(F.p.state, 'uppercut');
  assert.ok(F.p.inv > 0);
  runF(F, none, 0.5);
  assert.ok(F.o.hp < F.o.maxHp);
  assert.ok(F.o.state === 'down' || F.o.state === 'hit' || F.o.state === 'getup');
});

test('knocked-down fighters get up again, and cannot be hit while down', () => {
  const F = fighting();
  passive(F);
  F.o.x = F.p.x + 0.9;
  stepFight(F, { ...none, left: true, baz: true }, STEP);
  runF(F, none, 0.5);
  const hp = F.o.hp;
  assert.equal(F.o.state, 'down');
  F.o.x = F.p.x + 1;
  tap(F, 'throw', 0.1);
  assert.equal(F.o.hp, hp, 'no hits on a downed fighter');
  runF(F, none, 1.5);
  assert.equal(F.o.state, 'idle');
});

test('the computer fights back and hurts a player who just stands there', () => {
  for (let idx = 0; idx < OPPONENTS.length; idx++) {
    const F = fighting(idx);
    runF(F, none, 20);
    assert.ok(F.p.hp < F.p.maxHp || F.wins.o > 0, `opponent ${idx} never landed a hit`);
  }
});

// A little bot: walk in, mash punch and kick, block when the opponent swings, fireball from range
const bot = (F) => {
  const d = Math.abs(F.o.x - F.p.x);
  const t = Math.floor(F.t * 60);
  const toward = F.o.x > F.p.x;
  const threat = ['punch', 'kick', 'spin'].includes(F.o.state) && d < 2.6;
  return {
    left: !toward && d > 1.8 && !threat,
    right: toward && d > 1.8 && !threat,
    jump: false,
    throw: d < 1.6 && t % 14 === 0,
    rush: d < 2.3 && t % 14 === 7,
    baz: d > 5 && t % 80 === 0,
    shield: threat,
  };
};

test('every opponent can be beaten by a simple bot, and a fatality window opens at the end', () => {
  for (let idx = 0; idx < OPPONENTS.length; idx++) {
    const F = createFight(idx, { hpBonus: 24 });
    let guard = 0;
    while (F.phase !== 'finish' && F.phase !== 'lost' && guard++ < 60 * 400) stepFight(F, bot(F), STEP);
    assert.equal(F.phase, 'finish', `opponent ${idx}: ${F.phase}, rounds ${JSON.stringify(F.wins)}`);
    runF(F, none, 0.2);
    assert.equal(F.o.state, 'dizzy');
    assert.equal(F.text, 'FINISH HIM!');
    assert.equal(F.wins.p, ROUNDS_TO_WIN);
  }
});

test('each fatality is two button presses, plays out, and then the match is won', () => {
  for (const [id, fx] of Object.entries(FATALITIES)) {
    const F = createFight(0);
    F.phase = 'finish';
    F.finishT = 7;
    F.t = 0;
    F.wins.p = 2;
    F.o.hp = 0;
    const key = { punch: 'throw', kick: 'rush', special: 'baz' };
    stepFight(F, { ...none, [key[fx.seq[0]]]: true }, STEP);
    stepFight(F, none, STEP);
    assert.equal(F.phase, 'finish', 'one press is not enough');
    runF(F, none, 0.2);
    stepFight(F, { ...none, [key[fx.seq[1]]]: true }, STEP);
    assert.equal(F.phase, 'fatality', id);
    assert.equal(F.fatality, id);
    runF(F, none, 4);
    assert.equal(F.phase, 'won');
  }
});

test('waiting too long between presses, or doing nothing, skips the fatality', () => {
  const F = createFight(0);
  F.phase = 'finish';
  F.finishT = 7;
  F.t = 0;
  F.wins.p = 2;
  stepFight(F, { ...none, throw: true }, STEP);
  stepFight(F, none, STEP);
  runF(F, none, 1.6);
  stepFight(F, { ...none, rush: true }, STEP);
  assert.equal(F.phase, 'finish', 'too slow');
  runF(F, none, 8);
  assert.notEqual(F.phase, 'fatality');
  runF(F, none, 3);
  assert.equal(F.phase, 'won');
});

test('losing a round, the timer, and best of three', () => {
  const F = fighting();
  passive(F);
  F.timer = 0.05;
  F.o.hp = F.o.maxHp;
  F.p.hp = 50;
  runF(F, none, 0.2);
  assert.equal(F.roundWinner, 'o');
  assert.equal(F.text, 'TIME!');
  runF(F, none, 3);
  assert.equal(F.round, 2);
  assert.equal(F.phase, 'intro');
  assert.equal(F.p.hp, F.p.maxHp, 'health refills for the next round');
  runF(F, none, 2.2);
  passive(F);
  F.p.hp = 0;
  runF(F, none, 0.1);
  assert.equal(F.wins.o, 2);
  runF(F, none, 3);
  assert.equal(F.phase, 'lost');
});

// ---- Level 9 inside the game ----
const startFight = () => {
  const g = createGame({ level: 9 });
  startPlaying(g);
  return g;
};

test('level 9 is the cage match, with its own code, reached from the Queen scene', () => {
  assert.equal(levelForCode('1999'), 9);
  const g = createGameAt(9);
  assert.equal(g.level.kind, 'fight');
  assert.ok(g.fight);
  startPlaying(g);
  step(g, none);
  assert.equal(g.mode, 'playing');
});

test('winning a fight moves on to the next opponent; the last win plays the champion scene and leads to the penguin race', () => {
  const g = startFight();
  const win = (g2) => {
    const F = g2.fight;
    F.phase = 'won';
    step(g2, none);
  };
  assert.equal(g.fight.def.id, 'cletus');
  win(g);
  assert.equal(g.fight.def.id, 'mae');
  win(g);
  assert.equal(g.fight.def.id, 'jinxy');
  const before = g.score;
  win(g);
  assert.ok(g.score > before);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'champion');
  for (let i = 0; i < SCENES.champion.lines.length; i++) advanceScene(g);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'penguinRace');
  for (let i = 0; i < SCENES.penguinRace.lines.length; i++) advanceScene(g);
  assert.equal(g.levelNo, 10);
});

test('losing a match costs a life and gives you a rematch with the same opponent; no lives is game over', () => {
  const g = startFight();
  g.fightIdx = 1;
  g.fight = createFight(1);
  g.lives = 2;
  g.fight.phase = 'lost';
  step(g, none);
  assert.equal(g.mode, 'dying');
  for (let i = 0; i < 100; i++) step(g, none);
  assert.equal(g.lives, 1);
  assert.equal(g.mode, 'playing');
  assert.equal(g.fight.def.id, 'mae');
  assert.equal(g.fight.wins.o, 0);
  g.fight.phase = 'lost';
  step(g, none);
  for (let i = 0; i < 100; i++) step(g, none);
  assert.equal(g.mode, 'gameover');
});

test('gear gives you extra health in the cage', () => {
  const plain = createGame({ level: 9 });
  const geared = createGameAt(9);
  assert.ok(geared.fight.p.maxHp > plain.fight.p.maxHp);
});

test('fight events reach the sound system', () => {
  const g = startFight();
  for (let i = 0; i < 200; i++) step(g, none);
  assert.ok(g.events.includes('round'));
});

test('you can steer in mid-air and keep walking while swinging', () => {
  const F = fighting();
  passive(F);
  F.o.x = 14;
  tap(F, 'jump', 0);
  runF(F, { ...none, jump: false, right: true }, 0.3);
  const x1 = F.p.x;
  runF(F, { ...none, left: true }, 0.3);
  assert.ok(F.p.x < x1, 'changed direction in the air');
  runF(F, none, 1);
  const x0 = F.p.x;
  stepFight(F, { ...none, right: true, throw: true }, STEP);
  runF(F, { ...none, right: true }, 0.2);
  assert.ok(F.p.x > x0 + 0.2, 'walked while punching');
});

test('opponents mix up their attacks instead of chaining the same one', () => {
  for (let idx = 0; idx < OPPONENTS.length; idx++) {
    const F = fighting(idx);
    const seq = [];
    const times = [];
    let last = F.o.state;
    // an unmoving, unhittable target stands right in front of the opponent
    for (let i = 0; i < 60 * 40; i++) {
      F.p.hp = F.p.maxHp;
      F.o.hp = F.o.maxHp;
      F.p.inv = 1;
      F.p.x = Math.min(F.p.x, 10);
      stepFight(F, none, STEP);
      if (['punch', 'kick', 'spin', 'fireball', 'uppercut'].includes(F.o.state) && F.o.state !== last) {
        seq.push(F.o.state);
        times.push(F.t);
      }
      last = F.o.state;
      if (F.phase !== 'fight') break;
    }
    assert.ok(seq.length >= 4, `opponent ${idx} attacked ${seq.length} times`);
    let run = 1;
    let maxRun = 1;
    for (let i = 1; i < seq.length; i++) {
      run = seq[i] === seq[i - 1] && times[i] - times[i - 1] < 1.5 ? run + 1 : 1; // the same move again, quickly
      maxRun = Math.max(maxRun, run);
    }
    assert.ok(maxRun <= 2, `opponent ${idx} chained ${maxRun} of the same move: ${seq.join(',')}`);
    if (idx > 0) assert.ok(new Set(seq).size >= 2, `opponent ${idx} only used ${[...new Set(seq)]}`);
  }
});

test('there is a real pause between opponent attacks', () => {
  const F = fighting(2);
  let t0 = null;
  const gaps = [];
  let last = '';
  for (let i = 0; i < 60 * 40 && F.phase === 'fight'; i++) {
    F.p.hp = F.p.maxHp;
    F.p.inv = 1;
    stepFight(F, none, STEP);
    const atk = ['punch', 'kick', 'spin', 'uppercut'].includes(F.o.state);
    if (atk && !['punch', 'kick', 'spin', 'uppercut'].includes(last)) {
      if (t0 !== null) gaps.push(F.t - t0);
      t0 = F.t;
    }
    last = F.o.state;
  }
  assert.ok(gaps.length >= 3);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  assert.ok(avg > 1.0, `average gap between attacks ${avg.toFixed(2)}s`);
});

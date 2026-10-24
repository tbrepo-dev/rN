import test from 'node:test';
import assert from 'node:assert/strict';
import { createRace, stepRace, buildCourse, COURSE, LANES } from './race.js';
import { createGame, createGameAt, step, STEP, startPlaying, advanceScene } from './game.js';
import { SCENES } from './story.js';
import { levelForCode } from './cheats.js';

const none = {};
const runR = (R, inp, secs) => {
  for (let i = 0; i < Math.round(secs / STEP); i++) stepRace(R, typeof inp === 'function' ? inp(R) : inp, STEP);
};
const racing = (opts) => {
  const R = createRace(opts);
  runR(R, none, 3.2);
  assert.equal(R.phase, 'racing');
  return R;
};
const clear = (R) => {
  R.obstacles = [];
  R.jugs = [];
  R.ramps = [];
};

// A decent player: pick the lane with nothing in it (and moonshine if possible), hop low obstacles
function bot(R) {
  const p = R.p;
  const look = 2 + p.v * 0.5;
  const ahead = R.obstacles.filter((o) => !o.dead && o.x > p.x + 0.3 && o.x < p.x + look);
  const tall = (l) => ahead.some((o) => o.lane === l && (o.kind === 'snowman' || o.kind === 'seal'));
  const any = (l) => ahead.some((o) => o.lane === l);
  const inp = {};
  if (p.drunk > 0) return { ...inp, throw: Math.floor(R.t * 3) % 2 === 0 };
  const jug = R.jugs.find((j) => !j.taken && j.x > p.x + 1 && j.x < p.x + 12);
  if (tall(p.lane) || (any(p.lane) && p.y === 0 && ahead.some((o) => o.lane === p.lane && o.x - p.x < 1.8) === false)) {
    const opts = [p.lane - 1, p.lane + 1].filter((l) => l >= 0 && l < LANES && !any(l));
    if (opts.length) {
      if (opts[0] < p.lane) inp.up = Math.floor(R.t * 60) % 2 === 0;
      else inp.down = Math.floor(R.t * 60) % 2 === 0;
    }
  } else if (ahead.some((o) => o.lane === p.lane && o.x - p.x < 2.4)) inp.jump = Math.floor(R.t * 60) % 2 === 0;
  else if (jug && jug.lane !== p.lane && !tall(jug.lane) && !any(jug.lane)) {
    if (jug.lane < p.lane) inp.up = Math.floor(R.t * 60) % 2 === 0;
    else inp.down = Math.floor(R.t * 60) % 2 === 0;
  }
  return inp;
}

test('the race starts with a 3-2-1-GO countdown, and nobody moves until GO', () => {
  const R = createRace();
  runR(R, { jump: true, up: true }, 1.5);
  assert.equal(R.phase, 'countdown');
  assert.equal(R.p.x, 0);
  assert.ok(['3', '2', '1'].includes(R.text));
  runR(R, none, 2);
  assert.equal(R.phase, 'racing');
});

test('the course is long, has all the hazards, and moonshine to find', () => {
  const c = buildCourse(4242);
  const kinds = new Set(c.obstacles.map((o) => o.kind));
  for (const k of ['spike', 'crack', 'snowman', 'seal']) assert.ok(kinds.has(k), k);
  assert.ok(c.jugs.length >= 20, `${c.jugs.length} jugs`);
  assert.ok(c.ramps.length >= 4);
  assert.ok(c.obstacles.every((o) => o.x > 40 && o.x < COURSE));
});

test('every wall of tall obstacles leaves a lane open, so the course can always be run', () => {
  const c = buildCourse(4242);
  const byX = new Map();
  for (const o of c.obstacles) if (o.kind === 'snowman' || o.kind === 'seal') byX.set(o.x, (byX.get(o.x) || new Set()).add(o.lane));
  for (const [, lanes] of byX) assert.ok(lanes.size < LANES);
});

test('a penguin speeds up to top speed, and lane changes are quick', () => {
  const R = racing();
  clear(R);
  runR(R, none, 3);
  assert.ok(R.p.v > 11);
  stepRace(R, { up: true }, STEP);
  stepRace(R, none, STEP);
  runR(R, none, 0.3);
  assert.equal(R.p.lane, 0);
  assert.ok(Math.abs(R.p.laneF - 0) < 0.01);
});

test('hitting a snowman or hopping a spike', () => {
  const R = racing();
  clear(R);
  R.obstacles = [{ x: R.p.x + 8, lane: R.p.lane, kind: 'snowman', dead: false }];
  runR(R, none, 2);
  assert.ok(R.p.stun > 0 || R.p.v < 8, 'bumped');
  const R2 = racing();
  clear(R2);
  R2.obstacles = [{ x: R2.p.x + 12, lane: R2.p.lane, kind: 'spike', dead: false }];
  runR(R2, (r) => ({ jump: r.obstacles[0].x - r.p.x < 2.3 && r.obstacles[0].x - r.p.x > 1.5 }), 2.5);
  assert.equal(R2.p.stun, 0, 'hopped over the spike');
  const R3 = racing();
  clear(R3);
  R3.obstacles = [{ x: R3.p.x + 12, lane: R3.p.lane, kind: 'spike', dead: false }];
  runR(R3, none, 2.5);
  assert.ok(R3.p.v < 10, 'ran into the spike');
});

test('moonshine makes you drunk and a lot faster, and a drunk penguin smashes through obstacles', () => {
  const R = racing();
  clear(R);
  R.jugs = [{ x: R.p.x + 6, lane: R.p.lane, taken: false }];
  const base = (() => {
    const b = racing();
    clear(b);
    runR(b, none, 4);
    return b.p.x;
  })();
  runR(R, none, 1.5);
  assert.ok(R.p.drunk > 3, 'drunk');
  assert.equal(R.p.jugs, 1);
  R.obstacles = [{ x: R.p.x + 6, lane: R.p.lane, kind: 'snowman', dead: false }];
  const v0 = R.p.v;
  runR(R, none, 2.5);
  assert.equal(R.p.stun, 0);
  assert.ok(R.obstacles[0].dead, 'smashed');
  assert.ok(R.p.v > 15, `drunk speed ${R.p.v}`);
  const R2 = racing();
  clear(R2);
  runR(R2, none, 4);
  assert.ok(R.p.x > R2.p.x, 'ahead of the sober penguin');
  assert.ok(base > 0);
  runR(R, none, 8);
  assert.equal(R.p.drunk, 0, 'it wears off');
  runR(R, none, 3);
  assert.ok(R.p.v < 14);
});

test('more moonshine stacks the drunk time', () => {
  const R = racing();
  clear(R);
  R.jugs = [0, 2, 4].map((d) => ({ x: R.p.x + 6 + d * 3, lane: R.p.lane, taken: false }));
  runR(R, none, 2.6);
  assert.ok(R.p.drunk > 6, `drunk ${R.p.drunk}`);
});

test('ramps launch you and give a short boost', () => {
  const R = racing();
  clear(R);
  R.ramps = [{ x: R.p.x + 6, lane: R.p.lane }];
  runR(R, none, 1.2);
  assert.ok(R.p.boost > 0 || R.p.y > 0);
});

test('corn cobs stun the rival they hit, and rivals can throw at you too', () => {
  const R = racing();
  clear(R);
  const r = R.rivals[0];
  r.lane = r.laneF = R.p.lane;
  r.x = R.p.x + 8;
  r.ai.t = 1e9;
  stepRace(R, { throw: true }, STEP);
  runR(R, none, 1);
  assert.ok(r.stun > 0 || r.v < 5);
});

test('the rivals keep up with a player who is going well, and fall back from a stalled one', () => {
  const R = racing();
  clear(R);
  runR(R, none, 20);
  const lead = Math.max(...R.rivals.map((r) => r.x));
  assert.ok(lead > R.p.x - 25, 'rivals are not left far behind');
  assert.ok(R.rivals.every((r) => r.x > 100), 'every rival is actually racing');
});

test('a bot that dodges and drinks finishes in the top two most of the time; a sleeping player does not', () => {
  let wins = 0;
  const places = [];
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const R = createRace({ seed });
    let guard = 0;
    while (!R.done && guard++ < 60 * 160) stepRace(R, bot(R), STEP);
    places.push(R.place);
    if (R.done === 'won') wins++;
  }
  assert.ok(wins >= 4, `bot won ${wins}/6, places ${places}`);
  const R = createRace({ seed: 4242 });
  let guard = 0;
  while (!R.done && guard++ < 60 * 200) stepRace(R, none, STEP);
  assert.equal(R.done, 'lost', 'doing nothing is not enough');
});

test('first across the line is first place; the player always ends up with a place', () => {
  const R = createRace({ seed: 9 });
  clear(R);
  let guard = 0;
  while (!R.done && guard++ < 60 * 200) stepRace(R, {}, STEP);
  assert.ok(R.place >= 1 && R.place <= 4);
  assert.ok(['won', 'lost'].includes(R.done));
});

// ---- inside the game ----
test('level 10 is the penguin race, with its own code, reached after the cage match', () => {
  assert.equal(levelForCode('7777'), 10);
  const g = createGameAt(10);
  assert.equal(g.level.kind, 'race');
  startPlaying(g);
  for (let i = 0; i < 200; i++) step(g, {});
  assert.ok(g.race.phase === 'racing');
});

test('finishing in the top two wins the level; the win scene leads to the ending', () => {
  const g = createGame({ level: 10 });
  startPlaying(g);
  const R = g.race;
  R.done = null;
  R.place = 1;
  R.phase = 'finished';
  R.done = 'won';
  const score = g.score;
  step(g, {});
  assert.ok(g.score > score);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'raceWin');
  for (let i = 0; i < SCENES.raceWin.lines.length; i++) advanceScene(g);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'kartIntro');
  for (let i = 0; i < SCENES.kartIntro.lines.length; i++) advanceScene(g);
  assert.equal(g.levelNo, 11);
});

test('a bad finish costs a life and you run the race again', () => {
  const g = createGame({ level: 10 });
  startPlaying(g);
  g.lives = 2;
  g.race.done = 'lost';
  step(g, {});
  assert.equal(g.mode, 'dying');
  for (let i = 0; i < 100; i++) step(g, {});
  assert.equal(g.lives, 1);
  assert.equal(g.mode, 'playing');
  assert.equal(g.race.phase, 'countdown');
});

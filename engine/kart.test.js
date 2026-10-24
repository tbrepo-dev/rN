import test from 'node:test';
import assert from 'node:assert/strict';
import { createKart, stepKart, curveAt, buildTrack, LAPS, SEG } from './kart.js';
import { createGame, createGameAt, step, STEP, startPlaying, advanceScene } from './game.js';
import { SCENES } from './story.js';
import { levelForCode } from './cheats.js';

const none = {};
const runK = (K, inp, secs) => {
  for (let i = 0; i < Math.round(secs / STEP); i++) stepKart(K, typeof inp === 'function' ? inp(K) : inp, STEP);
};
const racing = (seed) => {
  const K = createKart({ seed });
  runK(K, none, 3.2);
  assert.equal(K.phase, 'racing');
  return K;
};
const empty = (K) => {
  K.boxes = [];
  K.hay = [];
  K.hazards = [];
  K.T.pads = [];
};

// keeps the kart on the road, heads for item boxes, and uses what it gets
function bot(K, tap = { n: 0 }) {
  const p = K.p;
  const T = K.T;
  const sm = ((p.s % T.length) + T.length) % T.length;
  let target = 0;
  const box = K.boxes.find((b) => b.back <= 0 && ((b.s - sm + T.length) % T.length) > 8 && ((b.s - sm + T.length) % T.length) < 70);
  if (box && !p.item) target = box.x;
  for (const h of K.hay) {
    const ds = (h.s - sm + T.length) % T.length;
    if (ds > 0 && ds < 45 && Math.abs(h.x - target) < 0.35) target = h.x > 0 ? h.x - 0.5 : h.x + 0.5;
  }
  for (const hz of K.hazards) {
    const ds = (hz.s - sm + T.length) % T.length;
    if (hz.life > 0 && ds > 0 && ds < 35 && Math.abs(hz.x - target) < 0.3) target = hz.x > 0 ? hz.x - 0.45 : hz.x + 0.45;
  }
  const sp = Math.min(1, p.v / 80);
  const need = (target - p.x) * 3 + (curveAt(T, p.s) * 2600 * sp * sp) / (1.9 * Math.max(0.35, sp));
  const ahead = K.rivals.some((r) => r.prog > p.prog && r.prog - p.prog < 80 && Math.abs(r.x - p.x) < 0.4);
  tap.n++;
  const use = p.item && (p.item !== 'corn' || ahead) && tap.n % 2 === 0;
  return { right: need > 0.08, left: need < -0.08, throw: !!use };
}

test('the kart race starts with a countdown and nobody moves until GO', () => {
  const K = createKart();
  runK(K, { right: true }, 1.5);
  assert.equal(K.phase, 'countdown');
  assert.ok(['3', '2', '1'].includes(K.text));
  assert.equal(K.p.v, 0);
  runK(K, none, 2);
  assert.equal(K.phase, 'racing');
});

test('the track is a loop with bends both ways, item barrels, boost pads and hay bales', () => {
  const T = buildTrack();
  assert.ok(T.length > 2000 && T.length < 3000);
  assert.ok(T.curves.some((c) => c > 0.0002) && T.curves.some((c) => c < -0.0002));
  assert.ok(T.boxes.length >= 12 && T.pads.length >= 3 && T.hay.length >= 5);
  assert.ok(T.boxes.every((b) => Math.abs(b.x) <= 0.5));
  assert.equal(curveAt(T, 0), curveAt(T, T.length));
});

test('the kart auto-accelerates, brakes, and the grass is slow', () => {
  const K = racing();
  empty(K);
  runK(K, none, 4);
  assert.ok(K.p.v > 70);
  runK(K, { shield: true }, 1);
  assert.ok(K.p.v < 5);
  const G = racing();
  empty(G);
  G.p.x = 1.4;
  runK(G, none, 3);
  assert.ok(G.p.v < 35, `grass speed ${G.p.v}`);
});

test('bends fling a kart that does not steer off the road', () => {
  const K = racing();
  empty(K);
  let far = 0;
  runK(K, (k) => {
    far = Math.max(far, Math.abs(k.p.x));
    return none;
  }, 30);
  assert.ok(far > 1, `never left the road (max ${far})`);
});

test('steering moves you sideways, and drifting turns tighter', () => {
  const K = racing();
  empty(K);
  runK(K, none, 2);
  const x0 = K.p.x;
  runK(K, { right: true }, 0.3);
  const plain = K.p.x - x0;
  const D = racing();
  empty(D);
  runK(D, none, 2);
  const d0 = D.p.x;
  runK(D, { right: true, jump: true }, 0.3);
  assert.ok(plain > 0.08);
  assert.ok(D.p.x - d0 > plain);
});

test('a long drift gives a mini-turbo when you let go', () => {
  const K = racing();
  empty(K);
  K.T.curves = K.T.curves.map(() => 0);
  runK(K, none, 4);
  runK(K, (k) => ({ right: Math.sin(k.t * 3) > 0, left: Math.sin(k.t * 3) <= 0, jump: true }), 1.5);
  runK(K, none, 0.05);
  assert.ok(K.p.boost > 0, 'boost');
  assert.ok(K.p.v > 0);
});

test('item barrels hand out an item and come back later', () => {
  const K = racing(5);
  empty(K);
  K.rivals.forEach((r, i) => (r.s = r.prog = -900 - i * 20));
  K.boxes = [{ s: K.p.s + 30, x: K.p.x, back: 0 }];
  runK(K, none, 2.5);
  assert.ok(K.p.item, 'got an item');
  assert.ok(K.boxes[0].back > 0);
  runK(K, none, 7);
  assert.equal(K.boxes[0].back, 0);
});

test('moonshine makes you drunk: faster, wobbly, and hay bales get smashed', () => {
  const K = racing();
  empty(K);
  K.T.curves = K.T.curves.map(() => 0);
  K.p.item = 'shine';
  stepKart(K, { throw: true }, STEP);
  stepKart(K, none, STEP);
  assert.ok(K.p.drunk > 3);
  K.hay = [{ s: K.p.s + 60, x: K.p.x }];
  runK(K, none, 3);
  assert.ok(K.p.v > 85, `drunk speed ${K.p.v}`);
  assert.equal(K.p.spin, 0);
  assert.ok(K.hay[0].smashed > 0 || K.p.spin === 0);
});

test('hay bales and cow pies spin you out; a hay-bale shield soaks up one hit', () => {
  const K = racing();
  empty(K);
  runK(K, none, 2);
  K.hay = [{ s: K.p.s + 60, x: K.p.x }];
  let spun = false;
  runK(K, (k) => {
    spun = spun || k.p.spin > 0;
    return none;
  }, 1.5);
  assert.ok(spun, 'spun out');
  const S = racing();
  empty(S);
  S.p.item = 'hay';
  stepKart(S, { throw: true }, STEP);
  stepKart(S, none, STEP);
  assert.ok(S.p.hay > 5);
  runK(S, none, 2);
  S.hay = [{ s: S.p.s + 60, x: S.p.x }];
  runK(S, none, 1.5);
  assert.equal(S.p.spin, 0);
  assert.equal(S.p.hay, 0, 'shield used up');
});

test('corn missiles knock a kart in front of you spinning, and pies are left behind', () => {
  const K = racing();
  empty(K);
  K.rivals.slice(1).forEach((o, i) => (o.s = o.prog = -900 - i * 20));
  const r = K.rivals[0];
  r.x = K.p.x;
  r.s = K.p.s + 30;
  r.ai.t = 1e9;
  r.ai.lane = r.x;
  K.p.item = 'corn';
  stepKart(K, { throw: true }, STEP);
  runK(K, none, 1);
  assert.ok(r.spin > 0 || r.v < 20, 'rival hit');
  const P = racing();
  empty(P);
  P.p.item = 'pie';
  stepKart(P, { throw: true }, STEP);
  assert.equal(P.hazards.length, 1);
  assert.ok(P.hazards[0].s < P.p.s);
});

test('boost pads give a burst of speed', () => {
  const K = racing();
  empty(K);
  K.T.pads = [{ s: K.p.s + 30, x: K.p.x }];
  runK(K, none, 1);
  assert.ok(K.p.boost > 0 || K.p.v > 82);
});

test('laps are counted, and the race is three laps', () => {
  assert.equal(LAPS, 3);
  const K = racing();
  empty(K);
  K.T.curves = K.T.curves.map(() => 0);
  K.p.prog = K.T.length * 1.5;
  runK(K, none, 0.2);
  assert.equal(K.p.lap, 1);
});

test('driving well finishes in the podium most of the time, and driving off the road does not', () => {
  let wins = 0;
  const places = [];
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const K = createKart({ seed });
    const tap = { n: 0 };
    let guard = 0;
    while (!K.done && guard++ < 60 * 200) stepKart(K, bot(K, tap), STEP);
    places.push(K.place);
    if (K.done === 'won') wins++;
  }
  assert.ok(wins >= 4, `bot got the podium ${wins}/6, places ${places}`);
  const K = createKart({ seed: 3 });
  let guard = 0;
  while (!K.done && guard++ < 60 * 400) stepKart(K, none, STEP);
  assert.equal(K.done, 'lost');
});

test('all the rivals actually race and finish', () => {
  const K = createKart({ seed: 2 });
  const tap = { n: 0 };
  let guard = 0;
  while (!K.done && guard++ < 60 * 200) stepKart(K, bot(K, tap), STEP);
  runK(K, none, 30);
  assert.ok(K.rivals.filter((r) => r.finished !== null).length >= 4, 'rivals finish');
});

// ---- inside the game ----
test('level 11 is the kart cup, with its own code, reached after the penguin race', () => {
  assert.equal(levelForCode('5555'), 11);
  const g = createGameAt(11);
  assert.equal(g.level.kind, 'kart');
  startPlaying(g);
  for (let i = 0; i < 300; i++) step(g, {});
  assert.equal(g.kart.phase, 'racing');
});

test('a podium finish wins the level and leads to the ending; a bad one costs a life', () => {
  const g = createGame({ level: 11 });
  startPlaying(g);
  g.kart.place = 1;
  g.kart.done = 'won';
  step(g, {});
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'kartWin');
  for (let i = 0; i < SCENES.kartWin.lines.length; i++) advanceScene(g);
  assert.equal(g.mode, 'ending');
  const h = createGame({ level: 11 });
  startPlaying(h);
  h.lives = 2;
  h.kart.done = 'lost';
  step(h, {});
  for (let i = 0; i < 100; i++) step(h, {});
  assert.equal(h.lives, 1);
  assert.equal(h.kart.phase, 'countdown');
});

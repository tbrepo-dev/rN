import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, STEP, SMALL_H } from './game.js';
import { GROUND_Y, CRATE, USED } from './level.js';

const none = { left: false, right: false, jump: false };
const run = (g, input, secs) => {
  for (let i = 0; i < Math.round(secs / STEP); i++) step(g, typeof input === 'function' ? input(g) : input, STEP);
};

test('player settles on the ground', () => {
  const g = createGame({ enemies: false });
  run(g, none, 0.5);
  assert.ok(g.player.onGround);
  assert.ok(Math.abs(g.player.y + g.player.h - GROUND_Y) < 0.01);
});

test('full jump clears ~3.5 tiles but not 4', () => {
  const g = createGame({ enemies: false });
  run(g, none, 0.3);
  let top = g.player.y;
  run(g, () => {
    top = Math.min(top, g.player.y);
    return { ...none, jump: true };
  }, 1);
  const height = GROUND_Y - SMALL_H - top;
  assert.ok(height > 3.3 && height < 4, `jump height ${height}`);
});

test('double jump reaches blocks a single jump cannot', () => {
  const run1 = (second) => {
    const g = createGame({ enemies: false });
    run(g, none, 0.3);
    const startY = g.player.y;
    let top = startY;
    let t = 0;
    run(g, () => {
      top = Math.min(top, g.player.y);
      t += STEP;
      // hold the jump; when `second`, release then press again at the apex (~0.38s)
      const press = second ? t < 0.36 || (t > 0.4 && t < 0.9) : t < 0.9;
      return { ...none, jump: press };
    }, 1.4);
    return { height: startY - top, g };
  };
  const single = run1(false).height;
  const dbl = run1(true).height;
  assert.ok(dbl > single + 2, `single ${single} double ${dbl}`);
  assert.ok(dbl > 5.5, `double jump height ${dbl}`);
});

test('only one air jump until you land', () => {
  const g = createGame({ enemies: false });
  run(g, none, 0.3);
  let t = 0;
  let presses = [0.05, 0.3, 0.5, 0.7];
  let vyAfter = [];
  run(g, () => {
    t += STEP;
    return { ...none, jump: presses.some((p) => t > p && t < p + 0.05) };
  }, 0.8);
  assert.equal(g.player.airJumps, 0);
});

test('short tap jumps lower than held jump', () => {
  const g = createGame({ enemies: false });
  run(g, none, 0.3);
  const startY = g.player.y;
  let top = startY;
  let n = 0;
  run(g, () => {
    top = Math.min(top, g.player.y);
    return { ...none, jump: n++ < 3 };
  }, 1);
  assert.ok(startY - top < 2.5, `tap height ${startY - top}`);
});

test('stomping an enemy kills it and bounces', () => {
  const g = createGame();
  run(g, none, 0.3);
  const e = g.enemies[0];
  e.vx = 0;
  Object.assign(g.player, { x: e.x, y: e.y - 0.85, vy: 8 });
  e.dir = 0;
  step(g, none);
  assert.equal(e.alive, false);
  assert.ok(g.player.vy < 0);
  assert.equal(g.mode, 'playing');
});

test('side contact costs a life; big player just shrinks', () => {
  const g = createGame();
  run(g, none, 0.3);
  g.player.big = true;
  g.player.h = 1.4;
  const e = g.enemies[0];
  Object.assign(g.player, { x: e.x - 0.5, y: e.y + e.h - g.player.h, vy: 0 });
  step(g, none);
  assert.equal(g.mode, 'playing');
  assert.equal(g.player.big, false);
  assert.ok(g.player.invuln > 0);
  g.player.invuln = 0;
  Object.assign(g.player, { x: e.x - 0.5, y: e.y, vy: 0 });
  step(g, none);
  assert.equal(g.mode, 'dying');
  run(g, none, 2);
  assert.equal(g.lives, 2);
  assert.equal(g.mode, 'playing');
});

test('barrel pops a jug out to the side that Billy can chase and collect', () => {
  const g = createGame({ enemies: false });
  const before = g.jugs;
  g.player.x = 14.15;
  g.player.y = 6.1; // just under barrel at (14,5)
  g.player.vy = -15;
  step(g, none);
  assert.equal(g.tiles[5][14], USED);
  assert.equal(g.jugs, before, 'not collected automatically');
  assert.equal(g.items.length, 1);
  const jug = g.items[0];
  assert.equal(jug.kind, 'jug');
  assert.ok(jug.vx !== 0);
  assert.equal(g.tiles[5][16], CRATE);
  // the jug lands and slows to a stop on the ground
  run(g, none, 3);
  assert.equal(g.items[0].onGround, true);
  assert.ok(Math.abs(g.items[0].vx) < 0.01);
  // Billy walks over and picks it up
  Object.assign(g.player, { x: g.items[0].x, y: g.items[0].y });
  step(g, none);
  assert.equal(g.jugs, before + 1);
  assert.equal(g.items.length, 0);
});

test('an uncollected jug disappears after ~10 seconds', () => {
  const g = createGame({ enemies: false });
  Object.assign(g.player, { x: 14.15, y: 6.1, vy: -15 });
  step(g, none);
  g.player.x = 1;
  g.player.y = GROUND_Y - SMALL_H;
  run(g, none, 10.5);
  assert.equal(g.items.length, 0);
});

test('shine crate grows Billy', () => {
  const g = createGame({ enemies: false });
  Object.assign(g.player, { x: 16.15, y: 6.1, vy: -15 });
  step(g, none);
  assert.equal(g.items.length, 1);
  run(g, none, 0.1);
  Object.assign(g.items[0], { x: g.player.x, y: g.player.y });
  step(g, none);
  assert.equal(g.player.big, true);
});

// A dumb bot: hold right, hop obstacles and pits. Proves the terrain is completable.
test('level is beatable by a simple bot (terrain only)', () => {
  const g = createGame({ enemies: false });
  g.viewW = 20;
  g.jugs = g.level.goalJugs; // the truck wants a full load; collecting is tested separately
  let t = 0;
  const bot = () => {
    const p = g.player;
    const front = p.x + p.w;
    const probeX = Math.floor(front + 0.45);
    const wall = [0, 1, 2].some((i) => g.tiles[Math.floor(p.y + p.h - 0.1) - i]?.[Math.floor(front + 0.3)]);
    const noFloor = !g.tiles[GROUND_Y]?.[probeX] && !g.tiles[GROUND_Y - 1]?.[probeX];
    const want = p.onGround && (wall || noFloor);
    // fell off a ledge over a pit with an air jump left: use it (fresh press every other frame)
    const rescue = !p.onGround && p.airJumps > 0 && p.vy > 2 && p.y + p.h > 7 && !g.tiles[GROUND_Y]?.[Math.floor(p.x + p.w / 2)];
    return { left: false, right: true, jump: want || (!p.onGround && p.vy < 0 && p.jumping) || (rescue && !g.prevJump) };
  };
  while (g.mode === 'playing' && t < 120) {
    step(g, bot(), STEP);
    t += STEP;
  }
  assert.equal(g.mode, 'won', `bot ended in ${g.mode} at x=${g.player.x.toFixed(1)} t=${t.toFixed(1)}`);
});

const nearGoal = (g) => Object.assign(g.player, { x: g.level.goalX, y: GROUND_Y - SMALL_H, vy: 0 });

test('the truck will not leave without enough jugs', () => {
  const g = createGame({ enemies: false });
  g.jugs = g.level.goalJugs - 1;
  nearGoal(g);
  run(g, none, 0.3);
  assert.equal(g.mode, 'playing');
  assert.ok(g.effects.some((f) => f.text && f.text.includes('1 more')));
  g.jugs = g.level.goalJugs;
  run(g, none, 0.3);
  assert.equal(g.mode, 'won');
});

test('corn cobs kill chickens from a distance; turkeys take two', () => {
  const g = createGame();
  run(g, none, 0.3);
  const chicken = g.enemies[0];
  Object.assign(g.player, { x: chicken.x - 5, facing: 1 });
  chicken.awake = true;
  step(g, { ...none, throw: true });
  assert.equal(g.cobs.length, 1);
  run(g, none, 1.2);
  assert.equal(chicken.alive, false);
  assert.ok(g.score >= 150);

  const turkey = g.enemies.find((e) => e.kind === 'turkey');
  assert.equal(turkey.hp, 2);
  Object.assign(g.player, { x: turkey.x - 4, y: GROUND_Y - SMALL_H, vy: 0, vx: 0, facing: 1 });
  turkey.awake = true;
  turkey.state = 'rest';
  turkey.stateT = 99;
  step(g, { ...none, throw: true });
  run(g, none, 0.6);
  assert.equal(turkey.hp, 1);
  assert.equal(turkey.alive, true);
});

test('bees cannot be stomped', () => {
  const g = createGame();
  const bee = g.enemies.find((e) => e.kind === 'bee');
  bee.awake = true;
  Object.assign(g.player, { x: bee.x, y: bee.y - 0.5, vy: 6 });
  step(g, none);
  assert.equal(g.mode, 'dying');
});

test('moonshine meter fills from jugs and Rush speeds Billy up', () => {
  const g = createGame({ enemies: false });
  g.shine = 8;
  step(g, { ...none, rush: true });
  assert.ok(g.player.rush > 5);
  assert.equal(g.shine, 0);
  run(g, { ...none, right: true }, 1);
  assert.ok(g.player.vx > 9, `rush speed ${g.player.vx}`);
  step(g, { ...none, rush: true }); // meter empty: no effect
  g.shine = 3;
  const g2 = createGame({ enemies: false });
  g2.shine = 3;
  step(g2, { ...none, rush: true });
  assert.equal(g2.player.rush, 0);
});

test('hound chases once it spots Billy', () => {
  const g = createGame();
  const hound = g.enemies.find((e) => e.kind === 'hound');
  hound.awake = true;
  g.player.x = hound.x - 6;
  g.player.y = hound.y;
  const before = hound.x;
  run(g, none, 0.4);
  assert.ok(hound.chasing);
  assert.ok(hound.x < before - 1, 'hound ran at him');
});

test('turkey winds up and then charges', () => {
  const g = createGame();
  const t = g.enemies.find((e) => e.kind === 'turkey');
  t.awake = true;
  t.cd = 0;
  g.player.x = t.x - 4;
  g.player.y = t.y;
  const seen = new Set();
  for (let i = 0; i < 120; i++) {
    g.player.x = t.x - 4;
    g.player.y = GROUND_Y - SMALL_H;
    g.player.invuln = 9;
    step(g, none);
    seen.add(t.state);
  }
  assert.ok(seen.has('wind') && seen.has('dash'), [...seen].join());
});

test('the beehive barrel releases a swarm', () => {
  const g = createGame({ enemies: false });
  Object.assign(g.player, { x: 52.15, y: 6.1, vy: -15 });
  step(g, none);
  assert.equal(g.enemies.filter((e) => e.kind === 'bee').length, 3);
});

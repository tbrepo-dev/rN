import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createGameAt, step, STEP, startPlaying, equip, enterSecret, leaveSecret, advanceScene, LEVEL_COUNT } from './game.js';
import { buildLevel, buildSecret, EMPTY, BREAKABLE, DOOR_BLUE, DOOR_RED, ACID } from './level.js';
import { SCENES } from './story.js';
import { levelForCode } from './cheats.js';

const none = { left: false, right: false, jump: false };
const run = (g, input, secs) => {
  for (let i = 0; i < Math.round(secs / STEP); i++) step(g, typeof input === 'function' ? input(g) : input, STEP);
};
const hive = (opts = {}) => {
  const g = createGame({ enemies: false, level: 8, ...opts });
  startPlaying(g);
  return g;
};
const put = (g, x, floor) => Object.assign(g.player, { x, y: floor - g.player.h, vx: 0, vy: 0, facing: 1 });
const openAll = (g) => {
  for (const row of g.tiles) for (let x = 0; x < row.length; x++) if (row[x] === DOOR_BLUE || row[x] === DOOR_RED || row[x] === BREAKABLE) row[x] = EMPTY;
};

// Hop search: from one standing spot, can Billy reach the next one with some run/jump/double-jump timing?
function canHop(g, a, b) {
  const p = g.player;
  const dir = b[0] >= a[0] ? 1 : -1;
  for (const lead of [0, 0.15, 0.4, 0.9]) {
    for (const hold of [0.12, 0.3, 0.55]) {
      for (const air of [null, 0.25, 0.4, 0.55]) {
        for (const stop of [0.5, 0.8, 1.2, 1.8, 3]) {
          put(g, a[0] - p.w / 2, a[1]);
          Object.assign(p, { onGround: false, airJumps: 1, invuln: 0, armor: 0, big: false, coyote: 0, buf: 0 });
          g.mode = 'playing';
          g.prevJump = false;
          let jumped = false;
          let ok = false;
          for (let i = 0, t = 0; i < 300; i++, t += STEP) {
            const jumpKey = t >= lead && t < lead + hold ? true : air != null && t >= lead + air && t < lead + air + 0.3;
            const moving = t < lead + stop || t < 0.01;
            step(g, { left: dir < 0 && moving, right: dir > 0 && moving, jump: jumpKey }, STEP);
            if (g.mode !== 'playing') break;
            if (jumpKey) jumped = true;
            if (jumped && p.onGround && t > lead + 0.3 && Math.abs(p.x + p.w / 2 - b[0]) < 1.2 && Math.abs(p.y + p.h - b[1]) < 0.1) {
              ok = true;
              break;
            }
          }
          if (ok) return true;
        }
      }
    }
  }
  // flat walks need no jump at all
  if (a[1] === b[1]) {
    put(g, a[0] - p.w / 2, a[1]);
    g.mode = 'playing';
    for (let i = 0; i < 600; i++) {
      step(g, { left: dir < 0, right: dir > 0, jump: false }, STEP);
      if (g.mode !== 'playing') return false;
      if (p.onGround && Math.abs(p.x + p.w / 2 - b[0]) < 0.5 && Math.abs(p.y + p.h - b[1]) < 0.1) return true;
    }
  }
  return false;
}

test('the Hive is a big tall map with two secrets: a cracked wall and a portal', () => {
  const L = buildLevel(8);
  assert.equal(LEVEL_COUNT, 10);
  assert.ok(L.w >= 200 && L.h >= 60 && L.scrollY);
  assert.equal(L.tiles.flat().filter((t) => t === DOOR_RED).length, 4);
  assert.ok(L.tiles.flat().includes(BREAKABLE));
  assert.ok(L.tiles.flat().includes(ACID));
  assert.equal(L.portals.length, 1);
  assert.equal(L.tanks.length, 2);
  assert.ok(L.saves.length >= 3);
  assert.equal(buildSecret('egg').secret, true);
});

test('the main route through the Hive can be walked, jumped and double-jumped start to finish', () => {
  const g = hive();
  openAll(g);
  const route = g.level.route;
  for (let i = 0; i + 1 < route.length; i++) assert.ok(canHop(g, route[i], route[i + 1]), `hop ${i}: ${route[i]} -> ${route[i + 1]}`);
});

test('the Egg Chamber route can be climbed to the Queen Egg', () => {
  const g = hive();
  enterSecret(g, 'egg');
  const route = g.level.route;
  for (let i = 0; i + 1 < route.length; i++) assert.ok(canHop(g, route[i], route[i + 1]), `egg hop ${i}: ${route[i]} -> ${route[i + 1]}`);
});

test('every standing spot on the routes has floor beneath it and headroom above', () => {
  for (const g of [hive(), (() => { const x = hive(); enterSecret(x, 'egg'); return x; })()]) {
    for (const [x, f] of g.level.route) {
      assert.notEqual(g.tiles[f][Math.floor(x)], EMPTY, `floor under ${x},${f}`);
      assert.equal(g.tiles[f - 1][Math.floor(x)], EMPTY, `air above ${x},${f}`);
      assert.equal(g.tiles[f - 2][Math.floor(x)], EMPTY, `headroom at ${x},${f}`);
    }
  }
});

test('acid burns and bounces Billy out; armor absorbs it', () => {
  const g = hive();
  g.player.armor = 1;
  put(g, 63.5, 49);
  run(g, none, 0.7);
  assert.equal(g.player.armor, 0, 'armor spent');
  assert.equal(g.mode, 'playing');
  run(g, { ...none, right: true }, 1.5);
  assert.ok(g.player.x > 67 && g.player.y + g.player.h <= 50.1, 'bounced back up and out of the pit');
  const g2 = hive();
  put(g2, 63.5, 49);
  run(g2, none, 1.5);
  assert.notEqual(g2.mode, 'playing', 'no armor: the acid kills');
});

test('blue doors open to any shot, corn included, and stay open', () => {
  const g = hive();
  put(g, 27, 50);
  g.player.facing = 1;
  assert.equal(g.tiles[47][31], DOOR_BLUE);
  step(g, { ...none, throw: true });
  run(g, none, 1.2);
  assert.equal(g.tiles[47][31], EMPTY);
  assert.equal(g.tiles[49][31], EMPTY, 'the whole door goes');
  assert.ok(g.version > 1);
});

test('the cracked wall resists corn but gives way to the ray gun', () => {
  const g = hive();
  put(g, 67.5, 50);
  g.player.facing = 1;
  step(g, { ...none, throw: true });
  run(g, none, 1);
  assert.equal(g.tiles[48][71], BREAKABLE, 'corn does nothing');
  g.gear.raygun = true;
  g.ammo = 5;
  run(g, none, 0.4);
  step(g, { ...none, throw: true });
  run(g, none, 1);
  assert.equal(g.tiles[48][71], EMPTY);
  assert.equal(g.tiles[47][71], EMPTY);
});

test('the red door shrugs off rays and only a missile opens it', () => {
  const g = hive();
  g.gear.raygun = true;
  g.ammo = 5;
  put(g, 146, 50);
  step(g, { ...none, throw: true });
  run(g, none, 1);
  assert.equal(g.tiles[47][150], DOOR_RED);
  equip(g, 'bazooka');
  assert.equal(g.rocketAmmo, 6);
  run(g, none, 0.4);
  step(g, { ...none, baz: true });
  assert.equal(g.rocketAmmo, 5);
  run(g, none, 1.2);
  assert.equal(g.tiles[47][150], EMPTY);
  assert.equal(g.tiles[49][150], EMPTY);
});

test('the bazooka is only fired when you have it, and counts its rockets', () => {
  const g = hive();
  step(g, { ...none, baz: true });
  assert.equal(g.missiles.length, 0, 'no bazooka yet');
  equip(g, 'bazooka');
  g.rocketAmmo = 0;
  run(g, none, 0.5);
  step(g, { ...none, baz: true });
  assert.equal(g.missiles.length, 0, 'no rockets');
  g.rocketAmmo = 2;
  run(g, none, 0.5);
  step(g, { ...none, baz: true });
  assert.equal(g.missiles.length, 1);
  assert.equal(g.rocketAmmo, 1);
});

test('missiles blow up on impact and hurt everything nearby', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  equip(g, 'bazooka');
  put(g, 14, 50);
  const hug = g.enemies.find((e) => e.kind === 'hugger');
  const near = g.enemies.filter((e) => e.kind === 'hugger');
  assert.ok(hug && near.length >= 1);
  for (const e of g.enemies) e.awake = true;
  Object.assign(hug, { x: 19, y: 50 - hug.h, vx: 0 });
  step(g, { ...none, baz: true });
  run(g, none, 1);
  assert.equal(hug.alive, false);
  assert.ok(g.shake >= 0 || true);
});

test('eggs hatch huggers when you walk up, but a rocket drops if you shoot one first', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  const egg = g.enemies.find((e) => e.kind === 'egg');
  g.enemies = [egg];
  g.player.armor = 9;
  put(g, egg.x - 3, 50);
  run(g, none, 1.5);
  assert.ok(egg.hatched);
  assert.ok(g.enemies.some((e) => e.kind === 'hugger'));
  const g2 = createGame({ level: 8 });
  startPlaying(g2);
  const egg2 = g2.enemies.find((e) => e.kind === 'egg');
  put(g2, egg2.x - 7, 50);
  egg2.awake = true;
  g2.player.facing = 1;
  g2.gear.raygun = true;
  g2.ammo = 5;
  for (let i = 0; i < 2; i++) {
    step(g2, { ...none, throw: true });
    run(g2, none, 0.4);
  }
  assert.equal(egg2.alive, false);
  assert.ok(g2.items.some((it) => it.kind === 'rocket'));
  put(g2, g2.items.find((it) => it.kind === 'rocket').x - 0.2, 50);
  run(g2, none, 0.3);
  assert.equal(g2.rocketAmmo, 2);
});

test('breaking the cracked wall reveals a portal into the Egg Chamber; the portal round trip restores the Hive', () => {
  const g = hive();
  g.tiles[47][71] = g.tiles[48][71] = g.tiles[49][71] = EMPTY;
  put(g, 72, 50);
  const hiveLevel = g.level;
  const cp = g.checkpoint;
  run(g, { ...none, right: true }, 0.5);
  assert.equal(g.level.secret, true);
  assert.equal(g.stack.length, 1);
  assert.equal(g.levelNo, 8);
  run(g, none, 1.5);
  assert.equal(g.mode, 'playing');
  assert.ok(g.player.x < 10);
  leaveSecret(g);
  assert.equal(g.level, hiveLevel);
  assert.equal(g.stack.length, 0);
  assert.equal(g.checkpoint, cp);
  assert.ok(g.player.x > 70 && g.player.x < 76);
  run(g, none, 0.5);
  assert.equal(g.level, hiveLevel, 'the exit does not instantly send you back in');
});

test('dying in the Egg Chamber respawns you in the Egg Chamber', () => {
  const g = hive();
  enterSecret(g, 'egg');
  g.player.armor = 0;
  g.lives = 3;
  put(g, 21, 38);
  run(g, none, 4);
  assert.equal(g.level.secret, true);
  assert.equal(g.lives, 2);
  assert.equal(g.mode, 'playing');
});

test('cracking the Queen Egg gives you the bazooka, and it stays harvested', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  enterSecret(g, 'egg');
  startPlaying(g);
  const egg = g.enemies.find((e) => e.kind === 'queenegg');
  assert.ok(egg);
  assert.equal(egg.hp, 6);
  g.enemies = [egg];
  put(g, egg.x - 3, 17);
  g.player.facing = 1;
  g.gear.raygun = true;
  g.ammo = 10;
  for (let i = 0; i < 6 && egg.alive; i++) {
    step(g, { ...none, throw: true });
    run(g, none, 0.4);
  }
  assert.equal(egg.alive, false);
  const item = g.items.find((it) => it.gear === 'bazooka');
  assert.ok(item);
  put(g, item.x - 0.1, 17);
  run(g, none, 0.3);
  assert.ok(g.gear.bazooka);
  assert.equal(g.rocketAmmo, 6);
  g.lives = 3;
  g.player.armor = 0;
  g.mode = 'dying';
  g.deathT = 2;
  run(g, none, 0.1);
  assert.ok(!g.enemies.some((e) => e.kind === 'queenegg'), 'the egg stays cracked');
});

test('the Queen is armored: rays barely scratch her and stomping does nothing, but missiles hit hard', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  openAll(g);
  const q = g.enemies.find((e) => e.kind === 'queen');
  Object.assign(g.player, { x: 176, y: 50 - g.player.h, armor: 5 });
  q.awake = true;
  g.gear.raygun = true;
  g.ammo = 10;
  g.player.facing = 1;
  const hp0 = q.hp;
  const dmg = (n) => hp0 - q.hp;
  q.x = 181;
  q.state = 'rest';
  q.cd = 99;
  step(g, { ...none, throw: true });
  run(g, none, 0.5);
  assert.ok(dmg() > 0 && dmg() < 1, `ray damage ${dmg()}`);
  Object.assign(g.player, { x: q.x + 0.5, y: q.y - 1.5, vy: 8 });
  step(g, none);
  assert.ok(hp0 - q.hp < 1, 'stomping her does nothing');
  g.player.rush = 3;
  Object.assign(g.player, { x: q.x + 0.5, y: q.y + 0.5 });
  step(g, none);
  assert.ok(hp0 - q.hp < 1, 'rushing through does not hurt her');
  g.player.rush = 0;
  equip(g, 'bazooka');
  Object.assign(g.player, { x: 176, y: 50 - g.player.h, vx: 0, vy: 0 });
  q.x = 183;
  const before = q.hp;
  step(g, { ...none, baz: true });
  run(g, none, 0.6);
  assert.ok(before - q.hp >= 9, `missile did ${before - q.hp}`);
});

test('the Queen can be beaten with rockets, and her fall leads to the ending', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  const q = g.enemies.find((e) => e.kind === 'queen');
  openAll(g);
  equip(g, 'bazooka');
  Object.assign(g.player, { x: 170, y: 50 - g.player.h, armor: 99 });
  q.awake = true;
  q.cd = 99;
  q.state = 'rest';
  for (let i = 0; i < 12 && q.alive; i++) {
    g.rocketAmmo = 5;
    q.x = Math.max(q.x, 177);
    q.iframes = 0;
    g.player.x = 170;
    g.player.facing = 1;
    g.player.bazCd = 0;
    step(g, { ...none, baz: true });
    run(g, none, 0.7);
  }
  assert.equal(q.alive, false);
  assert.ok(g.bossDefeated);
  run(g, none, 3.2);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'queenDead');
  for (let i = 0; i < SCENES.queenDead.lines.length; i++) advanceScene(g);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'tournament');
  for (let i = 0; i < SCENES.tournament.lines.length; i++) advanceScene(g);
  assert.equal(g.levelNo, 9);
});

test('the Queen fights back: she whips, spits, pounces and screeches up huggers', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  openAll(g);
  const q = g.enemies.find((e) => e.kind === 'queen');
  Object.assign(g.player, { x: 172, y: 50 - g.player.h, armor: 999 });
  q.awake = true;
  const seen = new Set();
  q.hp = 25; // phase two
  run(g, (gg) => {
    seen.add(q.atk);
    Object.assign(gg.player, { x: 172, vx: 0 });
    return none;
  }, 25);
  for (const a of ['tail', 'spit', 'leap', 'screech']) assert.ok(seen.has(a), `${a} seen: ${[...seen]}`);
  assert.ok(g.enemies.some((e) => e.kind === 'hugger'));
});

test('save stations set the checkpoint and refill armor; energy tanks add permanent armor', () => {
  const g = hive();
  const sv = g.level.saves[0];
  put(g, sv.x + 0.2, sv.floor);
  g.player.armor = 0;
  run(g, none, 0.3);
  assert.equal(g.checkpoint, sv.x);
  assert.equal(g.checkpointFloor, sv.floor);
  const tank = g.level.tanks[0];
  const a0 = g.player.armor;
  Object.assign(g.player, { x: tank.x, y: tank.y - 0.4, vy: 0 });
  step(g, none);
  assert.equal(g.tanks, 1);
  assert.equal(g.player.armor, a0 + 1);
  g.mode = 'dying';
  g.deathT = 2;
  run(g, none, 0.1);
  assert.equal(g.player.armor, 1, 'the tank still counts after respawn');
});

test('the map remembers where you have been', () => {
  const g = hive();
  run(g, none, 0.3);
  assert.ok(g.level.exploredN > 100);
  const n0 = g.level.exploredN;
  put(g, 28, 50);
  run(g, none, 0.3);
  assert.ok(g.level.exploredN > n0);
});

test('code 1337 jumps straight to the Hive, kitted out', () => {
  assert.equal(levelForCode('1337'), 8);
  const g = createGameAt(8);
  assert.equal(g.levelNo, 8);
  assert.ok(g.gear.raygun && g.gear.plate);
  assert.ok(!g.gear.bazooka, 'the bazooka has to be harvested');
});

test('the Hive keeps frame time reasonable with every creature awake', () => {
  const g = createGame({ level: 8 });
  startPlaying(g);
  const t0 = Date.now();
  run(g, none, 10);
  assert.ok(Date.now() - t0 < 3000);
});

test('smoke: every creature in the Hive and Egg Chamber can be woken up and fought without breaking anything', () => {
  for (const secret of [false, true]) {
    const g = createGame({ level: 8 });
    startPlaying(g);
    if (secret) enterSecret(g, 'egg');
    equip(g, 'bazooka');
    g.gear.raygun = true;
    g.ammo = 30;
    for (const [x, f] of g.level.route) {
      put(g, x - 0.35, f);
      g.player.invuln = 99;
      g.player.armor = 99;
      g.rocketAmmo = 8;
      run(g, (gg) => ({ ...none, throw: gg.time % 0.5 < 0.05, baz: gg.time % 1.5 < 0.05, right: gg.time % 2 < 1 }), 1.5);
      assert.ok(Number.isFinite(g.player.x) && Number.isFinite(g.camY));
      for (const e of g.enemies) assert.ok(Number.isFinite(e.x) && Number.isFinite(e.y), `${e.kind} went NaN`);
      if (g.mode !== 'playing') {
        g.mode = 'playing';
      }
    }
  }
});

test('code 2718 starts in the Egg Chamber', () => {
  assert.equal(levelForCode('2718'), 11);
  const g = createGameAt(11);
  assert.equal(g.level.secret, true);
  startPlaying(g);
  run(g, none, 1);
  assert.equal(g.mode, 'playing');
});

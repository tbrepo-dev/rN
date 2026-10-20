import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, STEP, SMALL_H, loadLevel, nextLevel, startPlaying, equip, armorMax, LEVEL_COUNT } from './game.js';
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

// A dumb bot: hold right, hop obstacles and pits. Proves each level's terrain is completable.
for (const levelNo of [1, 2, 3]) {
  test(`level ${levelNo} is beatable by a simple bot (terrain only)`, () => {
    const g = createGame({ enemies: false, level: levelNo });
    g.viewW = 20;
    g.jugs = g.level.goalJugs; // the exit wants a full load; collecting is tested separately
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
}

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

test('Rush makes Billy invincible and plows through critters', () => {
  const g = createGame();
  run(g, none, 0.3);
  g.shine = 8;
  step(g, { ...none, rush: true });
  const bee = g.enemies.find((e) => e.kind === 'bee');
  const hound = g.enemies[0];
  bee.awake = hound.awake = true;
  Object.assign(g.player, { x: bee.x, y: bee.y - 0.2 });
  step(g, none);
  assert.equal(bee.alive, false);
  assert.equal(g.mode, 'playing');
  Object.assign(g.player, { x: hound.x - 0.5, y: hound.y, vy: 0 });
  step(g, none);
  assert.equal(hound.alive, false);
  assert.equal(g.mode, 'playing');
  // once Rush runs out, enemies hurt again
  g.player.rush = 0;
  const e2 = g.enemies.find((e) => e.alive && e.kind !== 'bee');
  Object.assign(g.player, { x: e2.x - 0.4, y: e2.y, vy: 0, invuln: 0 });
  e2.awake = true;
  step(g, none);
  assert.equal(g.mode, 'dying');
});

// ---- Levels 2 and 3 -------------------------------------------------------
const place = (g, e, dx = 0) => Object.assign(g.player, { x: e.x + dx, y: e.y + e.h - g.player.h, vy: 0, vx: 0 });

test('levels carry gear, ammo, score and lives forward', () => {
  const g = createGame({ enemies: false });
  g.gear.raygun = true;
  g.ammo = 7;
  g.score = 1234;
  g.lives = 2;
  g.jugs = 40;
  nextLevel(g);
  assert.equal(g.levelNo, 2);
  assert.equal(g.mode, 'intro');
  assert.equal(g.jugs, 0, 'collectibles reset per level');
  assert.equal(g.ammo, 7);
  assert.equal(g.score, 1234);
  assert.equal(g.lives, 2);
  assert.ok(g.gear.raygun);
  startPlaying(g);
  assert.equal(g.mode, 'playing');
  nextLevel(g);
  assert.equal(g.levelNo, 3);
  assert.equal(LEVEL_COUNT, 3);
});

test('killing aliens drops ray gun ammo; the antenna helmet doubles it', () => {
  const g = createGame({ level: 2 });
  const alien = g.enemies.find((e) => e.kind === 'alien');
  alien.awake = true;
  Object.assign(g.player, { x: alien.x - 0.5, y: alien.y - 0.2 + 0.0, vy: 6 });
  g.player.y = alien.y - 0.9;
  step(g, none);
  assert.equal(alien.alive, false);
  assert.equal(g.ammo, 3);
  const alien2 = g.enemies.find((e) => e.kind === 'alien' && e.alive);
  g.gear.antenna = true;
  alien2.awake = true;
  Object.assign(g.player, { x: alien2.x - 0.5, y: alien2.y - 0.9, vy: 6 });
  step(g, none);
  assert.equal(g.ammo, 3 + 6);
});

test('the ray gun fires beams that use ammo and fall back to corn cobs when empty', () => {
  const g = createGame({ level: 2 });
  run(g, none, 0.3);
  g.gear.raygun = true;
  g.ammo = 2;
  g.enemies = [];
  step(g, { ...none, throw: true });
  assert.equal(g.rays.length, 1);
  assert.equal(g.ammo, 1);
  run(g, none, 0.4);
  step(g, { ...none, throw: true });
  assert.equal(g.ammo, 0);
  run(g, none, 0.4);
  step(g, { ...none, throw: true });
  assert.equal(g.cobs.length, 1, 'no ammo: corn cob instead');
});

test('a ray hits the first alien in line and ufos take two', () => {
  const g = createGame({ level: 2 });
  g.gear.raygun = true;
  g.ammo = 5;
  g.enemies = [];
  const ufo = { kind: 'ufo', x: 9, y: 6, ox: 9, oy: 6, w: 1.1, h: 0.7, vx: 0, vy: 0, dir: 1, hp: 2, alive: true, squish: 0, awake: true, t: 0, hit: 0, iframes: 0, state: 'walk', cd: 0, shootT: 9, hopT: 0, phase: 0 };
  g.enemies.push(ufo);
  Object.assign(g.player, { x: 2, y: GROUND_Y - SMALL_H - 2.5, vy: 0, facing: 1 });
  g.player.onGround = false;
  const aim = () => Object.assign(g.player, { y: 5.6, vy: 0 });
  aim();
  step(g, { ...none, throw: true });
  for (let i = 0; i < 30; i++) {
    aim();
    ufo.x = 9;
    ufo.y = 6;
    step(g, none);
  }
  assert.equal(ufo.hp, 1);
  assert.ok(ufo.alive);
});

test('tentacle gunners spit plasma at Billy; a shield blocks it, otherwise it hurts', () => {
  const g = createGame({ level: 2 });
  const tentacle = g.enemies.find((e) => e.kind === 'tentacle');
  tentacle.awake = true;
  tentacle.shootT = 0.01;
  place(g, tentacle, -6);
  g.player.facing = 1;
  g.player.armor = 0;
  step(g, none);
  assert.equal(g.shots.length, 1);
  run(g, none, 0.1);
  g.player.shielding = false;
  // unshielded: dies (small Billy, no armor)
  let died = false;
  for (let i = 0; i < 90 && g.mode === 'playing'; i++) {
    place(g, { x: g.player.x, y: tentacle.y, h: tentacle.h }, 0);
    step(g, none);
  }
  died = g.mode === 'dying';
  assert.ok(died, 'plasma should hurt without a shield');

  const g2 = createGame({ level: 2 });
  g2.gear.shield = true;
  const t2 = g2.enemies.find((e) => e.kind === 'tentacle');
  t2.awake = true;
  t2.shootT = 0.01;
  place(g2, t2, -6);
  g2.player.facing = 1;
  for (let i = 0; i < 90; i++) {
    g2.player.x = t2.x - 6;
    g2.player.vx = 0;
    step(g2, { ...none, shield: true });
  }
  assert.equal(g2.mode, 'playing', 'shield blocks plasma');
  assert.ok(g2.events.includes('block'));
});

test('armor absorbs hits before Billy shrinks or dies, and refills on respawn', () => {
  const g = createGame({ enemies: false });
  equip(g, 'vest');
  equip(g, 'plate');
  assert.equal(armorMax(g), 2);
  assert.equal(g.player.armor, 2);
  g.player.invuln = 0;
  hurtIt(g);
  assert.equal(g.player.armor, 1);
  assert.equal(g.mode, 'playing');
  g.player.invuln = 0;
  hurtIt(g);
  hurtIt(g);
  assert.equal(g.mode, 'dying');
  run(g, none, 2);
  assert.equal(g.player.armor, 2, 'armor refilled after respawn');
});
import { hurt } from './game.js';
function hurtIt(g) {
  g.player.invuln = 0;
  hurt(g);
}

test('the sword slashes things in front of Billy and deflects shots', () => {
  const g = createGame({ level: 3 });
  g.gear.sword = true;
  const gob = g.enemies.find((e) => e.kind === 'goblin');
  gob.awake = true;
  gob.dir = 0;
  Object.assign(g.player, { x: gob.x - 1.2, y: gob.y + gob.h - g.player.h, vy: 0, facing: 1 });
  step(g, { ...none, throw: true });
  assert.ok(g.player.slash > 0);
  assert.equal(gob.alive, false);
  // deflects an incoming orb
  g.shots.push({ kind: 'orb', x: g.player.x + 1, y: g.player.y + 0.3, w: 0.36, h: 0.36, vx: -3, vy: 0, gravity: 0, life: 3 });
  run(g, none, 0.01); // release the button, then press again
  g.player.slash = 0;
  g.player.throwCd = 0;
  g.shots[0].x = g.player.x + 1;
  g.shots[0].vx = 0;
  step(g, { ...none, throw: true });
  assert.equal(g.shots.length, 0);
});

test('shield shoves a charging enemy back instead of taking damage', () => {
  const g = createGame({ level: 3 });
  g.gear.shield = true;
  const troll = g.enemies.find((e) => e.kind === 'troll');
  troll.awake = true;
  Object.assign(g.player, { x: troll.x - 0.7, y: troll.y + troll.h - g.player.h, vy: 0, facing: 1 });
  step(g, { ...none, shield: true });
  assert.equal(g.mode, 'playing');
  assert.ok(g.events.includes('block'));
});

test('witches lob orbs and trolls take two stomps', () => {
  const g = createGame({ level: 3 });
  const witch = g.enemies.find((e) => e.kind === 'witch');
  witch.awake = true;
  witch.shootT = 0.01;
  place(g, witch, -6);
  step(g, none);
  assert.equal(g.shots.length, 1);

  const troll = g.enemies.find((e) => e.kind === 'troll');
  troll.awake = true;
  troll.state = 'rest';
  troll.stateT = 99;
  Object.assign(g.player, { x: troll.x, y: troll.y - 0.85, vy: 8 });
  step(g, none);
  assert.equal(troll.hp, 2);
  assert.ok(troll.alive);
  Object.assign(g.player, { x: troll.x, y: troll.y - 0.85, vy: 8 });
  step(g, none);
  assert.equal(troll.alive, false);
});

test('the castle gate stays shut until the Witch Queen falls', () => {
  const g = createGame({ level: 3 });
  g.jugs = g.level.goalJugs;
  g.enemies = [];
  Object.assign(g.player, { x: g.level.goalX, y: GROUND_Y - SMALL_H, vy: 0 });
  run(g, none, 0.3);
  assert.equal(g.mode, 'playing');
  assert.ok(g.effects.some((f) => f.text && f.text.includes('Witch Queen')));
  g.bossDefeated = true;
  run(g, none, 0.3);
  assert.equal(g.mode, 'won');
});

test('the Witch Queen takes many hits, flashes between them and drops the gate when beaten', () => {
  const g = createGame({ level: 3 });
  const boss = g.enemies.find((e) => e.kind === 'boss');
  assert.equal(boss.hp, 14);
  boss.awake = true;
  // sword hit does 2, then iframes block the next immediate hit
  g.gear.sword = true;
  Object.assign(g.player, { x: boss.x - 1.2, y: boss.y + boss.h - g.player.h, vy: 0, facing: 1, invuln: 99 });
  step(g, { ...none, throw: true });
  assert.equal(boss.hp, 12);
  g.player.slash = 0;
  g.player.throwCd = 0;
  g.prevThrow = false;
  step(g, { ...none, throw: true });
  assert.equal(boss.hp, 12, 'invulnerable right after a hit');
  boss.iframes = 0;
  boss.hp = 1;
  g.player.throwCd = 0;
  g.prevThrow = false;
  step(g, { ...none, throw: true });
  assert.equal(boss.alive, false);
  assert.ok(g.bossDefeated);
});

test('finishing a level hands over any gear Billy missed', () => {
  const g = createGame({ enemies: false, level: 2 });
  g.gear.raygun = true;
  g.jugs = g.level.goalJugs;
  Object.assign(g.player, { x: g.level.goalX, y: GROUND_Y - SMALL_H, vy: 0 });
  run(g, none, 0.3);
  assert.equal(g.mode, 'won');
  assert.ok(g.gear.antenna && g.gear.vest, 'missing gear granted');
  assert.deepEqual(g.loot.map((l) => [l.name, l.found]), [['raygun', true], ['antenna', false], ['vest', false]]);
});

test('by the end of level 3 Billy has the full knight-alien kit', () => {
  const g = createGame({ enemies: false, level: 3 });
  g.jugs = g.level.goalJugs;
  Object.assign(g.player, { x: g.level.goalX, y: GROUND_Y - SMALL_H, vy: 0 });
  run(g, none, 0.3);
  assert.equal(g.mode, 'won');
  for (const k of ['sword', 'shield', 'knightHelm', 'plate']) assert.ok(g.gear[k], k);
});

test('gear barrels exist where Billy can bump them', () => {
  for (const n of [2, 3]) {
    const g = createGame({ enemies: false, level: n });
    const gearBarrels = Object.entries(g.level.crates).filter(([, v]) => v.startsWith('gear:')).map(([, v]) => v.slice(5));
    assert.deepEqual(gearBarrels.sort(), [...g.level.gearPool].sort());
  }
});

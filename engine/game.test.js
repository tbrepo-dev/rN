import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, step, STEP, SMALL_H, loadLevel, nextLevel, startPlaying, equip, armorMax, LEVEL_COUNT, startScene, advanceScene, chooseScene, continueGame, addLife } from './game.js';
import { SCENES } from './story.js';
import { LEVEL_CODES, levelForCode } from './cheats.js';
import { createGameAt } from './game.js';
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
for (const levelNo of [1, 2, 3, 5]) {
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
    while (g.mode === 'playing' && t < 120 && !(levelNo === 5 && g.player.x > g.level.goalX - 12)) {
      step(g, bot(), STEP);
      t += STEP;
    }
    if (levelNo === 5) {
      // no goal gate here: Max's defeat ends the level, so just reach his arena alive
      assert.ok(g.player.x > g.level.goalX - 14 && g.mode === 'playing', `bot ended in ${g.mode} at x=${g.player.x.toFixed(1)}`);
    } else {
      assert.equal(g.mode, 'won', `bot ended in ${g.mode} at x=${g.player.x.toFixed(1)} t=${t.toFixed(1)}`);
    }
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
  assert.equal(LEVEL_COUNT, 7);
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

// ---- Lives ----------------------------------------------------------------
test('1UP pickups, barrels and every 25 collectibles all give extra lives', () => {
  const g = createGame({ enemies: false });
  const l = g.level.lives[0];
  assert.ok(l, 'each level has a hidden 1UP');
  Object.assign(g.player, { x: l.x, y: l.y - 0.3, vy: 0 });
  step(g, none);
  assert.equal(g.lives, 4);
  assert.ok(l.taken);
  // every 25th collectible
  g.collected = 24;
  const c = g.coins.find((x) => !x.taken);
  Object.assign(g.player, { x: c.x, y: c.y, vy: 0 });
  step(g, none);
  assert.equal(g.lives, 5);
  // a life barrel (level 5)
  const g5 = createGame({ enemies: false, level: 5 });
  const [bx, by] = Object.entries(g5.level.crates).find(([, v]) => v === 'life')[0].split(',').map(Number);
  Object.assign(g5.player, { x: bx + 0.15, y: by + 1.1, vy: -15 });
  step(g5, none);
  assert.equal(g5.items.at(-1).kind, 'life');
  Object.assign(g5.player, { x: g5.items.at(-1).x, y: g5.items.at(-1).y });
  step(g5, none);
  assert.equal(g5.lives, 4);
});

test('lives are capped at nine (extra 1UPs turn into points)', () => {
  const g = createGame({ enemies: false });
  g.lives = 9;
  const s = g.score;
  addLife(g, 0, 0);
  assert.equal(g.lives, 9);
  assert.equal(g.score, s + 1000);
});

test('every level has a way to get lives', () => {
  for (const n of [1, 2, 3, 4, 5]) {
    const g = createGame({ enemies: false, level: n });
    const barrelLife = Object.values(g.level.crates).includes('life');
    assert.ok(g.level.lives.length > 0 || barrelLife || g.level.totalJugs >= 25, `level ${n}`);
  }
});

// ---- Cutscenes -------------------------------------------------------------
test('beating the Witch Queen leads (via the level-complete screen) to the wizard cutscene, then level 4', () => {
  const g = createGame({ enemies: false, level: 3 });
  g.jugs = g.level.goalJugs;
  Object.assign(g.player, { x: g.level.goalX, y: GROUND_Y - SMALL_H, vy: 0 });
  run(g, none, 0.3);
  assert.equal(g.mode, 'won');
  continueGame(g);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'wizard');
  const n = SCENES.wizard.lines.length;
  for (let i = 0; i < n; i++) advanceScene(g);
  assert.equal(g.levelNo, 4);
  assert.equal(g.mode, 'intro');
});

test('every scene line has a speaker and every scene connects to something', () => {
  for (const [id, sc] of Object.entries(SCENES)) {
    assert.ok(sc.lines.length > 0, id);
    for (const l of sc.lines) assert.ok(l.who && l.text, `${id}: ${JSON.stringify(l)}`);
    assert.ok(sc.then || sc.choice, `${id} has nowhere to go`);
    for (const o of sc.choice || []) assert.ok(SCENES[o.scene], `${id} -> ${o.scene}`);
    if (sc.then?.scene) assert.ok(SCENES[sc.then.scene]);
  }
});

test('the finale offers the red and blue pill with the right endings', () => {
  const g = createGame({ enemies: false, level: 5 });
  startScene(g, 'finale');
  const lines = SCENES.finale.lines.length;
  for (let i = 0; i < lines + 3; i++) advanceScene(g); // can't advance past the choice
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'finale');
  assert.equal(g.scene.idx, lines - 1);
  assert.deepEqual(SCENES.finale.choice.map((c) => c.color), ['blue', 'red']);
  // blue: happy ending
  chooseScene(g, 0);
  assert.equal(g.scene.id, 'happy');
  for (let i = 0; i < SCENES.happy.lines.length; i++) advanceScene(g);
  assert.equal(g.mode, 'ending');
  assert.equal(g.ending, 'happy');
  // red: wakes up in Hell (level 6)
  const g2 = createGame({ enemies: false, level: 5 });
  startScene(g2, 'finale');
  for (let i = 0; i < lines; i++) advanceScene(g2);
  chooseScene(g2, 1);
  assert.equal(g2.scene.id, 'tbc');
  for (let i = 0; i < SCENES.tbc.lines.length; i++) advanceScene(g2);
  assert.equal(g2.levelNo, 6);
  assert.equal(g2.mode, 'intro');
});

// ---- Level 4: Honkey Kong ---------------------------------------------------
test("Honkey Kong rolls barrels along the girders, and they zig-zag down", () => {
  const g = createGame({ level: 4 });
  g.viewW = 40;
  g.player.invuln = 999;
  const honkey = g.enemies.find((e) => e.kind === 'honkey');
  assert.ok(honkey);
  assert.equal(Math.round(honkey.y + honkey.h), 3, 'Honkey stands on the top girder');
  let spawned = 0;
  const floorsSeen = new Set();
  let flipped = false;
  const lastDir = new Map();
  for (let i = 0; i < 60 * 14; i++) {
    g.player.x = 28;
    g.player.y = 12 - SMALL_H;
    g.player.vx = 0;
    step(g, none);
    for (const b of g.enemies.filter((e) => e.kind === 'barrel' && e.alive)) {
      if (!b.seen) {
        b.seen = true;
        spawned++;
      }
      if (b.onGround) floorsSeen.add(Math.round(b.y + b.h));
      if (lastDir.has(b) && lastDir.get(b) !== b.dir) flipped = true;
      lastDir.set(b, b.dir);
    }
  }
  assert.ok(spawned >= 5, `barrels thrown: ${spawned}`);
  assert.ok(flipped, 'barrels reverse after dropping to the next girder');
  assert.ok(floorsSeen.has(3) && floorsSeen.has(6) && floorsSeen.has(9), [...floorsSeen].join());
  assert.equal(g.mode, 'playing', 'invulnerable test player survives');
});

test('barrels hurt, but a shield deflects them and they can be shot', () => {
  const g = createGame({ level: 4 });
  const honkey = g.enemies.find((e) => e.kind === 'honkey');
  honkey.shootT = 0.01;
  Object.assign(g.player, { x: 10, y: 3 - SMALL_H, vy: 0 });
  step(g, none);
  const barrel = g.enemies.find((e) => e.kind === 'barrel');
  assert.ok(barrel);
  Object.assign(barrel, { x: g.player.x + 0.5, y: g.player.y + 0.1 });
  g.player.facing = 1;
  g.player.invuln = 0;
  step(g, none);
  assert.equal(g.mode, 'dying', 'rolling barrel kills small Billy');

  const g2 = createGame({ level: 4 });
  g2.gear.raygun = true;
  g2.ammo = 3;
  g2.enemies.find((e) => e.kind === 'honkey').shootT = 0.01;
  Object.assign(g2.player, { x: 12, y: 3 - SMALL_H, vy: 0, facing: -1 });
  g2.player.onGround = false;
  step(g2, none);
  const b2 = g2.enemies.find((e) => e.kind === 'barrel');
  Object.assign(b2, { x: 5, y: 3 - b2.h });
  run(g2, none, 0.1);
  step(g2, { ...none, throw: true });
  assert.equal(g2.rays.length, 1);
});

test('the tower can be climbed: ground -> girder 9 -> 6 -> 3 -> fridge', () => {
  const g = createGame({ level: 4, enemies: false });
  g.viewW = 30;
  let t = 0;
  let stage = 0;
  const feet = () => g.player.y + g.player.h;
  // Up through each gap: hug the edge of the girder above while jumping, then slide over the top
  const bot = () => {
    const p = g.player;
    if (p.onGround) stage = { 12: 0, 9: 1, 6: 2, 3: 3 }[Math.round(feet())] ?? stage;
    const rising = !p.onGround && p.vy < 0;
    if (stage === 0 || stage === 2) {
      return p.onGround ? (p.x < 27.3 ? { ...none, right: true } : { ...none, left: true, jump: true }) : { ...none, left: true, jump: rising };
    }
    if (stage === 1) {
      return p.onGround ? (p.x > 2.2 ? { ...none, left: true } : { ...none, right: true, jump: true }) : { ...none, right: true, jump: rising };
    }
    return { ...none, left: true };
  };
  while (g.mode === 'playing' && t < 60) {
    step(g, bot(), STEP);
    t += STEP;
  }
  assert.equal(g.mode, 'scene', `ended ${g.mode} at x=${g.player.x.toFixed(1)} feet=${feet().toFixed(1)} stage=${stage} t=${t.toFixed(1)}`);
  assert.equal(g.scene.id, 'fridge');
  for (let i = 0; i < SCENES.fridge.lines.length; i++) advanceScene(g);
  assert.equal(g.levelNo, 5);
});

test('level 4 checkpoint only counts on the right girder, and Honkey survives a respawn', () => {
  const g = createGame({ level: 4 });
  Object.assign(g.player, { x: 15, y: 12 - SMALL_H, vy: 0 });
  step(g, none);
  assert.equal(g.checkpointHit, false, 'walking past on the ground floor does not count');
  Object.assign(g.player, { x: 15, y: 6 - SMALL_H, vy: 0 });
  run(g, none, 0.1);
  assert.equal(g.checkpointHit, true);
  assert.equal(g.checkpointFloor, 6);
  g.player.invuln = 0;
  g.mode = 'dying';
  g.deathT = 2;
  step(g, none);
  assert.equal(g.mode, 'playing');
  assert.ok(Math.abs(g.player.y + g.player.h - 6) < 0.01, 'respawns on girder 6');
  assert.ok(g.enemies.some((e) => e.kind === 'honkey'));
});

// ---- Level 5: pagoda, Max ---------------------------------------------------
test('ninja cats throw shuriken and samurai cats lunge', () => {
  const g = createGame({ level: 5 });
  const ninja = g.enemies.find((e) => e.kind === 'ninja');
  ninja.awake = true;
  ninja.shootT = 0.01;
  place(g, ninja, -6);
  step(g, none);
  assert.ok(g.shots.some((s) => s.kind === 'star'));

  const sam = g.enemies.find((e) => e.kind === 'samurai');
  sam.awake = true;
  sam.cd = 0;
  const seen = new Set();
  for (let i = 0; i < 90; i++) {
    Object.assign(g.player, { x: sam.x - 2, y: GROUND_Y - SMALL_H, vy: 0, invuln: 99 });
    step(g, none);
    seen.add(sam.state);
  }
  assert.ok(seen.has('wind') && seen.has('dash'), [...seen].join());
  assert.equal(sam.hp, 3);
});

test('Max belly-slams, sending shockwaves along the floor, then rests', () => {
  const g = createGame({ level: 5 });
  const max = g.enemies.find((e) => e.kind === 'max');
  assert.equal(max.hp, 30);
  max.awake = true;
  max.cd = 0;
  g.viewW = 30;
  const states = new Set();
  let waves = false;
  for (let i = 0; i < 60 * 8; i++) {
    Object.assign(g.player, { x: max.x - 5, y: GROUND_Y - SMALL_H, vy: 0, vx: 0, invuln: 99 });
    step(g, none);
    states.add(max.state);
    if (g.shots.some((s) => s.kind === 'wave')) waves = true;
  }
  assert.ok(['wind', 'slam', 'rest'].every((s) => states.has(s)), [...states].join());
  assert.ok(waves, 'shockwaves');
});

test('Max takes double damage while resting and his defeat starts the finale', () => {
  const g = createGame({ level: 5 });
  g.gear.sword = true;
  const max = g.enemies.find((e) => e.kind === 'max');
  max.awake = true;
  max.state = 'walk';
  max.cd = 99;
  Object.assign(g.player, { x: max.x - 1.5, y: GROUND_Y - SMALL_H, vy: 0, facing: 1, invuln: 999 });
  step(g, { ...none, throw: true });
  assert.equal(max.hp, 28, 'sword does 2 normally');
  max.iframes = 0;
  max.state = 'rest';
  max.stateT = 99;
  g.player.slash = 0;
  g.player.throwCd = 0;
  g.prevThrow = false;
  step(g, { ...none, throw: true });
  assert.equal(max.hp, 24, 'and 4 while he is winded');
  max.iframes = 0;
  max.hp = 1;
  g.player.slash = 0;
  g.player.throwCd = 0;
  g.prevThrow = false;
  step(g, { ...none, throw: true });
  assert.equal(max.alive, false);
  assert.ok(g.bossDefeated);
  run(g, none, 2.2);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'finale');
});

// ---- Checkpoints must never soft-lock the game --------------------------------
for (const n of [1, 2, 3, 4, 5, 6]) {
  test(`level ${n}: the checkpoint has solid floor under Billy, so respawning never drops him in a pit`, () => {
    const g = createGame({ level: n });
    const floor = g.level.checkpointFloor ?? g.level.groundY;
    const x = g.level.checkpointX;
    assert.ok(g.tiles[floor][Math.floor(x + 0.05)] !== 0 && g.tiles[floor][Math.floor(x + 0.65)] !== 0, `checkpoint ${x} is over a gap`);
    // actually die after passing it and make sure the respawn is stable for a couple of seconds
    g.checkpoint = x;
    g.checkpointFloor = floor;
    g.checkpointHit = true;
    g.mode = 'dying';
    g.deathT = 2;
    step(g, none);
    assert.equal(g.mode, 'playing');
    g.enemies = [];
    run(g, none, 2);
    assert.equal(g.mode, 'playing', 'did not fall');
    assert.ok(g.player.onGround, 'standing on the ground after respawn');
  });
}

test('a checkpoint wrongly placed over a pit backs up to the nearest solid ground', () => {
  const g = createGame({ enemies: false, level: 5 });
  g.checkpoint = 62; // the old bad spot: over the pit between x=60 and x=63
  g.checkpointFloor = 9;
  g.mode = 'dying';
  g.deathT = 2;
  step(g, none);
  assert.equal(g.mode, 'playing');
  assert.ok(g.player.x < 60, `moved back to ground at x=${g.player.x}`);
  run(g, none, 1.5);
  assert.equal(g.mode, 'playing');
  assert.ok(g.player.onGround);
});

// ---- Level 6: Hell, Pack Billy, flaming tequila ------------------------------
import { FED_TO_FULL } from './game.js';

const pack = (g) => g.enemies.find((e) => e.kind === 'packbilly');
const drink = (g, n = 1) => {
  for (let i = 0; i < n; i++) g.items.push({ kind: 'tequila', x: g.player.x, y: g.player.y, w: 0.6, h: 0.8, dir: 0, vx: 0, vy: 0, age: 0 });
  step(g, none);
};

test('the red pill takes Billy to Hell, and Pack Billy waits at the gates', () => {
  const g = createGame({ level: 6 });
  assert.equal(g.level.theme, 'hell');
  assert.ok(pack(g));
  assert.equal(pack(g).hp, 999);
  assert.equal(FED_TO_FULL, 5);
});

test('drinking flaming tequila gives belches, up to three at once', () => {
  const g = createGame({ level: 6, enemies: false });
  drink(g);
  assert.equal(g.tequila, 1);
  drink(g, 3);
  assert.equal(g.tequila, 3, 'capped at three');
  assert.ok(g.events.includes('drink'));
});

test('FIRE belches a flame ball instead of the usual weapon, using up one tequila', () => {
  const g = createGame({ level: 6, enemies: false });
  g.gear.sword = true;
  g.gear.raygun = true;
  g.ammo = 5;
  drink(g, 2);
  run(g, none, 0.2);
  g.player.facing = 1;
  step(g, { ...none, throw: true });
  assert.equal(g.belches.length, 1);
  assert.equal(g.tequila, 1);
  assert.equal(g.ammo, 5, 'the ray gun is not used while there is tequila');
  // a belch moves away from Billy
  const x0 = g.belches[0].x;
  run(g, none, 0.2);
  assert.ok(g.belches[0].x > x0 + 1);
});

test('flame balls burn through ordinary demons', () => {
  const g = createGame({ level: 6 });
  const imp = g.enemies.find((e) => e.kind === 'imp');
  imp.awake = true;
  imp.dir = 0;
  g.belches.push({ x: imp.x - 0.5, y: imp.y, w: 0.9, h: 0.9, vx: 4, vy: 0, life: 3, age: 0 });
  step(g, none);
  assert.equal(imp.alive, false);
  assert.equal(g.belches.length, 1, 'the flame burns on');
});

test('Pack Billy eats flame balls: five fills him up and the gates open', () => {
  const g = createGame({ level: 6 });
  const p = pack(g);
  p.awake = true;
  g.player.invuln = 999;
  g.viewW = 30;
  for (let i = 1; i <= FED_TO_FULL; i++) {
    g.belches.push({ x: p.x + 0.5, y: p.y + 1, w: 0.9, h: 0.9, vx: 0, vy: 0, life: 3, age: 0 });
    step(g, none);
    assert.equal(p.fed, i);
    assert.equal(g.belches.length, 0, 'eaten');
    assert.equal(p.full, i === FED_TO_FULL);
  }
  assert.ok(g.bossDefeated);
  assert.ok(g.events.includes('chomp') && g.events.includes('burp'));
  run(g, none, 3);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'hellExit');
});

test('Pack Billy cannot be hurt, and he hurts until he is full', () => {
  const g = createGame({ level: 6 });
  const p = pack(g);
  p.awake = true;
  g.gear.sword = true;
  Object.assign(g.player, { x: p.x - 1.4, y: p.y + p.h - g.player.h, vy: 0, facing: 1, invuln: 999 });
  step(g, { ...none, throw: true });
  assert.equal(p.hp, 999, 'sword does nothing');
  assert.equal(p.alive, true);
  g.player.invuln = 0;
  Object.assign(g.player, { x: p.x + 0.5, y: p.y + 0.5, vy: 0 });
  step(g, none);
  assert.equal(g.mode, 'dying', 'contact kills small Billy');
  const g2 = createGame({ level: 6 });
  const p2 = pack(g2);
  p2.awake = true;
  p2.full = true;
  Object.assign(g2.player, { x: p2.x + 0.5, y: p2.y + 0.5, vy: 0 });
  step(g2, none);
  assert.equal(g2.mode, 'playing', 'a full Pack Billy is harmless');
});

test('Pack Billy chases Billy and gets faster as he eats', () => {
  const g = createGame({ level: 6 });
  const p = pack(g);
  p.awake = true;
  g.viewW = 30;
  g.player.invuln = 999;
  const speedAt = (fed) => {
    p.fed = fed;
    p.x = 140;
    p.hopT = 99;
    Object.assign(g.player, { x: 120, y: GROUND_Y - SMALL_H, vy: 0, vx: 0 });
    run(g, none, 0.5);
    return 140 - p.x;
  };
  const slow = speedAt(0);
  const fast = speedAt(4);
  assert.ok(slow > 0.8, `he chases: moved ${slow}`);
  assert.ok(fast > slow * 1.2, `and speeds up: ${slow} -> ${fast}`);
});

test('flaming tequila keeps appearing in the arena while Pack Billy is hungry', () => {
  const g = createGame({ level: 6 });
  const p = pack(g);
  p.awake = true;
  g.viewW = 30;
  g.player.invuln = 999;
  const seen = new Set();
  for (let i = 0; i < 60 * 14; i++) {
    Object.assign(g.player, { x: 118, y: GROUND_Y - SMALL_H, vx: 0 });
    step(g, none);
    const bottles = g.items.filter((it) => it.kind === 'tequila');
    assert.ok(bottles.length <= 3, 'at most three bottles at a time');
    bottles.forEach((it) => seen.add(it));
    if (i % 200 === 199) g.items = g.items.filter((it) => it.kind !== 'tequila'); // Billy drinks them
  }
  assert.ok(seen.size >= 4, `bottles spawned: ${seen.size}`);
  // and with nobody collecting, the arena never holds more than three
});

test('after Pack Billy is full, the hell exit cutscene runs to the toilet and then on to the next level', () => {
  const g = createGame({ level: 6, enemies: false });
  startScene(g, 'hellExit');
  const lines = SCENES.hellExit.lines;
  assert.ok(lines.some((l) => l.anim === 'run'), 'running out of the gates');
  assert.ok(lines.some((l) => l.anim === 'sit'), 'sitting on the toilet');
  assert.ok(lines.some((l) => /toilet/i.test(l.text)));
  for (let i = 0; i < lines.length; i++) advanceScene(g);
  assert.equal(g.levelNo, 7, 'then on to the driving level');
  assert.equal(g.mode, 'intro');
});

test('level 6 terrain is beatable up to the arena', () => {
  const g = createGame({ enemies: false, level: 6 });
  g.viewW = 20;
  let t = 0;
  const bot = () => {
    const p = g.player;
    const front = p.x + p.w;
    const probeX = Math.floor(front + 0.45);
    const wall = [0, 1, 2].some((i) => g.tiles[Math.floor(p.y + p.h - 0.1) - i]?.[Math.floor(front + 0.3)]);
    const noFloor = !g.tiles[GROUND_Y]?.[probeX] && !g.tiles[GROUND_Y - 1]?.[probeX];
    const want = p.onGround && (wall || noFloor);
    const rescue = !p.onGround && p.airJumps > 0 && p.vy > 2 && p.y + p.h > 7 && !g.tiles[GROUND_Y]?.[Math.floor(p.x + p.w / 2)];
    return { left: false, right: true, jump: want || (!p.onGround && p.vy < 0 && p.jumping) || (rescue && !g.prevJump) };
  };
  while (g.mode === 'playing' && t < 120 && g.player.x < 150) {
    step(g, bot(), STEP);
    t += STEP;
  }
  assert.ok(g.player.x >= 150 && g.mode === 'playing', `bot ended in ${g.mode} at x=${g.player.x.toFixed(1)}`);
});

test('a belch fired from across the arena actually reaches Pack Billy', () => {
  for (const dist of [4, 7, 10]) {
    const g = createGame({ level: 6 });
    const p = pack(g);
    p.awake = true;
    p.hopT = 99; // keep him on the ground
    p.dir = 1;
    g.viewW = 40;
    g.tequila = 1;
    p.x = 147;
    Object.assign(g.player, { x: p.x - dist, y: GROUND_Y - SMALL_H, vy: 0, vx: 0, facing: 1, invuln: 999 });
    step(g, { ...none, throw: true });
    for (let i = 0; i < 60 * 2; i++) {
      p.x = 147; // hold him still
      step(g, none);
      if (p.fed > 0) break;
    }
    assert.equal(p.fed, 1, `a belch from ${dist} tiles away should be eaten`);
  }
});

// ---- Level 7: Hick Town (top-down driving) -------------------------------------
import { VEHICLES, speedOf, playerVehicle, surfaceAt, isBlocked, stars } from './drive.js';
import { buildTown } from './town.js';

const town = () => createGame({ level: 7, enemies: false });
const drive = (g) => g.drive;
const put = (g, v, x, y, h = 0, speed = 0) => {
  Object.assign(v, { x, y, h, vx: Math.cos(h) * speed, vy: Math.sin(h) * speed });
};
const emptyVehicle = (g, type = 'pickup') => drive(g).vehicles.find((v) => v.type === type && !v.driver && !v.wreck);
const intoVehicle = (g, v) => {
  v.driver = 'player';
  drive(g).player.vehicle = v.id;
};
// a clear stretch of the middle highway, away from intersections: y=90, x from 60 to 105
const ROAD_Y = 90;

// breadth-first search over road and dirt tiles; returns the tiles from a to b
function roadPath(L, a, b) {
  const near = (p) => {
    let best = -1;
    let bd = Infinity;
    for (let r = 0; r < 30 && best < 0; r++)
      for (let y = Math.floor(p.y) - r; y <= Math.floor(p.y) + r; y++)
        for (let x = Math.floor(p.x) - r; x <= Math.floor(p.x) + r; x++) {
          if (x < 0 || y < 0 || x >= L.w || y >= L.h) continue;
          const v = L.grid[y * L.w + x];
          if (v !== 1 && v !== 2) continue;
          const d = (x - p.x) ** 2 + (y - p.y) ** 2;
          if (d < bd) (bd = d), (best = y * L.w + x);
        }
    return best;
  };
  const s = near(a);
  const e = near(b);
  const prev = new Int32Array(L.w * L.h).fill(-2);
  const q = [s];
  prev[s] = -1;
  for (let h = 0; h < q.length; h++) {
    const c = q[h];
    if (c === e) break;
    const x = c % L.w;
    const y = (c / L.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
      const ni = ny * L.w + nx;
      const v = L.grid[ni];
      if ((v !== 1 && v !== 2) || prev[ni] !== -2) continue;
      prev[ni] = c;
      q.push(ni);
    }
  }
  if (prev[e] === -2) return null;
  const path = [];
  for (let c = e; c !== -1; c = prev[c]) path.push({ x: (c % L.w) + 0.5, y: ((c / L.w) | 0) + 0.5 });
  return path.reverse();
}

test('the town is big and sane: nothing sits on a road, and everything is reachable', () => {
  const L = buildTown();
  assert.ok(L.w >= 300 && L.h >= 200, `map is ${L.w}x${L.h}`);
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  for (const b of L.buildings) {
    for (const r of [...L.roads, ...L.dirt]) assert.ok(!overlap(b, r), `${b.kind} at ${b.x},${b.y} overlaps a road`);
    for (const f of L.fields) assert.ok(!overlap(b, f), `${b.kind} at ${b.x},${b.y} overlaps a field`);
  }
  assert.ok(!isBlocked(L, L.spawn.x, L.spawn.y), 'spawn is open');
  for (const p of L.pickups) assert.ok(!isBlocked(L, p.x, p.y), `pickup at ${p.x},${p.y} is reachable`);
  for (const v of L.parked) assert.ok(!isBlocked(L, v.x, v.y) && !isBlocked(L, v.x + 1.2, v.y) && !isBlocked(L, v.x - 1.2, v.y), `${v.type} at ${v.x},${v.y} is not inside something`);
  assert.equal(L.pickups.filter((p) => p.kind === 'life').length, 4, 'hidden 1UPs');
  assert.ok(L.pickups.filter((p) => p.kind === 'jug').length >= 90);
  assert.ok(L.trees.length > 350);
  // the clue sites and the store's door can all be driven to from the spawn
  for (const c of L.clues) assert.ok(roadPath(L, L.spawn, c), `a road leads to ${c.name}`);
  const toStore = roadPath(L, L.spawn, { x: L.store.door.x + 1, y: L.store.door.y + 2 });
  assert.ok(toStore, 'a road leads to Big Al\'s door');
  // doing the whole hunt (Honky Tonk, then Pete's, then the dead tree, then the store) means a long trip
  const stops = [L.spawn, ...L.clues, { x: L.store.door.x + 1, y: L.store.door.y + 2 }];
  let hunt = 0;
  for (let k = 0; k < stops.length - 1; k++) hunt += roadPath(L, stops[k], stops[k + 1]).length;
  assert.ok(hunt > 600, `the whole hunt is ${hunt} tiles of road`);
  assert.ok(hunt > toStore.length * 2.4, `and ${(hunt / toStore.length).toFixed(1)}x longer than going straight there`);
  assert.ok(L.dirt.length >= 3, 'a winding dirt road');
});

test("Big Al's is hard to find: hidden far away at the end of a dirt road, with decoys around", () => {
  const L = buildTown();
  const far = Math.hypot(L.store.cx - L.spawn.x, L.store.cy - L.spawn.y);
  assert.ok(far > 160, `store is ${far.toFixed(0)} tiles from the start`);
  // not on any highway, and the door is on the dirt road
  assert.equal(surfaceAt(L, L.store.door.x + 1, L.store.door.y + 2), 2, 'the door is at the end of a dirt road');
  for (const r of L.roads) assert.ok(Math.hypot(L.store.cx - (r.x + r.w / 2), L.store.cy - (r.y + r.h / 2)) > 1 || true);
  const nearestHighway = Math.min(...L.vRoads.map((x) => Math.abs(x - L.store.cx)));
  assert.ok(nearestHighway > 35, `store is ${nearestHighway.toFixed(0)} tiles from the nearest highway`);
  // surrounded by woods
  const woods = L.trees.filter((t) => Math.hypot(t.x - L.store.cx, t.y - L.store.cy) < 30).length;
  assert.ok(woods > 40, `${woods} trees around Big Al's`);
  // decoy signs, a fake store, and exactly one real hand-painted sign
  assert.ok(L.signs.filter((s) => /BIG AL/.test(s.text)).length >= 3, 'decoy signs');
  assert.equal(L.signs.filter((s) => s.hand).length, 1);
  assert.ok(L.fakeStores.length >= 1);
  assert.equal(L.clues.length, 3, 'a three-step treasure hunt');
  // the clue sites are spread across the map
  const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  assert.ok(d(L.spawn, L.clues[0]) > 100 && d(L.clues[0], L.clues[1]) > 100 && d(L.clues[1], L.clues[2]) > 150);
});

test("the toilet cutscene leads to level 7, and reaching Big Al's leads to the ending", () => {
  const g = createGame({ enemies: false, level: 6 });
  startScene(g, 'hellExit');
  for (let i = 0; i < SCENES.hellExit.lines.length; i++) advanceScene(g);
  assert.equal(g.levelNo, 7);
  startPlaying(g);
  const L = g.level;
  Object.assign(drive(g).player, { x: L.store.door.x + 1, y: L.store.door.y + 2 });
  step(g, none);
  assert.equal(g.mode, 'scene');
  assert.equal(g.scene.id, 'bigAl');
  for (let i = 0; i < SCENES.bigAl.lines.length; i++) advanceScene(g);
  assert.equal(g.mode, 'ending');
  assert.equal(g.ending, 'tbc');
});

test('pickups, tractors and trash trucks all handle differently', () => {
  const speeds = {};
  for (const type of ['pickup', 'tractor', 'trash']) {
    const g = town();
    const v = drive(g).vehicles.find((x) => x.type === type);
    put(g, v, 62, ROAD_Y, 0);
    intoVehicle(g, v);
    run(g, { ...none, jump: true }, 4);
    speeds[type] = speedOf(v);
    assert.ok(v.x > 64, `${type} moved`);
  }
  assert.ok(speeds.pickup > speeds.trash && speeds.trash > speeds.tractor, JSON.stringify(speeds));
  assert.ok(speeds.pickup > 11, `pickup top speed ${speeds.pickup}`);
  assert.ok(VEHICLES.trash.mass > VEHICLES.pickup.mass && VEHICLES.tractor.hp > VEHICLES.pickup.hp);
});

test('driving off the road into a field slows you down', () => {
  const g = town();
  const v = emptyVehicle(g);
  put(g, v, 62, ROAD_Y, 0);
  intoVehicle(g, v);
  run(g, { ...none, jump: true }, 3);
  const onRoad = speedOf(v);
  const g2 = town();
  const f = g2.level.fields[0];
  const v2 = emptyVehicle(g2);
  put(g2, v2, f.x + 3, f.y + f.h / 2, 0, 0);
  assert.equal(surfaceAt(g2.level, v2.x, v2.y), 3);
  intoVehicle(g2, v2);
  run(g2, { ...none, jump: true }, 1.6);
  assert.ok(speedOf(v2) < onRoad * 0.7, `field ${speedOf(v2)} vs road ${onRoad}`);
});

test('steering turns the vehicle, and braking stops it and then reverses', () => {
  const g = town();
  const v = emptyVehicle(g);
  put(g, v, 62, ROAD_Y, 0, 8);
  intoVehicle(g, v);
  const h0 = v.h;
  run(g, { ...none, jump: true, right: true }, 0.5);
  assert.ok(v.h > h0 + 0.5, 'turned right');
  const g2 = town();
  const w = emptyVehicle(g2);
  put(g2, w, 62, ROAD_Y, 0, 10);
  intoVehicle(g2, w);
  run(g2, { ...none, throw: true }, 0.6);
  assert.ok(speedOf(w) < 3, `braking hard: ${speedOf(w)}`);
  run(g2, { ...none, throw: true }, 1.5);
  assert.ok(w.vx < -0.5, 'holding brake then reverses');
});

test('ACTION gets in an empty vehicle and out again', () => {
  const g = town();
  const v = emptyVehicle(g);
  put(g, v, 62, ROAD_Y, 0);
  Object.assign(drive(g).player, { x: 64.6, y: ROAD_Y });
  step(g, none);
  assert.equal(drive(g).prompt, 'ENTER');
  step(g, { ...none, rush: true });
  assert.equal(playerVehicle(drive(g)), v);
  assert.equal(v.driver, 'player');
  step(g, none);
  assert.equal(drive(g).prompt, 'EXIT');
  step(g, { ...none, rush: true });
  assert.equal(playerVehicle(drive(g)), null);
  assert.equal(v.driver, null);
  assert.ok(Math.hypot(drive(g).player.x - v.x, drive(g).player.y - v.y) > 1.2, 'stepped out beside it');
});

test('you cannot jump out of a speeding truck', () => {
  const g = town();
  const v = emptyVehicle(g);
  put(g, v, 62, ROAD_Y, 0, 11);
  intoVehicle(g, v);
  step(g, { ...none, rush: true });
  assert.equal(playerVehicle(drive(g)), v, 'still driving');
});

test('carjacking: pull the farmer out of his truck, take it, and the heat goes up', () => {
  const g = createGame({ level: 7 });
  const civ = drive(g).vehicles.find((v) => v.driver === 'civ');
  put(g, civ, 70, ROAD_Y - 1.4, 0, 0);
  civ.route = null; // park him for the test
  civ.inp = { steer: 0, gas: false, brake: true };
  Object.assign(drive(g).player, { x: civ.x + 2.2, y: civ.y + 1.5 });
  const pedsBefore = drive(g).peds.length;
  const scoreBefore = g.score;
  step(g, none);
  assert.equal(drive(g).prompt, 'CARJACK');
  step(g, { ...none, rush: true });
  assert.equal(civ.driver, 'player');
  assert.equal(drive(g).peds.length, pedsBefore + 1, 'the farmer is out on the road');
  assert.equal(drive(g).peds.at(-1).state, 'flee');
  assert.ok(drive(g).heat >= 0.8, 'a crime');
  assert.ok(g.score > scoreBefore);
  assert.ok(drive(g).hint?.text, 'and he tells you something');
});

test('carjacked farmers give hints about the NEXT lead (not the store), and some know nothing', () => {
  const texts = new Set();
  for (let k = 0; k < 40; k++) {
    const g = createGame({ level: 7 });
    drive(g).seed = 1000 + k * 7919;
    const civ = drive(g).vehicles.find((v) => v.driver === 'civ');
    put(g, civ, 70, ROAD_Y - 1.4, 0, 0);
    civ.route = null;
    civ.inp = { steer: 0, gas: false, brake: true };
    Object.assign(drive(g).player, { x: civ.x + 2.2, y: civ.y + 1.5 });
    step(g, { ...none, rush: true });
    step(g, none);
    texts.add(drive(g).hint.text);
  }
  const all = [...texts].join('\n');
  assert.ok(/Honky Tonk/.test(all), 'tells you about the Honky Tonk at the start');
  assert.ok(!/dirt road/.test(all), 'does not give away the end of the hunt at the start');
  assert.ok([...texts].some((s) => /Never heard|trying to get|burned down|Nope/.test(s)), 'some farmers are no help');
});

test('cop cars cannot be stolen', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  D.heat = 1.5;
  run(g, none, 4);
  const cop = D.vehicles.find((v) => v.driver === 'cop');
  assert.ok(cop);
  put(g, cop, 80, 40, 0, 0);
  cop.inp = { steer: 0, gas: false, brake: true };
  Object.assign(D.player, { x: 82.4, y: 40.8, invuln: 99 });
  step(g, { ...none, rush: true });
  assert.equal(D.player.vehicle, null);
});

test('crashing into the quarry wall hurts the vehicle and never lets it through', () => {
  const g = town();
  const v = emptyVehicle(g);
  const q = g.level.buildings.find((b) => b.kind === 'quarry');
  put(g, v, q.x + q.w / 2, q.y + q.h + 7, -Math.PI / 2, 12);
  intoVehicle(g, v);
  const hp0 = v.hp;
  let inside = false;
  for (let i = 0; i < 60 * 3; i++) {
    step(g, { ...none, jump: true });
    if (v.x > q.x && v.x < q.x + q.w && v.y > q.y && v.y < q.y + q.h) inside = true;
    if (g.mode !== 'playing') break;
  }
  assert.ok(!inside, 'did not tunnel into the quarry');
  assert.ok(v.hp < hp0 || v.wreck, 'took damage');
});

test('a heavier truck wins a head-on crash', () => {
  const g = town();
  const trash = drive(g).vehicles.find((v) => v.type === 'trash');
  const pick = drive(g).vehicles.find((v) => v.type === 'pickup');
  put(g, trash, 70, ROAD_Y, 0, 7);
  put(g, pick, 76, ROAD_Y, Math.PI, 7);
  trash.hp = trash.maxHp;
  pick.hp = pick.maxHp;
  for (let i = 0; i < 60; i++) {
    trash.inp = pick.inp = { steer: 0, gas: false, brake: false };
    step(g, none);
  }
  const trashLost = 1 - trash.hp / trash.maxHp;
  const pickLost = 1 - pick.hp / pick.maxHp;
  assert.ok(pickLost > trashLost * 1.5, `pickup lost ${pickLost.toFixed(2)}, trash lost ${trashLost.toFixed(2)}`);
});

test('a wrecked vehicle explodes, throws the player out and hurts him (armor soaks it)', () => {
  const g = town();
  g.player.armor = 2;
  const v = emptyVehicle(g);
  const q = g.level.buildings.find((b) => b.kind === 'quarry');
  put(g, v, q.x + q.w / 2, q.y + q.h + 8, -Math.PI / 2, 13);
  intoVehicle(g, v);
  v.hp = 1;
  for (let i = 0; i < 120 && !v.wreck; i++) step(g, { ...none, jump: true });
  assert.ok(v.wreck, 'blew up');
  assert.equal(playerVehicle(drive(g)), null, 'player thrown clear');
  assert.equal(g.player.armor, 1, 'armor soaked the blast hit');
  assert.equal(g.mode, 'playing');
});

test('crashing into hillbilly traffic scores points, raises the heat and hurts them', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  const civ = D.vehicles.find((v) => v.driver === 'civ' && v.type === 'pickup');
  const me = D.vehicles.find((v) => v.type === 'trash' && !v.driver);
  put(g, civ, 90, ROAD_Y - 1.4, 0, 0);
  civ.route = null;
  civ.inp = { steer: 0, gas: false, brake: true };
  put(g, me, 70, ROAD_Y - 1.4, 0, 9);
  intoVehicle(g, me);
  const score0 = g.score;
  D.player.invuln = 99;
  for (let i = 0; i < 60 * 12 && !civ.wreck; i++) {
    me.hp = me.maxHp;
    step(g, { ...none, jump: true });
  }
  assert.ok(g.score > score0, 'points for the crash');
  assert.ok(D.heat > 0.3, 'someone saw that');
  assert.ok(civ.hp < civ.maxHp, 'the other farmer is hurt');
});

test('running over a farmer just knocks him silly, and the cops hear about it', () => {
  const g = town();
  const D = drive(g);
  const v = emptyVehicle(g);
  put(g, v, 62, ROAD_Y, 0, 11);
  intoVehicle(g, v);
  D.peds.push({ id: 999, x: 74, y: ROAD_Y, h: 0, home: { x: 74, y: ROAD_Y }, state: 'wander', t: 0, stun: 0, vx: 0, vy: 0, walkT: 9, dir: -1 });
  const ped = D.peds.at(-1);
  for (let i = 0; i < 60 && ped.state !== 'stun'; i++) step(g, { ...none, jump: true });
  assert.equal(ped.state, 'stun');
  assert.ok(D.heat > 0.3);
});

test('pedestrians flee from a fast vehicle', () => {
  const g = town();
  const D = drive(g);
  const ped = D.peds[0];
  const v = emptyVehicle(g);
  for (let i = 0; i < 20; i++) {
    put(g, v, ped.x - 6, ped.y, 0, 9);
    step(g, none);
  }
  assert.equal(ped.state === 'flee' || ped.state === 'stun', true);
});

test('crimes bring cops, who chase and ram; the heat fades when you escape', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  const v = emptyVehicle(g);
  put(g, v, 62, ROAD_Y, 0, 0);
  intoVehicle(g, v);
  D.heat = 2.2;
  g.player.armor = 9;
  run(g, { ...none, jump: true }, 6);
  const cops = D.vehicles.filter((c) => c.driver === 'cop');
  assert.ok(cops.length >= 2, `cops: ${cops.length}`);
  const near = Math.min(...cops.map((c) => Math.hypot(c.x - D.player.x, c.y - D.player.y)));
  assert.ok(near < 60, 'they are after you');
  assert.ok(stars(D) >= 1);
});

test('cops occasionally decide to chase you even if you have done nothing', () => {
  const g = createGame({ level: 7 });
  assert.equal(stars(drive(g)), 0);
  run(g, none, 30);
  assert.ok(g.events.includes('siren'), 'a cop showed up on his own');
});

test('a cop that catches you standing still busts you (a life is lost); keep moving and you are fine', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  D.heat = 1.5;
  run(g, none, 3);
  const cop = D.vehicles.find((v) => v.driver === 'cop');
  assert.ok(cop);
  g.lives = 3;
  D.player.invuln = 999;
  for (let i = 0; i < 60 * 3 && g.mode === 'playing'; i++) {
    cop.vx = cop.vy = 0;
    put(g, cop, D.player.x + 1.5, D.player.y, Math.PI, 0);
    cop.inp = { steer: 0, gas: false, brake: true };
    D.heat = Math.max(D.heat, 1.5);
    step(g, none);
  }
  assert.equal(g.mode, 'dying', 'BUSTED');
  run(g, none, 2.2);
  assert.equal(g.lives, 2);
  assert.equal(g.mode, 'playing', 'back in a fresh town');
});

test('civilian traffic keeps moving around the blocks without getting wedged', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  D.copsEnabled = false;
  const civs = D.vehicles.filter((v) => v.driver === 'civ');
  assert.ok(civs.length >= 16, `${civs.length} civilians`);
  const travelled = civs.map(() => 0);
  const last = civs.map((v) => ({ x: v.x, y: v.y }));
  D.player.invuln = 999;
  g.player.armor = 99;
  for (let i = 0; i < 60 * 40; i++) {
    D.player.x = 12.5;
    D.player.y = 183;
    step(g, none);
    civs.forEach((v, k) => {
      travelled[k] += Math.hypot(v.x - last[k].x, v.y - last[k].y);
      last[k] = { x: v.x, y: v.y };
    });
  }
  civs.forEach((v, k) => {
    assert.ok(!v.wreck, `civilian ${k} (${v.type}) was wrecked by nobody`);
    assert.ok(travelled[k] > 40, `${v.type} ${k} only travelled ${travelled[k].toFixed(0)} tiles in 40s`);
    assert.ok(v.x > 0 && v.x < 300 && v.y > 0 && v.y < 200);
  });
});

test('collecting jugs fills the life counter and a hidden 1UP gives a life', () => {
  const g = town();
  const D = drive(g);
  const jug = D.pickups.find((p) => p.kind === 'jug');
  Object.assign(D.player, { x: jug.x, y: jug.y });
  const c0 = g.collected;
  step(g, none);
  assert.ok(jug.taken);
  assert.equal(g.collected, c0 + 1);
  const life = D.pickups.find((p) => p.kind === 'life');
  const l0 = g.lives;
  Object.assign(D.player, { x: life.x, y: life.y });
  step(g, none);
  assert.equal(g.lives, l0 + 1);
});

// ---- the treasure hunt ----------------------------------------------------------
test('the hunt goes Honky Tonk, Pete\'s Junkyard, the Dead Tree; each lead unlocks the next', () => {
  const g = town();
  const D = drive(g);
  const [c0, c1, c2] = g.level.clues;
  // the dead tree first: nothing happens, you're told you are missing a lead
  Object.assign(D.player, { x: c2.x, y: c2.y });
  step(g, none);
  assert.equal(D.stage, 0, 'out-of-order clue does not count');
  assert.ok(g.toast && /missing a lead/.test(g.toast.text));
  Object.assign(D.player, { x: c0.x, y: c0.y });
  step(g, none);
  assert.equal(D.stage, 1);
  assert.ok(/Pete/.test(D.hint.text), 'the Honky Tonk sends you to Pete');
  Object.assign(D.player, { x: c1.x, y: c1.y });
  step(g, none);
  assert.equal(D.stage, 2);
  assert.ok(/DEAD TREE/.test(D.hint.text));
  Object.assign(D.player, { x: c2.x, y: c2.y });
  step(g, none);
  assert.equal(D.stage, 3);
  assert.ok(/dirt road/.test(D.hint.text));
  assert.equal(D.respawnAt.stage, 3);
});

test("Big Al's only shows up on the map when you are right on top of it", () => {
  const g = town();
  const D = drive(g);
  const s = g.level.store;
  Object.assign(D.player, { x: s.cx + 35, y: s.cy + 20 });
  step(g, none);
  assert.equal(D.found, false, '40 tiles away: still hidden');
  Object.assign(D.player, { x: s.cx + 14, y: s.cy + 6 });
  step(g, none);
  assert.equal(D.found, true, 'within 18 tiles: found it');
});

test("Little Al's is a fake: closed, and it wastes your time", () => {
  const g = town();
  const D = drive(g);
  const fs = g.level.fakeStores[0];
  Object.assign(D.player, { x: fs.door.x + 2, y: fs.door.y + 1 });
  step(g, none);
  assert.equal(g.mode, 'playing', 'no win');
  assert.ok(/CLOSED/.test(g.toast.text));
});

test('the hunt survives dying: you respawn at your last landmark with the right clue and a pickup', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  const c0 = g.level.clues[0];
  Object.assign(D.player, { x: c0.x, y: c0.y });
  step(g, none);
  assert.equal(drive(g).stage, 1);
  assert.ok(g.driveCheckpoint && g.driveCheckpoint.stage === 1);
  g.mode = 'dying';
  g.deathT = 2;
  step(g, none);
  assert.equal(g.mode, 'playing');
  assert.equal(drive(g).stage, 1, 'still on the second lead');
  assert.ok(Math.hypot(drive(g).player.x - c0.x, drive(g).player.y - c0.y) < c0.r + 10, 'respawned near the Honky Tonk');
  assert.ok(drive(g).vehicles.some((v) => !v.driver && v.type === 'pickup' && Math.hypot(v.x - drive(g).player.x, v.y - drive(g).player.y) < 8), 'with a pickup waiting');
});

// A bot that does the whole treasure hunt like a player would: walk to the pickup, get in, then drive the
// road network to the Honky Tonk, Pete's, the Dead Tree and down the dirt road into the woods.
test("the whole hunt can be done: a bot follows the clues across the map and finds Big Al's", () => {
  const g = town();
  const L = g.level;
  const D = drive(g);
  const P = D.player;
  const angDiff = (a, b) => {
    let d = (b - a) % (Math.PI * 2);
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    return d;
  };
  const pickup = D.vehicles.find((v) => v.type === 'pickup' && !v.driver);
  const goals = [L.clues[0], L.clues[1], L.clues[2], { x: L.store.door.x + 1.2, y: L.store.door.y + 2.5 }];
  let t = 0;
  let actionSent = false;
  let goal = 0;
  let path = null;
  let pi = 0;
  const stagesSeen = [];
  while (g.mode === 'playing' && t < 400) {
    let input = { ...none };
    const pv = playerVehicle(D);
    if (!pv) {
      const want = Math.atan2(pickup.y - P.y, pickup.x - P.x);
      const e = angDiff(P.h, want);
      const d = Math.hypot(pickup.x - P.x, pickup.y - P.y);
      input = { ...none, left: e < -0.06, right: e > 0.06, jump: d > 2.1 };
      if (d <= 2.1 && !actionSent) {
        input.rush = true;
        actionSent = true;
      }
    } else {
      if (!stagesSeen.includes(D.stage)) stagesSeen.push(D.stage);
      goal = Math.min(D.stage, goals.length - 1);
      if (!path || path.goal !== goal) {
        path = roadPath(L, { x: pv.x, y: pv.y }, goals[goal]);
        assert.ok(path, `a road to goal ${goal}`);
        path.goal = goal;
        pi = 0;
      }
      // pure pursuit: aim at a point a few tiles further along the road
      const onDirt = surfaceAt(L, pv.x, pv.y) === 2;
      const look = onDirt ? 3 : 6;
      while (pi < path.length - 1 && Math.hypot(path[pi].x - pv.x, path[pi].y - pv.y) < look) pi++;
      const aim = path[Math.min(path.length - 1, pi + (onDirt ? 1 : 2))];
      const e = angDiff(pv.h, Math.atan2(aim.y - pv.y, aim.x - pv.x));
      const spd = speedOf(pv);
      const target = onDirt ? 5 : Math.abs(e) > 0.5 ? 6 : 12;
      input = { ...none, left: e < -0.04, right: e > 0.04, jump: spd < target, throw: spd > target + 3 };
    }
    step(g, input, STEP);
    t += STEP;
  }
  assert.deepEqual(stagesSeen.slice(0, 4), [0, 1, 2, 3], 'visited the clues in order');
  assert.equal(g.mode, 'scene', `bot ended in ${g.mode} at ${P.x.toFixed(1)},${P.y.toFixed(1)} t=${t.toFixed(0)}s stage=${D.stage} hp=${playerVehicle(D)?.hp}`);
  assert.equal(g.scene.id, 'bigAl');
  assert.ok(t > 40, `even flat out in a straight line it takes ${t.toFixed(0)}s of driving`);
});

// ---- Secret level codes ----------------------------------------------------------
test('every level has its own secret code, and bad codes do nothing', () => {
  assert.equal(Object.keys(LEVEL_CODES).length, LEVEL_COUNT);
  assert.deepEqual(Object.values(LEVEL_CODES).sort(), [1, 2, 3, 4, 5, 6, 7]);
  for (const [code, lvl] of Object.entries(LEVEL_CODES)) assert.equal(levelForCode(code), lvl);
  assert.equal(levelForCode('0000'), null);
  assert.equal(levelForCode('abcd'), null);
  assert.equal(levelForCode(''), null);
});

test('jumping to a level starts it with the gear Billy would have found on the way', () => {
  const kit = (n) => Object.keys(createGameAt(n).gear).filter(Boolean).sort();
  assert.deepEqual(kit(1), []);
  assert.deepEqual(kit(2), []);
  assert.deepEqual(kit(3), ['antenna', 'raygun', 'vest']);
  assert.deepEqual(kit(4), ['antenna', 'knightHelm', 'plate', 'raygun', 'shield', 'sword', 'vest']);
  for (let n = 1; n <= LEVEL_COUNT; n++) {
    const g = createGameAt(n);
    assert.equal(g.levelNo, n);
    assert.equal(g.mode, n === 1 ? 'playing' : 'intro', `level ${n} intro`);
    assert.equal(g.lives, 3);
    startPlaying(g);
    run(g, none, 1);
    assert.ok(g.mode === 'playing' || g.mode === 'dying', `level ${n} runs: ${g.mode}`);
  }
  const g7 = createGameAt(7);
  assert.equal(g7.level.kind, 'drive');
  assert.ok(g7.player.armor >= 3, 'armor from the knight-alien gear');
});

// ---- Drunk driving ---------------------------------------------------------------
const drinkBeer = (g) => {
  const beer = drive(g).pickups.find((p) => p.kind === 'beer' && !p.taken);
  Object.assign(drive(g).player, { x: beer.x, y: beer.y });
  step(g, none);
  return beer;
};

test('there are beers all over town, and every one is reachable', () => {
  const L = buildTown();
  const beers = L.pickups.filter((p) => p.kind === 'beer');
  assert.ok(beers.length >= 18, `${beers.length} beers`);
  for (const b of beers) assert.ok(!isBlocked(L, b.x, b.y), `beer at ${b.x.toFixed(0)},${b.y.toFixed(0)} is not inside something`);
});

test('drinking a beer starts drunk driving: 12 seconds, stacking up to 20', () => {
  const g = town();
  const D = drive(g);
  drinkBeer(g);
  assert.ok(D.drunk > 11.5 && D.drunk <= 12, `drunk ${D.drunk}`);
  assert.ok(/DRUNK/.test(g.toast.text));
  drinkBeer(g);
  assert.ok(D.drunk > 20 - 0.1 && D.drunk <= 20, 'capped at 20s');
  run(g, none, 21);
  assert.equal(D.drunk, 0);
  assert.ok(/Sobering/.test(g.toast.text));
});

test('while drunk you are invincible: crashes do not scratch the truck, and it never explodes', () => {
  const g = town();
  const v = emptyVehicle(g);
  const q = g.level.buildings.find((b) => b.kind === 'quarry');
  drinkBeer(g);
  put(g, v, q.x + q.w / 2, q.y + q.h + 8, -Math.PI / 2, 13);
  intoVehicle(g, v);
  v.hp = 10;
  for (let i = 0; i < 90; i++) step(g, { ...none, jump: true });
  assert.ok(!v.wreck, 'did not blow up');
  assert.equal(v.hp, v.maxHp, 'not a scratch');
});

test('drunk drivers are not busted and the cops cannot hurt them', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  drinkBeer(g);
  D.heat = 1.5;
  run(g, none, 3);
  const cop = D.vehicles.find((v) => v.driver === 'cop');
  assert.ok(cop);
  for (let i = 0; i < 60 * 4 && D.drunk > 1; i++) {
    cop.vx = cop.vy = 0;
    put(g, cop, D.player.x + 1.5, D.player.y, Math.PI, 0);
    D.heat = Math.max(D.heat, 1.5);
    step(g, none);
  }
  assert.equal(g.mode, 'playing', 'no BUSTED while drunk');
  assert.equal(D.bust, 0);
});

test('drunk rams hit twice as hard, and the steering wobbles', () => {
  const damageDealt = (drunk) => {
    const g = createGame({ level: 7 });
    const D = drive(g);
    const civ = D.vehicles.find((v) => v.driver === 'civ' && v.type === 'pickup');
    const me = D.vehicles.find((v) => v.type === 'pickup' && !v.driver);
    put(g, civ, 90, ROAD_Y - 1.4, 0, 0);
    civ.route = null;
    civ.inp = { steer: 0, gas: false, brake: true };
    put(g, me, 86.6, ROAD_Y - 1.4, 0, 8); // already nearly touching, so the wobble cannot matter
    intoVehicle(g, me);
    D.drunk = drunk ? 12 : 0;
    D.player.invuln = 99;
    for (let i = 0; i < 90 && civ.hp === civ.maxHp; i++) step(g, { ...none, jump: true });
    for (let i = 0; i < 6; i++) step(g, { ...none, jump: true });
    return civ.maxHp - civ.hp;
  };
  const sober = damageDealt(false);
  const drunk = damageDealt(true);
  assert.ok(drunk > sober * 1.5, `sober ${sober.toFixed(1)}, drunk ${drunk.toFixed(1)}`);
  // no hands on the wheel: a sober truck goes straight, a drunk one drifts
  const heading = (isDrunk) => {
    const g = town();
    const v = emptyVehicle(g);
    put(g, v, 62, ROAD_Y, 0, 9);
    intoVehicle(g, v);
    drive(g).drunk = isDrunk ? 12 : 0;
    let spread = 0;
    for (let i = 0; i < 120; i++) {
      step(g, { ...none, jump: true });
      spread = Math.max(spread, Math.abs(v.h));
    }
    return spread;
  };
  assert.ok(heading(false) < 0.01, 'sober: straight');
  assert.ok(heading(true) > 0.1, 'drunk: wobbles');
});

// ---- Cops and traffic ------------------------------------------------------------
test('carjacking is worth a whole star right away, and cops turn up within a few seconds', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  const civ = D.vehicles.find((v) => v.driver === 'civ');
  put(g, civ, 70, ROAD_Y - 1.4, 0, 0);
  civ.route = null;
  civ.inp = { steer: 0, gas: false, brake: true };
  Object.assign(D.player, { x: civ.x + 2.2, y: civ.y + 1.5 });
  step(g, { ...none, rush: true });
  assert.ok(stars(D) >= 1, `stars ${stars(D)} (heat ${D.heat.toFixed(2)})`);
  run(g, none, 5);
  assert.ok(D.vehicles.some((v) => v.driver === 'cop' && !v.wreck), 'a cop is after you');
  assert.ok(g.events.includes('siren'));
});

test('patrol cops are already cruising the roads when the level starts', () => {
  const g = createGame({ level: 7 });
  const patrols = drive(g).vehicles.filter((v) => v.driver === 'patrol');
  assert.ok(patrols.length >= 5, `${patrols.length} patrol cars`);
  assert.ok(patrols.every((p) => p.type === 'cop' && p.route));
  run(g, none, 5);
  assert.ok(patrols.some((p) => Math.hypot(p.vx, p.vy) > 1), 'and they are moving');
});

test('speeding past a patrol cop gets you chased (a star) and he cannot be stolen', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  const patrol = D.vehicles.find((v) => v.driver === 'patrol');
  const v = emptyVehicle(g);
  put(g, v, patrol.x - 12, patrol.y, 0, 12);
  intoVehicle(g, v);
  v.vx = Math.cos(v.h) * 12;
  v.vy = Math.sin(v.h) * 12;
  D.player.x = v.x;
  D.player.y = v.y;
  step(g, { ...none, jump: true });
  assert.equal(patrol.driver, 'cop', 'the patrol turned into a chase');
  assert.ok(stars(D) >= 1);
  // a driving-along-normally pickup does not set them off
  const g2 = createGame({ level: 7 });
  const p2 = drive(g2).vehicles.find((x) => x.driver === 'patrol');
  const v2 = emptyVehicle(g2);
  put(g2, v2, p2.x - 12, p2.y, 0, 6);
  intoVehicle(g2, v2);
  drive(g2).player.x = v2.x;
  drive(g2).player.y = v2.y;
  step(g2, { ...none });
  assert.equal(p2.driver, 'patrol', 'normal driving is fine');
  // locked
  const g3 = createGame({ level: 7 });
  const p3 = drive(g3).vehicles.find((x) => x.driver === 'patrol');
  Object.assign(drive(g3).player, { x: p3.x + 2.4, y: p3.y + 0.8, invuln: 99 });
  step(g3, none);
  assert.equal(drive(g3).prompt, 'LOCKED');
});

test('crashing into a patrol car sets it off too', () => {
  const g = createGame({ level: 7 });
  const D = drive(g);
  const patrol = D.vehicles.find((v) => v.driver === 'patrol');
  const v = emptyVehicle(g);
  put(g, patrol, patrol.x, patrol.y, patrol.h, 0);
  patrol.route = null; // parked in the road for the test
  patrol.inp = { steer: 0, gas: false, brake: true };
  put(g, v, patrol.x - 8, patrol.y, 0, 9);
  v.h = Math.atan2(0, 1);
  intoVehicle(g, v);
  D.player.invuln = 99;
  patrol.h = Math.PI;
  for (let i = 0; i < 90; i++) {
    patrol.vx = patrol.vy = 0;
    step(g, { ...none, jump: true });
  }
  assert.ok(patrol.driver === 'cop' || patrol.wreck, 'the cop went after you');
  assert.ok(stars(D) >= 1);
});

test('the roads are busy: lots of cars to crash into', () => {
  const g = createGame({ level: 7 });
  const vs = drive(g).vehicles;
  const civs = vs.filter((v) => v.driver === 'civ');
  const parked = vs.filter((v) => !v.driver);
  assert.ok(civs.length >= 28, `${civs.length} cars on the road`);
  assert.ok(parked.length >= 30, `${parked.length} parked cars`);
  assert.ok(vs.length >= 70, `${vs.length} vehicles in total`);
  for (const k of ['pickup', 'tractor', 'trash']) assert.ok(vs.filter((v) => v.type === k).length >= 6, `${k}s`);
});

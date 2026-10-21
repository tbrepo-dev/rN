import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createGame, step, STEP, SHINE_MAX, AMMO_MAX, GEAR, LEVEL_COUNT, continueGame, startPlaying, loadLevel, advanceScene, chooseScene, startScene } from './engine/game';
import { Billy, Critter, Cob, Ray, Shot, Jug, OneUp, GearItem, Tile, Ground, Emoji, Booth, CastleGate, Fridge, Tequila, FlameBall, HellGate, gearEmoji } from './src/Sprites';
import { SceneView, EndingView } from './src/Scenes';
import { DriveView } from './src/Drive';
import { initAudio, play, toggleMute, isMuted, setMusicTheme } from './src/sound';


const THEME = {
  holler: { sky: '#7ec8e3', icon: '🏺', checkpoint: '📮', hills: ['#6aaa64', '#5b9a58'] },
  alien: { sky: '#170b3a', icon: '💎', checkpoint: '📡', hills: ['#2a2d6e', '#1f5a6b'] },
  medieval: { sky: '#e9a46b', icon: '🪙', checkpoint: '🚩', hills: ['#7d9a5a', '#667f4a'] },
  tower: { sky: '#241a3f', icon: '🍺', checkpoint: '🔔', hills: ['#2d2150', '#2d2150'] },
  japan: { sky: '#f6a5b0', icon: '🐟', checkpoint: '⛩️', hills: ['#b58aa5', '#9a7aa0'] },
  hell: { sky: '#240606', icon: '👻', checkpoint: '⛓️', hills: ['#4a120e', '#33100c'] },
  town: { sky: '#78b05a', icon: '🏺', checkpoint: '🚩', hills: ['#78b05a', '#78b05a'] },
};

const STORY = {
  2: {
    title: 'CRASH-LANDED',
    text: "A flying saucer just crashed on the ranch, and its crew wants Billy's shine!\nFind the alien ray gun, blast aliens for ammo, and collect enough crystals to power their Time Booth.",
  },
  3: {
    title: 'DARK AGES',
    text: "The Time Booth dumps Billy in the Middle Ages!\nGoblins, witches and trolls roam the road. Find a sword and shield, gather coins, and beat the Witch Queen to open the castle gate.",
  },
  4: {
    title: "THE WIZARD'S FRIDGE",
    text: "Climb the girders to the top of the tower while Honkey Kong, the albino ape in overalls, rolls barrels down at you.\nJump them, shoot them, slash them or block them, then grab the wizard's beer from the fridge!",
  },
  7: {
    title: "BIG AL'S LIQUOR STORE",
    text: "Billy climbs off the toilet, singed and thirsty.\nBig Al's Liquor Store is out there somewhere. Steal a ride (a pickup, a tractor or a trash truck), drive around Hick Town, and find it. Watch out for the cops!",
  },
  6: {
    title: 'HELL',
    text: "Billy wakes up in Hell, and it is HOT.\nThe gates are guarded by Pack Billy, a big, hungry, yellow hillbilly Pac-Man. Drink flaming tequila, BELCH flame balls, and feed him five. When he's full, he lets you leave.",
  },
  5: {
    title: 'THE PAGODA',
    text: "The wizard's magic sends Billy east: pagodas, cherry blossoms and a LOT of cats.\nNinja cats throw stars, samurai cats lunge. And at the end of the road waits Max, the burliest, fattest tabby around. He's old, he's slow, and he's very hard to beat.",
  },
};

// Static scenery that never changes: ground strips, tiles, trees, shack.
const Terrain = React.memo(function Terrain({ tiles, level, ts, theme }) {
  const els = [];
  const w = level.w;
  const ROWS = level.h;
  const GROUND_Y = level.groundY;
  let runStart = null;
  for (let x = 0; x <= w; x++) {
    const isGround = x < w && tiles[GROUND_Y][x] === 1;
    if (isGround && runStart === null) runStart = x;
    if (!isGround && runStart !== null) {
      els.push(<Ground key={`g${runStart}`} x0={runStart} x1={x} y={GROUND_Y} rows={ROWS - GROUND_Y} ts={ts} theme={theme} />);
      runStart = null;
    }
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y][x];
      if (t >= 2) els.push(<Tile key={`${x},${y}`} type={t} x={x} y={y} ts={ts} theme={theme} />);
    }
  }
  return <>{els}</>;
}, (a, b) => a.tiles === b.tiles && a.version === b.version && a.ts === b.ts);

const DECOR = {
  holler: { items: [6, 20, 41, 63, 78, 97, 106, 127, 135, 147], ch: '🌲', size: 1.6, lift: 1.5 },
  alien: { items: [5, 17, 36, 49, 66, 76, 94, 111, 127, 140], ch: '🍄', size: 1.5, lift: 1.3 },
  medieval: { items: [6, 18, 38, 52, 66, 77, 98, 117, 127, 147], ch: '🔥', size: 1.0, lift: 1.0 },
  tower: { items: [], ch: '', size: 1, lift: 1 },
  japan: { items: [7, 19, 33, 47, 70, 80, 96, 119, 133, 150], ch: '🏮', size: 1.1, lift: 1.1 },
  hell: { items: [5, 17, 36, 49, 66, 77, 95, 108, 124, 133, 144, 158], ch: '🔥', size: 1.1, lift: 1.0 },
};

const Scenery = React.memo(function Scenery({ level, ts }) {
  const d = DECOR[level.theme];
  const GROUND_Y = level.groundY;
  return (
    <>
      {level.theme === 'hell' && <Emoji ch="🪦" x={0.4} y={GROUND_Y - 1.2} size={1.2} ts={ts} />}
      {level.theme === 'japan' && (
        <>
          <Emoji ch="⛩️" x={-0.3} y={GROUND_Y - 3.2} size={3.4} ts={ts} />
          <Emoji ch="🏯" x={level.checkpointX + 3} y={GROUND_Y - 2.6} size={2.8} ts={ts} />
          <Emoji ch="🏯" x={level.goalX - 6} y={GROUND_Y - 3.8} size={4} ts={ts} />
        </>
      )}
      {level.theme === 'holler' && <Emoji ch="🏚️" x={-0.2} y={GROUND_Y - 2.4} size={2.6} ts={ts} />}
      {level.theme === 'alien' && (
        <>
          <Emoji ch="🛸" x={-0.6} y={GROUND_Y - 1.6} size={2.4} ts={ts} style={{ transform: [{ rotate: '-18deg' }] }} />
          <Emoji ch="💨" x={0.9} y={GROUND_Y - 2.8} size={1.4} ts={ts} />
        </>
      )}
      {level.theme === 'medieval' && <Emoji ch="🛖" x={0} y={GROUND_Y - 2} size={2.2} ts={ts} />}
      {d.items.map((x) => (
        <Emoji key={x} ch={d.ch} x={x} y={GROUND_Y - d.lift} size={d.size} ts={ts} />
      ))}
      {level.theme !== 'tower' && <Emoji ch={THEME[level.theme].checkpoint} x={level.checkpointX} y={GROUND_Y - 1} size={1} ts={ts} />}
      {level.theme === 'tower' && <Emoji ch={THEME.tower.checkpoint} x={level.checkpointX} y={level.checkpointFloor - 1} size={1} ts={ts} />}
      {level.goalKind === 'truck' && <Emoji ch="🛻" x={level.goalX - 0.5} y={GROUND_Y - 1.6} size={2.2} ts={ts} flip />}
    </>
  );
}, (a, b) => a.level === b.level && a.ts === b.ts);

// Stars, planets and hills; they scroll slower than the ground for depth
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97) % 100, y: (i * 53) % 62, s: 1 + (i % 3) }));

function Background({ camX, ts, theme, time, groundY, level }) {
  const th = THEME[theme];
  const GROUND_Y = groundY;
  const hills =
    theme === 'tower'
      ? []
      : theme === 'holler'
      ? [{ x: 0, w: 14, h: 5 }, { x: 11, w: 18, h: 7 }, { x: 30, w: 15, h: 5.5 }, { x: 44, w: 20, h: 7.5 }]
      : [{ x: 0, w: 16, h: 4 }, { x: 13, w: 20, h: 6 }, { x: 34, w: 16, h: 4.5 }, { x: 48, w: 22, h: 6.5 }];
  const clouds = [3, 12, 22, 33, 41];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {theme === 'alien' &&
        STARS.map((s, i) => (
          <View key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s + 1, height: s.s + 1, borderRadius: 3, backgroundColor: '#fff', opacity: 0.5 + 0.4 * Math.sin(time * 2 + i) }} />
        ))}
      {theme === 'alien' && (
        <>
          <View style={{ position: 'absolute', left: 6 * ts - camX * ts * 0.04, top: ts * 1, width: ts * 3.2, height: ts * 3.2, borderRadius: ts * 1.6, backgroundColor: '#7b4fd1' }} />
          <View style={{ position: 'absolute', left: 4.4 * ts - camX * ts * 0.04, top: ts * 2.2, width: ts * 6.4, height: ts * 0.5, borderRadius: ts, borderWidth: 3, borderColor: 'rgba(200,170,255,0.7)' }} />
          <View style={{ position: 'absolute', left: 16 * ts - camX * ts * 0.06, top: ts * 1.4, width: ts * 1.1, height: ts * 1.1, borderRadius: ts, backgroundColor: '#e8e3ff' }} />
        </>
      )}
      {theme === 'tower' && (
        <>
          {STARS.map((s, i) => (
            <View key={i} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.s + 1, height: s.s + 1, borderRadius: 3, backgroundColor: '#cbb8ff', opacity: 0.35 + 0.35 * Math.sin(time * 2 + i) }} />
          ))}
          {[0.16, 0.5, 0.84].map((f) => (
            <View key={f} style={{ position: 'absolute', left: `${f * 100 - 6}%`, top: '8%', width: '12%', height: '38%', borderTopLeftRadius: 80, borderTopRightRadius: 80, backgroundColor: '#32265c', borderWidth: 3, borderColor: '#4d3f86' }} />
          ))}
          <View style={{ position: 'absolute', left: '47%', top: '4%', width: ts * 1.4, height: ts * 1.4, borderRadius: ts, backgroundColor: '#efe9ff' }} />
        </>
      )}
      {theme === 'hell' && (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y * ts - ts * 5, height: ts * 7, backgroundColor: '#7a1608', opacity: 0.5 }} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: GROUND_Y * ts - ts * 2, bottom: 0, backgroundColor: '#ff5a1a', opacity: 0.7 + 0.15 * Math.sin(time * 3) }} />
          {Array.from({ length: 14 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: i * ts * 5 - ((camX * ts * 0.25) % (ts * 5)) - ts, top: GROUND_Y * ts - ts * (2.5 + (i % 3)), width: 0, height: 0, borderLeftWidth: ts * 1.4, borderRightWidth: ts * 1.4, borderBottomWidth: ts * (3 + (i % 3)), borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#1a0707' }} />
          ))}
          {Array.from({ length: 16 }, (_, i) => (
            <Text key={i} style={{ position: 'absolute', left: `${(i * 79) % 100}%`, top: `${100 - ((i * 31 + time * 16) % 100)}%`, fontSize: 10 + (i % 3) * 5, opacity: 0.7 }}>🔥</Text>
          ))}
        </>
      )}
      {theme === 'japan' && (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ts * 4, backgroundColor: '#ffd3a8', opacity: 0.55 }} />
          <View style={{ position: 'absolute', left: 10 * ts - camX * ts * 0.04, top: ts * 1.2, width: ts * 3.4, height: ts * 3.4, borderRadius: ts * 1.7, backgroundColor: '#ff5a4d' }} />
          <View style={{ position: 'absolute', left: 20 * ts - camX * ts * 0.1, top: GROUND_Y * ts - ts * 6, width: 0, height: 0, borderLeftWidth: ts * 6, borderRightWidth: ts * 6, borderBottomWidth: ts * 6.2, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#8e78a8' }} />
          <View style={{ position: 'absolute', left: 20 * ts + ts * 3.2 - camX * ts * 0.1, top: GROUND_Y * ts - ts * 6, width: 0, height: 0, borderLeftWidth: ts * 2.8, borderRightWidth: ts * 2.8, borderBottomWidth: ts * 2.5, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff' }} />
          {Array.from({ length: 12 }, (_, i) => (
            <Text key={i} style={{ position: 'absolute', left: `${((i * 83 + time * 22) % 104) - 2}%`, top: `${(i * 37 + time * 32) % 100}%`, fontSize: 14 + (i % 3) * 4, opacity: 0.8 }}>🌸</Text>
          ))}
        </>
      )}
      {theme === 'medieval' && (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ts * 3.5, backgroundColor: '#f7c58f', opacity: 0.6 }} />
          <View style={{ position: 'absolute', left: 14 * ts - camX * ts * 0.05, top: ts * 1.3, width: ts * 1.8, height: ts * 1.8, borderRadius: ts, backgroundColor: '#fff0b8' }} />
          {[2, 9, 17, 26].map((x) => (
            <Text key={x} style={{ position: 'absolute', left: x * ts * 2.2 - camX * ts * 0.18, top: GROUND_Y * ts - ts * 5.2, fontSize: ts * 3.4, opacity: 0.28 }}>🏰</Text>
          ))}
        </>
      )}
      {theme === 'holler' &&
        clouds.map((x) => (
          <Text key={x} style={{ position: 'absolute', top: ts * (1 + (x % 3)), left: x * ts * 2.5 - camX * ts * 0.15, fontSize: ts * 1.4 }}>☁️</Text>
        ))}
      {hills.map((h, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: h.x * ts * 2.2 - camX * ts * 0.35,
            top: GROUND_Y * ts - h.h * ts * 0.55,
            width: h.w * ts * 2.2,
            height: h.h * ts * 1.1,
            borderRadius: h.w * ts * 1.1,
            backgroundColor: th.hills[i % 2],
            opacity: 0.9,
          }}
        />
      ))}
    </View>
  );
}

export default function App() {
  const { width, height } = useWindowDimensions();

  const [screen, setScreen] = useState('title'); // title | play
  const [, setFrame] = useState(0);
  const gameRef = useRef(null);
  const inputRef = useRef({ left: false, right: false, jump: false, throw: false, rush: false, shield: false });
  // A press shorter than one frame still counts: it is latched until the next game step.
  const latchRef = useRef({ jump: false, throw: false, rush: false });
  if (!gameRef.current) gameRef.current = createGame();
  const g = gameRef.current;
  const level = g.level;
  const topPad = level.h > 11 ? 54 : 0; // tall levels (the tower) get a HUD strip and zoom out to fit
  const ts = (height - topPad) / level.h;
  const viewW = width / ts;
  const padX = Math.max(0, (viewW - level.w) / 2); // narrow levels are centred
  const GROUND_Y = level.groundY;
  g.viewW = Math.min(viewW, level.w);
  if (Platform.OS === 'web') {
    window.__billy = g; // handy for debugging in the browser
    window.__loadLevel = (n) => loadLevel(gameRef.current, n);
    window.__scene = (id) => startScene(gameRef.current, id);
  }

  const start = () => {
    initAudio();
    gameRef.current = createGame();
    gameRef.current.viewW = viewW;
    setScreen('play');
  };

  const theme = g.level.theme;
  useEffect(() => {
    setMusicTheme(theme);
  }, [theme]);

  // Game loop
  useEffect(() => {
    if (screen !== 'play') return;
    let raf;
    let last = null;
    let acc = 0;
    const tick = (now) => {
      if (last === null) last = now;
      acc += Math.min((now - last) / 1000, 0.1);
      last = now;
      while (acc >= STEP) {
        const cur = inputRef.current;
        const l = latchRef.current;
        const input = { ...cur, jump: cur.jump || l.jump, throw: cur.throw || l.throw, rush: cur.rush || l.rush };
        l.jump = l.throw = l.rush = false;
        step(gameRef.current, input, STEP);
        acc -= STEP;
      }
      for (const ev of gameRef.current.events.splice(0)) play(ev);
      setFrame((f) => (f + 1) % 1e9);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [screen]);

  // Keyboard (web / simulator with hardware keyboard)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const map = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'jump', w: 'jump', ' ': 'jump', z: 'jump', x: 'throw', j: 'throw', c: 'rush', k: 'rush', e: 'rush', v: 'shield', b: 'shield', ArrowDown: 'throw', s: 'throw' };
    const on = (v) => (e) => {
      const k = map[e.key];
      if (k) {
        if (v && k in latchRef.current) latchRef.current[k] = true;
        inputRef.current[k] = v;
        e.preventDefault();
      }
    };
    const down = on(true);
    const up = on(false);
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  const p = g.player;
  const camPx = (padX - g.camX) * ts;
  const th = THEME[theme];

  // Button layout (shared by hit-testing and drawing). The action buttons hug the right
  // edge in an arc around JUMP so they stay well clear of the walk buttons on any screen.
  const jumpC = { x: width - width * 0.05 - 52, y: height - 28 - 52, r: 52 };
  const throwC = { x: jumpC.x - 78, y: jumpC.y - 58, r: 38 };
  const shineC = { x: jumpC.x + 2, y: jumpC.y - 52 - 20 - 32, r: 32 };
  const shieldC = { x: jumpC.x - 96, y: jumpC.y - 138, r: 30 };
  const leftC = { x: width * 0.04 + 36, y: height - 28 - 36, r: 36 };
  const rightC = { x: width * 0.04 + 84 + 36, y: height - 28 - 36, r: 36 };
  const actions = [
    ['left', leftC, 1.4],
    ['right', rightC, 1.4],
    ['jump', jumpC, 1.25],
    ['throw', throwC, 1.15],
    ['rush', shineC, 1.2],
  ];
  if (g.gear.shield && level.kind !== 'drive') actions.push(['shield', shieldC, 1.25]);

  // Multi-touch: left cluster = ◀ ▶, right cluster = JUMP / FIRE / SHINE / SHIELD.
  // A touch goes to whichever button it is closest to (relative to its size).
  const onTouches = (e) => {
    const next = { left: false, right: false, jump: false, throw: false, rush: false, shield: false };
    for (const t of e.nativeEvent.touches) {
      let best = null;
      let bestScore = Infinity;
      for (const [name, c, k] of actions) {
        const score = Math.hypot(t.pageX - c.x, t.pageY - c.y) / (c.r * k);
        if (score < 1 && score < bestScore) {
          best = name;
          bestScore = score;
        }
      }
      if (best) next[best] = true;
      else if (t.pageX > width * 0.75 && t.pageY > height * 0.45) next.jump = true;
    }
    for (const k of ['jump', 'throw', 'rush']) if (next[k]) latchRef.current[k] = true;
    inputRef.current = next;
  };

  const hud = { lives: g.lives, jugs: g.jugs, score: g.score };
  const meter = g.shine / SHINE_MAX;
  const rushing = p.rush > 0;
  const inp = inputRef.current;
  const boss = g.enemies.find((e) => (e.kind === 'boss' || e.kind === 'max' || e.kind === 'packbilly') && e.alive && e.awake);
  const bossInfo =
    boss &&
    (boss.kind === 'max'
      ? { name: '🐈 MAX THE TABBY', max: 30, cur: boss.hp, color: '#e8873a' }
      : boss.kind === 'packbilly'
      ? { name: boss.full ? '🟡 PACK BILLY: FULL!' : `🟡 PACK BILLY: FED ${boss.fed}/5`, max: 5, cur: boss.fed, color: '#ffd41f' }
      : { name: '👑 WITCH QUEEN', max: 14, cur: boss.hp, color: '#b04bff' });
  const armor = Math.max(0, p.armor);
  const useRay = g.gear.raygun && g.ammo > 0;
  const useFlame = g.tequila > 0;
  const isDrive = level.kind === 'drive';
  const D = g.drive;
  const prompt = isDrive ? D.prompt : null;
  const gearIcons = Object.keys(g.gear).filter((k) => g.gear[k]);
  const bossAlive = level.boss && g.enemiesEnabled && !g.bossDefeated;
  const signText =
    level.goalKind === 'castle' && bossAlive
      ? '👑 Beat the Witch Queen'
      : level.goalKind === 'fridge'
      ? "🍺 The wizard's beer"
      : level.goalKind === 'dojo' || level.goalKind === 'hellgate'
      ? ''
      : `${th.icon} ${Math.min(g.jugs, level.goalJugs)}/${level.goalJugs}`;

  return (
    <View style={[styles.root, { backgroundColor: th.sky }]} onTouchStart={onTouches} onTouchMove={onTouches} onTouchEnd={onTouches} onTouchCancel={onTouches}>
      <StatusBar hidden />
      {isDrive && <DriveView g={g} width={width} height={height} />}
      {!isDrive && <Background camX={g.camX} ts={ts} theme={theme} time={g.time} groundY={GROUND_Y} level={level} />}

      {!isDrive && <View style={{ position: 'absolute', left: 0, top: topPad, width: level.w * ts, height: height - topPad, transform: [{ translateX: camPx }] }} pointerEvents="none">
        <Scenery level={level} ts={ts} />
        <Terrain tiles={g.tiles} level={level} ts={ts} version={g.version} theme={theme} />
        {level.goalKind === 'booth' && <Booth x={level.goalX - 0.15} y={GROUND_Y - 2.6} ts={ts} ready={g.jugs >= level.goalJugs} t={g.time} />}
        {level.goalKind === 'castle' && <CastleGate x={level.goalX - 0.9} y={GROUND_Y - 2.4} ts={ts} open={!bossAlive} />}
        {level.goalKind === 'hellgate' && <HellGate x={level.goalX - 2} y={GROUND_Y - 4.4} ts={ts} open={g.bossDefeated} t={g.time} />}
        {level.goalKind === 'fridge' && <Fridge x={level.goalX - 0.7} y={level.goalFloor - 2.3} ts={ts} t={g.time} />}
        {level.lives.map((l, i) => !l.taken && <OneUp key={`l${i}`} x={l.x} y={l.y} ts={ts} t={g.time} />)}
        {g.coins.map((c, i) => !c.taken && c.x > g.camX - 1 && c.x < g.camX + viewW + 1 && <Jug key={i} x={c.x} y={c.y} ts={ts} t={g.time} kind={level.collectible} />)}
        {g.items.map((it, i) =>
          it.kind === 'tequila' ? (
            <Tequila key={`i${i}`} it={it} ts={ts} t={g.time} />
          ) : it.kind === 'gear' ? (
            <GearItem key={`i${i}`} it={it} ts={ts} t={g.time} />
          ) : it.kind === 'life' ? (
            <OneUp key={`i${i}`} x={it.x - 0.1} y={it.y - 0.1} ts={ts} t={g.time} />
          ) : it.kind === 'jug' && it.age > 8 && Math.floor(it.age * 8) % 2 === 0 ? null : (
            <Jug key={`i${i}`} x={it.x - 0.1} y={it.y - 0.1} ts={ts} t={it.kind === 'jug' ? 0 : g.time} glow={it.kind === 'shine'} kind={it.kind === 'jug' ? level.collectible : 'jug'} />
          )
        )}
        {g.enemies.map((e, i) => e.x > g.camX - 3 && e.x < g.camX + viewW + 3 && <Critter key={i} e={e} ts={ts} />)}
        {g.cobs.map((c, i) => <Cob key={`c${i}`} c={c} ts={ts} />)}
        {g.rays.map((r, i) => <Ray key={`r${i}`} r={r} ts={ts} />)}
        {g.belches.map((f, i) => <FlameBall key={`b${i}`} f={f} ts={ts} />)}
        {g.shots.map((s, i) => <Shot key={`s${i}`} s={s} ts={ts} />)}
        <Billy p={p} ts={ts} gear={g.gear} lit={g.tequila} t={g.time} />
        <Text style={[styles.sign, { left: (level.goalX - (level.goalKind === 'castle' ? 4.2 : 1.4)) * ts, top: (GROUND_Y - (level.goalKind === 'castle' ? 3.2 : 2.9)) * ts, fontSize: ts * 0.42 }]}>{signText}</Text>
        {g.effects.map((f, i) =>
          f.kind === 'puff' ? (
            <Emoji key={`f${i}`} ch="💨" x={f.x - 0.4} y={f.y - 0.5 + f.t} size={0.8} ts={ts} />
          ) : f.kind === 'jug' ? (
            <Jug key={`f${i}`} x={f.x} y={f.y - f.t * 2.5} ts={ts} t={0} />
          ) : (
            <Text key={`f${i}`} style={[styles.pop, { left: f.x * ts, top: (f.y - f.t * 1.5) * ts, fontSize: ts * 0.5 }]}>
              {f.text}
            </Text>
          )
        )}
      </View>}

      {topPad > 0 && <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: topPad, backgroundColor: 'rgba(0,0,0,0.4)' }} pointerEvents="none" />}
      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.hudText}>{hud.lives > 4 ? `🤠 ×${hud.lives}` : '🤠'.repeat(Math.max(0, hud.lives))}</Text>
        <Text style={styles.hudText}>
          {level.collectible === 'none' ? '' : level.goalJugs > 0 ? `${th.icon} ${hud.jugs}/${level.goalJugs}` : `${th.icon} ${hud.jugs}`}
        </Text>
        <Text style={styles.hudText}>{String(hud.score).padStart(6, '0')}</Text>
      </View>
      {(gearIcons.length > 0 || armor > 0 || g.tequila > 0) && (
        <View style={styles.hud2} pointerEvents="none">
          {g.tequila > 0 && <Text style={styles.hudSmall}>🔥 ×{g.tequila}</Text>}
          {armor > 0 && <Text style={styles.hudSmall}>{'🛡️'.repeat(Math.min(armor, 4))}</Text>}
          {g.gear.raygun && <Text style={styles.hudSmall}>⚡ {g.ammo}/{AMMO_MAX}</Text>}
          <Text style={styles.hudSmall}>{gearIcons.map(gearEmoji).join(' ')}</Text>
        </View>
      )}
      {boss && bossInfo && (
        <View style={styles.bossBar} pointerEvents="none">
          <Text style={styles.bossName}>{bossInfo.name}</Text>
          <View style={styles.bossTrack}>
            <View style={[styles.bossFill, { width: `${Math.max(0, bossInfo.cur / bossInfo.max) * 100}%`, backgroundColor: bossInfo.color }]} />
          </View>
        </View>
      )}
      {g.toast && (
        <View style={styles.toast} pointerEvents="none">
          <Text style={styles.toastText}>{g.toast.text}</Text>
        </View>
      )}

      {/* Sound toggle */}
      <Pressable style={styles.mute} onPress={() => { toggleMute(); setFrame((f) => f + 1); }} hitSlop={10}>
        <Text style={{ fontSize: 20 }}>{isMuted() ? '🔇' : '🔊'}</Text>
      </Pressable>

      {/* On-screen controls */}
      {screen === 'play' && (g.mode === 'playing' || g.mode === 'dying') && (
        <View style={styles.controls} pointerEvents="none">
          <View style={[styles.btn, { left: leftC.x - leftC.r, opacity: inp.left ? 0.8 : 0.4 }]}><Text style={styles.btnText}>◀</Text></View>
          <View style={[styles.btn, { left: rightC.x - rightC.r, opacity: inp.right ? 0.8 : 0.4 }]}><Text style={styles.btnText}>▶</Text></View>
          <View style={[styles.btn, styles.jump, { left: jumpC.x - jumpC.r, top: jumpC.y - jumpC.r, bottom: undefined, opacity: inp.jump ? 0.8 : 0.4 }]}><Text style={styles.btnText}>{isDrive ? (D.player.vehicle ? 'GAS' : 'WALK') : 'JUMP'}</Text></View>
          <View style={[styles.btn, { left: throwC.x - throwC.r, top: throwC.y - throwC.r, bottom: undefined, width: throwC.r * 2, height: throwC.r * 2, borderRadius: throwC.r, opacity: inp.throw ? 0.8 : 0.45, borderWidth: useRay || useFlame ? 3 : 0, borderColor: useFlame ? '#ff8a2a' : '#58e07a' }]}>
            <Text style={{ fontSize: useRay || useFlame ? 26 : 30 }}>{isDrive ? '🛑' : useFlame ? '🔥' : useRay ? '🔫' : '🌽'}</Text>
            {useFlame ? <Text style={[styles.btnText, { fontSize: 11 }]}>BELCH ×{g.tequila}</Text> : useRay && <Text style={[styles.btnText, { fontSize: 11 }]}>⚡{g.ammo}</Text>}
            {g.gear.sword && <Text style={{ position: 'absolute', top: 2, right: 6, fontSize: 14 }}>🗡️</Text>}
          </View>
          <View
            style={[
              styles.btn,
              {
                left: shineC.x - shineC.r,
                top: shineC.y - shineC.r,
                bottom: undefined,
                width: shineC.r * 2,
                height: shineC.r * 2,
                borderRadius: shineC.r,
                overflow: 'hidden',
                borderWidth: 3,
                borderColor: isDrive ? (prompt ? '#9dff6a' : '#e8c35a') : meter >= 1 || rushing ? '#9dff6a' : '#e8c35a',
                opacity: inp.rush ? 0.9 : meter >= 1 ? 0.85 : 0.55,
              },
            ]}
          >
            {!isDrive && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(rushing ? p.rush / 6 : meter) * 100}%`, backgroundColor: rushing || meter >= 1 ? '#5fd13a' : '#a86a32' }} />}
            {isDrive && <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: prompt ? '100%' : '0%', backgroundColor: prompt === 'CARJACK' ? '#e0402a' : '#5fd13a', opacity: 0.8 }} />}
            <Text style={[styles.btnText, { fontSize: isDrive ? 10 : 11 }]}>{isDrive ? prompt || 'ACTION' : rushing ? 'RUSH!' : meter >= 1 ? 'RUSH' : 'SHINE'}</Text>
          </View>
          {g.gear.shield && !isDrive && (
            <View style={[styles.btn, { left: shieldC.x - shieldC.r, top: shieldC.y - shieldC.r, bottom: undefined, width: shieldC.r * 2, height: shieldC.r * 2, borderRadius: shieldC.r, opacity: inp.shield ? 0.9 : 0.5, borderWidth: inp.shield ? 3 : 0, borderColor: '#9cc7ff' }]}>
              <Text style={{ fontSize: 26 }}>🛡️</Text>
            </View>
          )}
        </View>
      )}

      {screen === 'title' && (
        <Pressable style={styles.overlay} onPress={start}>
          <Text style={styles.title}>BILLY BUBS</Text>
          <Text style={styles.sub}>Collect {level.goalJugs} jugs of shine and get Billy to his truck, y'all!</Text>
          <Text style={styles.hint}>🌽 throw corn cobs  •  jump twice for a double jump{'\n'}fill the SHINE meter, then hit RUSH to be invincible, fast, and fire triple cobs</Text>
          <Text style={styles.tap}>Tap to start</Text>
        </Pressable>
      )}
      {screen === 'play' && g.mode === 'intro' && (
        <Pressable style={styles.overlay} onPress={() => startPlaying(g)}>
          <Text style={styles.kicker}>LEVEL {g.levelNo}</Text>
          <Text style={styles.title}>{STORY[g.levelNo]?.title}</Text>
          <Text style={[styles.sub, { maxWidth: 560 }]}>{STORY[g.levelNo]?.text}</Text>
          {g.levelNo === 2 && <Text style={styles.hint}>Aliens drop ⚡ ammo for the ray gun.{'\n'}Your 🌽 button fires the ray gun whenever you have ammo.</Text>}
          {g.levelNo === 3 && <Text style={styles.hint}>🗡️ Fire slashes enemies up close, then shoots.{'\n'}Hold 🛡️ to block from the front.</Text>}
          {g.levelNo === 4 && <Text style={styles.hint}>Hug the edge of a girder and jump up through the gap. Barrels roll toward you!{'\n'}Shoot or slash them, or hold 🛡️ to block.</Text>}
          {g.levelNo === 7 && <Text style={styles.hint}>◀ ▶ steer, GAS drives (or walks), 🛑 brakes and reverses.{'\n'}The ACTION button gets in a ride or out of it, or CARJACKS a farmer (he'll tell you where Big Al's is). Follow the road signs!</Text>}
          {g.levelNo === 6 && <Text style={styles.hint}>Grab flaming tequila 🔥, then tap FIRE to BELCH a flame ball.{'\n'}Pack Billy eats them. Feed him 5. He can't be hurt, so keep moving!</Text>}
          {g.levelNo === 5 && <Text style={styles.hint}>Jump Max's shockwaves, and hit him while he's winded: he takes DOUBLE damage.{'\n'}Grab the 1UP barrel on the rooftops.</Text>}
          <Text style={styles.tap}>Tap to begin</Text>
        </Pressable>
      )}
      {screen === 'play' && g.mode === 'scene' && (
        <SceneView g={g} width={width} height={height} onAdvance={() => advanceScene(g)} onChoose={(i) => chooseScene(g, i)} />
      )}
      {screen === 'play' && g.mode === 'ending' && <EndingView g={g} width={width} height={height} onRestart={start} />}
      {screen === 'play' && g.mode === 'gameover' && (
        <Pressable style={styles.overlay} onPress={start}>
          <Text style={styles.title}>GAME OVER</Text>
          <Text style={styles.sub}>Score {g.score}</Text>
          <Text style={styles.tap}>Tap to try again</Text>
        </Pressable>
      )}
      {screen === 'play' && g.mode === 'won' && (
        <Pressable style={styles.overlay} onPress={() => continueGame(g)}>
          <Text style={styles.title}>LEVEL COMPLETE!</Text>
          <Text style={styles.sub}>
            {g.levelNo === 1 && 'A flying saucer swoops in and zaps the truck...'}
            {g.levelNo === 2 && 'The Time Booth hums, flashes... and away he goes!'}
            {g.levelNo === 3 && 'The gate swings open... and a puff of purple smoke appears.'}
            {'\n'}
            {th.icon} {g.jugs}   Score {g.score}
          </Text>
          {g.loot.length > 0 && (
            <Text style={styles.hint}>
              Gear: {g.loot.map((l) => `${gearEmoji(l.name)} ${GEAR[l.name].name}${l.found ? '' : ' (from the loot chest)'}`).join('  •  ')}
            </Text>
          )}
          {g.levelNo === 3 && <Text style={styles.hint}>Billy now wears full knight-alien armor with a ray gun, sword and shield.</Text>}
          <Text style={styles.tap}>Tap to continue</Text>
        </Pressable>
      )}
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3, textShadowOffset: { width: 1, height: 2 } };

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden', ...(Platform.OS === 'web' ? { userSelect: 'none', touchAction: 'none' } : {}) },
  hud: { position: 'absolute', top: 10, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between' },
  hud2: { position: 'absolute', top: 38, left: 44, flexDirection: 'row', gap: 10, alignItems: 'center' },
  hudText: { fontSize: 20, fontWeight: '900', color: '#fff', ...shadow },
  hudSmall: { fontSize: 14, fontWeight: '800', color: '#fff', ...shadow },
  bossBar: { position: 'absolute', top: 40, left: '25%', right: '25%', alignItems: 'center' },
  bossName: { fontSize: 12, fontWeight: '900', color: '#f3d6ff', letterSpacing: 2, ...shadow },
  bossTrack: { width: '100%', height: 10, borderRadius: 5, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 2, borderColor: '#fff', overflow: 'hidden', marginTop: 2 },
  bossFill: { height: '100%', backgroundColor: '#b04bff' },
  toast: { position: 'absolute', top: 70, left: 0, right: 0, alignItems: 'center' },
  toastText: { fontSize: 16, fontWeight: '900', color: '#fff', backgroundColor: 'rgba(20,20,30,0.7)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, overflow: 'hidden' },
  controls: { ...StyleSheet.absoluteFillObject },
  btn: { position: 'absolute', bottom: 28, width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  jump: { width: 104, height: 104, borderRadius: 52 },
  btnText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sign: { position: 'absolute', fontWeight: '900', color: '#fff', ...shadow },
  mute: { position: 'absolute', top: 38, right: 44, opacity: 0.8 },
  hint: { fontSize: 14, color: '#f6e3b4', marginTop: 12, textAlign: 'center', lineHeight: 20, maxWidth: 620, ...shadow },
  pop: { position: 'absolute', fontWeight: '900', color: '#fff', ...shadow },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,20,10,0.78)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  kicker: { fontSize: 14, fontWeight: '900', color: '#9be37a', letterSpacing: 4, ...shadow },
  title: { fontSize: 44, fontWeight: '900', color: '#f6d55c', letterSpacing: 2, textAlign: 'center', ...shadow },
  sub: { fontSize: 18, color: '#fff', marginTop: 8, textAlign: 'center', ...shadow },
  tap: { fontSize: 20, fontWeight: '800', color: '#9be37a', marginTop: 22, ...shadow },
});

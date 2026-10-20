import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createGame, step, STEP, SHINE_MAX, AMMO_MAX, GEAR, LEVEL_COUNT, nextLevel, startPlaying, loadLevel } from './engine/game';
import { GROUND_Y } from './engine/level';
import { Billy, Critter, Cob, Ray, Shot, Jug, GearItem, Tile, Ground, Emoji, Booth, CastleGate, gearEmoji } from './src/Sprites';
import { initAudio, play, toggleMute, isMuted, setMusicTheme } from './src/sound';

const ROWS = 11; // tile rows visible on screen

const THEME = {
  holler: { sky: '#7ec8e3', icon: '🏺', checkpoint: '📮', hills: ['#6aaa64', '#5b9a58'] },
  alien: { sky: '#170b3a', icon: '💎', checkpoint: '📡', hills: ['#2a2d6e', '#1f5a6b'] },
  medieval: { sky: '#e9a46b', icon: '🪙', checkpoint: '🚩', hills: ['#7d9a5a', '#667f4a'] },
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
};

// Static scenery that never changes: ground strips, tiles, trees, shack.
const Terrain = React.memo(function Terrain({ tiles, level, ts, theme }) {
  const els = [];
  const w = level.w;
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
};

const Scenery = React.memo(function Scenery({ level, ts }) {
  const d = DECOR[level.theme];
  return (
    <>
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
      <Emoji ch={THEME[level.theme].checkpoint} x={level.checkpointX} y={GROUND_Y - 1} size={1} ts={ts} />
      {level.goalKind === 'truck' && <Emoji ch="🛻" x={level.goalX - 0.5} y={GROUND_Y - 1.6} size={2.2} ts={ts} flip />}
    </>
  );
}, (a, b) => a.level === b.level && a.ts === b.ts);

// Stars, planets and hills; they scroll slower than the ground for depth
const STARS = Array.from({ length: 46 }, (_, i) => ({ x: (i * 97) % 100, y: (i * 53) % 62, s: 1 + (i % 3) }));

function Background({ camX, ts, theme, time }) {
  const th = THEME[theme];
  const hills =
    theme === 'holler'
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
  const ts = height / ROWS;
  const viewW = width / ts;

  const [screen, setScreen] = useState('title'); // title | play
  const [, setFrame] = useState(0);
  const gameRef = useRef(null);
  const inputRef = useRef({ left: false, right: false, jump: false, throw: false, rush: false, shield: false });
  // A press shorter than one frame still counts: it is latched until the next game step.
  const latchRef = useRef({ jump: false, throw: false, rush: false });
  if (!gameRef.current) gameRef.current = createGame();
  const g = gameRef.current;
  g.viewW = viewW;
  if (Platform.OS === 'web') {
    window.__billy = g; // handy for debugging in the browser
    window.__loadLevel = (n) => loadLevel(gameRef.current, n);
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
    const map = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'jump', w: 'jump', ' ': 'jump', z: 'jump', x: 'throw', j: 'throw', c: 'rush', k: 'rush', v: 'shield', b: 'shield' };
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

  const { level } = g;
  const p = g.player;
  const camPx = -g.camX * ts;
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
  if (g.gear.shield) actions.push(['shield', shieldC, 1.25]);

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
  const boss = g.enemies.find((e) => e.kind === 'boss' && e.alive && e.awake);
  const armor = Math.max(0, p.armor);
  const useRay = g.gear.raygun && g.ammo > 0;
  const gearIcons = Object.keys(g.gear).filter((k) => g.gear[k]);
  const bossAlive = level.boss && g.enemiesEnabled && !g.bossDefeated;
  const signText =
    level.goalKind === 'castle' && bossAlive ? '👑 Beat the Witch Queen' : `${th.icon} ${Math.min(g.jugs, level.goalJugs)}/${level.goalJugs}`;

  return (
    <View style={[styles.root, { backgroundColor: th.sky }]} onTouchStart={onTouches} onTouchMove={onTouches} onTouchEnd={onTouches} onTouchCancel={onTouches}>
      <StatusBar hidden />
      <Background camX={g.camX} ts={ts} theme={theme} time={g.time} />

      <View style={{ position: 'absolute', left: 0, top: 0, width: level.w * ts, height: height, transform: [{ translateX: camPx }] }} pointerEvents="none">
        <Scenery level={level} ts={ts} />
        <Terrain tiles={g.tiles} level={level} ts={ts} version={g.version} theme={theme} />
        {level.goalKind === 'booth' && <Booth x={level.goalX - 0.15} y={GROUND_Y - 2.6} ts={ts} ready={g.jugs >= level.goalJugs} t={g.time} />}
        {level.goalKind === 'castle' && <CastleGate x={level.goalX - 0.9} y={GROUND_Y - 2.4} ts={ts} open={!bossAlive} />}
        {g.coins.map((c, i) => !c.taken && c.x > g.camX - 1 && c.x < g.camX + viewW + 1 && <Jug key={i} x={c.x} y={c.y} ts={ts} t={g.time} kind={level.collectible} />)}
        {g.items.map((it, i) =>
          it.kind === 'gear' ? (
            <GearItem key={`i${i}`} it={it} ts={ts} t={g.time} />
          ) : it.kind === 'jug' && it.age > 8 && Math.floor(it.age * 8) % 2 === 0 ? null : (
            <Jug key={`i${i}`} x={it.x - 0.1} y={it.y - 0.1} ts={ts} t={it.kind === 'jug' ? 0 : g.time} glow={it.kind === 'shine'} kind={it.kind === 'jug' ? level.collectible : 'jug'} />
          )
        )}
        {g.enemies.map((e, i) => e.x > g.camX - 3 && e.x < g.camX + viewW + 3 && <Critter key={i} e={e} ts={ts} />)}
        {g.cobs.map((c, i) => <Cob key={`c${i}`} c={c} ts={ts} />)}
        {g.rays.map((r, i) => <Ray key={`r${i}`} r={r} ts={ts} />)}
        {g.shots.map((s, i) => <Shot key={`s${i}`} s={s} ts={ts} />)}
        <Billy p={p} ts={ts} gear={g.gear} />
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
      </View>

      {/* HUD */}
      <View style={styles.hud} pointerEvents="none">
        <Text style={styles.hudText}>{'🤠'.repeat(Math.max(0, hud.lives))}</Text>
        <Text style={styles.hudText}>
          {th.icon} {hud.jugs}/{level.goalJugs}
        </Text>
        <Text style={styles.hudText}>{String(hud.score).padStart(6, '0')}</Text>
      </View>
      {(gearIcons.length > 0 || armor > 0) && (
        <View style={styles.hud2} pointerEvents="none">
          {armor > 0 && <Text style={styles.hudSmall}>{'🛡️'.repeat(Math.min(armor, 4))}</Text>}
          {g.gear.raygun && <Text style={styles.hudSmall}>⚡ {g.ammo}/{AMMO_MAX}</Text>}
          <Text style={styles.hudSmall}>{gearIcons.map(gearEmoji).join(' ')}</Text>
        </View>
      )}
      {boss && (
        <View style={styles.bossBar} pointerEvents="none">
          <Text style={styles.bossName}>👑 WITCH QUEEN</Text>
          <View style={styles.bossTrack}>
            <View style={[styles.bossFill, { width: `${Math.max(0, boss.hp / 14) * 100}%` }]} />
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
      {screen === 'play' && (
        <View style={styles.controls} pointerEvents="none">
          <View style={[styles.btn, { left: leftC.x - leftC.r, opacity: inp.left ? 0.8 : 0.4 }]}><Text style={styles.btnText}>◀</Text></View>
          <View style={[styles.btn, { left: rightC.x - rightC.r, opacity: inp.right ? 0.8 : 0.4 }]}><Text style={styles.btnText}>▶</Text></View>
          <View style={[styles.btn, styles.jump, { left: jumpC.x - jumpC.r, top: jumpC.y - jumpC.r, bottom: undefined, opacity: inp.jump ? 0.8 : 0.4 }]}><Text style={styles.btnText}>JUMP</Text></View>
          <View style={[styles.btn, { left: throwC.x - throwC.r, top: throwC.y - throwC.r, bottom: undefined, width: throwC.r * 2, height: throwC.r * 2, borderRadius: throwC.r, opacity: inp.throw ? 0.8 : 0.45, borderWidth: useRay ? 3 : 0, borderColor: '#58e07a' }]}>
            <Text style={{ fontSize: useRay ? 26 : 30 }}>{useRay ? '🔫' : '🌽'}</Text>
            {useRay && <Text style={[styles.btnText, { fontSize: 11 }]}>⚡{g.ammo}</Text>}
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
                borderColor: meter >= 1 || rushing ? '#9dff6a' : '#e8c35a',
                opacity: inp.rush ? 0.9 : meter >= 1 ? 0.85 : 0.55,
              },
            ]}
          >
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${(rushing ? p.rush / 6 : meter) * 100}%`, backgroundColor: rushing || meter >= 1 ? '#5fd13a' : '#a86a32' }} />
            <Text style={[styles.btnText, { fontSize: 11 }]}>{rushing ? 'RUSH!' : meter >= 1 ? 'RUSH' : 'SHINE'}</Text>
          </View>
          {g.gear.shield && (
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
          <Text style={styles.tap}>Tap to begin</Text>
        </Pressable>
      )}
      {screen === 'play' && g.mode === 'gameover' && (
        <Pressable style={styles.overlay} onPress={start}>
          <Text style={styles.title}>GAME OVER</Text>
          <Text style={styles.sub}>Score {g.score}</Text>
          <Text style={styles.tap}>Tap to try again</Text>
        </Pressable>
      )}
      {screen === 'play' && g.mode === 'won' && (
        <Pressable style={styles.overlay} onPress={() => (g.levelNo < LEVEL_COUNT ? nextLevel(g) : start())}>
          <Text style={styles.title}>{g.levelNo < LEVEL_COUNT ? 'LEVEL COMPLETE!' : 'YEEHAW! THE END'}</Text>
          <Text style={styles.sub}>
            {g.levelNo === 1 && 'A flying saucer swoops in and zaps the truck...'}
            {g.levelNo === 2 && 'The Time Booth hums, flashes... and away he goes!'}
            {g.levelNo === 3 && 'The gate swings open. Billy rules the castle in full knight-alien armor!'}
            {'\n'}
            {th.icon} {g.jugs}   Score {g.score}
          </Text>
          {g.loot.length > 0 && (
            <Text style={styles.hint}>
              Gear: {g.loot.map((l) => `${gearEmoji(l.name)} ${GEAR[l.name].name}${l.found ? '' : ' (from the loot chest)'}`).join('  •  ')}
            </Text>
          )}
          {g.levelNo === LEVEL_COUNT && <Text style={styles.hint}>🪖 {GEAR.knightHelm.name}  🧥 {GEAR.plate.name}  🗡️ Sword  🛡️ Shield  🔫 Ray gun  📡 Antenna</Text>}
          <Text style={styles.tap}>{g.levelNo < LEVEL_COUNT ? 'Tap for the next level' : 'Tap to play again'}</Text>
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

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { createGame, step, STEP } from './engine/game';
import { GROUND_Y } from './engine/level';
import { Billy, Critter, Cob, Jug, Tile, Ground, Emoji } from './src/Sprites';
import { SHINE_MAX } from './engine/game';
import { initAudio, play, toggleMute, isMuted } from './src/sound';

const ROWS = 11; // tile rows visible on screen

// Static scenery that never changes: ground strips, hay, stumps, trees, shack.
const Terrain = React.memo(function Terrain({ tiles, level, ts }) {
  const els = [];
  const w = level.w;
  let runStart = null;
  for (let x = 0; x <= w; x++) {
    const isGround = x < w && tiles[GROUND_Y][x] === 1;
    if (isGround && runStart === null) runStart = x;
    if (!isGround && runStart !== null) {
      els.push(<Ground key={`g${runStart}`} x0={runStart} x1={x} y={GROUND_Y} rows={ROWS - GROUND_Y} ts={ts} />);
      runStart = null;
    }
  }
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < w; x++) {
      const t = tiles[y][x];
      if (t >= 2) els.push(<Tile key={`${x},${y}`} type={t} x={x} y={y} ts={ts} />);
    }
  }
  return <>{els}</>;
});

const Scenery = React.memo(function Scenery({ level, ts }) {
  const trees = [6, 20, 41, 63, 78, 97, 106, 127, 135, 147];
  return (
    <>
      <Emoji ch="🏚️" x={-0.2} y={GROUND_Y - 2.4} size={2.6} ts={ts} />
      {trees.map((x) => (
        <Emoji key={x} ch="🌲" x={x} y={GROUND_Y - 1.5} size={1.6} ts={ts} />
      ))}
      <Emoji ch="📮" x={level.checkpointX} y={GROUND_Y - 1} size={1} ts={ts} />
      <Emoji ch="🛻" x={level.goalX - 0.5} y={GROUND_Y - 1.6} size={2.2} ts={ts} flip />
    </>
  );
});

function Background({ camX, ts, width }) {
  const hills = [
    { x: 0, w: 14, h: 5, color: '#6aaa64' },
    { x: 11, w: 18, h: 7, color: '#5b9a58' },
    { x: 30, w: 15, h: 5.5, color: '#6aaa64' },
    { x: 44, w: 20, h: 7.5, color: '#5b9a58' },
  ];
  const clouds = [3, 12, 22, 33, 41];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {clouds.map((x) => (
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
            backgroundColor: h.color,
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
  const inputRef = useRef({ left: false, right: false, jump: false, throw: false, rush: false });
  // A press shorter than one frame still counts: it is latched until the next game step.
  const latchRef = useRef({ jump: false, throw: false, rush: false });
  if (!gameRef.current) gameRef.current = createGame();
  const g = gameRef.current;
  g.viewW = viewW;
  if (Platform.OS === 'web') window.__billy = g; // handy for debugging in the browser

  const start = () => {
    initAudio();
    gameRef.current = createGame();
    gameRef.current.viewW = viewW;
    setScreen('play');
  };

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
    const map = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'jump', w: 'jump', ' ': 'jump', z: 'jump', x: 'throw', j: 'throw', c: 'rush', k: 'rush' };
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

  // Button layout (shared by hit-testing and drawing). The action buttons hug the right
  // edge in an arc around JUMP so they stay well clear of the walk buttons on any screen.
  const jumpC = { x: width - width * 0.05 - 52, y: height - 28 - 52, r: 52 };
  const throwC = { x: jumpC.x - 78, y: jumpC.y - 58, r: 38 };
  const shineC = { x: jumpC.x + 2, y: jumpC.y - 52 - 20 - 32, r: 32 };
  const leftC = { x: width * 0.04 + 36, y: height - 28 - 36, r: 36 };
  const rightC = { x: width * 0.04 + 84 + 36, y: height - 28 - 36, r: 36 };
  const actions = [
    ['left', leftC, 1.4],
    ['right', rightC, 1.4],
    ['jump', jumpC, 1.25],
    ['throw', throwC, 1.15],
    ['rush', shineC, 1.2],
  ];

  // Multi-touch: left cluster = ◀ ▶, right cluster = JUMP / THROW / SHINE.
  // A touch goes to whichever button it is closest to (relative to its size).
  const onTouches = (e) => {
    const next = { left: false, right: false, jump: false, throw: false, rush: false };
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

  const { level } = g;
  const p = g.player;
  const camPx = -g.camX * ts;

  const hud = { lives: g.lives, jugs: g.jugs, score: g.score };
  const meter = g.shine / SHINE_MAX;
  const rushing = p.rush > 0;
  const inp = inputRef.current;

  return (
    <View style={styles.root} onTouchStart={onTouches} onTouchMove={onTouches} onTouchEnd={onTouches} onTouchCancel={onTouches}>
      <StatusBar hidden />
      <Background camX={g.camX} ts={ts} width={width} />

      <View style={{ position: 'absolute', left: 0, top: 0, width: level.w * ts, height: height, transform: [{ translateX: camPx }] }} pointerEvents="none">
        <Scenery level={level} ts={ts} />
        <Terrain tiles={g.tiles} level={level} ts={ts} version={g.version} />
        {g.coins.map((c, i) => !c.taken && c.x > g.camX - 1 && c.x < g.camX + viewW + 1 && <Jug key={i} x={c.x} y={c.y} ts={ts} t={g.time} />)}
        {g.items.map((it, i) =>
          it.kind === 'jug' && it.age > 8 && Math.floor(it.age * 8) % 2 === 0 ? null : (
            <Jug key={`i${i}`} x={it.x - 0.1} y={it.y - 0.1} ts={ts} t={it.kind === 'jug' ? 0 : g.time} glow={it.kind === 'shine'} />
          )
        )}
        {g.enemies.map((e, i) => e.x > g.camX - 2 && e.x < g.camX + viewW + 2 && <Critter key={i} e={e} ts={ts} />)}
        {g.cobs.map((c, i) => <Cob key={`c${i}`} c={c} ts={ts} />)}
        <Billy p={p} ts={ts} />
        <Text style={[styles.sign, { left: (level.goalX - 1.2) * ts, top: (GROUND_Y - 2.9) * ts, fontSize: ts * 0.42 }]}>
          🏺 {Math.min(g.jugs, level.goalJugs)}/{level.goalJugs}
        </Text>
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
        <Text style={styles.hudText}>🏺 {hud.jugs}/{level.goalJugs}</Text>
        <Text style={styles.hudText}>{String(hud.score).padStart(6, '0')}</Text>
      </View>

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
          <View style={[styles.btn, { left: throwC.x - throwC.r, top: throwC.y - throwC.r, bottom: undefined, width: throwC.r * 2, height: throwC.r * 2, borderRadius: throwC.r, opacity: inp.throw ? 0.8 : 0.45 }]}>
            <Text style={{ fontSize: 30 }}>🌽</Text>
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
        </View>
      )}

      {screen === 'title' && (
        <Pressable style={styles.overlay} onPress={start}>
          <Text style={styles.title}>BILLY BUBS</Text>
          <Text style={styles.sub}>Collect {level.goalJugs} jugs of shine and get Billy to his truck, y'all!</Text>
          <Text style={styles.hint}>🌽 throw corn cobs  •  jump twice for a double jump{'\n'}fill the SHINE meter, then hit RUSH for speed and triple cobs</Text>
          <Text style={styles.tap}>Tap to start</Text>
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
        <Pressable style={styles.overlay} onPress={start}>
          <Text style={styles.title}>YEEHAW!</Text>
          <Text style={styles.sub}>Billy made it to the truck{'\n'}🏺 ×{g.jugs}   Score {g.score}</Text>
          <Text style={styles.tap}>Tap to play again</Text>
        </Pressable>
      )}
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 3, textShadowOffset: { width: 1, height: 2 } };

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7ec8e3', overflow: 'hidden', ...(Platform.OS === 'web' ? { userSelect: 'none', touchAction: 'none' } : {}) },
  hud: { position: 'absolute', top: 10, left: 44, right: 44, flexDirection: 'row', justifyContent: 'space-between' },
  hudText: { fontSize: 20, fontWeight: '900', color: '#fff', ...shadow },
  controls: { ...StyleSheet.absoluteFillObject },
  btn: { position: 'absolute', bottom: 28, width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  jump: { width: 104, height: 104, borderRadius: 52 },
  btnText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  sign: { position: 'absolute', fontWeight: '900', color: '#fff', ...shadow },
  mute: { position: 'absolute', top: 38, right: 44, opacity: 0.8 },
  hint: { fontSize: 14, color: '#f6e3b4', marginTop: 12, textAlign: 'center', lineHeight: 20, ...shadow },
  pop: { position: 'absolute', fontWeight: '900', color: '#fff', ...shadow },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(30,20,10,0.72)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 44, fontWeight: '900', color: '#f6d55c', letterSpacing: 2, ...shadow },
  sub: { fontSize: 18, color: '#fff', marginTop: 8, textAlign: 'center', ...shadow },
  tap: { fontSize: 20, fontWeight: '800', color: '#9be37a', marginTop: 22, ...shadow },
});

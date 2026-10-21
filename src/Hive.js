// Everything the Hive (level 8) and the Egg Chamber need on screen: terrain, doors, creatures, the Queen.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EMPTY, GROUND, HAY, BREAKABLE, DOOR_BLUE, DOOR_RED, ACID } from '../engine/level';

const PAL = {
  hive: { rock: '#2b2033', air: '#0d0813', lip: '#7a5a8a', lipDark: '#4a2f5a', tooth: '#3a2a46', ledge: '#b9a98a', ledgeDark: '#6e6048', vein: '#52305e' },
  egg: { rock: '#4a3320', air: '#120a05', lip: '#d4a85a', lipDark: '#8a6430', tooth: '#5e4228', ledge: '#e8d49a', ledgeDark: '#9a7c44', vein: '#7a5028' },
};

const isAir = (t) => t === EMPTY || t === ACID;

// The whole cave as a handful of merged rectangles: rock backdrop, air pockets, floor lips, ledges, doors.
export const HiveTerrain = React.memo(
  function HiveTerrain({ tiles, level, ts, theme }) {
    const P = PAL[theme] || PAL.hive;
    const W = level.w;
    const H = level.h;
    const els = [];
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? GROUND : tiles[y][x]);
    const runs = (y, pred, cb) => {
      let s = null;
      for (let x = 0; x <= W; x++) {
        const ok = x < W && pred(x, y);
        if (ok && s === null) s = x;
        if (!ok && s !== null) {
          cb(s, x);
          s = null;
        }
      }
    };
    for (let y = 0; y < H; y++) {
      runs(y, (x) => isAir(tiles[y][x]), (a, b) => els.push(<View key={`a${a},${y}`} style={{ position: 'absolute', left: a * ts, top: y * ts, width: (b - a) * ts + 1, height: ts + 1, backgroundColor: P.air }} />));
      // floors: solid ground with air straight above
      runs(y, (x) => tiles[y][x] === GROUND && isAir(at(x, y - 1)), (a, b) =>
        els.push(
          <View key={`l${a},${y}`} style={{ position: 'absolute', left: a * ts, top: y * ts, width: (b - a) * ts + 1, height: ts * 0.3, backgroundColor: P.lip, borderBottomWidth: 3, borderColor: P.lipDark }} />
        )
      );
      // ceilings: a darker underside with dripping teeth every third tile
      runs(y, (x) => tiles[y][x] === GROUND && isAir(at(x, y + 1)), (a, b) => {
        els.push(<View key={`c${a},${y}`} style={{ position: 'absolute', left: a * ts, top: y * ts + ts * 0.7, width: (b - a) * ts + 1, height: ts * 0.3, backgroundColor: P.lipDark }} />);
        for (let x = a + 1; x < b; x += 3) {
          els.push(
            <View key={`t${x},${y}`} style={{ position: 'absolute', left: x * ts + ts * 0.15, top: (y + 1) * ts, width: 0, height: 0, borderLeftWidth: ts * 0.25, borderRightWidth: ts * 0.25, borderTopWidth: ts * (0.5 + ((x * 7) % 3) * 0.15), borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: P.tooth }} />
          );
        }
      });
      // walls: a vein or two so big rock faces are not flat
      runs(y, (x) => tiles[y][x] === GROUND && (isAir(at(x - 1, y)) || isAir(at(x + 1, y))), (a, b) => {
        for (let x = a; x < b; x++) {
          if ((x * 13 + y * 7) % 5 !== 0) continue;
          const side = isAir(at(x - 1, y)) ? 0.05 : 0.7;
          els.push(<View key={`w${x},${y}`} style={{ position: 'absolute', left: x * ts + ts * side, top: y * ts + ts * 0.1, width: ts * 0.25, height: ts * 0.8, borderRadius: ts * 0.2, backgroundColor: P.vein }} />);
        }
      });
      // ledges (bone-resin shelves)
      runs(y, (x) => tiles[y][x] === HAY, (a, b) =>
        els.push(
          <View key={`h${a},${y}`} style={{ position: 'absolute', left: a * ts, top: y * ts, width: (b - a) * ts, height: ts * 0.62, backgroundColor: P.ledge, borderRadius: ts * 0.2, borderWidth: 3, borderColor: P.ledgeDark }}>
            {Array.from({ length: (b - a) * 2 }, (_, i) => (
              <View key={i} style={{ position: 'absolute', left: i * ts * 0.5 + ts * 0.15, top: ts * 0.12, width: ts * 0.12, height: ts * 0.22, borderRadius: 3, backgroundColor: P.ledgeDark }} />
            ))}
          </View>
        )
      );
      // acid
      runs(y, (x) => tiles[y][x] === ACID, (a, b) =>
        els.push(
          <View key={`d${a},${y}`} style={{ position: 'absolute', left: a * ts, top: y * ts + ts * 0.18, width: (b - a) * ts + 1, height: ts * 0.84, backgroundColor: '#4fb81f', opacity: 0.92 }}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 5, backgroundColor: '#b6ff5a' }} />
            {Array.from({ length: (b - a) * 2 }, (_, i) => (
              <View key={i} style={{ position: 'absolute', left: i * ts * 0.5 + ((i * 11) % 7), top: ts * (0.2 + ((i * 5) % 4) * 0.12), width: 6, height: 6, borderRadius: 3, borderWidth: 1, borderColor: '#d8ff9a' }} />
            ))}
          </View>
        )
      );
      for (let x = 0; x < W; x++) {
        const t = tiles[y][x];
        if (t === BREAKABLE) {
          els.push(
            <View key={`b${x},${y}`} style={{ position: 'absolute', left: x * ts, top: y * ts, width: ts + 1, height: ts + 1, backgroundColor: '#5a4468', borderWidth: 1, borderColor: P.lipDark, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', left: ts * 0.15, top: ts * 0.1, width: 3, height: ts * 0.9, backgroundColor: '#140c1a', transform: [{ rotate: '14deg' }] }} />
              <View style={{ position: 'absolute', left: ts * 0.55, top: 0, width: 3, height: ts * 0.7, backgroundColor: '#140c1a', transform: [{ rotate: '-22deg' }] }} />
              <View style={{ position: 'absolute', left: ts * 0.1, top: ts * 0.5, width: ts * 0.8, height: 3, backgroundColor: '#140c1a', transform: [{ rotate: '-8deg' }] }} />
            </View>
          );
        } else if (t === DOOR_BLUE || t === DOOR_RED) {
          const c = t === DOOR_RED ? { fill: '#7a1420', rim: '#ff4a5a', glow: '#ff9aa4' } : { fill: '#16407a', rim: '#4aa8ff', glow: '#a8d8ff' };
          els.push(
            <View key={`o${x},${y}`} style={{ position: 'absolute', left: x * ts, top: y * ts, width: ts + 1, height: ts + 1, backgroundColor: c.fill, borderLeftWidth: 4, borderRightWidth: 4, borderColor: c.rim, alignItems: 'center', justifyContent: 'center', shadowColor: c.rim, shadowRadius: 8, shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 } }}>
              <View style={{ width: ts * 0.34, height: ts * 0.34, borderRadius: ts * 0.17, borderWidth: 3, borderColor: c.glow, backgroundColor: t === DOOR_RED ? '#ff2a3a' : '#2a7aff', opacity: 0.8 }} />
            </View>
          );
        }
      }
    }
    return (
      <>
        <View style={{ position: 'absolute', left: 0, top: 0, width: W * ts, height: H * ts, backgroundColor: P.rock }} />
        {els}
      </>
    );
  },
  (a, b) => a.tiles === b.tiles && a.version === b.version && a.ts === b.ts && a.theme === b.theme
);

// Slow organic ribs and drifting spores behind everything
export function HiveBackground({ camX, camY, ts, time, theme }) {
  const egg = theme === 'egg';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: egg ? '#1e1208' : '#120a18' }]} />
      {Array.from({ length: 7 }, (_, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: ((i * 173) % 900) - camX * ts * 0.12 - 40,
            top: -ts * 2 - camY * ts * 0.1,
            width: ts * 2.2,
            height: ts * 30,
            borderRadius: ts * 2,
            backgroundColor: egg ? 'rgba(130,80,30,0.16)' : 'rgba(90,40,110,0.18)',
            transform: [{ rotate: `${((i % 2) * 2 - 1) * 6}deg` }],
          }}
        />
      ))}
      {Array.from({ length: 22 }, (_, i) => (
        <View
          key={`s${i}`}
          style={{
            position: 'absolute',
            left: `${(i * 47 + Math.sin(time * 0.4 + i) * 6) % 100}%`,
            top: `${100 - ((i * 29 + time * (3 + (i % 4))) % 100)}%`,
            width: 3 + (i % 3),
            height: 3 + (i % 3),
            borderRadius: 4,
            backgroundColor: egg ? '#ffd27a' : '#9dffcf',
            opacity: 0.25 + 0.2 * Math.sin(time * 2 + i),
          }}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Things placed in the level
export function SaveStation({ x, floor, ts, t }) {
  return (
    <View style={{ position: 'absolute', left: x * ts, top: (floor - 1.6) * ts, width: ts, height: ts * 1.6, alignItems: 'center' }}>
      <View style={{ width: ts * 0.9, height: ts * 0.5, borderRadius: ts * 0.25, backgroundColor: 'rgba(120,255,200,0.35)', borderWidth: 2, borderColor: '#7dffc8', opacity: 0.6 + 0.4 * Math.sin(t * 4) }} />
      <View style={{ width: ts * 0.3, height: ts * 0.7, backgroundColor: '#3a3a52', borderWidth: 2, borderColor: '#7dffc8' }} />
      <View style={{ width: ts * 0.9, height: ts * 0.35, borderRadius: 6, backgroundColor: '#2a2a40', borderWidth: 2, borderColor: '#7dffc8', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: ts * 0.2, color: '#7dffc8', fontWeight: '900' }}>SAVE</Text>
      </View>
    </View>
  );
}

export function EnergyTank({ tank, ts, t }) {
  const bob = Math.sin(t * 3 + tank.x) * ts * 0.06;
  return (
    <View style={{ position: 'absolute', left: tank.x * ts + ts * 0.15, top: tank.y * ts + bob, width: ts * 0.7, height: ts, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: ts * 1.3, height: ts * 1.3, borderRadius: ts, backgroundColor: 'rgba(120,255,140,0.25)' }} />
      <View style={{ width: ts * 0.5, height: ts * 0.82, borderRadius: ts * 0.15, backgroundColor: '#5aff7a', borderWidth: 3, borderColor: '#e6fff0' }} />
      <View style={{ position: 'absolute', top: 0, width: ts * 0.26, height: ts * 0.1, backgroundColor: '#e6fff0', borderRadius: 2 }} />
      <Text style={{ position: 'absolute', fontSize: ts * 0.34, fontWeight: '900', color: '#0b3a16' }}>+</Text>
    </View>
  );
}

// A membrane sac glowing in the wall: step into it and you go through
export function Portal({ p, ts, t }) {
  const pulse = 1 + 0.06 * Math.sin(t * 4);
  const back = p.to === 'parent';
  return (
    <View style={{ position: 'absolute', left: p.x * ts, top: p.y * ts, width: p.w * ts, height: p.h * ts, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pulse }] }}>
      <View style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: ts, backgroundColor: back ? 'rgba(130,200,255,0.35)' : 'rgba(255,210,90,0.35)', borderWidth: 3, borderColor: back ? '#8ac8ff' : '#ffd25a' }} />
      <View style={{ width: '60%', height: '70%', borderRadius: ts, backgroundColor: back ? 'rgba(210,235,255,0.6)' : 'rgba(255,240,170,0.6)' }} />
      <Text style={{ position: 'absolute', fontSize: ts * 0.8, opacity: 0.9 }}>{back ? '🌀' : '🥚'}</Text>
    </View>
  );
}

export function RocketItem({ it, ts, t }) {
  const bob = Math.sin(t * 6 + it.x) * ts * 0.05;
  return (
    <View style={{ position: 'absolute', left: it.x * ts, top: it.y * ts + bob, width: it.w * ts, height: it.h * ts, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: '120%', height: '120%', borderRadius: ts, backgroundColor: 'rgba(255,170,60,0.3)' }} />
      <Text style={{ fontSize: ts * 0.62, transform: [{ rotate: '-45deg' }] }}>🚀</Text>
    </View>
  );
}

export function Missile({ m, ts }) {
  const dir = m.vx >= 0 ? 1 : -1;
  const L = m.w * ts;
  return (
    <View style={{ position: 'absolute', left: m.x * ts, top: m.y * ts, width: L, height: m.h * ts, transform: [{ scaleX: dir }] }}>
      <View style={{ position: 'absolute', left: -L * 0.9, top: '15%', width: L * 0.9, height: '70%', borderRadius: 6, backgroundColor: '#ffb43a', opacity: 0.85 }} />
      <View style={{ position: 'absolute', left: -L * 0.5, top: '30%', width: L * 0.5, height: '40%', borderRadius: 4, backgroundColor: '#fff2a8' }} />
      <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', borderRadius: 5, backgroundColor: '#8a9a4a', borderWidth: 2, borderColor: '#2f3a14' }} />
      <View style={{ position: 'absolute', right: -3, top: '10%', width: L * 0.28, height: '80%', borderTopRightRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#d8452a' }} />
    </View>
  );
}

export function Boom({ f, ts }) {
  const k = Math.min(1, f.t / 0.55);
  const r = ts * (0.5 + k * 2.6);
  return (
    <View style={{ position: 'absolute', left: f.x * ts - r, top: f.y * ts - r, width: r * 2, height: r * 2, borderRadius: r, backgroundColor: `rgba(255,${200 - k * 120},60,${0.85 - k * 0.85})`, borderWidth: 4, borderColor: `rgba(255,240,180,${1 - k})` }}>
      <View style={{ position: 'absolute', left: r * 0.5, top: r * 0.5, width: r, height: r, borderRadius: r / 2, backgroundColor: `rgba(255,255,230,${0.8 - k})` }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Creatures. They are drawn facing left, like the other critters, and flipped when they head right.
export function Hugger({ w, h }) {
  return (
    <View style={{ width: w, height: h }}>
      {[0.12, 0.3, 0.5, 0.68].map((f, i) => (
        <View key={i} style={{ position: 'absolute', left: w * f, bottom: 0, width: w * 0.09, height: h * 0.8, backgroundColor: '#c9bf8e', borderRadius: 3, transform: [{ rotate: `${i < 2 ? 18 : -18}deg` }] }} />
      ))}
      <View style={{ position: 'absolute', left: w * 0.08, top: h * 0.05, width: w * 0.84, height: h * 0.62, borderRadius: w * 0.4, backgroundColor: '#d8cf9a', borderWidth: 2, borderColor: '#8a8052' }}>
        <View style={{ position: 'absolute', left: w * 0.12, top: h * 0.12, width: w * 0.12, height: h * 0.16, borderRadius: 3, backgroundColor: '#7a2a2a' }} />
      </View>
      <View style={{ position: 'absolute', right: -w * 0.18, top: h * 0.3, width: w * 0.4, height: h * 0.12, borderRadius: 4, backgroundColor: '#c9bf8e' }} />
    </View>
  );
}

export function Xeno({ w, h, t }) {
  const run = Math.sin(t * 16) * h * 0.06;
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ position: 'absolute', right: -w * 0.35, top: h * 0.25, width: w * 0.7, height: h * 0.1, borderRadius: 4, backgroundColor: '#15121c', transform: [{ rotate: '-24deg' }] }} />
      <View style={{ position: 'absolute', left: w * 0.3 + run, bottom: 0, width: w * 0.12, height: h * 0.5, backgroundColor: '#1d1928', borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: w * 0.6 - run, bottom: 0, width: w * 0.12, height: h * 0.5, backgroundColor: '#1d1928', borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: w * 0.25, top: h * 0.3, width: w * 0.55, height: h * 0.4, borderRadius: w * 0.2, backgroundColor: '#17131f', borderWidth: 2, borderColor: '#3a3450' }} />
      <View style={{ position: 'absolute', left: -w * 0.05, top: h * 0.08, width: w * 0.75, height: h * 0.34, borderRadius: w * 0.3, backgroundColor: '#1a1624', borderWidth: 2, borderColor: '#4a4660', transform: [{ rotate: '-10deg' }] }}>
        <View style={{ position: 'absolute', left: w * 0.1, top: h * 0.1, width: w * 0.5, height: 3, backgroundColor: '#5a5678' }} />
      </View>
      <View style={{ position: 'absolute', left: w * 0.02, top: h * 0.34, width: w * 0.1, height: h * 0.14, borderRadius: 2, backgroundColor: '#f4f4f0' }} />
      <View style={{ position: 'absolute', left: w * 0.15, top: h * 0.34, width: w * 0.08, height: h * 0.1, borderRadius: 2, backgroundColor: '#f4f4f0' }} />
    </View>
  );
}

export function Spitter({ w, h, warn, t }) {
  const puff = 1 + (warn ? 0.18 : 0.05) * Math.sin(t * (warn ? 30 : 4));
  return (
    <View style={{ width: w, height: h }}>
      <View style={{ position: 'absolute', left: w * 0.3, bottom: 0, width: w * 0.4, height: h * 0.4, backgroundColor: '#3a4a1a', borderRadius: 4 }} />
      <View style={{ position: 'absolute', left: w * 0.05, top: h * 0.05, width: w * 0.9, height: h * 0.7, borderRadius: w * 0.45, backgroundColor: warn ? '#c6ff3a' : '#8fc13a', borderWidth: 2, borderColor: '#3f5a14', transform: [{ scale: puff }] }}>
        <View style={{ position: 'absolute', left: w * 0.25, top: h * 0.08, width: w * 0.4, height: h * 0.22, borderRadius: w * 0.2, backgroundColor: '#1a2a08' }} />
        <View style={{ position: 'absolute', left: w * 0.12, top: h * 0.4, width: w * 0.1, height: w * 0.1, borderRadius: 5, backgroundColor: '#e8ff9a' }} />
        <View style={{ position: 'absolute', left: w * 0.62, top: h * 0.42, width: w * 0.12, height: w * 0.12, borderRadius: 6, backgroundColor: '#e8ff9a' }} />
      </View>
    </View>
  );
}

export function Egg({ e, ts, t }) {
  const w = e.w * ts;
  const h = e.h * ts;
  const big = e.kind === 'queenegg';
  const pod = !!e.noHatch;
  const shake = e.warn ? Math.sin(t * 50) * ts * 0.05 : 0;
  const hurtFrac = big ? 1 - e.hp / 6 : 0;
  const body = big ? '#e8c34a' : pod ? '#a8683a' : '#7c8a3c';
  const edge = big ? '#fff2a0' : pod ? '#ffb86a' : '#3f4a18';
  return (
    <View style={{ width: w, height: h, transform: [{ translateX: shake }, { scale: big ? 1 + 0.04 * Math.sin(t * 3) : 1 }] }}>
      {big && <View style={{ position: 'absolute', left: -w * 0.25, top: -h * 0.15, width: w * 1.5, height: h * 1.3, borderRadius: w, backgroundColor: 'rgba(255,225,100,0.28)' }} />}
      <View style={{ position: 'absolute', left: 0, bottom: 0, width: w, height: h * 0.9, borderRadius: w * 0.5, borderTopLeftRadius: w * 0.5, borderTopRightRadius: w * 0.5, backgroundColor: body, borderWidth: 3, borderColor: edge, overflow: 'hidden' }}>
        {[0.2, 0.45, 0.7].map((f) => (
          <View key={f} style={{ position: 'absolute', left: w * 0.1, right: w * 0.1, top: h * f * 0.85, height: 2, backgroundColor: edge, opacity: 0.55 }} />
        ))}
        {hurtFrac > 0 && [0.2, 0.5, 0.75].slice(0, Math.ceil(hurtFrac * 3)).map((f, i) => (
          <View key={i} style={{ position: 'absolute', left: w * f, top: 0, width: 3, height: h * 0.8, backgroundColor: '#fffbe0', transform: [{ rotate: `${(i - 1) * 16}deg` }] }} />
        ))}
      </View>
      {e.hatched && (
        <>
          <View style={{ position: 'absolute', left: -w * 0.1, top: -h * 0.05, width: w * 0.4, height: h * 0.25, backgroundColor: edge, borderRadius: 4, transform: [{ rotate: '-35deg' }] }} />
          <View style={{ position: 'absolute', right: -w * 0.1, top: -h * 0.05, width: w * 0.4, height: h * 0.25, backgroundColor: edge, borderRadius: 4, transform: [{ rotate: '35deg' }] }} />
        </>
      )}
      {pod && !e.hatched && <Text style={{ position: 'absolute', left: w * 0.12, top: -h * 0.65, fontSize: h * 0.5 }}>🚀</Text>}
      {e.warn && <Text style={{ position: 'absolute', left: w * 0.2, top: -h * 0.7, fontSize: ts * 0.5 }}>❗</Text>}
    </View>
  );
}

// The Alien Queen, a cross between a Giger xenomorph and a hillbilly: shiny black chitin, a straw hat,
// overalls, and a big pair of bunny teeth. Drawn in tile units (u = pixels per tile) inside a 2.4 x 2.8 box.
export function QueenArt({ u, t = 0, open = 0, wind = false, enraged = false }) {
  const P = (x, y, w, h, style = {}) => {
    const { key, ...st } = style;
    return <View key={key} style={[{ position: 'absolute', left: x * u, top: y * u, width: w * u, height: h * u }, st]} />;
  };
  const black = '#15111d';
  const shine = '#5a5678';
  const sway = Math.sin(t * 3) * 0.08;
  const tailLift = wind ? -0.5 : 0;
  const tail = [0, 1, 2, 3, 4, 5].map((i) => {
    const k = i / 5;
    return { x: 1.95 + k * 0.4, y: 2.1 - k * 1.0 + tailLift * k + Math.sin(t * 3 + i) * 0.05 * k, r: 0.3 - k * 0.17 };
  });
  const tooth = { backgroundColor: '#fffdf2', borderBottomLeftRadius: 0.1 * u, borderBottomRightRadius: 0.1 * u, borderWidth: 2, borderColor: '#b8b298' };
  return (
    <View style={{ width: 2.4 * u, height: 2.8 * u }}>
      {/* tail, with a barbed tip */}
      {tail.map((s, i) => (
        <View key={i} style={{ position: 'absolute', left: (s.x - s.r) * u, top: (s.y - s.r) * u, width: s.r * 2 * u, height: s.r * 2 * u, borderRadius: s.r * u, backgroundColor: black, borderWidth: 2, borderColor: shine }} />
      ))}
      <View style={{ position: 'absolute', left: (tail[5].x - 0.06) * u, top: (tail[5].y - 0.55) * u, width: 0, height: 0, borderLeftWidth: 0.1 * u, borderRightWidth: 0.1 * u, borderBottomWidth: 0.55 * u, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#d0cbe0' }} />
      {/* back arm and legs */}
      {P(1.6, 1.6, 0.75, 0.13, { backgroundColor: black, borderRadius: 4, transform: [{ rotate: `${35 + sway * 40}deg` }] })}
      {P(1.0, 2.25, 0.16, 0.5, { backgroundColor: black, borderRadius: 4, transform: [{ rotate: '8deg' }] })}
      {P(1.6, 2.25, 0.16, 0.5, { backgroundColor: black, borderRadius: 4, transform: [{ rotate: '-10deg' }] })}
      {P(0.8, 2.66, 0.5, 0.15, { backgroundColor: '#1d1928', borderRadius: 5 })}
      {P(1.5, 2.66, 0.5, 0.15, { backgroundColor: '#1d1928', borderRadius: 5 })}
      {/* neck and torso: ribbed chitin */}
      {P(0.95, 1.15, 0.5, 0.4, { backgroundColor: black, borderWidth: 2, borderColor: shine })}
      {P(0.75, 1.4, 1.3, 0.95, { backgroundColor: black, borderRadius: 0.35 * u, borderWidth: 2, borderColor: shine })}
      {[1.55, 1.8, 2.05].map((y) => P(1.55, y, 0.42, 0.05, { backgroundColor: shine, key: y }))}
      {/* overalls: denim bib, straps, buttons, a patch */}
      {P(0.88, 1.62, 0.72, 0.7, { backgroundColor: '#2f5fa8', borderRadius: 4, borderWidth: 2, borderColor: '#1c3a6e' })}
      {P(1.0, 1.92, 0.3, 0.24, { backgroundColor: '#b07a40', borderRadius: 2 })}
      {P(0.9, 1.3, 0.1, 0.4, { backgroundColor: '#2f5fa8', transform: [{ rotate: '-10deg' }] })}
      {P(1.48, 1.3, 0.1, 0.4, { backgroundColor: '#2f5fa8', transform: [{ rotate: '10deg' }] })}
      {P(0.9, 1.62, 0.1, 0.1, { backgroundColor: '#f6d55c', borderRadius: 0.05 * u })}
      {P(1.5, 1.62, 0.1, 0.1, { backgroundColor: '#f6d55c', borderRadius: 0.05 * u })}
      {/* front arm reaching toward you, with claws */}
      {P(0.2, 1.78 + sway, 0.85, 0.14, { backgroundColor: black, borderRadius: 4, borderWidth: 1, borderColor: shine, transform: [{ rotate: `${14 + sway * 60}deg` }] })}
      {[0, 1, 2].map((i) => P(0.0 + i * 0.03, 1.9 + i * 0.1 + sway * 2, 0.22, 0.05, { backgroundColor: '#e0dbee', key: i, transform: [{ rotate: `${-10 + i * 25}deg` }] }))}
      {/* the head: long, ridged, swept back, with a shine stripe */}
      {P(0.0, 0.5, 1.7, 0.8, { backgroundColor: black, borderTopLeftRadius: 0.3 * u, borderBottomLeftRadius: 0.25 * u, borderTopRightRadius: 0.8 * u, borderBottomRightRadius: 0.5 * u, borderWidth: 2, borderColor: shine, transform: [{ rotate: '-6deg' }] })}
      {P(0.7, 0.58, 0.9, 0.06, { backgroundColor: shine, transform: [{ rotate: '-6deg' }] })}
      {/* lower jaw, drops when she screeches */}
      {P(0.0, 1.18 + open * 0.3, 0.85, 0.2, { backgroundColor: '#1d1928', borderRadius: 0.1 * u, borderWidth: 2, borderColor: shine })}
      {open > 0.3 && P(0.1, 1.15, 0.65, 0.12 + open * 0.3, { backgroundColor: '#5a0f1a', borderRadius: 4 })}
      {/* the bunny teeth: two big white buck teeth hanging down over the lip */}
      {P(0.1, 1.02, 0.27, 0.55 + open * 0.2, tooth)}
      {P(0.4, 1.02, 0.27, 0.55 + open * 0.2, tooth)}
      {P(0.37, 1.04, 0.03, 0.4, { backgroundColor: '#b8b298' })}
      {/* drool */}
      {P(0.22, 1.62 + open * 0.2 + ((t * 0.8) % 0.4), 0.07, 0.15, { backgroundColor: '#9dff3a', borderRadius: 0.04 * u, opacity: 0.85 })}
      {/* glowing eyes under the brim */}
      {P(0.3, 0.8, 0.17, 0.09, { backgroundColor: enraged ? '#ff3a3a' : '#ffd23a', borderRadius: 3 })}
      {P(0.62, 0.78, 0.15, 0.09, { backgroundColor: enraged ? '#ff3a3a' : '#ffd23a', borderRadius: 3 })}
      {/* the straw hat, perched on the head */}
      {P(0.45, 0.1, 0.85, 0.5, { backgroundColor: '#f2d56b', borderTopLeftRadius: 0.42 * u, borderTopRightRadius: 0.42 * u, transform: [{ rotate: '-6deg' }] })}
      {P(0.45, 0.42, 0.85, 0.1, { backgroundColor: '#a8442a', transform: [{ rotate: '-6deg' }] })}
      {P(0.05, 0.5, 1.6, 0.2, { backgroundColor: '#e6c04a', borderRadius: 0.1 * u, borderBottomWidth: 3, borderColor: '#a8801f', transform: [{ rotate: '-6deg' }] })}
      {P(1.1, 0.0, 0.04, 0.3, { backgroundColor: '#e6c04a', transform: [{ rotate: '25deg' }] })}
    </View>
  );
}

const flipFor = (e) => (e.dir > 0 ? -1 : 1);

export function HiveCritter({ e, ts, t }) {
  const hurt = e.hit > 0;
  const iflash = e.iframes > 0 && Math.floor(e.iframes * 20) % 2 === 0;
  const dead = !e.alive;
  const opacity = dead ? Math.max(0, 1 - e.squish * 2) : (hurt || iflash) && Math.floor((e.hit || e.iframes) * 30) % 2 === 0 ? 0.45 : 1;
  const shake = e.warn && e.kind === 'queen' ? Math.sin(e.t * 60) * ts * 0.05 : 0;
  let body;
  if (e.kind === 'queen') {
    body = <QueenArt u={ts} t={e.t} open={e.state === 'wind' && e.atk === 'screech' ? 1 : e.warn ? 0.4 : 0} wind={e.state === 'wind' && e.atk === 'tail'} enraged={e.hp <= 30} />;
  } else if (e.kind === 'egg' || e.kind === 'queenegg') {
    body = <Egg e={e} ts={ts} t={t} />;
  } else if (e.kind === 'hugger') {
    body = <Hugger w={e.w * ts} h={e.h * ts} />;
  } else if (e.kind === 'xeno') {
    body = <Xeno w={e.w * ts} h={e.h * ts} t={e.t} />;
  } else {
    body = <Spitter w={e.w * ts} h={e.h * ts} warn={e.warn} t={e.t} />;
  }
  return (
    <View
      style={{
        position: 'absolute',
        left: e.x * ts,
        top: e.y * ts,
        width: e.w * ts,
        height: e.h * ts,
        opacity,
        alignItems: 'center',
        justifyContent: 'flex-end',
        transform: [{ translateX: shake }, { scaleX: e.kind === 'egg' || e.kind === 'queenegg' || e.kind === 'spitter' ? 1 : flipFor(e) }, ...(dead ? [{ scaleY: 0.3 }] : [])],
      }}
    >
      {body}
      {e.warn && e.alive && e.kind !== 'egg' && e.kind !== 'queenegg' && <Text style={{ position: 'absolute', top: -ts * 0.55, fontSize: ts * 0.5 }}>❗</Text>}
    </View>
  );
}

export const HIVE_KINDS = new Set(['hugger', 'xeno', 'spitter', 'egg', 'queenegg', 'queen']);

// A little map in the corner that fills in as you explore
export const MiniMap = React.memo(
  function MiniMap({ level, n, tiles, version }) {
    const s = Math.max(0.5, Math.min(1.4, 120 / level.w));
    const ex = level.explored;
    const els = [];
    if (ex) {
      for (let y = 0; y < level.h; y++) {
        let run = null;
        const flush = (x) => {
          if (run) els.push(<View key={`${y},${run.x}`} style={{ position: 'absolute', left: run.x * s, top: y * s, width: (x - run.x) * s, height: s, backgroundColor: run.c }} />);
          run = null;
        };
        for (let x = 0; x <= level.w; x++) {
          let c = null;
          if (x < level.w && ex[y * level.w + x]) {
            const tt = tiles[y][x];
            c = tt === GROUND ? '#6a5a82' : tt === DOOR_BLUE ? '#4aa8ff' : tt === DOOR_RED ? '#ff4a5a' : tt === ACID ? '#6ad02a' : tt === HAY ? '#a89878' : '#1c1426';
          }
          if (run && run.c !== c) flush(x);
          if (c && !run) run = { x, c };
        }
      }
    }
    return (
      <View style={{ width: level.w * s, height: level.h * s, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)' }}>
        {els}
        {(level.saves || []).map((sv, i) => ex && ex[Math.floor(sv.floor - 1) * level.w + Math.floor(sv.x)] ? <View key={`s${i}`} style={{ position: 'absolute', left: sv.x * s - 1, top: (sv.floor - 1) * s - 1, width: 3, height: 3, backgroundColor: '#7dffc8' }} /> : null)}
      </View>
    );
  },
  (a, b) => a.n === b.n && a.version === b.version && a.level === b.level
);

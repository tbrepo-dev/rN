// The cage match (level 9): a hand-drawn arena, four fully drawn fighters, SF-style HUD, fatalities.
import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ARENA_W, FATALITIES, ROUNDS_TO_WIN, MOVES } from '../engine/fight';

// ---------------------------------------------------------------------------
// Outfits
const OUT = {
  billy: { skin: '#f0bd90', skinD: '#c98f63', shirt: '#c0392b', shirtD: '#8a2218', pants: '#3568b8', pantsD: '#244a8a', boot: '#5a3a1e', glove: '#f0bd90', scale: 1 },
  cletus: { skin: '#e6a97a', skinD: '#b87d52', shirt: '#f2f0e6', shirtD: '#bcb8a4', pants: '#5d6e3a', pantsD: '#434f28', boot: '#2b2b2b', glove: '#e6a97a', scale: 1.1 },
  mae: { skin: '#f1cdb0', skinD: '#c9a07e', shirt: '#8a4fd1', shirtD: '#6232a0', pants: '#8a4fd1', pantsD: '#6232a0', boot: '#4a3a2a', glove: '#f1cdb0', scale: 0.96 },
  jinxy: { skin: '#7b8496', skinD: '#565f70', shirt: '#2a2f3d', shirtD: '#1a1e29', pants: '#2a2f3d', pantsD: '#1a1e29', boot: '#7b8496', glove: '#7b8496', scale: 0.88 },
};

// A limb is a chain of segments, each hanging from the end of the last. Angles are degrees: 0 hangs
// straight down, negative swings forward (the fighter always faces right before the flip).
function Chain({ u, x, y, segs }) {
  const build = (i) => {
    if (i >= segs.length) return null;
    const sg = segs[i];
    return (
      <View
        style={{
          position: 'absolute',
          left: i === 0 ? x * u - (sg.w * u) / 2 : 0,
          top: i === 0 ? y * u : segs[i - 1].len * u - 2,
          width: sg.w * u,
          height: sg.len * u,
          transformOrigin: '50% 0%',
          transform: [{ rotate: `${sg.a}deg` }],
        }}
      >
        <View style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', backgroundColor: sg.c, borderRadius: sg.w * u * 0.48, borderWidth: sg.border ?? 0, borderColor: sg.bc }} />
        {sg.deco}
        {build(i + 1)}
      </View>
    );
  };
  return build(0);
}

// The segment list for an arm or a leg: upper (a1), lower (a2 relative to the upper), then a hand or boot
function armSegs(o, a1, a2, u, extra) {
  return [
    { w: 0.2, len: 0.4, a: a1, c: o.shirt, bc: o.shirtD, border: 1 },
    {
      w: 0.17,
      len: 0.38,
      a: a2,
      c: o.skin,
      deco: (
        <View style={{ position: 'absolute', left: -0.06 * u, top: 0.28 * u, width: 0.3 * u, height: 0.26 * u, borderRadius: 0.12 * u, backgroundColor: o.glove, borderWidth: 2, borderColor: o.skinD }}>
          {extra}
        </View>
      ),
    },
  ];
}

function legSegs(o, a1, a2, u) {
  return [
    { w: 0.28, len: 0.45, a: a1, c: o.pants, bc: o.pantsD, border: 1 },
    {
      w: 0.24,
      len: 0.42,
      a: a2,
      c: o.pants,
      bc: o.pantsD,
      border: 1,
      deco: <View style={{ position: 'absolute', left: -0.04 * u, top: 0.32 * u, width: 0.38 * u, height: 0.2 * u, borderTopRightRadius: 0.14 * u, borderBottomRightRadius: 0.06 * u, borderBottomLeftRadius: 0.04 * u, backgroundColor: o.boot, borderWidth: 2, borderColor: 'rgba(0,0,0,0.35)' }} />,
    },
  ];
}

// Arm and leg angles for a state. f.t = seconds in the state; T = match clock for idle motion.
function pose(f, T) {
  const t = f.t;
  const P = { aF: [-38, -95], aB: [-22, -85], lF: [-14, 14], lB: [16, -12], lean: 0, drop: 0, spin: 0, lie: 0, glow: false, kneel: false, trail: null };
  const bob = Math.sin(T * 5 + f.x * 2);
  switch (f.state) {
    case 'walk': {
      const s = Math.sin(T * 14);
      P.lF = [s * 34, Math.max(0, -s) * 40];
      P.lB = [-s * 34, Math.max(0, s) * 40];
      P.aF = [-30 - s * 18, -85];
      P.aB = [-14 + s * 18, -80];
      break;
    }
    case 'jump':
      P.lF = [-55, 85];
      P.lB = [-20, 70];
      P.aF = [-70, -60];
      P.aB = [-40, -80];
      break;
    case 'block':
      P.aF = [-62, -105];
      P.aB = [-48, -110];
      P.drop = 0.14;
      P.lean = 6;
      P.lF = [-26, 36];
      P.lB = [28, -4];
      break;
    case 'punch': {
      const m = MOVES.punch;
      const k = t < m.startup ? 0 : t < m.startup + m.active ? 1 : 0.35;
      P.aF = t < m.startup ? [12, -110] : [-88 * k - 5, -5];
      P.aB = [-30, -90];
      P.lean = 10 * k;
      P.lF = [-24, 14];
      P.lB = [26, -10];
      break;
    }
    case 'kick': {
      const m = MOVES.kick;
      const act = t >= m.startup && t < m.startup + m.active;
      P.lF = t < m.startup ? [-55, 95] : act ? [-98, 4] : [-40, 60];
      P.lB = [8, -4];
      P.aF = [-45, -95];
      P.aB = [38, -50];
      P.lean = -14;
      P.trail = act ? 'kick' : null;
      break;
    }
    case 'fireball': {
      const k = t < 0.18 ? 0 : 1;
      P.aF = k ? [-92, -2] : [20, -120];
      P.aB = k ? [-88, -4] : [15, -115];
      P.glow = k === 1 && t < 0.5;
      P.lean = k ? 10 : -8;
      P.lF = [-26, 28];
      P.lB = [30, -8];
      break;
    }
    case 'spin':
      P.spin = t * 1500;
      P.lF = [-96, 4];
      P.lB = [14, -8];
      P.aF = [-85, -10];
      P.aB = [85, 10];
      P.trail = 'spin';
      break;
    case 'uppercut':
      P.aF = [-172, -6];
      P.aB = [-30, -100];
      P.lF = [-30, 40];
      P.lB = [18, 50];
      P.lean = 8;
      P.trail = 'up';
      break;
    case 'hit':
      P.lean = -16;
      P.aF = [38, 20];
      P.aB = [52, 10];
      P.lF = [-12, 22];
      P.lB = [20, -6];
      break;
    case 'down':
    case 'ko':
      P.lie = Math.min(1, t * 6);
      P.aF = [60, 18];
      P.aB = [70, 12];
      P.lF = [-10, 10];
      P.lB = [14, -6];
      break;
    case 'getup':
      P.lie = Math.max(0, 1 - t / 0.3);
      break;
    case 'dizzy':
    case 'fatal':
      P.kneel = true;
      P.drop = 0.5;
      P.lean = Math.sin(T * 5) * 10;
      P.aF = [25, 15];
      P.aB = [30, 20];
      P.lF = [-84, 108];
      P.lB = [30, 76];
      break;
    default:
      P.aF = [-38 + bob * 3, -95];
      P.aB = [-22 - bob * 3, -85];
      P.drop = 0.03 + 0.02 * bob;
      break;
  }
  return P;
}

// ---------------------------------------------------------------------------
// Heads
function HeadBilly({ u, P }) {
  return (
    <View style={{ position: 'absolute', left: 0.82 * u, top: -0.02 * u, width: 0.62 * u, height: 0.7 * u }}>
      <View style={{ position: 'absolute', left: 0.04 * u, top: 0.16 * u, width: 0.54 * u, height: 0.5 * u, borderRadius: 0.24 * u, backgroundColor: '#f0bd90', borderWidth: 2, borderColor: '#c98f63' }} />
      <View style={{ position: 'absolute', left: 0.0, top: 0.4 * u, width: 0.6 * u, height: 0.32 * u, borderRadius: 0.18 * u, backgroundColor: '#c8622a', borderWidth: 2, borderColor: '#8a3d14' }} />
      <View style={{ position: 'absolute', left: 0.32 * u, top: 0.28 * u, width: 0.16 * u, height: 0.14 * u, borderRadius: 0.08 * u, backgroundColor: '#fff', borderWidth: 1, borderColor: '#555' }}>
        <View style={{ position: 'absolute', right: 0.02 * u, top: 0.03 * u, width: 0.07 * u, height: 0.07 * u, borderRadius: 0.04 * u, backgroundColor: '#1d2b50' }} />
      </View>
      <View style={{ position: 'absolute', left: 0.3 * u, top: 0.22 * u, width: 0.22 * u, height: 0.05 * u, backgroundColor: '#8a3d14', transform: [{ rotate: '-8deg' }] }} />
      <View style={{ position: 'absolute', left: 0.5 * u, top: 0.34 * u, width: 0.12 * u, height: 0.12 * u, borderRadius: 0.06 * u, backgroundColor: '#e89a78' }} />
      <View style={{ position: 'absolute', left: 0.2 * u, top: 0.5 * u, width: 0.3 * u, height: 0.04 * u, borderRadius: 2, backgroundColor: '#5a1a10', opacity: P.kneel || P.lean < -10 ? 1 : 0.5 }} />
      <View style={{ position: 'absolute', left: 0.1 * u, top: -0.02 * u, width: 0.42 * u, height: 0.26 * u, borderTopLeftRadius: 0.2 * u, borderTopRightRadius: 0.2 * u, backgroundColor: '#e8c752', borderWidth: 2, borderColor: '#b58a1f' }} />
      <View style={{ position: 'absolute', left: 0.1 * u, top: 0.16 * u, width: 0.42 * u, height: 0.07 * u, backgroundColor: '#a8442a' }} />
      <View style={{ position: 'absolute', left: -0.08 * u, top: 0.2 * u, width: 0.78 * u, height: 0.12 * u, borderRadius: 0.06 * u, backgroundColor: '#f0d46a', borderWidth: 2, borderColor: '#b58a1f' }} />
    </View>
  );
}

function HeadCletus({ u }) {
  return (
    <View style={{ position: 'absolute', left: 0.8 * u, top: -0.02 * u, width: 0.68 * u, height: 0.72 * u }}>
      <View style={{ position: 'absolute', left: -0.1 * u, top: 0.18 * u, width: 0.24 * u, height: 0.46 * u, borderRadius: 0.1 * u, backgroundColor: '#6b3f1a' }} />
      <View style={{ position: 'absolute', left: 0.04 * u, top: 0.16 * u, width: 0.58 * u, height: 0.5 * u, borderRadius: 0.2 * u, backgroundColor: '#e6a97a', borderWidth: 2, borderColor: '#b87d52' }} />
      <View style={{ position: 'absolute', left: 0.36 * u, top: 0.28 * u, width: 0.15 * u, height: 0.1 * u, borderRadius: 0.05 * u, backgroundColor: '#fff', borderWidth: 1, borderColor: '#444' }}>
        <View style={{ position: 'absolute', right: 0.02 * u, top: 0.025 * u, width: 0.05 * u, height: 0.05 * u, borderRadius: 0.03 * u, backgroundColor: '#222' }} />
      </View>
      <View style={{ position: 'absolute', left: 0.32 * u, top: 0.22 * u, width: 0.24 * u, height: 0.06 * u, backgroundColor: '#4a2a10', transform: [{ rotate: '14deg' }] }} />
      <View style={{ position: 'absolute', left: 0.5 * u, top: 0.34 * u, width: 0.14 * u, height: 0.14 * u, borderRadius: 0.07 * u, backgroundColor: '#d98a64' }} />
      <View style={{ position: 'absolute', left: 0.24 * u, top: 0.46 * u, width: 0.42 * u, height: 0.1 * u, borderRadius: 0.05 * u, backgroundColor: '#5a3416' }} />
      <View style={{ position: 'absolute', left: 0.06 * u, top: -0.04 * u, width: 0.52 * u, height: 0.24 * u, borderTopLeftRadius: 0.26 * u, borderTopRightRadius: 0.26 * u, backgroundColor: '#b3262b', borderWidth: 2, borderColor: '#7a1318' }}>
        <View style={{ position: 'absolute', left: 0.14 * u, top: 0.04 * u, width: 0.2 * u, height: 0.14 * u, borderRadius: 3, backgroundColor: '#fff' }} />
      </View>
      <View style={{ position: 'absolute', left: 0.36 * u, top: 0.16 * u, width: 0.4 * u, height: 0.07 * u, borderRadius: 0.04 * u, backgroundColor: '#7a1318' }} />
    </View>
  );
}

function HeadMae({ u }) {
  return (
    <View style={{ position: 'absolute', left: 0.82 * u, top: -0.04 * u, width: 0.62 * u, height: 0.74 * u }}>
      <View style={{ position: 'absolute', left: 0.02 * u, top: -0.02 * u, width: 0.26 * u, height: 0.26 * u, borderRadius: 0.13 * u, backgroundColor: '#d8d8e0', borderWidth: 2, borderColor: '#9a9aa8' }} />
      <View style={{ position: 'absolute', left: 0.06 * u, top: 0.1 * u, width: 0.52 * u, height: 0.5 * u, borderRadius: 0.22 * u, backgroundColor: '#f1cdb0', borderWidth: 2, borderColor: '#c9a07e' }} />
      <View style={{ position: 'absolute', left: 0.04 * u, top: 0.06 * u, width: 0.56 * u, height: 0.2 * u, borderTopLeftRadius: 0.26 * u, borderTopRightRadius: 0.26 * u, backgroundColor: '#d8d8e0' }} />
      <View style={{ position: 'absolute', left: 0.3 * u, top: 0.26 * u, width: 0.2 * u, height: 0.17 * u, borderRadius: 0.1 * u, borderWidth: 3, borderColor: '#5a3a6a', backgroundColor: 'rgba(200,230,255,0.5)' }}>
        <View style={{ position: 'absolute', right: 0.03 * u, top: 0.04 * u, width: 0.06 * u, height: 0.06 * u, borderRadius: 0.03 * u, backgroundColor: '#222' }} />
      </View>
      <View style={{ position: 'absolute', left: 0.18 * u, top: 0.27 * u, width: 0.14 * u, height: 0.14 * u, borderRadius: 0.07 * u, borderWidth: 3, borderColor: '#5a3a6a' }} />
      <View style={{ position: 'absolute', left: 0.4 * u, top: 0.44 * u, width: 0.2 * u, height: 0.1 * u, borderRadius: 0.1 * u, backgroundColor: '#c64a5a' }} />
      <View style={{ position: 'absolute', left: 0.42 * u, top: 0.38 * u, width: 0.12 * u, height: 0.08 * u, borderRadius: 0.06 * u, backgroundColor: 'rgba(230,100,110,0.5)' }} />
    </View>
  );
}

function HeadJinxy({ u }) {
  return (
    <View style={{ position: 'absolute', left: 0.78 * u, top: 0.0, width: 0.7 * u, height: 0.72 * u }}>
      {[0.04, 0.4].map((l, i) => (
        <View key={i} style={{ position: 'absolute', left: l * u, top: -0.08 * u, width: 0, height: 0, borderLeftWidth: 0.12 * u, borderRightWidth: 0.12 * u, borderBottomWidth: 0.28 * u, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#6b7486' }} />
      ))}
      <View style={{ position: 'absolute', left: 0.02 * u, top: 0.14 * u, width: 0.64 * u, height: 0.52 * u, borderRadius: 0.26 * u, backgroundColor: '#7b8496', borderWidth: 2, borderColor: '#565f70' }} />
      <View style={{ position: 'absolute', left: 0.04 * u, top: 0.4 * u, width: 0.22 * u, height: 0.16 * u, borderRadius: 0.1 * u, backgroundColor: '#aab2c2' }} />
      <View style={{ position: 'absolute', left: 0.38 * u, top: 0.4 * u, width: 0.26 * u, height: 0.17 * u, borderRadius: 0.1 * u, backgroundColor: '#aab2c2' }} />
      <View style={{ position: 'absolute', left: 0.28 * u, top: 0.3 * u, width: 0.17 * u, height: 0.14 * u, borderRadius: 0.07 * u, backgroundColor: '#7fe07a', borderWidth: 1, borderColor: '#2d7a37' }}>
        <View style={{ position: 'absolute', left: 0.07 * u, top: 0.01 * u, width: 0.03 * u, height: 0.11 * u, backgroundColor: '#111' }} />
      </View>
      <View style={{ position: 'absolute', left: 0.5 * u, top: 0.32 * u, width: 0.14 * u, height: 0.12 * u, borderRadius: 0.06 * u, backgroundColor: '#7fe07a', borderWidth: 1, borderColor: '#2d7a37' }}>
        <View style={{ position: 'absolute', left: 0.055 * u, top: 0.0, width: 0.03 * u, height: 0.11 * u, backgroundColor: '#111' }} />
      </View>
      <View style={{ position: 'absolute', left: 0.58 * u, top: 0.44 * u, width: 0.09 * u, height: 0.07 * u, borderRadius: 0.04 * u, backgroundColor: '#e8808a' }} />
      {[0.46, 0.52].map((tp) => (
        <View key={tp} style={{ position: 'absolute', left: 0.6 * u, top: tp * u, width: 0.34 * u, height: 1, backgroundColor: '#dfe5f0', transform: [{ rotate: `${(tp - 0.49) * 200}deg` }] }} />
      ))}
      <View style={{ position: 'absolute', left: -0.04 * u, top: -0.08 * u, width: 0.74 * u, height: 0.26 * u, borderRadius: 0.14 * u, backgroundColor: '#3a2f2a', borderWidth: 2, borderColor: '#1d1612' }}>
        <Text style={{ position: 'absolute', left: 0.4 * u, top: -0.04 * u, fontSize: 0.2 * u, color: '#e0262a' }}>★</Text>
      </View>
      <View style={{ position: 'absolute', left: -0.08 * u, top: 0.1 * u, width: 0.14 * u, height: 0.3 * u, borderRadius: 0.07 * u, backgroundColor: '#3a2f2a' }} />
    </View>
  );
}

const HEADS = { billy: HeadBilly, cletus: HeadCletus, mae: HeadMae, jinxy: HeadJinxy };

function Torso({ f, o, u }) {
  const W = f.who === 'cletus' ? 0.86 : f.who === 'jinxy' ? 0.66 : 0.74;
  const x = 1.1 - W / 2;
  return (
    <View style={{ position: 'absolute', left: x * u, top: 0.5 * u, width: W * u, height: 0.7 * u, borderRadius: 0.18 * u, backgroundColor: o.shirt, borderWidth: 2, borderColor: o.shirtD, overflow: 'hidden' }}>
      {f.who === 'billy' && (
        <>
          {[0.2, 0.45].map((l) => (
            <View key={l} style={{ position: 'absolute', left: l * u, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(0,0,0,0.25)' }} />
          ))}
          <View style={{ position: 'absolute', left: 0.14 * u, top: 0.22 * u, width: 0.46 * u, height: 0.5 * u, backgroundColor: '#3568b8', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 2, borderColor: '#244a8a' }} />
          <View style={{ position: 'absolute', left: 0.16 * u, top: 0.28 * u, width: 0.08 * u, height: 0.08 * u, borderRadius: 0.04 * u, backgroundColor: '#f6d55c' }} />
          <View style={{ position: 'absolute', left: 0.5 * u, top: 0.28 * u, width: 0.08 * u, height: 0.08 * u, borderRadius: 0.04 * u, backgroundColor: '#f6d55c' }} />
          <View style={{ position: 'absolute', left: 0.26 * u, top: 0.44 * u, width: 0.22 * u, height: 0.16 * u, borderWidth: 2, borderColor: '#244a8a', borderRadius: 2 }} />
        </>
      )}
      {f.who === 'cletus' && (
        <>
          <View style={{ position: 'absolute', left: 0.1 * u, top: 0.1 * u, width: 0.2 * u, height: 0.14 * u, borderRadius: 0.07 * u, backgroundColor: 'rgba(120,90,40,0.5)' }} />
          <View style={{ position: 'absolute', left: 0, top: 0.6 * u, width: '100%', height: 0.1 * u, backgroundColor: '#5a3a1e' }} />
        </>
      )}
      {f.who === 'mae' && (
        <>
          <View style={{ position: 'absolute', left: 0.12 * u, top: 0.18 * u, width: 0.5 * u, height: 0.56 * u, backgroundColor: '#fffaf0', borderRadius: 0.1 * u, borderWidth: 2, borderColor: '#d8cdb8' }} />
          <View style={{ position: 'absolute', left: 0.28 * u, top: 0.32 * u, width: 0.18 * u, height: 0.14 * u, borderRadius: 0.07 * u, backgroundColor: '#e8808a' }} />
        </>
      )}
      {f.who === 'jinxy' && (
        <>
          <View style={{ position: 'absolute', left: 0.05 * u, top: 0, width: 0.07 * u, height: '100%', backgroundColor: '#fff' }} />
          <View style={{ position: 'absolute', left: 0.5 * u, top: 0, width: 0.07 * u, height: '100%', backgroundColor: '#fff' }} />
          <View style={{ position: 'absolute', left: 0.26 * u, top: 0.1 * u, width: 0.06 * u, height: 0.5 * u, backgroundColor: '#aab2c2' }} />
        </>
      )}
    </View>
  );
}

function Fighter({ f, ts, T, floorY, ox, win }) {
  const o = OUT[f.who];
  const u = ts * 1.18 * o.scale;
  const P = pose(f, T);
  let aF = P.aF;
  let aB = P.aB;
  if (win) {
    aF = [-168 + Math.sin(T * 12) * 14, -8];
    aB = [-156 - Math.sin(T * 12) * 14, -8];
  }
  const W = 2.2 * u;
  const H = 2.2 * u;
  const hit = f.flash > 0 && Math.floor(f.flash * 40) % 2 === 0;
  const Head = HEADS[f.who];
  const rot = P.spin ? P.spin : P.lie * -82 + P.lean;
  const swish = Math.sin(T * 4) * 12;
  const hip = 1.18;
  return (
    <View
      style={{
        position: 'absolute',
        left: ox + f.x * ts - W / 2,
        top: floorY - f.y * ts - H * 0.97 + P.lie * H * 0.3,
        width: W,
        height: H,
        opacity: hit ? 0.55 : 1,
        transform: [{ scaleX: f.face }, { rotate: `${rot}deg` }],
        transformOrigin: '50% 92%',
      }}
    >
      <View style={{ position: 'absolute', left: W * 0.5 - u * 0.75, top: H * 0.97 - u * 0.09 + f.y * ts * 0.97, width: u * 1.5, height: u * 0.18, borderRadius: u, backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <View style={{ position: 'absolute', left: 0, top: P.drop * u, width: W, height: H }}>
        {f.who === 'jinxy' && <View style={{ position: 'absolute', left: 0.4 * u, top: 0.85 * u, width: 0.7 * u, height: 0.16 * u, borderRadius: 0.1 * u, backgroundColor: '#565f70', transformOrigin: '100% 50%', transform: [{ rotate: `${20 + swish}deg` }] }} />}
        <Chain u={u} x={1.1 - 0.17} y={hip} segs={legSegs(o, P.lB[0], P.lB[1], u)} />
        <Chain u={u} x={1.1 - 0.5} y={0.64} segs={armSegs(o, aB[0], aB[1], u)} />
        <Torso f={f} o={o} u={u} />
        <Chain u={u} x={1.1 + 0.17} y={hip} segs={legSegs(o, P.lF[0], P.lF[1], u)} />
        {f.who === 'mae' && (
          <View style={{ position: 'absolute', left: 0.62 * u, top: 1.0 * u, width: 0.96 * u, height: 0.55 * u, backgroundColor: '#8a4fd1', borderBottomLeftRadius: 0.4 * u, borderBottomRightRadius: 0.4 * u, borderWidth: 2, borderColor: '#6232a0' }}>
            <View style={{ position: 'absolute', left: 0.14 * u, top: 0, width: 0.68 * u, height: 0.2 * u, backgroundColor: '#fffaf0' }} />
          </View>
        )}
        <Head u={u} P={P} />
        <Chain u={u} x={1.1 + 0.22} y={0.64} segs={armSegs(o, aF[0], aF[1], u, f.who === 'mae' ? <View style={{ position: 'absolute', left: -0.1 * u, top: 0.04 * u, width: 0.5 * u, height: 0.12 * u, borderRadius: 0.06 * u, backgroundColor: '#c9915a', borderWidth: 2, borderColor: '#8a5a2a' }} /> : null)} />
        {P.glow && <View style={{ position: 'absolute', left: 1.8 * u, top: 0.4 * u, width: 0.5 * u, height: 0.5 * u, borderRadius: 0.25 * u, backgroundColor: 'rgba(255,200,60,0.85)', borderWidth: 3, borderColor: '#ff7a1a' }} />}
        {P.trail === 'kick' && <View style={{ position: 'absolute', left: 1.1 * u, top: 0.6 * u, width: 1.35 * u, height: 1.4 * u, borderRadius: 1.4 * u, borderWidth: 4, borderLeftWidth: 0, borderColor: 'rgba(255,255,255,0.7)' }} />}
        {P.trail === 'up' && <View style={{ position: 'absolute', left: 1.0 * u, top: -0.5 * u, width: 0.9 * u, height: 1.6 * u, borderRadius: 1 * u, borderWidth: 4, borderLeftWidth: 0, borderColor: 'rgba(255,230,120,0.8)' }} />}
        {f.state === 'spin' && <View style={{ position: 'absolute', left: -0.2 * u, top: 0.5 * u, width: 2.6 * u, height: 1.4 * u, borderRadius: 2 * u, borderWidth: 4, borderColor: 'rgba(255,255,255,0.45)' }} />}
        {f.state === 'dizzy' &&
          [0, 1, 2].map((i) => (
            <Text key={i} style={{ position: 'absolute', left: 1.0 * u + Math.cos(T * 6 + i * 2.1) * 0.55 * u, top: -0.3 * u + Math.sin(T * 6 + i * 2.1) * 0.12 * u, fontSize: 0.4 * u }}>⭐</Text>
          ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// The arena
const SKY = ['#0a0520', '#10092e', '#170d3e', '#1f1250', '#291662', '#331a70'];
const CROWD_COLORS = ['#b3262b', '#2f5fa8', '#e8c752', '#3f8a4a', '#8a4fd1', '#e8873a', '#f2f0e6', '#4a3a2a'];
const SKINS = ['#f0bd90', '#e6a97a', '#c98f63', '#f1cdb0'];

const Crowd = React.memo(function Crowd({ width, top, rowH, rows }) {
  const els = [];
  for (let r = 0; r < rows; r++) {
    const n = Math.ceil(width / (rowH * 0.62));
    const y = top + r * rowH * 0.72;
    for (let i = 0; i < n; i++) {
      const seed = (i * 7919 + r * 104729) % 97;
      const x = i * rowH * 0.62 + (r % 2) * rowH * 0.3;
      const c = CROWD_COLORS[seed % CROWD_COLORS.length];
      const hat = seed % 3 === 0;
      els.push(
        <View key={`${r},${i}`} style={{ position: 'absolute', left: x, top: y, width: rowH * 0.55, height: rowH, opacity: 0.8 - r * 0.08 }}>
          <View style={{ position: 'absolute', left: rowH * 0.02, top: rowH * 0.42, width: rowH * 0.51, height: rowH * 0.6, borderTopLeftRadius: rowH * 0.25, borderTopRightRadius: rowH * 0.25, backgroundColor: c }} />
          <View style={{ position: 'absolute', left: rowH * 0.11, top: rowH * 0.1, width: rowH * 0.33, height: rowH * 0.36, borderRadius: rowH * 0.17, backgroundColor: SKINS[seed % SKINS.length] }} />
          {hat && <View style={{ position: 'absolute', left: rowH * 0.05, top: rowH * 0.06, width: rowH * 0.45, height: rowH * 0.1, borderRadius: rowH * 0.05, backgroundColor: '#e8c752' }} />}
          {hat && <View style={{ position: 'absolute', left: rowH * 0.14, top: -rowH * 0.02, width: rowH * 0.27, height: rowH * 0.12, borderTopLeftRadius: rowH * 0.1, borderTopRightRadius: rowH * 0.1, backgroundColor: '#e8c752' }} />}
        </View>
      );
    }
  }
  return <View style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}>{els}</View>;
});

const Cage = React.memo(function Cage({ width, top, height }) {
  const n = Math.ceil(width / 14);
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: i * 14, top, width: 1.5, height, backgroundColor: 'rgba(190,200,225,0.2)' }} />
      ))}
      {Array.from({ length: Math.ceil(height / 14) }, (_, i) => (
        <View key={`h${i}`} style={{ position: 'absolute', left: 0, top: top + i * 14, width, height: 1.5, backgroundColor: 'rgba(190,200,225,0.14)' }} />
      ))}
      {[0.35, 0.7].map((f) => (
        <View key={f} style={{ position: 'absolute', left: 0, top: top + height * f, width, height: 5, backgroundColor: 'rgba(210,215,235,0.35)' }} />
      ))}
    </>
  );
});

const Floor = React.memo(function Floor({ width, height, floorY, ox, aw, ts }) {
  const planks = Array.from({ length: Math.ceil(width / (ts * 1.3)) }, (_, i) => i);
  return (
    <>
      <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#5b3b20' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, height: (height - floorY) * 0.5, backgroundColor: '#7a5230' }} />
      {planks.map((i) => (
        <View key={i} style={{ position: 'absolute', left: i * ts * 1.3, top: floorY, width: 2, height: height - floorY, backgroundColor: 'rgba(0,0,0,0.18)', transform: [{ skewX: '-12deg' }] }} />
      ))}
      <View style={{ position: 'absolute', left: ox, width: aw, top: floorY - 3, height: 8, backgroundColor: '#e8c752' }} />
      <View style={{ position: 'absolute', left: ox, width: aw, top: floorY + 5, height: 3, backgroundColor: '#a8801f' }} />
      <View style={{ position: 'absolute', left: width * 0.5 - ts * 2.2, top: floorY + ts * 0.5, width: ts * 4.4, height: ts * 1.1, borderRadius: ts * 2, borderWidth: 4, borderColor: 'rgba(255,255,255,0.18)' }} />
      <Text style={{ position: 'absolute', left: width * 0.5 - ts * 2, width: ts * 4, top: floorY + ts * 0.7, textAlign: 'center', fontSize: ts * 0.4, fontWeight: '900', letterSpacing: 4, color: 'rgba(255,255,255,0.25)' }}>CAGE MATCH</Text>
    </>
  );
});

function Backdrop({ width, height, floorY, t, ox, ts }) {
  const bandH = floorY / SKY.length;
  const rowH = ts * 0.78;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SKY.map((c, i) => (
        <View key={c} style={{ position: 'absolute', left: 0, right: 0, top: i * bandH, height: bandH + 1, backgroundColor: c }} />
      ))}
      <View style={{ position: 'absolute', left: width * 0.08, right: width * 0.08, top: ts * 0.05, height: ts * 0.18, borderRadius: 4, backgroundColor: '#14102a', borderWidth: 2, borderColor: '#3a3166' }} />
      {[0.14, 0.3, 0.5, 0.7, 0.86].map((f, i) => (
        <View key={f}>
          <View style={{ position: 'absolute', left: width * f - ts * 0.5, top: ts * 0.02, width: ts, height: ts * 0.3, borderRadius: ts * 0.15, backgroundColor: '#fff6c0', opacity: 0.75 + 0.2 * Math.sin(t * 3 + i) }} />
          <View style={{ position: 'absolute', left: width * f - ts * 1.6, top: ts * 0.25, width: 0, height: 0, borderLeftWidth: ts * 1.6, borderRightWidth: ts * 1.6, borderTopWidth: floorY * 0.85, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: `rgba(255,246,192,${0.07 + 0.02 * Math.sin(t * 2 + i)})`, transform: [{ rotate: '180deg' }] }} />
        </View>
      ))}
      <Text style={{ position: 'absolute', left: 0, right: 0, top: floorY * 0.3, textAlign: 'center', fontSize: ts * 0.55, fontWeight: '900', letterSpacing: 8, color: '#ff4ad2', textShadowColor: '#ff4ad2', textShadowRadius: 14, opacity: 0.55 + 0.2 * Math.sin(t * 5) }}>HILLBILLY HARD KNOCKS</Text>
      <Crowd width={width} top={floorY * 0.38} rowH={rowH} rows={3} />
      <Cage width={width} top={floorY * 0.2} height={floorY * 0.82} />
      <Floor width={width} height={height} floorY={floorY} ox={ox} aw={ARENA_W * ts} ts={ts} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: floorY * 0.14, backgroundColor: 'rgba(0,0,0,0.35)' }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// HUD
const Bar = ({ frac, trail, color, right, w }) => (
  <View style={{ width: w, height: 20, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.7)', borderWidth: 3, borderColor: '#f4f1e6', overflow: 'hidden', transform: [{ scaleX: right ? -1 : 1 }, { skewX: '-18deg' }] }}>
    <View style={{ position: 'absolute', left: 0, top: 0, width: `${Math.max(0, Math.min(1, trail)) * 100}%`, height: '100%', backgroundColor: '#fff' }} />
    <View style={{ position: 'absolute', left: 0, top: 0, width: `${Math.max(0, Math.min(1, frac)) * 100}%`, height: '100%', backgroundColor: frac > 0.3 ? color : '#ff3a2a' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '35%', backgroundColor: 'rgba(255,255,255,0.3)' }} />
    </View>
    {[0.25, 0.5, 0.75].map((f) => (
      <View key={f} style={{ position: 'absolute', left: `${f * 100}%`, top: 0, width: 2, height: '100%', backgroundColor: 'rgba(0,0,0,0.35)' }} />
    ))}
  </View>
);

function Portrait({ who, right, color }) {
  const sz = 46;
  const U = 50;
  const Head = HEADS[who];
  return (
    <View style={{ width: sz, height: sz, borderRadius: sz / 2, borderWidth: 3, borderColor: color, backgroundColor: '#201638', overflow: 'hidden', transform: [{ scaleX: right ? -1 : 1 }] }}>
      <View style={{ position: 'absolute', left: -0.8 * U + 3, top: 3 }}>
        <Head u={U} P={{ kneel: false, lean: 0 }} />
      </View>
    </View>
  );
}

function Pips({ n, right }) {
  return (
    <View style={{ flexDirection: right ? 'row-reverse' : 'row', gap: 4, marginTop: 3 }}>
      {Array.from({ length: ROUNDS_TO_WIN }, (_, i) => (
        <View key={i} style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', backgroundColor: i < n ? '#ffd23a' : 'rgba(0,0,0,0.4)' }} />
      ))}
    </View>
  );
}

// Overlay animations for the fatalities. k is seconds since the fatality began.
function FatalityFx({ F, ts, floorY, ox }) {
  const o = F.o;
  const k = F.t;
  const x = ox + o.x * ts;
  const fy = floorY;
  switch (F.fatality) {
    case 'cob': {
      const fall = Math.min(1, Math.max(0, (k - 0.3) / 0.5));
      return (
        <>
          <Text style={{ position: 'absolute', left: x - ts * 1.5, top: fy - ts * 3.6 - (1 - fall) * ts * 6, fontSize: ts * 3.4, transform: [{ rotate: '20deg' }] }}>🌽</Text>
          {k > 0.8 && <Text style={{ position: 'absolute', left: x - ts * 1.1, top: fy - ts * 1.8, fontSize: ts * 1.8 }}>💥</Text>}
          {k > 0.9 && <Text style={{ position: 'absolute', left: x - ts * 1.5, top: fy - ts * 3, fontSize: ts * 0.9, fontWeight: '900', color: '#fff' }}>SPLAT!</Text>}
        </>
      );
    }
    case 'outhouse': {
      const run = Math.min(1, k / 1.1);
      const px = ox - ts * 3 + run * (ox + ARENA_W * ts + ts * 4);
      return <Text style={{ position: 'absolute', left: px, top: fy - ts * 2.4, fontSize: ts * 2.6 }}>🚽</Text>;
    }
    case 'jug': {
      const boom = Math.max(0, k - 0.9);
      return (
        <>
          <Text style={{ position: 'absolute', left: x - ts * 1.3, top: fy - ts * 3 - Math.max(0, 0.9 - k) * ts * 5, fontSize: ts * 2.6 }}>🏺</Text>
          {boom > 0 && (
            <View style={{ position: 'absolute', left: x - ts * (0.5 + boom * 2.4), top: fy - ts * 1.1 - ts * (0.5 + boom * 2.4), width: ts * (1 + boom * 4.8), height: ts * (1 + boom * 4.8), borderRadius: ts * 4, backgroundColor: `rgba(255,${180 - boom * 60},40,${Math.max(0, 0.9 - boom * 0.5)})` }} />
          )}
          {k > 1.4 && <Text style={{ position: 'absolute', left: x - ts * 0.9, top: fy - ts * 2, fontSize: ts * 1.8, opacity: k > 2.6 ? 0.4 : 1 }}>💀</Text>}
        </>
      );
    }
    case 'moon':
      return (
        <>
          <Text style={{ position: 'absolute', left: ox + ARENA_W * ts * 0.62, top: ts * 0.3, fontSize: ts * 2.4 }}>🌙</Text>
          {k > 1.3 && <Text style={{ position: 'absolute', left: ox + ARENA_W * ts * 0.62 + ts * 0.6, top: ts * 0.1, fontSize: ts * 1.4 }}>✨</Text>}
        </>
      );
    default:
      return null;
  }
}

function fatalityPose(F) {
  const k = F.t;
  switch (F.fatality) {
    case 'cob':
      return k > 0.8 ? { flat: true } : null;
    case 'outhouse': {
      const hitK = Math.max(0, k - 0.55);
      return k > 0.55 ? { dx: hitK * 9, dy: Math.sin(Math.min(1, hitK / 1.5) * Math.PI) * 4 + hitK * 2, spin: hitK * 700 } : null;
    }
    case 'jug':
      return k > 1.4 ? { hide: true } : null;
    case 'moon':
      return k > 0.4 ? { dy: (k - 0.4) * 9, dx: (k - 0.4) * 1.5, spin: (k - 0.4) * 500 } : null;
    default:
      return null;
  }
}

const Burst = ({ ts, x, y, big }) => {
  const r = ts * (big ? 1.1 : 0.8);
  return (
    <View style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2 }}>
      <View style={{ position: 'absolute', left: r * 0.3, top: r * 0.3, width: r * 1.4, height: r * 1.4, borderRadius: r, backgroundColor: '#fff6b0' }} />
      {[0, 45, 90, 135].map((a) => (
        <View key={a} style={{ position: 'absolute', left: 0, top: r - 3, width: r * 2, height: 6, borderRadius: 3, backgroundColor: a % 90 ? '#ffb43a' : '#ff6a1a', transform: [{ rotate: `${a}deg` }] }} />
      ))}
      <View style={{ position: 'absolute', left: r * 0.6, top: r * 0.6, width: r * 0.8, height: r * 0.8, borderRadius: r, backgroundColor: '#fff' }} />
    </View>
  );
};

export function FightView({ g, width, height }) {
  const F = g.fight;
  const ts = Math.min(width / (ARENA_W + 0.5), height / 6.4);
  const floorY = height * 0.7;
  const ox = (width - ARENA_W * ts) / 2;
  const T = F.t + g.time;
  const shakeX = F.shake > 0 ? (Math.random() - 0.5) * ts * 0.35 : 0;
  const shakeY = F.shake > 0 ? (Math.random() - 0.5) * ts * 0.35 : 0;
  const fat = F.phase === 'fatality' ? fatalityPose(F) : null;
  const barW = Math.min(width * 0.34, 290);
  const winP = F.phase === 'fatality' || (F.phase === 'ko' && F.roundWinner === 'p') || F.phase === 'finish' || F.phase === 'won';
  const winO = F.phase === 'ko' && F.roundWinner === 'o';
  const finishFrac = Math.max(0, F.finishT / 7);
  const o = fat ? { ...F.o, x: F.o.x + (fat.dx || 0), y: F.o.y + (fat.dy || 0) } : F.o;
  const showO = !(fat && fat.hide);
  const cd = (v) => (v <= 0 ? 1 : 0.3);
  const trail = useRef({ p: 1, o: 1, at: 0 });
  const dt = Math.min(0.1, Math.max(0, g.time - trail.current.at));
  trail.current.at = g.time;
  const fp = F.p.hp / F.p.maxHp;
  const fo = F.o.hp / F.o.maxHp;
  trail.current.p = Math.max(fp, trail.current.p - dt * 0.35);
  trail.current.o = Math.max(fo, trail.current.o - dt * 0.35);
  if (F.phase === 'intro' && F.t < 0.1) trail.current.p = trail.current.o = 1;
  const flash = F.phase === 'ko' && F.t < 0.25 ? 0.5 * (1 - F.t / 0.25) : 0;
  const bigText = F.text && F.phase !== 'fatality';
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Backdrop width={width} height={height} floorY={floorY} t={g.time} ox={ox} ts={ts} />
      <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}>
        <Fighter f={F.p} ts={ts} T={T} floorY={floorY} ox={ox} win={winP} />
        {showO && (
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width,
              height,
              transform: fat && fat.flat ? [{ scaleY: 0.22 }] : fat && fat.spin ? [{ rotate: `${fat.spin}deg` }] : [],
              transformOrigin: fat && fat.flat ? `0px ${floorY}px` : fat && fat.spin ? `${ox + o.x * ts}px ${floorY - o.y * ts - ts}px` : undefined,
            }}
          >
            <Fighter f={o} ts={ts} T={T} floorY={floorY} ox={ox} win={winO} />
          </View>
        )}
        {F.shots.map((s, i) => {
          const d = ts * 0.9;
          return (
            <View key={i} style={{ position: 'absolute', left: ox + s.x * ts, top: floorY - s.y * ts }}>
              {[3, 2, 1].map((k) => (
                <View key={k} style={{ position: 'absolute', left: -s.face * k * d * 0.45 - d * (0.5 - k * 0.07), top: -d * (0.5 - k * 0.07), width: d * (1 - k * 0.14), height: d * (1 - k * 0.14), borderRadius: d, backgroundColor: `rgba(255,${120 + k * 30},40,${0.5 - k * 0.1})` }} />
              ))}
              <View style={{ position: 'absolute', left: -d * 0.5, top: -d * 0.5, width: d, height: d, borderRadius: d, backgroundColor: '#ffb43a', borderWidth: 4, borderColor: '#ff5a1a' }}>
                <View style={{ position: 'absolute', left: d * 0.22, top: d * 0.22, width: d * 0.42, height: d * 0.42, borderRadius: d, backgroundColor: '#fff6b0' }} />
              </View>
            </View>
          );
        })}
        {[F.p, F.o].map((f, i) => (f.flash > 0.12 ? <Burst key={i} ts={ts} x={ox + (f.x - f.face * 0.1) * ts} y={floorY - (f.y + 1.3) * ts} big={f.state === 'down' || f.state === 'ko'} /> : null))}
        {F.phase === 'fatality' && <FatalityFx F={F} ts={ts} floorY={floorY} ox={ox} />}
      </View>
      {flash > 0 && <View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff', opacity: flash }]} />}

      <View style={{ position: 'absolute', top: 6, left: 40, right: 124, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Portrait who="billy" color="#5fd13a" />
          <View>
            <Text style={styles.name}>BILLY ×{g.lives}</Text>
            <Bar frac={fp} trail={trail.current.p} color="#5fd13a" w={barW} />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pips n={F.wins.p} />
              <Text style={styles.cds}>
                <Text style={{ opacity: cd(F.p.cd.fire) }}>🔥</Text> <Text style={{ opacity: cd(F.p.cd.spin) }}>🌀</Text> <Text style={{ opacity: cd(F.p.cd.up) }}>⬆️</Text>
              </Text>
            </View>
          </View>
        </View>
        <View style={{ alignItems: 'center', minWidth: 80 }}>
          <View style={styles.timerBox}>
            <Text style={styles.timer}>{Math.max(0, Math.ceil(F.timer))}</Text>
          </View>
          <Text style={styles.rnd}>
            FIGHT {g.fightIdx + 1}/3 • RD {F.round}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.name}>{F.def.name}</Text>
            <Bar frac={fo} trail={trail.current.o} color="#ff9a2a" right w={barW} />
            <Pips n={F.wins.o} right />
          </View>
          <Portrait who={F.def.id} right color="#ff9a2a" />
        </View>
      </View>

      {bigText && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingBottom: height * 0.3 }]}>
          <Text style={[styles.banner, F.phase === 'finish' && { color: '#ff3a3a' }, { fontSize: Math.min(58, ts * 1.2, (width * 0.9) / (F.text.length * 0.85)), opacity: F.phase === 'finish' ? 0.7 + 0.3 * Math.sin(F.t * 12) : 1 }]}>{F.text}</Text>
        </View>
      )}
      {F.phase === 'fatality' && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', paddingTop: 70 }]}>
          <Text style={[styles.banner, { fontSize: Math.min(34, (width * 0.9) / (F.text.length * 0.9)), color: '#ff3a3a' }]}>{F.text}</Text>
        </View>
      )}
      {F.phase === 'finish' && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 70, alignItems: 'center' }}>
          <View style={styles.finishBox}>
            {Object.values(FATALITIES).map((fx) => (
              <Text key={fx.name} style={styles.finishLine}>
                <Text style={{ color: '#ffd23a' }}>{fx.label}</Text>  {fx.name}
              </Text>
            ))}
            <View style={{ width: '100%', height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 4 }}>
              <View style={{ width: `${finishFrac * 100}%`, height: '100%', borderRadius: 3, backgroundColor: '#ff3a3a' }} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4, textShadowOffset: { width: 1, height: 2 } };
const styles = StyleSheet.create({
  name: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1, marginBottom: 2, ...shadow },
  timerBox: { minWidth: 62, paddingHorizontal: 8, borderRadius: 8, backgroundColor: 'rgba(10,6,30,0.8)', borderWidth: 3, borderColor: '#ffd23a', alignItems: 'center' },
  timer: { color: '#ffd23a', fontWeight: '900', fontSize: 30, ...shadow },
  rnd: { color: '#fff', fontWeight: '800', fontSize: 10, letterSpacing: 1, marginTop: 2, ...shadow },
  cds: { fontSize: 14, marginTop: 2 },
  banner: { color: '#ffd23a', fontWeight: '900', letterSpacing: 2, textAlign: 'center', textShadowColor: '#7a1a00', textShadowRadius: 8, textShadowOffset: { width: 3, height: 4 } },
  finishBox: { backgroundColor: 'rgba(10,5,25,0.78)', borderWidth: 2, borderColor: '#ff3a3a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5, minWidth: 300 },
  finishLine: { color: '#fff', fontWeight: '800', fontSize: 11, ...shadow },
});

import React from 'react';
import { View, Text } from 'react-native';

const c = {
  skin: '#f1c27d',
  beard: '#a8541a',
  hat: '#e8c35a',
  hatBand: '#8b3a1a',
  shirt: '#c0392b',
  denim: '#2e5aa8',
  boot: '#4a2c14',
};

export function Billy({ p, ts }) {
  const w = p.w * ts;
  const h = p.h * ts;
  const stride = Math.floor(p.run * 2.2) % 2 === 0 ? 1 : -1;
  const blink = p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0;
  const legSwing = p.onGround ? (p.run > 0 ? stride * 0.06 * ts : 0) : 0.05 * ts;
  const hatH = h * 0.2;
  const faceH = h * 0.3;
  const bodyH = h * 0.32;
  const legH = h - hatH - faceH - bodyH;
  return (
    <View
      style={{
        position: 'absolute',
        left: p.x * ts,
        top: p.y * ts,
        width: w,
        height: h,
        opacity: blink ? 0.35 : 1,
        transform: [{ scaleX: p.facing }],
      }}
    >
      {p.rush > 0 && (
        <View
          style={{
            position: 'absolute',
            left: -w * 0.5,
            top: -h * 0.25,
            width: w * 2,
            height: h * 1.5,
            borderRadius: w,
            backgroundColor: 'rgba(130,255,90,0.35)',
            borderWidth: 2,
            borderColor: 'rgba(60,200,40,0.8)',
            opacity: p.rush < 1.5 && Math.floor(p.rush * 10) % 2 === 0 ? 0.3 : 1,
          }}
        />
      )}
      {/* straw hat: crown + brim */}
      <View style={{ position: 'absolute', top: 0, left: w * 0.2, width: w * 0.6, height: hatH * 0.8, backgroundColor: c.hat, borderTopLeftRadius: w * 0.3, borderTopRightRadius: w * 0.3 }} />
      <View style={{ position: 'absolute', top: hatH * 0.55, left: -w * 0.08, width: w * 1.16, height: hatH * 0.45, backgroundColor: c.hat, borderRadius: hatH * 0.3, borderBottomWidth: 2, borderColor: c.hatBand }} />
      {/* face */}
      <View style={{ position: 'absolute', top: hatH, left: w * 0.12, width: w * 0.76, height: faceH, backgroundColor: c.skin, borderRadius: w * 0.15 }}>
        <View style={{ position: 'absolute', top: faceH * 0.25, left: w * 0.5, width: Math.max(2, w * 0.1), height: Math.max(3, faceH * 0.22), backgroundColor: '#222', borderRadius: 2 }} />
        <View style={{ position: 'absolute', bottom: -faceH * 0.1, left: -w * 0.04, width: w * 0.84, height: faceH * 0.55, backgroundColor: c.beard, borderBottomLeftRadius: w * 0.3, borderBottomRightRadius: w * 0.3 }} />
      </View>
      {/* flannel + overalls */}
      <View style={{ position: 'absolute', top: hatH + faceH, left: w * 0.06, width: w * 0.88, height: bodyH, backgroundColor: c.shirt, borderRadius: 3 }}>
        <View style={{ position: 'absolute', top: 0, left: w * 0.14, width: w * 0.6, height: bodyH, backgroundColor: c.denim }} />
        <View style={{ position: 'absolute', top: bodyH * 0.35, left: w * 0.32, width: w * 0.16, height: w * 0.16, backgroundColor: '#f6d55c', borderRadius: 2 }} />
      </View>
      <View style={{ position: 'absolute', top: hatH + faceH + bodyH, left: w * 0.14, width: w * 0.72, height: legH, backgroundColor: c.denim }} />
      <View style={{ position: 'absolute', bottom: 0, left: w * 0.08 + legSwing, width: w * 0.36, height: legH * 0.5, backgroundColor: c.boot, borderRadius: 3 }} />
      <View style={{ position: 'absolute', bottom: 0, left: w * 0.56 - legSwing, width: w * 0.36, height: legH * 0.5, backgroundColor: c.boot, borderRadius: 3 }} />
    </View>
  );
}

const EMOJI = { chicken: '🐔', raccoon: '🦝', skunk: '🦨', hound: '🐕', turkey: '🦃', bee: '🐝' };

export function Critter({ e, ts }) {
  const size = ts * (e.kind === 'bee' ? 0.6 : e.kind === 'turkey' ? 1.0 : 0.85);
  const winding = e.kind === 'turkey' && e.state === 'wind';
  const shake = winding ? Math.sin(e.t * 60) * ts * 0.06 : 0;
  const hurt = e.hit > 0;
  const flip = e.kind === 'bee' ? (e.dir > 0 ? 1 : -1) : e.dir > 0 ? -1 : 1;
  const transform = e.alive
    ? [{ translateX: shake }, { scaleX: flip }, { scaleY: e.kind === 'turkey' && e.state === 'dash' ? 0.9 : 1 }]
    : e.squished
    ? [{ scaleY: 0.25 }, { scaleX: flip }]
    : [{ rotate: `${Math.min(e.squish * 540, 180)}deg` }, { scaleX: flip }];
  return (
    <View
      style={{
        position: 'absolute',
        left: e.x * ts,
        top: e.y * ts,
        width: e.w * ts,
        height: e.h * ts,
        alignItems: 'center',
        justifyContent: e.kind === 'bee' ? 'center' : 'flex-end',
        opacity: e.alive ? (hurt && Math.floor(e.hit * 30) % 2 === 0 ? 0.4 : 1) : e.squished ? 1 : Math.max(0, 1 - e.squish * 2),
        transform,
      }}
    >
      <Text style={{ fontSize: size, lineHeight: size * 1.15, includeFontPadding: false }}>{EMOJI[e.kind]}</Text>
      {winding && <Text style={{ position: 'absolute', top: -ts * 0.5, fontSize: ts * 0.5 }}>❗</Text>}
    </View>
  );
}

export function Cob({ c, ts }) {
  const size = ts * 0.55;
  return (
    <Text
      style={{
        position: 'absolute',
        left: c.x * ts - size * 0.25,
        top: c.y * ts - size * 0.3,
        fontSize: size,
        lineHeight: size * 1.15,
        transform: [{ rotate: `${c.age * 900}deg` }],
      }}
    >
      🌽
    </Text>
  );
}

export function Jug({ x, y, ts, t = 0, glow = false }) {
  const bob = Math.sin(t * 4 + x) * ts * 0.06;
  const bw = ts * 0.42;
  return (
    <View
      style={{
        position: 'absolute',
        left: x * ts + (ts - bw) / 2,
        top: y * ts + ts * 0.12 + bob,
        width: bw,
        alignItems: 'center',
        shadowColor: glow ? '#7dff6a' : 'transparent',
        shadowRadius: 8,
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <View style={{ width: ts * 0.1, height: ts * 0.1, backgroundColor: '#d8b179' }} />
      <View style={{ width: ts * 0.16, height: ts * 0.14, backgroundColor: '#8a5a2b' }} />
      <View
        style={{
          width: bw,
          height: ts * 0.5,
          backgroundColor: glow ? '#69c24a' : '#a86a32',
          borderRadius: bw * 0.45,
          borderWidth: 2,
          borderColor: glow ? '#2f7a1f' : '#5c3412',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: ts * 0.16, fontWeight: '900', color: '#f6e3b4' }}>XXX</Text>
      </View>
    </View>
  );
}

export function Tile({ type, x, y, ts }) {
  const base = { position: 'absolute', left: x * ts, top: y * ts, width: ts, height: ts };
  switch (type) {
    case 2: // hay
      return (
        <View style={[base, { backgroundColor: '#e6c04a', borderWidth: 2, borderColor: '#b58a1f' }]}>
          {[0.28, 0.55, 0.8].map((f) => (
            <View key={f} style={{ position: 'absolute', left: 3, right: 3, top: ts * f, height: 2, backgroundColor: '#b58a1f' }} />
          ))}
        </View>
      );
    case 3: // moonshine barrel
    case 4: {
      const used = type === 4;
      const wood = used ? '#5a4a3c' : '#b8742f';
      const plank = used ? '#46382c' : '#8a5220';
      const iron = used ? '#5d6166' : '#3d4a56';
      return (
        <View style={[base, { backgroundColor: wood, borderWidth: 2, borderColor: plank, borderRadius: ts * 0.22, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }]}>
          {[0.33, 0.66].map((f) => (
            <View key={f} style={{ position: 'absolute', top: 0, bottom: 0, left: ts * f - 1, width: 2, backgroundColor: plank }} />
          ))}
          <View style={{ position: 'absolute', left: 0, right: 0, top: ts * 0.14, height: ts * 0.1, backgroundColor: iron }} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: ts * 0.14, height: ts * 0.1, backgroundColor: iron }} />
          {used ? (
            <View style={{ width: ts * 0.3, height: ts * 0.18, borderRadius: ts * 0.1, backgroundColor: '#1d150e' }} />
          ) : (
            <View style={{ paddingHorizontal: ts * 0.07, backgroundColor: '#f1dfb0', borderRadius: 3, transform: [{ rotate: '-4deg' }] }}>
              <Text style={{ fontSize: ts * 0.26, lineHeight: ts * 0.3, fontWeight: '900', color: '#7a2a10', letterSpacing: 1 }}>XXX</Text>
            </View>
          )}
        </View>
      );
    }
    case 5: // stump
      return (
        <View style={[base, { backgroundColor: '#7a4a24', borderWidth: 2, borderColor: '#4b2a10', borderRadius: 4 }]}>
          <View style={{ position: 'absolute', left: ts * 0.2, top: ts * 0.2, width: ts * 0.6, height: ts * 0.6, borderRadius: ts * 0.3, borderWidth: 2, borderColor: '#a87040' }} />
        </View>
      );
    default:
      return null;
  }
}

export function Ground({ x0, x1, y, rows, ts }) {
  const w = (x1 - x0) * ts;
  return (
    <View style={{ position: 'absolute', left: x0 * ts, top: y * ts, width: w, height: rows * ts, backgroundColor: '#8a5a33' }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ts * 0.3, backgroundColor: '#5fa93a', borderBottomWidth: 3, borderColor: '#3e7a22' }} />
      <View style={{ position: 'absolute', top: ts * 1.2, left: 0, right: 0, height: 2, backgroundColor: '#74482a' }} />
    </View>
  );
}

export function Emoji({ ch, x, y, size, ts, flip }) {
  return (
    <Text
      style={{
        position: 'absolute',
        left: x * ts,
        top: y * ts,
        fontSize: size * ts,
        lineHeight: size * ts * 1.15,
        transform: flip ? [{ scaleX: -1 }] : undefined,
      }}
    >
      {ch}
    </Text>
  );
}

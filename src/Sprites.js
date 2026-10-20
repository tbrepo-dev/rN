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
  steel: '#a9b4c2',
  steelDark: '#5b6675',
  glow: '#6dff7a',
};

// ---------------------------------------------------------------------------
// Billy, with whatever gear he has picked up
export function Billy({ p, ts, gear = {} }) {
  const w = p.w * ts;
  const h = p.h * ts;
  const stride = Math.floor(p.run * 2.2) % 2 === 0 ? 1 : -1;
  const blink = p.invuln > 0 && Math.floor(p.invuln * 14) % 2 === 0;
  const legSwing = p.onGround ? (p.run > 0 ? stride * 0.06 * ts : 0) : 0.05 * ts;
  const hatH = h * 0.2;
  const faceH = h * 0.3;
  const bodyH = h * 0.32;
  const legH = h - hatH - faceH - bodyH;
  const helm = gear.knightHelm;
  const plate = gear.plate;
  const slashing = p.slash > 0;
  const swing = slashing ? 1 - p.slash / 0.28 : 0; // 0 -> 1 across the swing
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
      {/* sword sheathed across the back */}
      {gear.sword && !slashing && (
        <View style={{ position: 'absolute', left: -w * 0.18, top: h * 0.3, width: Math.max(3, w * 0.1), height: h * 0.75, backgroundColor: '#d5dde8', borderRadius: 2, transform: [{ rotate: '-28deg' }] }}>
          <View style={{ position: 'absolute', bottom: 0, left: -w * 0.07, width: w * 0.24, height: Math.max(3, h * 0.05), backgroundColor: '#d9a21b' }} />
        </View>
      )}
      {/* straw hat (hidden under a helm) */}
      {!helm && (
        <>
          <View style={{ position: 'absolute', top: 0, left: w * 0.2, width: w * 0.6, height: hatH * 0.8, backgroundColor: c.hat, borderTopLeftRadius: w * 0.3, borderTopRightRadius: w * 0.3 }} />
          <View style={{ position: 'absolute', top: hatH * 0.55, left: -w * 0.08, width: w * 1.16, height: hatH * 0.45, backgroundColor: c.hat, borderRadius: hatH * 0.3, borderBottomWidth: 2, borderColor: c.hatBand }} />
        </>
      )}
      {/* face */}
      <View style={{ position: 'absolute', top: hatH, left: w * 0.12, width: w * 0.76, height: faceH, backgroundColor: c.skin, borderRadius: w * 0.15 }}>
        <View style={{ position: 'absolute', top: faceH * 0.25, left: w * 0.5, width: Math.max(2, w * 0.1), height: Math.max(3, faceH * 0.22), backgroundColor: '#222', borderRadius: 2 }} />
        <View style={{ position: 'absolute', bottom: -faceH * 0.1, left: -w * 0.04, width: w * 0.84, height: faceH * 0.55, backgroundColor: c.beard, borderBottomLeftRadius: w * 0.3, borderBottomRightRadius: w * 0.3 }} />
      </View>
      {/* knight-alien helm: steel with a glowing visor, a red plume and a little antenna */}
      {helm && (
        <>
          <View style={{ position: 'absolute', top: -hatH * 0.15, left: w * 0.06, width: w * 0.88, height: hatH + faceH * 0.55, backgroundColor: c.steel, borderTopLeftRadius: w * 0.45, borderTopRightRadius: w * 0.45, borderWidth: 2, borderColor: c.steelDark }} />
          <View style={{ position: 'absolute', top: hatH * 0.9, left: w * 0.34, width: w * 0.6, height: Math.max(3, faceH * 0.22), backgroundColor: '#0f2a14', borderRadius: 2, borderBottomWidth: 2, borderColor: c.glow }} />
          <View style={{ position: 'absolute', top: -hatH * 0.75, left: w * 0.12, width: w * 0.18, height: hatH * 0.9, backgroundColor: '#c8352b', borderRadius: 4, transform: [{ rotate: '-20deg' }] }} />
          <View style={{ position: 'absolute', top: -hatH * 1.05, left: w * 0.62, width: 2, height: hatH * 0.9, backgroundColor: c.glow }} />
          <View style={{ position: 'absolute', top: -hatH * 1.35, left: w * 0.62 - 3, width: 8, height: 8, borderRadius: 4, backgroundColor: c.glow }} />
        </>
      )}
      {/* alien antenna helmet: a glass dome with an antenna over the hat */}
      {gear.antenna && !helm && (
        <>
          <View style={{ position: 'absolute', top: -hatH * 0.45, left: w * 0.02, width: w * 0.96, height: hatH * 2.1, borderRadius: w * 0.5, backgroundColor: 'rgba(140,255,200,0.22)', borderWidth: 2, borderColor: 'rgba(120,255,190,0.85)' }} />
          <View style={{ position: 'absolute', top: -hatH * 1.25, left: w * 0.48, width: 2, height: hatH * 0.9, backgroundColor: '#8fe9c0' }} />
          <View style={{ position: 'absolute', top: -hatH * 1.6, left: w * 0.48 - 3, width: 8, height: 8, borderRadius: 4, backgroundColor: c.glow }} />
        </>
      )}
      {/* flannel + overalls */}
      <View style={{ position: 'absolute', top: hatH + faceH, left: w * 0.06, width: w * 0.88, height: bodyH, backgroundColor: c.shirt, borderRadius: 3 }}>
        <View style={{ position: 'absolute', top: 0, left: w * 0.14, width: w * 0.6, height: bodyH, backgroundColor: c.denim }} />
        <View style={{ position: 'absolute', top: bodyH * 0.35, left: w * 0.32, width: w * 0.16, height: w * 0.16, backgroundColor: '#f6d55c', borderRadius: 2 }} />
        {/* alien vest */}
        {gear.vest && !plate && (
          <View style={{ position: 'absolute', top: -1, left: w * 0.02, width: w * 0.84, height: bodyH + 2, backgroundColor: '#3b2f7a', borderRadius: 4, borderWidth: 2, borderColor: '#8cf3d1', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: w * 0.22, height: w * 0.22, borderRadius: w * 0.11, backgroundColor: c.glow }} />
          </View>
        )}
        {/* knight-alien plate armor with pauldrons */}
        {plate && (
          <>
            <View style={{ position: 'absolute', top: -1, left: w * 0.0, width: w * 0.88, height: bodyH + 2, backgroundColor: c.steel, borderRadius: 4, borderWidth: 2, borderColor: c.steelDark, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: w * 0.24, height: w * 0.24, borderRadius: w * 0.12, backgroundColor: c.glow, borderWidth: 2, borderColor: '#2d7a37' }} />
            </View>
            <View style={{ position: 'absolute', top: -3, left: -w * 0.1, width: w * 0.3, height: bodyH * 0.45, backgroundColor: c.steelDark, borderRadius: 5 }} />
            <View style={{ position: 'absolute', top: -3, right: -w * 0.1, width: w * 0.3, height: bodyH * 0.45, backgroundColor: c.steelDark, borderRadius: 5 }} />
          </>
        )}
      </View>
      <View style={{ position: 'absolute', top: hatH + faceH + bodyH, left: w * 0.14, width: w * 0.72, height: legH, backgroundColor: plate ? c.steelDark : c.denim }} />
      <View style={{ position: 'absolute', bottom: 0, left: w * 0.08 + legSwing, width: w * 0.36, height: legH * 0.5, backgroundColor: plate ? '#3b4452' : c.boot, borderRadius: 3 }} />
      <View style={{ position: 'absolute', bottom: 0, left: w * 0.56 - legSwing, width: w * 0.36, height: legH * 0.5, backgroundColor: plate ? '#3b4452' : c.boot, borderRadius: 3 }} />
      {/* ray gun in hand */}
      {gear.raygun && !slashing && (
        <View style={{ position: 'absolute', top: hatH + faceH + bodyH * 0.35, left: w * 0.62, width: w * 0.78, height: Math.max(6, h * 0.14) }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: w * 0.5, height: '100%', backgroundColor: '#c9d3df', borderRadius: 3, borderWidth: 1, borderColor: '#5b6675' }} />
          <View style={{ position: 'absolute', left: w * 0.45, top: '25%', width: w * 0.33, height: '50%', backgroundColor: '#58e07a', borderRadius: 3 }} />
          <View style={{ position: 'absolute', left: w * 0.1, top: '100%', width: w * 0.14, height: h * 0.1, backgroundColor: '#5b6675' }} />
        </View>
      )}
      {/* sword swing */}
      {slashing && (
        <>
          <View
            style={{
              position: 'absolute',
              top: hatH + faceH * 0.2,
              left: w * 0.75,
              width: ts * 1.15,
              height: Math.max(5, h * 0.1),
              backgroundColor: '#e8eef6',
              borderRadius: 3,
              borderWidth: 1,
              borderColor: '#8996a6',
              transformOrigin: 'left center',
              transform: [{ rotate: `${-95 + swing * 150}deg` }],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: -h * 0.1,
              left: w * 0.5,
              width: ts * 1.35,
              height: h * 1.25,
              borderTopRightRadius: ts * 1.4,
              borderBottomRightRadius: ts * 1.4,
              borderWidth: 3,
              borderLeftWidth: 0,
              borderColor: `rgba(220,245,255,${0.9 - swing * 0.7})`,
            }}
          />
        </>
      )}
      {/* shield: raised in front while blocking, slung on the back otherwise */}
      {gear.shield && (
        <View
          style={{
            position: 'absolute',
            top: p.shielding ? hatH * 0.6 : hatH + faceH * 0.9,
            left: p.shielding ? w * 0.7 : -w * 0.32,
            width: ts * (p.shielding ? 0.5 : 0.36),
            height: ts * (p.shielding ? 0.95 : 0.56),
            backgroundColor: '#8c98aa',
            borderRadius: ts * 0.2,
            borderBottomLeftRadius: ts * 0.45,
            borderBottomRightRadius: ts * 0.45,
            borderWidth: 3,
            borderColor: '#4a5563',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: ts * 0.18, height: ts * 0.18, borderRadius: ts * 0.09, backgroundColor: c.glow, borderWidth: 2, borderColor: '#2d7a37' }} />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Critters
const EMOJI = {
  chicken: '🐔', raccoon: '🦝', skunk: '🦨', hound: '🐕', turkey: '🦃', bee: '🐝',
  alien: '👽', hopper: '👾', tentacle: '🐙', ufo: '🛸', drone: '🛰️',
  goblin: '👺', skeleton: '💀', troll: '🧌', witch: '🧙‍♀️', bat: '🦇', boss: '🧙‍♀️',
};
const SCALE = { bee: 0.6, drone: 0.6, bat: 0.65, turkey: 1.0, troll: 1.2, ufo: 1.1, boss: 1.8, witch: 1.0, tentacle: 0.95 };
const FLYERS = { bee: 1, drone: 1, bat: 1, ufo: 1 };

export function Critter({ e, ts }) {
  const size = ts * (SCALE[e.kind] ?? 0.85);
  const charging = (e.kind === 'turkey' || e.kind === 'troll') && e.state === 'wind';
  const shake = charging ? Math.sin(e.t * 60) * ts * 0.06 : 0;
  const warn = e.warn || charging;
  const hurt = e.hit > 0;
  const flip = FLYERS[e.kind] ? (e.dir > 0 ? 1 : -1) : e.dir > 0 ? -1 : 1;
  const transform = e.alive
    ? [{ translateX: shake }, { scaleX: flip }, { scaleY: (e.kind === 'turkey' || e.kind === 'troll') && e.state === 'dash' ? 0.9 : 1 }]
    : e.squished
    ? [{ scaleY: 0.25 }, { scaleX: flip }]
    : [{ rotate: `${Math.min(e.squish * 540, 180)}deg` }, { scaleX: flip }];
  const iflash = e.iframes > 0 && Math.floor(e.iframes * 20) % 2 === 0;
  return (
    <View
      style={{
        position: 'absolute',
        left: e.x * ts,
        top: e.y * ts,
        width: e.w * ts,
        height: e.h * ts,
        alignItems: 'center',
        justifyContent: FLYERS[e.kind] ? 'center' : 'flex-end',
        opacity: e.alive ? ((hurt || iflash) && Math.floor((e.hit || e.iframes) * 30) % 2 === 0 ? 0.4 : 1) : e.squished ? 1 : Math.max(0, 1 - e.squish * 2),
        transform,
      }}
    >
      {e.kind === 'boss' && <View style={{ position: 'absolute', bottom: 0, width: e.w * ts * 1.5, height: e.h * ts * 0.9, borderRadius: ts, backgroundColor: 'rgba(170,70,255,0.28)' }} />}
      <Text style={{ fontSize: size, lineHeight: size * 1.15, includeFontPadding: false }}>{EMOJI[e.kind]}</Text>
      {e.kind === 'boss' && <Text style={{ position: 'absolute', top: -ts * 0.55, fontSize: ts * 0.7 }}>👑</Text>}
      {warn && e.alive && <Text style={{ position: 'absolute', top: -ts * (e.kind === 'boss' ? 1.1 : 0.5), fontSize: ts * 0.5 }}>❗</Text>}
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

export function Ray({ r, ts }) {
  return (
    <View
      style={{
        position: 'absolute',
        left: r.x * ts,
        top: r.y * ts,
        width: r.w * ts,
        height: Math.max(4, r.h * ts),
        borderRadius: 4,
        backgroundColor: '#b9ffcb',
        borderWidth: 2,
        borderColor: '#38e05a',
        shadowColor: '#38e05a',
        shadowRadius: 6,
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

// Enemy shots: green plasma from aliens, purple orbs from witches
export function Shot({ s, ts }) {
  const plasma = s.kind === 'plasma';
  const d = s.w * ts;
  return (
    <View
      style={{
        position: 'absolute',
        left: s.x * ts,
        top: s.y * ts,
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: plasma ? '#d4ff7a' : '#e6b3ff',
        borderWidth: 3,
        borderColor: plasma ? '#6bd11f' : '#9a3de0',
        shadowColor: plasma ? '#6bd11f' : '#9a3de0',
        shadowRadius: 8,
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Collectibles
export function Jug({ x, y, ts, t = 0, glow = false, kind = 'jug' }) {
  const bob = Math.sin(t * 4 + x) * ts * 0.06;
  const bw = ts * 0.42;
  if (kind === 'crystal') {
    const d = ts * 0.34;
    return (
      <View
        style={{
          position: 'absolute',
          left: x * ts + (ts - d) / 2,
          top: y * ts + (ts - d) / 2 + bob,
          width: d,
          height: d,
          backgroundColor: '#7dffe0',
          borderWidth: 2,
          borderColor: '#14b38f',
          transform: [{ rotate: '45deg' }, { scale: 1 + Math.sin(t * 5 + x) * 0.06 }],
          shadowColor: '#7dffe0',
          shadowRadius: 7,
          shadowOpacity: 1,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    );
  }
  if (kind === 'coin') {
    const d = ts * 0.4;
    const squeeze = Math.abs(Math.cos(t * 3 + x));
    return (
      <View
        style={{
          position: 'absolute',
          left: x * ts + (ts - d) / 2,
          top: y * ts + (ts - d) / 2 + bob,
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: '#ffd23f',
          borderWidth: 2,
          borderColor: '#b8860b',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scaleX: 0.35 + 0.65 * squeeze }],
        }}
      >
        <View style={{ width: d * 0.4, height: d * 0.4, borderRadius: d * 0.2, borderWidth: 2, borderColor: '#b8860b' }} />
      </View>
    );
  }
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

const GEAR_EMOJI = { raygun: '🔫', antenna: '📡', vest: '🦺', sword: '🗡️', shield: '🛡️', knightHelm: '🪖', plate: '🧥' };
export const gearEmoji = (name) => GEAR_EMOJI[name];

export function GearItem({ it, ts, t }) {
  const bob = Math.sin(t * 5) * ts * 0.05;
  return (
    <View
      style={{
        position: 'absolute',
        left: it.x * ts - ts * 0.05,
        top: it.y * ts - ts * 0.05 + bob,
        width: it.w * ts + ts * 0.1,
        height: it.h * ts + ts * 0.1,
        borderRadius: ts,
        backgroundColor: 'rgba(130,255,120,0.4)',
        borderWidth: 2,
        borderColor: 'rgba(90,230,90,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: ts * 0.6 }}>{GEAR_EMOJI[it.gear]}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Terrain, themed per level
const THEMES = {
  holler: {
    ground: '#8a5a33', top: '#5fa93a', topLine: '#3e7a22', vein: '#74482a',
    hay: { bg: '#e6c04a', line: '#b58a1f' },
    rock: { bg: '#7a4a24', edge: '#4b2a10', ring: '#a87040' },
    box: { bg: '#b8742f', plank: '#8a5220', iron: '#3d4a56', usedBg: '#5a4a3c', usedPlank: '#46382c', usedIron: '#5d6166' },
  },
  alien: {
    ground: '#3b2a63', top: '#34d6b0', topLine: '#12806a', vein: '#2b1d4d',
    hay: { bg: '#5b6b86', line: '#9fb4d6' },
    rock: { bg: '#6a4f9a', edge: '#2d1f52', ring: '#b79ae8' },
    box: { bg: '#2f7d68', plank: '#1c5143', iron: '#7dffe0', usedBg: '#3a3a4a', usedPlank: '#2a2a37', usedIron: '#55556a' },
  },
  medieval: {
    ground: '#6b5b4b', top: '#6a9f3f', topLine: '#44702a', vein: '#574a3c',
    hay: { bg: '#9aa0a6', line: '#6c7278' },
    rock: { bg: '#8a8f96', edge: '#4f545a', ring: '#b9bec4' },
    box: { bg: '#8a5a2b', plank: '#5e3a16', iron: '#d9a21b', usedBg: '#4d4034', usedPlank: '#382d23', usedIron: '#6f6350' },
  },
};

export function Tile({ type, x, y, ts, theme = 'holler' }) {
  const T = THEMES[theme];
  const base = { position: 'absolute', left: x * ts, top: y * ts, width: ts, height: ts };
  switch (type) {
    case 2: // hay / metal panel / stone brick
      if (theme === 'holler') {
        return (
          <View style={[base, { backgroundColor: T.hay.bg, borderWidth: 2, borderColor: T.hay.line }]}>
            {[0.28, 0.55, 0.8].map((f) => (
              <View key={f} style={{ position: 'absolute', left: 3, right: 3, top: ts * f, height: 2, backgroundColor: T.hay.line }} />
            ))}
          </View>
        );
      }
      if (theme === 'alien') {
        return (
          <View style={[base, { backgroundColor: T.hay.bg, borderWidth: 2, borderColor: T.hay.line, borderRadius: 4 }]}>
            <View style={{ position: 'absolute', left: 4, right: 4, top: ts * 0.45, height: 3, backgroundColor: '#7dffe0', borderRadius: 2 }} />
            {[[3, 3], [ts - 8, 3], [3, ts - 8], [ts - 8, ts - 8]].map(([l, t], i) => (
              <View key={i} style={{ position: 'absolute', left: l, top: t, width: 4, height: 4, borderRadius: 2, backgroundColor: '#aab9d4' }} />
            ))}
          </View>
        );
      }
      return (
        <View style={[base, { backgroundColor: T.hay.bg, borderWidth: 2, borderColor: T.hay.line }]}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: ts * 0.48, height: 2, backgroundColor: T.hay.line }} />
          <View style={{ position: 'absolute', left: ts * 0.5, top: 0, width: 2, height: ts * 0.48, backgroundColor: T.hay.line }} />
          <View style={{ position: 'absolute', left: ts * 0.25, top: ts * 0.48, width: 2, height: ts * 0.5, backgroundColor: T.hay.line }} />
        </View>
      );
    case 3: // barrel / alien pod / treasure chest
    case 4: {
      const used = type === 4;
      const wood = used ? T.box.usedBg : T.box.bg;
      const plank = used ? T.box.usedPlank : T.box.plank;
      const iron = used ? T.box.usedIron : T.box.iron;
      if (theme === 'alien') {
        return (
          <View style={[base, { backgroundColor: wood, borderWidth: 2, borderColor: plank, borderRadius: ts * 0.4, alignItems: 'center', justifyContent: 'center' }]}>
            {used ? (
              <View style={{ width: ts * 0.5, height: ts * 0.25, borderRadius: ts * 0.12, backgroundColor: '#14141c' }} />
            ) : (
              <View style={{ width: ts * 0.46, height: ts * 0.46, borderRadius: ts * 0.23, backgroundColor: iron, opacity: 0.85, borderWidth: 2, borderColor: '#14b38f' }} />
            )}
          </View>
        );
      }
      if (theme === 'medieval') {
        return (
          <View style={[base, { backgroundColor: wood, borderWidth: 2, borderColor: plank, borderRadius: 5, overflow: 'hidden' }]}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ts * 0.38, backgroundColor: used ? '#2a2119' : plank, borderBottomWidth: 2, borderColor: iron }} />
            <View style={{ position: 'absolute', left: ts * 0.42, top: ts * 0.3, width: ts * 0.16, height: ts * 0.22, backgroundColor: iron, borderRadius: 2 }} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: ts * 0.12, height: 3, backgroundColor: iron }} />
          </View>
        );
      }
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
    case 5: // stump / boulder / stone pillar
      return (
        <View style={[base, { backgroundColor: T.rock.bg, borderWidth: 2, borderColor: T.rock.edge, borderRadius: theme === 'medieval' ? 2 : theme === 'alien' ? ts * 0.35 : 4 }]}>
          {theme === 'medieval' ? (
            <View style={{ position: 'absolute', left: 3, right: 3, top: ts * 0.45, height: 2, backgroundColor: T.rock.ring }} />
          ) : (
            <View style={{ position: 'absolute', left: ts * 0.2, top: ts * 0.2, width: ts * 0.6, height: ts * 0.6, borderRadius: ts * 0.3, borderWidth: 2, borderColor: T.rock.ring }} />
          )}
        </View>
      );
    default:
      return null;
  }
}

export function Ground({ x0, x1, y, rows, ts, theme = 'holler' }) {
  const T = THEMES[theme];
  const w = (x1 - x0) * ts;
  return (
    <View style={{ position: 'absolute', left: x0 * ts, top: y * ts, width: w, height: rows * ts, backgroundColor: T.ground }}>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: ts * 0.3, backgroundColor: T.top, borderBottomWidth: 3, borderColor: T.topLine }} />
      <View style={{ position: 'absolute', top: ts * 1.2, left: 0, right: 0, height: 2, backgroundColor: T.vein }} />
    </View>
  );
}

export function Emoji({ ch, x, y, size, ts, flip, style }) {
  return (
    <Text
      style={[
        {
          position: 'absolute',
          left: x * ts,
          top: y * ts,
          fontSize: size * ts,
          lineHeight: size * ts * 1.15,
          transform: flip ? [{ scaleX: -1 }] : undefined,
        },
        style,
      ]}
    >
      {ch}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// Level exits
export function Booth({ x, y, ts, ready, t }) {
  const w = ts * 1.3;
  const h = ts * 2.6;
  return (
    <View style={{ position: 'absolute', left: x * ts, top: y * ts, width: w, height: h }}>
      {ready && <View style={{ position: 'absolute', left: -ts * 0.4, top: -ts * 0.3, width: w + ts * 0.8, height: h + ts * 0.5, borderRadius: ts, backgroundColor: 'rgba(125,255,224,0.28)', opacity: 0.6 + 0.4 * Math.sin(t * 6) }} />}
      <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: ts * 0.35, backgroundColor: '#1f4aa0', borderRadius: 4, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: ts * 0.2, fontWeight: '900', color: ready ? '#7dffe0' : '#9bb7e8', letterSpacing: 2 }}>TIME</Text>
      </View>
      <View style={{ position: 'absolute', left: ts * 0.08, top: ts * 0.35, width: w - ts * 0.16, height: h - ts * 0.35, backgroundColor: '#2a5db0', borderWidth: 3, borderColor: '#1f4aa0' }}>
        {[0, 1, 2].map((r) => (
          <View key={r} style={{ flexDirection: 'row', gap: 3, padding: 3, paddingBottom: 0 }}>
            {[0, 1].map((cc) => (
              <View key={cc} style={{ flex: 1, height: ts * 0.55, backgroundColor: ready ? '#bffcf0' : '#a8c8f0', borderWidth: 2, borderColor: '#1f4aa0' }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

export function CastleGate({ x, y, ts, open }) {
  return (
    <View style={{ position: 'absolute', left: x * ts, top: y * ts }}>
      <Text style={{ position: 'absolute', left: -ts * 2.2, top: -ts * 2.6, fontSize: ts * 5, lineHeight: ts * 5.6, opacity: 0.95 }}>🏰</Text>
      <View style={{ position: 'absolute', left: ts * 0.1, top: ts * 0.1, width: ts * 1.8, height: ts * 2.3, backgroundColor: open ? '#140f0b' : '#3a2a1a', borderTopLeftRadius: ts * 0.9, borderTopRightRadius: ts * 0.9, borderWidth: 3, borderColor: '#4f545a', overflow: 'hidden' }}>
        {!open && [0.2, 0.45, 0.7].map((f) => <View key={f} style={{ position: 'absolute', top: 0, bottom: 0, left: ts * 1.8 * f, width: 4, backgroundColor: '#6b5b4b' }} />)}
        {!open && <View style={{ position: 'absolute', left: 0, right: 0, top: ts * 0.9, height: 4, backgroundColor: '#6b5b4b' }} />}
      </View>
    </View>
  );
}

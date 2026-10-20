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
  ninja: '🐈‍⬛', samurai: '🐱', crow: '🐦', max: '🐈',
};
const SCALE = { bee: 0.6, drone: 0.6, bat: 0.65, turkey: 1.0, troll: 1.2, ufo: 1.1, boss: 1.8, witch: 1.0, tentacle: 0.95, ninja: 0.85, samurai: 0.95, crow: 0.65, max: 2.6 };
const FLYERS = { bee: 1, drone: 1, bat: 1, ufo: 1, crow: 1 };

export function Critter({ e, ts }) {
  if (e.kind === 'honkey') return <Honkey e={e} ts={ts} />;
  if (e.kind === 'barrel') return <RollingBarrel e={e} ts={ts} />;
  const size = ts * (SCALE[e.kind] ?? 0.85);
  const charging = (e.kind === 'turkey' || e.kind === 'troll' || e.kind === 'samurai' || e.kind === 'max') && e.state === 'wind';
  const shake = charging ? Math.sin(e.t * 60) * ts * 0.06 : 0;
  const warn = e.warn || charging;
  const hurt = e.hit > 0;
  const flip = FLYERS[e.kind] ? (e.dir > 0 ? 1 : -1) : e.dir > 0 ? -1 : 1;
  const transform = e.alive
    ? [{ translateX: shake }, { scaleX: flip }, { scaleY: ((e.kind === 'turkey' || e.kind === 'troll') && e.state === 'dash') || (e.kind === 'max' && e.state === 'wind') ? 0.88 : 1 }]
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
      {e.kind === 'max' ? (
        <MaxCat W={e.w * ts} H={e.h * ts} state={e.state} />
      ) : (
        <Text style={{ fontSize: size, lineHeight: size * 1.15, includeFontPadding: false }}>{EMOJI[e.kind]}</Text>
      )}
      {e.kind === 'ninja' && (
        <>
          <View style={{ position: 'absolute', top: e.h * ts * 0.18, left: e.w * ts * 0.12, width: e.w * ts * 0.76, height: Math.max(3, ts * 0.1), backgroundColor: '#d92b2b' }} />
          <View style={{ position: 'absolute', top: e.h * ts * 0.2, left: -e.w * ts * 0.25, width: e.w * ts * 0.4, height: Math.max(2, ts * 0.06), backgroundColor: '#d92b2b', transform: [{ rotate: '-15deg' }] }} />
        </>
      )}
      {e.kind === 'samurai' && (
        <>
          <View style={{ position: 'absolute', top: -ts * 0.1, left: e.w * ts * 0.1, width: e.w * ts * 0.8, height: ts * 0.3, backgroundColor: '#b3262b', borderTopLeftRadius: ts * 0.4, borderTopRightRadius: ts * 0.4, borderBottomWidth: 3, borderColor: '#e0b030' }} />
          <View style={{ position: 'absolute', top: -ts * 0.3, left: e.w * ts * 0.42, width: Math.max(3, ts * 0.12), height: ts * 0.3, backgroundColor: '#e0b030', transform: [{ rotate: '8deg' }] }} />
          <View style={{ position: 'absolute', bottom: ts * 0.1, left: -ts * 0.15, width: ts * 0.9, height: Math.max(3, ts * 0.07), backgroundColor: '#e8eef6', transform: [{ rotate: e.state === 'dash' ? '-5deg' : '-40deg' }] }} />
        </>
      )}
      {e.kind === 'max' && e.state === 'rest' && <Text style={{ position: 'absolute', top: -ts * 0.2, right: -ts * 0.2, fontSize: ts * 0.8 }}>💨</Text>}
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
  if (s.kind === 'star') {
    const d = s.w * ts * 1.5;
    const spin = `${s.life * 1500}deg`;
    return (
      <View style={{ position: 'absolute', left: s.x * ts - d * 0.2, top: s.y * ts - d * 0.2, width: d, height: d }}>
        {[0, 45].map((a) => (
          <View key={a} style={{ position: 'absolute', left: d * 0.12, top: d * 0.12, width: d * 0.76, height: d * 0.76, backgroundColor: '#cfd6de', borderWidth: 2, borderColor: '#2b3340', transform: [{ rotate: `${a}deg` }, { rotate: spin }] }} />
        ))}
      </View>
    );
  }
  if (s.kind === 'wave') {
    return <View style={{ position: 'absolute', left: s.x * ts, top: s.y * ts, width: s.w * ts, height: s.h * ts, borderTopLeftRadius: s.w * ts, borderTopRightRadius: s.w * ts, backgroundColor: 'rgba(255,176,60,0.85)', borderWidth: 3, borderColor: '#d9701c' }} />;
  }
  if (s.kind === 'hair') {
    const d = s.w * ts * 1.3;
    return <View style={{ position: 'absolute', left: s.x * ts, top: s.y * ts, width: d, height: d, borderRadius: d / 2, backgroundColor: '#8a6a4a', borderWidth: 3, borderColor: '#4a3a2a' }} />;
  }
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
  if (kind === 'fish') {
    return (
      <Text style={{ position: 'absolute', left: x * ts + ts * 0.1, top: y * ts + ts * 0.1 + bob, fontSize: ts * 0.6, transform: [{ rotate: `${Math.sin(t * 3 + x) * 12}deg` }] }}>🐟</Text>
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
  tower: {
    ground: '#3b3050', top: '#7d6aa8', topLine: '#4a3d70', vein: '#2d2440',
    hay: { bg: '#c0392b', line: '#7a1f17' },
    rock: { bg: '#5a4a7a', edge: '#2d2440', ring: '#8a7ab0' },
    box: { bg: '#5a4a7a', plank: '#2d2440', iron: '#8a7ab0', usedBg: '#3a3a4a', usedPlank: '#2a2a37', usedIron: '#55556a' },
  },
  japan: {
    ground: '#7a5a3c', top: '#c9a06a', topLine: '#8f6b3a', vein: '#5f452c',
    hay: { bg: '#8c2f2a', line: '#e0b030' },
    rock: { bg: '#9a9fa6', edge: '#555a61', ring: '#f2d66b' },
    box: { bg: '#b3262b', plank: '#701419', iron: '#e0b030', usedBg: '#4d3f3a', usedPlank: '#382d29', usedIron: '#6f6350' },
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
      if (theme === 'tower') {
        // red steel girder with rivets and a cross brace
        return (
          <View style={[base, { backgroundColor: T.hay.bg, borderWidth: 2, borderColor: T.hay.line, overflow: 'hidden' }]}>
            <View style={{ position: 'absolute', left: -ts * 0.1, top: ts * 0.44, width: ts * 1.3, height: 3, backgroundColor: T.hay.line, transform: [{ rotate: '45deg' }] }} />
            <View style={{ position: 'absolute', left: -ts * 0.1, top: ts * 0.44, width: ts * 1.3, height: 3, backgroundColor: T.hay.line, transform: [{ rotate: '-45deg' }] }} />
            {[4, ts - 9].map((l) => (
              <View key={l} style={{ position: 'absolute', left: l, top: 4, width: 5, height: 5, borderRadius: 3, backgroundColor: '#f0c4b8' }} />
            ))}
          </View>
        );
      }
      if (theme === 'japan') {
        // lacquered roof beam with gold trim
        return (
          <View style={[base, { backgroundColor: T.hay.bg, borderWidth: 2, borderColor: T.hay.line, borderRadius: 3 }]}>
            {[0.3, 0.6].map((f) => (
              <View key={f} style={{ position: 'absolute', left: 3, right: 3, top: ts * f, height: 3, backgroundColor: '#5c1814' }} />
            ))}
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: T.hay.line }} />
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
      if (theme === 'japan') {
        // lacquered offering box with a gold band and a lucky coin mark
        return (
          <View style={[base, { backgroundColor: wood, borderWidth: 2, borderColor: plank, borderRadius: 4, alignItems: 'center', justifyContent: 'center' }]}>
            <View style={{ position: 'absolute', left: 0, right: 0, top: ts * 0.12, height: ts * 0.1, backgroundColor: iron }} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: ts * 0.12, height: ts * 0.1, backgroundColor: iron }} />
            {used ? (
              <View style={{ width: ts * 0.3, height: ts * 0.18, borderRadius: ts * 0.1, backgroundColor: '#1d150e' }} />
            ) : (
              <View style={{ width: ts * 0.34, height: ts * 0.34, borderRadius: ts * 0.17, backgroundColor: iron, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: ts * 0.12, height: ts * 0.12, backgroundColor: wood }} />
              </View>
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
        <View style={[base, { backgroundColor: T.rock.bg, borderWidth: 2, borderColor: T.rock.edge, borderRadius: theme === 'medieval' || theme === 'japan' ? 2 : theme === 'alien' ? ts * 0.35 : 4 }]}>
          {theme === 'japan' ? (
            <View style={{ position: 'absolute', left: ts * 0.3, top: ts * 0.3, width: ts * 0.4, height: ts * 0.4, backgroundColor: T.rock.ring, borderWidth: 2, borderColor: T.rock.edge }} />
          ) : theme === 'medieval' ? (
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

export function OneUp({ x, y, ts, t = 0 }) {
  const bob = Math.sin(t * 4 + x) * ts * 0.08;
  const d = ts * 0.78;
  return (
    <View
      style={{
        position: 'absolute',
        left: x * ts + (ts - d) / 2,
        top: y * ts + (ts - d) / 2 + bob,
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: '#7dff6a',
        borderWidth: 3,
        borderColor: '#1f9d2e',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#7dff6a',
        shadowRadius: 9,
        shadowOpacity: 1,
        shadowOffset: { width: 0, height: 0 },
      }}
    >
      <Text style={{ fontSize: ts * 0.34, lineHeight: ts * 0.4 }}>🤠</Text>
      <Text style={{ fontSize: ts * 0.2, fontWeight: '900', color: '#0b4d14', lineHeight: ts * 0.22 }}>1UP</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Honkey Kong: a big albino ape in overalls who rolls barrels at you
export function Honkey({ e, ts }) {
  const W = e.w * ts;
  const H = e.h * ts;
  const fur = '#f6f3ee';
  const shade = '#d9d3c8';
  const throwing = e.arm > 0;
  const lifting = e.warn;
  return (
    <View style={{ position: 'absolute', left: e.x * ts, top: e.y * ts, width: W, height: H }}>
      {/* legs + boots */}
      <View style={{ position: 'absolute', bottom: 0, left: W * 0.2, width: W * 0.24, height: H * 0.3, backgroundColor: '#2f5fb8', borderRadius: 6 }} />
      <View style={{ position: 'absolute', bottom: 0, left: W * 0.56, width: W * 0.24, height: H * 0.3, backgroundColor: '#2f5fb8', borderRadius: 6 }} />
      <View style={{ position: 'absolute', bottom: 0, left: W * 0.14, width: W * 0.32, height: H * 0.08, backgroundColor: '#3b2a1e', borderRadius: 4 }} />
      <View style={{ position: 'absolute', bottom: 0, left: W * 0.54, width: W * 0.32, height: H * 0.08, backgroundColor: '#3b2a1e', borderRadius: 4 }} />
      {/* arms */}
      <View style={{ position: 'absolute', top: H * 0.36, left: -W * 0.02, width: W * 0.2, height: H * 0.38, backgroundColor: fur, borderRadius: W * 0.1, borderWidth: 2, borderColor: shade }} />
      <View
        style={{
          position: 'absolute',
          top: throwing || lifting ? H * 0.08 : H * 0.36,
          right: throwing || lifting ? -W * 0.02 : -W * 0.02,
          width: W * 0.2,
          height: H * (throwing || lifting ? 0.5 : 0.38),
          backgroundColor: fur,
          borderRadius: W * 0.1,
          borderWidth: 2,
          borderColor: shade,
          transform: [{ rotate: throwing ? '-25deg' : lifting ? '10deg' : '0deg' }],
        }}
      />
      {lifting && <Text style={{ position: 'absolute', top: -H * 0.12, right: -W * 0.12, fontSize: ts * 0.9 }}>🛢️</Text>}
      {/* torso */}
      <View style={{ position: 'absolute', top: H * 0.3, left: W * 0.14, width: W * 0.72, height: H * 0.5, backgroundColor: fur, borderRadius: W * 0.2, borderWidth: 2, borderColor: shade }} />
      {/* overalls: bib, straps, buttons */}
      <View style={{ position: 'absolute', top: H * 0.46, left: W * 0.3, width: W * 0.4, height: H * 0.36, backgroundColor: '#2f5fb8', borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: W * 0.1, borderBottomRightRadius: W * 0.1 }} />
      <View style={{ position: 'absolute', top: H * 0.3, left: W * 0.32, width: W * 0.07, height: H * 0.2, backgroundColor: '#2f5fb8' }} />
      <View style={{ position: 'absolute', top: H * 0.3, left: W * 0.61, width: W * 0.07, height: H * 0.2, backgroundColor: '#2f5fb8' }} />
      <View style={{ position: 'absolute', top: H * 0.5, left: W * 0.33, width: W * 0.06, height: W * 0.06, borderRadius: W * 0.03, backgroundColor: '#f0c53a' }} />
      <View style={{ position: 'absolute', top: H * 0.5, left: W * 0.61, width: W * 0.06, height: W * 0.06, borderRadius: W * 0.03, backgroundColor: '#f0c53a' }} />
      {/* head */}
      <View style={{ position: 'absolute', top: H * 0.02, left: W * 0.24, width: W * 0.52, height: H * 0.34, backgroundColor: fur, borderRadius: W * 0.26, borderWidth: 2, borderColor: shade }} />
      <View style={{ position: 'absolute', top: H * 0.1, left: W * 0.3, width: W * 0.2, height: W * 0.2, borderRadius: W * 0.1, backgroundColor: fur, borderWidth: 2, borderColor: shade }} />
      <View style={{ position: 'absolute', top: H * 0.1, left: W * 0.5, width: W * 0.2, height: W * 0.2, borderRadius: W * 0.1, backgroundColor: fur, borderWidth: 2, borderColor: shade }} />
      <View style={{ position: 'absolute', top: H * 0.13, left: W * 0.32, width: W * 0.36, height: H * 0.2, backgroundColor: '#f2b3a6', borderRadius: W * 0.14 }} />
      {/* angry red eyes + brows, nostrils, mouth */}
      <View style={{ position: 'absolute', top: H * 0.15, left: W * 0.36, width: W * 0.07, height: W * 0.07, borderRadius: W * 0.035, backgroundColor: '#e0262a' }} />
      <View style={{ position: 'absolute', top: H * 0.15, left: W * 0.57, width: W * 0.07, height: W * 0.07, borderRadius: W * 0.035, backgroundColor: '#e0262a' }} />
      <View style={{ position: 'absolute', top: H * 0.12, left: W * 0.34, width: W * 0.12, height: 3, backgroundColor: '#8a7f73', transform: [{ rotate: '18deg' }] }} />
      <View style={{ position: 'absolute', top: H * 0.12, left: W * 0.54, width: W * 0.12, height: 3, backgroundColor: '#8a7f73', transform: [{ rotate: '-18deg' }] }} />
      <View style={{ position: 'absolute', top: H * 0.22, left: W * 0.45, width: W * 0.1, height: throwing ? H * 0.08 : 4, backgroundColor: '#7a1f1f', borderRadius: 3 }} />
      <Text style={{ position: 'absolute', top: -H * 0.12, left: 0, right: 0, textAlign: 'center', fontSize: Math.max(8, ts * 0.28), fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3 }}>HONKEY KONG</Text>
    </View>
  );
}

export function RollingBarrel({ e, ts }) {
  const d = e.w * ts;
  const alive = e.alive;
  return (
    <View
      style={{
        position: 'absolute',
        left: e.x * ts,
        top: e.y * ts,
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: '#a8642a',
        borderWidth: 3,
        borderColor: '#5c3412',
        opacity: alive ? 1 : Math.max(0, 1 - e.squish * 3),
        transform: [{ rotate: `${e.x * 95}deg` }],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: d * 0.22, height: 3, backgroundColor: '#3d4a56' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: d * 0.22, height: 3, backgroundColor: '#3d4a56' }} />
      <View style={{ width: d * 0.3, height: d * 0.3, borderRadius: d * 0.15, borderWidth: 2, borderColor: '#5c3412' }} />
    </View>
  );
}

export function Fridge({ x, y, ts, t }) {
  const w = ts * 1.4;
  const h = ts * 2.3;
  return (
    <View style={{ position: 'absolute', left: x * ts, top: y * ts, width: w, height: h }}>
      <View style={{ position: 'absolute', left: -ts * 0.3, top: -ts * 0.3, width: w + ts * 0.6, height: h + ts * 0.5, borderRadius: ts, backgroundColor: 'rgba(255,230,120,0.3)', opacity: 0.6 + 0.4 * Math.sin(t * 5) }} />
      <View style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, backgroundColor: '#f4f6f8', borderWidth: 3, borderColor: '#aab4be', borderRadius: 8 }}>
        <View style={{ position: 'absolute', left: 0, right: 0, top: h * 0.34, height: 3, backgroundColor: '#aab4be' }} />
        <View style={{ position: 'absolute', right: w * 0.1, top: h * 0.1, width: 5, height: h * 0.18, backgroundColor: '#8794a1', borderRadius: 3 }} />
        <View style={{ position: 'absolute', right: w * 0.1, top: h * 0.42, width: 5, height: h * 0.24, backgroundColor: '#8794a1', borderRadius: 3 }} />
        <Text style={{ position: 'absolute', left: w * 0.12, top: h * 0.12, fontSize: ts * 0.4 }}>🍺</Text>
        <View style={{ position: 'absolute', left: w * 0.12, top: h * 0.55, width: w * 0.34, height: w * 0.34, backgroundColor: '#ffe45e', transform: [{ rotate: '-6deg' }] }} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Cast for cutscenes
const FAKE_P = { x: 0, y: 0, w: 0.7, h: 0.95, facing: 1, onGround: true, run: 0, invuln: 0, rush: 0, slash: 0, shielding: false };

// Jinxy: a small, dark-grey Russian Blue with big cheekbones, vivid green eyes and a mob boss's fur hat
export function Jinxy({ size }) {
  const S = size;
  const fur = '#565e69';
  const dark = '#3d444d';
  const sheen = '#7a8695'; // the silvery sheen of a Russian Blue, strongest on the cheeks
  return (
    <View style={{ width: S * 0.9, height: S * 0.9 }}>
      {/* tail, curled up behind */}
      <View style={{ position: 'absolute', left: S * 0.64, top: S * 0.52, width: S * 0.3, height: S * 0.1, borderRadius: S * 0.05, backgroundColor: fur, transform: [{ rotate: '-35deg' }] }} />
      <View style={{ position: 'absolute', left: S * 0.84, top: S * 0.36, width: S * 0.1, height: S * 0.1, borderRadius: S * 0.05, backgroundColor: dark }} />
      {/* compact body, lighter chest, little paws */}
      <View style={{ position: 'absolute', left: S * 0.2, top: S * 0.52, width: S * 0.48, height: S * 0.36, borderRadius: S * 0.18, backgroundColor: fur }} />
      <View style={{ position: 'absolute', left: S * 0.31, top: S * 0.6, width: S * 0.24, height: S * 0.28, borderRadius: S * 0.12, backgroundColor: sheen }} />
      <View style={{ position: 'absolute', left: S * 0.22, top: S * 0.84, width: S * 0.14, height: S * 0.07, borderRadius: S * 0.04, backgroundColor: dark }} />
      <View style={{ position: 'absolute', left: S * 0.5, top: S * 0.84, width: S * 0.14, height: S * 0.07, borderRadius: S * 0.04, backgroundColor: dark }} />
      {/* big pointed ears with grey-pink insides */}
      <View style={{ position: 'absolute', left: S * 0.11, top: S * 0.02, width: 0, height: 0, borderLeftWidth: S * 0.1, borderRightWidth: S * 0.1, borderBottomWidth: S * 0.26, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: fur }} />
      <View style={{ position: 'absolute', left: S * 0.5, top: S * 0.02, width: 0, height: 0, borderLeftWidth: S * 0.1, borderRightWidth: S * 0.1, borderBottomWidth: S * 0.26, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: fur }} />
      <View style={{ position: 'absolute', left: S * 0.16, top: S * 0.12, width: 0, height: 0, borderLeftWidth: S * 0.05, borderRightWidth: S * 0.05, borderBottomWidth: S * 0.13, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#8f7a83' }} />
      <View style={{ position: 'absolute', left: S * 0.55, top: S * 0.12, width: 0, height: 0, borderLeftWidth: S * 0.05, borderRightWidth: S * 0.05, borderBottomWidth: S * 0.13, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#8f7a83' }} />
      {/* wide head with BIG cheekbones: puffed cheek pads plus a bright ridge under each eye */}
      <View style={{ position: 'absolute', left: S * 0.1, top: S * 0.2, width: S * 0.62, height: S * 0.38, borderRadius: S * 0.19, backgroundColor: fur }} />
      <View style={{ position: 'absolute', left: S * 0.05, top: S * 0.34, width: S * 0.24, height: S * 0.22, borderRadius: S * 0.11, backgroundColor: sheen }} />
      <View style={{ position: 'absolute', left: S * 0.53, top: S * 0.34, width: S * 0.24, height: S * 0.22, borderRadius: S * 0.11, backgroundColor: sheen }} />
      <View style={{ position: 'absolute', left: S * 0.11, top: S * 0.33, width: S * 0.2, height: S * 0.045, borderRadius: S * 0.03, backgroundColor: '#a7b3c1', transform: [{ rotate: '-22deg' }] }} />
      <View style={{ position: 'absolute', left: S * 0.51, top: S * 0.33, width: S * 0.2, height: S * 0.045, borderRadius: S * 0.03, backgroundColor: '#a7b3c1', transform: [{ rotate: '22deg' }] }} />
      {/* big vivid green eyes with slit pupils */}
      <View style={{ position: 'absolute', left: S * 0.22, top: S * 0.26, width: S * 0.13, height: S * 0.11, borderRadius: S * 0.055, backgroundColor: '#8cf15a', borderWidth: 1, borderColor: '#1f5a14' }} />
      <View style={{ position: 'absolute', left: S * 0.47, top: S * 0.26, width: S * 0.13, height: S * 0.11, borderRadius: S * 0.055, backgroundColor: '#8cf15a', borderWidth: 1, borderColor: '#1f5a14' }} />
      <View style={{ position: 'absolute', left: S * 0.275, top: S * 0.27, width: S * 0.025, height: S * 0.09, borderRadius: 2, backgroundColor: '#0b1a08' }} />
      <View style={{ position: 'absolute', left: S * 0.525, top: S * 0.27, width: S * 0.025, height: S * 0.09, borderRadius: 2, backgroundColor: '#0b1a08' }} />
      {/* small grey-pink nose, mouth, whiskers */}
      <View style={{ position: 'absolute', left: S * 0.37, top: S * 0.4, width: S * 0.07, height: S * 0.05, borderRadius: S * 0.03, backgroundColor: '#9c828a' }} />
      <View style={{ position: 'absolute', left: S * 0.385, top: S * 0.455, width: S * 0.04, height: S * 0.025, borderBottomWidth: 2, borderColor: dark, borderRadius: 3 }} />
      {[0.42, 0.47].map((t, i) => (
        <React.Fragment key={t}>
          <View style={{ position: 'absolute', left: -S * 0.03, top: S * t, width: S * 0.18, height: 1, backgroundColor: '#dfe6ee', transform: [{ rotate: `${(i ? 10 : -6)}deg` }] }} />
          <View style={{ position: 'absolute', left: S * 0.66, top: S * t, width: S * 0.18, height: 1, backgroundColor: '#dfe6ee', transform: [{ rotate: `${(i ? -10 : 6)}deg` }] }} />
        </React.Fragment>
      ))}
      {/* black fur hat with ear flaps and a red star: Russian mob boss */}
      <View style={{ position: 'absolute', left: S * 0.12, top: S * 0.08, width: S * 0.58, height: S * 0.17, borderRadius: S * 0.09, backgroundColor: '#2b2420', borderWidth: 2, borderColor: '#14100e' }} />
      <View style={{ position: 'absolute', left: S * 0.08, top: S * 0.18, width: S * 0.1, height: S * 0.2, borderRadius: S * 0.05, backgroundColor: '#2b2420' }} />
      <View style={{ position: 'absolute', left: S * 0.64, top: S * 0.18, width: S * 0.1, height: S * 0.2, borderRadius: S * 0.05, backgroundColor: '#2b2420' }} />
      <View style={{ position: 'absolute', left: S * 0.36, top: S * 0.115, width: S * 0.09, height: S * 0.09, backgroundColor: '#d92b2b', transform: [{ rotate: '45deg' }] }} />
      {/* red scarf */}
      <View style={{ position: 'absolute', left: S * 0.22, top: S * 0.54, width: S * 0.34, height: S * 0.07, borderRadius: 4, backgroundColor: '#b2262b' }} />
    </View>
  );
}

// Max: a huge, old, fat warm-grey tabby. Faces left, like the emoji he replaces.
export function MaxCat({ W, H, state }) {
  const fur = '#a0958a';
  const light = '#c9bfb4';
  const stripe = '#6e645c';
  const dark = '#453d37';
  const resting = state === 'rest';
  const angry = state === 'wind' || state === 'slam';
  const stripeBars = [0, 1, 2, 3, 4];
  return (
    <View style={{ width: W, height: H }}>
      {/* thick ringed tail */}
      <View style={{ position: 'absolute', left: W * 0.88, top: H * 0.26, width: W * 0.13, height: H * 0.56, borderRadius: W * 0.07, backgroundColor: fur, transform: [{ rotate: '14deg' }], overflow: 'hidden' }}>
        {[0.12, 0.38, 0.64].map((f) => (
          <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: `${f * 100}%`, height: '12%', backgroundColor: stripe }} />
        ))}
      </View>
      {/* round, heavy body with a pale belly */}
      <View style={{ position: 'absolute', left: W * 0.2, top: H * 0.3, width: W * 0.74, height: H * 0.68, borderRadius: H * 0.34, backgroundColor: fur }} />
      <View style={{ position: 'absolute', left: W * 0.34, top: H * 0.6, width: W * 0.5, height: H * 0.38, borderRadius: H * 0.2, backgroundColor: light }} />
      {/* tabby stripes down the back */}
      {stripeBars.map((i) => (
        <View key={i} style={{ position: 'absolute', left: W * (0.38 + i * 0.1), top: H * 0.31, width: W * 0.035, height: H * (i === 0 || i === 4 ? 0.16 : 0.22), borderRadius: 4, backgroundColor: stripe, transform: [{ rotate: `${(i - 2) * 9}deg` }] }} />
      ))}
      {/* stubby paws */}
      <View style={{ position: 'absolute', left: W * 0.2, top: H * 0.9, width: W * 0.2, height: H * 0.1, borderRadius: H * 0.05, backgroundColor: light }} />
      <View style={{ position: 'absolute', left: W * 0.72, top: H * 0.9, width: W * 0.2, height: H * 0.1, borderRadius: H * 0.05, backgroundColor: light }} />
      {/* ears */}
      <View style={{ position: 'absolute', left: W * 0.04, top: 0, width: 0, height: 0, borderLeftWidth: W * 0.065, borderRightWidth: W * 0.065, borderBottomWidth: H * 0.22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: fur }} />
      <View style={{ position: 'absolute', left: W * 0.34, top: 0, width: 0, height: 0, borderLeftWidth: W * 0.065, borderRightWidth: W * 0.065, borderBottomWidth: H * 0.22, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: fur }} />
      {/* big round head with heavy jowls */}
      <View style={{ position: 'absolute', left: 0, top: H * 0.1, width: W * 0.5, height: H * 0.56, borderRadius: H * 0.28, backgroundColor: fur }} />
      <View style={{ position: 'absolute', left: -W * 0.01, top: H * 0.36, width: W * 0.52, height: H * 0.3, borderRadius: H * 0.15, backgroundColor: '#b5aaa0' }} />
      {/* the tabby "M" on the forehead */}
      {[0.17, 0.235, 0.3].map((x, i) => (
        <View key={x} style={{ position: 'absolute', left: W * x, top: H * 0.13, width: W * 0.025, height: H * (i === 1 ? 0.15 : 0.11), borderRadius: 3, backgroundColor: stripe }} />
      ))}
      {/* cheek stripes */}
      {[0.4, 0.46].map((t) => (
        <View key={t} style={{ position: 'absolute', left: W * 0.03, top: H * t, width: W * 0.1, height: H * 0.03, borderRadius: 3, backgroundColor: stripe }} />
      ))}
      {/* tired, droopy eyes: half-lidded, closed when he's winded, wide when he's mad */}
      {[0.1, 0.31].map((x) => (
        <View key={x} style={{ position: 'absolute', left: W * x, top: H * 0.27, width: W * 0.1, height: H * (resting ? 0.025 : 0.09), borderRadius: H * 0.045, backgroundColor: resting ? dark : '#e8d25a', overflow: 'hidden', borderWidth: resting ? 0 : 1, borderColor: dark }}>
          {!resting && <View style={{ position: 'absolute', left: '40%', top: '15%', width: '20%', height: '70%', borderRadius: 2, backgroundColor: dark }} />}
          {!resting && !angry && <View style={{ position: 'absolute', left: -2, right: -2, top: -2, height: '55%', backgroundColor: fur }} />}
        </View>
      ))}
      {angry && (
        <>
          <View style={{ position: 'absolute', left: W * 0.08, top: H * 0.22, width: W * 0.14, height: 3, backgroundColor: dark, transform: [{ rotate: '18deg' }] }} />
          <View style={{ position: 'absolute', left: W * 0.29, top: H * 0.22, width: W * 0.14, height: 3, backgroundColor: dark, transform: [{ rotate: '-18deg' }] }} />
        </>
      )}
      {/* wise old bushy white brows */}
      {[0.08, 0.3].map((x) => (
        <View key={x} style={{ position: 'absolute', left: W * x, top: H * 0.2, width: W * 0.14, height: H * 0.04, borderRadius: 4, backgroundColor: '#ece6dd' }} />
      ))}
      {/* pink nose, grumpy mouth, white whiskers */}
      <View style={{ position: 'absolute', left: W * 0.215, top: H * 0.4, width: W * 0.07, height: H * 0.05, borderRadius: H * 0.03, backgroundColor: '#c98b91' }} />
      <View style={{ position: 'absolute', left: W * 0.2, top: H * 0.47, width: W * 0.1, height: H * 0.06, borderBottomWidth: 3, borderColor: dark, borderRadius: 8 }} />
      {[0.42, 0.48, 0.54].map((t, i) => (
        <React.Fragment key={t}>
          <View style={{ position: 'absolute', left: -W * 0.08, top: H * t, width: W * 0.22, height: 1.5, backgroundColor: '#f2eee8', transform: [{ rotate: `${(i - 1) * 8}deg` }] }} />
          <View style={{ position: 'absolute', left: W * 0.36, top: H * t, width: W * 0.22, height: 1.5, backgroundColor: '#f2eee8', transform: [{ rotate: `${(1 - i) * 8}deg` }] }} />
        </React.Fragment>
      ))}
    </View>
  );
}

export function Character({ who, size, gear }) {
  if (who === 'billy') {
    return (
      <View style={{ width: FAKE_P.w * size, height: FAKE_P.h * size }}>
        <Billy p={FAKE_P} ts={size} gear={gear || {}} />
      </View>
    );
  }
  if (who === 'wizard') return <Text style={{ fontSize: size * 0.95, lineHeight: size * 1.1 }}>🧙‍♂️</Text>;
  if (who === 'jinxy') return <Jinxy size={size * 0.8} />;
  if (who === 'max') return <MaxCat W={size * 1.6} H={size * 1.4} state="walk" />;
  return null;
}

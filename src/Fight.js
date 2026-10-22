// The cage match (level 9): arena, fighters, health bars, fatalities.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ARENA_W, FATALITIES, ROUNDS_TO_WIN } from '../engine/fight';

const OUTFIT = {
  billy: { skin: '#e8b98a', top: '#b33a2a', bottom: '#2f5fa8', shoe: '#4a2f1a', head: '🤠', scale: 1 },
  cletus: { skin: '#e0a878', top: '#f0f0e6', bottom: '#5a6b3a', shoe: '#2a2a2a', head: '🥸', scale: 1.08 },
  mae: { skin: '#e8c4a0', top: '#8a4fd1', bottom: '#6a38a8', shoe: '#3a2a1a', head: '👵', scale: 0.95 },
  jinxy: { skin: '#6b7282', top: '#6b7282', bottom: '#565d6b', shoe: '#444a58', head: '🐈‍⬛', scale: 0.8 },
};

// Arm and leg angles for a pose. 0 hangs straight down; negative swings forward (toward the opponent).
function pose(f, F) {
  const t = f.t;
  const P = { armF: -8, armB: 10, legF: 0, legB: 0, lean: 0, drop: 0, spin: 0, lie: 0, extend: 1, glow: false, kneel: false };
  const idleBob = Math.sin(F.t * 4 + f.x) * 3;
  switch (f.state) {
    case 'walk':
      P.legF = Math.sin(F.t * 14) * 28;
      P.legB = -P.legF;
      P.armF = -P.legF * 0.7 - 30;
      P.armB = P.legF * 0.7 + 20;
      break;
    case 'jump':
      P.legF = -30;
      P.legB = 25;
      P.armF = -70;
      P.armB = 30;
      break;
    case 'block':
      P.armF = -125;
      P.armB = -110;
      P.drop = 0.12;
      P.lean = 6;
      break;
    case 'punch':
      P.armF = -90;
      P.armB = 40;
      P.extend = 1.25;
      P.lean = 8;
      break;
    case 'kick':
      P.legF = -88;
      P.armF = -50;
      P.armB = 40;
      P.lean = -10;
      break;
    case 'fireball':
      P.armF = -92;
      P.armB = -88;
      P.glow = t > 0.2;
      P.lean = t > 0.25 ? 10 : -8;
      break;
    case 'spin':
      P.spin = t * 1500;
      P.legF = -85;
      P.armF = -80;
      P.armB = 80;
      break;
    case 'uppercut':
      P.armF = -170;
      P.armB = 30;
      P.legF = -25;
      P.legB = 15;
      P.lean = 8;
      break;
    case 'hit':
      P.lean = -14;
      P.armF = 40;
      P.armB = 50;
      break;
    case 'down':
    case 'ko':
      P.lie = Math.min(1, t * 6);
      P.armF = 70;
      P.armB = 60;
      break;
    case 'getup':
      P.lie = Math.max(0, 1 - t / 0.3);
      break;
    case 'dizzy':
    case 'fatal':
      P.kneel = true;
      P.drop = 0.4;
      P.lean = Math.sin(F.t * 5) * 9;
      P.armF = 30;
      P.armB = 35;
      P.legF = -70;
      P.legB = 80;
      break;
    default:
      P.armF += idleBob;
      break;
  }
  return P;
}

function Fighter({ f, ts, F, floorY, ox, win }) {
  const O = OUTFIT[f.who];
  const u = ts * O.scale;
  const P = pose(f, F);
  const celebrate = win;
  const armF = celebrate ? -160 + Math.sin(F.t * 12) * 12 : P.armF;
  const armB = celebrate ? -150 - Math.sin(F.t * 12) * 12 : P.armB;
  const W = 1.8 * u;
  const H = 1.8 * u;
  const hit = f.flash > 0 && Math.floor(f.flash * 40) % 2 === 0;
  const limb = (x, y, w, h, color, angle, extra) => (
    <View style={[{ position: 'absolute', left: x * u, top: y * u, width: w * u, height: h * u, backgroundColor: color, borderRadius: w * u * 0.45, transformOrigin: '50% 0%', transform: [{ rotate: `${angle}deg` }] }, extra]} />
  );
  const rot = P.spin ? P.spin : P.lie * -82 + P.lean;
  return (
    <View
      style={{
        position: 'absolute',
        left: ox + f.x * ts - W / 2,
        top: floorY - f.y * ts - H + (P.lie ? H * 0.35 * P.lie : 0) + P.drop * u,
        width: W,
        height: H,
        opacity: hit ? 0.5 : f.inv > 0 && f.state !== 'ko' ? 0.8 : 1,
        transform: [{ scaleX: f.face }, { rotate: `${rot}deg` }],
        transformOrigin: '50% 90%',
      }}
    >
      <View style={{ position: 'absolute', left: W * 0.5 - u * 0.7, top: H - u * 0.08, width: u * 1.4, height: u * 0.16, borderRadius: u, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      {limb(0.58, 1.1, 0.24, 0.72, O.bottom, P.legB, { zIndex: 1 })}
      {limb(0.58, 1.68, 0.3, 0.14, O.shoe, P.legB, { transformOrigin: '40% -400%' })}
      {limb(0.46, 0.55, 0.2, 0.62, O.skin, armB, { zIndex: 1 })}
      <View style={{ position: 'absolute', left: 0.5 * u, top: 0.55 * u, width: 0.8 * u, height: 0.68 * u, borderRadius: 0.16 * u, backgroundColor: O.top, borderWidth: 2, borderColor: 'rgba(0,0,0,0.25)', zIndex: 2 }}>
        {f.who === 'billy' && <View style={{ position: 'absolute', left: 0.14 * u, top: 0.2 * u, width: 0.42 * u, height: 0.5 * u, backgroundColor: '#2f5fa8' }} />}
        {f.who === 'mae' && <View style={{ position: 'absolute', left: -0.05 * u, top: 0.45 * u, width: 0.9 * u, height: 0.35 * u, backgroundColor: O.bottom, borderBottomLeftRadius: 0.3 * u, borderBottomRightRadius: 0.3 * u }} />}
      </View>
      {limb(0.7, 1.1, 0.24, 0.72, O.bottom, P.legF, { zIndex: 3 })}
      {limb(0.7, 1.68, 0.3, 0.14, O.shoe, P.legF, { zIndex: 3, transformOrigin: '40% -400%' })}
      <Text style={{ position: 'absolute', left: 0.32 * u, top: -0.2 * u, fontSize: 0.95 * u, lineHeight: 1.1 * u, zIndex: 4, transform: [{ rotate: `${P.kneel ? 12 : 0}deg` }] }}>{O.head}</Text>
      {limb(0.88, 0.58, 0.22, 0.62 * P.extend, O.skin, armF, { zIndex: 5 })}
      {P.extend > 1.1 && <View style={{ position: 'absolute', left: 1.5 * u, top: 0.62 * u, width: 0.26 * u, height: 0.26 * u, borderRadius: 0.13 * u, backgroundColor: O.skin, borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)', zIndex: 6 }} />}
      {P.glow && <Text style={{ position: 'absolute', left: 1.3 * u, top: 0.2 * u, fontSize: 0.8 * u, zIndex: 7 }}>🔥</Text>}
      {f.state === 'dizzy' &&
        [0, 1, 2].map((i) => (
          <Text key={i} style={{ position: 'absolute', left: 0.7 * u + Math.cos(F.t * 6 + i * 2.1) * 0.5 * u, top: -0.45 * u + Math.sin(F.t * 6 + i * 2.1) * 0.12 * u, fontSize: 0.4 * u, zIndex: 8 }}>⭐</Text>
        ))}
    </View>
  );
}

function Backdrop({ width, height, floorY, t, ox, ts }) {
  const crowd = ['🤠', '👨‍🌾', '👩‍🌾', '🐔', '🧔', '🐗', '👴', '🐄'];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1a1030' }]} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: floorY * 0.55, backgroundColor: '#2a1850' }} />
      {[0.12, 0.38, 0.62, 0.88].map((f, i) => (
        <View key={f} style={{ position: 'absolute', left: width * f - ts * 0.8, top: 0, width: ts * 1.6, height: floorY * 0.7, opacity: 0.12 + 0.04 * Math.sin(t * 2 + i) }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, borderLeftWidth: ts * 0.8, borderRightWidth: ts * 0.8, borderTopWidth: floorY * 0.7, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#fff6c0', transform: [{ rotate: '180deg' }] }} />
        </View>
      ))}
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ position: 'absolute', left: 0, right: 0, top: floorY * (0.4 + row * 0.11), height: floorY * 0.12, flexDirection: 'row', justifyContent: 'space-around', opacity: 0.32 - row * 0.04 }}>
          {Array.from({ length: 16 }, (_, i) => (
            <Text key={i} style={{ fontSize: ts * (0.55 + row * 0.08), transform: [{ translateY: Math.abs(Math.sin(t * 3 + i * 1.7 + row)) * -ts * 0.12 }] }}>
              {crowd[(i * 3 + row * 5) % crowd.length]}
            </Text>
          ))}
        </View>
      ))}
      {Array.from({ length: Math.ceil(width / (ts * 0.6)) }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: i * ts * 0.6, top: floorY * 0.3, width: 2, height: floorY * 0.7, backgroundColor: 'rgba(200,210,230,0.28)' }} />
      ))}
      {[0.35, 0.6, 0.85].map((f) => (
        <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: floorY * f, height: 3, backgroundColor: 'rgba(200,210,230,0.3)' }} />
      ))}
      <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#6a4a2a' }} />
      <View style={{ position: 'absolute', left: ox, width: ARENA_W * ts, top: floorY, height: ts * 0.18, backgroundColor: '#a8814a' }} />
      <View style={{ position: 'absolute', left: width * 0.5 - ts * 1.6, top: floorY + ts * 0.5, width: ts * 3.2, height: ts * 0.9, borderRadius: ts, borderWidth: 3, borderColor: 'rgba(255,255,255,0.12)' }} />
    </View>
  );
}

const Bar = ({ frac, color, right, w }) => (
  <View style={{ width: w, height: 16, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 2, borderColor: '#fff', overflow: 'hidden', transform: [{ scaleX: right ? -1 : 1 }] }}>
    <View style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%`, height: '100%', backgroundColor: frac > 0.3 ? color : '#ff3a2a' }} />
  </View>
);

function Pips({ n, right }) {
  return (
    <View style={{ flexDirection: right ? 'row-reverse' : 'row', gap: 4, marginTop: 3 }}>
      {Array.from({ length: ROUNDS_TO_WIN }, (_, i) => (
        <View key={i} style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', backgroundColor: i < n ? '#ffd23a' : 'transparent' }} />
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
          <Text style={{ position: 'absolute', left: x - ts * 1.3, top: fy - ts * 3.2 - (1 - fall) * ts * 6, fontSize: ts * 3, transform: [{ rotate: '20deg' }] }}>🌽</Text>
          {k > 0.8 && <Text style={{ position: 'absolute', left: x - ts * 0.9, top: fy - ts * 1.6, fontSize: ts * 1.4 }}>💥</Text>}
          {k > 0.9 && <Text style={{ position: 'absolute', left: x - ts * 1.5, top: fy - ts * 2.6, fontSize: ts * 0.9, fontWeight: '900', color: '#fff' }}>SPLAT!</Text>}
        </>
      );
    }
    case 'outhouse': {
      const run = Math.min(1, k / 1.1);
      const px = ox - ts * 3 + run * (ox + ARENA_W * ts + ts * 4);
      return <Text style={{ position: 'absolute', left: px, top: fy - ts * 2.1, fontSize: ts * 2.2 }}>🚽</Text>;
    }
    case 'jug': {
      const boom = Math.max(0, k - 0.9);
      return (
        <>
          <Text style={{ position: 'absolute', left: x - ts * 1.1, top: fy - ts * 2.6 - Math.max(0, 0.9 - k) * ts * 5, fontSize: ts * 2.2 }}>🏺</Text>
          {boom > 0 && (
            <View style={{ position: 'absolute', left: x - ts * (0.5 + boom * 2.4), top: fy - ts * 1 - ts * (0.5 + boom * 2.4), width: ts * (1 + boom * 4.8), height: ts * (1 + boom * 4.8), borderRadius: ts * 4, backgroundColor: `rgba(255,${180 - boom * 60},40,${Math.max(0, 0.9 - boom * 0.5)})` }} />
          )}
          {k > 1.4 && <Text style={{ position: 'absolute', left: x - ts * 0.8, top: fy - ts * 1.7, fontSize: ts * 1.5, opacity: k > 2.6 ? 0.4 : 1 }}>💀</Text>}
        </>
      );
    }
    case 'moon':
      return (
        <>
          <Text style={{ position: 'absolute', left: ox + ARENA_W * ts * 0.62, top: ts * 0.3, fontSize: ts * 2 }}>🌙</Text>
          {k > 1.3 && <Text style={{ position: 'absolute', left: ox + ARENA_W * ts * 0.62 + ts * 0.5, top: ts * 0.1, fontSize: ts * 1.2 }}>✨</Text>}
        </>
      );
    default:
      return null;
  }
}

// Where the loser is drawn during each fatality (null: the normal pose)
function fatalityPose(F, ts) {
  const k = F.t;
  const o = F.o;
  switch (F.fatality) {
    case 'cob':
      return k > 0.8 ? { flat: true } : null;
    case 'outhouse': {
      const run = Math.min(1, k / 1.1);
      const hitK = Math.max(0, k - 0.55);
      return k > 0.55 ? { dx: hitK * 9, dy: Math.sin(Math.min(1, hitK / 1.5) * Math.PI) * 4 + hitK * 2, spin: hitK * 700 } : { dx: 0 };
    }
    case 'jug':
      return k > 1.4 ? { hide: true } : null;
    case 'moon':
      return k > 0.4 ? { dy: (k - 0.4) * 9, dx: (k - 0.4) * 1.5, spin: (k - 0.4) * 500 } : null;
    default:
      return null;
  }
}

export function FightView({ g, width, height }) {
  const F = g.fight;
  const ts = Math.min(width / (ARENA_W + 0.5), height / 6.6);
  const floorY = height * 0.66;
  const ox = (width - ARENA_W * ts) / 2;
  const shakeX = F.shake > 0 ? (Math.random() - 0.5) * ts * 0.3 : 0;
  const shakeY = F.shake > 0 ? (Math.random() - 0.5) * ts * 0.3 : 0;
  const fat = F.phase === 'fatality' ? fatalityPose(F, ts) : null;
  const barW = Math.min(width * 0.36, 300);
  const winP = F.phase === 'fatality' || (F.phase === 'ko' && F.roundWinner === 'p') || F.phase === 'finish' || F.phase === 'won';
  const winO = F.phase === 'ko' && F.roundWinner === 'o';
  const finishFrac = Math.max(0, F.finishT / 7);
  const o = fat
    ? { ...F.o, x: F.o.x + (fat.dx || 0), y: F.o.y + (fat.dy || 0) }
    : F.o;
  const showO = !(fat && fat.hide);
  const cd = (v, max) => (v <= 0 ? 1 : 0.3);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Backdrop width={width} height={height} floorY={floorY} t={g.time} ox={ox} ts={ts} />
      <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}>
        <Fighter f={F.p} ts={ts} F={F} floorY={floorY} ox={ox} win={winP} />
        {showO && (
          <View style={fat && fat.flat ? { position: 'absolute', left: 0, top: 0, width, height, transform: [{ scaleY: 0.25 }], transformOrigin: `0px ${floorY}px` } : fat && fat.spin ? { position: 'absolute', left: 0, top: 0, width, height, transform: [{ rotate: `${fat.spin}deg` }], transformOrigin: `${ox + o.x * ts}px ${floorY - o.y * ts - ts * 0.9}px` } : { position: 'absolute', left: 0, top: 0, width, height }}>
            <Fighter f={o} ts={ts} F={F} floorY={floorY} ox={ox} win={winO} />
          </View>
        )}
        {F.shots.map((s, i) => (
          <View key={i} style={{ position: 'absolute', left: ox + s.x * ts - ts * 0.5, top: floorY - s.y * ts - ts * 0.5, width: ts, height: ts, borderRadius: ts / 2, backgroundColor: 'rgba(255,140,30,0.55)', borderWidth: 3, borderColor: '#ffd23a', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: ts * 0.8, transform: [{ scaleX: s.face }] }}>🔥</Text>
          </View>
        ))}
        {[F.p, F.o].map((f, i) =>
          f.flash > 0.12 ? (
            <Text key={i} style={{ position: 'absolute', left: ox + (f.x - f.face * 0.1) * ts - ts * 0.6, top: floorY - (f.y + 1.4) * ts, fontSize: ts * 1.2 }}>💥</Text>
          ) : null
        )}
        {F.phase === 'fatality' && <FatalityFx F={F} ts={ts} floorY={floorY} ox={ox} />}
      </View>

      {/* health bars, names, round pips, timer */}
      <View style={{ position: 'absolute', top: 8, left: 44, right: 120, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={styles.name}>BILLY ×{g.lives}</Text>
          <Bar frac={F.p.hp / F.p.maxHp} color="#5fd13a" w={barW} />
          <Pips n={F.wins.p} />
          <Text style={styles.cds}>
            <Text style={{ opacity: cd(F.p.cd.fire) }}>🔥</Text> <Text style={{ opacity: cd(F.p.cd.spin) }}>🌀</Text> <Text style={{ opacity: cd(F.p.cd.up) }}>⬆️</Text>
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.timer}>{Math.max(0, Math.ceil(F.timer))}</Text>
          <Text style={styles.rnd}>
            FIGHT {g.fightIdx + 1}/3  •  ROUND {F.round}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.name}>{F.def.name}</Text>
          <Bar frac={F.o.hp / F.o.maxHp} color="#ff9a2a" right w={barW} />
          <Pips n={F.wins.o} right />
        </View>
      </View>

      {F.text && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingBottom: height * 0.34 }]}>
          <Text style={[styles.banner, F.phase === 'finish' && { color: '#ff3a3a' }, { fontSize: Math.min(54, ts * 1.1, (width * 0.9) / (F.text.length * 0.85)) * (F.phase === 'fatality' ? 0.75 : 1), opacity: F.phase === 'finish' ? 0.7 + 0.3 * Math.sin(F.t * 12) : 1 }]}>{F.text}</Text>
        </View>
      )}
      {F.phase === 'finish' && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 66, alignItems: 'center' }}>
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

const shadow = { textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3, textShadowOffset: { width: 1, height: 2 } };
const styles = StyleSheet.create({
  name: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1, marginBottom: 2, ...shadow },
  timer: { color: '#ffd23a', fontWeight: '900', fontSize: 30, ...shadow },
  rnd: { color: '#fff', fontWeight: '800', fontSize: 10, letterSpacing: 1, ...shadow },
  cds: { fontSize: 14, marginTop: 2 },
  banner: { color: '#ffd23a', fontWeight: '900', letterSpacing: 2, textAlign: 'center', ...shadow },
  finishBox: { backgroundColor: 'rgba(10,5,25,0.72)', borderWidth: 2, borderColor: '#ff3a3a', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 5, gap: 0, minWidth: 300 },
  finishLine: { color: '#fff', fontWeight: '800', fontSize: 11, ...shadow },
});

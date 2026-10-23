// The penguin race (level 10): a snowy three-lane course, penguins with riders, moonshine, HUD.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COURSE, LANES } from '../engine/race';

const RIDERS = { BILLY: '🤠', WADDLES: '🐻‍❄️', 'CHILLY WILLY': '🦊', 'EMPEROR PETE': '🐻' };

const SKY = ['#0a1230', '#102048', '#17306a', '#1f4a86', '#2c6a9e', '#4a8fb4'];

const Stars = React.memo(function Stars({ width }) {
  return (
    <>
      {Array.from({ length: 40 }, (_, i) => (
        <View key={i} style={{ position: 'absolute', left: (i * 97) % width, top: (i * 53) % 90, width: 2 + (i % 2), height: 2 + (i % 2), borderRadius: 2, backgroundColor: '#fff', opacity: 0.5 }} />
      ))}
    </>
  );
});

function Mountains({ camX, ts, y }) {
  const els = [];
  const step = ts * 7;
  const off = -((camX * ts * 0.1) % step);
  for (let i = -1; i < 6; i++) {
    const h = ts * (3 + ((i + 10) * 7) % 3);
    els.push(
      <View key={i} style={{ position: 'absolute', left: off + i * step, top: y - h, width: 0, height: 0, borderLeftWidth: step * 0.65, borderRightWidth: step * 0.65, borderBottomWidth: h, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#5d7fa8' }}>
        <View style={{ position: 'absolute', left: -step * 0.2, top: h * 0.02, width: 0, height: 0, borderLeftWidth: step * 0.2, borderRightWidth: step * 0.2, borderBottomWidth: h * 0.3, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#e8f4ff' }} />
      </View>
    );
  }
  return <>{els}</>;
}

function Hills({ camX, ts, y }) {
  const els = [];
  const step = ts * 5;
  const off = -((camX * ts * 0.3) % step);
  for (let i = -1; i < 8; i++) {
    els.push(<View key={i} style={{ position: 'absolute', left: off + i * step, top: y - ts * (0.6 + (i % 3) * 0.3), width: step * 1.2, height: ts * 2, borderRadius: step, backgroundColor: '#cfe4f4' }} />);
    els.push(<Text key={`t${i}`} style={{ position: 'absolute', left: off + i * step + step * 0.3, top: y - ts * 1.6, fontSize: ts * 1.1 }}>🌲</Text>);
  }
  return <>{els}</>;
}

function Penguin({ r, ts, scale, t, isP, rider }) {
  const w = ts * 1.5 * scale;
  const h = ts * 1.1 * scale;
  const air = r.y * ts * scale;
  const bob = Math.sin(t * 16 + r.x * 0.3) * ts * 0.03 * scale;
  const tilt = r.stun > 0 ? Math.sin(t * 40) * 6 : r.drunk > 0 ? Math.sin(t * 9) * 7 : r.y > 0.2 ? -10 : 0;
  const hit = r.flash > 0 && Math.floor(r.flash * 30) % 2 === 0;
  return (
    <View style={{ position: 'absolute', left: -w * 0.5, top: -h * 0.85 - air + bob, width: w, height: h * 1.25, opacity: hit ? 0.5 : 1, transform: [{ rotate: `${tilt}deg` }] }}>
      {/* shadow on the ice */}
      <View style={{ position: 'absolute', left: w * 0.1, top: h * 1.1 + air, width: w * 0.8, height: h * 0.18, borderRadius: w, backgroundColor: 'rgba(20,40,80,0.35)', opacity: 1 - Math.min(0.6, r.y * 0.3) }} />
      {/* feet */}
      <View style={{ position: 'absolute', left: w * 0.05, top: h * 0.88, width: w * 0.28, height: h * 0.18, borderRadius: h * 0.1, backgroundColor: '#ff9a2a', transform: [{ rotate: `${Math.sin(t * 22) * 14}deg` }] }} />
      <View style={{ position: 'absolute', left: w * 0.3, top: h * 0.88, width: w * 0.28, height: h * 0.18, borderRadius: h * 0.1, backgroundColor: '#e8811a', transform: [{ rotate: `${-Math.sin(t * 22) * 14}deg` }] }} />
      {/* body: a belly-down slide */}
      <View style={{ position: 'absolute', left: 0, top: h * 0.3, width: w * 0.86, height: h * 0.62, borderRadius: h * 0.4, backgroundColor: '#1d2230', borderWidth: 2, borderColor: '#0b0e18' }}>
        <View style={{ position: 'absolute', left: w * 0.14, top: h * 0.28, width: w * 0.56, height: h * 0.3, borderRadius: h * 0.2, backgroundColor: '#f4f7ff' }} />
        <View style={{ position: 'absolute', left: -w * 0.1, top: h * 0.1, width: w * 0.3, height: h * 0.2, borderRadius: h * 0.1, backgroundColor: '#1d2230', transform: [{ rotate: `${Math.sin(t * 14) * 20 + 25}deg` }] }} />
      </View>
      {/* head and beak, out front */}
      <View style={{ position: 'absolute', left: w * 0.66, top: h * 0.2, width: w * 0.3, height: h * 0.48, borderRadius: h * 0.24, backgroundColor: '#1d2230', borderWidth: 2, borderColor: '#0b0e18' }}>
        <View style={{ position: 'absolute', left: w * 0.12, top: h * 0.12, width: w * 0.09, height: w * 0.09, borderRadius: w, backgroundColor: '#fff' }}>
          <View style={{ position: 'absolute', left: w * 0.04, top: w * 0.02, width: w * 0.04, height: w * 0.04, borderRadius: w, backgroundColor: '#000' }} />
        </View>
        <View style={{ position: 'absolute', left: w * 0.22, top: h * 0.2, width: w * 0.22, height: h * 0.14, borderRadius: h * 0.1, backgroundColor: '#ff9a2a' }} />
        {r.hat === 'scarf' && <View style={{ position: 'absolute', left: -w * 0.04, top: h * 0.38, width: w * 0.34, height: h * 0.1, backgroundColor: '#4aa8ff', borderRadius: 4 }} />}
        {r.hat === 'goggles' && <View style={{ position: 'absolute', left: w * 0.04, top: h * 0.08, width: w * 0.24, height: h * 0.14, borderRadius: h * 0.07, backgroundColor: 'rgba(255,90,74,0.8)', borderWidth: 2, borderColor: '#fff' }} />}
        {r.hat === 'crown' && <Text style={{ position: 'absolute', left: w * 0.02, top: -h * 0.32, fontSize: h * 0.4 }}>👑</Text>}
      </View>
      {/* the rider, hunched forward */}
      <View style={{ position: 'absolute', left: w * 0.18, top: -h * 0.22, width: w * 0.5, height: h * 0.7, transform: [{ rotate: '14deg' }] }}>
        <View style={{ position: 'absolute', left: w * 0.05, top: h * 0.3, width: w * 0.32, height: h * 0.4, borderRadius: h * 0.12, backgroundColor: isP ? '#c0392b' : r.color, borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' }}>
          {isP && <View style={{ position: 'absolute', left: w * 0.06, top: h * 0.12, width: w * 0.2, height: h * 0.26, backgroundColor: '#3568b8' }} />}
        </View>
        <View style={{ position: 'absolute', left: w * 0.3, top: h * 0.36, width: w * 0.3, height: h * 0.1, borderRadius: 4, backgroundColor: isP ? '#f0bd90' : '#e6c8a0', transform: [{ rotate: '-30deg' }] }} />
        <Text style={{ position: 'absolute', left: w * 0.1, top: -h * 0.12, fontSize: h * 0.55, lineHeight: h * 0.65 }}>{rider}</Text>
      </View>
      {r.drunk > 0 && isP && (
        <>
          {[0, 1, 2].map((i) => (
            <Text key={i} style={{ position: 'absolute', left: w * (0.6 - i * 0.3), top: -h * (0.6 + ((t * 2 + i * 0.4) % 1) * 0.8), fontSize: h * 0.3, opacity: 1 - ((t * 2 + i * 0.4) % 1) }}>🫧</Text>
          ))}
          <Text style={{ position: 'absolute', left: w * 0.1, top: -h * 0.85, fontSize: h * 0.34, fontWeight: '900', color: '#ffd23a' }}>HIC!</Text>
        </>
      )}
      {r.stun > 0 && <Text style={{ position: 'absolute', left: w * 0.5, top: -h * 0.6, fontSize: h * 0.4 }}>💫</Text>}
    </View>
  );
}

function Obstacle({ o, ts, scale, t }) {
  const s = ts * scale;
  if (o.dead) {
    return o.smashed ? <Text style={{ position: 'absolute', left: -s * 0.5, top: -s * 1.2, fontSize: s * 1.0, opacity: 0.8 }}>💥</Text> : null;
  }
  switch (o.kind) {
    case 'spike':
      return (
        <View style={{ position: 'absolute', left: -s * 0.5, top: -s * 0.7, width: s, height: s * 0.7 }}>
          {[0, 0.34, 0.68].map((l, i) => (
            <View key={i} style={{ position: 'absolute', left: l * s - s * 0.02, top: i === 1 ? 0 : s * 0.18, width: 0, height: 0, borderLeftWidth: s * 0.17, borderRightWidth: s * 0.17, borderBottomWidth: s * (i === 1 ? 0.7 : 0.52), borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#bfe8ff' }} />
          ))}
        </View>
      );
    case 'crack':
      return (
        <View style={{ position: 'absolute', left: -s * 0.55, top: -s * 0.14, width: s * 1.1, height: s * 0.3 }}>
          <View style={{ position: 'absolute', left: 0, top: s * 0.08, width: s * 0.55, height: 4, backgroundColor: '#0a1a3a', transform: [{ rotate: '8deg' }] }} />
          <View style={{ position: 'absolute', left: s * 0.5, top: s * 0.12, width: s * 0.6, height: 4, backgroundColor: '#0a1a3a', transform: [{ rotate: '-10deg' }] }} />
          <View style={{ position: 'absolute', left: s * 0.1, top: s * 0.02, width: s * 0.9, height: s * 0.22, borderRadius: s, backgroundColor: 'rgba(10,26,58,0.55)' }} />
        </View>
      );
    case 'snowman':
      return <Text style={{ position: 'absolute', left: -s * 0.7, top: -s * 1.45, fontSize: s * 1.5 }}>⛄</Text>;
    default:
      return <Text style={{ position: 'absolute', left: -s * 0.7, top: -s * 1.2, fontSize: s * 1.4 }}>🦭</Text>;
  }
}

export function RaceView({ g, width, height }) {
  const R = g.race;
  const ts = width / 19;
  const camX = R.p.x - 4.5;
  const baseY = height * 0.5;
  const gap = height * 0.145;
  const laneY = (l) => baseY + l * gap;
  const scaleOf = (l) => 0.88 + l * 0.12;
  const screenX = (x) => (x - camX) * ts;
  const drunk = R.p.drunk > 0;
  const T = R.t;
  const shakeX = R.shake > 0 ? (Math.random() - 0.5) * ts * 0.3 : 0;
  const shakeY = R.shake > 0 ? (Math.random() - 0.5) * ts * 0.3 : 0;
  const bandH = baseY / SKY.length;
  // everything visible, grouped by lane so nearer lanes draw on top
  const vis = (x) => x > camX - 2 && x < camX + 22;
  const lanesEls = [];
  const racers = [R.p, ...R.rivals];
  for (let l = 0; l < LANES; l++) {
    const sc = scaleOf(l);
    lanesEls.push(
      <View key={`lane${l}`} style={StyleSheet.absoluteFill}>
        {R.ramps.filter((rp) => rp.lane === l && vis(rp.x)).map((rp, i) => (
          <View key={`r${i}`} style={{ position: 'absolute', left: screenX(rp.x) - ts * sc * 0.8, top: laneY(l) - ts * sc * 0.55, width: ts * sc * 1.6, height: ts * sc * 0.55 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0, borderLeftWidth: ts * sc * 1.6, borderBottomWidth: ts * sc * 0.55, borderLeftColor: 'transparent', borderBottomColor: '#7fd0ff' }} />
            <View style={{ position: 'absolute', left: ts * sc * 0.4, top: ts * sc * 0.28, width: ts * sc * 1.0, height: 3, backgroundColor: '#fff', transform: [{ rotate: '-18deg' }] }} />
          </View>
        ))}
        {R.jugs.filter((j) => j.lane === l && !j.taken && vis(j.x)).map((j, i) => (
          <View key={`j${i}`} style={{ position: 'absolute', left: screenX(j.x) - ts * sc * 0.45, top: laneY(l) - ts * sc * (1.0 + 0.1 * Math.sin(T * 5 + j.x)), width: ts * sc * 0.9, height: ts * sc * 0.9, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', width: '130%', height: '130%', borderRadius: ts, backgroundColor: 'rgba(255,200,60,0.3)', borderWidth: 2, borderColor: 'rgba(255,230,120,0.7)' }} />
            <Text style={{ fontSize: ts * sc * 0.75 }}>🏺</Text>
            <Text style={{ position: 'absolute', fontSize: ts * sc * 0.22, fontWeight: '900', color: '#7a2a00', top: ts * sc * 0.4 }}>XXX</Text>
          </View>
        ))}
        {R.obstacles.filter((o) => o.lane === l && vis(o.x)).map((o, i) => (
          <View key={`o${i}`} style={{ position: 'absolute', left: screenX(o.x), top: laneY(l) }}>
            <Obstacle o={o} ts={ts} scale={sc} t={T} />
          </View>
        ))}
        {R.cobs.filter((c) => c.lane === l).map((c, i) => (
          <Text key={`c${i}`} style={{ position: 'absolute', left: screenX(c.x) - ts * 0.3, top: laneY(l) - ts * sc * 0.8, fontSize: ts * 0.6, transform: [{ rotate: `${T * 900}deg` }] }}>{c.owner === R.p ? '🌽' : '❄️'}</Text>
        ))}
        {racers
          .filter((r) => Math.round(r.laneF) === l && vis(r.x))
          .map((r) => (
            <View key={r.name} style={{ position: 'absolute', left: screenX(r.x) + (r === R.p ? 0 : 0), top: laneY(r.laneF) }}>
              <Penguin r={r} ts={ts} scale={scaleOf(r.laneF)} t={T} isP={r === R.p} rider={RIDERS[r.name]} />
              <Text style={{ position: 'absolute', left: -ts * 0.6, top: ts * 0.25, width: ts * 1.2, textAlign: 'center', fontSize: ts * 0.2, fontWeight: '900', color: '#fff', textShadowColor: '#000', textShadowRadius: 3 }}>{r === R.p ? '' : r.name}</Text>
            </View>
          ))}
      </View>
    );
  }
  // progress bar
  const barW = Math.min(width * 0.5, 420);
  const finishX = screenX(COURSE);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeX }, { translateY: shakeY }] }]}>
        {SKY.map((c, i) => (
          <View key={c} style={{ position: 'absolute', left: 0, right: 0, top: i * bandH, height: bandH + 1, backgroundColor: c }} />
        ))}
        <Stars width={width} />
        {/* aurora */}
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ position: 'absolute', left: width * (0.1 + i * 0.3) - ((camX * ts * 0.05) % 60), top: 10 + i * 8, width: width * 0.3, height: 40, borderRadius: 30, backgroundColor: i % 2 ? 'rgba(120,255,200,0.14)' : 'rgba(180,120,255,0.14)', transform: [{ rotate: `${Math.sin(T * 0.6 + i) * 4}deg` }] }} />
        ))}
        <Mountains camX={camX} ts={ts} y={baseY - gap * 0.2} />
        <Hills camX={camX} ts={ts} y={baseY - gap * 0.35} />
        {/* the ice track */}
        <View style={{ position: 'absolute', left: 0, right: 0, top: laneY(0) - gap * 0.62, height: gap * 3.3, backgroundColor: '#cfeaff' }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: laneY(0) - gap * 0.62, height: gap * 0.2, backgroundColor: '#a9d4f2' }} />
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ position: 'absolute', left: 0, right: 0, top: laneY(0) - gap * 0.5 + i * gap, height: 3, backgroundColor: 'rgba(90,150,200,0.45)' }}>
            {Array.from({ length: Math.ceil(width / (ts * 2)) + 2 }, (_, k) => (
              <View key={k} style={{ position: 'absolute', left: k * ts * 2 - ((camX * ts) % (ts * 2)), top: 0, width: ts * 0.8, height: 3, backgroundColor: i === 0 || i === 3 ? 'transparent' : '#fff' }} />
            ))}
          </View>
        ))}
        <View style={{ position: 'absolute', left: 0, right: 0, top: laneY(2) + gap * 0.85, bottom: 0, backgroundColor: '#e8f4ff' }} />
        {Array.from({ length: Math.ceil(width / (ts * 3)) + 2 }, (_, k) => (
          <Text key={k} style={{ position: 'absolute', left: k * ts * 3 - ((camX * ts * 1.2) % (ts * 3)), top: laneY(2) + gap * 0.95, fontSize: ts * 1.3 }}>{k % 3 === 0 ? '🌲' : k % 3 === 1 ? '⛄' : '🌲'}</Text>
        ))}
        {/* start and finish lines */}
        {camX < 4 && <View style={{ position: 'absolute', left: screenX(1), top: laneY(0) - gap * 0.5, width: 6, height: gap * 3, backgroundColor: '#fff', opacity: 0.7 }} />}
        {finishX < width + 40 && (
          <View style={{ position: 'absolute', left: finishX, top: laneY(0) - gap * 0.62, width: ts * 0.8, height: gap * 3.3 }}>
            {Array.from({ length: 16 }, (_, i) => (
              <View key={i} style={{ position: 'absolute', left: (i % 2) * ts * 0.4, top: i * ((gap * 3.3) / 16), width: ts * 0.4, height: (gap * 3.3) / 16 + 1, backgroundColor: (i + Math.floor(i / 2)) % 2 ? '#111' : '#fff' }} />
            ))}
            <Text style={{ position: 'absolute', left: -ts * 1.2, top: -gap * 0.9, fontSize: ts * 0.7, fontWeight: '900', color: '#fff', textShadowColor: '#000', textShadowRadius: 4 }}>FINISH</Text>
          </View>
        )}
        {lanesEls}
        {drunk &&
          Array.from({ length: 9 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: ((i * 173 - T * ts * 30) % (width + 200)) + (width + 200) % (width + 200), top: laneY(0) - gap * 0.5 + ((i * 47) % (gap * 3)), width: ts * 3, height: 3, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 2 }} />
          ))}
        {drunk && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,170,40,0.12)' }]} />}
      </View>

      {/* HUD: place, progress, drunk meter */}
      <View style={{ position: 'absolute', top: 8, left: 44, right: 120, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={styles.place}>{R.phase === 'finished' ? R.place : placeNow(R)}<Text style={styles.placeSub}>/4</Text></Text>
          <Text style={styles.small}>🍺 ×{R.p.jugs}   {Math.round(R.p.v * 3.6)} km/h</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: barW, height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderWidth: 2, borderColor: '#fff' }}>
            {[R.p, ...R.rivals].map((r) => (
              <View key={r.name} style={{ position: 'absolute', left: Math.min(1, r.x / COURSE) * (barW - 18), top: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: r === R.p ? '#ff3a2a' : r.color, borderWidth: 2, borderColor: '#fff', zIndex: r === R.p ? 5 : 1 }} />
            ))}
          </View>
          <Text style={styles.small}>{Math.max(0, Math.round(COURSE - R.p.x))} m to go</Text>
        </View>
        <View style={{ width: 90, alignItems: 'flex-end' }}>
          {drunk && (
            <>
              <Text style={[styles.small, { color: '#ffd23a' }]}>🍺 DRUNK x1.5</Text>
              <View style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <View style={{ width: `${Math.min(1, R.p.drunk / 10) * 100}%`, height: '100%', backgroundColor: '#ffb43a' }} />
              </View>
            </>
          )}
        </View>
      </View>
      {R.text && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingBottom: height * 0.2 }]}>
          <Text style={[styles.banner, { fontSize: R.phase === 'countdown' ? 90 : 52 }]}>{R.text}</Text>
        </View>
      )}
    </View>
  );
}

function placeNow(R) {
  const all = [R.p, ...R.rivals].slice().sort((a, b) => b.x - a.x);
  return all.indexOf(R.p) + 1;
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4, textShadowOffset: { width: 1, height: 2 } };
const styles = StyleSheet.create({
  place: { color: '#ffd23a', fontWeight: '900', fontSize: 40, ...shadow },
  placeSub: { color: '#fff', fontSize: 18 },
  small: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1, ...shadow },
  banner: { color: '#ffd23a', fontWeight: '900', letterSpacing: 3, textAlign: 'center', textShadowColor: '#1a2a6a', textShadowRadius: 8, textShadowOffset: { width: 3, height: 4 } },
});

// Hillbilly Kart (level 11): a pseudo-3D road drawn as horizontal strips, with kart sprites and a HUD.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SEG, LAPS, curveAt, lapOf, placeOf } from '../engine/kart';

const SKY = ['#3a7bd5', '#4a8fe0', '#5fa3e8', '#7ab8ee', '#9ccdf4', '#bfe0f8'];
const ITEM_ICON = { shine: '🏺', corn: '🌽', pie: '💩', hay: '🌾' };
const ITEM_NAME = { shine: 'MOONSHINE', corn: 'CORN MISSILE', pie: 'COW PIE', hay: 'HAY SHIELD' };

function Kart({ w, color, head, steer = 0, drunk, spin, flash, back = true, hay, boost, t }) {
  const h = w * 0.62;
  const wob = drunk ? Math.sin(t * 9) * 5 : 0;
  const rot = spin > 0 ? spin * 720 : steer * 7 + wob;
  const fl = flash > 0 && Math.floor(flash * 24) % 2 === 0;
  return (
    <View style={{ width: w, height: h * 1.4, opacity: fl ? 0.5 : 1, transform: [{ rotate: `${rot}deg` }] }}>
      {/* shadow */}
      <View style={{ position: 'absolute', left: w * 0.05, top: h * 1.1, width: w * 0.9, height: h * 0.22, borderRadius: w, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      {/* rear wheels */}
      <View style={{ position: 'absolute', left: -w * 0.03, top: h * 0.62, width: w * 0.22, height: h * 0.5, borderRadius: w * 0.06, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#555' }} />
      <View style={{ position: 'absolute', right: -w * 0.03, top: h * 0.62, width: w * 0.22, height: h * 0.5, borderRadius: w * 0.06, backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#555' }} />
      {/* the mower deck at the back, with an exhaust puff */}
      <View style={{ position: 'absolute', left: w * 0.12, top: h * 0.66, width: w * 0.76, height: h * 0.4, borderRadius: w * 0.08, backgroundColor: '#c9ccd2', borderWidth: 2, borderColor: '#6a6f78' }}>
        <View style={{ position: 'absolute', left: w * 0.08, top: h * 0.1, width: w * 0.6, height: 3, backgroundColor: '#8a8f98' }} />
        <View style={{ position: 'absolute', left: w * 0.08, top: h * 0.2, width: w * 0.6, height: 3, backgroundColor: '#8a8f98' }} />
      </View>
      {boost > 0 && <Text style={{ position: 'absolute', left: w * 0.3, top: h * 0.95, fontSize: w * 0.3 }}>🔥</Text>}
      {/* the seat and body */}
      <View style={{ position: 'absolute', left: w * 0.2, top: h * 0.25, width: w * 0.6, height: h * 0.55, borderRadius: w * 0.14, backgroundColor: color, borderWidth: 2, borderColor: 'rgba(0,0,0,0.35)' }}>
        <View style={{ position: 'absolute', left: w * 0.06, top: h * 0.08, width: w * 0.48, height: h * 0.12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      </View>
      {/* driver */}
      <Text style={{ position: 'absolute', left: w * 0.2, top: -h * 0.18, width: w * 0.6, textAlign: 'center', fontSize: w * 0.5, lineHeight: w * 0.58 }}>{head}</Text>
      {head === '🤠' && <View style={{ position: 'absolute', left: w * 0.3, top: h * 0.3, width: w * 0.4, height: h * 0.1, borderRadius: 3, backgroundColor: '#3568b8' }} />}
      {hay > 0 && <Text style={{ position: 'absolute', left: w * 0.1, top: -h * 0.3, fontSize: w * 0.7, opacity: 0.85 }}>🌾</Text>}
      {spin > 0 && <Text style={{ position: 'absolute', left: w * 0.3, top: -h * 0.5, fontSize: w * 0.4 }}>💫</Text>}
      {drunk && <Text style={{ position: 'absolute', left: w * 0.7, top: -h * 0.35, fontSize: w * 0.28, fontWeight: '900', color: '#ffd23a' }}>HIC!</Text>}
    </View>
  );
}

export function KartView({ g, width, height }) {
  const K = g.kart;
  const W = width;
  const H = height;
  const yH = H * 0.4;
  const rowH = 6;
  const c = (0.5 * W) / (H - yH);
  const Kz = 8 * (H - yH);
  const p = K.p;
  const camS = p.s - 8;
  const camLat = p.x;
  const T = K.T;
  const drunk = p.drunk > 0;
  const shakeX = K.shake > 0 ? (Math.random() - 0.5) * 14 : 0;
  const bump = p.off && p.v > 15 ? (Math.random() - 0.5) * 5 : 0;
  // road rows, near to far, accumulating the bends
  const rows = [];
  let slope = 0;
  let X = 0;
  let prevZ = 8;
  for (let y = H - 1; y > yH + 2; y -= rowH) {
    const dy = y - yH;
    const z = Kz / dy;
    const dz = z - prevZ;
    slope += curveAt(T, camS + z) * dz;
    X += slope * dz;
    prevZ = z;
    rows.push({ y, z, scale: c * dy, X, s: camS + z });
  }
  const lookup = (z) => {
    for (let i = 0; i < rows.length - 1; i++) {
      if (rows[i].z <= z && rows[i + 1].z >= z) {
        const f = (z - rows[i].z) / (rows[i + 1].z - rows[i].z || 1);
        return { y: rows[i].y + (rows[i + 1].y - rows[i].y) * f, scale: rows[i].scale + (rows[i + 1].scale - rows[i].scale) * f, X: rows[i].X + (rows[i + 1].X - rows[i].X) * f };
      }
    }
    return null;
  };
  const bgShift = -(rows.length ? rows[rows.length - 1].X : 0) * 12 - p.prog * 0.15;
  // sprites (everything standing on the road), far to near
  const sm = (s) => ((s % T.length) + T.length) % T.length;
  const rel = (s) => {
    let d = sm(s) - sm(camS);
    if (d < -T.length / 2) d += T.length;
    if (d > T.length / 2) d -= T.length;
    return d;
  };
  const sprites = [];
  const add = (s, x, kind, data) => {
    const z = rel(s);
    if (z < 3 || z > rows[rows.length - 1].z - 4) return;
    const L = lookup(z);
    if (!L) return;
    sprites.push({ z, L, x, kind, data });
  };
  for (const b of K.boxes) if (b.back <= 0) add(b.s, b.x, 'box', b);
  for (const pd of T.pads) add(pd.s, pd.x, 'pad', pd);
  for (const h of K.hay) if (!h.smashed) add(h.s, h.x, 'hay', h);
  for (const hz of K.hazards) add(hz.s, hz.x, 'pie', hz);
  for (const sh of K.shots) add(sh.s, sh.x, 'shot', sh);
  for (const r of K.rivals) add(r.s, r.x, 'kart', r);
  sprites.sort((a, b) => b.z - a.z);
  const place = placeOf(K, p);
  const spd = Math.round(p.v * 1.9);
  const fast = p.boost > 0 || drunk;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { transform: [{ translateX: shakeX }, { translateY: bump }] }]}>
        {SKY.map((cl, i) => (
          <View key={cl} style={{ position: 'absolute', left: 0, right: 0, top: (i * yH) / SKY.length, height: yH / SKY.length + 1, backgroundColor: cl }} />
        ))}
        <View style={{ position: 'absolute', left: W * 0.7 + bgShift * 0.1, top: yH * 0.2, width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff6b0' }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ position: 'absolute', left: ((i * W * 0.4 + bgShift * 0.5) % (W * 2.8)) - W * 0.4, top: yH - 38 - (i % 3) * 10, width: 0, height: 0, borderLeftWidth: 80 + (i % 3) * 20, borderRightWidth: 80 + (i % 3) * 20, borderBottomWidth: 50 + (i % 3) * 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: i % 2 ? '#5b8a5a' : '#4a7a52' }} />
        ))}
        {[0, 1, 2].map((i) => (
          <Text key={i} style={{ position: 'absolute', left: ((i * W * 0.55 + bgShift * 0.3) % (W * 1.6)) - 40, top: yH * 0.25 + i * 12, fontSize: 40, opacity: 0.9 }}>☁️</Text>
        ))}
        <View style={{ position: 'absolute', left: 0, right: 0, top: yH - 6, height: H - yH + 6, backgroundColor: '#5aa83a' }} />
        {/* the road, far to near */}
        {rows
          .slice()
          .reverse()
          .map((r) => {
            const band = Math.floor(r.s / (SEG * 2)) % 2 === 0;
            const cx = W / 2 + (r.X - camLat) * r.scale;
            const rw = r.scale;
            const rum = Math.max(2, rw * 0.1);
            return (
              <View key={r.y} style={{ position: 'absolute', left: 0, top: r.y, width: W, height: rowH + 1 }}>
                <View style={{ position: 'absolute', left: 0, top: 0, width: W, height: rowH + 1, backgroundColor: band ? '#5aa83a' : '#4e9a32' }} />
                <View style={{ position: 'absolute', left: cx - rw - rum, top: 0, width: rw * 2 + rum * 2, height: rowH + 1, backgroundColor: band ? '#d8352a' : '#f4f1e6' }} />
                <View style={{ position: 'absolute', left: cx - rw, top: 0, width: rw * 2, height: rowH + 1, backgroundColor: band ? '#8c8f96' : '#82858c' }} />
                {band && <View style={{ position: 'absolute', left: cx - Math.max(1, rw * 0.02), top: 0, width: Math.max(2, rw * 0.04), height: rowH + 1, backgroundColor: '#f4f1e6' }} />}
                {Math.floor(r.s / (SEG * 12)) % 2 === 0 && rw > 20 && <Text style={{ position: 'absolute', left: cx - rw - rw * 0.55, top: -rw * 0.5, fontSize: rw * 0.4 }}>🌲</Text>}
              </View>
            );
          })}
        {/* things on the road */}
        {sprites.map((sp, i) => {
          const { L } = sp;
          const x = W / 2 + (L.X - camLat + sp.x) * L.scale;
          const u = L.scale; // pixels per road-half-width here
          if (sp.kind === 'box') {
            const sz = u * 0.2;
            return (
              <View key={i} style={{ position: 'absolute', left: x - sz / 2, top: L.y - sz * 1.1, width: sz, height: sz, borderRadius: sz * 0.2, backgroundColor: '#e8b13a', borderWidth: 2, borderColor: '#8a5a12', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: sz * 0.7 }}>🛢️</Text>
                <View style={{ position: 'absolute', width: sz * 1.4, height: sz * 1.4, borderRadius: sz, backgroundColor: 'rgba(255,230,120,0.3)' }} />
              </View>
            );
          }
          if (sp.kind === 'pad') {
            const sz = u * 0.3;
            return <View key={i} style={{ position: 'absolute', left: x - sz, top: L.y - sz * 0.35, width: sz * 2, height: sz * 0.5, backgroundColor: '#ffd23a', borderRadius: 4, borderWidth: 2, borderColor: '#b58a1f', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: sz * 0.5, fontWeight: '900' }}>»»»</Text></View>;
          }
          if (sp.kind === 'hay') {
            const sz = u * 0.22;
            return <View key={i} style={{ position: 'absolute', left: x - sz, top: L.y - sz * 1.2, width: sz * 2, height: sz * 1.2, borderRadius: sz * 0.5, backgroundColor: '#e6c04a', borderWidth: 2, borderColor: '#a8801f' }}><View style={{ position: 'absolute', left: 0, right: 0, top: '45%', height: 2, backgroundColor: '#a8801f' }} /></View>;
          }
          if (sp.kind === 'pie') {
            const sz = u * 0.16;
            return <View key={i} style={{ position: 'absolute', left: x - sz, top: L.y - sz * 0.8, width: sz * 2, height: sz, borderRadius: sz, backgroundColor: '#5a3a1e', borderWidth: 2, borderColor: '#2a1a0a' }} />;
          }
          if (sp.kind === 'shot') {
            const sz = u * 0.2;
            return <Text key={i} style={{ position: 'absolute', left: x - sz / 2, top: L.y - sz * 1.3, fontSize: sz * 1.2, transform: [{ rotate: `${K.t * 900}deg` }] }}>🌽</Text>;
          }
          const w = u * 0.27;
          const r = sp.data;
          return (
            <View key={i} style={{ position: 'absolute', left: x - w / 2, top: L.y - w * 0.82 }}>
              <Kart w={w} color={r.color} head={r.head} steer={r.steer} drunk={r.drunk > 0} spin={r.spin} flash={r.flash} hay={r.hay} boost={r.boost} t={K.t} />
            </View>
          );
        })}
        {/* Billy */}
        <View style={{ position: 'absolute', left: W / 2 - W * 0.09, top: H - W * 0.17 * 0.9 - 14 }}>
          <Kart w={W * 0.18} color="#c0392b" head="🤠" steer={p.steer} drunk={drunk} spin={p.spin} flash={p.flash} hay={p.hay} boost={p.boost} t={K.t} />
        </View>
        {fast &&
          Array.from({ length: 10 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: i % 2 ? W * 0.05 + ((i * 53) % 90) : W * 0.95 - ((i * 37) % 90), top: yH + ((i * 61 + K.t * 400) % (H - yH)), width: 3, height: 26, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 2 }} />
          ))}
        {drunk && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,170,40,0.12)' }]} />}
      </View>

      {/* HUD */}
      <View style={{ position: 'absolute', top: 8, left: 44, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <View style={styles.itemBox}>
          <Text style={{ fontSize: 30 }}>{p.item ? ITEM_ICON[p.item] : ''}</Text>
          {!p.item && <Text style={styles.tiny}>ITEM</Text>}
        </View>
        <View>
          <Text style={styles.big}>{K.phase === 'finished' ? K.place : place}<Text style={styles.sub}>/6</Text></Text>
          <Text style={styles.small}>LAP {lapOf(K, p)}/{LAPS}</Text>
        </View>
      </View>
      <View style={{ position: 'absolute', top: 8, right: 120, alignItems: 'flex-end' }}>
        <Text style={styles.big}>{spd}<Text style={styles.sub}> km/h</Text></Text>
        {p.item && <Text style={styles.small}>{ITEM_NAME[p.item]}</Text>}
        {drunk && (
          <>
            <Text style={[styles.small, { color: '#ffd23a' }]}>🍺 DRUNK!</Text>
            <View style={{ width: 80, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(1, p.drunk / 6) * 100}%`, height: '100%', backgroundColor: '#ffb43a' }} />
            </View>
          </>
        )}
        {p.driftCharge > 0.1 && <Text style={[styles.small, { color: p.driftCharge > 0.8 ? '#ff9a2a' : '#fff' }]}>{p.driftCharge > 0.8 ? 'TURBO READY!' : 'DRIFTING...'}</Text>}
      </View>
      {K.text && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingBottom: H * 0.25 }]}>
          <Text style={[styles.banner, { fontSize: K.phase === 'countdown' ? 90 : 54 }]}>{K.text}</Text>
        </View>
      )}
    </View>
  );
}

const shadow = { textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4, textShadowOffset: { width: 1, height: 2 } };
const styles = StyleSheet.create({
  itemBox: { width: 54, height: 54, borderRadius: 12, backgroundColor: 'rgba(10,8,30,0.6)', borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  tiny: { position: 'absolute', bottom: 2, color: '#fff', fontSize: 8, fontWeight: '900', opacity: 0.6 },
  big: { color: '#ffd23a', fontWeight: '900', fontSize: 38, ...shadow },
  sub: { color: '#fff', fontSize: 16 },
  small: { color: '#fff', fontWeight: '800', fontSize: 11, letterSpacing: 1, ...shadow },
  banner: { color: '#ffd23a', fontWeight: '900', letterSpacing: 3, textAlign: 'center', textShadowColor: '#1a2a6a', textShadowRadius: 8, textShadowOffset: { width: 3, height: 4 } },
});

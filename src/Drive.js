import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VEHICLES, playerVehicle, stars } from '../engine/drive';
import { Jug, OneUp } from './Sprites';

const shadow = { textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 3, textShadowOffset: { width: 1, height: 2 } };

// ---------------------------------------------------------------------------
// The static town: grass, fields, roads, buildings, trees, signs. Drawn once.
const CROPS = { corn: '#c9c24c', wheat: '#d9b95c', hay: '#a9b94a' };
const ROOFS = ['#8a5a3c', '#7a4a3a', '#6b6f77', '#8c6a46'];

function Building({ b, ps }) {
  const style = { position: 'absolute', left: b.x * ps, top: b.y * ps, width: b.w * ps, height: b.h * ps };
  const w = b.w * ps;
  const h = b.h * ps;
  const label = b.label ? (
    <Text style={{ position: 'absolute', left: 0, right: 0, top: h / 2 - ps * 0.4, textAlign: 'center', fontSize: Math.max(8, ps * 0.5), fontWeight: '900', color: '#fff', ...shadow }}>{b.label}</Text>
  ) : null;
  switch (b.kind) {
    case 'barn':
      return (
        <View style={[style, { backgroundColor: '#b23a2e', borderWidth: 3, borderColor: '#6f1f18', borderRadius: 3 }]}>
          <View style={{ position: 'absolute', left: 0, top: h / 2 - 1, width: w, height: 3, backgroundColor: 'rgba(255,255,255,0.55)' }} />
          <View style={{ position: 'absolute', left: w / 2 - 1, top: 0, width: 3, height: h, backgroundColor: 'rgba(255,255,255,0.55)' }} />
        </View>
      );
    case 'silo':
      return (
        <View style={[style, { backgroundColor: '#c9ccd0', borderRadius: w, borderWidth: 3, borderColor: '#8a9096', alignItems: 'center', justifyContent: 'center' }]}>
          <View style={{ width: w * 0.4, height: w * 0.4, borderRadius: w, backgroundColor: '#aeb3b9' }} />
        </View>
      );
    case 'trailer':
      return (
        <View style={[style, { backgroundColor: '#dcdfe2', borderWidth: 2, borderColor: '#8d9399', borderRadius: 3 }]}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: h * 0.4, height: h * 0.18, backgroundColor: '#4a86c9' }} />
        </View>
      );
    case 'diner':
      return (
        <View style={[style, { backgroundColor: '#d94a4a', borderWidth: 3, borderColor: '#8a2424', borderRadius: 4, overflow: 'hidden' }]}>
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <View key={f} style={{ position: 'absolute', left: w * f, top: 0, width: w * 0.1, height: h, backgroundColor: 'rgba(255,255,255,0.8)' }} />
          ))}
          {label}
        </View>
      );
    case 'gas':
      return (
        <View style={[style, { backgroundColor: '#8a939e', borderWidth: 3, borderColor: '#4a525c', borderRadius: 4 }]}>
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: -ps * 0.6, height: ps * 0.8, backgroundColor: '#e0b030', opacity: 0.85 }} />
          {label}
        </View>
      );
    case 'general':
      return <View style={[style, { backgroundColor: '#c9a56a', borderWidth: 3, borderColor: '#7a5a2a', borderRadius: 4 }]}>{label}</View>;
    case 'bar':
      return <View style={[style, { backgroundColor: '#6b3f26', borderWidth: 3, borderColor: '#3a2012', borderRadius: 4 }]}>{label}</View>;
    case 'depot':
      return (
        <View style={[style, { backgroundColor: '#6e757d', borderWidth: 3, borderColor: '#3e444a', borderRadius: 3, overflow: 'hidden' }]}>
          {[0.2, 0.4, 0.6, 0.8].map((f) => (
            <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: h * f, height: 2, backgroundColor: 'rgba(255,255,255,0.25)' }} />
          ))}
          {label}
        </View>
      );
    case 'junkyard':
      return (
        <View style={[style, { backgroundColor: '#7a5a3a', borderWidth: 3, borderColor: '#4a3320', borderRadius: 3 }]}>
          {[[0.12, 0.2, '#9aa0a6'], [0.4, 0.5, '#a85a32'], [0.7, 0.2, '#8a8f94'], [0.82, 0.6, '#b0642e'], [0.25, 0.65, '#7c838a']].map(([x, y, c], i) => (
            <View key={i} style={{ position: 'absolute', left: w * x, top: h * y, width: ps * 2, height: ps * 1.4, borderRadius: ps * 0.5, backgroundColor: c }} />
          ))}
          {label}
        </View>
      );
    case 'church':
      return (
        <View style={[style, { backgroundColor: '#e8e4da', borderWidth: 3, borderColor: '#9a9588', borderRadius: 3, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: ps * 1.6, color: '#7a7466' }}>✝</Text>
        </View>
      );
    case 'outhouse':
      return (
        <View style={[style, { backgroundColor: '#8a5a2c', borderWidth: 2, borderColor: '#4a2f14', alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: ps * 0.8 }}>🌙</Text>
        </View>
      );
    case 'elevator':
      return (
        <View style={[style, { backgroundColor: '#c9c3b0', borderWidth: 3, borderColor: '#7a7466', borderRadius: 4 }]}>
          <View style={{ position: 'absolute', left: w * 0.1, top: h * 0.1, width: w * 0.8, height: h * 0.3, backgroundColor: '#a9a392', borderRadius: 3 }} />
          <View style={{ position: 'absolute', left: w * 0.3, top: h * 0.45, width: w * 0.4, height: w * 0.4, borderRadius: w, backgroundColor: '#b8b2a0', borderWidth: 3, borderColor: '#8a8472' }} />
          {label}
        </View>
      );
    case 'lodge':
      return (
        <View style={[style, { backgroundColor: '#7a5230', borderWidth: 3, borderColor: '#3f2814', borderRadius: 3 }]}>
          {[0.2, 0.4, 0.6, 0.8].map((f) => <View key={f} style={{ position: 'absolute', left: 0, right: 0, top: h * f, height: 2, backgroundColor: 'rgba(0,0,0,0.3)' }} />)}
        </View>
      );
    case 'quarry':
      return (
        <View style={[style, { backgroundColor: '#8f949b', borderWidth: 4, borderColor: '#5b6068', borderRadius: ps * 2 }]}>
          <View style={{ position: 'absolute', left: w * 0.1, top: h * 0.1, width: w * 0.8, height: h * 0.8, backgroundColor: '#6e747c', borderRadius: ps * 1.5 }} />
          <View style={{ position: 'absolute', left: w * 0.25, top: h * 0.25, width: w * 0.5, height: h * 0.5, backgroundColor: '#4b5057', borderRadius: ps }} />
          <View style={{ position: 'absolute', left: w * 0.38, top: h * 0.38, width: w * 0.24, height: h * 0.24, backgroundColor: '#2f3338', borderRadius: ps * 0.6 }} />
          {label}
        </View>
      );
    case 'dock':
      return (
        <View style={[style, { backgroundColor: '#9a7a4a', borderWidth: 2, borderColor: '#5a431f' }]}>
          {[0.25, 0.5, 0.75].map((f) => <View key={f} style={{ position: 'absolute', top: 0, bottom: 0, left: w * f, width: 2, backgroundColor: 'rgba(0,0,0,0.3)' }} />)}
        </View>
      );
    case 'store':
      if (b.label && b.label.startsWith('LITTLE')) {
        // a run-down fake: closed, a bit sad
        return (
          <View style={[style, { backgroundColor: '#5c6b7a', borderWidth: 3, borderColor: '#2d3640', borderRadius: 5 }]}>
            <Text style={{ position: 'absolute', left: 0, right: 0, top: h * 0.12, textAlign: 'center', fontSize: ps * 0.75, fontWeight: '900', color: '#c9d4de' }}>LITTLE AL'S</Text>
            <Text style={{ position: 'absolute', left: 0, right: 0, top: h * 0.42, textAlign: 'center', fontSize: ps * 0.6, fontWeight: '900', color: '#8895a3', letterSpacing: 2 }}>LIQUOR</Text>
            <Text style={{ position: 'absolute', left: 0, right: 0, bottom: ps * 0.3, textAlign: 'center', fontSize: ps * 0.7, fontWeight: '900', color: '#e0402a' }}>CLOSED</Text>
          </View>
        );
      }
      return (
        <View style={[style, { backgroundColor: '#5a2a7a', borderWidth: 4, borderColor: '#e0b030', borderRadius: 5 }]}>
          <View style={{ position: 'absolute', left: -ps * 0.5, top: -ps * 0.5, right: -ps * 0.5, bottom: -ps * 0.5, borderRadius: ps, backgroundColor: 'rgba(255,90,200,0.2)' }} />
          <Text style={{ position: 'absolute', left: 0, right: 0, top: h * 0.12, textAlign: 'center', fontSize: ps * 1.3, fontWeight: '900', color: '#ff5ad2', letterSpacing: 2, textShadowColor: '#ff5ad2', textShadowRadius: 12 }}>BIG AL'S</Text>
          <Text style={{ position: 'absolute', left: 0, right: 0, top: h * 0.45, textAlign: 'center', fontSize: ps * 0.9, fontWeight: '900', color: '#7dffe0', letterSpacing: 3, textShadowColor: '#7dffe0', textShadowRadius: 10 }}>LIQUOR</Text>
          <Text style={{ position: 'absolute', left: ps * 0.4, top: h * 0.2, fontSize: ps * 2.6 }}>🍾</Text>
          <Text style={{ position: 'absolute', right: ps * 0.4, top: h * 0.2, fontSize: ps * 2.6 }}>🥃</Text>
          <Text style={{ position: 'absolute', left: 0, right: 0, bottom: ps * 0.3, textAlign: 'center', fontSize: ps * 0.6, fontWeight: '900', color: '#fff' }}>OPEN 24 HRS</Text>
        </View>
      );
    default: {
      // houses
      const c = ROOFS[Math.floor(b.x + b.y) % ROOFS.length];
      return (
        <View style={[style, { backgroundColor: c, borderWidth: 3, borderColor: 'rgba(0,0,0,0.35)', borderRadius: 3 }]}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: h / 2 - 1, height: 3, backgroundColor: 'rgba(0,0,0,0.25)' }} />
        </View>
      );
    }
  }
}

// The map is 300x200 tiles, so only the chunks near the camera are drawn.
const CHUNK = 30;
const chunkCache = new WeakMap();

function chunksFor(L) {
  if (chunkCache.has(L)) return chunkCache.get(L);
  const map = new Map();
  const add = (item, x, y, w, h) => {
    for (let cy = Math.floor(y / CHUNK); cy <= Math.floor((y + h) / CHUNK); cy++)
      for (let cx = Math.floor(x / CHUNK); cx <= Math.floor((x + w) / CHUNK); cx++) {
        const k = `${cx},${cy}`;
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(item);
      }
  };
  L.fields.forEach((f, i) => add({ t: 'f', d: f, k: `f${i}` }, f.x, f.y, f.w, f.h));
  L.ponds.forEach((p, i) => add({ t: 'p', d: p, k: `p${i}` }, p.x, p.y, p.w, p.h));
  L.buildings.forEach((b, i) => add({ t: 'b', d: b, k: `b${i}` }, b.x, b.y, b.w, b.h));
  L.trees.forEach((tr, i) => add({ t: 't', d: tr, k: `t${i}` }, tr.x - 1, tr.y - 1, 2, 2));
  L.signs.forEach((sg, i) => add({ t: 's', d: sg, k: `s${i}` }, sg.x - 3, sg.y - 1, 6, 2));
  chunkCache.set(L, map);
  return map;
}

function StaticItem({ item, ps }) {
  const { t, d } = item;
  if (t === 'f') {
    return (
      <View style={{ position: 'absolute', left: d.x * ps, top: d.y * ps, width: d.w * ps, height: d.h * ps, backgroundColor: CROPS[d.crop], borderWidth: 2, borderColor: '#5a7a30', overflow: 'hidden' }}>
        {Array.from({ length: Math.floor(d.h / 1.6) }, (_, k) => (
          <View key={k} style={{ position: 'absolute', left: 0, right: 0, top: ps * (0.8 + k * 1.6), height: 2, backgroundColor: 'rgba(60,90,20,0.45)' }} />
        ))}
      </View>
    );
  }
  if (t === 'p') {
    return (
      <View style={{ position: 'absolute', left: d.x * ps, top: d.y * ps, width: d.w * ps, height: d.h * ps, backgroundColor: '#3f8fd0', borderRadius: ps * 5, borderWidth: 4, borderColor: '#a89870' }}>
        <View style={{ position: 'absolute', left: d.w * ps * 0.2, top: d.h * ps * 0.3, width: d.w * ps * 0.4, height: 3, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        <View style={{ position: 'absolute', left: d.w * ps * 0.5, top: d.h * ps * 0.6, width: d.w * ps * 0.3, height: 3, backgroundColor: 'rgba(255,255,255,0.35)' }} />
      </View>
    );
  }
  if (t === 'b') return <Building b={d} ps={ps} />;
  if (t === 't') {
    if (d.dead) {
      // the DEAD TREE: grey bare branches
      return (
        <View style={{ position: 'absolute', left: (d.x - 1.4) * ps, top: (d.y - 1.4) * ps, width: ps * 2.8, height: ps * 2.8, alignItems: 'center', justifyContent: 'center' }}>
          {[0, 45, 90, 135].map((a) => (
            <View key={a} style={{ position: 'absolute', width: ps * 2.6, height: 3, backgroundColor: '#6b6258', transform: [{ rotate: `${a}deg` }] }} />
          ))}
          <View style={{ width: ps * 0.9, height: ps * 0.9, borderRadius: ps, backgroundColor: '#51483f', borderWidth: 2, borderColor: '#2f2923' }} />
        </View>
      );
    }
    return <View style={{ position: 'absolute', left: (d.x - 0.9) * ps, top: (d.y - 0.9) * ps, width: ps * 1.8, height: ps * 1.8, borderRadius: ps, backgroundColor: '#2f8040', borderWidth: 3, borderColor: '#1d5a28' }} />;
  }
  // signs
  return (
    <View style={{ position: 'absolute', left: (d.x - 2.4) * ps, top: (d.y - 0.7) * ps, width: ps * 4.8, minHeight: ps * 1.4, backgroundColor: d.hand ? '#c8a46a' : '#e8c63a', borderWidth: 2, borderColor: d.hand ? '#5a3a1a' : '#5a4a10', borderRadius: 4, alignItems: 'center', justifyContent: 'center', padding: 2, transform: d.hand ? [{ rotate: '-4deg' }] : undefined }}>
      <Text style={{ fontSize: Math.max(7, ps * 0.42), fontWeight: '900', color: d.hand ? '#3a2a1a' : '#2a2208', fontStyle: d.hand ? 'italic' : 'normal', textAlign: 'center' }}>{d.text}</Text>
    </View>
  );
}

const Chunk = React.memo(function Chunk({ items, ps }) {
  return (
    <>
      {items.map((it) => (
        <StaticItem key={it.k} item={it} ps={ps} />
      ))}
    </>
  );
});

// The ground and the roads never change, and there are only a few of them
const Ground = React.memo(function Ground({ level, ps }) {
  const L = level;
  return (
    <>
      <View style={{ position: 'absolute', left: 0, top: 0, width: L.w * ps, height: L.h * ps, backgroundColor: '#78b05a' }} />
      {L.dirt.map((r, i) => (
        <View key={`d${i}`} style={{ position: 'absolute', left: r.x * ps, top: r.y * ps, width: r.w * ps, height: r.h * ps, backgroundColor: '#a8844f', borderWidth: 1, borderColor: '#8a6a3a' }} />
      ))}
      {L.roads.map((r, i) => (
        <View key={`r${i}`} style={{ position: 'absolute', left: r.x * ps, top: r.y * ps, width: r.w * ps, height: r.h * ps, backgroundColor: '#4b4e54' }}>
          {r.w > r.h ? (
            <>
              <View style={{ position: 'absolute', left: 0, right: 0, top: r.h * ps * 0.5 - 3, height: 2, backgroundColor: '#e8c63a' }} />
              <View style={{ position: 'absolute', left: 0, right: 0, top: r.h * ps * 0.5 + 1, height: 2, backgroundColor: '#e8c63a' }} />
            </>
          ) : (
            <>
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: r.w * ps * 0.5 - 3, width: 2, backgroundColor: '#e8c63a' }} />
              <View style={{ position: 'absolute', top: 0, bottom: 0, left: r.w * ps * 0.5 + 1, width: 2, backgroundColor: '#e8c63a' }} />
            </>
          )}
        </View>
      ))}
      {L.intersections.map((r, i) => (
        <View key={`x${i}`} style={{ position: 'absolute', left: r.x * ps, top: r.y * ps, width: r.w * ps, height: r.h * ps, backgroundColor: '#4b4e54' }} />
      ))}
    </>
  );
}, (a, b) => a.level === b.level && a.ps === b.ps);

export const StaticTown = React.memo(function StaticTown({ level, ps, keys }) {
  const map = chunksFor(level);
  return (
    <>
      <Ground level={level} ps={ps} />
      {keys.split('|').map((k) => (map.get(k) ? <Chunk key={k} items={map.get(k)} ps={ps} /> : null))}
    </>
  );
}, (a, b) => a.level === b.level && a.ps === b.ps && a.keys === b.keys);

// ---------------------------------------------------------------------------
// Vehicles, drawn from above with the front pointing right
function Wheel({ x, y, w, h }) {
  return <View style={{ position: 'absolute', left: x, top: y, width: w, height: h, backgroundColor: '#15171a', borderRadius: Math.min(w, h) * 0.3 }} />;
}

export function VehicleSprite({ v, ps, t, mine }) {
  const s = VEHICLES[v.type];
  const L = s.len * ps;
  const W = s.wid * ps;
  const dmg = v.hp / v.maxHp;
  const dead = v.wreck;
  const body = dead ? '#2a2523' : v.color;
  const lit = dead ? '#1a1615' : 'rgba(255,255,255,0.2)';
  const driver = dead ? null : mine ? '#e8c35a' : v.driver === 'civ' ? '#8a5a2c' : v.driver === 'cop' ? '#1f3a7a' : null;
  const lights = v.type === 'cop' && !dead;
  const flash = Math.floor(t * 8) % 2 === 0;
  return (
    <View style={{ position: 'absolute', left: v.x * ps - L / 2, top: v.y * ps - W / 2, width: L, height: W, transform: [{ rotate: `${v.h}rad` }] }}>
      <View style={{ position: 'absolute', left: 3, top: 4, width: L, height: W, borderRadius: ps * 0.3, backgroundColor: 'rgba(0,0,0,0.28)' }} />
      {v.type === 'tractor' ? (
        <>
          <Wheel x={L * 0.02} y={-W * 0.04} w={L * 0.36} h={W * 0.3} />
          <Wheel x={L * 0.02} y={W * 0.74} w={L * 0.36} h={W * 0.3} />
          <Wheel x={L * 0.72} y={W * 0.04} w={L * 0.18} h={W * 0.16} />
          <Wheel x={L * 0.72} y={W * 0.8} w={L * 0.18} h={W * 0.16} />
          <View style={{ position: 'absolute', left: L * 0.18, top: W * 0.24, width: L * 0.82, height: W * 0.52, backgroundColor: body, borderRadius: ps * 0.2 }} />
          <View style={{ position: 'absolute', left: L * 0.64, top: W * 0.28, width: L * 0.36, height: W * 0.44, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: ps * 0.15 }} />
          <View style={{ position: 'absolute', left: L * 0.18, top: W * 0.2, width: L * 0.36, height: W * 0.6, backgroundColor: dead ? '#1a1615' : '#e8e2c8', borderWidth: 2, borderColor: 'rgba(0,0,0,0.4)', borderRadius: ps * 0.15 }} />
          <View style={{ position: 'absolute', left: L * 0.8, top: W * 0.34, width: ps * 0.22, height: ps * 0.22, borderRadius: ps, backgroundColor: '#2a2a2a' }} />
        </>
      ) : v.type === 'trash' ? (
        <>
          {[0.1, 0.42, 0.74].map((f) => (
            <React.Fragment key={f}>
              <Wheel x={L * f} y={-W * 0.04} w={L * 0.14} h={W * 0.14} />
              <Wheel x={L * f} y={W * 0.9} w={L * 0.14} h={W * 0.14} />
            </React.Fragment>
          ))}
          <View style={{ position: 'absolute', left: 0, top: W * 0.06, width: L * 0.7, height: W * 0.88, backgroundColor: dead ? '#1a1615' : '#2f5a2f', borderWidth: 2, borderColor: 'rgba(0,0,0,0.5)', borderRadius: ps * 0.2, overflow: 'hidden' }}>
            {[0.25, 0.5, 0.75].map((f) => (
              <View key={f} style={{ position: 'absolute', left: `${f * 100}%`, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.35)' }} />
            ))}
          </View>
          <View style={{ position: 'absolute', left: L * 0.7, top: W * 0.1, width: L * 0.3, height: W * 0.8, backgroundColor: body, borderRadius: ps * 0.25 }} />
          <View style={{ position: 'absolute', left: L * 0.9, top: W * 0.16, width: L * 0.07, height: W * 0.68, backgroundColor: dead ? '#111' : '#a9d4f5', borderRadius: 3 }} />
          {!dead && <View style={{ position: 'absolute', left: L * 0.78, top: W * 0.42, width: ps * 0.3, height: ps * 0.3, borderRadius: ps, backgroundColor: flash ? '#ffb000' : '#7a5400' }} />}
        </>
      ) : (
        <>
          <Wheel x={L * 0.1} y={-W * 0.04} w={L * 0.2} h={W * 0.18} />
          <Wheel x={L * 0.1} y={W * 0.86} w={L * 0.2} h={W * 0.18} />
          <Wheel x={L * 0.68} y={-W * 0.04} w={L * 0.2} h={W * 0.18} />
          <Wheel x={L * 0.68} y={W * 0.86} w={L * 0.2} h={W * 0.18} />
          <View style={{ position: 'absolute', left: 0, top: W * 0.08, width: L, height: W * 0.84, backgroundColor: body, borderRadius: ps * 0.3 }} />
          {v.type === 'pickup' && <View style={{ position: 'absolute', left: L * 0.04, top: W * 0.16, width: L * 0.42, height: W * 0.68, backgroundColor: 'rgba(0,0,0,0.28)', borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)', borderRadius: 3 }} />}
          {v.type === 'cop' && <View style={{ position: 'absolute', left: L * 0.3, top: W * 0.08, width: L * 0.14, height: W * 0.84, backgroundColor: '#15171a' }} />}
          <View style={{ position: 'absolute', left: L * 0.5, top: W * 0.14, width: L * 0.38, height: W * 0.72, backgroundColor: lit, borderRadius: 4 }} />
          <View style={{ position: 'absolute', left: L * 0.74, top: W * 0.16, width: L * 0.1, height: W * 0.68, backgroundColor: dead ? '#111' : '#a9d4f5', borderRadius: 3 }} />
          {!dead && (
            <>
              <View style={{ position: 'absolute', left: L * 0.95, top: W * 0.14, width: L * 0.05, height: W * 0.14, backgroundColor: '#fff3b0' }} />
              <View style={{ position: 'absolute', left: L * 0.95, top: W * 0.72, width: L * 0.05, height: W * 0.14, backgroundColor: '#fff3b0' }} />
              <View style={{ position: 'absolute', left: 0, top: W * 0.14, width: L * 0.04, height: W * 0.14, backgroundColor: '#d92b2b' }} />
              <View style={{ position: 'absolute', left: 0, top: W * 0.72, width: L * 0.04, height: W * 0.14, backgroundColor: '#d92b2b' }} />
            </>
          )}
        </>
      )}
      {lights && (
        <>
          <View style={{ position: 'absolute', left: L * 0.55, top: W * 0.06, width: L * 0.1, height: W * 0.4, backgroundColor: flash ? '#ff2a2a' : '#5a1010' }} />
          <View style={{ position: 'absolute', left: L * 0.55, top: W * 0.54, width: L * 0.1, height: W * 0.4, backgroundColor: flash ? '#2a5aff' : '#101a5a' }} />
        </>
      )}
      {driver && <View style={{ position: 'absolute', left: L * (v.type === 'trash' ? 0.78 : v.type === 'tractor' ? 0.34 : 0.62) - ps * 0.2, top: W / 2 - ps * 0.2, width: ps * 0.4, height: ps * 0.4, borderRadius: ps, backgroundColor: driver, borderWidth: 2, borderColor: 'rgba(0,0,0,0.5)' }} />}
      {dead && <Text style={{ position: 'absolute', left: L * 0.2, top: -W * 0.2, fontSize: W * 1.2, opacity: 0.6 + 0.4 * Math.sin(t * 14) }}>🔥</Text>}
      {!dead && dmg < 0.5 && <Text style={{ position: 'absolute', left: -L * 0.1, top: -W * 0.3, fontSize: W * 0.8, opacity: 0.8 }}>{dmg < 0.25 ? '🔥' : '💨'}</Text>}
    </View>
  );
}

// Billy on foot, seen from above: straw hat over red flannel shoulders
export function BillyTop({ P, ps, t, gear = {} }) {
  const blink = P.invuln > 0 && Math.floor(P.invuln * 14) % 2 === 0;
  const r = ps * 0.5;
  const step = Math.sin(t * 14) * ps * 0.06;
  return (
    <View style={{ position: 'absolute', left: P.x * ps - r, top: P.y * ps - r, width: r * 2, height: r * 2, opacity: blink ? 0.4 : 1, transform: [{ rotate: `${P.h}rad` }] }}>
      <View style={{ position: 'absolute', left: r * 0.15 + step, top: r * 1.55, width: r * 0.7, height: r * 0.4, borderRadius: 3, backgroundColor: '#4a2c14' }} />
      <View style={{ position: 'absolute', left: r * 0.15 - step, top: r * 0.05, width: r * 0.7, height: r * 0.4, borderRadius: 3, backgroundColor: '#4a2c14' }} />
      <View style={{ position: 'absolute', left: r * 0.1, top: r * 0.3, width: r * 1.1, height: r * 1.4, borderRadius: r * 0.5, backgroundColor: gear.plate ? '#a9b4c2' : '#c0392b', borderWidth: 2, borderColor: 'rgba(0,0,0,0.4)' }} />
      <View style={{ position: 'absolute', left: r * 0.4, top: r * 0.55, width: r * 0.55, height: r * 0.9, backgroundColor: gear.plate ? '#8c98aa' : '#2e5aa8', borderRadius: 3 }} />
      <View style={{ position: 'absolute', left: r * 0.45, top: r * 0.15, width: r * 1.35, height: r * 1.7, borderRadius: r, backgroundColor: gear.knightHelm ? '#a9b4c2' : '#e8c35a', borderWidth: 2, borderColor: gear.knightHelm ? '#5b6675' : '#8b3a1a' }} />
      <View style={{ position: 'absolute', left: r * 0.8, top: r * 0.6, width: r * 0.65, height: r * 0.8, borderRadius: r, backgroundColor: gear.knightHelm ? '#8c98aa' : '#d8a84a' }} />
      <View style={{ position: 'absolute', left: r * 1.65, top: r * 0.8, width: r * 0.5, height: r * 0.4, borderRadius: 3, backgroundColor: '#a8541a' }} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// The world and HUD
const DIRS = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

function Minimap({ g, w }) {
  const L = g.level;
  const D = g.drive;
  const mw = w;
  const k = mw / L.w;
  const mh = L.h * k;
  const P = D.player;
  return (
    <View style={[styles.mini, { width: mw, height: mh }]}>
      {L.roads.map((r, i) => (
        <View key={i} style={{ position: 'absolute', left: r.x * k, top: r.y * k, width: Math.max(2, r.w * k), height: Math.max(2, r.h * k), backgroundColor: '#9aa3ad' }} />
      ))}
      {L.ponds.map((p, i) => (
        <View key={`p${i}`} style={{ position: 'absolute', left: p.x * k, top: p.y * k, width: p.w * k, height: p.h * k, backgroundColor: '#3f8fd0' }} />
      ))}
      {D.stage < L.clues.length && <Text style={{ position: 'absolute', left: L.clues[D.stage].x * k - 6, top: L.clues[D.stage].y * k - 9, fontSize: 14, fontWeight: '900', color: '#fff', textShadowColor: '#000', textShadowRadius: 3 }}>❓</Text>}
      {D.found && <Text style={{ position: 'absolute', left: L.store.cx * k - 7, top: L.store.cy * k - 9, fontSize: 14 }}>⭐</Text>}
      {D.vehicles.filter((v) => v.driver === 'cop' && !v.wreck).map((v) => (
        <View key={v.id} style={{ position: 'absolute', left: v.x * k - 2.5, top: v.y * k - 2.5, width: 5, height: 5, borderRadius: 3, backgroundColor: Math.floor(D.time * 6) % 2 ? '#ff3a3a' : '#3a6aff' }} />
      ))}
      <View style={{ position: 'absolute', left: P.x * k - 3.5, top: P.y * k - 3.5, width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffd23f', borderWidth: 1, borderColor: '#000' }} />
    </View>
  );
}

export function DriveView({ g, width, height }) {
  const L = g.level;
  const D = g.drive;
  const P = D.player;
  const ps = height / 14;
  const t = D.time;
  const pv = playerVehicle(D);
  const ox = width / 2 - D.cam.x * ps;
  const oy = height / 2 - D.cam.y * ps;
  const inView = (x, y, m = 4) => Math.abs(x - D.cam.x) < width / ps / 2 + m && Math.abs(y - D.cam.y) < height / ps / 2 + m;
  const viewW = width / ps;
  const viewH = height / ps;
  const ck = [];
  for (let cy = Math.floor((D.cam.y - viewH / 2 - 6) / CHUNK); cy <= Math.floor((D.cam.y + viewH / 2 + 6) / CHUNK); cy++)
    for (let cx = Math.floor((D.cam.x - viewW / 2 - 6) / CHUNK); cx <= Math.floor((D.cam.x + viewW / 2 + 6) / CHUNK); cx++) ck.push(`${cx},${cy}`);
  const chunkKeys = ck.join('|');
  const heat = stars(D);
  const flash = Math.floor(t * 5) % 2 === 0;
  const cops = D.vehicles.filter((v) => v.driver === 'cop' && !v.wreck).length;
  const objective = D.found
    ? "⭐ Big Al's is right here in the woods!"
    : D.stage < L.clues.length
    ? (D.stage === 0 ? L.startObjective : L.clues[D.stage].objective)
    : 'Follow the dirt road into the woods...';
  return (
    <>
      <View style={{ position: 'absolute', left: ox, top: oy, width: L.w * ps, height: L.h * ps }} pointerEvents="none">
        <StaticTown level={L} ps={ps} keys={chunkKeys} />
        {D.pickups.map((pk, i) =>
          pk.taken || !inView(pk.x, pk.y) ? null : pk.kind === 'life' ? <OneUp key={`k${i}`} x={pk.x - 0.5} y={pk.y - 0.5} ts={ps} t={t} /> : <Jug key={`k${i}`} x={pk.x - 0.5} y={pk.y - 0.5} ts={ps} t={t} />
        )}
        {D.peds.map((p) =>
          !inView(p.x, p.y) ? null : (
            <View key={p.id} style={{ position: 'absolute', left: p.x * ps - ps * 0.5, top: p.y * ps - ps * 0.5, width: ps, height: ps, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: p.state === 'stun' ? '90deg' : '0deg' }] }}>
              <Text style={{ fontSize: ps * 0.95 }}>🧑‍🌾</Text>
              {p.state === 'stun' && <Text style={{ position: 'absolute', top: -ps * 0.6, fontSize: ps * 0.6 }}>💫</Text>}
            </View>
          )
        )}
        {D.vehicles.map((v) => (inView(v.x, v.y, 6) ? <VehicleSprite key={v.id} v={v} ps={ps} t={t} mine={v.driver === 'player'} /> : null))}
        {!pv && <BillyTop P={P} ps={ps} t={t} gear={g.gear} />}
        {D.effects.map((e, i) =>
          e.kind === 'text' ? (
            <Text key={i} style={[styles.pop, { left: e.x * ps - ps * 2, top: (e.y - e.t * 1.4) * ps, width: ps * 4, fontSize: ps * 0.55, opacity: 1 - e.t * 0.7 }]}>
              {e.text}
            </Text>
          ) : e.kind === 'boom' ? (
            <Text key={i} style={{ position: 'absolute', left: e.x * ps - ps * e.size * 1.2, top: e.y * ps - ps * e.size * 1.2, fontSize: ps * e.size * 2.4 * (0.5 + e.t * 1.6), opacity: 1 - e.t * 1.2 }}>💥</Text>
          ) : (
            <Text key={i} style={{ position: 'absolute', left: e.x * ps - ps * 0.5, top: e.y * ps - ps * 0.5, fontSize: ps }}>✨</Text>
          )
        )}
      </View>

      {/* heat, ride and objective */}
      <View style={styles.driveHud} pointerEvents="none">
        <View style={styles.row}>
          <Text style={[styles.stars, { color: heat >= 1 && flash && cops > 0 ? '#ff6a6a' : '#ffd23f' }]}>{'★'.repeat(heat)}<Text style={{ color: 'rgba(255,255,255,0.4)' }}>{'★'.repeat(3 - Math.min(3, heat))}</Text></Text>
          {cops > 0 && <Text style={styles.cops}>🚓 ×{cops}</Text>}
        </View>
        <Text style={styles.ride}>{pv ? VEHICLES[pv.type].name.toUpperCase() : 'ON FOOT'}</Text>
        {pv && (
          <View style={styles.hpTrack}>
            <View style={[styles.hpFill, { width: `${Math.max(0, pv.hp / pv.maxHp) * 100}%`, backgroundColor: pv.hp / pv.maxHp > 0.5 ? '#5fd13a' : pv.hp / pv.maxHp > 0.25 ? '#f0b030' : '#e0402a' }]} />
          </View>
        )}
      </View>
      <View style={styles.objective} pointerEvents="none">
        <Text style={styles.objText}>{objective}</Text>
        {D.hint && <Text style={styles.hintText}>{D.hint.text}</Text>}
      </View>
      {D.bust > 0 && (
        <View style={styles.bust} pointerEvents="none">
          <Text style={styles.bustText}>BUSTED!</Text>
          <View style={styles.bustTrack}>
            <View style={{ width: `${Math.min(1, D.bust / 1.8) * 100}%`, height: '100%', backgroundColor: '#3a6aff' }} />
          </View>
        </View>
      )}
      <View style={styles.miniWrap} pointerEvents="none">
        <Minimap g={g} w={150} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  pop: { position: 'absolute', textAlign: 'center', fontWeight: '900', color: '#fff', ...shadow },
  driveHud: { position: 'absolute', left: 44, top: 66 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stars: { fontSize: 22, fontWeight: '900', ...shadow },
  cops: { fontSize: 14, fontWeight: '900', color: '#fff', ...shadow },
  ride: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: 1, marginTop: 2, ...shadow },
  hpTrack: { width: 110, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 2, borderColor: '#fff', overflow: 'hidden', marginTop: 2 },
  hpFill: { height: '100%' },
  objective: { position: 'absolute', top: 36, left: 0, right: 0, alignItems: 'center' },
  objText: { fontSize: 14, fontWeight: '900', color: '#fff', backgroundColor: 'rgba(20,20,30,0.65)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, overflow: 'hidden' },
  hintText: { marginTop: 6, fontSize: 14, fontWeight: '800', color: '#222', backgroundColor: '#ffe45e', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', maxWidth: 420, textAlign: 'center' },
  bust: { position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' },
  bustText: { fontSize: 30, fontWeight: '900', color: '#3a6aff', letterSpacing: 4, ...shadow },
  bustTrack: { width: 200, height: 12, borderRadius: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderWidth: 2, borderColor: '#fff', overflow: 'hidden', marginTop: 4 },
  miniWrap: { position: 'absolute', right: 44, top: 70 },
  mini: { backgroundColor: '#5a8a46', borderWidth: 2, borderColor: '#fff', borderRadius: 4, overflow: 'hidden', opacity: 0.92 },
});

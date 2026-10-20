import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SCENES } from '../engine/story';
import { GEAR } from '../engine/game';
import { Character, Natasha, gearEmoji } from './Sprites';

const NAMES = { billy: 'Billy', wizard: 'Merlinzo', natasha: 'Natasha', narrator: '', sign: '' };
const NAME_COLORS = { billy: '#3d7be0', wizard: '#8a4fd1', natasha: '#2aa6a6' };
const shadow = { textShadowColor: 'rgba(0,0,0,0.65)', textShadowRadius: 3, textShadowOffset: { width: 1, height: 2 } };

// What backdrop is showing at line `idx`: the last bg set at or before it
function bgAt(sc, idx) {
  let bg = sc.bg;
  for (let i = 0; i <= idx; i++) if (sc.lines[i].bg) bg = sc.lines[i].bg;
  return bg;
}

function Backdrop({ bg, w, h, t }) {
  const floorY = h * 0.62;
  switch (bg) {
    case 'throne':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2a1420' }]} />
          {[0.1, 0.35, 0.65, 0.9].map((f) => (
            <View key={f} style={{ position: 'absolute', left: w * f - 30, top: h * 0.08, width: 60, height: h * 0.64, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#3d2230', borderWidth: 3, borderColor: '#5a3446' }} />
          ))}
          <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#4a3a3a' }} />
          <View style={{ position: 'absolute', left: w * 0.3, right: w * 0.3, top: floorY, bottom: 0, backgroundColor: '#8c2230' }} />
          {[0.05, 0.5, 0.95].map((f, i) => (
            <Text key={i} style={{ position: 'absolute', left: w * f - 20, top: h * 0.45, fontSize: 36 }}>🔥</Text>
          ))}
        </View>
      );
    case 'tower':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#241a3f' }]} />
          {[0.18, 0.5, 0.82].map((f) => (
            <View key={f} style={{ position: 'absolute', left: w * f - 34, top: h * 0.1, width: 68, height: h * 0.5, borderTopLeftRadius: 34, borderTopRightRadius: 34, backgroundColor: '#3b2f66', borderWidth: 3, borderColor: '#5a4a90' }} />
          ))}
          {Array.from({ length: 14 }, (_, i) => (
            <Text key={i} style={{ position: 'absolute', left: ((i * 97) % 100) + '%', top: ((i * 41) % 60) + '%', fontSize: 14, opacity: 0.5 + 0.5 * Math.sin(t * 2 + i) }}>✦</Text>
          ))}
          <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#3b3050' }} />
        </View>
      );
    case 'dojo':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#6b4a32' }]} />
          {Array.from({ length: 6 }, (_, i) => (
            <View key={i} style={{ position: 'absolute', left: (w / 6) * i + 4, top: h * 0.08, width: w / 6 - 8, height: h * 0.64, backgroundColor: '#f3e6c9', borderWidth: 3, borderColor: '#4a2f1d' }}>
              <View style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 2, backgroundColor: '#c7b48a' }} />
            </View>
          ))}
          {[0.12, 0.5, 0.88].map((f, i) => (
            <Text key={i} style={{ position: 'absolute', left: w * f - 18, top: h * 0.02, fontSize: 34 }}>🏮</Text>
          ))}
          <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#8a5a33' }} />
        </View>
      );
    case 'interrogation':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#05050a' }]} />
          <View style={{ position: 'absolute', left: w / 2 - w * 0.22, top: h * 0.1, width: 0, height: 0, borderLeftWidth: w * 0.22, borderRightWidth: w * 0.22, borderBottomWidth: h * 0.62, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: `rgba(255,230,140,${0.14 + 0.04 * Math.sin(t * 3)})`, transform: [{ rotate: '180deg' }] }} />
          <Text style={{ position: 'absolute', left: w / 2 - 20, top: h * 0.02, fontSize: 38, transform: [{ rotate: `${Math.sin(t * 2) * 8}deg` }] }}>💡</Text>
          <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#14141c' }} />
        </View>
      );
    case 'home':
      return (
        <View style={StyleSheet.absoluteFill}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#8fd3ff' }]} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: h * 0.4, backgroundColor: '#ffb86b', opacity: 0.8 }} />
          <View style={{ position: 'absolute', left: w * 0.62, top: h * 0.14, width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff0a0' }} />
          <View style={{ position: 'absolute', left: -w * 0.1, top: h * 0.5, width: w * 0.7, height: h * 0.5, borderRadius: w, backgroundColor: '#6aaa64' }} />
          <View style={{ position: 'absolute', left: w * 0.4, top: h * 0.56, width: w * 0.8, height: h * 0.5, borderRadius: w, backgroundColor: '#5b9a58' }} />
          <Text style={{ position: 'absolute', left: w * 0.06, top: h * 0.2, fontSize: 80 }}>🏡</Text>
          <Text style={{ position: 'absolute', left: w * 0.3, top: h * 0.58, fontSize: 44 }}>🛻</Text>
          <View style={{ position: 'absolute', left: 0, right: 0, top: floorY, bottom: 0, backgroundColor: '#8a5a33' }} />
        </View>
      );
    default:
      return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]} />;
  }
}

function Pill({ color, onPress, label }) {
  const red = color === 'red';
  return (
    <Pressable onPress={onPress} style={styles.pillWrap} hitSlop={8}>
      <View style={[styles.pill, { backgroundColor: red ? '#d92b2b' : '#2a6fdb', borderColor: red ? '#8c1414' : '#173f86' }]}>
        <View style={{ position: 'absolute', left: 12, top: 5, width: 44, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' }} />
        {red && <Text style={styles.pillPrint}>TO BE CONTINUED</Text>}
      </View>
      <Text style={styles.pillLabel}>{label}</Text>
    </Pressable>
  );
}

export function SceneView({ g, width, height, onAdvance, onChoose }) {
  const sc = SCENES[g.scene.id];
  const idx = g.scene.idx;
  const line = sc.lines[idx];
  const bg = bgAt(sc, idx);
  const t = g.time;
  const dark = bg === 'black';
  const S = Math.min(height * 0.32, 128);
  const lastLine = idx === sc.lines.length - 1;
  const choosing = !!sc.choice && lastLine;
  const speaker = line.who;
  const [a, b] = sc.cast || [];
  const ko = line.fx === 'ko';
  const bobFor = (who) => (speaker === who ? Math.sin(t * 8) * 3 : 0);
  const gear = g.gear;
  const tied = bg === 'interrogation';
  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={() => !choosing && onAdvance()}>
      <Backdrop bg={bg} w={width} h={height} t={t} />

      {!dark && a && (
        <View style={{ position: 'absolute', left: width * 0.14, top: height * 0.62 - S * 0.95 + bobFor(a), opacity: speaker === a || speaker === 'narrator' || speaker === 'sign' ? 1 : 0.8, transform: [{ rotate: ko ? '80deg' : tied ? '-6deg' : '0deg' }] }}>
          <Character who={a} size={S} gear={gear} />
          {tied && <Text style={{ position: 'absolute', left: -6, top: S * 0.4, fontSize: S * 0.3 }}>🪢</Text>}
        </View>
      )}
      {!dark && b && (
        <View style={{ position: 'absolute', right: width * 0.14, top: height * 0.62 - S * (b === 'natasha' ? 0.72 : 0.95) + bobFor(b), opacity: speaker === b || speaker === 'narrator' || speaker === 'sign' ? 1 : 0.8 }}>
          <Character who={b} size={S} />
        </View>
      )}

      {line.fx === 'zap' && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <Text style={{ fontSize: 90, opacity: 0.55 + 0.45 * Math.sin(t * 14), transform: [{ scale: 1 + 0.15 * Math.sin(t * 10) }] }}>✨⚡✨</Text>
        </View>
      )}
      {ko && (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]} pointerEvents="none">
          <Text style={{ fontSize: 100 }}>💥</Text>
          <Text style={[{ fontSize: 44, fontWeight: '900', color: '#fff', letterSpacing: 4 }, shadow]}>K.O.!</Text>
        </View>
      )}

      {speaker === 'sign' ? (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', paddingBottom: 60 }]} pointerEvents="none">
          <View style={styles.note}>
            <View style={styles.tape} />
            <Text style={styles.noteText}>{line.text}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.box, { bottom: choosing ? height * 0.24 : 16 }]} pointerEvents="none">
          {NAMES[speaker] ? <Text style={[styles.name, { backgroundColor: NAME_COLORS[speaker] }]}>{NAMES[speaker]}</Text> : null}
          <Text style={[styles.lineText, speaker === 'narrator' && { fontStyle: 'italic', color: '#e9e2d0' }]}>{line.text}</Text>
          {!choosing && <Text style={styles.next}>tap ▶</Text>}
        </View>
      )}
      {speaker === 'sign' && <Text style={[styles.next, { position: 'absolute', bottom: 24, right: 28 }]}>tap ▶</Text>}

      {choosing && (
        <View style={styles.pills}>
          {sc.choice.map((c, i) => (
            <Pill key={c.color} color={c.color} label={c.label} onPress={() => onChoose(i)} />
          ))}
        </View>
      )}
    </Pressable>
  );
}

export function EndingView({ g, width, height, onRestart }) {
  const t = g.time;
  if (g.ending === 'tbc') {
    return (
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }]} onPress={onRestart}>
        <View style={[styles.bigPill, { backgroundColor: '#d92b2b' }]} />
        <Text style={[styles.tbc, { opacity: 0.75 + 0.25 * Math.sin(t * 3) }]}>TO BE CONTINUED...</Text>
        <Text style={styles.tbcSub}>Score {g.score}</Text>
        <Text style={styles.tapRestart}>Tap to play again</Text>
      </Pressable>
    );
  }
  const S = Math.min(height * 0.3, 120);
  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onRestart}>
      <Backdrop bg="home" w={width} h={height} t={t} />
      {Array.from({ length: 16 }, (_, i) => (
        <Text key={i} style={{ position: 'absolute', left: `${(i * 61) % 100}%`, top: `${((i * 37 + t * 18) % 100)}%`, fontSize: 18 + (i % 3) * 6 }}>{['🎉', '🍺', '⭐', '🌽'][i % 4]}</Text>
      ))}
      <View style={{ position: 'absolute', left: width * 0.62, top: height * 0.62 - S * 0.95 }}>
        <Character who="billy" size={S} gear={g.gear} />
      </View>
      <View style={{ position: 'absolute', left: width * 0.62 + S * 0.55, top: height * 0.62 - S * 0.4 }}>
        <Natasha size={S * 0.55} />
      </View>
      <View style={styles.endBox} pointerEvents="none">
        <Text style={styles.endTitle}>THE END</Text>
        <Text style={styles.endSub}>Billy lives happily ever after.</Text>
        <Text style={styles.endStats}>Score {g.score}   🤠 ×{g.lives}</Text>
        <Text style={styles.endGear}>{Object.keys(g.gear).filter((k) => g.gear[k]).map((k) => gearEmoji(k)).join(' ')}</Text>
        <Text style={styles.tapRestart}>Thanks for playing! Tap to play again</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', left: 24, right: 24, backgroundColor: 'rgba(10,10,20,0.86)', borderWidth: 2, borderColor: '#fff', borderRadius: 14, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 14 },
  name: { position: 'absolute', top: -14, left: 16, color: '#fff', fontWeight: '900', fontSize: 14, paddingHorizontal: 12, paddingVertical: 3, borderRadius: 10, overflow: 'hidden', letterSpacing: 1 },
  lineText: { color: '#fff', fontSize: 17, lineHeight: 24, fontWeight: '600' },
  next: { color: '#9be37a', fontWeight: '900', fontSize: 13, alignSelf: 'flex-end', marginTop: 4, ...shadow },
  note: { backgroundColor: '#ffe45e', paddingHorizontal: 28, paddingVertical: 24, transform: [{ rotate: '-3deg' }], maxWidth: 420, borderWidth: 1, borderColor: '#d9b92e' },
  tape: { position: 'absolute', top: -10, left: '40%', width: 60, height: 20, backgroundColor: 'rgba(255,255,255,0.6)', transform: [{ rotate: '4deg' }] },
  noteText: { fontSize: 24, fontWeight: '800', color: '#3a2d10', textAlign: 'center', lineHeight: 32, fontStyle: 'italic' },
  pills: { position: 'absolute', left: 0, right: 0, bottom: 20, flexDirection: 'row', justifyContent: 'center', gap: 50 },
  pillWrap: { alignItems: 'center' },
  pill: { width: 130, height: 50, borderRadius: 25, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  pillPrint: { fontSize: 8, fontWeight: '900', color: '#ffd2d2', letterSpacing: 1 },
  pillLabel: { color: '#fff', fontWeight: '900', fontSize: 15, marginTop: 6, ...shadow },
  bigPill: { width: 90, height: 36, borderRadius: 18, marginBottom: 18 },
  tbc: { color: '#e02b2b', fontSize: 44, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  tbcSub: { color: '#8a8a8a', fontSize: 16, marginTop: 10 },
  tapRestart: { color: '#9be37a', fontWeight: '800', fontSize: 16, marginTop: 18, ...shadow },
  endBox: { position: 'absolute', left: 30, top: 24, maxWidth: '55%' },
  endTitle: { fontSize: 54, fontWeight: '900', color: '#fff', letterSpacing: 4, ...shadow },
  endSub: { fontSize: 18, color: '#fff', marginTop: 4, ...shadow },
  endStats: { fontSize: 16, color: '#fff', fontWeight: '800', marginTop: 10, ...shadow },
  endGear: { fontSize: 22, marginTop: 6 },
});

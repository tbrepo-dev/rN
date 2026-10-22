// Tiny synth: banjo-ish music loop + sound effects. Web only (Web Audio); a no-op on native.
import { Platform } from 'react-native';

let ctx = null;
let master = null;
let muted = false;
let timer = null;
let nextTime = 0;
let noteIdx = 0;

// Each level has its own tune: bluegrass banjo, spacey synth, medieval lute
const CHORDS = {
  G: [196.0, 246.94, 293.66, 392.0],
  C: [261.63, 329.63, 392.0, 523.25],
  D: [293.66, 369.99, 440.0, 587.33],
  Am: [220.0, 261.63, 329.63, 440.0],
  F: [174.61, 261.63, 349.23, 440.0],
  Dm: [146.83, 220.0, 293.66, 349.23],
  Bb: [233.08, 293.66, 349.23, 466.16],
  E: [164.81, 246.94, 329.63, 415.3],
  Em: [164.81, 196.0, 246.94, 329.63],
};
const MUSIC = {
  holler: { prog: ['G', 'G', 'C', 'G', 'D', 'D', 'G', 'G'], roll: [0, 3, 2, 1, 3, 2, 1, 2], bpm: 150, type: 'sawtooth', oct: 1, vol: 1 },
  alien: { prog: ['Am', 'Am', 'F', 'C', 'Am', 'F', 'G', 'E'], roll: [0, 2, 3, 2, 1, 3, 2, 3], bpm: 118, type: 'square', oct: 2, vol: 0.55 },
  medieval: { prog: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Bb', 'Am', 'Dm'], roll: [0, 2, 1, 3, 2, 1, 3, 2], bpm: 104, type: 'triangle', oct: 1, vol: 1.7 },
  // Honkey's tower: a jumpy, urgent ostinato
  tower: { prog: ['Am', 'Am', 'E', 'E', 'Am', 'Am', 'F', 'E'], roll: [0, 3, 0, 3, 1, 3, 2, 3], bpm: 168, type: 'square', oct: 1, vol: 0.5 },
  // Hick Town: fast bluegrass for a getaway
  town: { prog: ['G', 'G', 'C', 'G', 'D', 'D', 'G', 'G'], roll: [0, 3, 2, 1, 3, 2, 1, 2], bpm: 176, type: 'sawtooth', oct: 1, vol: 0.9 },
  // Hell: a low, pounding minor ostinato
  hell: { prog: ['Em', 'Em', 'F', 'Em', 'Em', 'F', 'D', 'Em'], roll: [0, 0, 2, 0, 3, 0, 2, 1], bpm: 140, type: 'sawtooth', oct: 0.5, vol: 1.2 },
  // Pagoda: koto-like plucks
  // The Hive: a slow, dripping, dissonant creep
  hive: { prog: ['Em', 'Em', 'F', 'Em', 'Am', 'Am', 'F', 'E'], roll: [0, 3, 1, 3, 0, 2, 1, 3], bpm: 92, type: 'triangle', oct: 0.5, vol: 1.8 },
  egg: { prog: ['Am', 'F', 'Am', 'E', 'Am', 'F', 'E', 'E'], roll: [0, 2, 3, 2, 0, 1, 3, 1], bpm: 78, type: 'sine', oct: 1, vol: 2 },
  // The cage match: a fast, stompy minor groove
  fight: { prog: ['Em', 'Em', 'Am', 'Em', 'C', 'D', 'Em', 'E'], roll: [0, 3, 0, 2, 0, 3, 1, 2], bpm: 156, type: 'sawtooth', oct: 0.75, vol: 1.1 },
  japan: { prog: ['Am', 'Am', 'F', 'Am', 'Dm', 'Am', 'E', 'Am'], roll: [0, 2, 3, 1, 3, 2, 1, 2], bpm: 112, type: 'triangle', oct: 2, vol: 1.6 },
};
let tune = MUSIC.holler;
let eighth = 60 / tune.bpm / 2;

export function setMusicTheme(name) {
  tune = MUSIC[name] || MUSIC.holler;
  eighth = 60 / tune.bpm / 2;
  noteIdx = 0;
}

function pluck(freq, t, dur = 0.22, vol = 0.2, type = 'sawtooth') {
  const o = ctx.createOscillator();
  const f = ctx.createBiquadFilter();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  f.type = 'lowpass';
  f.frequency.setValueAtTime(3200, t);
  f.frequency.exponentialRampToValueAtTime(500, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(f).connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function slide(from, to, t, dur, vol = 0.2, type = 'square') {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function schedule() {
  if (!ctx) return;
  while (nextTime < ctx.currentTime + 0.3) {
    const bar = Math.floor(noteIdx / 8) % tune.prog.length;
    const chord = CHORDS[tune.prog[bar]];
    const n = tune.roll[noteIdx % 8];
    pluck(chord[n] * (n === 0 ? 0.5 : 1) * tune.oct, nextTime, 0.25, (n === 0 ? 0.13 : 0.08) * tune.vol, tune.type);
    nextTime += eighth;
    noteIdx++;
  }
}

export function initAudio() {
  if (Platform.OS !== 'web' || ctx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    if (ctx.resume) ctx.resume();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.6;
    master.connect(ctx.destination);
    nextTime = ctx.currentTime + 0.1;
    timer = setInterval(schedule, 100);
  } catch (e) {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : 0.6;
  return muted;
}

export const isMuted = () => muted;

const SFX = {
  jump: (t) => slide(330, 660, t, 0.14, 0.12),
  airjump: (t) => {
    slide(440, 880, t, 0.16, 0.12);
    pluck(1318, t + 0.05, 0.12, 0.08, 'triangle');
  },
  coin: (t) => {
    pluck(988, t, 0.1, 0.12, 'triangle');
    pluck(1318, t + 0.06, 0.2, 0.12, 'triangle');
  },
  stomp: (t) => slide(220, 70, t, 0.14, 0.2),
  hit: (t) => slide(300, 150, t, 0.08, 0.15),
  throw: (t) => slide(500, 900, t, 0.08, 0.07, 'triangle'),
  barrel: (t) => slide(140, 90, t, 0.12, 0.25, 'triangle'),
  bees: (t) => {
    for (let i = 0; i < 6; i++) slide(180 + (i % 2) * 20, 200, t + i * 0.05, 0.06, 0.06, 'sawtooth');
  },
  powerup: (t) => [392, 494, 587, 784].forEach((f, i) => pluck(f, t + i * 0.07, 0.2, 0.12, 'triangle')),
  rush: (t) => [196, 294, 392, 588, 784].forEach((f, i) => pluck(f, t + i * 0.05, 0.25, 0.13)),
  hurt: (t) => slide(400, 120, t, 0.3, 0.18, 'sawtooth'),
  die: (t) => [392, 330, 262, 196].forEach((f, i) => pluck(f, t + i * 0.16, 0.3, 0.16, 'triangle')),
  win: (t) => [392, 392, 523, 659, 784, 659, 784].forEach((f, i) => pluck(f, t + i * 0.11, 0.3, 0.14)),
  ray: (t) => slide(1400, 300, t, 0.14, 0.1, 'sawtooth'),
  slash: (t) => slide(900, 200, t, 0.1, 0.12, 'sawtooth'),
  block: (t) => {
    slide(700, 500, t, 0.05, 0.16, 'square');
    pluck(1100, t + 0.02, 0.1, 0.08, 'triangle');
  },
  gear: (t) => [523, 659, 784, 1047, 1319].forEach((f, i) => pluck(f, t + i * 0.06, 0.25, 0.12, 'triangle')),
  ammo: (t) => pluck(1568, t, 0.08, 0.08, 'triangle'),
  enemyshot: (t) => slide(600, 250, t, 0.12, 0.08, 'square'),
  life: (t) => [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => pluck(f, t + i * 0.07, 0.25, 0.12, 'square')),
  slam: (t) => {
    slide(120, 40, t, 0.3, 0.3, 'triangle');
    slide(90, 35, t + 0.04, 0.3, 0.2, 'sawtooth');
  },
  scene: (t) => pluck(660, t, 0.12, 0.08, 'triangle'),
  drink: (t) => {
    [180, 150, 200, 160].forEach((f, i) => slide(f, f * 0.6, t + i * 0.07, 0.09, 0.14, 'triangle'));
  },
  belch: (t) => {
    slide(160, 55, t, 0.45, 0.28, 'sawtooth');
    slide(90, 45, t + 0.05, 0.4, 0.2, 'square');
  },
  chomp: (t) => {
    slide(700, 250, t, 0.08, 0.15, 'square');
    slide(250, 700, t + 0.09, 0.08, 0.15, 'square');
  },
  burp: (t) => {
    slide(110, 40, t, 0.7, 0.3, 'sawtooth');
    slide(70, 35, t + 0.1, 0.6, 0.25, 'square');
  },
  honk: (t) => {
    slide(330, 330, t, 0.16, 0.12, 'square');
    slide(415, 415, t, 0.16, 0.1, 'square');
  },
  crash: (t) => {
    slide(220, 40, t, 0.25, 0.28, 'sawtooth');
    slide(1800, 200, t, 0.08, 0.1, 'square');
  },
  boom: (t) => {
    slide(140, 30, t, 0.7, 0.35, 'sawtooth');
    slide(300, 50, t, 0.5, 0.25, 'square');
  },
  siren: (t) => {
    slide(600, 900, t, 0.3, 0.1, 'sawtooth');
    slide(900, 600, t + 0.3, 0.3, 0.1, 'sawtooth');
  },
  carjack: (t) => {
    slide(900, 200, t, 0.18, 0.15, 'square');
    pluck(660, t + 0.12, 0.2, 0.1, 'triangle');
  },
  enter: (t) => slide(200, 120, t, 0.08, 0.14, 'square'),
  exit: (t) => slide(160, 220, t, 0.08, 0.14, 'square'),
  missile: (t) => {
    slide(240, 90, t, 0.35, 0.22, 'sawtooth');
    slide(1200, 200, t, 0.12, 0.08, 'square');
  },
  explode: (t) => {
    slide(160, 25, t, 0.6, 0.35, 'sawtooth');
    slide(500, 60, t, 0.35, 0.25, 'square');
    slide(90, 30, t + 0.05, 0.5, 0.25, 'triangle');
  },
  door: (t) => {
    slide(120, 60, t, 0.25, 0.18, 'square');
    pluck(880, t + 0.2, 0.2, 0.1, 'triangle');
    pluck(1320, t + 0.28, 0.25, 0.1, 'triangle');
  },
  break: (t) => {
    slide(300, 60, t, 0.3, 0.25, 'sawtooth');
    slide(1400, 200, t, 0.1, 0.1, 'square');
  },
  save: (t) => [523, 659, 784, 1047].forEach((f, i) => pluck(f, t + i * 0.1, 0.35, 0.12, 'sine')),
  tank: (t) => [392, 523, 659, 784, 1047, 1319].forEach((f, i) => pluck(f, t + i * 0.07, 0.3, 0.13, 'triangle')),
  screech: (t) => {
    slide(900, 2200, t, 0.5, 0.14, 'sawtooth');
    slide(1200, 1800, t + 0.1, 0.5, 0.1, 'square');
  },
  hatch: (t) => {
    slide(300, 100, t, 0.18, 0.18, 'triangle');
    slide(1000, 400, t + 0.05, 0.12, 0.1, 'square');
  },
  sizzle: (t) => {
    for (let i = 0; i < 5; i++) slide(2400 - i * 200, 900, t + i * 0.03, 0.05, 0.05, 'sawtooth');
  },
  portal: (t) => [220, 330, 440, 660, 880].forEach((f, i) => slide(f, f * 1.5, t + i * 0.05, 0.25, 0.1, 'sine')),
  punch: (t) => slide(260, 90, t, 0.08, 0.2, 'square'),
  kick: (t) => {
    slide(200, 60, t, 0.12, 0.26, 'sawtooth');
    slide(600, 150, t, 0.06, 0.1, 'square');
  },
  whiff: (t) => slide(700, 400, t, 0.06, 0.04, 'triangle'),
  fire: (t) => {
    slide(300, 900, t, 0.25, 0.14, 'sawtooth');
    slide(150, 450, t, 0.25, 0.1, 'square');
  },
  spin: (t) => [0, 1, 2, 3].forEach((i) => slide(500, 900, t + i * 0.12, 0.1, 0.08, 'triangle')),
  uppercut: (t) => slide(200, 900, t, 0.25, 0.16, 'sawtooth'),
  ko: (t) => {
    slide(160, 40, t, 0.8, 0.3, 'sawtooth');
    [392, 330, 262].forEach((f, i) => pluck(f, t + 0.1 + i * 0.18, 0.4, 0.12, 'triangle'));
  },
  round: (t) => [392, 523, 659, 784].forEach((f, i) => pluck(f, t + i * 0.07, 0.25, 0.13, 'square')),
  press: (t) => pluck(1568, t, 0.06, 0.08, 'triangle'),
  fatality: (t) => {
    slide(90, 30, t, 1.2, 0.35, 'sawtooth');
    slide(60, 25, t + 0.2, 1.2, 0.3, 'square');
    [196, 185, 175, 165].forEach((f, i) => pluck(f, t + 0.3 + i * 0.3, 0.8, 0.14, 'sawtooth'));
  },
  gameover: (t) => [330, 262, 196].forEach((f, i) => pluck(f, t + i * 0.25, 0.4, 0.14, 'triangle')),
};

export function play(name) {
  if (!ctx || muted) return;
  const fn = SFX[name];
  if (fn) {
    try {
      fn(ctx.currentTime);
    } catch (e) {}
  }
}

// Pausing the game pauses the music too
export function pauseAudio(paused) {
  if (!ctx) return;
  try {
    if (paused) ctx.suspend();
    else ctx.resume();
  } catch (e) {}
}

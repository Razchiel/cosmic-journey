// ============================================================
// COSMIC JOURNEY: Synthesized sound effects (no audio files)
// Usage: import { sfx } from '../hooks/useSfx.js'  ->  sfx.chime(2)
// Must be called from a user gesture (click/keypress) the first time.
// Fase 10: sfx.unlock() dipanggil dari ketukan gerbang masuk.
// ============================================================

let ctx = null
let master = null
let noiseBuf = null
let muted = false
try { muted = localStorage.getItem('cj-sfx-muted') === '1' } catch (_) { }

const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1174.66, 1318.51] // C major pentatonic-ish

function getCtx() {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.35
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function getNoise(c) {
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf
}

// Mengembalikan gain node agar suara bisa dihentikan lebih awal (lihat sfx.open)
function tone({ freq, to, type = 'sine', dur = 0.4, vol = 0.2, delay = 0, attack = 0.01 }) {
  const c = getCtx()
  if (!c) return null
  const t = c.currentTime + delay
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(attack, dur * 0.5))
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + dur + 0.05)
  return g
}

function noise({ dur = 1, vol = 0.2, from = 300, to = 3000, q = 1, delay = 0, swell = 0.5 }) {
  const c = getCtx()
  if (!c) return null
  const t = c.currentTime + delay
  const src = c.createBufferSource()
  src.buffer = getNoise(c)
  src.loop = true
  const f = c.createBiquadFilter()
  f.type = 'bandpass'
  f.Q.value = q
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = c.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + dur * swell)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f)
  f.connect(g)
  g.connect(master)
  src.start(t)
  src.stop(t + dur + 0.05)
  return g
}

export const sfx = {
  /** Buka AudioContext sfx dari gestur pengguna (iOS): resume + buffer senyap 1 sampel. */
  unlock() {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback' } catch (_) { }
    const c = getCtx()
    if (!c) return
    try {
      const b = c.createBuffer(1, 1, 22050)
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(c.destination)
      s.start(0)
    } catch (_) { }
  },

  /** Tiny tick for hovering cards */
  hover() { tone({ freq: 1400, to: 1800, dur: 0.06, vol: 0.035 }) },

  /** Generic soft click */
  click() { tone({ freq: 660, to: 440, dur: 0.09, vol: 0.12, type: 'triangle' }) },

  /** Bell-like chime. Pass an index (e.g. planet number) to vary the pitch. */
  chime(i = 0) {
    const f = SCALE[i % SCALE.length]
    tone({ freq: f, dur: 1.5, vol: 0.16 })
    tone({ freq: f * 2, dur: 0.9, vol: 0.05, delay: 0.01 })
    tone({ freq: f * 1.5, dur: 1.1, vol: 0.04, delay: 0.02 })
  },

  /** Deep swelling drone. Mengembalikan fungsi stop() yang memudarkan suara dengan cepat. */
  open() {
    const nodes = [
      tone({ freq: 55, to: 82, dur: 2.4, vol: 0.3, attack: 0.7 }),
      tone({ freq: 110, to: 165, dur: 2.4, vol: 0.1, attack: 0.9, type: 'triangle' }),
      noise({ dur: 2.4, vol: 0.07, from: 80, to: 420, q: 0.7, swell: 0.6 }),
    ].filter(Boolean)
    return () => {
      if (!ctx) return
      const t = ctx.currentTime
      nodes.forEach((g) => {
        try {
          const v = Math.max(g.gain.value, 0.0001)
          g.gain.cancelScheduledValues(t)
          g.gain.setValueAtTime(v, t)
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25)
        } catch (_) { }
      })
    }
  },

  /** Descending blip: closing / going back */
  close() { tone({ freq: 520, to: 180, dur: 0.35, vol: 0.14 }) },

  /** Hyperspace whoosh: warp jumps (tidak lagi dipakai intro) */
  warp(dur = 3) {
    noise({ dur, vol: 0.32, from: 200, to: 5200, q: 0.8, swell: 0.85 })
    tone({ freq: 80, to: 900, dur, vol: 0.08, type: 'sawtooth', attack: dur * 0.6 })
  },

  /** Ascending sparkle arpeggio: message revealed */
  reveal() {
    ;[523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) =>
      tone({ freq: f, dur: 1.6, vol: 0.13, delay: i * 0.12 })
    )
  },

  setMuted(m) {
    muted = !!m
    try { localStorage.setItem('cj-sfx-muted', muted ? '1' : '0') } catch (_) { }
  },
  isMuted() { return muted },
}
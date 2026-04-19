import { useState, useRef, useCallback, useEffect } from 'react'

// Generates ambient space music using Web Audio API
// No external MP3 needed — pure synthesis
export function useAmbientAudio() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const ctxRef = useRef(null)
  const masterGainRef = useRef(null)
  const nodesRef = useRef([])
  const intervalRef = useRef(null)

  const createCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      masterGainRef.current = ctxRef.current.createGain()
      masterGainRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime)
      masterGainRef.current.connect(ctxRef.current.destination)
    }
    return ctxRef.current
  }, [])

  // Chord: root + fifth + octave (spacey open voicing)
  const CHORDS = [
    [55.0, 82.4, 110.0, 146.8], // A minor
    [48.9, 73.4, 97.9, 130.8],  // G minor
    [51.9, 77.8, 103.8, 138.6], // Ab minor
    [58.3, 87.3, 116.5, 155.6], // Bb minor
  ]

  const startMusic = useCallback(() => {
    const ctx = createCtx()
    if (ctx.state === 'suspended') ctx.resume()

    const master = masterGainRef.current
    master.gain.linearRampToValueAtTime(volume * 0.7, ctx.currentTime + 3)

    const addDrone = (freq, type, gainAmt, delay = 0) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      const reverb = ctx.createConvolver()

      // Simple reverb via convolver
      const impulse = (() => {
        const len = ctx.sampleRate * 4
        const buf = ctx.createBuffer(2, len, ctx.sampleRate)
        for (let ch = 0; ch < 2; ch++) {
          const data = buf.getChannelData(ch)
          for (let i = 0; i < len; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3)
          }
        }
        return buf
      })()
      reverb.buffer = impulse

      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      // Gentle vibrato
      osc.frequency.linearRampToValueAtTime(
        freq * (1 + 0.002 * Math.random()),
        ctx.currentTime + 8 + delay
      )

      filter.type = 'lowpass'
      filter.frequency.value = 600 + Math.random() * 400
      filter.Q.value = 0.5

      gain.gain.setValueAtTime(0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(gainAmt, ctx.currentTime + 4 + delay)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(reverb)
      reverb.connect(master)
      osc.start(ctx.currentTime + delay)

      return { osc, gain }
    }

    // Build ambient texture
    const chord = CHORDS[0]
    const nodes = [
      addDrone(chord[0] / 2, 'sine', 0.25),       // sub bass
      addDrone(chord[0], 'sine', 0.18),             // root
      addDrone(chord[1], 'triangle', 0.12, 1),      // fifth
      addDrone(chord[2], 'sine', 0.09, 2),          // octave
      addDrone(chord[3], 'triangle', 0.06, 3),      // major third up
      addDrone(chord[0] * 4.01, 'sine', 0.04, 4),  // shimmer (slightly detuned)
    ]

    nodesRef.current = nodes
    setPlaying(true)

    // Slowly evolve the harmony every 30s
    let chordIdx = 0
    intervalRef.current = setInterval(() => {
      chordIdx = (chordIdx + 1) % CHORDS.length
      const newChord = CHORDS[chordIdx]
      nodes.forEach(({ osc }, i) => {
        const targetFreq = newChord[Math.min(i, newChord.length - 1)]
        const mult = [0.5, 1, 1, 1, 2, 4.01][i] || 1
        osc.frequency.linearRampToValueAtTime(targetFreq * mult, ctx.currentTime + 8)
      })
    }, 30000)
  }, [volume, createCtx])

  const stopMusic = useCallback(() => {
    const ctx = ctxRef.current
    const master = masterGainRef.current
    if (!ctx || !master) return

    clearInterval(intervalRef.current)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 2)

    setTimeout(() => {
      nodesRef.current.forEach(({ osc }) => {
        try { osc.stop() } catch (_) {}
      })
      nodesRef.current = []
    }, 2200)

    setPlaying(false)
  }, [])

  const toggleMusic = useCallback(() => {
    if (playing) stopMusic()
    else startMusic()
  }, [playing, startMusic, stopMusic])

  const setVolume = useCallback((val) => {
    setVolumeState(val)
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.linearRampToValueAtTime(
        val * 0.7,
        ctxRef.current.currentTime + 0.3
      )
    }
  }, [])

  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      nodesRef.current.forEach(({ osc }) => { try { osc.stop() } catch (_) {} })
    }
  }, [])

  return { playing, toggleMusic, volume, setVolume }
}

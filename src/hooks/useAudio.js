import { useState, useRef, useCallback, useEffect } from 'react'

const SECTION_MUSIC = {
  intro:      '/audio/intro.mp3',
  solar:      '/audio/solar.mp3',
  phenomena:  '/audio/phenomena.mp3',
  deepspace:  '/audio/deepspace.mp3',
  ending:     '/audio/ending.mp3',
  default:    '/audio/intro.mp3',
}

const FADE_DURATION = 2000
const FADE_STEPS = 40

export function useAmbientAudio() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)

  const currentAudio = useRef(null)
  const currentSrc   = useRef(null)

  const volumeRef  = useRef(0.5)
  const playingRef = useRef(false)

  useEffect(() => { playingRef.current = playing }, [playing])

  // 🔹 Smooth fade helper
  const fade = useCallback((audio, from, to, onDone) => {
    if (!audio) return

    let current = from
    const step = (to - from) / FADE_STEPS
    const interval = FADE_DURATION / FADE_STEPS

    const timer = setInterval(() => {
      current += step
      const clamped = Math.max(0, Math.min(1, current))
      audio.volume = clamped * volumeRef.current

      const done = step > 0 ? current >= to : current <= to
      if (done) {
        clearInterval(timer)
        onDone?.()
      }
    }, interval)

    return timer
  }, [])

  // 🔥 CROSSFADE CORE
  const crossfadeTo = useCallback((src) => {
    if (currentSrc.current === src) return

    const oldAudio = currentAudio.current

    const newAudio = new Audio(src)
    newAudio.loop = true
    newAudio.volume = 0

    newAudio.play()
      .then(() => {
        // 🔹 fade in audio baru
        fade(newAudio, 0, 1)

        // 🔹 fade out audio lama (bersamaan)
        if (oldAudio) {
          fade(
            oldAudio,
            oldAudio.volume / (volumeRef.current || 1),
            0,
            () => {
              oldAudio.pause()
              oldAudio.src = ''
            }
          )
        }
      })
      .catch(err => console.warn('[Audio] Autoplay blocked:', err.message))

    currentAudio.current = newAudio
    currentSrc.current = src
  }, [fade])

  const toggleMusic = useCallback(() => {
    if (!playingRef.current) {
      const src = currentSrc.current || SECTION_MUSIC.default
      crossfadeTo(src)
      setPlaying(true)
    } else {
      const audio = currentAudio.current
      if (audio) {
        fade(audio, audio.volume / (volumeRef.current || 1), 0, () => {
          audio.pause()
        })
      }
      setPlaying(false)
    }
  }, [crossfadeTo, fade])

  const changeSection = useCallback((sectionId) => {
    const src = SECTION_MUSIC[sectionId] ?? SECTION_MUSIC.default

    if (!playingRef.current) {
      currentSrc.current = src
      return
    }

    crossfadeTo(src)
  }, [crossfadeTo])

  const setVolume = useCallback((val) => {
    const v = Math.max(0, Math.min(1, val))
    setVolumeState(v)
    volumeRef.current = v

    if (currentAudio.current) {
      currentAudio.current.volume = v
    }
  }, [])

  useEffect(() => {
    Object.values(SECTION_MUSIC).forEach(src => {
      const audio = new Audio(src)
      audio.preload = 'auto'
    })
  }, [])

  return { playing, toggleMusic, volume, setVolume, changeSection }
}
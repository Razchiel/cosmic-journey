import { useState, useRef, useCallback, useEffect } from 'react'

const SECTION_MUSIC = {
  intro: '/audio/intro.mp3',
  solar: '/audio/solar.mp3',
  phenomena: '/audio/phenomena.mp3',
  deepspace: '/audio/deepspace.mp3',
  ending: '/audio/ending.mp3',
  default: '/audio/intro.mp3',
}

const FADE_DURATION = 1500
const FADE_STEPS = 30

export function useAmbientAudio() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const [audioProgress, setAudioProgress] = useState({ currentTime: 0, duration: 0, progress: 0 })

  const audioRef = useRef(null)
  const currentSrc = useRef(null)
  const volumeRef = useRef(0.5)

  const isPlaying = useRef(false)
  const manualPause = useRef(false) // Mencegah autoplay menyala jika user sudah sengaja pause
  const initAutoplay = useRef(false)

  const ctxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const gainNodeRef = useRef(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      const gain = ctx.createGain()
      gain.gain.value = volumeRef.current
      analyser.connect(gain)
      gain.connect(ctx.destination)
      ctxRef.current = ctx
      analyserRef.current = analyser
      gainNodeRef.current = gain
    }
    return ctxRef.current
  }, [])

  const connectAudio = useCallback((audioEl) => {
    const ctx = getCtx()
    if (ctx.state === 'suspended') ctx.resume()
    try { sourceRef.current?.disconnect() } catch (_) { }
    const src = ctx.createMediaElementSource(audioEl)
    src.connect(analyserRef.current)
    sourceRef.current = src
  }, [getCtx])

  const getAudioData = useCallback((targetArray) => {
    if (analyserRef.current && targetArray) {
      analyserRef.current.getByteFrequencyData(targetArray)
      return true
    }
    return false
  }, [])

  const fadeTo = useCallback((audioEl, from, to, onDone) => {
    if (!audioEl) return
    let current = from
    const step = (to - from) / FADE_STEPS
    const ms = FADE_DURATION / FADE_STEPS
    const timer = setInterval(() => {
      current += step
      const clamped = Math.max(0, Math.min(1, current))
      try { audioEl.volume = clamped * volumeRef.current } catch (_) { }
      const done = step > 0 ? current >= to : current <= to
      if (done) {
        clearInterval(timer); onDone?.()
      }
    }, ms)
    return timer
  }, [])

  const playSrc = useCallback((src) => {
    if (currentSrc.current === src && audioRef.current && !audioRef.current.paused) return null

    const oldAudio = audioRef.current
    if (oldAudio) {
      const oldVol = volumeRef.current > 0 ? oldAudio.volume / volumeRef.current : 0
      fadeTo(oldAudio, oldVol, 0, () => {
        oldAudio.pause()
        oldAudio.src = ''
      })
    }

    setAudioProgress({ currentTime: 0, duration: 0, progress: 0 })

    const audio = new Audio(src)
    audio.loop = true
    audio.volume = 0
    audio.crossOrigin = 'anonymous'
    audio.preload = 'auto'

    audio.addEventListener('error', () =>
      console.warn(`[useAudio] Gagal load: ${src} — pastikan file ada di public/audio/`)
    )

    audio.addEventListener('timeupdate', () => {
      setAudioProgress({
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
        progress: audio.duration ? (audio.currentTime / audio.duration) : 0,
      })
    })

    audioRef.current = audio
    currentSrc.current = src

    const playPromise = audio.play()
    playPromise.then(() => {
      connectAudio(audio)
      fadeTo(audio, 0, 1, null)
    }).catch(() => { })

    return playPromise
  }, [fadeTo, connectAudio])

  // Logika Autoplay di percobaan pertama web load
  useEffect(() => {
    if (initAutoplay.current) return
    initAutoplay.current = true

    const attemptPlay = () => {
      const src = SECTION_MUSIC.default
      const promise = playSrc(src)

      if (promise) {
        promise.then(() => {
          isPlaying.current = true
          setPlaying(true)
        }).catch(() => {
          // Autoplay diblokir, pasang listener interaksi sekali pakai
          const onInteract = async () => {
            if (manualPause.current || isPlaying.current) return

            const ctx = getCtx()
            if (ctx.state === 'suspended') await ctx.resume()

            const current = currentSrc.current || SECTION_MUSIC.default
            playSrc(current)?.then(() => {
              isPlaying.current = true
              setPlaying(true)
            }).catch(e => console.warn(e))
          }

          window.addEventListener('pointerdown', onInteract, { once: true })
          window.addEventListener('keydown', onInteract, { once: true })
          window.addEventListener('touchstart', onInteract, { once: true })
        })
      }
    }

    attemptPlay()
  }, [playSrc, getCtx])


  const toggleMusic = useCallback(() => {
    if (!isPlaying.current) {
      manualPause.current = false // User membatalkan pause
      const src = currentSrc.current || SECTION_MUSIC.default
      playSrc(src)?.then(() => {
        isPlaying.current = true
        setPlaying(true)
      })
    } else {
      manualPause.current = true // User menyengaja pause
      const audio = audioRef.current
      if (audio) {
        const vol = volumeRef.current > 0 ? audio.volume / volumeRef.current : 0
        fadeTo(audio, vol, 0, () => audio.pause())
      }
      isPlaying.current = false
      setPlaying(false)
    }
  }, [playSrc, fadeTo])

  const changeSection = useCallback((sectionId) => {
    const src = SECTION_MUSIC[sectionId] ?? SECTION_MUSIC.default
    if (src === currentSrc.current) return

    if (isPlaying.current) {
      playSrc(src)
    } else {
      currentSrc.current = src
    }
  }, [playSrc])

  const setVolume = useCallback((val) => {
    const v = Math.max(0, Math.min(1, val))
    setVolumeState(v)
    volumeRef.current = v
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.volume = v
    }
    if (gainNodeRef.current) gainNodeRef.current.gain.value = v
  }, [])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause(); audioRef.current.src = ''
      }
      try { ctxRef.current?.close() } catch (_) { }
    }
  }, [])

  return { playing, toggleMusic, volume, setVolume, changeSection, getAudioData, audioProgress }
}
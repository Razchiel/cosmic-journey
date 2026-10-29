import { useState, useRef, useCallback, useEffect } from 'react'

const SECTION_MUSIC = {
  intro: '/audio/intro.mp3',
  solar: '/audio/solar.mp3',
  phenomena: '/audio/phenomena.mp3',
  deepspace: '/audio/deepspace.mp3',
  ending: '/audio/ending.mp3',
  wishing: '/audio/ending.mp3', // lanjut dari Ending tanpa putus (src sama: tidak crossfade)
  gallery: '/audio/intro.mp3', // hangat & ramah, seperti kembali ke titik berangkat
  default: '/audio/intro.mp3',
}

const FADE_DURATION = 1500
const PRELOAD_DELAY = 1200 // beri waktu render + tekstur Bumi dulu, baru musik Intro disiapkan

// iOS: volume elemen audio DIABAIKAN, jadi fade dan volume lewat GainNode.
// Rantai per track: elemen -> MediaElementSource -> trackGain (fade) -> analyser -> master (volume) -> speaker.

const iosAudioSession = () => {
  // Safari 16.4+: jalur 'playback' tetap bunyi walau tombol senyap menyala
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback' } catch (_) { }
}

// Hemat data seluler: 'none' = tidak mengunduh apa pun sebelum diketuk
function preloadMode() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection
  if (!c) return 'auto' // iOS Safari tidak punya API ini (dan memang mengabaikan preload)
  if (c.saveData) return 'none'
  if (/(^|-)2g$/.test(c.effectiveType || '')) return 'none'
  if (c.effectiveType === '3g' || c.type === 'cellular') return 'metadata'
  return 'auto'
}

// resume() di Safari lama bisa mengembalikan undefined
const softResume = (ctx) => {
  try {
    const r = ctx.resume()
    r?.catch?.(() => { })
  } catch (_) { }
}

export function useAmbientAudio() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const [audioProgress, setAudioProgress] = useState({ currentTime: 0, duration: 0, progress: 0 })
  // true = pengunjung ingin suara tetapi AudioContext belum running (iOS senyap/interupsi, atau play gagal)
  const [blocked, setBlocked] = useState(false)

  const audioRef = useRef(null)
  const preparedRef = useRef(null) // elemen musik Intro yang sudah disiapkan sebelum gerbang diketuk
  const currentSrc = useRef(null)
  const volumeRef = useRef(0.5)

  const isPlaying = useRef(false)
  const manualPause = useRef(false) // pengguna sengaja pause / memilih tanpa suara
  const wantSound = useRef(false)   // pengguna pernah memilih suara (gerbang atau tombol play)
  const started = useRef(false)     // gerbang sudah diketuk

  const ctxRef = useRef(null)
  const analyserRef = useRef(null)
  const gainNodeRef = useRef(null)

  const syncBlocked = useCallback(() => {
    const ctx = ctxRef.current
    const want = wantSound.current && !manualPause.current
    setBlocked(!!(want && ctx && ctx.state !== 'running'))
  }, [])

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      const ctx = new AC()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.8
      const master = ctx.createGain()
      master.gain.value = volumeRef.current
      analyser.connect(master)
      master.connect(ctx.destination)
      ctx.onstatechange = syncBlocked
      ctxRef.current = ctx
      analyserRef.current = analyser
      gainNodeRef.current = master
    }
    return ctxRef.current
  }, [syncBlocked])

  // Sambungkan elemen ke grafik audio SEBELUM play(), dengan gain 0 (tidak ada letupan di iOS).
  // Idempotent. Mengembalikan true bila WebAudio dipakai.
  const connectAudio = useCallback((audio) => {
    if (audioRef.current !== audio) return false
    try {
      const ctx = getCtx()
      if (!ctx) {
        try { audio.volume = 0 } catch (_) { }
        return false
      }
      if (ctx.state !== 'running') softResume(ctx)
      if (!audio._node) {
        audio._node = ctx.createMediaElementSource(audio)
        audio._gain = ctx.createGain()
        audio._gain.gain.value = 0
        audio._node.connect(audio._gain)
        audio._gain.connect(analyserRef.current)
      }
      return true
    } catch (_) {
      try { audio.volume = 0 } catch (__) { }
      return false
    }
  }, [getCtx])

  const getAudioData = useCallback((targetArray) => {
    if (analyserRef.current && targetArray) {
      analyserRef.current.getByteFrequencyData(targetArray)
      return true
    }
    return false
  }, [])

  // Fade level track (0..1). Satu timer selesai per elemen: fade baru membatalkan yang lama.
  // Cadangan tanpa WebAudio: volume elemen diubah langsung (tanpa fade halus).
  const rampTo = useCallback((audio, level, ms = FADE_DURATION, onDone) => {
    if (!audio) return
    clearTimeout(audio._fadeT)
    const ctx = ctxRef.current
    if (audio._gain && ctx) {
      const p = audio._gain.gain
      const t = ctx.currentTime
      p.cancelScheduledValues(t)
      p.setValueAtTime(p.value, t)
      p.linearRampToValueAtTime(level, t + ms / 1000)
    } else {
      try { audio.volume = level * volumeRef.current } catch (_) { }
    }
    if (onDone) audio._fadeT = setTimeout(onDone, ms + 40)
  }, [])

  // Pensiunkan elemen audio: fade-out, lalu bebaskan (tanpa src='' agar tidak memicu error)
  const retire = useCallback((audio) => {
    if (!audio || audio._retired) return
    audio._retired = true
    rampTo(audio, 0, FADE_DURATION, () => {
      audio.pause()
      audio.onerror = null
      audio.ontimeupdate = null
      audio.removeAttribute('src')
      try { audio.load() } catch (_) { }
      try { audio._node?.disconnect() } catch (_) { }
      try { audio._gain?.disconnect() } catch (_) { }
    })
  }, [rampTo])

  const createTrack = useCallback((src, preload = 'auto') => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.loop = true
    audio.preload = preload
    audio._key = src

    audio.onerror = () => {
      if (audioRef.current === audio) {
        console.warn(`[useAudio] Gagal load: ${src}. Pastikan file ada di public/audio/`)
      }
    }

    // Update progres paling sering 1x per detik (UI hanya menampilkan detik)
    let lastSec = -1
    audio.ontimeupdate = () => {
      if (audioRef.current !== audio) return
      const sec = Math.floor(audio.currentTime)
      if (sec === lastSec) return
      lastSec = sec
      setAudioProgress({
        currentTime: audio.currentTime,
        duration: audio.duration || 0,
        progress: audio.duration ? (audio.currentTime / audio.duration) : 0,
      })
    }

    audio.src = src
    return audio
  }, [])

  // Mengembalikan Promise (menolak jika browser memblokir atau play dibatalkan).
  // Untuk iOS, pemanggilan pertama harus sinkron di dalam handler gestur.
  const playSrc = useCallback((src) => {
    const cur = audioRef.current

    // Track yang sama sudah ada: lanjutkan (membatalkan fade-out yang belum selesai)
    if (cur && cur._key === src && !cur._retired) {
      connectAudio(cur)
      const p = cur.paused ? cur.play() : Promise.resolve()
      return p.then(() => {
        if (audioRef.current !== cur) return
        rampTo(cur, 1)
      })
    }

    retire(cur)
    setAudioProgress({ currentTime: 0, duration: 0, progress: 0 })

    let audio
    if (preparedRef.current && preparedRef.current._key === src) {
      audio = preparedRef.current
      preparedRef.current = null
    } else {
      audio = createTrack(src)
    }

    audioRef.current = audio
    currentSrc.current = src

    connectAudio(audio) // gain 0 sebelum play
    return audio.play().then(() => {
      if (audioRef.current !== audio) return // sudah digantikan selagi menunggu
      rampTo(audio, 1)
    })
  }, [connectAudio, createTrack, retire, rampTo])

  // Dipanggil SEKALI dari ketukan gerbang. withSound=false: tanpa musik (tombol play tetap bisa dipakai).
  const startAudio = useCallback((withSound) => {
    if (started.current) return
    started.current = true
    if (!withSound) {
      manualPause.current = true
      return
    }
    wantSound.current = true
    manualPause.current = false
    iosAudioSession()
    playSrc(currentSrc.current || SECTION_MUSIC.intro)
      .then(() => {
        isPlaying.current = true
        setPlaying(true)
        setTimeout(syncBlocked, 500)
      })
      .catch(() => setBlocked(true))
  }, [playSrc, syncBlocked])

  // Elemen yang dijeda sistem (iOS saat interupsi) dinyalakan lagi bila pengunjung masih ingin musik
  const kick = useCallback(() => {
    const a = audioRef.current
    if (a && a.paused && isPlaying.current && !manualPause.current) a.play().catch(() => { })
  }, [])

  // Dipanggil dari petunjuk "Sound is paused" (ketukan pengunjung = gestur sah)
  const resumeAudio = useCallback(() => {
    if (!wantSound.current) return
    manualPause.current = false
    iosAudioSession()
    const ctx = ctxRef.current
    if (ctx) softResume(ctx)
    if (!isPlaying.current) {
      playSrc(currentSrc.current || SECTION_MUSIC.intro)
        .then(() => {
          isPlaying.current = true
          setPlaying(true)
        })
        .catch(() => { })
    } else {
      kick()
    }
    setTimeout(syncBlocked, 500)
  }, [playSrc, kick, syncBlocked])

  const toggleMusic = useCallback(() => {
    if (!isPlaying.current) {
      manualPause.current = false
      wantSound.current = true
      started.current = true
      iosAudioSession()
      playSrc(currentSrc.current || SECTION_MUSIC.intro)
        .then(() => {
          isPlaying.current = true
          setPlaying(true)
          setTimeout(syncBlocked, 500)
        })
        .catch(() => { })
    } else {
      manualPause.current = true
      const audio = audioRef.current
      if (audio) rampTo(audio, 0, FADE_DURATION, () => audio.pause())
      isPlaying.current = false
      setPlaying(false)
      setBlocked(false)
    }
  }, [playSrc, rampTo, syncBlocked])

  const changeSection = useCallback((sectionId) => {
    const src = SECTION_MUSIC[sectionId] ?? SECTION_MUSIC.default
    if (src === currentSrc.current) return

    if (isPlaying.current) {
      playSrc(src).catch(() => { })
    } else {
      currentSrc.current = src
    }
  }, [playSrc])

  const setVolume = useCallback((val) => {
    const v = Math.max(0, Math.min(1, val))
    setVolumeState(v)
    volumeRef.current = v
    const ctx = ctxRef.current
    if (gainNodeRef.current && ctx) {
      gainNodeRef.current.gain.setTargetAtTime(v, ctx.currentTime, 0.02)
    } else {
      const a = audioRef.current
      if (a && !a.paused) { try { a.volume = v } catch (_) { } }
    }
  }, [])

  // Kembali ke tab / aplikasi: coba hidupkan lagi AudioContext (iOS menandainya 'interrupted')
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      const ctx = ctxRef.current
      if (ctx && wantSound.current && !manualPause.current) {
        if (ctx.state !== 'running') softResume(ctx)
        kick()
        setTimeout(syncBlocked, 500)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [kick, syncBlocked])

  // Siapkan musik Intro lebih awal, tanpa memblokir render dan hemat data seluler
  useEffect(() => {
    let cancelled = false
    let idleId = 0
    const run = () => {
      if (cancelled || preparedRef.current || audioRef.current) return
      preparedRef.current = createTrack(SECTION_MUSIC.intro, preloadMode())
    }
    const timer = setTimeout(() => {
      if (window.requestIdleCallback) idleId = window.requestIdleCallback(run, { timeout: 2000 })
      else run()
    }, PRELOAD_DELAY)
    return () => {
      cancelled = true
      clearTimeout(timer)
      if (idleId && window.cancelIdleCallback) window.cancelIdleCallback(idleId)
      const p = preparedRef.current
      preparedRef.current = null
      if (p) {
        p.onerror = null
        p.ontimeupdate = null
        p.removeAttribute('src')
        try { p.load() } catch (_) { }
      }
    }
  }, [createTrack])

  useEffect(() => {
    return () => {
      started.current = false // StrictMode: mount ulang mulai dari keadaan bersih
      const a = audioRef.current
      if (a) {
        clearTimeout(a._fadeT)
        a.pause()
        a.onerror = null
        a.ontimeupdate = null
        a.removeAttribute('src')
        try { a.load() } catch (_) { }
      }
      audioRef.current = null
      currentSrc.current = null
      isPlaying.current = false
      try { if (ctxRef.current) ctxRef.current.onstatechange = null } catch (_) { }
      try { ctxRef.current?.close() } catch (_) { }
      ctxRef.current = null
      analyserRef.current = null
      gainNodeRef.current = null
    }
  }, [])

  return {
    playing,
    toggleMusic,
    volume,
    setVolume,
    changeSection,
    getAudioData,
    audioProgress,
    startAudio,
    blocked,
    resumeAudio,
  }
}
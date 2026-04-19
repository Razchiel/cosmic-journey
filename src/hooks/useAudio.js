import { useState, useRef, useCallback, useEffect } from 'react'

// ============================================================
// Pemetaan section → file musik
// Letakkan file MP3 kamu di folder: public/audio/
// Ganti nama file sesuai yang kamu punya
// ============================================================
const SECTION_MUSIC = {
  intro:      '/audio/intro.mp3',
  solar:      '/audio/solar.mp3',
  phenomena:  '/audio/phenomena.mp3',
  deepspace:  '/audio/deepspace.mp3',
  ending:     '/audio/ending.mp3',
  default:    '/audio/solar.mp3',   // fallback kalau section tidak dikenali
}

// Durasi fade in/out dalam milidetik
const FADE_DURATION = 1500
const FADE_STEPS = 30

export function useAmbientAudio() {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.5)

  const audioRef = useRef(null)        // HTMLAudioElement aktif
  const fadeTimerRef = useRef(null)    // interval untuk fade
  const currentSrcRef = useRef(null)   // src yang sedang diputar
  const volumeRef = useRef(0.5)        // volume terkini (tanpa re-render)

  // ── Helpers ──────────────────────────────────────────────

  // Hentikan fade yang sedang berjalan
  const clearFade = useCallback(() => {
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }, [])

  // Fade volume audio dari `from` ke `to`, lalu panggil `onDone`
  const fadeTo = useCallback((audioEl, from, to, onDone) => {
    clearFade()
    if (!audioEl) return

    const step = (to - from) / FADE_STEPS
    const interval = FADE_DURATION / FADE_STEPS
    let current = from

    fadeTimerRef.current = setInterval(() => {
      current += step
      const clamped = Math.max(0, Math.min(1, current))
      audioEl.volume = clamped * volumeRef.current

      if ((step > 0 && current >= to) || (step < 0 && current <= to)) {
        clearFade()
        if (onDone) onDone()
      }
    }, interval)
  }, [clearFade])

  // ── Core: mulai putar file tertentu ──────────────────────
  const playSrc = useCallback((src) => {
    // Kalau src sama dan sudah main, tidak perlu restart
    if (currentSrcRef.current === src && audioRef.current && !audioRef.current.paused) {
      return
    }

    // Fade out audio lama lalu ganti
    if (audioRef.current && !audioRef.current.paused) {
      const oldAudio = audioRef.current
      fadeTo(oldAudio, 1, 0, () => {
        oldAudio.pause()
        oldAudio.src = ''
      })
    }

    // Buat audio baru
    const audio = new Audio(src)
    audio.loop = true
    audio.volume = 0   // mulai dari 0, lalu fade in

    audio.addEventListener('error', () => {
      console.warn(`[useAudio] Gagal load: ${src}. Pastikan file ada di public/audio/`)
    })

    audio.play().then(() => {
      fadeTo(audio, 0, 1, null)   // fade in
    }).catch((err) => {
      console.warn('[useAudio] Browser memblokir autoplay:', err.message)
    })

    audioRef.current = audio
    currentSrcRef.current = src
  }, [fadeTo])

  // ── Toggle play/pause ─────────────────────────────────────
  const toggleMusic = useCallback(() => {
    if (!playing) {
      // Mulai putar
      const src = currentSrcRef.current || SECTION_MUSIC.default
      playSrc(src)
      setPlaying(true)
    } else {
      // Pause dengan fade out
      if (audioRef.current) {
        const audio = audioRef.current
        fadeTo(audio, 1, 0, () => {
          audio.pause()
        })
      }
      setPlaying(false)
    }
  }, [playing, playSrc, fadeTo])

  // ── Ganti musik saat section berubah ─────────────────────
  // Panggil fungsi ini dari App.jsx dengan activeSection sebagai argumen
  const changeSection = useCallback((sectionId) => {
    const src = SECTION_MUSIC[sectionId] || SECTION_MUSIC.default

    // Hanya ganti kalau musik sedang diputar dan srcnya berbeda
    if (playing && src !== currentSrcRef.current) {
      playSrc(src)
    } else {
      // Simpan src agar dipakai saat user menekan play nanti
      currentSrcRef.current = src
    }
  }, [playing, playSrc])

  // ── Volume ────────────────────────────────────────────────
  const setVolume = useCallback((val) => {
    const clamped = Math.max(0, Math.min(1, val))
    setVolumeState(clamped)
    volumeRef.current = clamped

    if (audioRef.current) {
      audioRef.current.volume = clamped
    }
  }, [])

  // ── Cleanup saat komponen unmount ─────────────────────────
  useEffect(() => {
    return () => {
      clearFade()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [clearFade])

  return { playing, toggleMusic, volume, setVolume, changeSection }
}

import { useState, useEffect, useRef } from 'react'
import styles from './MusicPlayer.module.css'

const TRACK_INFO = {
  intro: { title: 'Departure', artist: 'Leaving Earth', color: ['#4466ff', '#8844ff'], theme: 'nebula' },
  solar: { title: 'Solar Winds', artist: 'The Solar System', color: ['#ffaa33', '#ff6644'], theme: 'solar' },
  phenomena: { title: 'Event Horizon', artist: 'Cosmic Phenomena', color: ['#ff44aa', '#aa22ff'], theme: 'blackhole' },
  deepspace: { title: 'Into the Void', artist: 'Deep Space', color: ['#4488cc', '#224488'], theme: 'stars' },
  ending: { title: 'Stardust', artist: 'Reflection Zone', color: ['#88aaff', '#cc88ff'], theme: 'clouds' },
  wishing: { title: 'Stardust', artist: 'Make a Wish', color: ['#88aaff', '#cc88ff'], theme: 'stars' },
  gallery: { title: 'Departure', artist: 'Astronaut Gallery', color: ['#4466ff', '#8844ff'], theme: 'nebula' },
  default: { title: 'Departure', artist: 'Leaving Earth', color: ['#4466ff', '#8844ff'], theme: 'nebula' },
}

const prefersReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// HP / layar sempit: player mulai dalam bentuk mini supaya tidak menutupi judul section
const isNarrow = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 768px)').matches

function getAudioMetrics(data) {
  if (!data || data.length === 0) return { bass: 0, avg: 0, mid: 0 }
  const bassEnd = Math.floor(data.length * 0.06)
  const midEnd = Math.floor(data.length * 0.35)
  let bass = 0, mid = 0, total = 0
  for (let i = 0; i < data.length; i++) {
    const v = data[i] / 255
    total += v
    if (i < bassEnd) bass += v
    else if (i < midEnd) mid += v
  }
  return { bass: bass / bassEnd, mid: mid / (midEnd - bassEnd), avg: total / data.length }
}

function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

// ── Tombol mode Comfort (dipakai di mini, penuh, dan dock) ──────────
function ComfortButton({ comfort, onToggle }) {
  if (!onToggle) return null
  return (
    <button
      type="button"
      className={`${styles.comfortBtn} ${comfort ? styles.comfortOn : ''}`}
      onClick={onToggle}
      aria-pressed={comfort}
      aria-label="Comfort mode"
      title="Comfort mode: dimmer stars, softer text, less motion"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  )
}

// ── Animated artwork canvas per theme (IDLE ANIMATION) ──────────────
// still = true (reduced motion / Comfort): digambar sekali, tanpa loop
function ArtCanvas({ theme, color, still }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const t0 = useRef(Date.now())
  const particles = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height

    const initParticles = () => {
      particles.current = []
      if (theme === 'stars' || theme === 'nebula' || theme === 'clouds') {
        for (let i = 0; i < 40; i++) {
          particles.current.push({
            x: Math.random() * W, y: Math.random() * H,
            r: Math.random() * 1.5 + 0.3,
            speed: Math.random() * 0.3 + 0.05,
            phase: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.8 + 0.2,
          })
        }
      }
    }
    initParticles()

    const draw = () => {
      const t = (Date.now() - t0.current) / 1000
      const c1 = color[0], c2 = color[1]

      ctx.clearRect(0, 0, W, H)

      if (theme === 'nebula') {
        for (let i = 0; i < 3; i++) {
          const cx = W * (0.3 + i * 0.2) + Math.sin(t * 0.3 + i) * 8
          const cy = H * (0.4 + Math.sin(t * 0.2 + i * 1.2) * 0.2)
          const r = 22 + Math.sin(t + i) * 4
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
          g.addColorStop(0, c1 + (i === 1 ? 'cc' : '88'))
          g.addColorStop(0.5, c2 + '44')
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
        }
        particles.current.forEach(p => {
          p.phase += 0.02
          const a = 0.4 + Math.abs(Math.sin(p.phase)) * 0.6
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(200,220,255,${a})`; ctx.fill()
        })
      }

      if (theme === 'solar') {
        const cx = W * 0.5, cy = H * 0.5
        const pulseR = 14
        for (let ring = 3; ring >= 0; ring--) {
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseR + ring * 8)
          g.addColorStop(0, ring === 0 ? '#ffffff' : c1 + 'ee')
          g.addColorStop(0.4, c1 + (ring === 0 ? 'cc' : '66'))
          g.addColorStop(1, 'transparent')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(cx, cy, pulseR + ring * 8, 0, Math.PI * 2); ctx.fill()
        }
        for (let i = 0; i < 6; i++) {
          const angle = t * 0.4 + i * Math.PI / 3
          const len = 10 + Math.sin(t + i) * 4
          const x2 = cx + Math.cos(angle) * (pulseR + len)
          const y2 = cy + Math.sin(angle) * (pulseR + len)
          ctx.strokeStyle = c1 + '88'
          ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x2, y2); ctx.stroke()
        }
      }

      if (theme === 'blackhole') {
        const cx = W * 0.5, cy = H * 0.5
        const coreR = 10
        for (let i = 5; i >= 0; i--) {
          const rx = coreR + 6 + i * 4
          const ry = (coreR + 6 + i * 4) * 0.28
          const alpha = (0.6 - i * 0.08) * 0.7
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(t * 0.5)
          ctx.strokeStyle = i < 2 ? c1 + 'ff' : c2 + Math.floor(alpha * 255).toString(16).padStart(2, '0')
          ctx.lineWidth = i < 2 ? 2 : 1
          ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
          ctx.stroke(); ctx.restore()
        }
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR)
        cg.addColorStop(0, '#000000'); cg.addColorStop(0.6, '#110008'); cg.addColorStop(1, c1 + '44')
        ctx.fillStyle = cg
        ctx.beginPath(); ctx.arc(cx, cy, coreR, 0, Math.PI * 2); ctx.fill()
      }

      if (theme === 'stars') {
        particles.current.forEach(p => {
          p.x -= p.speed * 0.8
          if (p.x < 0) { p.x = W; p.y = Math.random() * H }
          p.phase += 0.015
          const a = 0.3 + Math.abs(Math.sin(p.phase)) * 0.7
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(180,210,255,${a})`; ctx.fill()
        })
        const g = ctx.createRadialGradient(W * 0.3, H * 0.5, 0, W * 0.3, H * 0.5, W * 0.6)
        g.addColorStop(0, c1 + '22'); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      }

      if (theme === 'clouds') {
        const cloudDefs = [
          { x: 0.2, y: 0.35, r: 18, speed: 0.20 },
          { x: 0.55, y: 0.55, r: 22, speed: 0.15 },
          { x: 0.8, y: 0.3, r: 14, speed: 0.25 },
        ]
        cloudDefs.forEach((cl, i) => {
          const cx = (cl.x + Math.sin(t * cl.speed + i) * 0.15) * W
          const cy = (cl.y + Math.cos(t * cl.speed * 0.15 + i) * 0.16) * H
          const r = cl.r
          for (let b = 3; b >= 0; b--) {
            const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + b * 5)
            g.addColorStop(0, `rgba(200,210,255,${0.18 - b * 0.04})`)
            g.addColorStop(1, 'transparent')
            ctx.fillStyle = g
            ctx.beginPath(); ctx.arc(cx, cy, r + b * 5, 0, Math.PI * 2); ctx.fill()
          }
        })
        particles.current.forEach(p => {
          p.phase += 0.008
          const a = 0.2 + Math.abs(Math.sin(p.phase)) * 0.5
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(220,225,255,${a})`; ctx.fill()
        })
      }

      if (!still) rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [theme, color, still])

  return <canvas ref={canvasRef} width={56} height={56} className={styles.artCanvas} />
}

// ── Bar visualizer ─────────────────────────────────────────
// still: saat idle gambar garis datar sekali (tanpa gelombang bergerak)
function BarVisualizer({ getAudioData, playing, color, onMetrics, still }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const t0 = useRef(Date.now())
  const freqRef = useRef(new Uint8Array(128))

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    const BINS = 28
    const freqData = freqRef.current

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      const t = (Date.now() - t0.current) / 1000

      if (!getAudioData || !playing) {
        ctx.strokeStyle = color[0] + '55'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        for (let x = 0; x < W; x++) {
          const y = still
            ? H / 2
            : H / 2 + Math.sin(x * 0.18 + t * 1.2) * 3.5 + Math.sin(x * 0.08 + t * 0.7) * 2
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.stroke()
        if (onMetrics) onMetrics(null)
        if (!still) rafRef.current = requestAnimationFrame(draw)
        return
      }

      getAudioData(freqData)
      if (onMetrics) onMetrics(freqData)

      const step = Math.floor(freqData.length / BINS)
      const barW = (W / BINS) - 1

      const grad = ctx.createLinearGradient(0, H, 0, 0)
      grad.addColorStop(0, color[0] + 'dd')
      grad.addColorStop(0.6, color[1] + 'aa')
      grad.addColorStop(1, '#ffffff44')

      for (let i = 0; i < BINS; i++) {
        let sum = 0
        for (let j = 0; j < step; j++) sum += (freqData[i * step + j] || 0)
        const v = (sum / step) / 255
        const barH = Math.max(2, v * H * 1.15)
        const x = i * (barW + 1)
        ctx.fillStyle = grad
        ctx.beginPath()
        if (ctx.roundRect) ctx.roundRect(x, H - barH, barW, barH, 2)
        else ctx.rect(x, H - barH, barW, barH)
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [getAudioData, playing, color, onMetrics, still])

  return <canvas ref={canvasRef} width={196} height={32} className={styles.barCanvas} />
}

// ── Main component ─────────────────────────────────────────
// mode: 'mini' (default di HP: putar + volume), 'full' (panel lengkap), 'hidden' (hanya tombol ♫)
export default function MusicPlayer({
  playing, onToggle, volume, onVolumeChange,
  activeSection, getAudioData, audioProgress,
  comfort = false, onToggleComfort,
}) {
  const [mode, setMode] = useState(() => (isNarrow() ? 'mini' : 'full'))
  const [track, setTrack] = useState(TRACK_INFO.intro)
  const [transitioning, setTransitioning] = useState(false)
  const [beatFlash, setBeatFlash] = useState(false)
  const playerRef = useRef(null)
  const beatCooldown = useRef(false)
  const prevBass = useRef(0)
  const beatTimers = useRef([])
  const reduce = useRef(prefersReduced()).current
  const still = reduce || comfort

  // Track change animation.
  // Dibandingkan lewat OBJEK track (bukan title): "intro" dan "gallery" sama-sama "Departure"
  // tetapi artisnya berbeda, jadi label harus tetap berganti.
  useEffect(() => {
    const next = TRACK_INFO[activeSection] ?? TRACK_INFO.default
    if (next === track) {
      setTransitioning(false) // kembali ke track semula di tengah animasi: jangan tertinggal pudar
      return
    }
    setTransitioning(true)
    const t = setTimeout(() => { setTrack(next); setTransitioning(false) }, 280)
    return () => clearTimeout(t)
  }, [activeSection, track])

  useEffect(() => () => beatTimers.current.forEach(clearTimeout), [])

  // Beat detection + direct DOM glow update (tanpa trigger React re-render per frame).
  // Hanya dipanggil oleh BarVisualizer, jadi hanya aktif di mode penuh.
  const handleMetrics = useRef()
  handleMetrics.current = (data) => {
    const el = playerRef.current
    if (!data || !playing) {
      if (el) el.style.setProperty('--glow-int', '0')
      return
    }
    const { bass, avg } = getAudioMetrics(data)
    if (el) {
      // Comfort: glow tetap (tidak berdenyut mengikuti musik)
      el.style.setProperty('--glow-int', comfort ? '0.25' : (avg * 1.4).toFixed(3))
    }
    // Kedip beat (skala + glow tajam) dilewati saat reduced motion / Comfort
    if (!reduce && !comfort && bass > 0.52 && bass > prevBass.current * 1.22 && !beatCooldown.current) {
      setBeatFlash(true)
      beatCooldown.current = true
      beatTimers.current.push(setTimeout(() => setBeatFlash(false), 100))
      beatTimers.current.push(setTimeout(() => { beatCooldown.current = false }, 260))
    }
    prevBass.current = bass
  }

  const onMetricsCallback = useRef((data) => handleMetrics.current(data)).current

  const prog = audioProgress?.progress ?? 0
  const curTime = audioProgress?.currentTime ?? 0
  const dur = audioProgress?.duration ?? 0

  const playIcon = (size) => playing
    ? <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true"><rect x="5" y="3" width="4" height="18" rx="1.5" /><rect x="15" y="3" width="4" height="18" rx="1.5" /></svg>
    : <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true"><polygon points="5,3 20,12 5,21" /></svg>

  const volIcon = (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" opacity="0.55" aria-hidden="true">
      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
    </svg>
  )

  // ── Tersembunyi: tombol ♫ + tombol Comfort ──
  if (mode === 'hidden') return (
    <div className={styles.playerDock}>
      <button
        type="button"
        className={styles.showBtn}
        onClick={() => setMode(isNarrow() ? 'mini' : 'full')}
        title="Show player"
        aria-label="Show music player"
      >
        ♫
      </button>
      <ComfortButton comfort={comfort} onToggle={onToggleComfort} />
    </div>
  )

  // ── Mini: putar + volume + buka penuh + Comfort ──
  if (mode === 'mini') return (
    <div
      className={`${styles.playerMini} ${playing ? styles.miniOn : ''}`}
      role="group"
      aria-label="Music controls"
      style={{ '--glow': track.color[0] }}
    >
      <button
        type="button"
        className={styles.miniPlay}
        style={{ '--btn-col': track.color[0] }}
        onClick={onToggle}
        aria-label={playing ? 'Pause music' : 'Play music'}
      >
        {playIcon(18)}
      </button>

      <div className={styles.miniVol}>
        {volIcon}
        <input
          type="range" min="0" max="1" step="0.02"
          value={volume}
          onChange={e => onVolumeChange(parseFloat(e.target.value))}
          className={styles.miniSlider}
          style={{ '--vol': `${volume * 100}%`, '--c1': track.color[0] }}
          aria-label="Volume"
        />
      </div>

      <button
        type="button"
        className={styles.miniBtn}
        onClick={() => setMode('full')}
        aria-label="Open full music player"
        aria-expanded="false"
        title="Open player"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <ComfortButton comfort={comfort} onToggle={onToggleComfort} />
    </div>
  )

  // ── Penuh ──
  return (
    <div
      ref={playerRef}
      className={`${styles.player} ${playing ? styles.playing : ''} ${beatFlash ? styles.beat : ''}`}
      style={{ '--glow': track.color[0], '--glow-int': '0' }}
    >
      {/* Minimize (kembali ke mini) */}
      <button
        type="button"
        className={styles.collapseBtn}
        onClick={() => setMode('mini')}
        title="Minimize player"
        aria-label="Minimize music player"
        aria-expanded="true"
      >
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 15l6-6 6 6" />
        </svg>
      </button>

      {/* Close button (sembunyikan sepenuhnya) */}
      <button
        type="button"
        className={styles.closeBtn}
        onClick={() => setMode('hidden')}
        title="Hide player"
        aria-label="Hide music player"
      >×</button>

      {/* Top row: art + track info */}
      <div className={styles.topRow}>
        <div className={styles.artWrap} onClick={onToggle}>
          <ArtCanvas theme={track.theme} color={track.color} still={still} />
          <div className={styles.artOverlay}>
            {playing
              ? <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><rect x="5" y="3" width="4" height="18" rx="1.5" /><rect x="15" y="3" width="4" height="18" rx="1.5" /></svg>
              : <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><polygon points="6,3 21,12 6,21" /></svg>
            }
          </div>
          {beatFlash && <div className={styles.beatRing} style={{ borderColor: track.color[0] }} />}
        </div>

        <div className={styles.trackMeta}>
          <div className={styles.trackNameWrap}>
            <span className={`${styles.trackName} ${transitioning ? styles.fadeOut : styles.fadeIn}`}>
              {track.title}
            </span>
          </div>
          <span className={styles.trackArtist}>{track.artist}</span>
          <span className={styles.lofiBadge} style={{ color: track.color[0], borderColor: track.color[0] + '55' }}>
            ✦ lofi space
          </span>
        </div>
      </div>

      {/* Bar visualizer */}
      <div className={styles.vizWrap} aria-hidden="true">
        <BarVisualizer
          getAudioData={getAudioData}
          playing={playing}
          color={track.color}
          onMetrics={onMetricsCallback}
          still={still}
        />
      </div>

      {/* Progress bar — real duration */}
      <div className={styles.progressArea}>
        <span className={styles.timeLabel}>{fmt(curTime)}</span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${prog * 100}%`, background: `linear-gradient(90deg, ${track.color[0]}, ${track.color[1]})` }}
          />
        </div>
        <span className={styles.timeLabel}>{fmt(dur)}</span>
      </div>

      {/* Controls row */}
      <div className={styles.controlsRow}>
        <button className={styles.playBtn} onClick={onToggle}
          style={{ '--btn-col': track.color[0] }}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playIcon(18)}
        </button>

        <div className={styles.volRow}>
          {volIcon}
          <input
            type="range" min="0" max="1" step="0.02"
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className={styles.volSlider}
            style={{ '--vol': `${volume * 100}%`, '--c1': track.color[0] }}
            aria-label="Volume"
          />
          <span className={styles.volNum}>{Math.round(volume * 100)}</span>
        </div>

        <ComfortButton comfort={comfort} onToggle={onToggleComfort} />
      </div>
    </div>
  )
}
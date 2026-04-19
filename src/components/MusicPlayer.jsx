import { useState, useEffect, useRef } from 'react'
import styles from './MusicPlayer.module.css'

// Info nama lagu per section
const TRACK_INFO = {
  intro:      { title: 'Departure',       artist: 'Leaving Earth' },
  solar:      { title: 'Solar Winds',     artist: 'The Solar System' },
  phenomena:  { title: 'Event Horizon',   artist: 'Cosmic Phenomena' },
  deepspace:  { title: 'Into the Void',   artist: 'Deep Space' },
  ending:     { title: 'Stardust',        artist: 'Reflection Zone' },
  default:    { title: 'Departure',       artist: 'Leaving Earth' },
}

export default function MusicPlayer({ playing, onToggle, volume, onVolumeChange, activeSection }) {
  const [expanded, setExpanded]   = useState(false)
  const [track, setTrack]         = useState(TRACK_INFO.intro)
  const [prevTrack, setPrevTrack] = useState(null)
  const [transitioning, setTransitioning] = useState(false)
  const collapseTimer = useRef(null)

  // Ganti info lagu saat section berubah, dengan animasi transisi
  useEffect(() => {
    const next = TRACK_INFO[activeSection] ?? TRACK_INFO.default
    if (next.title === track.title) return

    setTransitioning(true)
    setPrevTrack(track)
    setTimeout(() => {
      setTrack(next)
      setTransitioning(false)
      setPrevTrack(null)
    }, 350)
  }, [activeSection])

  // Auto-collapse setelah 4 detik tidak disentuh
  const resetCollapseTimer = () => {
    clearTimeout(collapseTimer.current)
    collapseTimer.current = setTimeout(() => setExpanded(false), 4000)
  }

  const handleMouseEnter = () => {
    setExpanded(true)
    clearTimeout(collapseTimer.current)
  }

  const handleMouseLeave = () => {
    resetCollapseTimer()
  }

  const handleToggle = () => {
    onToggle()
    setExpanded(true)
    resetCollapseTimer()
  }

  return (
    <div
      className={`${styles.player} ${expanded ? styles.expanded : ''} ${playing ? styles.playing : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Album art / visualizer */}
      <div className={styles.albumArt} onClick={handleToggle}>
        <div className={styles.artInner}>
          {playing ? (
            <div className={styles.visualizer}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className={styles.vizBar} style={{ '--i': i }} />
              ))}
            </div>
          ) : (
            <svg className={styles.playIcon} viewBox="0 0 24 24" width="18" height="18">
              <polygon points="6,3 20,12 6,21" fill="currentColor" />
            </svg>
          )}
        </div>
        {/* Spinning ring saat playing */}
        <div className={`${styles.spinRing} ${playing ? styles.spinning : ''}`} />
      </div>

      {/* Track info — hanya muncul saat expanded */}
      <div className={styles.trackInfo}>
        <div className={styles.trackScroll}>
          <span
            className={`${styles.trackTitle} ${transitioning ? styles.slideOut : styles.slideIn}`}
          >
            {transitioning && prevTrack ? prevTrack.title : track.title}
          </span>
        </div>
        <span className={styles.trackArtist}>{track.artist}</span>

        {/* Progress bar dummy (animasi loop) */}
        <div className={styles.progressWrap}>
          <div className={`${styles.progressBar} ${playing ? styles.progPlaying : ''}`} />
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        {/* Play/Pause */}
        <button
          className={styles.controlBtn}
          onClick={handleToggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <rect x="5" y="3" width="4" height="18" rx="1" />
              <rect x="15" y="3" width="4" height="18" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          )}
        </button>

        {/* Volume */}
        <div className={styles.volumeGroup}>
          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" opacity="0.5">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
          <input
            type="range"
            min="0" max="1" step="0.02"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className={styles.volSlider}
            aria-label="Volume"
            style={{ '--vol': `${volume * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

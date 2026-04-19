import { useState } from 'react'
import styles from './MusicPlayer.module.css'

export default function MusicPlayer({ playing, onToggle, volume, onVolumeChange }) {
  const [showVolume, setShowVolume] = useState(false)

  return (
    <div className={styles.wrap}>
      {showVolume && (
        <div className={styles.volumeWrap}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className={styles.slider}
            aria-label="Volume"
          />
          <span className={styles.volLabel}>{Math.round(volume * 100)}%</span>
        </div>
      )}

      <button
        className={`${styles.btn} ${playing ? styles.playing : ''}`}
        onClick={onToggle}
        onMouseEnter={() => setShowVolume(true)}
        onMouseLeave={() => setShowVolume(false)}
        aria-label={playing ? 'Pause ambient music' : 'Play ambient music'}
        title="Ambient Music"
      >
        {playing ? (
          <span className={styles.bars}>
            <span className={styles.bar} style={{ '--i': 0 }} />
            <span className={styles.bar} style={{ '--i': 1 }} />
            <span className={styles.bar} style={{ '--i': 2 }} />
            <span className={styles.bar} style={{ '--i': 3 }} />
          </span>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <polygon points="5,3 19,12 5,21" fill="currentColor" opacity="0.8" />
          </svg>
        )}
      </button>
    </div>
  )
}

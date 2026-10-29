import { useEffect, useRef, useCallback } from 'react'
import styles from './FactPopup.module.css'

// Durasi tampil menyesuaikan panjang teks (±60 ms per karakter), batas 6 sampai 22 detik.
// Mode Comfort (body.comfort-mode) memberi waktu 1,5× lebih lama.
const BASE_MS = 3000
const PER_CHAR_MS = 60
const MIN_MS = 6000
const MAX_MS = 22000
// Setelah tertahan (hover / sentuh / fokus) lalu dilepas, sisa waktu minimal segini
const MIN_RESUME_MS = 3000

function readDuration(fact) {
  const len = [fact.title, fact.subtitle, fact.text, fact.extra].reduce(
    (n, s) => n + (typeof s === 'string' ? s.length : 0),
    0
  )
  const comfort = document.body.classList.contains('comfort-mode')
  const ms = Math.min(MAX_MS, Math.max(MIN_MS, BASE_MS + len * PER_CHAR_MS))
  return comfort ? ms * 1.5 : ms
}

export default function FactPopup({ fact, onClose }) {
  const timerRef = useRef(0)
  const remainRef = useRef(0)   // sisa waktu (ms)
  const startedRef = useRef(0)  // kapan timer terakhir dijalankan
  const holdRef = useRef({ pointer: false, focus: false })
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const isHeld = () => holdRef.current.pointer || holdRef.current.focus

  const schedule = useCallback(() => {
    clearTimeout(timerRef.current)
    startedRef.current = Date.now()
    timerRef.current = setTimeout(() => onCloseRef.current(), remainRef.current)
  }, [])

  // Fakta baru: hitung durasi dan mulai. Jika pointer sedang menahan popup, timer ditunda
  // sampai dilepas. Saat popup tertutup, status tahan direset (pointer events mati saat tersembunyi).
  useEffect(() => {
    if (!fact) {
      holdRef.current = { pointer: false, focus: false }
      return
    }
    remainRef.current = readDuration(fact)
    if (!isHeld()) schedule()
    return () => clearTimeout(timerRef.current)
  }, [fact, schedule])

  const hold = (key) => {
    if (!fact) return
    const wasHeld = isHeld()
    holdRef.current[key] = true
    if (!wasHeld) {
      clearTimeout(timerRef.current)
      remainRef.current -= Date.now() - startedRef.current
    }
  }

  const release = (key) => {
    if (!fact) return
    holdRef.current[key] = false
    if (!isHeld()) {
      remainRef.current = Math.max(remainRef.current, MIN_RESUME_MS)
      schedule()
    }
  }

  return (
    <div
      className={`${styles.popup} ${fact ? styles.show : ''}`}
      role="status"
      onPointerEnter={() => hold('pointer')}
      onPointerLeave={() => release('pointer')}
      onPointerCancel={() => release('pointer')}
      onFocus={() => hold('focus')}
      onBlur={() => release('focus')}
    >
      {fact && (
        <>
          <div className={styles.header}>
            <span className={styles.title}>{fact.title}</span>
            {fact.subtitle && <span className={styles.subtitle}>{fact.subtitle}</span>}
            <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
          </div>
          <p className={styles.text}>{fact.text}</p>
          {fact.extra && <p className={styles.extra}>{fact.extra}</p>}
        </>
      )}
    </div>
  )
}
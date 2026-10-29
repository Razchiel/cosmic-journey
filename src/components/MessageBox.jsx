import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './MessageBox.module.css'

// Reduced motion atau mode Comfort: teks langsung tampil utuh, tanpa efek ketik
const instantPref = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.body.classList.contains('comfort-mode'))

const HINT_STYLE = {
  marginTop: '1.25rem',
  fontFamily: 'var(--font-body)',
  fontSize: 'var(--fs-small)',
  fontWeight: 400,
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
}

export default function MessageBox({ message, onClose }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const timerRef = useRef(0)
  const overlayRef = useRef(null)

  useEffect(() => {
    clearInterval(timerRef.current)
    if (!message) { setDisplayed(''); setDone(false); return }

    if (instantPref()) {
      setDisplayed(message)
      setDone(true)
      return
    }

    setDisplayed('')
    setDone(false)

    let i = 0
    timerRef.current = setInterval(() => {
      if (i < message.length) {
        setDisplayed(message.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(timerRef.current)
      }
    }, 24)

    return () => clearInterval(timerRef.current)
  }, [message])

  // Fokus ke overlay saat terbuka, supaya Esc dan Enter/Spasi langsung bekerja
  useEffect(() => {
    if (message) overlayRef.current?.focus({ preventScroll: true })
  }, [message])

  // Tampilkan seluruh teks sekarang (hentikan interval supaya tidak menimpa lagi)
  const reveal = useCallback(() => {
    if (!message) return
    clearInterval(timerRef.current)
    setDisplayed(message)
    setDone(true)
  }, [message])

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    // Enter/Spasi pada overlay (bukan pada tombol di dalamnya) = tampilkan semua teks
    if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget && !done) {
      e.preventDefault()
      reveal()
    }
  }

  if (!message) return null

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      onClick={handleBackdrop}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{ outline: 'none' }}
      role="dialog"
      aria-modal="true"
      aria-label="Message from the universe"
    >
      <div
        className={styles.card}
        onClick={() => { if (!done) reveal() }}
        style={done ? undefined : { cursor: 'pointer' }}
      >
        <div className={styles.deco}>✦</div>
        <p className={styles.label}>A message from the universe</p>
        <p className={styles.text}>
          {displayed}
          {!done && <span className={styles.cursor} />}
        </p>
        {!done && (
          <p style={HINT_STYLE} aria-hidden="true">Tap anywhere to show all</p>
        )}
        {done && (
          <button className={styles.closeBtn} onClick={onClose}>
            Return to the cosmos
          </button>
        )}
      </div>
    </div>
  )
}
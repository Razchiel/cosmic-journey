import { useEffect, useState } from 'react'
import styles from './MessageBox.module.css'

export default function MessageBox({ message, onClose }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!message) { setDisplayed(''); setDone(false); return }
    setDisplayed('')
    setDone(false)

    let i = 0
    const interval = setInterval(() => {
      if (i < message.length) {
        setDisplayed(message.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, 24)

    return () => clearInterval(interval)
  }, [message])

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!message) return null

  return (
    <div className={styles.overlay} onClick={handleBackdrop} role="dialog" aria-modal="true" aria-label="Message from the universe">
      <div className={styles.card}>
        <div className={styles.deco}>✦</div>
        <p className={styles.label}>A message from the universe</p>
        <p className={styles.text}>
          {displayed}
          {!done && <span className={styles.cursor} />}
        </p>
        {done && (
          <button className={styles.closeBtn} onClick={onClose}>
            Return to the cosmos
          </button>
        )}
      </div>
    </div>
  )
}

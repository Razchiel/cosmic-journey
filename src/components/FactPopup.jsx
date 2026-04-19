import { useEffect } from 'react'
import styles from './FactPopup.module.css'

export default function FactPopup({ fact, onClose }) {
  useEffect(() => {
    if (!fact) return
    const timer = setTimeout(onClose, 6000)
    return () => clearTimeout(timer)
  }, [fact, onClose])

  return (
    <div className={`${styles.popup} ${fact ? styles.show : ''}`} role="status">
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

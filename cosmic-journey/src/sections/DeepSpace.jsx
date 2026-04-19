import { useRef, useEffect, useState } from 'react'
import { DEEP_SPACE_LINES } from '../data/index.js'
import styles from './DeepSpace.module.css'

export default function DeepSpace() {
  const sectionRef = useRef(null)
  const [visibleLines, setVisibleLines] = useState([])
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealed) {
          setRevealed(true)
          DEEP_SPACE_LINES.forEach((_, i) => {
            setTimeout(() => {
              setVisibleLines((prev) => [...prev, i])
            }, i * 700)
          })
        }
      },
      { threshold: 0.3 }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [revealed])

  return (
    <section id="deepspace" className={`cosmic-section ${styles.deepspace}`} ref={sectionRef}>
      <div className="noise-overlay" />

      <div className={styles.infinityWrap}>
        <div className={styles.infinity}>∞</div>
        <div className={styles.infinityRing} />
        <div className={styles.infinityRing2} />
      </div>

      <div className={styles.content}>
        <p className="t-label" style={{ marginBottom: '1.5rem' }}>
          Stage III — 10,000 light-years from home
        </p>

        <h2 className={styles.title}>Beyond the Known</h2>

        <div className={styles.lines}>
          {DEEP_SPACE_LINES.map((line, i) => (
            <p
              key={i}
              className={`${styles.line} ${visibleLines.includes(i) ? styles.lineVisible : ''}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* Floating distant objects */}
      <div className={styles.floatingObjects}>
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={styles.floatObj}
            style={{
              '--x': `${15 + i * 15}%`,
              '--y': `${20 + (i % 3) * 25}%`,
              '--delay': `${i * 1.4}s`,
              '--size': `${1 + (i % 3) * 0.5}px`,
            }}
          />
        ))}
      </div>
    </section>
  )
}

import { useEffect, useState, memo } from 'react'
import { DEEP_SPACE_LINES } from '../data/index.js'
import UniverseScale from '../components/UniverseScale.jsx'
import styles from './DeepSpace.module.css'

function LocalSupernovas() {
  const [novas, setNovas] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      setNovas((prev) => {
        const newNova = {
          id: Date.now() + Math.random(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          scale: Math.random() * 3 + 2,
          color: ['#ffbb88', '#88ccff', '#ee88ff'][Math.floor(Math.random() * 3)]
        }
        return [...prev.slice(-3), newNova]
      })
    }, 2800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.supernovaContainer}>
      {novas.map((nova) => (
        <div key={nova.id} className={styles.supernova}
          style={{
            left: `${nova.x}%`, top: `${nova.y}%`,
            '--nova-scale': nova.scale, '--nova-color': nova.color,
          }}
        />
      ))}
    </div>
  )
}

function DeepSpace({ onFact, onNext }) {
  const [visibleLines, setVisibleLines] = useState([])

  // Dijalankan langsung saat komponen di-mount.
  // IntersectionObserver tidak lagi dibutuhkan karena komponen ini di Lazy-Load (hanya merender saat aktif).
  useEffect(() => {
    const timeouts = DEEP_SPACE_LINES.map((_, i) => {
      return setTimeout(() => {
        setVisibleLines((prev) => [...prev, i])
      }, (i * 700) + 300) // delay sedikit agar sinkron dengan fade CSS 400ms
    })

    return () => timeouts.forEach(clearTimeout)
  }, [])

  const allVisible = visibleLines.length === DEEP_SPACE_LINES.length

  return (
    <section id="deepspace" className={`cosmic-section ${styles.deepspace}`}>
      <LocalSupernovas />

      <div className="noise-overlay" />

      <div className={styles.infinityWrap}>
        <div className={styles.infinity}>∞</div>
        <div className={styles.infinityRing} />
        <div className={styles.infinityRing2} />
      </div>

      <div className={styles.content}>
        <p className="t-label" style={{ marginBottom: '1.5rem' }}>
          Stage III: 10,000 light-years from home
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

      {/* Zoom-out dari Bumi sampai alam semesta teramati */}
      {allVisible && <UniverseScale />}

      <div className={`${styles.nextNav} ${allVisible ? styles.nextNavVisible : ''}`}>
        <button className={styles.nextBtn} onClick={onNext}>
          Reflect on the Journey <span className={styles.arrow}>↓</span>
        </button>
      </div>

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

export default memo(DeepSpace)
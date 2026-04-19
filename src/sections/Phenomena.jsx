import { useState } from 'react'
import { PHENOMENA } from '../data/index.js'
import styles from './Phenomena.module.css'

export default function Phenomena({ onFact }) {
  const [active, setActive] = useState(null)

  const handleClick = (p) => {
    setActive(p.id)
    onFact({
      title: p.name,
      text: p.description,
      extra: p.fact2,
    })
  }

  return (
    <section id="phenomena" className={`cosmic-section ${styles.phenomena}`}>
      <div className="noise-overlay" />
      <div className={styles.bgGradient} />

      <div className={styles.header}>
        <p className="t-label">Stage II — Beyond the Solar System</p>
        <h2 className={styles.title}>Cosmic Phenomena</h2>
        <p className={styles.subtitle}>The universe's most extraordinary events</p>
      </div>

      <div className={styles.grid}>
        {PHENOMENA.map((p) => (
          <div
            key={p.id}
            className={`${styles.card} ${active === p.id ? styles.cardActive : ''}`}
            style={{ '--glow': p.glowColor, '--border': p.borderColor }}
            onClick={() => handleClick(p)}
            role="button"
            tabIndex={0}
            aria-label={`Learn about ${p.name}`}
            onKeyDown={(e) => e.key === 'Enter' && handleClick(p)}
            onMouseEnter={() => setActive(p.id)}
            onMouseLeave={() => setActive(null)}
          >
            <div
              className={styles.icon}
              style={{ background: p.iconBg, color: p.colorVar, boxShadow: `0 0 30px ${p.glowColor}` }}
            >
              {p.id === 'blackhole' && <BlackHoleIcon />}
              {p.id === 'supernova' && <SupernovaIcon />}
              {p.id === 'nebula' && <NebulaIcon />}
              {p.id === 'pulsar' && <PulsarIcon />}
            </div>

            <h3 className={styles.cardTitle}>{p.name}</h3>
            <p className={styles.cardDesc}>{p.description}</p>

            <div className={styles.cardFooter}>
              <span className={styles.discover}>Tap to explore →</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* Inline SVG icons for each phenomenon */
function BlackHoleIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <defs>
        <radialGradient id="bhGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#000000" />
          <stop offset="60%" stopColor="#1a0008" />
          <stop offset="100%" stopColor="#330015" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="28" fill="url(#bhGrad)" />
      <circle cx="30" cy="30" r="10" fill="#000000" />
      <ellipse cx="30" cy="30" rx="24" ry="6" fill="none" stroke="#ff44aa" strokeWidth="0.8" opacity="0.6" />
      <ellipse cx="30" cy="30" rx="20" ry="4" fill="none" stroke="#ff88cc" strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}

function SupernovaIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1="30" y1="30"
          x2={30 + 24 * Math.cos((angle * Math.PI) / 180)}
          y2={30 + 24 * Math.sin((angle * Math.PI) / 180)}
          stroke="#ffcc44"
          strokeWidth={i % 2 === 0 ? 1.5 : 0.8}
          opacity={i % 2 === 0 ? 0.8 : 0.4}
        />
      ))}
      <circle cx="30" cy="30" r="9" fill="#ffee88" opacity="0.9" />
      <circle cx="30" cy="30" r="5" fill="#ffffff" opacity="0.95" />
    </svg>
  )
}

function NebulaIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <ellipse cx="30" cy="28" rx="22" ry="14" fill="#aa44ff" opacity="0.2" />
      <ellipse cx="30" cy="32" rx="18" ry="10" fill="#8833dd" opacity="0.3" />
      <ellipse cx="22" cy="30" rx="10" ry="14" fill="#cc66ff" opacity="0.2" transform="rotate(20 22 30)" />
      <ellipse cx="38" cy="30" rx="10" ry="14" fill="#9944ee" opacity="0.2" transform="rotate(-20 38 30)" />
      <circle cx="30" cy="30" r="4" fill="#ffffff" opacity="0.9" />
      <circle cx="30" cy="30" r="6" fill="none" stroke="#cc88ff" strokeWidth="0.5" opacity="0.6" />
    </svg>
  )
}

function PulsarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <circle cx="30" cy="30" r="8" fill="#44ffcc" opacity="0.9" />
      <ellipse cx="30" cy="30" rx="26" ry="4" fill="none" stroke="#44ffcc" strokeWidth="1" opacity="0.6" transform="rotate(15 30 30)" />
      <ellipse cx="30" cy="30" rx="26" ry="4" fill="none" stroke="#44ffcc" strokeWidth="0.6" opacity="0.3" transform="rotate(-15 30 30)" />
      <line x1="30" y1="4" x2="30" y2="20" stroke="#88ffee" strokeWidth="1.5" opacity="0.7" />
      <line x1="30" y1="40" x2="30" y2="56" stroke="#88ffee" strokeWidth="1.5" opacity="0.7" />
    </svg>
  )
}

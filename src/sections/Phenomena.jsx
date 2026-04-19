import { useState } from 'react'
import { PHENOMENA } from '../data/index.js'
import styles from './Phenomena.module.css'

export default function Phenomena({ onFact }) {
  const [active, setActive] = useState(null)

  const handleClick = (p) => {
    setActive(p.id)
    onFact({ title: p.name, text: p.description, extra: p.fact2 })
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
              style={{ background: p.iconBg, boxShadow: `0 0 30px ${p.glowColor}` }}
            >
              {p.id === 'blackhole'  && <BlackHoleIcon />}
              {p.id === 'supernova'  && <SupernovaIcon />}
              {p.id === 'nebula'     && <NebulaIcon />}
              {p.id === 'pulsar'     && <PulsarIcon />}
              {p.id === 'quasar'     && <QuasarIcon />}
              {p.id === 'magnetar'   && <MagnetarIcon />}
              {p.id === 'wormhole'   && <WormholeIcon />}
              {p.id === 'darkmatter' && <DarkMatterIcon />}
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

// ── Icons ─────────────────────────────────────────────────────

function BlackHoleIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <defs>
        <radialGradient id="bhGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="60%" stopColor="#1a0008" />
          <stop offset="100%" stopColor="#330015" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="28" fill="url(#bhGrad)" />
      <circle cx="30" cy="30" r="10" fill="#000" />
      <ellipse cx="30" cy="30" rx="24" ry="6" fill="none" stroke="#ff55bb" strokeWidth="0.8" opacity="0.7" />
      <ellipse cx="30" cy="30" rx="20" ry="4" fill="none" stroke="#ff99dd" strokeWidth="0.5" opacity="0.4" />
    </svg>
  )
}

function SupernovaIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      {[0,45,90,135,180,225,270,315].map((angle, i) => (
        <line key={i} x1="30" y1="30"
          x2={30 + 24*Math.cos(angle*Math.PI/180)}
          y2={30 + 24*Math.sin(angle*Math.PI/180)}
          stroke="#ffdd55" strokeWidth={i%2===0?1.5:0.8} opacity={i%2===0?0.9:0.5} />
      ))}
      <circle cx="30" cy="30" r="9" fill="#ffee88" opacity="0.9" />
      <circle cx="30" cy="30" r="5" fill="#ffffff" opacity="0.95" />
    </svg>
  )
}

function NebulaIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <ellipse cx="30" cy="28" rx="22" ry="14" fill="#aa55ff" opacity="0.25" />
      <ellipse cx="30" cy="32" rx="18" ry="10" fill="#8833dd" opacity="0.35" />
      <ellipse cx="22" cy="30" rx="10" ry="14" fill="#cc77ff" opacity="0.25" transform="rotate(20 22 30)" />
      <ellipse cx="38" cy="30" rx="10" ry="14" fill="#9944ee" opacity="0.25" transform="rotate(-20 38 30)" />
      <circle cx="30" cy="30" r="4" fill="#fff" opacity="0.9" />
      <circle cx="30" cy="30" r="6" fill="none" stroke="#cc99ff" strokeWidth="0.5" opacity="0.6" />
    </svg>
  )
}

function PulsarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <circle cx="30" cy="30" r="8" fill="#55ffdd" opacity="0.9" />
      <ellipse cx="30" cy="30" rx="26" ry="4" fill="none" stroke="#55ffdd" strokeWidth="1" opacity="0.6" transform="rotate(15 30 30)" />
      <ellipse cx="30" cy="30" rx="26" ry="4" fill="none" stroke="#55ffdd" strokeWidth="0.6" opacity="0.3" transform="rotate(-15 30 30)" />
      <line x1="30" y1="4"  x2="30" y2="20" stroke="#99ffee" strokeWidth="1.5" opacity="0.8" />
      <line x1="30" y1="40" x2="30" y2="56" stroke="#99ffee" strokeWidth="1.5" opacity="0.8" />
    </svg>
  )
}

function QuasarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <circle cx="30" cy="30" r="12" fill="#ffaa44" opacity="0.15" />
      <circle cx="30" cy="30" r="7" fill="#ffcc66" opacity="0.6" />
      <circle cx="30" cy="30" r="4" fill="#ffffff" opacity="0.95" />
      {[0,60,120,180,240,300].map((a,i) => (
        <line key={i} x1="30" y1="30"
          x2={30+26*Math.cos(a*Math.PI/180)}
          y2={30+26*Math.sin(a*Math.PI/180)}
          stroke="#ffcc44" strokeWidth="0.7" opacity="0.4" />
      ))}
      <ellipse cx="30" cy="30" rx="22" ry="5" fill="none" stroke="#ffaa44" strokeWidth="1" opacity="0.5" transform="rotate(30 30 30)" />
    </svg>
  )
}

function MagnetarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <circle cx="30" cy="30" r="8" fill="#55aaff" opacity="0.9" />
      {[0,1,2,3].map(i => (
        <ellipse key={i} cx="30" cy="30"
          rx={12+i*4} ry={4+i*1.5}
          fill="none" stroke="#55aaff" strokeWidth="0.7"
          opacity={0.6-i*0.12}
          transform={`rotate(${i*22} 30 30)`} />
      ))}
      <line x1="30" y1="2"  x2="30" y2="14" stroke="#aaddff" strokeWidth="2" opacity="0.8" />
      <line x1="30" y1="46" x2="30" y2="58" stroke="#aaddff" strokeWidth="2" opacity="0.8" />
    </svg>
  )
}

function WormholeIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <defs>
        <radialGradient id="whGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="40%" stopColor="#220044" />
          <stop offset="100%" stopColor="#440088" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="24" fill="url(#whGrad)" />
      {[20,16,12,8,4].map((r,i) => (
        <ellipse key={i} cx="30" cy="30"
          rx={r} ry={r*0.35}
          fill="none" stroke="#aa55ff"
          strokeWidth="0.6" opacity={0.3+i*0.12} />
      ))}
      <circle cx="30" cy="30" r="4" fill="#cc88ff" opacity="0.9" />
    </svg>
  )
}

function DarkMatterIcon() {
  return (
    <svg viewBox="0 0 60 60" width="44" height="44">
      <circle cx="30" cy="30" r="24" fill="#050508" opacity="0.9" />
      {[14,20,26].map((r,i) => (
        <circle key={i} cx="30" cy="30" r={r}
          fill="none" stroke="#778899"
          strokeWidth="0.5" strokeDasharray="2 4"
          opacity={0.2+i*0.1} />
      ))}
      <circle cx="30" cy="30" r="4" fill="transparent"
        stroke="#aabbcc" strokeWidth="1" opacity="0.5" />
      <circle cx="22" cy="22" r="1.5" fill="#99aabb" opacity="0.6" />
      <circle cx="40" cy="26" r="1"   fill="#99aabb" opacity="0.5" />
      <circle cx="25" cy="40" r="1.2" fill="#99aabb" opacity="0.4" />
      <circle cx="38" cy="38" r="0.8" fill="#99aabb" opacity="0.5" />
    </svg>
  )
}

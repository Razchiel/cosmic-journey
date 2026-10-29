import { useState, useRef, useEffect, memo } from 'react'
import { PHENOMENA } from '../data/index.js'
import { sfx } from '../hooks/useSfx.js'
import styles from './Phenomena.module.css'
import { createPortal } from 'react-dom'

// Reduced motion atau mode Comfort (body.comfort-mode): tanpa tilt dan tanpa efek ketik
const calmMotion = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.body.classList.contains('comfort-mode'))

// Potong deskripsi di batas kata (bukan di tengah kata), tambah elipsis bila terpotong
function truncateWords(text, max = 75) {
  if (!text || text.length <= max) return text || ''
  const cut = text.slice(0, max)
  // Jika karakter berikutnya spasi, potongan sudah tepat di batas kata
  const atBoundary = /\s/.test(text.charAt(max))
  const lastSpace = cut.lastIndexOf(' ')
  const base = atBoundary || lastSpace < 30 ? cut : cut.slice(0, lastSpace)
  return base.replace(/[\s,.;:!?-]+$/, '') + '…'
}

// ── KOMPONEN EFEK MESIN KETIK (TERMINAL SCI-FI) ────────────────────────
// instant = true: teks langsung tampil utuh (ketuk untuk melewati, Comfort, reduced motion)
function Typewriter({ text, speed = 25, delay = 0, instant = false, onDone }) {
  const [displayed, setDisplayed] = useState(instant ? text : '')
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])

  useEffect(() => {
    if (instant) {
      setDisplayed(text)
      return
    }
    setDisplayed('')
    let timeout
    let interval

    timeout = setTimeout(() => {
      let i = 0
      interval = setInterval(() => {
        setDisplayed(text.substring(0, i + 1))
        i++
        if (i >= text.length) {
          clearInterval(interval)
          onDoneRef.current?.()
        }
      }, speed)
    }, delay)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [text, speed, delay, instant])

  return <span>{displayed}</span>
}

// ── KOMPONEN 2.5D PARALLAX CARD ────────────────────────────────────────
function TiltCard({ p, onClick }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cardRef = useRef(null)

  const handleMouseMove = (e) => {
    if (!cardRef.current || calmMotion()) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -15
    const rotateY = ((x - centerX) / centerX) * 15
    setTilt({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => setTilt({ x: 0, y: 0 })

  return (
    <div className={styles.cardWrapper}>
      <div
        ref={cardRef}
        className={styles.cardHUD}
        style={{
          '--glow': p.glowColor,
          '--border': p.borderColor,
          transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => sfx.hover()}
        onMouseLeave={handleMouseLeave}
        onClick={() => onClick(p)}
        role="button"
        tabIndex={0}
        aria-label={`Open ${p.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick(p)
          }
        }}
      >
        <div className={styles.icon3D} style={{ boxShadow: `0 0 30px ${p.glowColor}88` }}>
          {getIcon(p.id)}
        </div>
        <h3 className={styles.cardTitle3D}>{p.name}</h3>
        <p className={styles.cardDesc3D}>{truncateWords(p.description, 75)}</p>

        <div className={styles.cardFooter3D}>
          <span className={styles.discover}>Initialize Scan →</span>
        </div>
      </div>
    </div>
  )
}

// ── KOMPONEN UTAMA PHENOMENA ───────────────────────────────────────────
function Phenomena({ onFact, onNext }) {
  const [activePhenom, setActivePhenom] = useState(null)
  // revealAll: seluruh teks langsung tampil (ketuk, tombol "Show all text", Comfort, reduced motion)
  const [revealAll, setRevealAll] = useState(false)
  // finished: efek ketik selesai sendiri
  const [finished, setFinished] = useState(false)

  const handleSelect = (p) => {
    setActivePhenom(p)
    setRevealAll(calmMotion())
    setFinished(false)
    sfx.open()
    if (onFact) onFact(null)
  }

  const closeOverlay = () => {
    setActivePhenom(null)
    sfx.close()
  }

  // Ketuk di mana saja pada overlay (selain tombol) = tampilkan seluruh teks
  const handleOverlayClick = (e) => {
    if (!activePhenom || revealAll) return
    if (e.target.closest && e.target.closest('button')) return
    setRevealAll(true)
  }

  // Esc closes the cinematic overlay
  useEffect(() => {
    if (!activePhenom) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeOverlay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activePhenom])

  const typing = !revealAll && !finished

  return (
    <section id="phenomena" className={`cosmic-section ${styles.phenomena}`}>
      <div className="noise-overlay" />
      <div className={styles.bgGradient} />

      <div className={styles.header}>
        <p className="t-label">Stage II: Beyond the Solar System</p>
        <h2 className={styles.title}>Cosmic Phenomena</h2>
        <p className={styles.subtitle}>The most extreme things in the universe</p>
      </div>

      <div className={styles.scatterGrid}>
        {PHENOMENA.map((p) => (
          <TiltCard key={p.id} p={p} onClick={handleSelect} />
        ))}
      </div>

      <div className={styles.nextNav}>
        <button className={styles.nextBtn} onClick={onNext}>
          Enter Deep Space <span className={styles.arrow}>↓</span>
        </button>
      </div>

      {createPortal(
        <div
          className={`${styles.cinematicOverlay} ${activePhenom ? styles.open : ''} ${activePhenom && typing ? styles.tappable : ''}`}
          role="dialog"
          aria-modal="true"
          aria-hidden={!activePhenom}
          onClick={handleOverlayClick}
        >
          {activePhenom && (
            <>
              <button className={styles.closeBtn} onClick={closeOverlay} autoFocus>
                [ ESC ] ABORT
              </button>
              <div className={styles.cinematicContent}>
                <div className={styles.cinematicIconWrap} style={{ '--glow': activePhenom.glowColor }}>
                  {getIcon(activePhenom.id)}
                </div>
                <div className={styles.cinematicTextData}>
                  <p className="t-label" style={{ color: activePhenom.glowColor, marginBottom: '10px' }}>
                    DATA FRAGMENT ACQUIRED
                  </p>
                  <h2 className={styles.cinematicTitle} style={{ '--glow': activePhenom.glowColor }}>
                    {activePhenom.name}
                  </h2>
                  <div className={styles.cinematicDesc}>
                    <Typewriter text={activePhenom.description} speed={25} instant={revealAll} />
                  </div>
                  <div className={styles.terminalExtra} style={{ '--glow': activePhenom.glowColor }}>
                    <strong>&gt; ANALYSIS: </strong>
                    <Typewriter
                      text={activePhenom.fact2}
                      speed={30}
                      delay={activePhenom.description.length * 25 + 500}
                      instant={revealAll}
                      onDone={() => setFinished(true)}
                    />
                    <span className={styles.cursorBlock}>█</span>
                  </div>
                  {typing && (
                    <button
                      type="button"
                      className={styles.skipBtn}
                      onClick={() => setRevealAll(true)}
                    >
                      Show all text
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </section>
  )
}

export default memo(Phenomena)

// ── ANIMATED SVG ICONS ─────────────────────────────────────────────────
// Animation classes live in Phenomena.module.css (ico*). All rotate/scale
// around the viewBox centre (30,30) and respect prefers-reduced-motion.
function getIcon(id) {
  switch (id) {
    case 'blackhole': return <BlackHoleIcon />
    case 'supernova': return <SupernovaIcon />
    case 'nebula': return <NebulaIcon />
    case 'pulsar': return <PulsarIcon />
    case 'quasar': return <QuasarIcon />
    case 'magnetar': return <MagnetarIcon />
    case 'wormhole': return <WormholeIcon />
    case 'darkmatter': return <DarkMatterIcon />
    default: return null
  }
}

const dur = (s) => ({ animationDuration: `${s}s` })
const delay = (s) => ({ animationDelay: `${s}s` })

// Matter streaming around the event horizon
function BlackHoleIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <defs>
        <radialGradient id="bhGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="60%" stopColor="#1a0008" />
          <stop offset="100%" stopColor="#330015" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="28" fill="url(#bhGrad)" />
      <g transform="rotate(-18 30 30)">
        <ellipse cx="30" cy="30" rx="24" ry="6" fill="none" stroke="#ff55bb" strokeWidth="1.2" opacity="0.85"
          strokeDasharray="14 6" className={styles.icoDash} style={dur(2.4)} />
        <ellipse cx="30" cy="30" rx="20" ry="4" fill="none" stroke="#ff99dd" strokeWidth="0.9" opacity="0.6"
          strokeDasharray="8 12" className={`${styles.icoDash} ${styles.icoDashRev}`} style={dur(3.2)} />
        <ellipse cx="30" cy="30" rx="15" ry="3" fill="none" stroke="#ffd0ee" strokeWidth="0.7" opacity="0.5"
          strokeDasharray="4 6" className={styles.icoDash} style={dur(1.8)} />
      </g>
      <circle cx="30" cy="30" r="10" fill="#000" className={styles.icoPulse} />
      <circle cx="30" cy="30" r="11.5" fill="none" stroke="#ff55bb" strokeWidth="0.6" opacity="0.5" className={styles.icoPulse} />
    </svg>
  )
}

// Spinning rays, expanding shockwave, throbbing core
function SupernovaIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <circle cx="30" cy="30" r="10" fill="none" stroke="#ffdd55" strokeWidth="1" className={styles.icoShock} />
      <circle cx="30" cy="30" r="10" fill="none" stroke="#ffee88" strokeWidth="0.6" className={styles.icoShock} style={delay(1.3)} />
      <g className={styles.icoSpinSlow}>
        <g className={styles.icoPulse} style={dur(2.2)}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <line key={i} x1="30" y1="30"
              x2={30 + 24 * Math.cos((angle * Math.PI) / 180)}
              y2={30 + 24 * Math.sin((angle * Math.PI) / 180)}
              stroke="#ffdd55" strokeWidth={i % 2 === 0 ? 1.5 : 0.8} opacity={i % 2 === 0 ? 0.9 : 0.5} />
          ))}
        </g>
      </g>
      <circle cx="30" cy="30" r="9" fill="#ffee88" opacity="0.9" className={styles.icoPulse} style={dur(1.6)} />
      <circle cx="30" cy="30" r="5" fill="#ffffff" opacity="0.95" />
    </svg>
  )
}

// Slowly churning gas clouds with twinkling newborn stars
function NebulaIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <g className={styles.icoSpinSlow} style={dur(40)}>
        <ellipse cx="30" cy="28" rx="22" ry="14" fill="#aa55ff" opacity="0.25" />
        <ellipse cx="22" cy="30" rx="10" ry="14" fill="#cc77ff" opacity="0.25" transform="rotate(20 22 30)" />
        <ellipse cx="38" cy="30" rx="10" ry="14" fill="#9944ee" opacity="0.25" transform="rotate(-20 38 30)" />
      </g>
      <g className={styles.icoSpinRev} style={dur(55)}>
        <ellipse cx="30" cy="32" rx="18" ry="10" fill="#8833dd" opacity="0.35" className={styles.icoPulse} style={dur(5)} />
      </g>
      <circle cx="30" cy="30" r="4" fill="#fff" opacity="0.9" className={styles.icoPulse} />
      <circle cx="30" cy="30" r="6" fill="none" stroke="#cc99ff" strokeWidth="0.5" opacity="0.6" className={styles.icoPulse} style={dur(4)} />
      <circle cx="16" cy="22" r="1" fill="#fff" className={styles.icoTwinkle} />
      <circle cx="43" cy="38" r="1.1" fill="#fff" className={styles.icoTwinkle} style={delay(0.8)} />
      <circle cx="38" cy="18" r="0.8" fill="#fff" className={styles.icoTwinkle} style={delay(1.5)} />
    </svg>
  )
}

// Lighthouse beams sweeping around a tiny core
function PulsarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <ellipse cx="30" cy="30" rx="26" ry="4" fill="none" stroke="#55ffdd" strokeWidth="1" opacity="0.6" transform="rotate(15 30 30)" />
      <ellipse cx="30" cy="30" rx="26" ry="4" fill="none" stroke="#55ffdd" strokeWidth="0.6" opacity="0.3" transform="rotate(-15 30 30)" />
      <g className={styles.icoBeam}>
        <line x1="30" y1="4" x2="30" y2="20" stroke="#99ffee" strokeWidth="1.5" opacity="0.9" />
        <line x1="30" y1="40" x2="30" y2="56" stroke="#99ffee" strokeWidth="1.5" opacity="0.9" />
        <line x1="30" y1="2" x2="30" y2="20" stroke="#55ffdd" strokeWidth="4" opacity="0.12" />
        <line x1="30" y1="40" x2="30" y2="58" stroke="#55ffdd" strokeWidth="4" opacity="0.12" />
      </g>
      <circle cx="30" cy="30" r="8" fill="#55ffdd" opacity="0.9" className={styles.icoPulse} style={dur(0.8)} />
    </svg>
  )
}

// Rotating jets and a counter-rotating accretion disk
function QuasarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <circle cx="30" cy="30" r="12" fill="#ffaa44" opacity="0.15" className={styles.icoPulse} style={dur(4)} />
      <g className={styles.icoSpinSlow}>
        {[0, 60, 120, 180, 240, 300].map((a, i) => (
          <line key={i} x1="30" y1="30"
            x2={30 + 26 * Math.cos((a * Math.PI) / 180)}
            y2={30 + 26 * Math.sin((a * Math.PI) / 180)}
            stroke="#ffcc44" strokeWidth="0.7" opacity="0.45" />
        ))}
      </g>
      <g className={styles.icoSpinRev} style={dur(10)}>
        <ellipse cx="30" cy="30" rx="22" ry="5" fill="none" stroke="#ffaa44" strokeWidth="1" opacity="0.55" transform="rotate(30 30 30)" />
      </g>
      <line x1="30" y1="2" x2="30" y2="22" stroke="#ffe0a0" strokeWidth="1.4" className={styles.icoFlicker} />
      <line x1="30" y1="38" x2="30" y2="58" stroke="#ffe0a0" strokeWidth="1.4" className={styles.icoFlicker} style={delay(0.5)} />
      <circle cx="30" cy="30" r="7" fill="#ffcc66" opacity="0.6" />
      <circle cx="30" cy="30" r="4" fill="#ffffff" opacity="0.95" className={styles.icoPulse} style={dur(1.8)} />
    </svg>
  )
}

// Magnetic field loops sweeping around the star
function MagnetarIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} className={i % 2 ? styles.icoSpinRev : styles.icoSpin} style={dur(7 + i * 3)}>
          <ellipse cx="30" cy="30" rx={12 + i * 4} ry={4 + i * 1.5}
            fill="none" stroke="#55aaff" strokeWidth="0.7"
            opacity={0.65 - i * 0.12} transform={`rotate(${i * 22} 30 30)`} />
        </g>
      ))}
      <line x1="30" y1="2" x2="30" y2="14" stroke="#aaddff" strokeWidth="2" className={styles.icoFlicker} />
      <line x1="30" y1="46" x2="30" y2="58" stroke="#aaddff" strokeWidth="2" className={styles.icoFlicker} style={delay(0.4)} />
      <circle cx="30" cy="30" r="8" fill="#55aaff" opacity="0.9" className={styles.icoPulse} style={dur(1.4)} />
    </svg>
  )
}

// Rings streaming inward: a tunnel through spacetime
function WormholeIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <defs>
        <radialGradient id="whGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#000" />
          <stop offset="40%" stopColor="#220044" />
          <stop offset="100%" stopColor="#440088" />
        </radialGradient>
      </defs>
      <circle cx="30" cy="30" r="24" fill="url(#whGrad)" />
      {[22, 18, 14, 10, 6].map((r, i) => (
        <ellipse key={i} cx="30" cy="30" rx={r} ry={r * 0.35}
          fill="none" stroke="#aa55ff" strokeWidth="0.8"
          className={styles.icoTunnel} style={delay(-i * 0.6)} />
      ))}
      <circle cx="30" cy="30" r="4" fill="#cc88ff" opacity="0.9" className={styles.icoPulse} style={dur(2)} />
    </svg>
  )
}

// Invisible halo: orbiting dashed shells and flickering particles
function DarkMatterIcon() {
  return (
    <svg viewBox="0 0 60 60" width="60%" height="60%">
      <circle cx="30" cy="30" r="24" fill="#050508" opacity="0.9" />
      {[14, 20, 26].map((r, i) => (
        <circle key={i} cx="30" cy="30" r={r}
          fill="none" stroke="#778899" strokeWidth="0.6" strokeDasharray="2 4"
          opacity={0.3 + i * 0.1}
          className={i % 2 ? styles.icoSpinRev : styles.icoSpin} style={dur(16 + i * 8)} />
      ))}
      <circle cx="30" cy="30" r="4" fill="transparent" stroke="#aabbcc" strokeWidth="1" opacity="0.5" className={styles.icoPulse} style={dur(5)} />
      <circle cx="22" cy="22" r="1.5" fill="#99aabb" className={styles.icoTwinkle} />
      <circle cx="40" cy="26" r="1" fill="#99aabb" className={styles.icoTwinkle} style={delay(0.7)} />
      <circle cx="25" cy="40" r="1.2" fill="#99aabb" className={styles.icoTwinkle} style={delay(1.4)} />
      <circle cx="38" cy="38" r="0.8" fill="#99aabb" className={styles.icoTwinkle} style={delay(2)} />
    </svg>
  )
}
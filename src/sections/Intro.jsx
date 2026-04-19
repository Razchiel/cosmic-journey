import { useEffect, useRef } from 'react'
import styles from './Intro.module.css'

export default function Intro() {
  const earthRef = useRef(null)

  // Subtle shrink on scroll
  useEffect(() => {
    const onScroll = () => {
      const progress = Math.min(window.scrollY / window.innerHeight, 1)
      if (earthRef.current) {
        const scale = 1 - progress * 0.45
        const opacity = 1 - progress * 1.2
        earthRef.current.style.transform = `scale(${scale})`
        earthRef.current.style.opacity = Math.max(0, opacity)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section id="intro" className={`cosmic-section ${styles.intro}`}>
      <div className="noise-overlay" />

      {/* Radial nebula bg */}
      <div className={styles.nebulaBg} />

      <div ref={earthRef} className={styles.earthWrap}>
        <EarthSVG />
        <div className={styles.earthGlow} />
        <div className={styles.atmosphereRing} />
      </div>

      <div className={styles.content}>
        <p className={`t-label ${styles.coords}`}>
          3.844 × 10⁵ km from home
        </p>
        <h1 className={styles.heading}>
          You are leaving<br />
          <em>home...</em>
        </h1>
        <p className={styles.sub}>
          A journey through 13.8 billion years of cosmic history awaits.
        </p>

        <button
          className={styles.beginBtn}
          onClick={() => document.getElementById('solar')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Begin the Journey
          <span className={styles.arrow}>↓</span>
        </button>
      </div>

      <div className={styles.scrollHint}>
        <span>scroll</span>
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}

function EarthSVG() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="earth-svg" style={{ width: '100%', height: '100%' }}>
      <defs>
        <radialGradient id="earthGrad" cx="38%" cy="35%">
          <stop offset="0%" stopColor="#5ab8f8" />
          <stop offset="45%" stopColor="#2272cc" />
          <stop offset="100%" stopColor="#0a2860" />
        </radialGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="75%" stopColor="rgba(80,140,220,0.08)" />
          <stop offset="100%" stopColor="rgba(80,140,220,0.25)" />
        </radialGradient>
        <clipPath id="earthClip">
          <circle cx="100" cy="100" r="78" />
        </clipPath>
      </defs>

      {/* Base ocean */}
      <circle cx="100" cy="100" r="78" fill="url(#earthGrad)" />

      {/* Landmasses */}
      <g clipPath="url(#earthClip)" fill="#2d8a3a" opacity="0.88">
        <ellipse cx="72" cy="72" rx="22" ry="16" transform="rotate(-20 72 72)" />
        <ellipse cx="60" cy="95" rx="14" ry="22" transform="rotate(10 60 95)" />
        <ellipse cx="130" cy="80" rx="18" ry="12" transform="rotate(-15 130 80)" />
        <ellipse cx="145" cy="100" rx="10" ry="18" />
        <ellipse cx="85" cy="140" rx="16" ry="9" transform="rotate(30 85 140)" />
        <ellipse cx="115" cy="145" rx="12" ry="7" />
        <ellipse cx="42" cy="120" rx="8" ry="12" transform="rotate(-10 42 120)" />
        <ellipse cx="160" cy="130" rx="9" ry="6" transform="rotate(20 160 130)" />
      </g>

      {/* Ice caps */}
      <ellipse cx="100" cy="26" rx="28" ry="10" fill="#e8f4ff" opacity="0.5" clipPath="url(#earthClip)" />
      <ellipse cx="100" cy="174" rx="22" ry="8" fill="#e8f4ff" opacity="0.4" clipPath="url(#earthClip)" />

      {/* Cloud wisps */}
      <g clipPath="url(#earthClip)" fill="white" opacity="0.28">
        <ellipse cx="88" cy="58" rx="28" ry="5" transform="rotate(-12 88 58)" />
        <ellipse cx="120" cy="115" rx="24" ry="4" transform="rotate(8 120 115)" />
        <ellipse cx="65" cy="130" rx="18" ry="4" transform="rotate(-5 65 130)" />
        <ellipse cx="140" cy="65" rx="16" ry="3" transform="rotate(15 140 65)" />
      </g>

      {/* Atmosphere glow */}
      <circle cx="100" cy="100" r="78" fill="url(#glowGrad)" />

      {/* Specular highlight */}
      <ellipse cx="72" cy="68" rx="18" ry="10" fill="white" opacity="0.07" transform="rotate(-30 72 68)" />
    </svg>
  )
}

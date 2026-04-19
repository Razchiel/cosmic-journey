import { useState } from 'react'
import { PLANETS } from '../data/index.js'
import styles from './SolarSystem.module.css'

export default function SolarSystem({ onFact }) {
  const [hovered, setHovered] = useState(null)

  return (
    <section id="solar" className={`cosmic-section ${styles.solar}`}>
      <div className="noise-overlay" />
      <div className={styles.bgGradient} />

      <div className={styles.header}>
        <p className="t-label">Stage I — 1 AU from Earth</p>
        <h2 className={styles.title}>The Solar System</h2>
        <p className={styles.hint}>Click any planet to discover its secrets</p>
      </div>

      {/* Sun glow on the left */}
      <div className={styles.sunGlow} />

      <div className={styles.planetsRow}>
        {PLANETS.map((planet, i) => (
          <div
            key={planet.id}
            className={styles.planetWrap}
            style={{ animationDelay: `${i * -1.3}s` }}
            onMouseEnter={() => setHovered(planet.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() =>
              onFact({
                title: planet.name,
                subtitle: `${planet.type} · ${planet.moons} moon${planet.moons !== 1 ? 's' : ''}`,
                text: planet.fact,
                extra: `Orbital period: ${planet.orbit}`,
              })
            }
            role="button"
            tabIndex={0}
            aria-label={`Learn about ${planet.name}`}
            onKeyDown={(e) => e.key === 'Enter' && onFact({ title: planet.name, text: planet.fact })}
          >
            <div
              className={styles.planetOrb}
              style={{
                width: planet.size,
                height: planet.size,
                background: planet.gradient,
                boxShadow: hovered === planet.id
                  ? `0 0 40px ${planet.glow}, 0 0 80px ${planet.shadow}`
                  : `0 0 20px ${planet.shadow}`,
              }}
            >
              {/* Saturn rings */}
              {planet.rings && (
                <div className={styles.rings} style={{ borderColor: `${planet.color}55` }} />
              )}

              {/* Jupiter bands */}
              {planet.bands && (
                <div className={styles.bands}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', height: '18%', top: '25%' }} />
                  <div style={{ background: 'rgba(200,140,80,0.15)', height: '12%', top: '48%' }} />
                  <div style={{ background: 'rgba(255,255,255,0.04)', height: '14%', top: '65%' }} />
                </div>
              )}
            </div>

            <p className={styles.planetName}>{planet.name}</p>

            {hovered === planet.id && (
              <div className={styles.orbitRing} style={{ borderColor: `${planet.color}30` }} />
            )}
          </div>
        ))}
      </div>

      {/* Orbit lines decoration */}
      <div className={styles.orbitLines}>
        {[120, 180, 250, 320, 400, 470].map((r, i) => (
          <div key={i} className={styles.orbitLine} style={{ width: r * 2, height: r * 2, borderRadius: '50%', opacity: 0.04 + i * 0.01 }} />
        ))}
      </div>
    </section>
  )
}

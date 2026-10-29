import { memo } from 'react'
import styles from './NavDots.module.css'

const SECTIONS = [
  { id: 'intro', label: 'Departure' },
  { id: 'solar', label: 'Solar System' },
  { id: 'phenomena', label: 'Phenomena' },
  { id: 'deepspace', label: 'Deep Space' },
  { id: 'ending', label: 'Reflection' },
]

function NavDots({ active, onNavigate }) {
  return (
    <nav className={styles.nav} aria-label="Section navigation">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          className={`${styles.dot} ${active === id ? styles.active : ''}`}
          onClick={() => onNavigate(id)}
          aria-label={`Go to ${label}`}
          title={label}
        >
          <span className={styles.tooltip}>{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default memo(NavDots)
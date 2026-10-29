import { memo } from 'react'
import styles from './NavDots.module.css'

const SECTIONS = [
  { id: 'intro', label: 'Departure' },
  { id: 'solar', label: 'Solar System' },
  { id: 'phenomena', label: 'Phenomena' },
  { id: 'deepspace', label: 'Deep Space' },
  { id: 'ending', label: 'Reflection' },
  { id: 'wishing', label: 'Wishing Star' },
  { id: 'gallery', label: 'Astronaut Gallery' },
]

function NavDots({ active, onNavigate }) {
  return (
    <nav className={styles.nav} aria-label="Section navigation">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          className={`${styles.dot} ${active === id ? styles.active : ''}`}
          onClick={() => onNavigate(id)}
          aria-label={`Go to ${label}`}
          aria-current={active === id ? 'step' : undefined}
        >
          <span className={styles.tooltip} aria-hidden="true">{label}</span>
        </button>
      ))}
    </nav>
  )
}

export default memo(NavDots)
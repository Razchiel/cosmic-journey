import styles from './NavDots.module.css'

const SECTIONS = [
  { id: 'intro', label: 'Departure' },
  { id: 'solar', label: 'Solar System' },
  { id: 'phenomena', label: 'Phenomena' },
  { id: 'deepspace', label: 'Deep Space' },
  { id: 'ending', label: 'Reflection' },
]

export default function NavDots({ active }) {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <nav className={styles.nav} aria-label="Section navigation">
      {SECTIONS.map(({ id, label }) => (
        <button
          key={id}
          className={`${styles.dot} ${active === id ? styles.active : ''}`}
          onClick={() => scrollTo(id)}
          aria-label={`Go to ${label}`}
          title={label}
        >
          <span className={styles.tooltip}>{label}</span>
        </button>
      ))}
    </nav>
  )
}

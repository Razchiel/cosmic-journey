import styles from './Ending.module.css'

export default function Ending({ onMessage }) {
  return (
    <section id="ending" className={`cosmic-section ${styles.ending}`}>
      <div className="noise-overlay" />
      <div className={styles.bgGradient} />

      {/* Decorative star ring */}
      <div className={styles.starRing}>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={styles.starDot}
            style={{
              '--angle': `${i * 30}deg`,
              '--delay': `${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.content}>
        <p className="t-label" style={{ marginBottom: '1.5rem' }}>
          Final Transmission
        </p>

        <h2 className={styles.title}>
          The Universe<br />
          <em>has a message for you</em>
        </h2>

        <p className={styles.sub}>
          You have traveled 13.8 billion years of cosmic history.<br />
          You have witnessed the birth and death of stars.<br />
          Now — receive what the cosmos wishes to say to you.
        </p>

        <button className={styles.messageBtn} onClick={onMessage}>
          <span className={styles.btnStar}>✦</span>
          Receive your message
          <span className={styles.btnStar}>✦</span>
        </button>

        <p className={styles.footer}>
          Every journey through the cosmos begins and ends at home.
        </p>
      </div>
    </section>
  )
}

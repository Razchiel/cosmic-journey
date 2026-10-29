import { useEffect, useMemo, useRef } from 'react'
import styles from './EntryGate.module.css'

const STAR_COUNT = 36
const EXIT_MS = 700
const EXIT_MS_REDUCED = 150

const prefersReduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Bintang gerbang dibuat sekali per mount (murni CSS, tanpa canvas)
function makeStars() {
    return Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1 + Math.random() * 2,
        dur: 2.4 + Math.random() * 3.2,
        delay: -Math.random() * 5,
        o: 0.45 + Math.random() * 0.55,
    }))
}

// onEnter(true)  = masuk dengan suara (HARUS dipanggil sinkron di handler ketukan)
// onEnter(false) = masuk tanpa suara
// leaving        = App sudah menerima ketukan, gerbang memudar lalu memanggil onExited
export default function EntryGate({ onEnter, leaving = false, onExited }) {
    const stars = useMemo(makeStars, [])
    const rootRef = useRef(null)
    const boardRef = useRef(null)
    const exitedRef = useRef(onExited)
    exitedRef.current = onExited

    useEffect(() => {
        boardRef.current?.focus({ preventScroll: true })
    }, [])

    useEffect(() => {
        if (!leaving) return
        const t = setTimeout(
            () => exitedRef.current?.(),
            prefersReduced() ? EXIT_MS_REDUCED : EXIT_MS
        )
        return () => clearTimeout(t)
    }, [leaving])

    // Fokus dikunci di dalam gerbang (dua tombol saja)
    const onKeyDown = (e) => {
        if (e.key !== 'Tab') return
        const items = rootRef.current?.querySelectorAll('button')
        if (!items || items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }

    const choose = (withSound) => {
        if (leaving) return
        onEnter(withSound)
    }

    return (
        <div
            ref={rootRef}
            className={`${styles.gate} ${leaving ? styles.leaving : ''}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="gate-title"
            aria-describedby="gate-note"
            onKeyDown={onKeyDown}
        >
            <div className={styles.sky} aria-hidden="true">
                {stars.map((s, i) => (
                    <span
                        key={i}
                        className={styles.star}
                        style={{
                            left: `${s.x}%`,
                            top: `${s.y}%`,
                            width: `${s.size}px`,
                            height: `${s.size}px`,
                            '--d': `${s.dur}s`,
                            '--delay': `${s.delay}s`,
                            '--o': s.o,
                        }}
                    />
                ))}
            </div>

            <div className={styles.content}>
                <div className={styles.core} aria-hidden="true">
                    <span className={styles.coreRing} />
                    <span className={styles.coreDot} />
                </div>

                <h2 id="gate-title" className={styles.kicker}>Cosmic Journey</h2>

                <button
                    ref={boardRef}
                    type="button"
                    className={styles.boardBtn}
                    onClick={() => choose(true)}
                >
                    Board the ship
                </button>

                <p id="gate-note" className={styles.note}>Best with sound on</p>

                <button
                    type="button"
                    className={styles.quiet}
                    onClick={() => choose(false)}
                >
                    Continue without sound
                </button>
            </div>
        </div>
    )
}
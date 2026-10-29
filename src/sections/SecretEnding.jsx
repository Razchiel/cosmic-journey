import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { sfx } from '../hooks/useSfx.js'
import styles from './SecretEnding.module.css'

const LINE_COUNT = 4

const prefersReduced = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

function SecretEnding({ visitor, onVisitorChange, onStay, onGallery, onReturnHome }) {
    const sub = visitor?.mySubmission
    const callsign = sub?.displayName || visitor?.name || 'Traveler'
    const isPrivate = Boolean(sub?.isPrivate)

    // Sudah pernah melihat urutan ini (mis. kembali dari "Stay with my constellation")
    // maka langsung tampil lengkap, tanpa mengulang sinematiknya.
    const seen = useRef(Boolean(visitor?.secretSeen)).current
    const reduce = useMemo(() => prefersReduced(), [])

    const lines = useMemo(() => [
        { id: 'a', big: true, lead: 'Your wish is now a star.' },
        {
            id: 'b',
            lead: 'Thank you, ',
            name: callsign,
            tail: ', for spending a little time here.',
        },
        {
            id: 'c',
            lead: isPrivate
                ? 'Your words went only to the person who built this site.'
                : 'Your words will sit among the other astronauts, for anyone who passes by.',
        },
        {
            id: 'd',
            lead: 'Every light you saw here travelled a very long way to reach you. Thank you for looking up.',
        },
    ], [callsign, isPrivate])

    const [shown, setShown] = useState(seen ? LINE_COUNT : 0)
    const [ready, setReady] = useState(seen)
    const timers = useRef([])
    const sectionRef = useRef(null)
    const primaryRef = useRef(null)

    // Bintang kecil pelengkap langit (posisi acak, dibuat sekali)
    const dots = useMemo(() => Array.from({ length: reduce ? 14 : 22 }, () => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 1.5 + Math.random() * 1.8,
        delay: 0.8 + Math.random() * 5,
        dur: 2.6 + Math.random() * 2.4,
    })), [reduce])

    const clearTimers = () => {
        timers.current.forEach(clearTimeout)
        timers.current = []
    }

    useEffect(() => {
        if (seen) return
        const start = reduce ? 900 : 2400
        const gap = reduce ? 3200 : 4800

        for (let i = 0; i < LINE_COUNT; i++) {
            timers.current.push(setTimeout(() => {
                setShown(i + 1)
                if (i === 0) sfx.chime(2)
            }, start + i * gap))
        }
        timers.current.push(setTimeout(() => {
            setReady(true)
            onVisitorChange?.({ secretSeen: true })
            sfx.chime(4)
        }, start + (LINE_COUNT - 1) * gap + 3000))

        return clearTimers
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Tombol pilihan muncul: fokus ke tombol utama, supaya pengguna keyboard tidak "kehilangan"
    // fokus saat tombol Skip hilang. Tidak mencuri fokus jika pengguna sedang di tempat lain.
    useEffect(() => {
        if (!ready) return
        const a = document.activeElement
        if (!a || a === document.body || sectionRef.current?.contains(a)) {
            primaryRef.current?.focus({ preventScroll: true })
        }
    }, [ready])

    const handleSkip = () => {
        sfx.click()
        clearTimers()
        setShown(LINE_COUNT)
        setReady(true)
        onVisitorChange?.({ secretSeen: true })
    }

    const act = (fn) => () => {
        sfx.click()
        fn?.()
    }

    return (
        <section ref={sectionRef} id="secret-ending" className={styles.secret} aria-label="Thank you">
            <div className={styles.sky} aria-hidden="true">
                {dots.map((d, i) => (
                    <span
                        key={i}
                        className={styles.dot}
                        style={{
                            left: `${d.x}%`,
                            top: `${d.y}%`,
                            width: `${d.size}px`,
                            height: `${d.size}px`,
                            '--d': `${d.delay}s`,
                            '--dur': `${d.dur}s`,
                        }}
                    />
                ))}
            </div>

            <div className={styles.stage}>
                <div className={styles.inner}>
                    <div className={`${styles.starBox} ${seen ? styles.instant : ''}`} aria-hidden="true">
                        <div className={styles.halo} />
                        <svg viewBox="0 0 100 100" className={styles.starSvg}>
                            <path
                                d="M50 4 C53 38 62 47 96 50 C62 53 53 62 50 96 C47 62 38 53 4 50 C38 47 47 38 50 4Z"
                                fill="#fff"
                            />
                            <circle cx="50" cy="50" r="7" fill="#fff" />
                        </svg>
                    </div>

                    <p className={`${styles.tag} ${seen ? styles.instant : ''}`}>
                        ✦ {callsign}’s wish
                    </p>

                    <div className={styles.lines} aria-live="polite">
                        {lines.slice(0, shown).map((l) => (
                            <p
                                key={l.id}
                                className={`${styles.line} ${l.big ? styles.lineBig : ''} ${seen ? styles.instant : ''}`}
                            >
                                {l.lead}
                                {l.name && <span className={styles.name}>{l.name}</span>}
                                {l.tail}
                            </p>
                        ))}
                    </div>

                    {!ready && (
                        <button type="button" className={styles.skip} onClick={handleSkip}>
                            Skip ›
                        </button>
                    )}

                    {ready && (
                        <div className={styles.actions}>
                            <button
                                ref={primaryRef}
                                type="button"
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                style={{ '--d': '0s' }}
                                onClick={act(onStay)}
                            >
                                Stay with my constellation
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnSecondary}`}
                                style={{ '--d': '0.15s' }}
                                onClick={act(onGallery)}
                            >
                                View the Gallery
                            </button>
                            <button
                                type="button"
                                className={`${styles.btn} ${styles.btnGhost}`}
                                style={{ '--d': '0.3s' }}
                                onClick={act(onReturnHome)}
                            >
                                Return home
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default memo(SecretEnding)
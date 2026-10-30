// src/sections/Gallery.jsx [UBAH: menimpa file lama]
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './Gallery.module.css'
import { getWishes, CATEGORIES, PAGE_SIZE } from '../services/wishes.js'
import { sfx } from '../hooks/useSfx.js'

const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]))
const SORTS = [
    { id: 'newest', label: 'Newest' },
    { id: 'rating', label: 'Highest rated' },
]

// Apresiasi untuk dua tester pertama. Dicocokkan lewat id wish asli (bukan nama),
// jadi orang lain yang mengetik "Liya" atau "Rei" tidak mendapat highlight ini.
// tone: nama class di CSS (crewRed / crewYellow). rank: urutan kiriman terawal.
const FIRST_CREW = {
    '9f7bf490-9f21-4218-8ff2-2b6bd327a901': { rank: 1, tone: 'crewRed', title: 'First crew' },     // Liya
    '57a8b359-3db4-4f5e-bc83-46f0a5979f6a': { rank: 2, tone: 'crewYellow', title: 'Second crew' }, // Rei
}

// Bintang kecil berdenyut di latar (posisi deterministik, dihitung sekali)
const STAR_DOTS = Array.from({ length: 32 }, (_, i) => {
    const r = (n) => {
        const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453
        return x - Math.floor(x)
    }
    return { left: r(1) * 100, top: r(2) * 100, size: 1 + r(3) * 2, delay: r(4) * 5, dur: 3 + r(5) * 4 }
})

function timeAgo(iso) {
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d}d ago`
    const w = Math.floor(d / 7)
    if (d < 30) return `${w}w ago`
    const mo = Math.floor(d / 30)
    if (mo < 12) return `${mo}mo ago`
    return `${Math.floor(d / 365)}y ago`
}

function Helmet() {
    return (
        <svg className={styles.helmet} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
            <path d="M16 3C9 3 4.5 8 4.5 14.5V19c0 4 3 7 6.5 7h10c3.5 0 6.500-3 6.500-7v-4.500C27.500 8 23 3 16 3z"
                fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 13.500c0-2.800 2.800-4.800 7-4.800s7 2 7 4.800v2.200c0 2.600-2.800 4.300-7 4.300s-7-1.700-7-4.300z"
                fill="rgba(136,170,255,0.18)" stroke="currentColor" strokeWidth="1.2" />
            <path d="M11.500 12c1-.9 2.300-1.300 3.800-1.300" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
    )
}

function Stars({ value }) {
    return (
        <span className={styles.stars} role="img" aria-label={`Rated ${value} out of 5`}>
            {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} aria-hidden="true" className={n <= value ? styles.starOn : styles.starOff}>★</span>
            ))}
        </span>
    )
}

// Kartu yang diberi hati oleh Raz. Tambahkan id wish lain di sini kapan saja.
const LOVED_BY_RAZ = new Set([
    '9f7bf490-9f21-4218-8ff2-2b6bd327a901', // Liya
    '57a8b359-3db4-4f5e-bc83-46f0a5979f6a', // Rei
])

// Hati kecil ala "like": hover/fokus menampilkan teks. Di layar sentuh, ketuk untuk melihat teksnya.
function LovedHeart() {
    const [open, setOpen] = useState(false)
    const timer = useRef(0)

    useEffect(() => () => clearTimeout(timer.current), [])

    const tap = () => {
        clearTimeout(timer.current)
        if (open) {
            setOpen(false)
            return
        }
        setOpen(true)
        timer.current = setTimeout(() => setOpen(false), 2200)
    }

    return (
        <span className={styles.lovedWrap} data-open={open}>
            <button
                type="button"
                className={styles.lovedBtn}
                aria-label="Loved by Raz"
                onClick={tap}
                onBlur={() => setOpen(false)}
            >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                    <path
                        fill="currentColor"
                        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    />
                </svg>
            </button>
            <span className={styles.lovedTip} aria-hidden="true">Loved by Raz</span>
        </span>
    )
}

function Card({ item, mine }) {
    const crew = FIRST_CREW[item.id]
    const loved = LOVED_BY_RAZ.has(item.id)
    const cls = [
        styles.card,
        mine ? styles.mine : '',
        crew ? `${styles.crew} ${styles[crew.tone]}` : '',
    ].join(' ')
    return (
        <article className={cls}>
            {mine && <span className={styles.yourBadge}>Your wish</span>}
            <header className={styles.cardHead}>
                <Helmet />
                <div className={styles.who}>
                    <span className={styles.nameRow}>
                        <span className={styles.name}>{item.displayName}</span>
                        {crew && (
                            <span
                                className={`${styles.crewBadge} ${crew.rank === 1 ? styles.rankGold : styles.rankSilver}`}
                                role="img"
                                aria-label={`First crew member number ${crew.rank}`}
                            >
                                #{crew.rank}
                            </span>
                        )}
                    </span>
                    <span className={styles.role}>
                        {crew ? crew.title : item.isAnonymous ? 'Anonymous astronaut' : 'Astronaut'}
                    </span>
                </div>
                <Stars value={item.rating} />
            </header>
            <p className={styles.message}>{item.message}</p>
            <footer className={styles.cardFoot}>
                <span className={styles.cat}>{CATEGORY_LABEL[item.category] ?? item.category}</span>
                <span className={styles.footRight}>
                    {loved && <LovedHeart />}
                    <time className={styles.time} dateTime={item.createdAt}>{timeAgo(item.createdAt)}</time>
                </span>
            </footer>
        </article>
    )
}

function Skeletons() {
    return (
        <div className={styles.grid} role="status" aria-label="Loading messages">
            {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`${styles.card} ${styles.skel}`} aria-hidden="true">
                    <div className={styles.skelLine} style={{ width: '55%' }} />
                    <div className={styles.skelLine} style={{ width: '95%' }} />
                    <div className={styles.skelLine} style={{ width: '80%' }} />
                    <div className={styles.skelLine} style={{ width: '35%' }} />
                </div>
            ))}
        </div>
    )
}

function Gallery({ visitor, onBackToConstellation, onReturnHome }) {
    const [sort, setSort] = useState('newest')
    const [category, setCategory] = useState('all')
    const [items, setItems] = useState([])
    const [nextCursor, setNextCursor] = useState(null)
    const [aggregate, setAggregate] = useState(null)
    const [status, setStatus] = useState('loading') // loading | ready | error
    const [more, setMore] = useState('idle')        // idle | loading | error
    const [retryKey, setRetryKey] = useState(0)
    const reqRef = useRef(0)

    const mySubmission = visitor?.mySubmission
    const cameFromSecret = Boolean(visitor?.wishSubmitted || mySubmission)
    const showMine = Boolean(
        mySubmission && !mySubmission.isPrivate && (category === 'all' || mySubmission.category === category)
    )

    useEffect(() => {
        const id = ++reqRef.current
        setStatus('loading')
        setMore('idle')
        setItems([])
        setNextCursor(null)
        getWishes({ sort, category, limit: PAGE_SIZE })
            .then((res) => {
                if (id !== reqRef.current) return
                setItems(res.items)
                setNextCursor(res.nextCursor)
                setAggregate(res.aggregate)
                setStatus('ready')
            })
            .catch(() => {
                if (id !== reqRef.current) return
                setStatus('error')
            })
        return () => { reqRef.current++ } // abaikan respons yang datang setelah unmount/ganti filter
    }, [sort, category, retryKey])

    const loadMore = useCallback(() => {
        if (!nextCursor || more === 'loading') return
        sfx.click()
        const id = reqRef.current
        setMore('loading')
        getWishes({ sort, category, cursor: nextCursor, limit: PAGE_SIZE })
            .then((res) => {
                if (id !== reqRef.current) return
                setItems((prev) => {
                    const seen = new Set(prev.map((i) => i.id))
                    return [...prev, ...res.items.filter((i) => !seen.has(i.id))]
                })
                setNextCursor(res.nextCursor)
                setMore('idle')
            })
            .catch(() => {
                if (id !== reqRef.current) return
                setMore('error')
            })
    }, [nextCursor, more, sort, category])

    const pick = (setter, value, current) => {
        if (value === current) return
        sfx.click()
        setter(value)
    }

    const summary = useMemo(() => {
        if (!aggregate) return null
        if (!aggregate.count) return 'Be the first astronaut to leave a message'
        return `${aggregate.average.toFixed(1)} ★ from ${aggregate.count} ${aggregate.count === 1 ? 'astronaut' : 'astronauts'}`
    }, [aggregate])

    // Mode AUTO_APPROVE: wish pengirim sendiri ikut dikembalikan server. Buang dari daftar
    // supaya hanya kartu "Your wish" yang tampil. Cocokkan lewat id; cadangan: nama + pesan + rating
    // yang sama (jaga-jaga bila id lokal berbeda dari id server).
    const visibleItems = useMemo(() => {
        if (!showMine) return items
        const my = mySubmission
        return items.filter(
            (i) =>
                i.id !== my.id &&
                !(i.displayName === my.displayName && i.message === my.message && i.rating === my.rating)
        )
    }, [items, showMine, mySubmission])

    const nothing = status === 'ready' && visibleItems.length === 0 && !showMine

    return (
        <section id="gallery" className={styles.gallery}>
            <div className={styles.sky} aria-hidden="true">
                {STAR_DOTS.map((d, i) => (
                    <span
                        key={i}
                        className={styles.dot}
                        style={{
                            left: `${d.left}%`, top: `${d.top}%`,
                            width: d.size, height: d.size,
                            animationDelay: `${d.delay}s`, animationDuration: `${d.dur}s`,
                        }}
                    />
                ))}
            </div>

            <div className={styles.inner}>
                <div className={styles.topBar}>
                    <button className={styles.btn} onClick={() => { sfx.close(); onBackToConstellation?.() }}>
                        ← Back to the stars
                    </button>
                    {cameFromSecret && (
                        <button className={styles.btn} onClick={() => { sfx.click(); onReturnHome?.() }}>
                            Return home
                        </button>
                    )}
                </div>

                <header className={styles.head}>
                    <p className={styles.label}>Astronaut Gallery</p>
                    <h2 className={styles.title}>
                        Voices <em>among the stars</em>
                    </h2>
                    <p className={styles.summary} aria-live="polite">{summary ?? '\u00A0'}</p>
                </header>

                <div className={styles.controls}>
                    <div className={styles.segment} role="group" aria-label="Sort messages">
                        {SORTS.map((s) => (
                            <button
                                key={s.id}
                                className={`${styles.seg} ${sort === s.id ? styles.segOn : ''}`}
                                aria-pressed={sort === s.id}
                                onClick={() => pick(setSort, s.id, sort)}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <div className={styles.chips} role="group" aria-label="Filter by category">
                        {[{ id: 'all', label: 'All' }, ...CATEGORIES].map((c) => (
                            <button
                                key={c.id}
                                className={`${styles.chip} ${category === c.id ? styles.chipOn : ''}`}
                                aria-pressed={category === c.id}
                                onClick={() => pick(setCategory, c.id, category)}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>

                {status === 'loading' && !showMine && <Skeletons />}

                {status === 'error' && (
                    <div className={styles.state} role="alert">
                        <p>The signal got lost on its way here.</p>
                        <button className={styles.btn} onClick={() => setRetryKey((k) => k + 1)}>Try again</button>
                    </div>
                )}

                {nothing && (
                    <div className={styles.state}>
                        <p>{category === 'all'
                            ? 'No messages among the stars yet. Yours could be the first.'
                            : 'No messages in this corner of the sky yet.'}</p>
                        {category !== 'all' && (
                            <button className={styles.btn} onClick={() => pick(setCategory, 'all', category)}>Show all</button>
                        )}
                    </div>
                )}

                {(showMine || (status !== 'error' && visibleItems.length > 0)) && (
                    <div className={styles.grid}>
                        {showMine && <Card item={mySubmission} mine />}
                        {visibleItems.map((it) => <Card key={it.id} item={it} />)}
                    </div>
                )}

                {status === 'loading' && showMine && (
                    <p className={styles.loadingNote} role="status">Gathering more voices…</p>
                )}

                {status === 'ready' && nextCursor && (
                    <div className={styles.moreWrap}>
                        <button className={styles.btn} onClick={loadMore} disabled={more === 'loading'}>
                            {more === 'loading' ? 'Loading…' : 'Load more'}
                        </button>
                        {more === 'error' && (
                            <p className={styles.moreErr} role="alert">Couldn't load more. Please try again.</p>
                        )}
                    </div>
                )}
            </div>
        </section>
    )
}

export default memo(Gallery)
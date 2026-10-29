import { memo, useEffect, useId, useRef, useState } from 'react'
import { sfx } from '../hooks/useSfx.js'
import WishForm from '../components/WishForm.jsx'
import styles from './Wishing.module.css'

const rand = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.floor(rand(a, b + 1))

const HINT_AFTER = 20      // detik tanpa tangkapan sebelum glow bintang terang naik
const FADE_MS = 650        // bintang biasa memudar setelah di-tap
const BURST_MS = 1400      // ledakan cahaya bintang terang
const BURST_MS_REDUCED = 900

function Wishing({
    visitor,
    onVisitorChange,
    onGallery,
    onSubmitted,
    onBackToConstellation,
    onReturnHome,
}) {
    const uid = useId()
    const wrapRef = useRef(null)
    const canvasRef = useRef(null)
    const catchRef = useRef(null)        // diisi effect canvas: tangkap bintang terang lewat tombol bantu
    const releaseRef = useRef(null)      // diisi effect canvas: lepas bintang yang tertangkap
    const leavingRef = useRef(false)     // true setelah Skip: abaikan onCaught yang terlambat
    const resumeBtnRef = useRef(null)
    const doneBtnRef = useRef(null)

    // Wish sudah terkirim di perjalanan ini (mis. kembali lewat NavDots dari Secret Ending / Gallery):
    // tidak ada permainan lagi supaya tidak terjadi kiriman ganda. Dibaca sekali saat mount.
    const alreadyDone = useRef(Boolean(visitor?.wishSubmitted)).current

    const [hintGone, setHintGone] = useState(false) // petunjuk tengah layar hanya sekali

    useEffect(() => {
        if (alreadyDone) return
        const id = setTimeout(() => setHintGone(true), 8000)
        return () => clearTimeout(id)
    }, [alreadyDone])
    const [caught, setCaught] = useState(false)    // bintang terang sudah tertangkap
    const [formOpen, setFormOpen] = useState(false)
    const [draft, setDraft] = useState(null)       // isi form yang tersimpan saat form ditutup

    // Dipanggil dari loop canvas (lewat ref agar effect tidak perlu dibuat ulang)
    const handleCaught = () => {
        if (leavingRef.current) return
        setCaught(true)
        setFormOpen(true)
    }
    const caughtCbRef = useRef(handleCaught)
    caughtCbRef.current = handleCaught

    useEffect(() => {
        if (alreadyDone) return
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (!canvas || !wrap) return
        const ctx = canvas.getContext('2d')
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

        // ── Ukuran canvas (DPR dibatasi 1.5 agar hemat di HP) ───────────
        let w = 0, h = 0
        let settled = false   // true = loop sudah berhenti (frame terakhir tampil), resize menggambar ulang
        const resize = () => {
            const r = wrap.getBoundingClientRect()
            w = r.width
            h = r.height
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
            canvas.width = Math.max(1, Math.round(w * dpr))
            canvas.height = Math.max(1, Math.round(h * dpr))
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
            if (settled) draw()
        }
        resize()
        const ro = new ResizeObserver(resize)
        ro.observe(wrap)

        // ── State permainan (semua di ref/closure, tanpa re-render) ─────
        // Antrean: false = bintang biasa, true = bintang terang. Terang tidak pernah jadi yang pertama.
        const queue = []
        const fillQueue = () => {
            const total = reduce ? randInt(6, 8) : randInt(9, 15)
            queue.length = 0
            for (let i = 0; i < total - 1; i++) queue.push(false)
            queue.splice(randInt(1, queue.length), 0, true)
        }
        fillQueue()

        const stars = []
        let time = 0
        let nextSpawn = 0.6
        let boost = 0                 // 0..1, glow petunjuk bintang terang
        let phase = 'play'            // 'play' | 'burst' | 'release'
        let burst = null
        let done = false
        let relT = 0                  // ms sejak release dimulai
        const burstMs = reduce ? BURST_MS_REDUCED : BURST_MS
        const relMs = reduce ? 1000 : 1500
        // Batas bintang yang sedang jatuh (lebih ketat di HP dan saat reduced motion)
        const maxActive = () => (w < 768 ? 4 : 6) - (reduce ? 1 : 0)

        // Setelah release selesai: permainan mulai lagi dari awal, tanpa membongkar effect
        const resetGame = () => {
            stars.length = 0
            burst = null
            relT = 0
            done = false
            boost = 0
            time = 0
            fillQueue()
            phase = 'play'
            nextSpawn = reduce ? 1.4 : 1.0   // jeda singkat sebelum bintang berikutnya
        }

        const spawn = (bright) => {
            const x = rand(0.06 * w, 0.94 * w)
            let dir = x < w / 2 ? 1 : -1            // arah ke sisi layar yang lebih lebar
            if (!bright && Math.random() < 0.2) dir = -dir
            const room = dir > 0 ? w * 0.97 - x : x - w * 0.03
            let ang = bright ? rand(0.3, 0.7) : rand(0.35, 1.0)
            if (!bright || dir === (x < w / 2 ? 1 : -1)) {
                ang = Math.min(ang, Math.atan(Math.max(room, 40) / (h * 0.75)))
            }
            ang = Math.max(ang, 0.18)
            const base = Math.min(Math.max(h, 360), 900)
            const speed = (bright ? rand(0.15, 0.19) : rand(0.16, 0.26)) * base * (reduce ? 0.6 : 1)
            stars.push({
                x,
                y: rand(-30, -10),
                vx: dir * Math.sin(ang) * speed,
                vy: Math.cos(ang) * speed,
                bright,
                r: bright ? 4.6 : rand(1.6, 2.6),
                tail: bright ? rand(190, 230) : rand(60, 120),
                state: 'fall',          // fall | fade | caught
                t: 0,
                rx: 0, ry: 0,           // posisi riak saat di-tap
                phase: rand(0, Math.PI * 2),
            })
        }

        const requeueBright = () => {
            if (phase !== 'play') return
            queue.splice(randInt(0, Math.min(1, queue.length)), 0, true)
            if (Math.random() < 0.6) queue.unshift(false)   // selingan bintang biasa
            nextSpawn = Math.min(nextSpawn, 1.0)
        }

        // Bintang terang tertangkap (lewat tap, atau lewat tombol bantu dengan hit = null / bintang di layar)
        const catchBright = (hit) => {
            phase = 'burst'
            if (hit) { hit.state = 'caught'; hit.t = 0 }
            burst = { x: hit ? hit.x : w / 2, y: hit ? hit.y : h * 0.35, t: 0 }
            stars.forEach((s) => {
                if (s !== hit && s.state === 'fall') {
                    s.state = 'fade'; s.t = 0; s.rx = s.x; s.ry = s.y
                    s.vx *= 0.3; s.vy *= 0.3
                }
            })
            sfx.reveal()
            sfx.chime(4)
        }

        // Jalur keyboard / screen reader
        catchRef.current = () => {
            if (phase !== 'play') return
            catchBright(stars.find((s) => s.bright && s.state === 'fall') || null)
        }

        // ── Interaksi: hitbox ≥ 48px (radius 26 / 34), mencakup sedikit ekor ──
        const onPointerDown = (e) => {
            if (phase !== 'play') return
            const rect = canvas.getBoundingClientRect()
            const px = e.clientX - rect.left
            const py = e.clientY - rect.top

            let hit = null
            let best = Infinity
            for (const s of stars) {
                if (s.state !== 'fall') continue
                const R = s.bright ? 34 : 26
                const len = Math.hypot(s.vx, s.vy) || 1
                const ax = s.x, ay = s.y
                const bx = s.x - (s.vx / len) * 30
                const by = s.y - (s.vy / len) * 30
                const abx = bx - ax, aby = by - ay
                let t = ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby)
                t = Math.max(0, Math.min(1, t))
                const d = Math.hypot(px - (ax + abx * t), py - (ay + aby * t))
                if (d <= R) {
                    const score = s.bright ? d - 100 : d   // bintang terang diprioritaskan
                    if (score < best) { best = score; hit = s }
                }
            }
            if (!hit) return
            e.preventDefault()

            if (hit.bright) {
                catchBright(hit)
            } else {
                hit.state = 'fade'
                hit.t = 0
                hit.rx = hit.x
                hit.ry = hit.y
                hit.vx *= 0.3
                hit.vy *= 0.3
                sfx.click()
            }
        }
        canvas.addEventListener('pointerdown', onPointerDown, { passive: false })

        // ── Update ──────────────────────────────────────────────────────
        const update = (dt) => {
            time += dt

            if (phase === 'play') {
                if (time > HINT_AFTER) boost = Math.min(1, (time - HINT_AFTER) / 4)

                nextSpawn -= dt
                if (nextSpawn <= 0 && queue.length) {
                    const active = stars.reduce((n, s) => n + (s.state === 'fall' ? 1 : 0), 0)
                    if (active >= maxActive()) {
                        nextSpawn = 0.25
                    } else {
                        spawn(queue.shift())
                        nextSpawn = rand(0.7, 1.6) * (reduce ? 1.4 : 1)
                    }
                }
            } else if (phase === 'burst' && burst) {
                burst.t = Math.min(burst.t + dt * 1000, burstMs)
                if (burst.t >= burstMs && !done) {
                    done = true
                    caughtCbRef.current()
                }
            } else if (phase === 'release') {
                relT += dt * 1000
                // naik pelan; saat reduced motion hanya memudar
                if (burst) burst.y = burst.y0 - (reduce ? 0 : Math.min(1, relT / relMs) * h * 0.22)
                if (relT >= relMs) resetGame()
            }

            for (let i = stars.length - 1; i >= 0; i--) {
                const s = stars[i]
                s.t += dt * 1000
                if (s.state === 'caught') continue
                s.x += s.vx * dt
                s.y += s.vy * dt
                if (s.state === 'fade') {
                    if (s.t >= FADE_MS) stars.splice(i, 1)
                    continue
                }
                const len = Math.hypot(s.vx, s.vy) || 1
                const tx = s.x - (s.vx / len) * s.tail
                const ty = s.y - (s.vy / len) * s.tail
                const gone = ty > h + 10 || (s.vx > 0 && tx > w + 10) || (s.vx < 0 && tx < -10)
                if (gone) {
                    stars.splice(i, 1)
                    if (s.bright) requeueBright()   // bintang terang lolos → muncul lagi
                }
            }
        }

        // ── Gambar ──────────────────────────────────────────────────────
        const drawStar = (s) => {
            if (s.state === 'caught') return
            const len = Math.hypot(s.vx, s.vy) || 1
            const ux = s.vx / len, uy = s.vy / len
            const alpha = s.state === 'fade' ? Math.max(0, 1 - s.t / FADE_MS) : 1

            ctx.globalAlpha = alpha

            // ekor gradasi
            const tx = s.x - ux * s.tail
            const ty = s.y - uy * s.tail
            const g = ctx.createLinearGradient(tx, ty, s.x, s.y)
            g.addColorStop(0, 'rgba(170,200,255,0)')
            g.addColorStop(1, `rgba(235,243,255,${s.bright ? 0.95 : 0.8})`)
            ctx.strokeStyle = g
            ctx.lineWidth = s.bright ? 2.6 : 1.3
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(tx, ty)
            ctx.lineTo(s.x, s.y)
            ctx.stroke()

            // halo (bintang terang berdenyut halus; naik saat petunjuk)
            let R, A
            if (s.bright) {
                const pulse = reduce ? 0.5 : 0.5 + 0.5 * Math.sin(time * 2.4 + s.phase)
                R = 24 + pulse * 8 + boost * 10
                A = 0.22 + pulse * 0.12 + boost * 0.35
            } else {
                R = s.r * 5
                A = 0.4
            }
            const hg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, R)
            hg.addColorStop(0, `rgba(225,236,255,${Math.min(1, A * 2)})`)
            hg.addColorStop(0.35, `rgba(160,190,255,${A})`)
            hg.addColorStop(1, 'rgba(120,150,255,0)')
            ctx.fillStyle = hg
            ctx.beginPath()
            ctx.arc(s.x, s.y, R, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#fff'
            ctx.beginPath()
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
            ctx.fill()

            ctx.globalAlpha = 1

            // riak kecil saat bintang biasa di-tap
            if (s.state === 'fade') {
                const p = Math.min(1, s.t / FADE_MS)
                ctx.strokeStyle = `rgba(170,200,255,${0.5 * (1 - p)})`
                ctx.lineWidth = 1.2
                ctx.beginPath()
                ctx.arc(s.rx, s.ry, 6 + 34 * p, 0, Math.PI * 2)
                ctx.stroke()
            }
        }

        const drawBurst = () => {
            const p = burst.t / burstMs
            const e = 1 - Math.pow(1 - p, 3)               // ease-out
            const diag = Math.hypot(w, h)
            const A = p < 0.5 ? p * 2 : 1 - (p - 0.5) * 0.9 // naik cepat, mengendap ke ~0.55
            const R = 20 + e * diag * 0.6

            const g = ctx.createRadialGradient(burst.x, burst.y, 0, burst.x, burst.y, R)
            g.addColorStop(0, `rgba(255,255,255,${A})`)
            g.addColorStop(0.25, `rgba(205,222,255,${A * 0.8})`)
            g.addColorStop(1, 'rgba(120,150,255,0)')
            ctx.fillStyle = g
            ctx.fillRect(0, 0, w, h)

            // inti bintang membesar
            ctx.fillStyle = `rgba(255,255,255,${Math.min(1, 0.4 + p)})`
            ctx.beginPath()
            ctx.arc(burst.x, burst.y, 5 + e * 38, 0, Math.PI * 2)
            ctx.fill()

            // gelombang kejut (dilewati saat reduced motion)
            if (!reduce) {
                ctx.strokeStyle = `rgba(190,210,255,${Math.max(0, 0.7 * (1 - p))})`
                ctx.lineWidth = 2
                ctx.beginPath()
                ctx.arc(burst.x, burst.y, e * Math.min(w, h) * 0.55, 0, Math.PI * 2)
                ctx.stroke()
            }
        }

        function draw() {
            ctx.clearRect(0, 0, w, h)
            ctx.save()
            if (burst && !reduce && burst.t < 350) {      // getaran singkat, tanpa saat reduced motion
                const k = 3 * (1 - burst.t / 350)
                ctx.translate((Math.random() - 0.5) * k, (Math.random() - 0.5) * k)
            }
            stars.forEach(drawStar)
            if (burst) {
                ctx.globalAlpha = phase === 'release' ? Math.max(0, 1 - relT / relMs) : 1
                drawBurst()
                ctx.globalAlpha = 1
            }
            ctx.restore()
        }

        let raf = 0
        let last = performance.now()
        const frame = (now) => {
            const dt = Math.min((now - last) / 1000, 0.05)
            last = now
            update(dt)
            draw()
            // Setelah ledakan selesai hanya bintang tertangkap yang tersisa: tidak ada yang bergerak lagi.
            // Hentikan loop agar HP tidak menggambar ulang 60fps di belakang form (backdrop blur).
            if (phase === 'burst' && done && stars.every((s) => s.state === 'caught')) {
                settled = true
                raf = 0
                return
            }
            raf = requestAnimationFrame(frame)
        }
        raf = requestAnimationFrame(frame)

        // Release: hanya setelah ledakan selesai. Hidupkan lagi loop yang sudah berhenti (settled).
        releaseRef.current = () => {
            if (phase !== 'burst' || !done) return
            phase = 'release'
            relT = 0
            done = false
            if (burst) burst.y0 = burst.y
            if (settled) {
                settled = false
                last = performance.now()
                raf = requestAnimationFrame(frame)
            }
        }

        return () => {
            cancelAnimationFrame(raf)
            canvas.removeEventListener('pointerdown', onPointerDown)
            ro.disconnect()
            catchRef.current = null
            releaseRef.current = null
        }
    }, [alreadyDone])

    // Fokus: panel "sudah jadi bintang" saat mount; kartu resume saat form ditutup
    useEffect(() => {
        if (alreadyDone) doneBtnRef.current?.focus({ preventScroll: true })
    }, [alreadyDone])

    useEffect(() => {
        if (caught && !formOpen) resumeBtnRef.current?.focus({ preventScroll: true })
    }, [caught, formOpen])

    const handleSkip = () => {
        sfx.click()
        leavingRef.current = true
        onVisitorChange?.({ skipped: true })   // flag: skip TIDAK membuka Secret Ending
        onGallery?.()
    }

    // Form ditutup tanpa kirim: simpan isi form, tawarkan buka lagi / lepas bintang
    const handleFormClose = (savedDraft) => {
        setDraft(savedDraft)
        setFormOpen(false)
    }

    // Kiriman sukses: simpan ke state App (mySubmission)
    const handleSaved = (record) => {
        onVisitorChange?.({ mySubmission: record, wishSubmitted: true, skipped: false })
    }

    // Animasi bintang naik selesai → Secret Ending
    const handleDone = () => {
        onSubmitted?.()
    }

    const handleRelease = () => {
        sfx.click()
        setFormOpen(false)
        setCaught(false)
        releaseRef.current?.()
    }

    const handleReopen = () => {
        sfx.open()
        setFormOpen(true)
    }

    const act = (fn) => () => {
        sfx.click()
        leavingRef.current = true
        fn?.()
    }

    // ── Wish sudah terkirim: tidak ada permainan, hanya pilihan lanjut ──
    if (alreadyDone) {
        return (
            <section id="wishing" className={styles.wishing}>
                <div className={styles.resume} role="region" aria-labelledby={`${uid}-done`}>
                    <div className={styles.card}>
                        <p className={styles.cardStar} aria-hidden="true">✦</p>
                        <p id={`${uid}-done`} className={styles.cardTitle}>Your wish is already a star</p>
                        <p className={styles.cardText}>
                            You can make one wish per journey.
                            Return home to start a new one.
                        </p>
                        <div className={styles.cardActions}>
                            <button ref={doneBtnRef} className={styles.cardBtn} onClick={act(onBackToConstellation)}>
                                Stay with my constellation
                            </button>
                            <button className={styles.cardBtn} onClick={act(onGallery)}>
                                View the Gallery
                            </button>
                            <button className={styles.cardBtn} onClick={act(onReturnHome)}>
                                Return home
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section id="wishing" className={styles.wishing}>
            <div ref={wrapRef} className={styles.sky}>
                <canvas
                    ref={canvasRef}
                    className={styles.canvas}
                    role="img"
                    aria-label="Night sky with falling stars. Tap the brightest one to make a wish."
                />
            </div>

            {/* Jalur keyboard / screen reader: terlihat hanya saat difokus */}
            {!caught && (
                <button type="button" className={styles.assist} onClick={() => catchRef.current?.()}>
                    Catch the brightest star
                </button>
            )}

            <div className={styles.caption}>
                <p className={styles.label}>Wishing Star</p>
                <h2 className={styles.title}>
                    Make <em>a wish</em>
                </h2>
            </div>

            {/* Petunjuk tengah: memudar sendiri, tidak menghalangi ketukan */}
            {!caught && !hintGone && (
                <p className={styles.centerHint} aria-hidden="true">
                    Catch the brightest star to make a wish
                </p>
            )}

            <button className={styles.skip} onClick={handleSkip}>
                Skip to gallery
            </button>

            {/* Form ditutup setelah bintang tertangkap: bisa dibuka lagi atau bintang dilepas */}
            {caught && !formOpen && (
                <div className={styles.resume}>
                    <div
                        className={styles.card}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={`${uid}-resume`}
                    >
                        <p className={styles.cardStar} aria-hidden="true">✦</p>
                        <p id={`${uid}-resume`} className={styles.cardTitle}>Your star is still glowing</p>
                        <p className={styles.cardText}>
                            {draft?.message?.trim()
                                ? 'Your words are safe. Pick up where you left off.'
                                : 'Whisper your wish whenever you are ready.'}
                        </p>
                        <div className={styles.cardActions}>
                            <button ref={resumeBtnRef} className={styles.cardBtn} onClick={handleReopen}>
                                Continue my wish
                            </button>
                            <button className={styles.cardBtn} onClick={handleRelease}>
                                Release the star
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {formOpen && (
                <WishForm
                    initialDraft={draft}
                    initialName={visitor?.name}
                    onClose={handleFormClose}
                    onSaved={handleSaved}
                    onDone={handleDone}
                />
            )}
        </section>
    )
}

export default memo(Wishing)
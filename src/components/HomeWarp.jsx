import { useRef, useState, useEffect, useMemo, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sfx } from '../hooks/useSfx.js'
import styles from './HomeWarp.module.css'

// Timeline (ms)
const T_LAUNCH = 1800    // roket mulai naik, warp mulai
const T_COUNT = 10000    // hitung mundur "3" (lalu 2, 1 tiap 900 ms)
const T_FLASH = 12700    // kilatan menuju Bumi
export const HOME_MS = 13200 // dipakai App sebelum pindah ke Intro
// Overlay mulai memudar saat Intro tampil di belakangnya.
// App melepas overlay di HOME_MS + HOME_END_PAD (800 ms): fade 400 ms ini harus selesai sebelum itu.
const T_LEAVE = HOME_MS + 400

const COUNT = 360
const COUNT_REDUCED = 160
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Hanya starfield (garis bintang saat warp)
function Scene({ t0, reduce }) {
    const count = reduce ? COUNT_REDUCED : COUNT
    const stars = useRef()
    const mat = useRef()
    const dummy = useMemo(() => new THREE.Object3D(), [])
    const ps = useMemo(() => Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 60,
        z: Math.random() * 13 - 14,
    })), [count])

    useFrame((state, delta) => {
        if (!t0.current || !stars.current) return
        const t = performance.now() - t0.current
        const k = clamp01((t - T_LAUNCH) / 6000)
        const s = k * k * (3 - 2 * k)

        // Bintang makin terang mengikuti hitung mundur, puncaknya saat kilatan (0,8 → 1)
        if (mat.current) {
            const b = clamp01((t - T_COUNT) / (T_FLASH - T_COUNT))
            mat.current.opacity = 0.8 + 0.2 * b * b
        }

        // Reduced motion: tanpa getaran kamera, garis bintang pendek dan lambat
        if (!reduce) {
            const amp = s * s * 0.14
            state.camera.position.x = (Math.random() - 0.5) * amp
            state.camera.position.y = (Math.random() - 0.5) * amp
        }

        const speed = 0.2 + s * (reduce ? 12 : 60)
        const stretch = 1 + s * (reduce ? 8 : 110)
        ps.forEach((p, i) => {
            p.y -= speed * delta
            if (p.y < -30) { p.y = 30; p.x = (Math.random() - 0.5) * 40 }
            dummy.position.set(p.x, p.y, p.z)
            dummy.scale.set(1, stretch, 1)
            dummy.updateMatrix()
            stars.current.setMatrixAt(i, dummy.matrix)
        })
        stars.current.instanceMatrix.needsUpdate = true
    })

    return (
        <instancedMesh ref={stars} args={[null, null, count]} frustumCulled={false}>
            <boxGeometry args={[0.025, 0.025, 0.025]} />
            <meshBasicMaterial ref={mat} color="#e0f0ff" transparent opacity={0.8} />
        </instancedMesh>
    )
}

// Roket 2D: mengapung & bergoyang → api menyala → berdiri tegak & naik perlahan
function Rocket2D({ t0, reduce }) {
    const body = useRef()
    const flame = useRef()

    useEffect(() => {
        let raf = 0
        const j = reduce ? 0 : 1   // 0 = tanpa goyang, getar, dan kedip api
        const loop = () => {
            const t = performance.now() - t0.current
            const lk = clamp01((t - T_LAUNCH) / (T_FLASH - T_LAUNCH - 800))
            const rise = lk * lk * (3 - 2 * lk)                       // naik 0..1
            const up = clamp01((t - T_LAUNCH) / 1400)
            const upright = up * up * (3 - 2 * up)                    // tegak 0..1
            const ig = clamp01((t - T_LAUNCH) / 900)                  // api menyala 0..1
            const sway = Math.sin(t * 0.0016) * 10 * (1 - upright) * j
            const bob = Math.sin(t * 0.0021) * 10 * (1 - upright) * j
            const shake = ig * (Math.random() - 0.5) * 1.6 * j
            const y = bob - rise * window.innerHeight * 0.3
            if (body.current) {
                body.current.style.transform =
                    `translate(${shake}px, ${y}px) rotate(${sway + (1 - upright) * 6 * j}deg)`
            }
            if (flame.current) {
                const len = ig * (0.75 + rise * 0.6) + (Math.random() - 0.5) * 0.16 * ig * j
                flame.current.style.transform = `scale(${1 + (Math.random() - 0.5) * 0.1 * ig * j}, ${Math.max(len, 0.001)})`
            }
            raf = requestAnimationFrame(loop)
        }
        raf = requestAnimationFrame(loop)
        return () => cancelAnimationFrame(raf)
    }, [t0, reduce])

    return (
        <div className={styles.rocketWrap} aria-hidden="true">
            <div ref={body} className={styles.rocket}>
                <svg viewBox="0 0 80 150" className={styles.rocketSvg}>
                    <g ref={flame} className={styles.flame} style={{ transformOrigin: '40px 108px' }}>
                        <path d="M32 108 C32 128 38 142 40 152 C42 142 48 128 48 108Z" fill="#ff8a30" opacity="0.9" />
                        <path d="M36 108 C36 120 39 130 40 138 C41 130 44 120 44 108Z" fill="#fff2b0" />
                    </g>
                    <path d="M20 74 L4 104 L20 96Z" fill="#ff5a5a" />
                    <path d="M60 74 L76 104 L60 96Z" fill="#ff5a5a" />
                    <path d="M30 98 L50 98 L47 109 L33 109Z" fill="#444b5e" />
                    <path d="M40 4 C58 22 62 50 60 98 L20 98 C18 50 22 22 40 4Z" fill="#e8ecf8" />
                    <path d="M40 4 C50 13 56 25 58 38 L22 38 C24 25 30 13 40 4Z" fill="#ff5a5a" />
                    <circle cx="40" cy="58" r="9" fill="#6ec5ff" stroke="#aab4cc" strokeWidth="3" />
                    <circle cx="37" cy="55" r="2.5" fill="#fff" opacity="0.7" />
                </svg>
            </div>
        </div>
    )
}

// Konstelasi nama pengguna terbentuk di langit saat roket naik
function NameConstellation({ name, points }) {
    if (!points?.length) return null
    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)
    const pad = 14
    const minX = Math.min(...xs) - pad
    const minY = Math.min(...ys) - pad
    const w = Math.max(...xs) - Math.min(...xs) + pad * 2
    const h = Math.max(...ys) - Math.min(...ys) + pad * 2
    const d = points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
    return (
        <div className={styles.sky}>
            <svg viewBox={`${minX} ${minY} ${w} ${h}`} className={styles.skySvg} aria-hidden="true">
                <path d={d} pathLength="1" className={styles.skyLine} />
                {points.map((p, i) => (
                    <g key={i} className={styles.skyStar} style={{ animationDelay: `${0.6 + i * 0.5}s` }}>
                        <circle cx={p.x} cy={p.y} r="6" className={styles.skyHalo} />
                        <circle cx={p.x} cy={p.y} r="2" fill="#fff" />
                    </g>
                ))}
            </svg>
            <p className={styles.skyLabel}>✦ {name}’s star</p>
            <p className={styles.skyNote}>It will keep watch over your home, always.</p>
        </div>
    )
}

// onBrighten: dipanggil sekali saat hitung mundur dimulai (Bumi mendekat).
// App menaikkan StarField ke depth 0; easing ~2 dtk membuatnya terang penuh saat kilatan.
function HomeWarp({ active, name = '', points = [], onBrighten }) {
    const [phase, setPhase] = useState('float') // float | launch | count | flash
    const [count, setCount] = useState(0)
    const [leaving, setLeaving] = useState(false)
    const t0 = useRef(performance.now())
    const overlayRef = useRef(null)
    const brightenRef = useRef(onBrighten)
    brightenRef.current = onBrighten

    const reduce = useMemo(
        () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        []
    )

    useEffect(() => {
        if (!active) return
        t0.current = performance.now()
        setPhase('float')
        setCount(0)
        setLeaving(false)
        const ids = [
            setTimeout(() => { setPhase('launch'); sfx.warp((T_FLASH - T_LAUNCH) / 1000 + 0.4) }, T_LAUNCH),
            ...[3, 2, 1].map((n, i) =>
                setTimeout(() => {
                    setPhase('count'); setCount(n); sfx.click()
                    if (i === 0) brightenRef.current?.()
                }, T_COUNT + i * 900)
            ),
            setTimeout(() => { setPhase('flash'); sfx.chime(4) }, T_FLASH),
            setTimeout(() => setLeaving(true), T_LEAVE),
        ]
        return () => ids.forEach(clearTimeout)
    }, [active])

    // Fokus pindah ke overlay: tombol "Return home" di belakangnya tidak lagi menerima Enter/Spasi
    useEffect(() => {
        if (active) overlayRef.current?.focus({ preventScroll: true })
    }, [active])

    if (!active) return null

    const nearEarth = phase === 'count' || phase === 'flash'

    return (
        <div
            ref={overlayRef}
            className={`${styles.overlay} ${leaving ? styles.overlayOut : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Returning home"
            tabIndex={-1}
            onKeyDown={(e) => { if (e.key === 'Tab') e.preventDefault() }}
        >
            <div className={styles.canvasWrap} aria-hidden="true">
                <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 60 }}>
                    <Scene t0={t0} reduce={reduce} />
                </Canvas>
            </div>

            {phase !== 'float' && <NameConstellation name={name} points={points} />}
            <Rocket2D t0={t0} reduce={reduce} />

            <div className={`${styles.earthHorizon} ${nearEarth ? styles.earthHorizonOn : ''}`} aria-hidden="true" />

            <div className={styles.caption} role="status" aria-live="polite">
                {phase === 'float' && <p key="f" className={styles.line}>Adrift between the stars…</p>}
                {phase === 'launch' && <p key="l" className={styles.line}>Engines awake. Taking you home{name ? `, ${name}` : ''}.</p>}
                {phase === 'count' && (
                    <>
                        <p className={styles.small}>Arriving at Earth in</p>
                        <div key={count} className={styles.count}>{count}</div>
                    </>
                )}
            </div>

            <div className={`${styles.flash} ${phase === 'flash' ? styles.flashOn : ''}`} aria-hidden="true" />
        </div>
    )
}

export default memo(HomeWarp)
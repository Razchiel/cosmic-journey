import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { UNIVERSE_LEVELS as LEVELS } from '../data/index.js'
import { sfx } from '../hooks/useSfx.js'
import { SCENES, RHO, CX, CY, EARTH_ANCHOR, sunAt, diskTransform } from './universeScenes.jsx'
import styles from './UniverseScale.module.css'

const LAST = LEVELS.length - 1
const clamp = (n, a, b) => Math.min(Math.max(n, a), b)
const sstep = (x) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t) }
const OMEGA = 0.14 // rad/detik, putaran galaksi (≈45 detik per putaran)

/**
 * Kamera zoom antar scene. Scene i-1 "hidup" di dalam scene i pada titik A[i]
 * (Bumi di orbitnya, Tata Surya di sekitar Matahari, dst) dan tampil dengan
 * skala RHO[i]. Pada transisi t∈[0,1]:
 *  - scene i-1 (anak) mengecil dari 1 → RHO[i] menuju titik A[i]
 *  - scene i (induk) membesar dari 1/RHO[i] → 1, dengan A[i] berpindah dari pusat
 * Keduanya memakai titik b(t) yang sama, jadi selalu konsisten.
 * Hasil: transform layar = s·p + (x, y) dalam koordinat viewBox 400×250.
 */
function layerState(i, v, A) {
  if (i >= 1 && v < i) {                       // masuk sebagai induk
    const t = v - (i - 1)
    if (t <= 0) return null
    const a = A[i], s = Math.pow(RHO[i], t - 1)
    const bx = CX + (a[0] - CX) * t, by = CY + (a[1] - CY) * t
    return { s, x: bx - s * a[0], y: by - s * a[1], op: sstep((t - 0.5) / 0.4) }
  }
  if (i < LAST) {                              // keluar sebagai anak
    const t = v - i
    if (t >= 1) return null
    const a = A[i + 1], s = Math.pow(RHO[i + 1], t)
    const bx = CX + (a[0] - CX) * t, by = CY + (a[1] - CY) * t
    return { s, x: bx - s * CX, y: by - s * CY, op: 1 - sstep((t - 0.65) / 0.3) }
  }
  return { s: 1, x: 0, y: 0, op: 1 }           // scene terakhir
}

// 2 angka signifikan: 704.500 → "700,000"
const sig2 = (n) => {
  const p = Math.pow(10, Math.floor(Math.log10(n)) - 1)
  return (Math.round(n / p) * p).toLocaleString('en-US')
}

const SWIPE_MIN = 48 // px, ambang geser horizontal di panggung

function InfoBody({ lv }) {
  return (
    <>
      <h3 className={styles.name}>{lv.name}</h3>
      <p className={styles.fact}>{lv.fact}</p>
      <p className={styles.tagline}>{lv.line}</p>
    </>
  )
}

export default function UniverseScale() {
  const [v, setV] = useState(0)          // posisi slider (float, 0..5)
  const [touched, setTouched] = useState(false) // sudah ada interaksi pertama
  const vRef = useRef(0)
  const target = useRef(0)
  const dragging = useRef(false)
  const raf = useRef(0)
  const trackRef = useRef(null)
  const reduce = useRef(false)
  const firstRun = useRef(true)
  const figRef = useRef(null)
  const layers = useRef([])
  const diskRef = useRef(null)
  const sunRef = useRef(null)
  const theta = useRef(0.6)
  const inView = useRef(true)
  const swipe = useRef(null)
  // Titik tujuan tiap scene di dalam scene berikutnya (index = scene induk)
  const anchors = useRef([null, EARTH_ANCHOR, [CX, CY], sunAt(0.6), [CX, CY], [CX, CY]])

  const apply = useCallback((val) => {
    layers.current.forEach((el, i) => {
      if (!el) return
      const st = layerState(i, val, anchors.current)
      if (!st || st.op < 0.01) {
        el.style.visibility = 'hidden'
        el.style.opacity = 0
        el.classList.add(styles.idle)
        return
      }
      el.classList.remove(styles.idle)
      el.style.visibility = 'visible'
      el.style.opacity = st.op
      el.style.transform = `translate(${(st.x / 400) * 100}%, ${(st.y / 250) * 100}%) scale(${st.s})`
    })
  }, [])

  const spinGalaxy = useCallback((th) => {
    diskRef.current?.setAttribute('transform', diskTransform(th))
    const [sx, sy] = sunAt(th)
    sunRef.current?.setAttribute('transform', `translate(${sx} ${sy})`)
    anchors.current[3] = [sx, sy]
  }, [])

  useLayoutEffect(() => { spinGalaxy(theta.current); apply(v) }, [v, apply, spinGalaxy])

  // Putaran galaksi: hanya jalan saat scene Milky Way terlihat dan komponen di layar
  useEffect(() => {
    const io = new IntersectionObserver(([en]) => { inView.current = en.isIntersecting }, { threshold: 0.05 })
    if (figRef.current) io.observe(figRef.current)
    let id = 0, last = performance.now()
    const loop = (now) => {
      id = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const val = vRef.current
      if (reduce.current || !inView.current || val <= 2 || val >= 5) return
      theta.current -= dt * OMEGA   // negatif: lengan spiral "tertinggal" (trailing)
      spinGalaxy(theta.current)
      apply(val)
    }
    id = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(id); io.disconnect() }
  }, [apply, spinGalaxy])

  useEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const level = Math.round(v)

  // Bunyi saat level berganti (termasuk saat menyapu slider)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    sfx.chime(level)
  }, [level])

  const animate = useCallback(() => {
    let last = performance.now()
    const step = (now) => {
      if (dragging.current) { raf.current = 0; return }
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      const d = target.current - vRef.current
      if (Math.abs(d) < 0.002) {
        vRef.current = target.current
        setV(target.current)
        raf.current = 0
        return
      }
      vRef.current += d * (1 - Math.exp(-dt * 4.5))
      setV(vRef.current)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }, [])

  // goTo hanya dipanggil dari aksi pengguna, jadi cukup di sini menandai "sudah dipakai"
  const goTo = useCallback((i) => {
    setTouched(true)
    target.current = clamp(i, 0, LAST)
    if (reduce.current) { vRef.current = target.current; setV(target.current); return }
    if (!raf.current) animate()
  }, [animate])

  const fromPointer = (e) => {
    const r = trackRef.current.getBoundingClientRect()
    const f = clamp((e.clientX - r.left) / r.width, 0, 1)
    vRef.current = f * LAST
    setV(vRef.current)
  }
  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    setTouched(true)
    cancelAnimationFrame(raf.current); raf.current = 0
    fromPointer(e)
  }
  const onMove = (e) => { if (dragging.current) fromPointer(e) }
  const onUp = () => {
    if (!dragging.current) return
    dragging.current = false
    goTo(Math.round(vRef.current))
  }
  const onKey = (e) => {
    const k = e.key
    if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); goTo(level + 1) }
    else if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); goTo(level - 1) }
    else if (k === 'Home') { e.preventDefault(); goTo(0) }
    else if (k === 'End') { e.preventDefault(); goTo(LAST) }
  }

  // Geser horizontal di panggung (sentuh/pena saja; scroll vertikal tetap lewat touch-action: pan-y)
  const onStageDown = (e) => {
    if (e.pointerType === 'mouse') return
    swipe.current = { x: e.clientX, y: e.clientY }
  }
  const onStageUp = (e) => {
    const s = swipe.current
    swipe.current = null
    if (!s) return
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goTo(target.current + (dx < 0 ? 1 : -1))
    }
  }
  const onStageCancel = () => { swipe.current = null }

  const cur = LEVELS[level]
  const factor = level > 0 ? sig2(cur.ly / LEVELS[level - 1].ly) : null

  return (
    <figure ref={figRef} className={styles.figure}>
      <figcaption className={styles.caption}>
        <span className="t-label">Scale of the Universe</span>
        <span className={`${styles.hint} ${touched ? styles.hintOff : ''}`}>Tap + or drag the slider to zoom out</span>
      </figcaption>

      <div
        className={styles.stage}
        onPointerDown={onStageDown}
        onPointerUp={onStageUp}
        onPointerCancel={onStageCancel}
      >
        {SCENES.map((Scene, i) => (
          <div key={i} ref={(el) => { layers.current[i] = el }} className={styles.scene} aria-hidden="true">
            {i === 3 ? <Scene diskRef={diskRef} sunRef={sunRef} /> : <Scene />}
          </div>
        ))}
        <div className={styles.level}>LEVEL {String(level + 1).padStart(2, '0')} / {String(LEVELS.length).padStart(2, '0')}</div>
        {factor && <div className={styles.factor}>×{factor} wider than the previous view</div>}
      </div>

      {/* Semua level ditumpuk di satu sel grid: tinggi panel = level terpanjang, jadi tidak melompat */}
      <div className={styles.info} aria-live="polite">
        {LEVELS.map((l) => (
          <div key={l.id} className={styles.sizer} aria-hidden="true">
            <InfoBody lv={l} />
          </div>
        ))}
        <div key={cur.id} className={styles.infoInner}>
          <InfoBody lv={cur} />
        </div>
      </div>

      <div className={styles.controls}>
        <button className={styles.step} onClick={() => goTo(level - 1)} disabled={level === 0} aria-label="Closer, zoom in">
          <span className={styles.stepIcon} aria-hidden="true">−</span>
          <span className={styles.stepText} aria-hidden="true">Closer</span>
        </button>

        <div className={styles.trackPad}>
          <div
            ref={trackRef}
            className={styles.track}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className={styles.rail} />
            <div className={styles.fill} style={{ width: `${(v / LAST) * 100}%` }} />
            {LEVELS.map((l, i) => (
              <span key={l.id} className={`${styles.tick} ${i <= v + 0.01 ? styles.tickOn : ''}`} style={{ left: `${(i / LAST) * 100}%` }} />
            ))}
            <div
              className={styles.thumb}
              style={{ left: `${(v / LAST) * 100}%` }}
              role="slider"
              tabIndex={0}
              aria-label="Zoom level"
              aria-valuemin={0}
              aria-valuemax={LAST}
              aria-valuenow={level}
              aria-valuetext={cur.name}
              onKeyDown={onKey}
            />
          </div>
          <div className={styles.labels}>
            {LEVELS.map((l, i) => (
              <button
                key={l.id}
                className={`${styles.lab} ${i === level ? styles.labOn : ''}`}
                style={{ left: `${(i / LAST) * 100}%` }}
                onClick={() => goTo(i)}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.step} onClick={() => goTo(level + 1)} disabled={level === LAST} aria-label="Farther, zoom out">
          <span className={`${styles.stepIcon} ${!touched ? styles.nudge : ''}`} aria-hidden="true">+</span>
          <span className={styles.stepText} aria-hidden="true">Farther</span>
        </button>
      </div>
      <p className={styles.note}>Schematic illustrations, not to scale.</p>
    </figure>
  )
}
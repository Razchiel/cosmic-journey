import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback, Suspense, memo } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { sfx } from '../hooks/useSfx.js'
import styles from './Intro.module.css'

const HOLD_MS = 2500      // lama menahan tombol
const RELEASE_MS = 700    // lama progres kembali tenang saat dilepas
const MOON_KM = 384400
const EARTH_PX = 220      // diameter Bumi (px) di wrapper; dipakai untuk hitung skala transisi
const MOON_R = 3.6
const ISS_R = 2.75

function makeMoonTex() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 64
  const x = c.getContext('2d')
  x.fillStyle = '#9a9a9a'
  x.fillRect(0, 0, 128, 64)
  for (let i = 0; i < 40; i++) {
    x.fillStyle = `rgba(${Math.random() < 0.5 ? '60,60,60' : '210,210,210'},${Math.random() * 0.35})`
    x.beginPath()
    x.arc(Math.random() * 128, Math.random() * 64, Math.random() * 7 + 1, 0, 6.3)
    x.fill()
  }
  return new THREE.CanvasTexture(c)
}

function OrbitLine({ r, color, opacity }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - 0.006, r + 0.006, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

function Earth3D({ isWarping, warpStartTime, travelMs, holdRef }) {
  const root = useRef()
  const earth = useRef()
  const moon = useRef()
  const iss = useRef()
  const colorMap = useLoader(THREE.TextureLoader, '/images/earth.jpg')
  const moonTex = useMemo(makeMoonTex, [])

  useEffect(() => {
    if (colorMap) {
      colorMap.wrapS = THREE.RepeatWrapping
      colorMap.wrapT = THREE.RepeatWrapping
      colorMap.anisotropy = 16
    }
  }, [colorMap])

  useFrame((state, delta) => {
    const p = holdRef.current
    const t = isWarping ? Math.min((Date.now() - warpStartTime) / travelMs, 1) : 0
    const el = state.clock.elapsedTime

    // Getar halus saat ditahan, mereda begitu perjalanan mulai
    if (root.current) {
      const a = p * p * 0.06 * (1 - Math.min(t * 2, 1))
      root.current.position.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, 0)
    }
    if (earth.current) earth.current.rotation.y += (0.09 + p * 1.2 + t * t * 1.5) * delta

    if (moon.current) {
      const a = el * 0.18
      moon.current.position.set(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R)
    }
    if (iss.current) {
      const a = el * 0.9
      iss.current.position.set(Math.cos(a) * ISS_R, 0, Math.sin(a) * ISS_R)
    }
  })

  return (
    <group ref={root}>
      <group ref={earth}>
        <mesh>
          <sphereGeometry args={[2.18, 64, 64]} />
          <meshBasicMaterial color="#020813" />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.2, 64, 64]} />
          <meshStandardMaterial map={colorMap} roughness={0.8} metalness={0.2} alphaTest={0.5} />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.25, 64, 64]} />
          <meshStandardMaterial color="#6ec5ff" transparent opacity={0.15} depthWrite={false} side={THREE.FrontSide} />
        </mesh>
      </group>

      {/* Bulan */}
      <group rotation={[1.1, 0, -0.2]}>
        <OrbitLine r={MOON_R} color="#8fb0ff" opacity={0.15} />
        <mesh ref={moon}>
          <sphereGeometry args={[0.32, 32, 32]} />
          <meshStandardMaterial map={moonTex} roughness={1} />
        </mesh>
      </group>

      {/* ISS (inklinasi ±51,6°, orbit cepat) */}
      <group rotation={[0.9, 0, 0.35]}>
        <OrbitLine r={ISS_R} color="#ffd27a" opacity={0.12} />
        <group ref={iss} scale={1.5}>
          <mesh><boxGeometry args={[0.24, 0.012, 0.012]} /><meshBasicMaterial color="#e6e9f2" /></mesh>
          <mesh><boxGeometry args={[0.05, 0.04, 0.04]} /><meshBasicMaterial color="#cfd4e2" /></mesh>
          <mesh position={[-0.1, 0, 0]}><boxGeometry args={[0.05, 0.004, 0.14]} /><meshBasicMaterial color="#d9a441" /></mesh>
          <mesh position={[0.1, 0, 0]}><boxGeometry args={[0.05, 0.004, 0.14]} /><meshBasicMaterial color="#d9a441" /></mesh>
        </group>
      </group>
    </group>
  )
}

const wib = () =>
  new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Jakarta', hour12: false })

function Clock() {
  const [t, setT] = useState(wib)
  useEffect(() => {
    const id = setInterval(() => setT(wib()), 1000)
    return () => clearInterval(id)
  }, [])
  return <div className={styles.clock}>{t}</div>
}

function Intro({ onNext, isWarping = false, warpStartTime = 0, travelMs = 2800 }) {
  const holdRef = useRef(0) // 0..1, dibaca oleh Three.js tanpa re-render
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const distRef = useRef(null)
  const st = useRef({ holding: false, last: 0, raf: 0, stop: null })
  const nextRef = useRef(onNext)
  nextRef.current = onNext

  const tick = useCallback((now) => {
    const s = st.current
    const dt = Math.min(now - s.last, 50)
    s.last = now
    const p = Math.min(1, Math.max(0, holdRef.current + (s.holding ? dt / HOLD_MS : -dt / RELEASE_MS)))
    holdRef.current = p

    btnRef.current?.style.setProperty('--p', p)
    if (distRef.current) {
      distRef.current.textContent = `${((MOON_KM * (1 - p)) / 1e5).toFixed(3)} × 10⁵ km from home`
    }

    if (s.holding && p >= 1) {
      // Penuh: berangkat. Suara dibiarkan selesai sendiri.
      s.holding = false
      s.stop = null
      s.raf = 0
      nextRef.current()
      return
    }
    s.raf = p > 0 || s.holding ? requestAnimationFrame(tick) : 0
  }, [])

  const start = () => {
    const s = st.current
    if (s.holding || isWarping || holdRef.current >= 1) return
    s.holding = true
    s.last = performance.now()
    if (!s.stop) s.stop = sfx.open()
    if (!s.raf) s.raf = requestAnimationFrame(tick)
  }

  const end = () => {
    const s = st.current
    if (!s.holding) return
    s.holding = false
    s.stop?.()
    s.stop = null
  }

  useEffect(() => () => {
    cancelAnimationFrame(st.current.raf)
    st.current.stop?.()
  }, [])

  // Saat berangkat: Bumi bergeser & mengecil ke posisi Bumi di section Solar System
  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!isWarping || !el) return
    const r = el.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const mobile = vw < 768
    const camZ = mobile ? 34 : 26                                   // sama dgn CameraRig overview
    const unit = vh / (2 * camZ * Math.tan(THREE.MathUtils.degToRad(20))) // px per unit scene Solar
    const posX = mobile ? -2.1 : 2.5                                // posisi Earth (index 2) di grid
    const posY = mobile ? 1.6 : 3
    const tx = vw / 2 + posX * unit - (r.left + r.width / 2)
    const ty = vh / 2 - posY * unit - (r.top + r.height / 2)
    const s = ((68 / 65) * 2 * unit) / EARTH_PX                     // radius Earth = 68/65
    el.style.transitionDuration = `${travelMs}ms`
    el.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`
  }, [isWarping, travelMs])

  return (
    <section id="intro" className={`cosmic-section ${styles.intro}`}>
      <div className="noise-overlay" />
      <div className={styles.nebulaBg} />
      <div
        className={`${styles.sunGlow} ${isWarping ? styles.sunGlowOn : ''}`}
        style={{ transitionDuration: `${travelMs}ms` }}
      />

      <div className={`${styles.hud} ${isWarping ? styles.hudHidden : ''}`}>
        <p className={styles.hudLabel}>WIB · GMT+7 · Indonesia Barat</p>
        <Clock />
        <div className={styles.hudIss}>
          <span className={styles.issDot} />
          <span className={styles.hudLabel}>ISS · ±408 km · orbit 92 min</span>
        </div>
      </div>

      <div ref={wrapRef} className={`${styles.earthWrap} ${isWarping ? styles.earthWrapWarp : ''}`}>
        <div className={styles.earthFloat}>
          <div className={styles.earthGlow} />
          <div className={styles.atmosphereRing} />
          <Canvas className={styles.earthCanvas} dpr={[1, 1.5]} camera={{ position: [0, 0, 15.8], fov: 45 }}>
            <ambientLight intensity={0.05} />
            <directionalLight position={[5, 4, 2]} intensity={2.5} color="#fff4e6" />
            <Suspense fallback={null}>
              <Earth3D isWarping={isWarping} warpStartTime={warpStartTime} travelMs={travelMs} holdRef={holdRef} />
            </Suspense>
          </Canvas>
        </div>
      </div>

      <div className={`${styles.content} ${isWarping ? styles.contentHidden : ''}`}>
        <p ref={distRef} className={`t-label ${styles.coords}`}>3.844 × 10⁵ km from home</p>
        <h1 className={styles.heading}>
          Welcome aboard,<br /><em>astronaut.</em>
        </h1>
        <p className={styles.sub}>
          Fasten your seatbelt. Our journey begins.
        </p>
        <p className={styles.local} lang="id">
          Kencangkan sabuk pengamanmu.
        </p>
        <button
          ref={btnRef}
          className={styles.beginBtn}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); start() }}
          onPointerUp={end}
          onPointerCancel={end}
          onBlur={end}
          onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
          onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') end() }}
          onContextMenu={(e) => e.preventDefault()}
        >
          Begin the Journey <span className={styles.arrow}>↓</span>
        </button>
        <p className={styles.holdHint}>Hold to launch</p>
      </div>
    </section>
  )
}

export default memo(Intro)
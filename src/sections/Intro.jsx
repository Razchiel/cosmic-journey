import { useEffect, useLayoutEffect, useMemo, useRef, useState, useCallback, Suspense, memo } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { sfx } from '../hooks/useSfx.js'
import { PlanetTextureLoader, TextureBoundary } from '../utils/planetTexture.js'
import styles from './Intro.module.css'

const HOLD_MS = 2500      // lama menahan tombol
const RELEASE_MS = 700    // lama progres kembali tenang saat dilepas
const MOON_KM = 384400
// Rasio diameter Bumi terhadap lebar .earthWrap (220/260). Tetap karena canvas
// selalu 640/260 dari wrapper (desktop dan HP). Ukuran Bumi sebenarnya dihitung
// dari offsetWidth wrapper, bukan konstanta px.
const EARTH_RATIO = 220 / 260
const MOON_R = 3.6
const ISS_R = 2.75

// Posisi Bumi di grid Solar System (HP). Harus sinkron dengan Planet3D di SolarSystem.jsx:
// posX = (0 - 0.5) * 4.2, posY = (1.5 - 1) * spacingY + yOffset = 0.5 * 4.8 - 0.8
const SOLAR_MOBILE_POS = { x: -2.1, y: 1.6 }
const SOLAR_DESKTOP_POS = { x: 2.5, y: 3 }

function OrbitLine({ r, color, opacity }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - 0.006, r + 0.006, 128]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

// ── Bumi siang/malam: arah lampu mengikuti jam perangkat ───────────────
const DAY_TEX = '/images/earth_daymap.jpg'
const NIGHT_TEX = '/images/earth_nightmap.jpg'
const MOON_TEX = '/images/planets/moon.jpg'
// Mulai unduh paralel begitu chunk Intro dimuat (tanpa waterfall antar tekstur)
useLoader.preload(PlanetTextureLoader, DAY_TEX)
useLoader.preload(PlanetTextureLoader, NIGHT_TEX)
useLoader.preload(PlanetTextureLoader, MOON_TEX)

// Arah Matahari di Solar System (kiri). Lampu bergeser ke sini saat berangkat.
const SOLAR_SUN_DIR = new THREE.Vector3(-1, 0.3, 0.2).normalize()

// Jam desimal perangkat. Mode dev: tambahkan ?hour=22 di URL untuk menguji.
function localHour() {
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(window.location.search).get('hour')
    if (q !== null && q !== '' && !Number.isNaN(+q)) return ((+q % 24) + 24) % 24
  }
  const d = new Date()
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600
}

// Siang (12): lampu dari depan sedikit kanan. 18: dari kanan. 00: dari belakang. 06: dari kiri.
function sunDirForHour(h, out) {
  const th = ((h - 12) * Math.PI) / 12
  const az = th + 0.45 * Math.cos(th)
  return out.set(Math.sin(az), 0.4, Math.cos(az)).normalize()
}

// 1 = siang, -1 = tengah malam
function dayFactor(h) {
  return Math.cos(((h - 12) * Math.PI) / 12)
}

function MoonMaterial() {
  const map = useLoader(PlanetTextureLoader, MOON_TEX)
  // emissive lemah = lampu isian: Bulan tetap terbaca saat lampu dari belakang
  return (
    <meshStandardMaterial
      map={map}
      emissive="#ffffff"
      emissiveMap={map}
      emissiveIntensity={0.22}
      roughness={1}
      metalness={0}
    />
  )
}

// Cadangan bila tekstur Bumi gagal dimuat
function EarthFallback() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <directionalLight position={[5, 4, 2]} intensity={2.5} color="#fff4e6" />
      <mesh>
        <sphereGeometry args={[2.2, 48, 48]} />
        <meshStandardMaterial color="#2a70c8" roughness={0.8} />
      </mesh>
    </>
  )
}

// ── ISS: model prosedural (tanpa file 3D) ───────────────────────────────
// Sumbu model: truss di X, modul di Z (Z = arah gerak), atas di Y.
function makePanelTex() {
  const c = document.createElement('canvas')
  c.width = 128; c.height = 256
  const x = c.getContext('2d')
  x.fillStyle = '#16264f'
  x.fillRect(0, 0, 128, 256)
  x.strokeStyle = 'rgba(120,160,230,0.55)'
  x.lineWidth = 1
  for (let i = 0; i <= 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke() }
  for (let j = 0; j <= 256; j += 16) { x.beginPath(); x.moveTo(0, j); x.lineTo(128, j); x.stroke() }
  x.strokeStyle = '#c9962b'
  x.lineWidth = 4
  x.strokeRect(2, 2, 124, 252)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// [z tengah, panjang, radius, bahan]: Zvezda, Zarya, Unity, Destiny, Harmony
const ISS_MODULES = [
  [-0.108, 0.07, 0.0135, 'hull'],
  [-0.045, 0.06, 0.0135, 'gold'],
  [-0.002, 0.026, 0.0145, 'hull'],
  [0.036, 0.048, 0.0165, 'hull'],
  [0.077, 0.032, 0.0145, 'hull'],
]
const ISS_WING_X = [-0.225, -0.175, -0.125, -0.075, 0.075, 0.125, 0.175, 0.225]
const ISS_RIBS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]
const HALF_PI = Math.PI / 2

function ISSModel() {
  const m = useMemo(() => ({
    hull: new THREE.MeshStandardMaterial({ color: '#dfe3ec', metalness: 0.45, roughness: 0.4, emissive: '#1a2030', emissiveIntensity: 0.5 }),
    truss: new THREE.MeshStandardMaterial({ color: '#aeb5c4', metalness: 0.6, roughness: 0.45, emissive: '#141a28', emissiveIntensity: 0.5 }),
    gold: new THREE.MeshStandardMaterial({ color: '#c9962b', metalness: 0.8, roughness: 0.35, emissive: '#2a1d05', emissiveIntensity: 0.5 }),
    rad: new THREE.MeshStandardMaterial({ color: '#f1f3f8', metalness: 0.2, roughness: 0.6, side: THREE.DoubleSide, emissive: '#1a2030', emissiveIntensity: 0.4 }),
    panel: new THREE.MeshStandardMaterial({ map: makePanelTex(), metalness: 0.5, roughness: 0.4, emissive: '#0b1a3a', emissiveIntensity: 0.6 }),
  }), [])

  return (
    <group>
      {/* Modul bertekanan (sepanjang Z) */}
      {ISS_MODULES.map(([z, len, r, mat], i) => (
        <mesh key={i} position={[0, 0, z]} rotation={[HALF_PI, 0, 0]} material={m[mat]}>
          <cylinderGeometry args={[r, r, len, 20]} />
        </mesh>
      ))}
      {/* Columbus (kanan) dan Kibo (kiri) di Harmony */}
      <mesh position={[0.04, 0, 0.077]} rotation={[0, 0, HALF_PI]} material={m.hull}>
        <cylinderGeometry args={[0.0135, 0.0135, 0.05, 20]} />
      </mesh>
      <mesh position={[-0.043, 0, 0.077]} rotation={[0, 0, HALF_PI]} material={m.hull}>
        <cylinderGeometry args={[0.0165, 0.0165, 0.055, 20]} />
      </mesh>
      <mesh position={[-0.078, 0, 0.077]} material={m.truss}>
        <boxGeometry args={[0.012, 0.016, 0.016]} />
      </mesh>
      {/* Cupola, Progress di belakang Zvezda, Soyuz di atas Zvezda */}
      <mesh position={[0, -0.019, -0.002]} material={m.hull}>
        <sphereGeometry args={[0.0075, 16, 12]} />
      </mesh>
      <mesh position={[0, 0, -0.16]} rotation={[HALF_PI, 0, 0]} material={m.gold}>
        <cylinderGeometry args={[0.006, 0.006, 0.03, 14]} />
      </mesh>
      <mesh position={[0, 0.025, -0.108]} material={m.gold}>
        <cylinderGeometry args={[0.006, 0.006, 0.025, 14]} />
      </mesh>
      {/* Panel surya kecil Zvezda */}
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0, -0.11]} material={m.panel}>
          <boxGeometry args={[0.05, 0.0012, 0.025]} />
        </mesh>
      ))}

      {/* Truss utama di atas Destiny */}
      <group position={[0, 0.024, 0.036]}>
        <mesh material={m.truss}><boxGeometry args={[0.52, 0.012, 0.012]} /></mesh>
        <mesh position={[0, -0.012, 0]} material={m.truss}><boxGeometry args={[0.01, 0.024, 0.01]} /></mesh>
        {ISS_RIBS.map((i) => (
          <mesh key={i} position={[i * 0.04, 0, 0]} material={m.truss}>
            <boxGeometry args={[0.004, 0.017, 0.017]} />
          </mesh>
        ))}
        {[-0.264, 0.264].map((x) => (
          <mesh key={x} position={[x, 0, 0]} material={m.gold}>
            <boxGeometry args={[0.008, 0.014, 0.014]} />
          </mesh>
        ))}
        {/* Radiator */}
        {[-0.03, 0.03].map((x) => (
          <mesh key={x} position={[x, -0.004, 0.004]} material={m.rad}>
            <boxGeometry args={[0.03, 0.0012, 0.07]} />
          </mesh>
        ))}
        {/* 8 sayap panel surya: tiang + dua selimut, tiap sayap melintang di Z */}
        {ISS_WING_X.map((x) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh material={m.truss}><boxGeometry args={[0.004, 0.004, 0.34]} /></mesh>
            <mesh material={m.gold}><boxGeometry args={[0.012, 0.008, 0.014]} /></mesh>
            <mesh position={[0, 0, 0.0875]} material={m.panel}><boxGeometry args={[0.046, 0.0015, 0.15]} /></mesh>
            <mesh position={[0, 0, -0.0875]} material={m.panel}><boxGeometry args={[0.046, 0.0015, 0.15]} /></mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Earth3D({ isWarping, warpStartTime, travelMs, holdRef, focus, onFocus }) {
  const { camera, gl } = useThree()
  const focusRef = useRef(focus)
  focusRef.current = focus
  const onFocusRef = useRef(onFocus)
  onFocusRef.current = onFocus
  const warpRef = useRef(isWarping)
  warpRef.current = isWarping
  const rig = useMemo(() => ({
    look: new THREE.Vector3(),
    pos: new THREE.Vector3(),
    tp: new THREE.Vector3(),
    tl: new THREE.Vector3(),
    mw: new THREE.Vector3(),
    nrm: new THREE.Vector3(),
    qInv: new THREE.Quaternion(),
    fast: false,
  }), [])
  const root = useRef()
  const earth = useRef()
  const moon = useRef()
  const iss = useRef()
  const sunLight = useRef()
  const ambient = useRef()
  const dayMap = useLoader(PlanetTextureLoader, DAY_TEX)
  const nightMap = useLoader(PlanetTextureLoader, NIGHT_TEX)

  // Uniform stabil; sunDir diperbarui tiap frame (arah dalam ruang view = ruang dunia,
  // karena kamera Intro tidak berotasi)
  const uniforms = useMemo(() => ({
    nightMap: { value: nightMap },
    sunDir: { value: new THREE.Vector3(0, 0, 1) },
    nightGain: { value: 1.4 },
  }), [nightMap])

  // Cahaya kota hanya di sisi yang membelakangi lampu (terminator halus)
  const onBeforeCompile = useMemo(() => (shader) => {
    shader.uniforms.nightMap = uniforms.nightMap
    shader.uniforms.sunDir = uniforms.sunDir
    shader.uniforms.nightGain = uniforms.nightGain
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
uniform sampler2D nightMap;
uniform vec3 sunDir;
uniform float nightGain;`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float nd = dot(normalize(normal), normalize(sunDir));
  float nightMask = 1.0 - smoothstep(-0.12, 0.2, nd);
  totalEmissiveRadiance += texture2D(nightMap, vMapUv).rgb * nightMask * nightGain;
}`)
  }, [uniforms])

  // Klik Bumi / Bulan untuk zoom. Canvas pointer-events: none, jadi klik diuji manual
  // dengan ray terhadap bola Bumi dan bola Bulan (area sentuh Bulan diperbesar).
  useEffect(() => {
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const sE = new THREE.Sphere(new THREE.Vector3(), 2.35)
    const sM = new THREE.Sphere(new THREE.Vector3(), 0.85)
    const hitE = new THREE.Vector3()
    const hitM = new THREE.Vector3()

    const onClick = (e) => {
      if (warpRef.current) return
      const tgt = e.target
      if (!(tgt instanceof Element) || !tgt.closest('#intro')) return
      if (tgt.closest('button, a, input, select, textarea')) return

      const rect = gl.domElement.getBoundingClientRect()
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      )
      ray.setFromCamera(ndc, camera)
      if (earth.current) earth.current.getWorldPosition(sE.center)
      if (moon.current) moon.current.getWorldPosition(sM.center)

      const hE = ray.ray.intersectSphere(sE, hitE)
      const hM = ray.ray.intersectSphere(sM, hitM)
      const dE = hE ? hE.distanceTo(ray.ray.origin) : Infinity
      const dM = hM ? hM.distanceTo(ray.ray.origin) : Infinity

      const cur = focusRef.current
      let next = dM < dE ? 'moon' : dE < Infinity ? 'earth' : 'none'
      if (cur === 'moon' || next === cur) next = 'none'

      rig.fast =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.body.classList.contains('comfort-mode')
      onFocusRef.current(next)
    }

    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  }, [camera, gl, rig])

  const sky = useRef(null)
  if (!sky.current) {
    const hour = localHour()
    sky.current = {
      hour,
      next: 0,
      dir: sunDirForHour(hour, new THREE.Vector3()),
      hourDir: new THREE.Vector3(),
      target: new THREE.Vector3(),
    }
  }

  useFrame((state, delta) => {
    const p = holdRef.current
    const t = isWarping ? Math.min((Date.now() - warpStartTime) / travelMs, 1) : 0
    const el = state.clock.elapsedTime

    // Kamera: zoom ke Bumi / Bulan, atau kembali ke posisi awal
    const f = isWarping ? 'none' : focusRef.current
    if (f === 'moon' && moon.current) {
      moon.current.getWorldPosition(rig.mw)
      rig.nrm.copy(rig.mw).normalize()
      rig.tl.copy(rig.mw)
      rig.tp.copy(rig.mw).addScaledVector(rig.nrm, 1.8)
      rig.tp.y += 0.3
    } else if (f === 'earth') {
      rig.tl.set(0, 0, 0)
      rig.tp.set(0, 0, 9.6)
    } else {
      rig.tl.set(0, 0, 0)
      rig.tp.set(0, 0, 15.8)
    }
    const kc = 1 - Math.exp(-delta * (rig.fast ? 14 : 3.2))
    state.camera.position.lerp(rig.tp, kc)
    rig.look.lerp(rig.tl, kc)
    state.camera.lookAt(rig.look)
    rig.qInv.copy(state.camera.quaternion).invert()

    // Jam dibaca ulang tiap 1 detik; arah lampu dihaluskan, jadi pergantian jam tidak melompat
    const k = sky.current
    if (el > k.next) { k.hour = localHour(); k.next = el + 1 }
    sunDirForHour(k.hour, k.hourDir)
    k.target.copy(k.hourDir).lerp(SOLAR_SUN_DIR, t * t).normalize()
    k.dir.lerp(k.target, 1 - Math.exp(-delta * 2.5)).normalize()
    uniforms.sunDir.value.copy(k.dir).applyQuaternion(rig.qInv) // ruang view, ikut kamera

    const s = dayFactor(k.hour)
    if (sunLight.current) {
      sunLight.current.position.copy(k.dir).multiplyScalar(8)
      sunLight.current.intensity = 1.8 + 1.2 * (0.5 + 0.5 * s)
    }
    if (ambient.current) ambient.current.intensity = 0.06 + 0.08 * (0.5 - 0.5 * s)

    // Getar halus saat ditahan, mereda begitu perjalanan mulai
    if (root.current) {
      const a = p * p * 0.06 * (1 - Math.min(t * 2, 1))
      root.current.position.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, 0)
    }
    if (earth.current) earth.current.rotation.y += (0.09 + p * 1.2 + t * t * 1.5) * delta

    if (moon.current) {
      const a = el * 0.18
      moon.current.position.set(Math.cos(a) * MOON_R, 0, Math.sin(a) * MOON_R)
      moon.current.rotation.y = -a // wajah utama peta menghadap luar, ke kamera saat zoom
    }
    if (iss.current) {
      const a = el * 0.9
      iss.current.position.set(Math.cos(a) * ISS_R, 0, Math.sin(a) * ISS_R)
      iss.current.rotation.y = -a // modul searah gerak, truss tegak lurus bidang orbit
    }
  })

  return (
    <>
      <ambientLight ref={ambient} intensity={0.06} />
      <directionalLight ref={sunLight} position={[3, 3, 6]} intensity={3} color="#fff4e6" />

      <group ref={root}>
        <group ref={earth}>
          <mesh>
            <sphereGeometry args={[2.18, 64, 64]} />
            <meshBasicMaterial color="#020813" />
          </mesh>
          <mesh>
            <sphereGeometry args={[2.2, 64, 64]} />
            <meshStandardMaterial
              map={dayMap}
              roughness={0.8}
              metalness={0}
              onBeforeCompile={onBeforeCompile}
              customProgramCacheKey={() => 'earth-daynight'}
            />
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
            <Suspense fallback={<meshStandardMaterial color="#9a9a9a" roughness={1} />}>
              <TextureBoundary fallback={<meshStandardMaterial color="#9a9a9a" roughness={1} />}>
                <MoonMaterial />
              </TextureBoundary>
            </Suspense>
          </mesh>
        </group>

        {/* ISS (inklinasi ±51,6°, orbit cepat) */}
        <group rotation={[0.9, 0, 0.35]}>
          <OrbitLine r={ISS_R} color="#ffd27a" opacity={0.12} />
          <group ref={iss} scale={1.2}>
            <group rotation={[0, 0, -HALF_PI]}>
              <ISSModel />
            </group>
          </group>
        </group>
      </group>
    </>
  )
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const PHASES = [
  'New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous',
  'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent',
]
const SYNODIC = 29.530588853
const NEW_MOON_JD = 2451550.1 // bulan baru 6 Jan 2000, 18:14 UTC

// Zona perangkat pengunjung. Fallback ke WIB bila tidak terbaca.
const DEVICE_TZ = (() => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta' }
  catch { return 'Asia/Jakarta' }
})()

const ID_ZONES = {
  'Asia/Jakarta': ['WIB', 'Indonesia Barat'],
  'Asia/Pontianak': ['WIB', 'Indonesia Barat'],
  'Asia/Makassar': ['WITA', 'Indonesia Tengah'],
  'Asia/Ujung_Pandang': ['WITA', 'Indonesia Tengah'],
  'Asia/Jayapura': ['WIT', 'Indonesia Timur'],
}

function zoneLabel(offMin) {
  const a = Math.abs(offMin)
  const h = Math.floor(a / 60)
  const m = a % 60
  const gmt = `GMT${offMin < 0 ? '-' : '+'}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`
  const id = ID_ZONES[DEVICE_TZ]
  if (id) return `${id[0]} · ${gmt} · ${id[1]}`
  const city = DEVICE_TZ.includes('/') ? DEVICE_TZ.split('/').pop().replace(/_/g, ' ') : ''
  return city ? `${gmt} · ${city}` : gmt
}

const wibFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: DEVICE_TZ,
  hourCycle: 'h23',
  year: 'numeric', month: 'numeric', day: 'numeric',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
})

function moonAge(ms) {
  const a = ((ms / 86400000 + 2440587.5) - NEW_MOON_JD) % SYNODIC
  return a < 0 ? a + SYNODIC : a
}

// Satu objek Date, semua turunan memakai tanggal WIB yang sama
function wibNow() {
  const d = new Date()
  const p = {}
  for (const x of wibFmt.formatToParts(d)) p[x.type] = x.value
  const y = +p.year, m = +p.month, day = +p.day
  const age = moonAge(d.getTime())
  // Selisih zona (menit) dari komponen lokal vs waktu UTC sebenarnya. Ikut jam musim panas otomatis.
  const off = Math.round(
    (Date.UTC(y, m - 1, day, +p.hour, +p.minute, +p.second) - Math.floor(d.getTime() / 1000) * 1000) / 60000
  )
  return {
    zone: zoneLabel(off).split(' · '),
    time: `${p.hour}:${p.minute}:${p.second}`,
    dow: DAYS[new Date(Date.UTC(y, m - 1, day)).getUTCDay()],
    day,
    month: MONTHS[m - 1],
    year: y,
    mission: Math.round((Date.UTC(y, m - 1, day) - Date.UTC(y, 0, 0)) / 86400000),
    age,
    phase: PHASES[Math.floor((age / SYNODIC) * 8 + 0.5) % 8],
  }
}

function MoonIcon({ age }) {
  const theta = (2 * Math.PI * age) / SYNODIC
  const k = (1 - Math.cos(theta)) / 2          // bagian yang terang, 0..1
  const waxing = age < SYNODIC / 2
  const gibbous = k > 0.5
  const rx = (Math.abs(Math.cos(theta)) * 8).toFixed(2)
  const d = `M10 2 A8 8 0 0 ${waxing ? 1 : 0} 10 18 A${rx} 8 0 0 ${waxing === gibbous ? 1 : 0} 10 2 Z`
  return (
    <svg className={styles.moonIcon} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <circle cx="10" cy="10" r="8" fill="rgba(143,176,255,0.2)" stroke="rgba(143,176,255,0.55)" strokeWidth="0.8" />
      {k > 0.02 && <path d={d} fill="#e6ecff" />}
    </svg>
  )
}

function Clock() {
  const [s, setS] = useState(wibNow)
  useEffect(() => {
    const id = setInterval(() => setS(wibNow()), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <>
      <p className={styles.hudLabel}>
        {s.zone.slice(0, 2).join(' · ')}
        {s.zone[2] && <span className={styles.hudExtra}>{` · ${s.zone[2]}`}</span>}
      </p>
      <div className={styles.clock}>{s.time}</div>
      <p className={`${styles.hudLabel} ${styles.hudDate}`}>
        {s.dow} · {s.day} {s.month}<span className={styles.hudYear}> {s.year}</span>
      </p>
      <div className={styles.hudMoon}>
        <MoonIcon age={s.age} />
        <span className={`${styles.hudLabel} ${styles.hudMoonText}`}>
          <span>{s.phase}</span>
          <span className={styles.hudMission}>Mission day {s.mission}</span>
        </span>
      </div>
    </>
  )
}

const GREETINGS = {
  morning: [
    'Good morning. This sunlight left the Sun eight minutes ago.',
    'Good morning. A whole planet turned to bring you this light.',
    'Good morning. Nothing about today has happened yet.',
  ],
  midday: [
    'Good day. You are moving through space at 30 km/s.',
    'Good day. Even the busiest hour sits inside something vast.',
    'Good day. Look up once. The sky is still there.',
  ],
  afternoon: [
    'Good afternoon. The Earth is slowly turning from the Sun.',
    'Good afternoon. Whatever today held, you made it here.',
    'Good afternoon. The light is long. Let it slow you down.',
  ],
  evening: [
    'Good evening, stargazer. The old light is arriving.',
    'Good evening, stargazer. The sky has been waiting for you.',
    'Good evening, stargazer. Some of these stars may be gone.',
  ],
  late: [
    'Still awake, stargazer? The sky keeps you company.',
    'It is quiet now, stargazer. Stay as long as you like.',
    'Some of tonight\u2019s starlight is older than our species.',
    'The world is quiet. You are welcome under this sky.',
  ],
}

// Jam perangkat pengunjung. Varian tetap sepanjang hari (hari ke-n di kalender perangkat).
function pickGreeting() {
  const d = new Date()
  const h = d.getHours()
  const band = h < 6 ? 'late' : h < 11 ? 'morning' : h < 15 ? 'midday' : h < 18 ? 'afternoon' : 'evening'
  const list = GREETINGS[band]
  const doy = Math.round(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000
  )
  return list[doy % list.length]
}

function Greeting() {
  const [text, setText] = useState(pickGreeting)
  useEffect(() => {
    // Hanya memicu render bila teks benar-benar berubah (pergantian rentang jam atau tengah malam)
    const id = setInterval(() => setText(pickGreeting()), 60000)
    return () => clearInterval(id)
  }, [])
  return <p className={styles.sub}>{text}</p>
}

function Intro({ onNext, isWarping = false, warpStartTime = 0, travelMs = 2800 }) {
  const holdRef = useRef(0) // 0..1, dibaca oleh Three.js tanpa re-render
  const [focus, setFocus] = useState('none') // 'none' | 'earth' | 'moon'

  // Esc kembali ke tampilan awal; berangkat selalu mengembalikan kamera
  useEffect(() => {
    if (focus === 'none') return
    const onKey = (e) => { if (e.key === 'Escape') setFocus('none') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focus])
  useEffect(() => { if (isWarping) setFocus('none') }, [isWarping])
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
    const pos = mobile ? SOLAR_MOBILE_POS : SOLAR_DESKTOP_POS
    const tx = vw / 2 + pos.x * unit - (r.left + r.width / 2)
    const ty = vh / 2 - pos.y * unit - (r.top + r.height / 2)
    const earthPx = el.offsetWidth * EARTH_RATIO                    // ukuran Bumi sebenarnya (tidak terpengaruh transform)
    const s = ((68 / 65) * 2 * unit) / earthPx                      // radius Earth = 68/65
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

      <div className={`${styles.hud} ${isWarping || focus !== 'none' ? styles.hudHidden : ''}`}>
        <Clock />
        <div className={styles.hudIss}>
          <span className={styles.issDot} />
          <span className={styles.hudLabel}>ISS · ±408 km<span className={styles.hudExtra}> · orbit 92 min</span></span>
        </div>
      </div>

      <div ref={wrapRef} className={`${styles.earthWrap} ${isWarping ? styles.earthWrapWarp : ''}`}>
        <div className={styles.earthFloat}>
          <div className={styles.earthGlow} />
          <div className={styles.atmosphereRing} />
          <Canvas className={styles.earthCanvas} dpr={[1, 1.5]} camera={{ position: [0, 0, 15.8], fov: 45 }}>
            <Suspense fallback={null}>
              <TextureBoundary fallback={<EarthFallback />}>
                <Earth3D isWarping={isWarping} warpStartTime={warpStartTime} travelMs={travelMs} holdRef={holdRef} focus={focus} onFocus={setFocus} />
              </TextureBoundary>
            </Suspense>
          </Canvas>
        </div>
      </div>

      <div className={`${styles.content} ${isWarping || focus !== 'none' ? styles.contentHidden : ''}`}>
        <p ref={distRef} className={`t-label ${styles.coords}`}>3.844 × 10⁵ km from home</p>
        <h1 className={styles.heading}>
          Welcome aboard,<br /><em>captain.</em>
        </h1>
        <Greeting />
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
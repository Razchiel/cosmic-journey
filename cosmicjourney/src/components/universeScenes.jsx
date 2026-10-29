import styles from './UniverseScale.module.css'

// Ilustrasi skematis (bukan skala sebenarnya). Semua memakai viewBox 400×250,
// pusat (200,125). Penanda cyan "You" selalu di pusat, kecuali di Galaxy.
export const CX = 200, CY = 125
const FONT = { fontFamily: 'Outfit, system-ui, sans-serif' }

function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const gauss = (r) => (r() + r() + r() + r() - 2) / 0.58
// Kumpulan titik sebagai satu <path>: jauh lebih ringan daripada ribuan <circle>
const dots = (pts) => pts.map(([x, y]) => `M${x.toFixed(1)} ${y.toFixed(1)}h0`).join('')

function You({ x = CX, y = CY, label, anchor = 'start', dx = 12, dy = -12 }) {
  const lx = x + dx, ly = y + dy
  return (
    <g>
      <circle cx={x} cy={y} r="3" className={styles.pulse} fill="none" stroke="#00d0ff" strokeWidth="1" />
      <circle cx={x} cy={y} r="2.2" fill="#00d0ff" />
      {label && (
        <>
          <path d={`M${x + (dx > 0 ? 3 : -3)} ${y + (dy > 0 ? 3 : -3)}L${lx - (dx > 0 ? 2 : -2)} ${ly + (dy < 0 ? 3 : -3)}`}
            stroke="rgba(0,208,255,.4)" strokeWidth=".7" />
          <text x={lx} y={ly} textAnchor={anchor} fill="#7fe3ff" fontSize="8" letterSpacing="1.6" style={FONT}>
            {label}
          </text>
        </>
      )}
    </g>
  )
}

// ── 1. Bumi ────────────────────────────────────────────────────────────
const LAND = [
  'M150 90q20-16 42-6q14 10 6 26q-10 14-28 10q-24-4-20-30z',
  'M210 120q24-10 40 6q8 22-8 40q-20 10-30-8q-10-18-2-38z',
  'M165 150q16-6 22 8q-2 16-18 14q-12-6-4-22z',
  'M240 82q14-6 22 6q2 12-12 14q-14-2-10-20z',
]
export function EarthScene() {
  return (
    <svg viewBox="0 0 400 250" role="presentation">
      <defs>
        <radialGradient id="us-ocean" cx="38%" cy="35%" r="80%">
          <stop offset="0" stopColor="#3b86e0" /><stop offset="1" stopColor="#0a2a5e" />
        </radialGradient>
        <radialGradient id="us-shade" cx="35%" cy="32%" r="75%">
          <stop offset="0.45" stopColor="#000010" stopOpacity="0" /><stop offset="1" stopColor="#000010" stopOpacity="0.75" />
        </radialGradient>
        <radialGradient id="us-moon" cx="35%" cy="35%" r="75%">
          <stop offset="0" stopColor="#dcdcdc" /><stop offset="1" stopColor="#6c6c72" />
        </radialGradient>
        <clipPath id="us-earth-clip"><circle cx={CX} cy={CY} r="74" /></clipPath>
      </defs>
      <circle cx={CX} cy={CY} r="84" fill="none" stroke="rgba(90,170,255,.22)" strokeWidth="8" />
      <circle cx={CX} cy={CY} r="74" fill="url(#us-ocean)" />
      <g clipPath="url(#us-earth-clip)">
        <g className={styles.earthSpin} fill="#3f9c58" opacity=".9">
          {LAND.map((d, i) => <path key={i} d={d} />)}
          <g transform="translate(288 0)">{LAND.map((d, i) => <path key={i} d={d} />)}</g>
        </g>
      </g>
      <circle cx={CX} cy={CY} r="74" fill="url(#us-shade)" />
      <circle cx="318" cy="72" r="10" fill="url(#us-moon)" />
      <text x="318" y="94" textAnchor="middle" fill="#8fabc6" fontSize="8" letterSpacing="1.6" style={FONT}>MOON</text>
    </svg>
  )
}

// ── 2. Tata Surya ──────────────────────────────────────────────────────
// Bumi (fixed) tidak mengorbit di tampilan ini: posisinya jadi titik tujuan
// saat scene Bumi mengecil. Ukurannya (2.6) harus = RHO[1] × radius Bumi (74).
const EARTH_ANGLE = 40
export const EARTH_ANCHOR = [
  CX + 28 * Math.cos((EARTH_ANGLE * Math.PI) / 180),
  CY + 28 * Math.sin((EARTH_ANGLE * Math.PI) / 180),
]
const PLANETS = [
  { r: 13, s: 1.6, c: '#b5a99a', t: 6 }, { r: 20, s: 2.4, c: '#e8c27a', t: 10 },
  { r: 28, s: 2.6, c: '#4aa3ff', t: 14, fixed: true }, { r: 36, s: 2.0, c: '#d46b45', t: 20 },
  { r: 56, s: 5.5, c: '#d9b38c', t: 40 }, { r: 74, s: 4.5, c: '#e6d3a0', t: 70, ring: true },
  { r: 93, s: 3.2, c: '#8fe3e8', t: 100 }, { r: 112, s: 3.2, c: '#5b7bff', t: 140 },
]
export function SolarScene() {
  return (
    <svg viewBox="0 0 400 250" role="presentation">
      <defs>
        <radialGradient id="us-sun"><stop offset="0" stopColor="#fff6d0" /><stop offset=".4" stopColor="#ffc75a" /><stop offset="1" stopColor="#ff8a2a" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r="45" fill="none" stroke="rgba(143,171,198,.25)" strokeDasharray="1 3" strokeWidth="5" opacity=".5" />
      {PLANETS.map((p, i) => (
        <circle key={i} cx={CX} cy={CY} r={p.r} fill="none" stroke="rgba(120,160,230,.16)" strokeWidth=".7" />
      ))}
      <circle cx={CX} cy={CY} r="15" fill="url(#us-sun)" />
      <circle cx={CX} cy={CY} r="5.5" fill="#ffd36a" />
      <circle cx={EARTH_ANCHOR[0]} cy={EARTH_ANCHOR[1]} r="2.6" fill="#4aa3ff" />
      {PLANETS.filter((p) => !p.fixed).map((p, i) => (
        <g key={i} className={styles.orbit}
          style={{ animationDuration: `${p.t}s`, animationDelay: `${-i * 3.7}s`, transformOrigin: `${CX}px ${CY}px` }}>
          {p.ring && <ellipse cx={CX + p.r} cy={CY} rx={p.s * 2} ry={p.s * 0.6} fill="none" stroke="rgba(230,211,160,.7)" strokeWidth=".8" />}
          <circle cx={CX + p.r} cy={CY} r={p.s} fill={p.c} />
        </g>
      ))}
      <text x={CX} y="244" textAnchor="middle" fill="#6f8aa8" fontSize="7.5" letterSpacing="1.5" style={FONT}>ORBIT SPACING COMPRESSED</text>
    </svg>
  )
}

// ── 3. Bintang tetangga ────────────────────────────────────────────────
const K = 5.4 // px per light-year
const NEAR = [
  ['Proxima Centauri', 4.24, 205, '#ff8f70', 2.0, true], ['α Centauri', 4.37, 218, '#fff0c0', 2.6],
  ["Barnard's Star", 5.96, 80, '#ff9a7a', 1.8, true], ['Wolf 359', 7.86, 150, '#ff8f70', 1.6],
  ['Lalande 21185', 8.31, 40, '#ff9a7a', 1.7], ['Sirius', 8.6, 295, '#cfe4ff', 4.2, true],
  ['Ross 154', 9.7, 248, '#ff9a7a', 1.6], ['ε Eridani', 10.5, 15, '#ffc890', 2.2],
  ['Procyon', 11.4, 118, '#fff6e0', 3.4, true], ['61 Cygni', 11.4, 338, '#ffc890', 2.2],
  ['Tau Ceti', 11.9, 268, '#ffe2a8', 2.4, true],
]
export function NeighborsScene() {
  const rnd = mulberry32(7)
  const filler = Array.from({ length: 70 }, () => {
    const d = 20 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2
    return [CX + Math.cos(a) * d * K, CY - Math.sin(a) * d * K]
  })
  return (
    <svg viewBox="0 0 400 250" role="presentation">
      {[5, 10, 15, 20].map((ly) => (
        <g key={ly}>
          <circle cx={CX} cy={CY} r={ly * K} fill="none" stroke="rgba(120,160,230,.2)" strokeDasharray="2 5" strokeWidth=".8" />
          <text x={CX + 3} y={CY - ly * K - 2} fill="#6f8aa8" fontSize="7" style={FONT}>{ly} ly</text>
        </g>
      ))}
      <path d={dots(filler)} stroke="rgba(170,200,255,.45)" strokeWidth="1.2" strokeLinecap="round" />
      {NEAR.map(([name, d, ang, col, size, label], i) => {
        const a = (ang * Math.PI) / 180
        const x = CX + Math.cos(a) * d * K, y = CY - Math.sin(a) * d * K
        const right = x >= CX
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={size * 2.4} fill={col} opacity=".14" />
            <circle cx={x} cy={y} r={size} fill={col} />
            {label && (
              <text x={x + (right ? 7 : -7)} y={y + 3} textAnchor={right ? 'start' : 'end'} fill="#9fb8d4" fontSize="7.5" letterSpacing=".6" style={FONT}>
                {name} · {d} ly
              </text>
            )}
          </g>
        )
      })}
      <circle cx={CX} cy={CY} r="5" fill="rgba(255,211,106,.12)" stroke="rgba(120,160,230,.55)" strokeWidth=".7" />
      <circle cx={CX} cy={CY} r="2.2" fill="#ffd36a" />
      <You label="YOU (SUN)" dx={12} dy={16} />
    </svg>
  )
}

// ── 4. Bima Sakti (berputar) ───────────────────────────────────────────
// Bintang disimpan di koordinat bidang galaksi (belum dimiringkan). Rotasi
// dilakukan dari luar (UniverseScale) lewat ref supaya posisi Matahari, yang
// jadi titik tujuan transisi, selalu sinkron dengan putaran.
const R0 = 0.08, PITCH = Math.tan((15 * Math.PI) / 180), TILT = 0.62, GR = 168
const armAngle = (k, r) => Math.log(r / R0) / PITCH + (k * Math.PI) / 2
const GALAXY = (() => {
  const rnd = mulberry32(42)
  const px = (x, y) => [x * GR, y * GR]
  const warm = [], blue = [], pink = []
  for (let i = 0; i < 260; i++) {
    const r = Math.abs(gauss(rnd)) * 0.075, a = rnd() * Math.PI * 2
    const x = Math.cos(a) * r * 1.7, y = Math.sin(a) * r
    const c = Math.cos(0.45), s = Math.sin(0.45)
    warm.push(px(x * c - y * s, x * s + y * c))
  }
  for (let i = 0; i < 1500; i++) {
    const k = Math.floor(rnd() * 4), rf = R0 + (1 - R0) * Math.pow(rnd(), 1.4)
    const a = armAngle(k, rf) + gauss(rnd) * (0.045 + 0.1 * rf)
      ; (rnd() < 0.08 ? pink : blue).push(px(rf * Math.cos(a), rf * Math.sin(a)))
  }
  return { warm, blue, pink }
})()
const SUN_A = armAngle(1, 0.52)
const SUN_G = [0.52 * Math.cos(SUN_A), 0.52 * Math.sin(SUN_A)]
export const GALAXY_TILT = TILT

/** Posisi Matahari di layar (koordinat viewBox) untuk sudut putar theta (radian). */
export function sunAt(theta) {
  const c = Math.cos(theta), s = Math.sin(theta)
  return [CX + (SUN_G[0] * c - SUN_G[1] * s) * GR, CY + (SUN_G[0] * s + SUN_G[1] * c) * GR * TILT]
}
export const diskTransform = (theta) =>
  `translate(${CX} ${CY}) scale(1 ${TILT}) rotate(${(theta * 180) / Math.PI})`

export function GalaxyScene({ diskRef, sunRef }) {
  const [sx, sy] = sunAt(0)
  return (
    <svg viewBox="0 0 400 250" role="presentation">
      <defs>
        <radialGradient id="us-gdisc"><stop offset="0" stopColor="#ffd6a0" stopOpacity=".35" /><stop offset=".25" stopColor="#ffc896" stopOpacity=".1" /><stop offset=".7" stopColor="#6e96e6" stopOpacity=".05" /><stop offset="1" stopColor="#3c5ac8" stopOpacity="0" /></radialGradient>
        <radialGradient id="us-gcore"><stop offset="0" stopColor="#fff0d2" stopOpacity=".9" /><stop offset=".4" stopColor="#ffc88c" stopOpacity=".25" /><stop offset="1" stopColor="#ffb478" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={CX} cy={CY} rx={GR} ry={GR * TILT} fill="url(#us-gdisc)" />
      <g ref={diskRef} transform={diskTransform(0)}>
        <path d={dots(GALAXY.blue)} stroke="rgba(175,208,255,.8)" strokeWidth="1.5" strokeLinecap="round" />
        <path d={dots(GALAXY.pink)} stroke="rgba(255,160,205,.85)" strokeWidth="1.6" strokeLinecap="round" />
        <path d={dots(GALAXY.warm)} stroke="rgba(255,222,176,.85)" strokeWidth="1.4" strokeLinecap="round" />
      </g>
      <ellipse cx={CX} cy={CY} rx={GR * 0.12} ry={GR * 0.12 * TILT} fill="url(#us-gcore)" className={styles.breathe} />
      <g ref={sunRef} transform={`translate(${sx} ${sy})`}>
        {/* cincin kecil = lingkungan bintang tetangga dari level sebelumnya */}
        <circle r="5" fill="rgba(255,211,106,.1)" stroke="rgba(120,160,230,.55)" strokeWidth=".7" />
        <You x={0} y={0} label="YOU ARE HERE" dx={14} dy={-16} />
      </g>
      <text x="14" y="238" fill="#6f8aa8" fontSize="7.5" letterSpacing="1.2" style={FONT}>26,000 LY FROM THE CENTER</text>
    </svg>
  )
}

// ── 5. Local Group ─────────────────────────────────────────────────────
// Skala: 24 px = 1 juta ly. Galaksi digambar membesar supaya terlihat.
const LG = (() => {
  const rnd = mulberry32(11)
  const around = (cx, cy, rad, n) => Array.from({ length: n }, () => {
    const d = rad * Math.sqrt(rnd()), a = rnd() * Math.PI * 2
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]
  })
  const m31 = [CX + 52, CY - 30]
  const far = Array.from({ length: 14 }, () => {
    const d = 112 * Math.sqrt(rnd()), a = rnd() * Math.PI * 2
    return [CX + Math.cos(a) * d, CY + Math.sin(a) * d]
  })
  return { m31, m33: [m31[0] - 12, m31[1] - 15], sats: [...around(CX, CY, 22, 14), ...around(m31[0], m31[1], 20, 12), ...far] }
})()
export function LocalGroupScene() {
  const [ax, ay] = LG.m31
  return (
    <svg viewBox="0 0 400 250" role="presentation">
      <defs>
        <radialGradient id="us-lgg"><stop offset="0" stopColor="#e8e0ff" stopOpacity=".9" /><stop offset=".4" stopColor="#a8a0ff" stopOpacity=".35" /><stop offset="1" stopColor="#7878ff" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r="118" fill="none" stroke="rgba(143,171,198,.3)" strokeDasharray="3 5" strokeWidth=".8" />
      <path d={dots(LG.sats)} stroke="rgba(190,205,255,.75)" strokeWidth="1.8" strokeLinecap="round" />
      <path d={dots([[CX - 6, CY + 6], [CX - 10, CY + 9]])} stroke="#d6e4ff" strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx={CX} cy={CY} rx="14" ry="8.7" fill="url(#us-lgg)" />
      <ellipse cx={ax} cy={ay} rx="20" ry="7" fill="url(#us-lgg)" transform={`rotate(-35 ${ax} ${ay})`} />
      <ellipse cx={LG.m33[0]} cy={LG.m33[1]} rx="8" ry="6" fill="url(#us-lgg)" />
      <text x={ax + 16} y={ay + 14} fill="#b8b0ff" fontSize="8" letterSpacing="1.4" style={FONT}>ANDROMEDA</text>
      <text x={LG.m33[0] - 10} y={LG.m33[1] - 9} textAnchor="end" fill="#a8b4e8" fontSize="7" letterSpacing="1.2" style={FONT}>TRIANGULUM</text>
      <You label="YOU ARE IN HERE" dx={-14} dy={20} anchor="end" />
      <path d="M14 232v-4h24v4" fill="none" stroke="rgba(143,171,198,.6)" strokeWidth=".8" transform="translate(0 4)" />
      <text x="44" y="238" fill="#6f8aa8" fontSize="7.5" letterSpacing="1" style={FONT}>1 MILLION LY</text>
    </svg>
  )
}

// ── 6. Alam semesta teramati (jaring kosmik) ───────────────────────────
const COSMOS = (() => {
  const rnd = mulberry32(5)
  const inCircle = (rad) => { for (; ;) { const x = (rnd() * 2 - 1) * rad, y = (rnd() * 2 - 1) * rad; if (x * x + y * y <= rad * rad) return [x, y] } }
  const nodes = Array.from({ length: 48 }, () => inCircle(108))
  const edges = new Set()
  nodes.forEach((n, i) => {
    nodes.map((m, j) => [j, Math.hypot(n[0] - m[0], n[1] - m[1])])
      .filter(([j, d]) => j !== i && d < 58).sort((a, b) => a[1] - b[1]).slice(0, 2)
      .forEach(([j]) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`))
  })
  const lines = [], a = [], b = [], c = []
  const put = (x, y) => (rnd() < 0.5 ? a : rnd() < 0.7 ? b : c).push([CX + x, CY + y])
  edges.forEach((e) => {
    const [i, j] = e.split('-').map(Number), p = nodes[i], q = nodes[j]
    lines.push(`M${CX + p[0]} ${CY + p[1]}L${CX + q[0]} ${CY + q[1]}`)
    for (let k = 0; k < 9; k++) { const t = rnd(); put(p[0] + (q[0] - p[0]) * t + gauss(rnd) * 2.4, p[1] + (q[1] - p[1]) * t + gauss(rnd) * 2.4) }
  })
  nodes.forEach((n) => { for (let k = 0; k < 12; k++) put(n[0] + gauss(rnd) * 4, n[1] + gauss(rnd) * 4) })
  for (let k = 0; k < 120; k++) { const [x, y] = inCircle(116); (rnd() < 0.5 ? a : b).push([CX + x, CY + y]) }
  return { lines: lines.join(''), a, b, c }
})()
export function CosmosScene() {
  return (
    <svg viewBox="0 0 400 250" role="presentation">
      <circle cx={CX} cy={CY} r="118" fill="rgba(40,60,140,.07)" stroke="rgba(143,171,198,.35)" strokeDasharray="3 5" strokeWidth=".8" />
      <path d={COSMOS.lines} stroke="rgba(120,150,255,.16)" strokeWidth=".6" fill="none" />
      <path d={dots(COSMOS.a)} stroke="rgba(180,205,255,.8)" strokeWidth="1.3" strokeLinecap="round" />
      <path d={dots(COSMOS.b)} stroke="rgba(255,240,215,.75)" strokeWidth="1.3" strokeLinecap="round" />
      <path d={dots(COSMOS.c)} stroke="rgba(255,175,205,.8)" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="4" fill="rgba(143,171,198,.18)" stroke="rgba(143,171,198,.6)" strokeDasharray="1.5 1.5" strokeWidth=".6" />
      <You label="YOU (A POINT HERE)" dx={14} dy={-16} />
      <text x={CX} y="246" textAnchor="middle" fill="#6f8aa8" fontSize="7.5" letterSpacing="1.6" style={FONT}>EDGE OF THE OBSERVABLE UNIVERSE</text>
    </svg>
  )
}

// RHO[i] = seberapa kecil scene i-1 tampil di dalam scene i (rasio ukuran).
// Dipilih agar ukurannya sama dengan objek penanda di scene i:
//  1: Bumi 74px → planet r=2.6   2: orbit Neptunus 112px → cincin r=5
//  3: lingkungan 108px → cincin r=5   4: spiral 168px → elips rx=14
//  5: Local Group 118px → lingkaran r=4
export const RHO = [null, 2.6 / 74, 5 / 112, 5 / 108, 14 / 168, 4 / 118]

export const SCENES = [EarthScene, SolarScene, NeighborsScene, GalaxyScene, LocalGroupScene, CosmosScene]
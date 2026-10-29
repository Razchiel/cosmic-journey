import { useEffect, useRef, memo } from 'react'

// Waktu-konstan easing depth (detik). 3 × TAU ≈ 1,6 dtk → ~95% tercapai, ~2 dtk hampir tuntas.
const DEPTH_TAU = 0.55
const clamp01 = (v) => Math.min(1, Math.max(0, v))

// Mode tenang (Comfort), nilai pada calm penuh (di-easing 0..1, tanpa lompatan):
const CALM_SLOW = 0.3     // kedip dan drift tinggal 30%
const CALM_DIM = 0.45     // kecerahan canvas dikurangi 45% lagi (di atas redup dari depth)
const CALM_KEEP = 0.2     // ambang rank turun: bintang yang digambar makin sedikit
const CALM_HALO = 0.5     // halo bintang terang mengecil

// depth 0..1: makin tinggi → canvas lebih redup, bintang yang digambar berkurang
// (sisa kebanyakan yang redup), halo mengecil, kedip melambat. Dibaca lewat ref di loop gambar.
// calm (boolean): mode Comfort, juga dibaca lewat ref (tidak memicu inisialisasi ulang).
function StarField({ count = 500, mouseParallax = true, depth = 0, calm = false }) {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const shootersRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animRef = useRef(null)

  // Depth dan calm: target (dari prop) dan nilai berjalan (di-easing di loop, tanpa state per frame)
  const depthTargetRef = useRef(clamp01(depth))
  const depthCurRef = useRef(clamp01(depth))
  const calmTargetRef = useRef(calm ? 1 : 0)
  const calmCurRef = useRef(calm ? 1 : 0)
  const kickRef = useRef(null) // membangunkan loop (penting saat reduced motion: loop berhenti bila sudah stabil)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let lastW = 0
    let lastH = 0
    let lastT = 0

    // Layar sempit (HP) cukup dengan ±55% bintang: tampilan sama, beban jauh lebih ringan
    const targetCount = () => (window.innerWidth < 768 ? Math.round(count * 0.55) : count)

    // ── Init stars ────────────────────────────────────────
    const initStars = () => {
      starsRef.current = Array.from({ length: targetCount() }, () => {
        const tier = Math.random()
        // Radius disesuaikan agar bintang terlihat jelas
        const r = tier > 0.92 ? Math.random() * 1.8 + 1.4   // Bintang terang
          : tier > 0.75 ? Math.random() * 1.0 + 0.8   // Bintang sedang
            : Math.random() * 0.6 + 0.4                 // Bintang redup
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r,
          // rank 0..1 tetap per bintang: bintang besar cenderung berrank tinggi (dibuang duluan saat depth naik)
          rank: 0.5 * ((r - 0.4) / 2.8) + 0.5 * Math.random(),
          alpha: Math.random(),
          speed: reduce ? 0 : Math.random() * 0.005 + 0.001,
          phase: Math.random() * Math.PI * 2,
          drift: reduce ? 0 : (Math.random() - 0.5) * 0.02,
          layer: Math.floor(Math.random() * 3),
          color: (() => {
            const c = Math.random()
            if (c > 0.90) return { r: 255, g: 220, b: 120 }
            if (c > 0.80) return { r: 200, g: 180, b: 255 }
            if (c > 0.70) return { r: 140, g: 200, b: 255 }
            if (c > 0.60) return { r: 255, g: 180, b: 180 }
            return { r: 210, g: 225, b: 255 }
          })(),
        }
      })
    }

    // ── Resize ────────────────────────────────────────────
    // Address bar HP naik-turun hanya mengubah TINGGI: bintang tidak dibuat ulang,
    // posisi Y cukup diskalakan. Bintang baru dibuat hanya jika LEBAR berubah.
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const widthChanged = w !== lastW
      const oldH = lastH
      lastW = w
      lastH = h
      canvas.width = w
      canvas.height = h

      if (!starsRef.current.length || widthChanged) {
        initStars()
      } else if (oldH && h !== oldH) {
        const k = h / oldH
        starsRef.current.forEach((s) => { s.y *= k })
      }
      if (reduce) draw() // loop tidak berjalan terus di mode reduced: gambar ulang manual
    }

    // ── Shooting stars ────────────────────────────────────
    const spawnShooter = () => ({
      x: Math.random() * canvas.width * 0.7,
      y: Math.random() * canvas.height * 0.4,
      len: Math.random() * 180 + 80,
      speed: Math.random() * 14 + 8,
      angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      opacity: 1,
      width: Math.random() * 1.5 + 0.5,
      trail: [],
    })

    // Spawn shooting star setiap 3–7 detik (dimatikan saat reduced motion; dilewati saat Comfort)
    const shooterInterval = reduce ? 0 : setInterval(() => {
      if (!document.hidden && calmTargetRef.current === 0 && shootersRef.current.length < 3) {
        shootersRef.current.push(spawnShooter())
      }
    }, 3000 + Math.random() * 4000)

    // ── Draw ──────────────────────────────────────────────
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // c: 0 = normal, 1 = Comfort penuh (di-easing, jadi transisinya mulus)
      const c = calmCurRef.current
      const calmK = 1 - (1 - CALM_SLOW) * c
      const mx = mouseRef.current.x * (1 - c)
      const my = mouseRef.current.y * (1 - c)

      // Parameter turunan depth + calm (dihitung sekali per frame)
      const d = depthCurRef.current
      const dim = (1 - 0.5 * d) * (1 - CALM_DIM * c)   // kecerahan canvas: 1 → 0,5 (depth), lalu × 0,55 (Comfort)
      const keep = 1.1 - 0.65 * d - CALM_KEEP * c      // ambang rank: makin kecil, makin sedikit bintang
      const slow = 1 - 0.65 * d                        // kecepatan kedip: 100% → 35%
      const haloK = (2.2 - 0.9 * d) * (1 - CALM_HALO * c * 0.5) // radius halo
      const haloA = 0.22 * (1 - 0.5 * d) * (1 - CALM_HALO * c)

      ctx.globalAlpha = dim

      // Draw stars
      starsRef.current.forEach((s) => {
        s.phase += s.speed * slow * calmK
        s.x += s.drift * calmK
        if (s.x < -2) s.x = canvas.width + 2
        if (s.x > canvas.width + 2) s.x = -2

        // Memudar halus di sekitar ambang (tidak "pop" saat bintang hilang)
        const vis = clamp01((keep - s.rank) / 0.1)
        if (vis <= 0.01) return

        const parallaxStr = [0.003, 0.009, 0.020][s.layer]
        const px = s.x + mx * parallaxStr
        const py = s.y + my * parallaxStr

        // Twinkle: bintang besar lebih dramatis (reduced: kecerahan tetap)
        const twinkle = reduce ? 0.8 : 0.3 + Math.abs(Math.sin(s.phase)) * 0.7
        const { r, g, b } = s.color
        const alpha = twinkle * (s.r > 1.2 ? 1 : 0.85) * vis

        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
        ctx.fill()

        // Luminous halo untuk bintang terang (jauh lebih efisien dari shadowBlur CPU filter)
        if (s.r > 1.0) {
          ctx.beginPath()
          ctx.arc(px, py, s.r * haloK, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * haloA})`
          ctx.fill()
        }
      })

      // Draw shooting stars (ikut dim lewat globalAlpha). Yang sudah terlanjur muncul dibiarkan selesai.
      shootersRef.current = shootersRef.current.filter((s) => {
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        s.opacity -= 0.012

        if (s.opacity <= 0 || s.x > canvas.width + 50 || s.y > canvas.height + 50) return false

        const tailX = s.x - Math.cos(s.angle) * s.len
        const tailY = s.y - Math.sin(s.angle) * s.len

        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        grad.addColorStop(0, `rgba(255,255,255,0)`)
        grad.addColorStop(0.7, `rgba(200,220,255,${s.opacity * 0.4})`)
        grad.addColorStop(1, `rgba(255,255,255,${s.opacity})`)

        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.strokeStyle = grad
        ctx.lineWidth = s.width
        ctx.shadowBlur = 8
        ctx.shadowColor = `rgba(180,210,255,${s.opacity})`
        ctx.stroke()
        ctx.shadowBlur = 0

        return true
      })

      ctx.globalAlpha = 1
    }

    // ── Loop ──────────────────────────────────────────────
    // Normal: berjalan terus (dijeda saat tab tersembunyi).
    // Reduced motion: hanya berjalan selama depth / calm masih berpindah, lalu berhenti sendiri.
    const ease = (cur, target, dt) => {
      const diff = target - cur
      return Math.abs(diff) < 0.0005 ? target : cur + diff * (1 - Math.exp(-dt / DEPTH_TAU))
    }

    const loop = (now) => {
      const dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 0.016
      lastT = now

      depthCurRef.current = ease(depthCurRef.current, depthTargetRef.current, dt)
      calmCurRef.current = ease(calmCurRef.current, calmTargetRef.current, dt)

      draw()

      if (
        reduce &&
        depthCurRef.current === depthTargetRef.current &&
        calmCurRef.current === calmTargetRef.current
      ) {
        animRef.current = null
        lastT = 0
        return
      }
      animRef.current = requestAnimationFrame(loop)
    }
    const startLoop = () => {
      if (animRef.current || document.hidden) return
      lastT = 0
      animRef.current = requestAnimationFrame(loop)
    }
    const stopLoop = () => {
      cancelAnimationFrame(animRef.current)
      animRef.current = null
    }
    const onVisibility = () => (document.hidden ? stopLoop() : startLoop())

    const onMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX - window.innerWidth / 2,
        y: e.clientY - window.innerHeight / 2,
      }
    }

    kickRef.current = startLoop

    resize()
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    // Parallax mouse dimatikan saat reduced motion
    if (mouseParallax && !reduce) window.addEventListener('mousemove', onMouseMove, { passive: true })
    startLoop()

    return () => {
      kickRef.current = null
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('visibilitychange', onVisibility)
      stopLoop()
      if (shooterInterval) clearInterval(shooterInterval)
      shootersRef.current = []
    }
  }, [count, mouseParallax])

  // Perubahan depth hanya memperbarui target (ref) dan membangunkan loop; efek utama tidak dijalankan ulang
  useEffect(() => {
    depthTargetRef.current = clamp01(depth)
    kickRef.current?.()
  }, [depth])

  // Perubahan calm: target di-easing di loop (mulus), loop dibangunkan bila sedang berhenti
  useEffect(() => {
    calmTargetRef.current = calm ? 1 : 0
    kickRef.current?.()
  }, [calm])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

export default memo(StarField)
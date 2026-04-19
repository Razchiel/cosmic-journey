import { useEffect, useRef } from 'react'

export default function StarField({ count = 500, mouseParallax = true }) {
  const canvasRef   = useRef(null)
  const starsRef    = useRef([])
  const shootersRef = useRef([])
  const mouseRef    = useRef({ x: 0, y: 0 })
  const animRef     = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // ── Resize ────────────────────────────────────────────
    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    // ── Init stars ────────────────────────────────────────
    const initStars = () => {
      starsRef.current = Array.from({ length: count }, () => {
        const tier = Math.random()
        return {
          x:     Math.random() * canvas.width,
          y:     Math.random() * canvas.height,
          // Lebih banyak bintang besar (radius sampai 2.5)
          r:     tier > 0.92 ? Math.random() * 1.5 + 1.2   // bright star
               : tier > 0.75 ? Math.random() * 0.9 + 0.6   // mid star
               :               Math.random() * 0.5 + 0.1,   // dim star
          alpha:   Math.random(),
          speed:   Math.random() * 0.005 + 0.001,
          phase:   Math.random() * Math.PI * 2,
          drift:   (Math.random() - 0.5) * 0.02,
          layer:   Math.floor(Math.random() * 3),
          // Warna: putih, biru muda, ungu, emas (10% masing-masing warna)
          color:   (() => {
            const r = Math.random()
            if (r > 0.90) return { r: 255, g: 220, b: 120 }  // gold
            if (r > 0.80) return { r: 200, g: 180, b: 255 }  // purple
            if (r > 0.70) return { r: 140, g: 200, b: 255 }  // blue
            if (r > 0.60) return { r: 255, g: 180, b: 180 }  // pink
            return { r: 210, g: 225, b: 255 }                 // white-blue (default)
          })(),
        }
      })
    }

    // ── Shooting stars ────────────────────────────────────
    const spawnShooter = () => ({
      x:       Math.random() * canvas.width * 0.7,
      y:       Math.random() * canvas.height * 0.4,
      len:     Math.random() * 180 + 80,
      speed:   Math.random() * 14 + 8,
      angle:   Math.PI / 4 + (Math.random() - 0.5) * 0.3,
      opacity: 1,
      width:   Math.random() * 1.5 + 0.5,
      trail:   [],
    })

    // Spawn shooting star setiap 3–7 detik
    const shooterInterval = setInterval(() => {
      if (shootersRef.current.length < 3) {
        shootersRef.current.push(spawnShooter())
      }
    }, 3000 + Math.random() * 4000)

    // ── Draw loop ─────────────────────────────────────────
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      // Draw stars
      starsRef.current.forEach((s) => {
        s.phase += s.speed
        s.x += s.drift
        if (s.x < -2) s.x = canvas.width + 2
        if (s.x > canvas.width + 2) s.x = -2

        const parallaxStr = [0.003, 0.009, 0.020][s.layer]
        const px = s.x + mx * parallaxStr
        const py = s.y + my * parallaxStr

        // Twinkle: bintang besar lebih dramatis
        const twinkle = 0.3 + Math.abs(Math.sin(s.phase)) * 0.7
        const { r, g, b } = s.color
        const alpha = twinkle * (s.r > 1.2 ? 1 : 0.85)

        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`

        // Glow untuk bintang terang
        if (s.r > 1.0) {
          ctx.shadowBlur  = s.r * 6
          ctx.shadowColor = `rgba(${r},${g},${b},0.7)`
        } else {
          ctx.shadowBlur = 0
        }
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // Draw shooting stars
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
        ctx.lineWidth   = s.width
        ctx.shadowBlur  = 8
        ctx.shadowColor = `rgba(180,210,255,${s.opacity})`
        ctx.stroke()
        ctx.shadowBlur = 0

        return true
      })

      animRef.current = requestAnimationFrame(draw)
    }

    const onMouseMove = (e) => {
      mouseRef.current = {
        x: e.clientX - window.innerWidth / 2,
        y: e.clientY - window.innerHeight / 2,
      }
    }

    resize()
    window.addEventListener('resize', resize)
    if (mouseParallax) window.addEventListener('mousemove', onMouseMove, { passive: true })
    animRef.current = requestAnimationFrame(draw)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(animRef.current)
      clearInterval(shooterInterval)
    }
  }, [count, mouseParallax])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}

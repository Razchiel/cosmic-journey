import { useEffect, useRef } from 'react'

// Animated star field rendered on a fixed canvas
export default function StarField({ count = 350, mouseParallax = true }) {
  const canvasRef = useRef(null)
  const starsRef = useRef([])
  const mouseRef = useRef({ x: 0, y: 0 })
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.5 + 0.15,
        alpha: Math.random(),
        speed: Math.random() * 0.004 + 0.001,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.025,
        layer: Math.floor(Math.random() * 3), // 0=far, 1=mid, 2=near
        hue: Math.random() > 0.9 ? (Math.random() > 0.5 ? 200 : 280) : 220,
      }))
    }

    const draw = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      starsRef.current.forEach((s) => {
        s.phase += s.speed
        s.x += s.drift
        if (s.x < -2) s.x = canvas.width + 2
        if (s.x > canvas.width + 2) s.x = -2

        // Parallax offset by layer
        const parallaxStrength = [0.004, 0.01, 0.022][s.layer]
        const px = s.x + mx * parallaxStrength
        const py = s.y + my * parallaxStrength

        const alpha = 0.25 + Math.abs(Math.sin(s.phase)) * 0.75

        // Occasional colored stars
        const color = s.hue === 220
          ? `rgba(190,210,255,${alpha})`
          : s.hue === 200
            ? `rgba(180,230,255,${alpha})`
            : `rgba(220,190,255,${alpha})`

        ctx.beginPath()
        ctx.arc(px, py, s.r, 0, Math.PI * 2)
        ctx.fillStyle = color

        // Glow for brighter stars
        if (s.r > 1.1) {
          ctx.shadowBlur = 6
          ctx.shadowColor = color
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fill()
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
        zIndex: 0,
      }}
    />
  )
}

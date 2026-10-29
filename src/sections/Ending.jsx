import { useState, useEffect, useMemo, useRef, memo } from 'react'
import { sfx } from '../hooks/useSfx.js'
import styles from './Ending.module.css'

// ── DATA PESAN SEMESTA ───────────────────────────────────────────────
const COSMIC_MESSAGES = [
  "Much of you was forged inside stars. Carry that with you.",
  "Stars burn out, but their light keeps travelling long after. Leave some of yours behind.",
  "Out of every way things could have gone, you happened. Be gentle with that.",
  "Space is mostly dark and quiet. That is why even a small light is easy to see.",
  "What you do today reaches further than you can see. Someone will feel it."
]

const ALPHABET_POINTS = {
  A: [[20, 90], [50, 10], [80, 90], [65, 50], [35, 50]],
  B: [[20, 10], [20, 90], [20, 50], [60, 50], [70, 70], [60, 90], [20, 90], [20, 10], [60, 10], [70, 30], [60, 50]],
  C: [[80, 20], [60, 10], [30, 20], [20, 50], [30, 80], [60, 90], [80, 80]],
  D: [[20, 10], [20, 90], [50, 90], [70, 70], [70, 30], [50, 10], [20, 10]],
  E: [[80, 10], [20, 10], [20, 50], [60, 50], [20, 50], [20, 90], [80, 90]],
  F: [[80, 10], [20, 10], [20, 50], [60, 50], [20, 50], [20, 90]],
  G: [[80, 20], [60, 10], [30, 20], [20, 50], [30, 80], [60, 90], [80, 80], [80, 50], [50, 50]],
  H: [[20, 10], [20, 90], [20, 50], [80, 50], [80, 10], [80, 90]],
  I: [[30, 10], [70, 10], [50, 10], [50, 90], [30, 90], [70, 90]],
  J: [[20, 70], [40, 90], [60, 90], [80, 70], [80, 10]],
  K: [[20, 10], [20, 90], [20, 50], [80, 10], [20, 50], [80, 90]],
  L: [[20, 10], [20, 90], [80, 90]],
  M: [[20, 90], [20, 10], [50, 50], [80, 10], [80, 90]],
  N: [[20, 90], [20, 10], [80, 90], [80, 10]],
  O: [[50, 10], [20, 30], [20, 70], [50, 90], [80, 70], [80, 30], [50, 10]],
  P: [[20, 90], [20, 10], [60, 10], [80, 30], [60, 50], [20, 50]],
  Q: [[50, 10], [20, 30], [20, 70], [50, 90], [80, 70], [80, 30], [50, 10], [70, 70], [90, 90]],
  R: [[20, 90], [20, 10], [60, 10], [80, 30], [60, 50], [20, 50], [50, 50], [80, 90]],
  S: [[80, 20], [50, 10], [20, 30], [50, 50], [80, 70], [50, 90], [20, 80]],
  T: [[10, 10], [90, 10], [50, 10], [50, 90]],
  U: [[20, 10], [20, 70], [40, 90], [60, 90], [80, 70], [80, 10]],
  V: [[20, 10], [50, 90], [80, 10]],
  W: [[10, 10], [30, 90], [50, 50], [70, 90], [90, 10]],
  X: [[20, 10], [80, 90], [50, 50], [80, 10], [20, 90]],
  Y: [[20, 10], [50, 50], [80, 10], [50, 50], [50, 90]],
  Z: [[20, 10], [80, 10], [20, 90], [80, 90]]
}

// Bangun titik rasi bintang dari huruf pertama nama (dipakai tampilan + kartu share)
function makeConstellation(name) {
  let char = name.trim().charAt(0).toUpperCase()
  if (!ALPHABET_POINTS[char]) char = 'O'
  return ALPHABET_POINTS[char].map(([x, y]) => ({
    x: 90 + x * 1.2 + (Math.random() - 0.5) * 8,
    y: 20 + y * 1.2 + (Math.random() - 0.5) * 8,
  }))
}

function LetterConstellation({ name, points }) {
  return (
    <div className={styles.constellationWrap}>
      <svg viewBox="0 0 300 160" className={styles.constellationSvg}>
        {points.map((p, i) => {
          const next = points[i + 1]
          return next ? (
            <line key={`line-${i}`} x1={p.x} y1={p.y} x2={next.x} y2={next.y} stroke="rgba(136, 170, 255, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
          ) : null
        })}
        {points.map((p, i) => (
          <g key={`star-${i}`}>
            <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" filter="drop-shadow(0 0 6px rgba(136, 170, 255, 0.8))" />
            <circle cx={p.x} cy={p.y} r="1.5" fill="#fff" />
          </g>
        ))}
      </svg>
      <p className={styles.constellationLabel}>Constellation {name}</p>
    </div>
  )
}

// ── SHARE CARD: render konstelasi + pesan ke PNG 1080×1350 ─────────────
function wrapLines(g, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (g.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = test
    }
  }
  if (line) lines.push(line)
  return lines
}

async function drawShareCard({ name, message, points, coords }) {
  try {
    await Promise.all([
      document.fonts.load('italic 300 60px "Cormorant Garamond"'),
      document.fonts.load('300 24px "Outfit"'),
      document.fonts.load('400 24px "Outfit"'),
    ])
  } catch (_) { /* font fallback */ }

  const W = 1080, H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const g = canvas.getContext('2d')
  const serif = '"Cormorant Garamond", Georgia, serif'
  const sans = '"Outfit", system-ui, sans-serif'
  // Warna teks kecil di kartu: lantai sama dengan --text-muted (#9fb0d4)
  const MUTED = '#9fb0d4'
  const setSpacing = (px) => { if ('letterSpacing' in g) g.letterSpacing = `${px}px` }

  // background
  const bg = g.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#02021a')
  bg.addColorStop(0.55, '#0b0720')
  bg.addColorStop(1, '#16091f')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)

  // soft nebula washes
  const wash = (x, y, r, color) => {
    const rg = g.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, color)
    rg.addColorStop(1, 'rgba(0,0,0,0)')
    g.fillStyle = rg
    g.fillRect(0, 0, W, H)
  }
  wash(220, 260, 520, 'rgba(80,110,255,0.16)')
  wash(900, 1050, 560, 'rgba(160,80,255,0.14)')

  // star dust
  for (let i = 0; i < 320; i++) {
    const r = Math.random() * 1.6 + 0.3
    g.fillStyle = `rgba(210,225,255,${Math.random() * 0.7 + 0.15})`
    g.beginPath()
    g.arc(Math.random() * W, Math.random() * H, r, 0, Math.PI * 2)
    g.fill()
  }

  // frame
  g.strokeStyle = 'rgba(136,170,255,0.25)'
  g.lineWidth = 2
  g.beginPath()
  g.roundRect ? g.roundRect(40, 40, W - 80, H - 80, 28) : g.rect(40, 40, W - 80, H - 80)
  g.stroke()

  // constellation (fit into 520×340 area centred at y=330)
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  const scale = Math.min(520 / ((maxX - minX) || 1), 340 / ((maxY - minY) || 1))
  const pts = points.map((p) => ({
    x: W / 2 + (p.x - (minX + maxX) / 2) * scale,
    y: 330 + (p.y - (minY + maxY) / 2) * scale,
  }))

  g.strokeStyle = 'rgba(136,170,255,0.55)'
  g.lineWidth = 2.5
  g.setLineDash([10, 10])
  g.beginPath()
  pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)))
  g.stroke()
  g.setLineDash([])

  pts.forEach((p) => {
    const halo = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, 30)
    halo.addColorStop(0, 'rgba(160,190,255,0.85)')
    halo.addColorStop(1, 'rgba(160,190,255,0)')
    g.fillStyle = halo
    g.fillRect(p.x - 30, p.y - 30, 60, 60)
    g.fillStyle = '#fff'
    g.beginPath()
    g.arc(p.x, p.y, 7, 0, Math.PI * 2)
    g.fill()
  })

  g.textAlign = 'center'

  // label under constellation
  g.fillStyle = MUTED
  g.font = `400 24px ${sans}`
  setSpacing(5)
  g.fillText(`CONSTELLATION ${name.toUpperCase()}`, W / 2, 560)

  // divider
  g.strokeStyle = 'rgba(255,255,255,0.12)'
  g.lineWidth = 1
  g.beginPath()
  g.moveTo(160, 600)
  g.lineTo(W - 160, 600)
  g.stroke()

  // header
  g.fillStyle = MUTED
  g.font = `400 24px ${sans}`
  setSpacing(4)
  g.fillText('DECRYPTED TRANSMISSION', W / 2, 668)
  setSpacing(0)

  // "Dear Name," mengecil sampai muat
  let size = 70
  g.fillStyle = '#aaccff'
  do {
    g.font = `italic 300 ${size}px ${serif}`
    size -= 4
  } while (g.measureText(`Dear ${name},`).width > 880 && size > 30)
  g.fillText(`Dear ${name},`, W / 2, 770)

  // message: font mengecil sampai muat di atas footer
  g.fillStyle = '#e0e5ff'
  let msgSize = 54
  let lines = []
  while (true) {
    g.font = `italic 300 ${msgSize}px ${serif}`
    lines = wrapLines(g, `“${message}”`, 840)
    if (lines.length * msgSize * 1.45 <= 270 || msgSize <= 32) break
    msgSize -= 2
  }
  const lh = msgSize * 1.45
  lines.forEach((ln, i) => g.fillText(ln, W / 2, 870 + i * lh))

  // footer
  g.fillStyle = MUTED
  g.font = `400 24px ${sans}`
  setSpacing(4)
  g.fillText('COSMIC JOURNEY', W / 2, H - 110)
  g.font = `400 21px ${sans}`
  setSpacing(2)
  g.fillText(`COSMIC COORDS: ${coords}`, W / 2, H - 76)
  setSpacing(0)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

// ── KOMPONEN BINTANG GEMERLAP (BACKGROUND KARTU) ──────────────────────
function ModalStars() {
  const stars = useMemo(() => Array.from({ length: 60 }).map(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 4,
    duration: Math.random() * 2 + 2
  })), [])

  return (
    <div className={styles.modalStarsWrap}>
      {stars.map((s, i) => (
        <div key={i} className={styles.modalStar} style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: `${s.size}px`, height: `${s.size}px`,
          animationDelay: `${s.delay}s`,
          animationDuration: `${s.duration}s`
        }} />
      ))}
    </div>
  )
}

// ── KOMPONEN HEART SUPERNOVA (LEDAKAN HATI DI PINGGIR KARTU) ──────────
const HEART_COLORS = ['#ff99cc', '#ffb3e6', '#e6ccff', '#ffccff', '#ffd700']

// Pilih titik (px, koordinat viewport) di pita kosong di luar kartu:
// atas, bawah, kiri, kanan. Pita yang terlalu tipis dilewati.
function pickHeartSpot(card) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const PAD = 28
  const MIN = 40
  const r = card ? card.getBoundingClientRect() : null

  const bands = r
    ? [
      { x0: 0, x1: vw, y0: 0, y1: r.top },
      { x0: 0, x1: vw, y0: r.bottom, y1: vh },
      { x0: 0, x1: r.left, y0: r.top, y1: r.bottom },
      { x0: r.right, x1: vw, y0: r.top, y1: r.bottom },
    ].filter((b) => b.x1 - b.x0 >= MIN && b.y1 - b.y0 >= MIN)
    : []

  if (!bands.length) {
    // Kartu hampir memenuhi layar: sisakan tepi atas/bawah (hati boleh sedikit menyentuh tepi kartu)
    return {
      x: 24 + Math.random() * Math.max(vw - 48, 1),
      y: Math.random() < 0.5 ? 22 : vh - 22,
    }
  }

  const area = (b) => (b.x1 - b.x0) * (b.y1 - b.y0)
  let pick = Math.random() * bands.reduce((s, b) => s + area(b), 0)
  let band = bands[bands.length - 1]
  for (const b of bands) {
    pick -= area(b)
    if (pick <= 0) { band = b; break }
  }
  const px = Math.min(PAD, (band.x1 - band.x0) / 2)
  const py = Math.min(PAD, (band.y1 - band.y0) / 2)
  return {
    x: band.x0 + px + Math.random() * (band.x1 - band.x0 - px * 2),
    y: band.y0 + py + Math.random() * (band.y1 - band.y0 - py * 2),
  }
}

function HeartSupernovas({ cardRef }) {
  const [novas, setNovas] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      const spot = pickHeartSpot(cardRef.current)
      setNovas((prev) => {
        const newNova = {
          id: Date.now() + Math.random(),
          x: spot.x,
          y: spot.y,
          scale: Math.random() * 1.2 + 1.2,
          color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)]
        }
        return [...prev.slice(-4), newNova] // Maksimal 5 ledakan di DOM
      })
    }, 1800) // Meledak setiap 1.8 detik

    return () => clearInterval(interval)
  }, [cardRef])

  return (
    <div className={styles.heartNovaWrap}>
      {novas.map((nova) => (
        <div key={nova.id} className={styles.heartNova} style={{
          left: `${nova.x}px`, top: `${nova.y}px`,
          '--nova-scale': nova.scale,
          '--nova-color': nova.color
        }}>
          {/* SVG Hati */}
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
      ))}
    </div>
  )
}

// ── KOMPONEN UTAMA ENDING ─────────────────────────────────────────────
function Ending({ visitor, onReveal, onNext, onBackToChoices, resumeMessage = false }) {
  const { name: recipient, constellationPoints: constellation, finalMessage, coords, wishSubmitted } = visitor
  const hasMessage = Boolean(finalMessage)
  // Wish sudah terkirim (datang dari Secret Ending): tombol utama kembali ke pilihan, bukan mengulang Wishing
  const canGoBackToChoices = Boolean(wishSubmitted && onBackToChoices)

  const [isHovered, setIsHovered] = useState(false)
  // Kembali dari Secret Ending ("Stay with my constellation"): langsung buka pesan lagi
  const [modalState, setModalState] = useState(resumeMessage && hasMessage ? 'message' : 'closed')
  const [nameInput, setNameInput] = useState('')
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef(null)

  const handleOpenForm = () => {
    sfx.open()
    setModalState('form')
    setNameInput('')
  }

  const handleReveal = (e) => {
    e.preventDefault()

    const name = nameInput.trim()
    if (!name) return
    const message = COSMIC_MESSAGES[Math.floor(Math.random() * COSMIC_MESSAGES.length)]

    // Data pengunjung disimpan di App (state in-memory, tanpa localStorage)
    onReveal({
      name,
      finalMessage: message,
      constellationPoints: makeConstellation(name),
      coords: `${Math.random().toFixed(4)} N, ${Math.random().toFixed(4)} W`,
    })
    sfx.reveal()
    setModalState('message')
  }

  // X / Esc pada pesan: hanya menutup pesan (tombol lanjut muncul di halaman)
  const handleCloseMessage = () => {
    sfx.click()
    setModalState('closed')
  }

  const handleShareCard = async () => {
    if (sharing) return
    setSharing(true)
    sfx.click()
    try {
      const blob = await drawShareCard({ name: recipient, message: finalMessage, points: constellation, coords })
      if (!blob) return
      const safe = recipient.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cosmic'
      const file = new File([blob], `constellation-${safe}.png`, { type: 'image/png' })

      // Mobile: native share sheet. Desktop / tidak didukung: download.
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'A message from the universe' })
          return
        } catch (err) {
          if (err && err.name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } finally {
      setSharing(false)
    }
  }

  // Esc: tutup form / tutup pesan saja
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (modalState === 'form') setModalState('closed')
      else if (modalState === 'message') setModalState('closed')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalState])

  return (
    <section id="ending" className={`cosmic-section ${styles.ending}`}>
      <div className={styles.bgGradient} />
      <div className="noise-overlay" />

      <div className={styles.eclipseContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`${styles.recordRing} ${isHovered ? styles.ringActive : ''}`}
            style={{ '--i': i }}
          />
        ))}
        <div className={styles.eclipseCore} />
      </div>

      <div className={styles.content}>
        <p className={`t-label ${styles.eyebrow}`}>
          Final Transmission
        </p>

        <h2 className={styles.title}>
          The Universe<br />
          <em>has a message for you</em>
        </h2>

        <p className={styles.sub}>
          You have traveled through 13.8 billion years of cosmic history.<br />
          Now it is the universe&rsquo;s turn to speak.
        </p>

        <button
          className={styles.messageBtn}
          onClick={handleOpenForm}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <span className={styles.btnStar}>✦</span>
          Receive your message
          <span className={styles.btnStar}>✦</span>
        </button>

        {hasMessage && modalState === 'closed' && (
          canGoBackToChoices ? (
            <button className={styles.nextBtn} onClick={() => { sfx.click(); onBackToChoices() }}>
              Back to choices ✦
            </button>
          ) : (
            <button className={styles.nextBtn} onClick={() => { sfx.click(); onNext?.() }}>
              Next: Make a Wish ✦
            </button>
          )
        )}

        <p className={styles.footer}>
          Every journey through the cosmos begins and ends at home.
        </p>
      </div>

      <div className={`${styles.modalOverlay} ${modalState !== 'closed' ? styles.modalOpen : ''}`}>

        {/* Latar belakang khusus saat pesan muncul (gemerlap & supernova) */}
        {modalState === 'message' && (
          <>
            <ModalStars />
            <HeartSupernovas cardRef={cardRef} />
          </>
        )}

        {modalState === 'form' && (
          <div className={styles.modalBox}>
            <button className={styles.closeBtn} onClick={() => setModalState('closed')} aria-label="Close form">✕</button>
            <h3 className={styles.modalTitle}>What should the universe call you?</h3>

            <form onSubmit={handleReveal} className={styles.formContainer}>
              <input
                type="text"
                placeholder="Enter your name"
                aria-label="Your name"
                className={styles.nameInput}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
                maxLength={30}
              />

              <button type="submit" className={styles.submitBtn}>Decode Message →</button>
            </form>
          </div>
        )}

        {modalState === 'message' && (
          <div className={styles.ticketBox}>
            <button className={styles.closeBtn} onClick={handleCloseMessage} aria-label="Close message">✕</button>

            <div className={styles.ticketContent} ref={cardRef}>
              <LetterConstellation name={recipient} points={constellation} />
              <p className={`t-label ${styles.ticketLabel}`}>DECRYPTED TRANSMISSION</p>
              <h3 className={styles.recipientName}>
                Dear <span className={styles.highlightName}>{recipient}</span>,
              </h3>
              <p className={styles.finalMessageText}>"{finalMessage}"</p>

              <div className={styles.ticketFooter}>
                <span>COSMIC COORDS: {coords}</span>
                <span>STATUS: DELIVERED</span>
              </div>
              <button className={styles.shareBtn} onClick={handleShareCard} disabled={sharing}>
                {sharing ? 'Rendering card…' : '✦ Save as card'}
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  )
}

export default memo(Ending)
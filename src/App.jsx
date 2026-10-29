import React, { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import StarField from './components/StarField.jsx'
import NavDots from './components/NavDots.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import FactPopup from './components/FactPopup.jsx'
import MessageBox from './components/MessageBox.jsx'

// Lazy loading sections (kode three.js tidak akan diload di awal)
const Intro = React.lazy(() => import('./sections/Intro.jsx'))
const SolarSystem = React.lazy(() => import('./sections/SolarSystem.jsx'))
const Phenomena = React.lazy(() => import('./sections/Phenomena.jsx'))
const DeepSpace = React.lazy(() => import('./sections/DeepSpace.jsx'))
const Ending = React.lazy(() => import('./sections/Ending.jsx'))
const Wishing = React.lazy(() => import('./sections/Wishing.jsx'))
const SecretEnding = React.lazy(() => import('./sections/SecretEnding.jsx'))
const Gallery = React.lazy(() => import('./sections/Gallery.jsx'))
// HomeWarp memuat three.js, jadi lazy; dipanggil dari section mana pun lewat handleReturnHome
const HomeWarp = React.lazy(() => import('./components/HomeWarp.jsx'))

import { useAmbientAudio } from './hooks/useAudio.js'
import { sfx } from './hooks/useSfx.js'
import { UNIVERSE_MESSAGES } from './data/index.js'
import { resetSessionCallsign } from './services/wishes.js'

// Cadangan bila chunk gerbang gagal diunduh (mis. offline): lanjut tanpa gerbang dan tanpa suara,
// supaya pengunjung tidak terjebak di layar kosong.
function GateUnavailable({ onEnter, onExited }) {
  useEffect(() => {
    onEnter(false)
    onExited()
  }, [onEnter, onExited])
  return null
}

// Gerbang masuk dimuat lazy; hanya tampil sekali per kunjungan
const EntryGate = React.lazy(() =>
  import('./components/EntryGate.jsx').catch(() => ({ default: GateUnavailable }))
)

// Penutup polos selama chunk gerbang diunduh (mencegah Intro berkedip di bawahnya)
const GATE_FALLBACK = { position: 'fixed', inset: 0, zIndex: 200, background: 'var(--void)' }

// Petunjuk kecil bila suara tertahan (AudioContext suspended / interupsi / mode senyap iOS).
// Fase 12: diturunkan sedikit supaya tidak menimpa pill MusicPlayer mini di kanan atas.
const HINT_WRAP = {
  position: 'fixed',
  top: 'calc(max(0.75rem, env(safe-area-inset-top)) + 3.5rem)',
  left: 0,
  right: 0,
  zIndex: 150,
  display: 'flex',
  justifyContent: 'center',
  padding: '0 1rem',
  pointerEvents: 'none',
}
const HINT_BTN = {
  pointerEvents: 'auto',
  minHeight: '2.75rem',
  padding: '0.6rem 1.1rem',
  borderRadius: '1.25rem',
  border: '1px solid rgba(120, 160, 255, 0.5)',
  background: 'rgba(8, 8, 36, 0.92)',
  color: 'var(--text-primary)',
  fontSize: 'var(--fs-label)',
  fontWeight: 400,
  letterSpacing: '0.02em',
  lineHeight: 1.45,
  textAlign: 'center',
  boxShadow: '0 0 24px rgba(68, 102, 255, 0.25)',
  touchAction: 'manipulation',
}

// 'wishing' dan 'secret' SENGAJA tidak masuk daftar ini: bukan navigasi bebas,
// hanya terbuka lewat Ending (dan submit wish yang sukses untuk 'secret').
// NavDots/ProgressBar memakai 'ending' saat di 'wishing' atau 'secret'.
const SECTION_IDS = ['intro', 'solar', 'phenomena', 'deepspace', 'ending', 'gallery']

// Kedalaman starfield per section (0 = terang penuh, 1 = paling redup).
// Semua id section, termasuk 'secret'. Id yang tidak ada di peta jatuh ke 0.
const SECTION_DEPTH = {
  intro: 0,
  solar: 0.2,
  phenomena: 0.4,
  wishing: 0.45,
  ending: 0.55,
  deepspace: 0.7,
  gallery: 0.8,
  secret: 0.8,
}

// Mode Comfort: geser satu tingkat lebih redup
const COMFORT_DEPTH_STEP = 0.15

// Section tersembunyi yang memakai musik section lain (tanpa crossfade putus).
// Juga dipakai untuk label MusicPlayer, supaya 'secret' tidak jatuh ke track default.
const MUSIC_ALIAS = { secret: 'wishing' }

// Dari section ini ke depan, chunk section akhir + HomeWarp diunduh di latar belakang
const PRELOAD_FROM = new Set(['deepspace', 'ending', 'wishing', 'secret', 'gallery'])

// State pengunjung (in-memory saja, sengaja TIDAK disimpan di localStorage/server)
// Diisi Ending saat reveal, dibaca Wishing, Secret Ending & Gallery. Direset setelah pulang ke Bumi.
const INITIAL_VISITOR = {
  name: '',                // nama penerima konstelasi
  sender: '',              // pengirim (hanya mode "For Someone Else")
  constellationPoints: [],
  finalMessage: '',
  coords: '',
  wishSubmitted: false,
  mySubmission: null,      // data kiriman wish pengunjung ini (untuk highlight "Your wish")
  skipped: false,          // true = Wishing di-skip langsung ke Gallery (tidak membuka Secret Ending)
  secretSeen: false,       // true = sinematik Secret Ending sudah selesai/di-skip (kunjungan ulang tampil langsung)
}

const HOME_END_PAD = 800 // jeda setelah pindah ke intro sebelum overlay HomeWarp dilepas
// (HomeWarp.jsx: T_LEAVE bergantung pada angka ini, lihat catatan di sana)

// Perjalanan Bumi (intro > solar): Bumi menjauh & mengecil ke posisinya di tata surya
const TRAVEL_MS = 2800 // dari tombol penuh sampai section berganti
const ARRIVE_MS = 1000 // jeda sampai UI global muncul lagi

// Transisi gelap-terang untuk perpindahan section selain intro > solar
const FADE_OUT = 700
const FADE_IN = 800

export default function App() {
  const [fact, setFact] = useState(null)
  const [message, setMessage] = useState(null)

  // Gerbang masuk: 'show' > 'leaving' (memudar) > 'done'. Tidak pernah kembali ke 'show'
  // dalam satu kunjungan, jadi HomeWarp / "Return home" tidak memunculkannya lagi.
  const [gate, setGate] = useState('show')
  const mainRef = useRef(null)

  const [activeSection, setActiveSection] = useState('intro')
  const [renderedSection, setRenderedSection] = useState('intro')
  const [fadeState, setFadeState] = useState('visible')
  const navTimer = useRef(0) // timer pergantian section (dibatalkan jika ada perpindahan baru)

  // Perjalanan intro > solar: 'idle' > 'warp' > 'idle'
  const [warp, setWarp] = useState({ phase: 'idle', startTime: 0 })
  const warpingRef = useRef(false)

  const [fadePhase, setFadePhase] = useState('idle')

  const [visitor, setVisitor] = useState(INITIAL_VISITOR)
  const updateVisitor = useCallback((patch) => setVisitor((v) => ({ ...v, ...patch })), [])
  // true = Ending langsung membuka pesan konstelasi (dari Secret Ending: "Stay with my constellation")
  const [resumeMessage, setResumeMessage] = useState(false)

  const [homeWarping, setHomeWarping] = useState(false)
  const homeTimers = useRef([])
  // true = HomeWarp sudah memberi tahu bahwa Bumi mendekat: bintang kembali terang (depth 0)
  const [homeBright, setHomeBright] = useState(false)
  const brightenStars = useCallback(() => setHomeBright(true), [])

  // Mode Comfort (Fase 12): tombolnya ada di MusicPlayer. State hidup di sini, TANPA localStorage
  // (kembali mati saat halaman dimuat ulang; tetap menyala setelah "Return home").
  // Efek: starfield satu tingkat lebih redup dan lebih tenang (calm), body.comfort-mode
  // (kontras teks naik, animasi CSS dihentikan), FactPopup tampil lebih lama, teks langsung tampil.
  const [comfort, setComfort] = useState(false)
  const toggleComfort = useCallback(() => setComfort((c) => !c), [])

  const {
    playing,
    toggleMusic,
    volume,
    setVolume,
    changeSection,
    getAudioData,
    audioProgress,
    startAudio,
    blocked: audioBlocked,
    resumeAudio,
  } = useAmbientAudio()

  // Ketukan gerbang. SEMUA yang butuh gestur (AudioContext sfx, musik) harus dipanggil
  // sinkron di sini, sebelum await / setTimeout apa pun, supaya iOS mengizinkannya.
  const handleGateEnter = useCallback((withSound) => {
    sfx.setMuted(!withSound)
    if (withSound) sfx.unlock()
    startAudio(withSound)
    setGate((g) => (g === 'show' ? 'leaving' : g))
  }, [startAudio])

  const handleGateExited = useCallback(() => setGate('done'), [])

  const handleNavigate = useCallback((id) => {
    setFact(null)
    setMessage(null)
    if (id === activeSection) return
    if (id !== 'ending') setResumeMessage(false)
    setActiveSection(id)
    setFadeState('hidden')
    changeSection(MUSIC_ALIAS[id] ?? id)

    // Perpindahan cepat beruntun: hanya tujuan terakhir yang dirender (tanpa kilatan section perantara)
    clearTimeout(navTimer.current)
    navTimer.current = setTimeout(() => {
      setRenderedSection(id)
      setFadeState('visible')
    }, 400)
  }, [activeSection, changeSection])

  // NavDots: diabaikan selama transisi / HomeWarp (tombol tetap bisa dijangkau keyboard walau tersembunyi)
  const handleNavDot = useCallback((id) => {
    if (warpingRef.current) return
    handleNavigate(id)
  }, [handleNavigate])

  // Dipanggil Intro saat tombol tahan penuh: Intro menganimasikan Bumi, App mengganti section
  const handleWarpNavigate = useCallback((id) => {
    if (warpingRef.current || id === activeSection) return
    warpingRef.current = true
    setFact(null)
    setMessage(null)
    setWarp({ phase: 'warp', startTime: Date.now() })

    setTimeout(() => {
      handleNavigate(id)
      setTimeout(() => {
        setWarp({ phase: 'idle', startTime: 0 })
        warpingRef.current = false
      }, ARRIVE_MS)
    }, TRAVEL_MS)
  }, [activeSection, handleNavigate])

  const handleFadeNavigate = useCallback((id) => {
    if (warpingRef.current || id === activeSection) return
    warpingRef.current = true
    setFact(null)
    setMessage(null)
    setFadePhase('dark')

    setTimeout(() => {
      handleNavigate(id)
      setFadePhase('light')

      setTimeout(() => {
        setFadePhase('idle')
        warpingRef.current = false
      }, FADE_IN)
    }, FADE_OUT)
  }, [activeSection, handleNavigate])

  // Pulang ke Bumi (HomeWarp): bisa dipanggil dari section mana pun (mis. Secret Ending).
  // Tidak menyentuh state gerbang, jadi gerbang tidak muncul lagi.
  const handleReturnHome = useCallback(async () => {
    if (warpingRef.current) return
    warpingRef.current = true
    setFact(null)
    setMessage(null)
    setHomeBright(false)
    try {
      const { HOME_MS } = await import('./components/HomeWarp.jsx')
      setHomeWarping(true)
      const t1 = setTimeout(() => {
        handleNavigate('intro')
        const t2 = setTimeout(() => {
          setHomeWarping(false)
          setHomeBright(false)        // Intro sudah depth 0, jadi tidak ada lompatan visual
          setVisitor(INITIAL_VISITOR) // perjalanan baru = pengunjung baru
          resetSessionCallsign()      // callsign anonim baru untuk pengunjung berikutnya
          warpingRef.current = false
        }, HOME_END_PAD)
        homeTimers.current.push(t2)
      }, HOME_MS)
      homeTimers.current.push(t1)
    } catch (_) {
      warpingRef.current = false
    }
  }, [handleNavigate])

  // Secret Ending > "Stay with my constellation"
  const handleBackToConstellation = useCallback(() => {
    setResumeMessage(true)
    handleFadeNavigate('ending')
  }, [handleFadeNavigate])

  // Wishing: wish berhasil terkirim dan animasi bintang naik selesai > Secret Ending
  const handleWishSubmitted = useCallback(() => {
    handleFadeNavigate('secret')
  }, [handleFadeNavigate])

  useEffect(() => () => {
    homeTimers.current.forEach(clearTimeout)
    clearTimeout(navTimer.current)
  }, [])

  // Selama gerbang tampil, konten di belakangnya tidak bisa difokus keyboard / pembaca layar
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    if (gate === 'show') el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  }, [gate])

  const transitioning = warp.phase !== 'idle' || fadePhase !== 'idle' || homeWarping
  const hideUi = transitioning || gate !== 'done'
  useEffect(() => {
    document.body.classList.toggle('hide-global-ui', hideUi)
    return () => document.body.classList.remove('hide-global-ui')
  }, [hideUi])

  // Mode Comfort: kontras teks naik + gerak berkurang lewat body.comfort-mode (index.css).
  // FactPopup, MessageBox, dan Phenomena membaca class ini langsung.
  useEffect(() => {
    document.body.classList.toggle('comfort-mode', comfort)
    return () => document.body.classList.remove('comfort-mode')
  }, [comfort])

  // Preload Solar System supaya perpindahan dari intro tidak tersendat
  useEffect(() => {
    const t = setTimeout(() => import('./sections/SolarSystem.jsx'), 1500)
    return () => clearTimeout(t)
  }, [])

  // Preload section akhir + HomeWarp begitu pengunjung mencapai Deep Space,
  // supaya layar tidak kosong saat pindah ke Ending / Wishing / Secret / Gallery / pulang.
  const preloaded = useRef(false)
  useEffect(() => {
    if (preloaded.current || !PRELOAD_FROM.has(activeSection)) return
    const t = setTimeout(() => {
      preloaded.current = true
      const quiet = () => { }
      import('./sections/Ending.jsx').catch(quiet)
      import('./sections/Wishing.jsx').catch(quiet)
      import('./sections/SecretEnding.jsx').catch(quiet)
      import('./sections/Gallery.jsx').catch(quiet)
      import('./components/HomeWarp.jsx').catch(quiet)
    }, 1200)
    return () => clearTimeout(t)
  }, [activeSection])

  const showFact = useCallback((d) => setFact(d), [])
  const closeFact = useCallback(() => setFact(null), [])

  const showMessage = useCallback(() => {
    setMessage(UNIVERSE_MESSAGES[Math.floor(Math.random() * UNIVERSE_MESSAGES.length)])
  }, [])
  const closeMessage = useCallback(() => setMessage(null), [])

  // Wishing dan Secret Ending tidak punya titik sendiri di NavDots/ProgressBar, jadi ikut 'ending'
  const navSection = activeSection === 'wishing' || activeSection === 'secret' ? 'ending' : activeSection
  const currentIdx = SECTION_IDS.indexOf(navSection)
  const progress = Math.max(0, currentIdx / (SECTION_IDS.length - 1))

  // Depth starfield mengikuti activeSection (berubah saat navigasi dimulai; StarField
  // meng-easing selama ~2 dtk sehingga tumpang tindih dengan fade section, tanpa lompatan).
  const baseDepth = SECTION_DEPTH[activeSection] ?? 0
  const starDepth = homeBright
    ? 0
    : Math.min(1, baseDepth + (comfort ? COMFORT_DEPTH_STEP : 0))

  return (
    <>
      <StarField count={500} mouseParallax depth={starDepth} calm={comfort} />
      <ProgressBar progress={progress} />
      <NavDots active={navSection} onNavigate={handleNavDot} />

      <MusicPlayer
        playing={playing}
        onToggle={toggleMusic}
        volume={volume}
        onVolumeChange={setVolume}
        activeSection={MUSIC_ALIAS[activeSection] ?? activeSection}
        getAudioData={getAudioData}
        audioProgress={audioProgress}
        comfort={comfort}
        onToggleComfort={toggleComfort}
      />

      <div
        className={`fade-overlay ${fadePhase === 'dark' ? 'fade-dark' : ''} ${fadePhase === 'light' ? 'fade-light' : ''}`}
        style={{ '--fade-out': `${FADE_OUT}ms`, '--fade-in': `${FADE_IN}ms` }}
        aria-hidden="true"
      />

      <main ref={mainRef} className={`section-wrapper ${fadeState}`}>
        <Suspense fallback={null}>
          {renderedSection === 'intro' && (
            <Intro
              onNext={() => handleWarpNavigate('solar')}
              isWarping={warp.phase !== 'idle'}
              warpStartTime={warp.startTime}
              travelMs={TRAVEL_MS}
            />
          )}
          {renderedSection === 'solar' && (
            <SolarSystem onFact={showFact} onNext={() => handleFadeNavigate('phenomena')} />
          )}
          {renderedSection === 'phenomena' && (
            <Phenomena onFact={showFact} onNext={() => handleFadeNavigate('deepspace')} />
          )}
          {renderedSection === 'deepspace' && (
            <DeepSpace onFact={showFact} onNext={() => handleFadeNavigate('ending')} />
          )}
          {renderedSection === 'ending' && (
            <Ending
              visitor={visitor}
              onReveal={updateVisitor}
              onNext={() => handleFadeNavigate('wishing')}
              onBackToChoices={() => handleFadeNavigate('secret')}
              resumeMessage={resumeMessage}
            />
          )}
          {renderedSection === 'wishing' && (
            <Wishing
              visitor={visitor}
              onVisitorChange={updateVisitor}
              onGallery={() => handleFadeNavigate('gallery')}
              onSubmitted={handleWishSubmitted}
              onBackToConstellation={handleBackToConstellation}
              onReturnHome={handleReturnHome}
            />
          )}
          {renderedSection === 'secret' && (
            <SecretEnding
              visitor={visitor}
              onVisitorChange={updateVisitor}
              onStay={handleBackToConstellation}
              onGallery={() => handleFadeNavigate('gallery')}
              onReturnHome={handleReturnHome}
            />
          )}
          {renderedSection === 'gallery' && (
            <Gallery
              visitor={visitor}
              onBackToConstellation={handleBackToConstellation}
              onReturnHome={handleReturnHome}
            />
          )}
        </Suspense>
      </main>

      {homeWarping && (
        <Suspense fallback={null}>
          <HomeWarp
            active
            name={visitor.name}
            points={visitor.constellationPoints}
            onBrighten={brightenStars}
          />
        </Suspense>
      )}

      <FactPopup fact={fact} onClose={closeFact} />
      <MessageBox message={message} onClose={closeMessage} />

      {audioBlocked && gate === 'done' && (
        <div style={HINT_WRAP} role="status">
          <button type="button" style={HINT_BTN} onClick={resumeAudio}>
            Sound is paused. Tap to turn it on.
            <br />
            On iPhone, also check the silent switch.
          </button>
        </div>
      )}

      {gate !== 'done' && (
        <Suspense fallback={<div style={GATE_FALLBACK} aria-hidden="true" />}>
          <EntryGate
            onEnter={handleGateEnter}
            leaving={gate === 'leaving'}
            onExited={handleGateExited}
          />
        </Suspense>
      )}
    </>
  )
}
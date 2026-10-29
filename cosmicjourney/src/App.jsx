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

import { useAmbientAudio } from './hooks/useAudio.js'
import { UNIVERSE_MESSAGES } from './data/index.js'

const SECTION_IDS = ['intro', 'solar', 'phenomena', 'deepspace', 'ending']

// Perjalanan Bumi (intro → solar): Bumi menjauh & mengecil ke posisinya di tata surya
const TRAVEL_MS = 2800 // dari tombol penuh sampai section berganti
const ARRIVE_MS = 1000 // jeda sampai UI global muncul lagi

// Transisi gelap-terang untuk perpindahan section selain intro → solar
const FADE_OUT = 700
const FADE_IN = 800

export default function App() {
  const [fact, setFact] = useState(null)
  const [message, setMessage] = useState(null)

  const [activeSection, setActiveSection] = useState('intro')
  const [renderedSection, setRenderedSection] = useState('intro')
  const [fadeState, setFadeState] = useState('visible')

  // Perjalanan intro → solar: 'idle' → 'warp' → 'idle'
  const [warp, setWarp] = useState({ phase: 'idle', startTime: 0 })
  const warpingRef = useRef(false)

  const [fadePhase, setFadePhase] = useState('idle')

  const {
    playing,
    toggleMusic,
    volume,
    setVolume,
    changeSection,
    getAudioData,
    audioProgress,
  } = useAmbientAudio()

  const handleNavigate = useCallback((id) => {
    setFact(null)
    setMessage(null)
    if (id === activeSection) return
    setActiveSection(id)
    setFadeState('hidden')
    changeSection(id)

    setTimeout(() => {
      setRenderedSection(id)
      setFadeState('visible')
    }, 400)
  }, [activeSection, changeSection])

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

  const transitioning = warp.phase !== 'idle' || fadePhase !== 'idle'
  useEffect(() => {
    document.body.classList.toggle('hide-global-ui', transitioning)
    return () => document.body.classList.remove('hide-global-ui')
  }, [transitioning])

  // Preload Solar System supaya perpindahan dari intro tidak tersendat
  useEffect(() => {
    const t = setTimeout(() => import('./sections/SolarSystem.jsx'), 1500)
    return () => clearTimeout(t)
  }, [])

  const showFact = useCallback((d) => setFact(d), [])
  const closeFact = useCallback(() => setFact(null), [])

  const showMessage = useCallback(() => {
    setMessage(UNIVERSE_MESSAGES[Math.floor(Math.random() * UNIVERSE_MESSAGES.length)])
  }, [])
  const closeMessage = useCallback(() => setMessage(null), [])

  const currentIdx = SECTION_IDS.indexOf(activeSection)
  const progress = Math.max(0, currentIdx / (SECTION_IDS.length - 1))

  return (
    <>
      <StarField count={500} mouseParallax />
      <ProgressBar progress={progress} />
      <NavDots active={activeSection} onNavigate={handleNavigate} />

      <MusicPlayer
        playing={playing}
        onToggle={toggleMusic}
        volume={volume}
        onVolumeChange={setVolume}
        activeSection={activeSection}
        getAudioData={getAudioData}
        audioProgress={audioProgress}
      />

      <div
        className={`fade-overlay ${fadePhase === 'dark' ? 'fade-dark' : ''} ${fadePhase === 'light' ? 'fade-light' : ''}`}
        style={{ '--fade-out': `${FADE_OUT}ms`, '--fade-in': `${FADE_IN}ms` }}
        aria-hidden="true"
      />

      <main className={`section-wrapper ${fadeState}`}>
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
            <Ending onMessage={showMessage} onRestart={() => handleNavigate('intro')} />
          )}
        </Suspense>
      </main>

      <FactPopup fact={fact} onClose={closeFact} />
      <MessageBox message={message} onClose={closeMessage} />
    </>
  )
}
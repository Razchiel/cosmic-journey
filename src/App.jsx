import { useState, useCallback } from 'react'

// Components
import StarField from './components/StarField.jsx'
import NavDots from './components/NavDots.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import FactPopup from './components/FactPopup.jsx'
import MessageBox from './components/MessageBox.jsx'

// Sections
import Intro from './sections/Intro.jsx'
import SolarSystem from './sections/SolarSystem.jsx'
import Phenomena from './sections/Phenomena.jsx'
import DeepSpace from './sections/DeepSpace.jsx'
import Ending from './sections/Ending.jsx'

// Hooks
import { useScrollProgress, useActiveSection } from './hooks/useScroll.js'
import { useAmbientAudio } from './hooks/useAudio.js'

// Data
import { UNIVERSE_MESSAGES } from './data/index.js'

const SECTION_IDS = ['intro', 'solar', 'phenomena', 'deepspace', 'ending']

export default function App() {
  const [fact, setFact] = useState(null)
  const [message, setMessage] = useState(null)

  const { progress } = useScrollProgress()
  const activeSection = useActiveSection(SECTION_IDS)
  const { playing, toggleMusic, volume, setVolume } = useAmbientAudio()

  const showFact = useCallback((factData) => {
    setFact(factData)
  }, [])

  const closeFact = useCallback(() => {
    setFact(null)
  }, [])

  const showMessage = useCallback(() => {
    const msg = UNIVERSE_MESSAGES[Math.floor(Math.random() * UNIVERSE_MESSAGES.length)]
    setMessage(msg)
  }, [])

  const closeMessage = useCallback(() => {
    setMessage(null)
  }, [])

  return (
    <>
      {/* Persistent UI */}
      <StarField count={380} mouseParallax />
      <ProgressBar progress={progress} />
      <NavDots active={activeSection} />
      <MusicPlayer
        playing={playing}
        onToggle={toggleMusic}
        volume={volume}
        onVolumeChange={setVolume}
      />

      {/* Main journey sections */}
      <main>
        <Intro />
        <SolarSystem onFact={showFact} />
        <Phenomena onFact={showFact} />
        <DeepSpace />
        <Ending onMessage={showMessage} />
      </main>

      {/* Overlays */}
      <FactPopup fact={fact} onClose={closeFact} />
      <MessageBox message={message} onClose={closeMessage} />
    </>
  )
}

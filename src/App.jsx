import { useState, useCallback, useEffect } from 'react'

import StarField   from './components/StarField.jsx'
import NavDots     from './components/NavDots.jsx'
import MusicPlayer from './components/MusicPlayer.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import FactPopup   from './components/FactPopup.jsx'
import MessageBox  from './components/MessageBox.jsx'

import Intro       from './sections/Intro.jsx'
import SolarSystem from './sections/SolarSystem.jsx'
import Phenomena   from './sections/Phenomena.jsx'
import DeepSpace   from './sections/DeepSpace.jsx'
import Ending      from './sections/Ending.jsx'

import { useScrollProgress, useActiveSection } from './hooks/useScroll.js'
import { useAmbientAudio } from './hooks/useAudio.js'
import { UNIVERSE_MESSAGES } from './data/index.js'

const SECTION_IDS = ['intro', 'solar', 'phenomena', 'deepspace', 'ending']

export default function App() {
  const [fact,    setFact]    = useState(null)
  const [message, setMessage] = useState(null)

  const { progress }    = useScrollProgress()
  const activeSection   = useActiveSection(SECTION_IDS)
  const { playing, toggleMusic, volume, setVolume, changeSection } = useAmbientAudio()

  // Ganti musik saat section berubah — dependency lengkap agar tidak stale
  useEffect(() => {
    changeSection(activeSection)
  }, [activeSection, changeSection])

  const showFact    = useCallback((d) => setFact(d), [])
  const closeFact   = useCallback(() => setFact(null), [])
  const showMessage = useCallback(() => {
    setMessage(UNIVERSE_MESSAGES[Math.floor(Math.random() * UNIVERSE_MESSAGES.length)])
  }, [])
  const closeMessage = useCallback(() => setMessage(null), [])

  return (
    <>
      <StarField />

      <div style={{ position: "relative", zIndex: 1 }}>
        <ProgressBar progress={progress} />
        <NavDots active={activeSection} />
        <MusicPlayer
          playing={playing}
          onToggle={toggleMusic}
          volume={volume}
          onVolumeChange={setVolume}
        />

        <main>
          <Intro />
          <SolarSystem onFact={showFact} />
          <Phenomena onFact={showFact} />
          <DeepSpace />
          <Ending onMessage={showMessage} />
        </main>

        <FactPopup fact={fact} onClose={closeFact} />
        <MessageBox message={message} onClose={closeMessage} />
      </div>
    </>
  )
}

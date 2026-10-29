import { useState, useRef, useMemo, useEffect, Suspense, memo } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Html, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { PLANETS } from '../data/index.js'
import { sfx } from '../hooks/useSfx.js'
import styles from './SolarSystem.module.css'

// ── 1. GENERATOR TEKSTUR GLOBAL (Di-cache untuk performa tinggi) ───────

// A. Tekstur Cincin Garis-garis (Saturnus/Uranus)
function createRingAlphaMap() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024; canvas.height = 1024
  const ctx = canvas.getContext('2d')

  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, 1024, 1024)

  for (let i = 0; i < 70; i++) {
    ctx.beginPath()
    const r = 290 + (i * 3.1)
    ctx.arc(512, 512, r, 0, Math.PI * 2)
    ctx.setLineDash([Math.random() * 200 + 30, Math.random() * 15])
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.9 + 0.1})`
    ctx.lineWidth = Math.random() * 3 + 0.5
    ctx.stroke()
  }
  return new THREE.CanvasTexture(canvas)
}

// B. Tekstur Glow Atmosfer (Untuk Sprite Belakang Planet)
function createGlowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 256; canvas.height = 256
  const ctx = canvas.getContext('2d')
  const center = 128
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)

  // Mereplika persis CSS: radial-gradient(circle, transparent 45%, rgba(...) 65%, rgba(...) 80%, transparent 100%)
  gradient.addColorStop(0.0, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.45, 'rgba(255, 255, 255, 0)')
  gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.25)')
  gradient.addColorStop(0.80, 'rgba(255, 255, 255, 0.5)')
  gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

// C. Tekstur Glow Matahari (gradien penuh, hangat)
function createSunTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 512
  const ctx = canvas.getContext('2d')
  const c = 256
  const g = ctx.createRadialGradient(c, c, 0, c, c, c)
  g.addColorStop(0.00, 'rgba(255, 255, 240, 1)')
  g.addColorStop(0.10, 'rgba(255, 236, 170, 0.95)')
  g.addColorStop(0.28, 'rgba(255, 176, 72, 0.55)')
  g.addColorStop(0.55, 'rgba(255, 112, 40, 0.16)')
  g.addColorStop(1.00, 'rgba(255, 80, 20, 0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 512, 512)
  return new THREE.CanvasTexture(canvas)
}

const sharedRingTexture = createRingAlphaMap()
const sharedGlowTexture = createGlowTexture()
const sharedSunTexture = createSunTexture()

// ── Fungsi Warna Atmosfer Ceria (Vivid) ────────────────────────────────
function getVibrantAtmosphere(planetName, defaultColor) {
  const vividColors = {
    'Mercury': '#ffbbaa',
    'Venus': '#ffcc55',
    'Earth': '#44baff',
    'Mars': '#ff5533',
    'Jupiter': '#ffaa66',
    'Saturn': '#ffdd77',
    'Uranus': '#00eeff',
    'Neptune': '#3366ff'
  }
  return vividColors[planetName] || defaultColor
}

// ── 2. Komponen Khusus Bumi (Sesuai Section Intro) ─────────────────────
function EarthMesh({ radius }) {
  const colorMap = useLoader(THREE.TextureLoader, '/images/earth.jpg')

  useEffect(() => {
    if (colorMap) {
      colorMap.wrapS = THREE.RepeatWrapping;
      colorMap.wrapT = THREE.RepeatWrapping;
      colorMap.anisotropy = 16;
    }
  }, [colorMap]);

  return (
    <mesh castShadow receiveShadow>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial
        map={colorMap}
        roughness={0.8}
        metalness={0.2}
        alphaTest={0.5}
      />
    </mesh>
  )
}

// ── 2b. Matahari: inti terang + corona yang berdenyut di tepi kiri layar ─
function Sun() {
  const { size } = useThree()
  const isMobile = size.width < 768
  const x = isMobile ? -15 : -26
  const r = isMobile ? 5 : 6.5

  const innerGlow = useRef()
  const outerGlow = useRef()
  const corona = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (innerGlow.current) innerGlow.current.scale.setScalar(r * 5 * (1 + Math.sin(t * 0.8) * 0.04))
    if (outerGlow.current) outerGlow.current.scale.setScalar(r * 10 * (1 + Math.sin(t * 0.5 + 1) * 0.05))
    if (corona.current) {
      corona.current.material.rotation = t * 0.04
      corona.current.scale.setScalar(r * 3.4 * (1 + Math.sin(t * 1.3) * 0.03))
    }
  })

  const spriteProps = {
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }

  // z = -1 agar planet (z = 0) menutupi glow, bukan tersapu olehnya
  return (
    <group position={[x, 0, -1]}>
      <sprite ref={outerGlow}>
        <spriteMaterial map={sharedSunTexture} color="#ff7a30" opacity={0.5} {...spriteProps} />
      </sprite>
      <sprite ref={innerGlow}>
        <spriteMaterial map={sharedSunTexture} color="#ffb347" opacity={0.85} {...spriteProps} />
      </sprite>
      <sprite ref={corona}>
        <spriteMaterial map={sharedGlowTexture} color="#ffd9a0" opacity={0.7} {...spriteProps} />
      </sprite>
      <mesh>
        <sphereGeometry args={[r, 48, 48]} />
        <meshBasicMaterial color="#ffe9b8" />
      </mesh>
      <mesh>
        <sphereGeometry args={[r * 1.05, 48, 48]} />
        <meshBasicMaterial color="#ffa040" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
      </mesh>
    </group>
  )
}

// ── 3. Kamera Sinematik & Interaktivitas 360° (OrbitControls) ──────────
function CameraRig({ focusedPos }) {
  const { size, camera } = useThree()
  const isMobile = size.width < 768
  const overviewZ = isMobile ? 34 : 26

  const controlsRef = useRef()
  const [transitioning, setTransitioning] = useState(false)
  const prevFocusedRef = useRef(null)

  useEffect(() => {
    if (focusedPos !== prevFocusedRef.current) {
      setTransitioning(true)
      const timer = setTimeout(() => {
        setTransitioning(false)
      }, 700)
      prevFocusedRef.current = focusedPos
      return () => clearTimeout(timer)
    }
  }, [focusedPos])

  useFrame(() => {
    // Mode Overview: Lerp kamera kembali ke posisi tengah
    if (!focusedPos) {
      camera.position.lerp(new THREE.Vector3(0, 0, overviewZ), 0.05)
      const currentLookAt = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .add(camera.position)
      currentLookAt.lerp(new THREE.Vector3(0, 0, 0), 0.05)
      camera.lookAt(currentLookAt)
      return
    }

    // Mode Transisi Zoom-in ke Planet
    if (transitioning) {
      const targetPos = new THREE.Vector3(focusedPos.x, focusedPos.y, 8)
      camera.position.lerp(targetPos, 0.08)

      const lookTarget = new THREE.Vector3(focusedPos.x, focusedPos.y, 0)
      const currentLookAt = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .add(camera.position)
      currentLookAt.lerp(lookTarget, 0.08)
      camera.lookAt(currentLookAt)

      if (controlsRef.current) {
        controlsRef.current.target.set(focusedPos.x, focusedPos.y, 0)
      }
    }
  })

  return focusedPos ? (
    <OrbitControls
      ref={controlsRef}
      enabled={!transitioning}
      target={[focusedPos.x, focusedPos.y, 0]}
      enablePan={false}
      enableZoom={true}
      minDistance={3.5}
      maxDistance={12}
      rotateSpeed={0.8}
      enableDamping={true}
      dampingFactor={0.06}
    />
  ) : null
}

// ── 4. Komponen 3D Planet (Adaptif Mobile 2x4 & Desktop 4x2) ────────
function Planet3D({ data, index, isFocused, onClick }) {
  const planetGroup = useRef()
  const ringMesh = useRef()
  const glowSprite = useRef()
  const { size } = useThree()
  const isMobile = size.width < 768

  // Responsif: 2 kolom di mobile agar pas sempurna di layar potret HP, 4 kolom di desktop
  const col = isMobile ? (index % 2) : (index % 4)
  const row = isMobile ? Math.floor(index / 2) : Math.floor(index / 4)
  const spacingX = isMobile ? 4.2 : 5.0
  const spacingY = isMobile ? 4.0 : 6.0   // sebelumnya 4.4
  const posX = isMobile ? (col - 0.5) * spacingX : (col - 1.5) * spacingX
  const posY = isMobile ? (1.5 - row) * spacingY - 0.4 : (row === 0 ? (spacingY / 2) : -(spacingY / 2))

  const baseSize = parseInt(data.size) || 40
  const radius = baseSize / 65

  const atmosphereColor = getVibrantAtmosphere(data.name, data.color)

  useFrame((state, delta) => {
    if (planetGroup.current) planetGroup.current.rotation.y += 0.3 * delta
    if (ringMesh.current) ringMesh.current.rotation.z -= 0.4 * delta

    if (glowSprite.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * (Math.PI / 2)) * 0.05
      glowSprite.current.scale.set(radius * 3.5 * scale, radius * 3.5 * scale, 1)
    }
  })

  return (
    <group position={[posX, posY, 0]}>

      {/* 3D SPRITE GLOW */}
      <sprite ref={glowSprite}>
        <spriteMaterial
          map={sharedGlowTexture}
          color={atmosphereColor}
          transparent={true}
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <group rotation={[Math.PI * 0.12, 0, Math.PI * 0.08]} ref={planetGroup}>

        {/* Lapis 1: INTI GELAP (Optimasi segmen) */}
        <mesh>
          <sphereGeometry args={[radius * 0.98, 32, 32]} />
          <meshBasicMaterial color="#020813" />
        </mesh>

        {/* Lapis 2: PERMUKAAN PLANET (Solid Polos Matte Doff Elegan) */}
        <group
          onClick={(e) => {
            e.stopPropagation()
            onClick({ x: posX, y: posY })
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          {data.name === 'Earth' ? (
            <EarthMesh radius={radius} />
          ) : (
            <mesh castShadow receiveShadow>
              <sphereGeometry args={[radius, 48, 48]} />
              <meshStandardMaterial
                color={data.color || '#cccccc'}
                roughness={0.7}
                metalness={0.05}
                alphaTest={0.5}
              />
            </mesh>
          )}
        </group>

        {/* Lapis 3: KACA ATMOSFER VIBRANT (Colorful & Transparan) */}
        <mesh>
          <sphereGeometry args={[radius * 1.035, 36, 36]} />
          <meshBasicMaterial
            color={atmosphereColor}
            transparent={true}
            opacity={0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>

        {/* Lapis 4: GARIS BORDER CINCIN */}
        <mesh>
          <ringGeometry args={[radius * 1.15, radius * 1.18, 48]} />
          <meshBasicMaterial
            color={atmosphereColor}
            transparent={true}
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Lapis 5: CINCIN SATURNUS/URANUS */}
        {data.rings && (
          <mesh
            ref={ringMesh}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
            receiveShadow
            onClick={(e) => {
              e.stopPropagation()
              onClick({ x: posX, y: posY })
            }}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
          >
            <ringGeometry args={[radius * 1.35, radius * 2.3, 64]} />
            <meshStandardMaterial
              color={data.color || '#ead6b8'}
              side={THREE.DoubleSide}
              transparent={true}
              alphaMap={sharedRingTexture}
              opacity={0.85}
              roughness={0.6}
            />
          </mesh>
        )}
      </group>

      <Html position={[0, -radius - 1.2, 0]} center style={{ pointerEvents: 'none' }}>
        <div className={styles.planetLabel} style={{ opacity: isFocused ? 0 : 1 }}>
          {data.name}
        </div>
      </Html>
    </group>
  )
}

// ── 5. Komponen Utama Solar System ─────────────────────────────────────
function SolarSystem({ onFact, onNext }) {
  const [focusedPos, setFocusedPos] = useState(null)
  const [activePlanet, setActivePlanet] = useState(null)

  const handlePlanetClick = (planet, pos) => {
    sfx.chime(PLANETS.indexOf(planet))
    setFocusedPos(pos)
    setActivePlanet(planet.id)
    onFact({
      title: planet.name,
      subtitle: `${planet.type} · ${planet.moons} moon${planet.moons !== 1 ? 's' : ''}`,
      text: planet.fact,
      extra: `Orbital period: ${planet.orbit}`,
    })
  }

  const handleBackgroundClick = () => {
    if (focusedPos) sfx.close()
    setFocusedPos(null)
    setActivePlanet(null)
    onFact(null)
  }

  // Esc: kembali ke overview
  useEffect(() => {
    if (!focusedPos) return
    const onKey = (e) => { if (e.key === 'Escape') handleBackgroundClick() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusedPos])

  return (
    <section id="solar" className={`cosmic-section ${styles.solar}`}>
      <div className="noise-overlay" />
      <div className={styles.bgGradient} />

      <div className={`${styles.header} ${focusedPos !== null ? styles.headerHidden : ''}`}>
        <p className="t-label">Stage I: 1 AU from Earth</p>
        <h2 className={styles.title}>The Solar System</h2>
        <p className={styles.hint}>Tap or click a planet to learn more</p>
      </div>

      <button
        className={`${styles.backBtn} ${focusedPos !== null ? styles.backBtnVisible : ''}`}
        onClick={handleBackgroundClick}
      >
        ← Overview
      </button>

      <div className={`${styles.orbitHint} ${focusedPos !== null ? styles.orbitHintVisible : ''}`}>
        <span>✦ Drag to rotate 360° · Scroll to zoom</span>
      </div>

      <div className={styles.canvasWrap}>
        <Canvas
          shadows
          dpr={[1, 1.5]}
          camera={{ position: [0, 0, 26], fov: 40 }}
          onPointerMissed={handleBackgroundClick}
        >
          <ambientLight intensity={0.05} color="#ffffff" />

          <directionalLight
            position={[-20, 6, 4]}
            intensity={3.5}
            color="#fff8f0"
            castShadow
            shadow-bias={-0.0005}
          >
            <orthographicCamera attach="shadow-camera" args={[-30, 30, 15, -15]} />
          </directionalLight>

          <Sun />

          <Suspense fallback={null}>
            {PLANETS.map((planet, i) => (
              <Planet3D
                key={planet.id}
                data={planet}
                index={i}
                isFocused={activePlanet === planet.id}
                onClick={(pos) => handlePlanetClick(planet, pos)}
              />
            ))}
          </Suspense>

          <CameraRig focusedPos={focusedPos} />
        </Canvas>
      </div>

      <div className={`${styles.nextNav} ${focusedPos !== null ? styles.nextNavHidden : ''}`}>
        <button className={styles.nextBtn} onClick={onNext}>
          Explore Cosmic Phenomena <span className={styles.arrow}>↓</span>
        </button>
      </div>
    </section>
  )
}

export default memo(SolarSystem)
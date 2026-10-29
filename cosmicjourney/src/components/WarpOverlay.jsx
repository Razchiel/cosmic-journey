import { useRef, memo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import styles from './WarpOverlay.module.css'

// ── Parameter efek warp (sudah di-tone down dari versi awal) ──────────
// Versi awal: 300 bintang, kecepatan x8, garis memanjang hingga 9x, opacity 0.6
export const WARP_RAMP_MS = 1400   // lama akselerasi sampai kecepatan maksimum
const COUNT = 160
const MAX_SPEED = 3.5
const STRETCH = 0.45
const OPACITY = 0.45

function FallingStars({ startTime }) {
  const meshRef = useRef()
  const dummy = useRef(new THREE.Object3D())

  const particles = useRef(
    Array.from({ length: COUNT }).map(() => ({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 20,
      z: Math.random() * -10,
      speed: Math.random() * 0.5 + 0.5,
    }))
  )

  useFrame((_, delta) => {
    if (!meshRef.current) return

    const elapsed = Date.now() - startTime
    const speedMult = Math.min(elapsed / WARP_RAMP_MS, 1) * MAX_SPEED

    particles.current.forEach((p, i) => {
      p.z += p.speed * speedMult * delta * 60
      if (p.z > 5) {
        p.z = -15
        p.x = (Math.random() - 0.5) * 20
        p.y = (Math.random() - 0.5) * 20
      }
      dummy.current.position.set(p.x, p.y, p.z)
      dummy.current.scale.set(1, 1, 1 + speedMult * STRETCH)
      dummy.current.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.current.matrix)
    })
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, COUNT]}>
      <boxGeometry args={[0.012, 0.4, 0.012]} />
      <meshBasicMaterial color="#cceeff" transparent opacity={OPACITY} />
    </instancedMesh>
  )
}

/**
 * Lapisan bintang warp, dipakai oleh semua tombol perpindahan section.
 * Berada di level App (bukan di dalam section) supaya tidak terputus
 * saat section diganti, lalu memudar lewat kelas `.arrive`.
 */
function WarpOverlay({ startTime, arriving }) {
  return (
    <div className={`${styles.overlay} ${arriving ? styles.arrive : ''}`}>
      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 10], fov: 45 }}>
        <FallingStars startTime={startTime} />
      </Canvas>
    </div>
  )
}

export default memo(WarpOverlay)

import { useEffect, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { BENCH_Y } from '../constants'
import { BottleModel } from './Glassware'

/** Image-based lighting without downloading anything: gives glass real reflections. */
export function RoomEnv() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const env = new RoomEnvironment()
    const tex = pm.fromScene(env, 0.04).texture
    scene.environment = tex
    return () => {
      scene.environment = null
      tex.dispose()
      pm.dispose()
    }
  }, [gl, scene])
  return null
}

function tileTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const x = c.getContext('2d')!
  x.fillStyle = '#e8eef1'
  x.fillRect(0, 0, 512, 512)
  x.strokeStyle = '#c3cfd5'
  x.lineWidth = 3
  for (let i = 0; i <= 512; i += 64) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke()
    x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke()
  }
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(6, 1.5)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

const SHELF = [
  { label: 'Na₂CO₃', sub: 'দ্রবণ', color: '#e8e4d0', x: -3.2 },
  { label: 'H₂SO₄', sub: 'লঘু', color: '#e9e2c4', x: -1.6 },
  { label: 'KMnO₄', sub: 'দ্রবণ', color: '#8a2a63', x: 0 },
  { label: 'AgNO₃', sub: 'দ্রবণ', color: '#e3e8ea', x: 1.6 },
  { label: 'FeCl₃', sub: 'দ্রবণ', color: '#c98a2b', x: 3.2 },
]

export function Room() {
  const wallTex = useMemo(tileTexture, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#c4ced4" roughness={0.6} />
      </mesh>
      <mesh position={[0, 3, -1.8]} receiveShadow>
        <boxGeometry args={[24, 6, 0.2]} />
        <meshStandardMaterial map={wallTex} roughness={0.35} />
      </mesh>
      {/* bench: cabinet + epoxy top */}
      <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
        <boxGeometry args={[12, 0.88, 3.1]} />
        <meshStandardMaterial color="#38454e" roughness={0.7} />
      </mesh>
      <mesh position={[0, BENCH_Y - 0.06, 0]} receiveShadow>
        <boxGeometry args={[12.3, 0.12, 3.3]} />
        <meshStandardMaterial color="#2b363d" roughness={0.28} metalness={0.15} />
      </mesh>
      {/* shelf with decorative bottles */}
      <mesh position={[0, 2.7, -1.55]} castShadow receiveShadow>
        <boxGeometry args={[8.4, 0.08, 0.5]} />
        <meshStandardMaterial color="#b7a283" roughness={0.6} />
      </mesh>
      {SHELF.map((b) => (
        <group key={b.label} position={[b.x, 2.74, -1.55]} scale={0.8}>
          <BottleModel label={b.label} sub={b.sub} color={b.color} level={0.9} />
        </group>
      ))}
      <ContactShadows position={[0, BENCH_Y + 0.002, 0]} opacity={0.45} scale={14} blur={2.2} far={1.6} resolution={512} />
    </group>
  )
}

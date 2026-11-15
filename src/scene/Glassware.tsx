import { useMemo } from 'react'
import * as THREE from 'three'
import { makeLabelTexture } from '../lib/labels'

const V = (x: number, y: number) => new THREE.Vector2(x, y)

function arc(cx: number, cy: number, r: number, a0: number, a1: number, n = 6): THREE.Vector2[] {
  const pts: THREE.Vector2[] = []
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    pts.push(V(cx + r * Math.cos(a), cy + r * Math.sin(a)))
  }
  return pts
}

export const BEAKER = { Rb: 0.465, Rt: 0.5, H: 0.9, t: 0.028 }
const beakerR = (y: number) => BEAKER.Rb + ((BEAKER.Rt - BEAKER.Rb) * y) / BEAKER.H

export function beakerProfile(): THREE.Vector2[] {
  const { Rb, Rt, H, t } = BEAKER
  return [
    V(0, 0),
    ...arc(Rb - 0.05, 0.05, 0.05, -Math.PI / 2, 0),
    V(Rt, H - 0.015),
    ...arc(Rt - t / 2, H - 0.015, t / 2, 0, Math.PI),
    ...arc(Rb - t - 0.03, t + 0.03, 0.03, 0, -Math.PI / 2),
    V(0, t),
  ]
}

export function GlassMaterial() {
  return (
    <meshPhysicalMaterial
      color="#f4fbff"
      transmission={1}
      thickness={0.08}
      roughness={0.03}
      ior={1.5}
      envMapIntensity={1.4}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  )
}

export function LabelBand({ radius, y, width, height, a, b }: { radius: number; y: number; width: number; height: number; a: string; b: string }) {
  const tex = useMemo(() => makeLabelTexture(a, b), [a, b])
  const theta = width / radius
  return (
    <mesh position-y={y}>
      <cylinderGeometry args={[radius, radius, height, 40, 1, true, -theta / 2, theta]} />
      <meshStandardMaterial map={tex} roughness={0.55} />
    </mesh>
  )
}

/** Thick-walled beaker with rounded rim and graduation marks. */
export function Beaker({ marks = true }: { marks?: boolean }) {
  const profile = useMemo(beakerProfile, [])
  const levels = [50, 100, 150, 200]
  return (
    <group>
      <mesh renderOrder={3}>
        <latheGeometry args={[profile, 64]} />
        <GlassMaterial />
      </mesh>
      {marks &&
        levels.map((ml) => {
          const y = 0.04 + (ml / 250) * 0.8
          return (
            <mesh key={ml} position-y={y} rotation={[Math.PI / 2, 0, Math.PI / 3]}>
              <torusGeometry args={[beakerR(y) + 0.003, 0.003, 6, 24, Math.PI / 3]} />
              <meshBasicMaterial color="#2c4656" />
            </mesh>
          )
        })}
    </group>
  )
}

const bottleProfile = (): THREE.Vector2[] => [
  V(0, 0), V(0.24, 0), V(0.285, 0.012), V(0.3, 0.05), V(0.3, 0.62), V(0.285, 0.74), V(0.22, 0.85), V(0.14, 0.93),
  V(0.115, 0.99), V(0.115, 1.12), V(0.13, 1.14), V(0.13, 1.16),
  V(0.1, 1.16), V(0.1, 1.12), V(0.1, 0.99), V(0.125, 0.93), V(0.2, 0.86), V(0.265, 0.75), V(0.275, 0.62), V(0.275, 0.07),
  V(0.25, 0.05), V(0, 0.05),
]

/** Reagent bottle: glass, liquid, label. Used for interactive and decorative bottles. */
export function BottleModel({
  label, sub, color, liquidRef, capRef, showCap = true, level = 1,
}: {
  label: string
  sub: string
  color: string
  liquidRef?: React.RefObject<THREE.Mesh>
  capRef?: React.RefObject<THREE.Mesh>
  showCap?: boolean
  level?: number
}) {
  const profile = useMemo(bottleProfile, [])
  const liquidGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.27, 0.27, 0.57, 40)
    g.translate(0, 0.285, 0)
    return g
  }, [])
  return (
    <group>
      <mesh renderOrder={3}>
        <latheGeometry args={[profile, 48]} />
        <GlassMaterial />
      </mesh>
      <mesh ref={liquidRef} geometry={liquidGeo} position-y={0.05} scale={[1, level, 1]} renderOrder={1}>
        <meshPhysicalMaterial color={color} transparent opacity={0.88} roughness={0.12} clearcoat={1} />
      </mesh>
      <LabelBand radius={0.305} y={0.34} width={0.55} height={0.34} a={label} b={sub} />
      {showCap && (
        <mesh ref={capRef} position-y={1.21} castShadow>
          <cylinderGeometry args={[0.145, 0.145, 0.1, 28]} />
          <meshStandardMaterial color="#1e2a33" roughness={0.55} />
        </mesh>
      )}
    </group>
  )
}

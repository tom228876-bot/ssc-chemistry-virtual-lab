import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BENCH_Y, CHEM, type ChemKey } from '../constants'
import { useLab } from '../store'
import { react, totalVolume } from '../lib/chemistry'
import { beginDrag, drag, hover, resolveOverlap, solids, useSolid } from '../lib/drag'
import { clamp, smooth } from '../lib/math'
import { Beaker, BottleModel, LabelBand } from './Glassware'

/** shared state between a pouring bottle and the visual stream */
const pour = { until: 0, from: new THREE.Vector3(), to: new THREE.Vector3(), color: new THREE.Color('#fff') }

function Bottle({ chem, x, z }: { chem: ChemKey; x: number; z: number }) {
  const c = CHEM[chem]
  const group = useRef<THREE.Group>(null!)
  const cap = useRef<THREE.Mesh>(null!)
  const liquid = useRef<THREE.Mesh>(null!)
  const mouth = useRef<THREE.Object3D>(null!)
  const st = useRef({ tilt: 0, lift: 0, poured: 0, dir: new THREE.Vector3(1, 0, 0) })
  const tmp = useMemo(() => ({ m: new THREE.Vector3(), axis: new THREE.Vector3() }), [])
  useSolid(group, 'bottle', 0.32)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = group.current
    const s = st.current
    const dragging = drag.obj === g
    const vessel = solids.find((o) => o.userData.kind === 'vessel')
    let tiltT = 0
    let liftT = 0
    if (dragging) {
      liftT = 0.25
      if (vessel) {
        const dx = vessel.position.x - g.position.x
        const dz = vessel.position.z - g.position.z
        const dist = Math.hypot(dx, dz) || 0.001
        s.dir.set(dx / dist, 0, dz / dist)
        const k = smooth(1.9, 1.15, dist)
        tiltT = 1.2 * k
        liftT = 0.25 + 0.7 * k
      }
    }
    const k = 1 - Math.exp(-dt * 9)
    s.tilt += (tiltT - s.tilt) * k
    s.lift += (liftT - s.lift) * k
    g.position.y = BENCH_Y + s.lift
    tmp.axis.set(s.dir.z, 0, -s.dir.x)
    g.quaternion.setFromAxisAngle(tmp.axis, s.tilt)
    cap.current.visible = !dragging

    if (dragging && vessel && s.tilt > 0.8) {
      mouth.current.getWorldPosition(tmp.m)
      const hd = Math.hypot(tmp.m.x - vessel.position.x, tmp.m.z - vessel.position.z)
      const lab = useLab.getState()
      const V = totalVolume(lab.contents)
      if (hd < 0.5 && V < 249.9) {
        const amt = Math.min(c.rate * dt * clamp((s.tilt - 0.8) / 0.4, 0, 1), 250 - V)
        lab.addChem(chem, amt)
        s.poured += amt
        const surf = BENCH_Y + 0.04 + Math.min(0.8, ((V + amt) / 250) * 0.8)
        pour.from.copy(tmp.m)
        pour.to.set(tmp.m.x + (vessel.position.x - tmp.m.x) * 0.35, surf, tmp.m.z + (vessel.position.z - tmp.m.z) * 0.35)
        pour.color.set(c.color)
        pour.until = performance.now() + 80
      }
    }
    liquid.current.scale.y = Math.max(0.001, 1 - s.poured / 450)
  })

  return (
    <group
      ref={group}
      position={[x, BENCH_Y, z]}
      onPointerDown={(e) => beginDrag(e, group.current, () => resolveOverlap(group.current))}
      {...hover}
    >
      <BottleModel label={c.label} sub={c.sub} color={c.color} liquidRef={liquid} capRef={cap} />
      <object3D ref={mouth} position={[0, 1.17, 0]} />
    </group>
  )
}

function PourStream() {
  const mesh = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!)
  useFrame(() => {
    const m = mesh.current
    if (performance.now() > pour.until) {
      m.visible = false
      return
    }
    m.visible = true
    const a = pour.from
    const b = pour.to
    const ctrl = new THREE.Vector3(a.x + (b.x - a.x) * 0.7, a.y, a.z + (b.z - a.z) * 0.7)
    const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a.clone(), ctrl, b.clone()), 14, 0.018, 8, false)
    m.geometry.dispose()
    m.geometry = geo
    mat.current.color.copy(pour.color)
  })
  return (
    <mesh ref={mesh} visible={false}>
      <meshPhysicalMaterial ref={mat} transparent opacity={0.85} roughness={0.05} clearcoat={1} />
    </mesh>
  )
}

function Vessel() {
  const group = useRef<THREE.Group>(null!)
  const liquid = useRef<THREE.Mesh>(null!)
  const ppt = useRef<THREE.Mesh>(null!)
  const cloud = useRef(0)
  const prevPpt = useRef(0)
  useSolid(group, 'vessel', 0.55)

  const liquidGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.435, 0.425, 1, 48)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const pptGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.41, 0.405, 1, 32)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  const turbid = useMemo(() => new THREE.Color('#6fa3e8'), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const g = group.current
    const target = drag.obj === g ? BENCH_Y + 0.12 : BENCH_Y
    g.position.y += (target - g.position.y) * (1 - Math.exp(-dt * 12))

    const R = react(useLab.getState().contents)
    const h = Math.min(0.8, (R.V / 250) * 0.8)
    liquid.current.visible = R.V > 0.05
    liquid.current.scale.set(1, Math.max(h, 0.001), 1)

    cloud.current = Math.min(1, cloud.current + Math.max(0, R.ppt - prevPpt.current) * 1.2)
    prevPpt.current = R.ppt
    cloud.current *= Math.exp(-dt * 0.25)
    const mat = liquid.current.material as THREE.MeshPhysicalMaterial
    mat.color.copy(R.color).lerp(turbid, cloud.current * 0.8)
    mat.opacity = 0.72 + cloud.current * 0.2

    const ph = Math.min(h, Math.min(0.22, 0.02 + R.ppt * 0.12))
    ppt.current.visible = R.ppt > 0.01
    ppt.current.scale.set(1, Math.max(ph, 0.001), 1)
  })

  return (
    <group
      ref={group}
      position={[1.3, BENCH_Y, 0.2]}
      onPointerDown={(e) => beginDrag(e, group.current, () => resolveOverlap(group.current))}
      {...hover}
    >
      <mesh ref={ppt} geometry={pptGeo} position-y={0.035} visible={false}>
        <meshStandardMaterial color="#4f86e0" roughness={0.95} />
      </mesh>
      <mesh ref={liquid} geometry={liquidGeo} position-y={0.035} renderOrder={1} visible={false}>
        <meshPhysicalMaterial transparent opacity={0.75} roughness={0.05} clearcoat={1} ior={1.33} />
      </mesh>
      <Beaker />
      <LabelBand radius={0.49} y={0.5} width={0.34} height={0.2} a="বিকার" b="250 mL" />
    </group>
  )
}

export function ChemExperiment({ bottles }: { bottles: ChemKey[] }) {
  return (
    <>
      {bottles.map((k, i) => (
        <Bottle key={k} chem={k} x={-3.1 + i * 1.1} z={-0.55} />
      ))}
      <Vessel />
      <PourStream />
    </>
  )
}

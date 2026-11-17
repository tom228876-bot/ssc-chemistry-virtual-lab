import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BENCH_Y } from '../constants'
import { useLab } from '../store'
import { solids, useSolid } from '../lib/drag'
import { gasLink, limeMilk } from '../lib/gaslink'
import { Beaker, LabelBand } from './Glassware'

const B_POS = new THREE.Vector3(3.0, BENCH_Y, 0.2)
const B_SCALE = 0.72
const LIQ_H = 0.55
const WATER = new THREE.Color('#d9eef7')
const MILK = new THREE.Color('#f3f5f7')

/** Limewater beaker, cork and delivery tube. Gas released in the flask reaches it only while the cork is on. */
export function GasTest() {
  const bGroup = useRef<THREE.Group>(null!)
  const liquid = useRef<THREE.Mesh>(null!)
  const tube = useRef<THREE.Mesh>(null!)
  const cork = useRef<THREE.Mesh>(null!)
  const bub = useRef<THREE.InstancedMesh>(null!)
  const bubs = useRef(Array.from({ length: 32 }, () => ({ on: false, x: 0, z: 0, y: 0, v: 0, s: 0.02 })))
  const st = useRef({ x: 0, acc: 0, key: '' })
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmp = useMemo(() => ({ p0: new THREE.Vector3(), p3: new THREE.Vector3() }), [])
  const liquidGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.435, 0.425, 1, 40)
    g.translate(0, 0.5, 0)
    return g
  }, [])
  useSolid(bGroup, 'limewater', 0.38)

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const lab = useLab.getState()
    const s = st.current

    s.x += gasLink.flow
    gasLink.flow = 0
    if (Math.abs(s.x - lab.lime) > 0.005) lab.setLime(s.x)

    const m = limeMilk(s.x)
    const mat = liquid.current.material as THREE.MeshPhysicalMaterial
    mat.color.copy(WATER).lerp(MILK, m)
    mat.opacity = 0.72 + 0.26 * m

    const A = solids.find((o) => o.userData.kind === 'vessel')
    const corked = lab.corked && !!A
    cork.current.visible = corked
    tube.current.visible = corked
    if (A && corked) {
      cork.current.position.set(A.position.x, A.position.y + 0.98, A.position.z)
      const p0 = tmp.p0.set(A.position.x, A.position.y + 1.0, A.position.z)
      const p3 = tmp.p3.set(B_POS.x, BENCH_Y + 0.3, B_POS.z)
      const key = p0.x.toFixed(2) + ',' + p0.y.toFixed(2) + ',' + p0.z.toFixed(2)
      if (key !== s.key) {
        s.key = key
        const top = BENCH_Y + 1.55
        const curve = new THREE.CatmullRomCurve3(
          [p0.clone(), new THREE.Vector3(p0.x, top, p0.z), new THREE.Vector3((p0.x + p3.x) / 2, top + 0.1, (p0.z + p3.z) / 2), new THREE.Vector3(p3.x, top, p3.z), p3.clone()],
          false,
          'catmullrom',
          0.3,
        )
        tube.current.geometry.dispose()
        tube.current.geometry = new THREE.TubeGeometry(curve, 40, 0.025, 8, false)
      }
    }

    // bubbles rising through the limewater while gas flows
    s.acc += Math.min(30, gasLink.rate * 8) * dt
    const bs = bubs.current
    while (s.acc >= 1) {
      s.acc -= 1
      const i = bs.findIndex((b) => !b.on)
      if (i < 0) break
      bs[i] = { on: true, x: (Math.random() - 0.5) * 0.1, z: (Math.random() - 0.5) * 0.1, y: 0.4, v: 0.25 + Math.random() * 0.25, s: 0.015 + Math.random() * 0.02 }
    }
    for (let i = 0; i < bs.length; i++) {
      const b = bs[i]
      if (b.on) {
        b.y += b.v * dt
        if (b.y > LIQ_H) b.on = false
      }
      dummy.position.set(b.x, 0.035 + b.y, b.z)
      dummy.scale.setScalar(b.on ? b.s : 0)
      dummy.updateMatrix()
      bub.current.setMatrixAt(i, dummy.matrix)
    }
    bub.current.instanceMatrix.needsUpdate = true
  })

  return (
    <>
      <group ref={bGroup} position={B_POS} scale={B_SCALE}>
        <mesh ref={liquid} geometry={liquidGeo} position-y={0.035} scale={[1, LIQ_H, 1]} renderOrder={1}>
          <meshPhysicalMaterial transparent opacity={0.72} roughness={0.05} clearcoat={1} depthWrite={false} />
        </mesh>
        <instancedMesh ref={bub} args={[undefined, undefined, 32]} frustumCulled={false} renderOrder={2}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.7} roughness={0.1} depthWrite={false} />
        </instancedMesh>
        <Beaker />
        <LabelBand radius={0.49} y={0.5} width={0.5} height={0.3} a="চুনের পানি" b="Ca(OH)₂" />
      </group>
      <mesh ref={cork} visible={false} castShadow>
        <cylinderGeometry args={[0.42, 0.36, 0.16, 28]} />
        <meshStandardMaterial color="#b98650" roughness={0.9} />
      </mesh>
      <mesh ref={tube} visible={false}>
        <meshPhysicalMaterial color="#cfe8f5" transparent opacity={0.55} roughness={0.1} clearcoat={1} />
      </mesh>
    </>
  )
}

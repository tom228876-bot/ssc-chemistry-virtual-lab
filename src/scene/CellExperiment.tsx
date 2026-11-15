import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BENCH_Y } from '../constants'
import { useLab, type Side } from '../store'
import { beginDrag, drag, hover, resolveOverlap, useSolid } from '../lib/drag'
import { makeLabelTexture } from '../lib/labels'
import { Beaker, LabelBand } from './Glassware'

const BEAKER: Record<Side, THREE.Vector3> = {
  Zn: new THREE.Vector3(-1.6, BENCH_Y, 0.3),
  Cu: new THREE.Vector3(1.6, BENCH_Y, 0.3),
}
const TERM_L = new THREE.Vector3(-0.3, BENCH_Y + 0.64, -0.95)
const TERM_R = new THREE.Vector3(0.3, BENCH_Y + 0.64, -0.95)
const CU_BLUE = new THREE.Color('#2f8fe6')
const CU_PALE = new THREE.Color('#a9d3f2')

function CellBeaker({ side, color, a, b, liquidRef }: { side: Side; color: string; a: string; b: string; liquidRef?: React.RefObject<THREE.Mesh> }) {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.44, 0.43, 0.55, 40)
    g.translate(0, 0.275, 0)
    return g
  }, [])
  return (
    <group position={BEAKER[side]}>
      <mesh ref={liquidRef} geometry={geo} position-y={0.035} renderOrder={1}>
        <meshPhysicalMaterial color={color} transparent opacity={0.78} roughness={0.05} clearcoat={1} />
      </mesh>
      <Beaker />
      <LabelBand radius={0.49} y={0.62} width={0.6} height={0.375} a={a} b={b} />
    </group>
  )
}

function setWire(w: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
  const key = [a.x, a.y, a.z, b.x, b.y, b.z].map((v) => v.toFixed(2)).join()
  if (w.userData.key === key) return
  w.userData.key = key
  const mid = a.clone().add(b).multiplyScalar(0.5)
  mid.y = Math.max(a.y, b.y) + 0.45
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone())
  w.userData.curve = curve
  w.geometry.dispose()
  w.geometry = new THREE.TubeGeometry(curve, 24, 0.014, 6, false)
}

export function CellExperiment() {
  const zn = useRef<THREE.Group>(null!)
  const cu = useRef<THREE.Group>(null!)
  const bridge = useRef<THREE.Group>(null!)
  const znPlate = useRef<THREE.Mesh>(null!)
  const cuPlate = useRef<THREE.Mesh>(null!)
  const cuLiquid = useRef<THREE.Mesh>(null!)
  const wireA = useRef<THREE.Mesh>(null!)
  const wireB = useRef<THREE.Mesh>(null!)
  const eA = useRef<(THREE.Mesh | null)[]>([])
  const eB = useRef<(THREE.Mesh | null)[]>([])
  const burn = useRef(0)
  const timeRef = useRef(0)
  useSolid(zn, 'electrode', 0.2)
  useSolid(cu, 'electrode', 0.2)

  const active = useLab((s) => s.cell.zn === 'Zn' && s.cell.cu === 'Cu' && s.cell.bridge)

  const plateGeo = useMemo(() => {
    const g = new THREE.BoxGeometry(0.28, 1.4, 0.04)
    g.translate(0, 0.7, 0)
    return g
  }, [])
  const znTag = useMemo(() => makeLabelTexture('Zn', 'জিংক'), [])
  const cuTag = useMemo(() => makeLabelTexture('Cu', 'কপার'), [])
  const bridgeTag = useMemo(() => makeLabelTexture('সল্ট ব্রিজ', 'KNO₃ জেল'), [])

  const meter = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return { c, t }
  }, [])
  useEffect(() => {
    const x = meter.c.getContext('2d')!
    x.fillStyle = '#0d1f17'
    x.fillRect(0, 0, 256, 128)
    x.fillStyle = active ? '#7dffb0' : '#3b6b52'
    x.font = '700 64px ui-monospace,Menlo,monospace'
    x.textAlign = 'center'
    x.fillText((active ? 1.1 : 0).toFixed(2) + ' V', 128, 84)
    meter.t.needsUpdate = true
  }, [active, meter])

  const dropElectrode = (metal: 'zn' | 'cu', g: THREE.Group) => {
    let found: Side | null = null
    for (const s of ['Zn', 'Cu'] as Side[]) {
      if (Math.hypot(g.position.x - BEAKER[s].x, g.position.z - BEAKER[s].z) < 0.55) found = s
    }
    useLab.getState().setCell({ [metal]: found })
    if (!found) resolveOverlap(g)
  }

  const A = useMemo(() => new THREE.Vector3(), [])
  const B = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    timeRef.current += dt
    const k = 1 - Math.exp(-dt * 10)
    const cell = useLab.getState().cell
    const both = cell.zn !== null && cell.zn === cell.cu

    for (const [metal, ref] of [['zn', zn], ['cu', cu]] as const) {
      const g = ref.current
      const side = cell[metal]
      let yT = BENCH_Y
      if (drag.obj === g) yT = BENCH_Y + 0.6
      else if (side) {
        yT = BENCH_Y + 0.03
        const tx = BEAKER[side].x + (both ? (metal === 'zn' ? -0.16 : 0.16) : 0)
        g.position.x += (tx - g.position.x) * k
        g.position.z += (BEAKER[side].z - 0.2 - g.position.z) * k
      }
      g.position.y += (yT - g.position.y) * k
    }
    const br = bridge.current
    const brY = drag.obj === br ? BENCH_Y + 0.6 : cell.bridge ? BENCH_Y + 0.35 : BENCH_Y
    br.position.y += (brY - br.position.y) * k

    const act = cell.zn === 'Zn' && cell.cu === 'Cu' && cell.bridge
    if (act) burn.current += dt
    znPlate.current.scale.z = Math.max(0.4, 1 - burn.current / 300)
    cuPlate.current.scale.z = 1 + Math.min(2, burn.current / 50)
    const mat = cuLiquid.current.material as THREE.MeshPhysicalMaterial
    mat.color.copy(CU_BLUE).lerp(CU_PALE, Math.min(0.45, burn.current / 150))

    A.set(zn.current.position.x, zn.current.position.y + 1.42, zn.current.position.z)
    B.set(cu.current.position.x, cu.current.position.y + 1.42, cu.current.position.z)
    setWire(wireA.current, A, TERM_L)
    setWire(wireB.current, TERM_R, B)
    for (const [w, list] of [[wireA.current, eA.current], [wireB.current, eB.current]] as const) {
      const curve = w.userData.curve as THREE.QuadraticBezierCurve3 | undefined
      list.forEach((m, i) => {
        if (!m) return
        m.visible = act && !!curve
        if (act && curve) curve.getPoint((timeRef.current * 0.3 + i / list.length) % 1, m.position)
      })
    }
  })

  const electrode = (metal: 'zn' | 'cu', ref: React.RefObject<THREE.Group>, plate: React.RefObject<THREE.Mesh>, x: number, color: string, tag: THREE.Texture, name: string) => (
    <group
      ref={ref}
      position={[x, BENCH_Y, 0.9]}
      onPointerDown={(e) => {
        useLab.getState().setCell({ [metal]: null })
        beginDrag(e, ref.current!, () => dropElectrode(metal, ref.current!))
      }}
      {...hover}
    >
      <mesh ref={plate} geometry={plateGeo} castShadow>
        <meshStandardMaterial color={color} metalness={0.85} roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.2, 0.025]}>
        <planeGeometry args={[0.26, 0.16]} />
        <meshBasicMaterial map={tag} />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <boxGeometry args={[0.06, 0.05, 0.06]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh visible={false} position={[0, 0.7, 0]}>
        <boxGeometry args={[0.5, 1.5, 0.4]} />
      </mesh>
      <group name={name} />
    </group>
  )

  const legMat = <meshPhysicalMaterial color="#f0e7b8" transparent opacity={0.85} roughness={0.35} />

  return (
    <>
      <CellBeaker side="Zn" color="#e3eef2" a="ZnSO₄" b="দ্রবণ" />
      <CellBeaker side="Cu" color="#2f8fe6" a="CuSO₄" b="দ্রবণ" liquidRef={cuLiquid} />

      {electrode('zn', zn, znPlate, -3.3, '#aab3b8', znTag, 'zn')}
      {electrode('cu', cu, cuPlate, -2.5, '#c8743a', cuTag, 'cu')}

      <group
        ref={bridge}
        position={[0, BENCH_Y, 1.15]}
        onPointerDown={(e) => {
          useLab.getState().setCell({ bridge: false })
          beginDrag(e, bridge.current, () => {
            const b = bridge.current
            if (Math.abs(b.position.x) < 0.8 && Math.abs(b.position.z - 0.3) < 0.7) {
              b.position.x = 0
              b.position.z = 0.3
              useLab.getState().setCell({ bridge: true })
            }
          })
        }}
        {...hover}
      >
        {[-1.6, 1.6].map((sx) => (
          <group key={sx}>
            <mesh position={[sx, 0.5, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 1, 16]} />
              {legMat}
            </mesh>
            <mesh position={[sx, 1, 0]}>
              <sphereGeometry args={[0.07, 16, 12]} />
              {legMat}
            </mesh>
          </group>
        ))}
        <mesh position={[0, 1, 0]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.07, 0.07, 3.2, 16]} />
          {legMat}
        </mesh>
        <mesh position={[0, 1.22, 0]}>
          <planeGeometry args={[0.9, 0.28]} />
          <meshBasicMaterial map={bridgeTag} />
        </mesh>
      </group>

      {/* voltmeter */}
      <mesh position={[0, BENCH_Y + 0.275, -0.95]} castShadow>
        <boxGeometry args={[1, 0.55, 0.5]} />
        <meshStandardMaterial color="#263238" roughness={0.6} />
      </mesh>
      <mesh position={[0, BENCH_Y + 0.3, -0.695]}>
        <planeGeometry args={[0.8, 0.4]} />
        <meshBasicMaterial map={meter.t} />
      </mesh>
      <mesh position={[-0.3, BENCH_Y + 0.585, -0.95]}>
        <cylinderGeometry args={[0.05, 0.05, 0.07, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0.3, BENCH_Y + 0.585, -0.95]}>
        <cylinderGeometry args={[0.05, 0.05, 0.07, 16]} />
        <meshStandardMaterial color="#cc2222" />
      </mesh>

      <mesh ref={wireA}>
        <meshStandardMaterial color="#111" roughness={0.5} />
      </mesh>
      <mesh ref={wireB}>
        <meshStandardMaterial color="#cc2222" roughness={0.5} />
      </mesh>
      {[eA, eB].map((list, wi) =>
        Array.from({ length: 8 }).map((_, i) => (
          <mesh key={wi + '-' + i} ref={(m) => { list.current[i] = m }} visible={false}>
            <sphereGeometry args={[0.045, 10, 8]} />
            <meshBasicMaterial color="#ffd54a" />
          </mesh>
        )),
      )}
    </>
  )
}

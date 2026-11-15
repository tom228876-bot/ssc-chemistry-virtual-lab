import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { BENCH_Y, EXPS } from './constants'
import { useLab } from './store'
import { chemReport, react, totalVolume } from './lib/chemistry'
import { clamp } from './lib/math'
import { DragManager } from './lib/drag'
import { RoomEnv, Room } from './scene/Room'
import { ChemExperiment } from './scene/ChemExperiment'
import { CellExperiment } from './scene/CellExperiment'

interface CtrlLike {
  target: THREE.Vector3
  update: () => void
}

function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)
  const controls = useThree((s) => s.controls) as unknown as CtrlLike | null
  const viewKey = useLab((s) => s.viewKey)

  useEffect(() => {
    if (!controls) return
    const aspect = size.width / size.height
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const d = clamp(Math.max(4.4 / (t * aspect), 2.2 / t), 4.5, 16)
    const ty = size.width <= 760 ? 0.9 : BENCH_Y + 0.75
    controls.target.set(0, ty, 0)
    camera.position.set(0, ty + d * 0.36, d * 0.93)
    controls.update()
  }, [camera, controls, size.width, size.height, viewKey])
  return null
}

function Scene() {
  const exp = useLab((s) => s.exp)
  const resetKey = useLab((s) => s.resetKey)
  const info = EXPS.find((e) => e.id === exp)!
  return (
    <>
      <RoomEnv />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      <Room />
      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        minDistance={3}
        maxDistance={16}
        minPolarAngle={0.5}
        maxPolarAngle={1.5}
        minAzimuthAngle={-0.7}
        maxAzimuthAngle={0.7}
      />
      <CameraRig />
      <DragManager />
      {exp === 'cell' ? <CellExperiment key={resetKey} /> : <ChemExperiment key={exp + resetKey} bottles={info.bottles} />}
    </>
  )
}

function Panel() {
  const exp = useLab((s) => s.exp)
  const contents = useLab((s) => s.contents)
  const cell = useLab((s) => s.cell)
  const info = EXPS.find((e) => e.id === exp)!

  let reads: [string, string, string]
  let obs: string
  let eq: string
  if (exp === 'cell') {
    const act = cell.zn === 'Zn' && cell.cu === 'Cu' && cell.bridge
    reads = [(act ? 1.1 : 0).toFixed(2) + ' V', cell.bridge ? 'আছে' : 'নেই', act ? 'সম্পূর্ণ' : 'অসম্পূর্ণ']
    eq = 'Zn | Zn²⁺ ‖ Cu²⁺ | Cu'
    if (act) {
      obs = 'সার্কিট সম্পূর্ণ! Zn পাত (অ্যানোড) জারিত হয়ে Zn²⁺ হচ্ছে। ইলেকট্রন তার দিয়ে Cu পাতে (ক্যাথোড) যাচ্ছে, সেখানে Cu²⁺ বিজারিত হয়ে Cu জমছে। কিছুক্ষণ চালালে Zn পাত সরু, Cu পাত মোটা আর CuSO₄-এর নীল রং ফিকে হবে।'
      eq = 'অ্যানোড: Zn → Zn²⁺ + 2e⁻\nক্যাথোড: Cu²⁺ + 2e⁻ → Cu\nমোট: Zn + Cu²⁺ → Zn²⁺ + Cu\nআদর্শ E° = 0.34 − (−0.76) = 1.10 V'
    } else if (cell.zn === 'Cu') {
      obs = 'Zn সরাসরি CuSO₄ দ্রবণে: Zn + Cu²⁺ → Zn²⁺ + Cu। পাতে তামা জমবে, কিন্তু ইলেকট্রন সরাসরি স্থানান্তরিত হয়, তার দিয়ে বিদ্যুৎ পাওয়া যায় না। তাই দুই অর্ধকোষ আলাদা রাখা হয়।'
    } else if (cell.zn === 'Zn' && cell.cu === 'Cu' && !cell.bridge) {
      obs = 'দুই পাত ঠিক বিকারে আছে, কিন্তু সল্ট ব্রিজ নেই। আয়ন চলাচল না থাকলে সার্কিট সম্পূর্ণ হয় না, ভোল্টমিটার ০ দেখায়।'
    } else if (cell.cu === 'Zn') {
      obs = 'Cu পাত ZnSO₄ দ্রবণে: কোনো বিক্রিয়া হয় না। Cu কম সক্রিয়, Zn²⁺-কে সরাতে পারে না।'
    } else {
      obs = 'Zn পাত ZnSO₄ বিকারে, Cu পাত CuSO₄ বিকারে বসাও। পাত ধরে বিকারের ওপর ছাড়লে বসে যাবে।'
    }
  } else {
    const R = react(contents)
    const rep = chemReport(contents)
    reads = [R.pH === null ? '—' : R.pH.toFixed(1), R.temp.toFixed(1) + ' °C', totalVolume(contents).toFixed(1) + ' mL']
    obs = rep.obs
    eq = rep.eq
  }

  return (
    <div className="panel">
      <div className="task"><h3>কাজ</h3>{info.task}</div>
      <div className="reads">
        {info.labels.map((l, i) => (
          <div key={l}><small>{l}</small><b>{reads[i]}</b></div>
        ))}
      </div>
      <h3>পর্যবেক্ষণ</h3>
      <div className="obs">{obs}</div>
      <h3>সমীকরণ</h3>
      <div className="eq">{eq}</div>
      <div className="btns">
        <button onClick={() => useLab.getState().reset()}>↺ আবার শুরু</button>
        <button className="alt" onClick={() => useLab.getState().resetView()}>🎥 ক্যামেরা রিসেট</button>
      </div>
    </div>
  )
}

export default function App() {
  const exp = useLab((s) => s.exp)
  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 42, near: 0.1, far: 100, position: [0, 4, 6] }}>
        <Scene />
      </Canvas>
      <div className="top">
        <h1>⚗ SSC রসায়ন ভার্চুয়াল ল্যাব</h1>
        <div className="tabs">
          {EXPS.map((e) => (
            <button key={e.id} className={'tab' + (e.id === exp ? ' on' : '')} onClick={() => useLab.getState().setExp(e.id)}>
              {e.name}
            </button>
          ))}
        </div>
      </div>
      <Panel />
    </>
  )
}

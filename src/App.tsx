import { useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { BENCH_Y } from './constants'
import { useLab } from './store'
import { chemReport, react, totalVolume } from './lib/chemistry'
import { clamp } from './lib/math'
import { LIME_K, limeMilk } from './lib/gaslink'
import { DragManager } from './lib/drag'
import { RoomEnv, Room } from './scene/Room'
import { ChemExperiment } from './scene/ChemExperiment'
import { CellExperiment } from './scene/CellExperiment'
import Guide from './Guide'
import Finder from './Finder'

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
      {exp.kind === 'cell' ? <CellExperiment key={resetKey} /> : <ChemExperiment key={exp.id + resetKey} bottles={exp.bottles} limewater={exp.limewater} />}
    </>
  )
}

function Panel() {
  const exp = useLab((s) => s.exp)
  const contents = useLab((s) => s.contents)
  const cell = useLab((s) => s.cell)
  const lime = useLab((s) => s.lime)
  const corked = useLab((s) => s.corked)

  let reads: [string, string, string]
  let obs: string
  let eq: string
  if (exp.kind === 'cell') {
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

  if (exp.limewater) {
    const m = limeMilk(lime)
    const state = lime < 0.05 ? 'স্বচ্ছ' : lime <= LIME_K ? 'ঘোলা হচ্ছে' : m > 0.05 ? 'আবার স্বচ্ছ হচ্ছে' : 'আবার স্বচ্ছ'
    reads = [reads[0], state, lime.toFixed(1) + ' mmol']
    const extra: string[] = [corked ? 'ছিপি লাগানো আছে, গ্যাস নল দিয়ে চুনের পানিতে যাচ্ছে।' : 'ছিপি খোলা। গ্যাস বাইরে চলে যাচ্ছে; চুনের পানিতে নিতে ছিপি লাগাও।']
    if (lime > 0.05) {
      extra.push(lime <= LIME_K ? 'চুনের পানি ঘোলা হচ্ছে: অদ্রবণীয় CaCO₃ তৈরি হচ্ছে।' : 'চুনের পানি আবার স্বচ্ছ হচ্ছে: অতিরিক্ত CO₂ দ্রবণীয় Ca(HCO₃)₂ তৈরি করছে।')
    }
    obs = [obs, ...extra].filter(Boolean).join('\n')
    if (lime > 0.05) eq += '\nCa(OH)₂ + CO₂ → CaCO₃↓ + H₂O'
    if (lime > LIME_K + 0.2) eq += '\nCaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂'
  }

  return (
    <div className="panel">
      <div className="task"><h3>কাজ</h3>{exp.task}</div>
      <div className="reads">
        {exp.labels.map((l, i) => (
          <div key={l}><small>{l}</small><b>{reads[i]}</b></div>
        ))}
      </div>
      <h3>পর্যবেক্ষণ</h3>
      <div className="obs">{obs}</div>
      <h3>সমীকরণ</h3>
      <div className="eq">{eq}</div>
      {exp.limewater && (
        <button className="cork" onClick={() => useLab.getState().setCorked(!corked)}>
          {corked ? '🔓 ছিপি খোলো' : '🔒 ছিপি ও নল লাগাও'}
        </button>
      )}
      <div className="btns">
        <button onClick={() => useLab.getState().reset()}>↺ আবার শুরু</button>
        <button className="alt" onClick={() => useLab.getState().resetView()}>🎥 ক্যামেরা রিসেট</button>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 42, near: 0.1, far: 100, position: [0, 4, 6] }}>
        <Scene />
      </Canvas>
      <div className="top">
        <h1>⚗ SSC রসায়ন ভার্চুয়াল ল্যাব</h1>
        <Finder />
      </div>
      <Panel />
      <Guide />
    </>
  )
}

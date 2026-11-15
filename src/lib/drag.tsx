import { useEffect } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BENCH_Y } from '../constants'
import { clamp } from './math'

interface CtrlLike {
  enabled: boolean
  target: THREE.Vector3
  update: () => void
}

/** objects that can bump into each other (userData.r = radius) */
export const solids: THREE.Object3D[] = []

export const drag = {
  obj: null as THREE.Object3D | null,
  onEnd: null as (() => void) | null,
  controls: null as CtrlLike | null,
  plane: new THREE.Plane(new THREE.Vector3(0, 1, 0), -(BENCH_Y + 0.5)),
  offset: new THREE.Vector3(),
}

const hit = new THREE.Vector3()

export function beginDrag(e: ThreeEvent<PointerEvent>, obj: THREE.Object3D, onEnd?: () => void) {
  e.stopPropagation()
  if (drag.controls) drag.controls.enabled = false
  drag.obj = obj
  drag.onEnd = onEnd ?? null
  if (e.ray.intersectPlane(drag.plane, hit)) drag.offset.set(obj.position.x - hit.x, 0, obj.position.z - hit.z)
  else drag.offset.set(0, 0, 0)
}

export function clampToBench(o: THREE.Object3D) {
  o.position.x = clamp(o.position.x, -3.6, 3.6)
  o.position.z = clamp(o.position.z, -1.0, 1.25)
}

export function resolveOverlap(o: THREE.Object3D) {
  const r0 = (o.userData.r as number | undefined) ?? 0.3
  for (let k = 0; k < 4; k++) {
    for (const p of solids) {
      if (p === o) continue
      const dx = o.position.x - p.position.x
      const dz = o.position.z - p.position.z
      const d = Math.hypot(dx, dz) || 0.001
      const min = r0 + ((p.userData.r as number | undefined) ?? 0.3) + 0.03
      if (d < min) {
        o.position.x += (dx / d) * (min - d)
        o.position.z += (dz / d) * (min - d)
      }
    }
  }
  clampToBench(o)
}

export function useSolid(ref: React.RefObject<THREE.Object3D>, kind: string, r: number) {
  useEffect(() => {
    const o = ref.current
    if (!o) return
    o.userData.kind = kind
    o.userData.r = r
    solids.push(o)
    return () => {
      const i = solids.indexOf(o)
      if (i >= 0) solids.splice(i, 1)
    }
  }, [ref, kind, r])
}

export function DragManager() {
  const controls = useThree((s) => s.controls) as unknown as CtrlLike | null

  useEffect(() => {
    drag.controls = controls
    const end = () => {
      if (!drag.obj) return
      const cb = drag.onEnd
      drag.obj = null
      drag.onEnd = null
      if (drag.controls) drag.controls.enabled = true
      document.body.style.cursor = 'auto'
      cb?.()
    }
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', end)
    return () => {
      window.removeEventListener('pointerup', end)
      window.removeEventListener('pointercancel', end)
      drag.obj = null
    }
  }, [controls])

  useFrame(({ pointer, camera, raycaster }) => {
    const o = drag.obj
    if (!o) return
    raycaster.setFromCamera(pointer, camera)
    if (!raycaster.ray.intersectPlane(drag.plane, hit)) return
    o.position.x = hit.x + drag.offset.x
    o.position.z = hit.z + drag.offset.z
    clampToBench(o)
    document.body.style.cursor = 'grabbing'
  })

  return null
}

export const hover = {
  onPointerOver: () => {
    if (!drag.obj) document.body.style.cursor = 'grab'
  },
  onPointerOut: () => {
    if (!drag.obj) document.body.style.cursor = 'auto'
  },
}

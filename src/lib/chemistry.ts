import * as THREE from 'three'
import type { ChemKey } from '../constants'

export type Contents = Record<ChemKey, number>
export const emptyContents = (): Contents => ({ HCl: 0, NaOH: 0, Litmus: 0, CuSO4: 0 })
export const totalVolume = (c: Contents) => c.HCl + c.NaOH + c.Litmus + c.CuSO4

const WATER = new THREE.Color('#d9eef7')
const CU_BLUE = new THREE.Color('#2f8fe6')
const RED = new THREE.Color('#e0394b')
const BLUE = new THREE.Color('#2e63e6')
const litmusColor = (pH: number) => RED.clone().lerp(BLUE, Math.min(1, Math.max(0, (pH - 5) / 3.3)))

export interface Reaction {
  V: number
  neut: number
  ppt: number
  cuLeft: number
  pH: number | null
  color: THREE.Color
  temp: number
}

/** Simple stoichiometry. All solutions are 0.1 M, so mmol = mL x 0.1 */
export function react(c: Contents): Reaction {
  const V = totalVolume(c)
  const nH = c.HCl * 0.1
  const nO = c.NaOH * 0.1
  const nCu = c.CuSO4 * 0.1
  const neut = Math.min(nH, nO)
  const hLeft = nH - neut
  const oLeft = nO - neut
  const ppt = Math.min(nCu, oLeft / 2)
  const cuLeft = nCu - ppt
  const oFinal = oLeft - 2 * ppt

  let pH: number | null = null
  if (V > 0.05) {
    if (hLeft > 0.02) pH = -Math.log10(hLeft / V)
    else if (oFinal > 0.02) pH = 14 + Math.log10(oFinal / V)
    else if (cuLeft > 0.02) pH = 4.8
    else pH = 7
  }

  const color = WATER.clone()
  if (cuLeft > 0.01 && V > 0) color.lerp(CU_BLUE, 0.35 + 0.65 * Math.min(1, cuLeft / V / 0.05))
  if (c.Litmus > 0.05 && pH !== null) color.lerp(litmusColor(pH), Math.min(1, c.Litmus / 0.6) * 0.9)

  const temp = V > 0.5 ? 25 + (neut * 57) / (V * 4.18) : 25
  return { V, neut, ppt, cuLeft, pH, color, temp }
}

export function chemReport(c: Contents): { obs: string; eq: string } {
  const R = react(c)
  const obs: string[] = []
  const eq: string[] = []
  if (R.V <= 0.05) {
    obs.push('বিকার খালি। বোতল ধরে বিকারের দিকে নিয়ে যাও, বোতল কাত হয়ে ঢালা শুরু হবে।')
  } else {
    if (c.Litmus > 0.05 && R.pH !== null) {
      obs.push('লিটমাসের রং: ' + (R.pH < 5 ? 'লাল' : R.pH > 8 ? 'নীল' : 'বেগুনি'))
    }
    if (R.ppt > 0.01) obs.push('নীল অধঃক্ষেপ Cu(OH)₂ থিতিয়ে পড়েছে।')
    if (R.cuLeft > 0.02 && R.ppt <= 0.01) obs.push('দ্রবণ নীল (Cu²⁺ আয়ন আছে)।')
    if (R.neut > 0.02) obs.push('বিক্রিয়ায় তাপ উৎপন্ন হয়েছে (' + R.temp.toFixed(1) + ' °C)।')
    if (R.pH !== null) {
      obs.push('pH ≈ ' + R.pH.toFixed(1) + (R.pH < 6.5 ? ' · অম্লীয়' : R.pH > 7.5 ? ' · ক্ষারীয়' : ' · প্রায় নিরপেক্ষ'))
    }
    if (R.V >= 249) obs.push('বিকার ভর্তি!')
  }
  if (R.neut > 0.02) eq.push('HCl + NaOH → NaCl + H₂O')
  if (R.ppt > 0.01) eq.push('CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄')
  return {
    obs: obs.join('\n'),
    eq: eq.length ? eq.join('\n') : 'যা মেশাবে, তার সমীকরণ এখানে আসবে।',
  }
}

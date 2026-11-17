import * as THREE from 'three'
import { CHEM, CHEM_KEYS, type ChemKey, type Ion } from '../constants'

export type Contents = Record<ChemKey, number>
export const emptyContents = (): Contents => {
  const c = {} as Contents
  for (const k of CHEM_KEYS) c[k] = 0
  return c
}
export const totalVolume = (c: Contents) => CHEM_KEYS.reduce((s, k) => s + (CHEM[k].solid ? 0 : c[k]), 0)

const WATER = new THREE.Color('#d9eef7')
const CU_BLUE = new THREE.Color('#2f8fe6')
const FE_YELLOW = new THREE.Color('#e0b54a')
const PINK = new THREE.Color('#f0408a')
const RED = new THREE.Color('#e0394b')
const BLUE = new THREE.Color('#2e63e6')
const litmusColor = (pH: number) => RED.clone().lerp(BLUE, Math.min(1, Math.max(0, (pH - 5) / 3.3)))

export type PrecipId = 'Fe' | 'Cu' | 'Ag' | 'Ba'
export interface Precip {
  id: PrecipId
  mmol: number
  color: string
}
const PRECIP_COLOR: Record<PrecipId, string> = { Fe: '#9a4a1f', Cu: '#4f86e0', Ag: '#f1f1ec', Ba: '#fafafa' }

export interface Reaction {
  V: number
  neut: number
  precip: Precip[]
  pptTotal: number
  pptColor: THREE.Color
  pH: number | null
  color: THREE.Color
  temp: number
  left: Record<Ion, number>
  gas: { CO2: number; H2: number } // mmol evolved
  solids: { CaCO3: number; Zn: number; Cu: number } // mmol left / deposited
  layerTotal: number
  layerColor: THREE.Color
}

export const precipOf = (R: Reaction, id: PrecipId) => R.precip.find((p) => p.id === id)?.mmol ?? 0

/**
 * Simple stoichiometry on 0.1 M solutions (mmol = mL x 0.1 x ions per formula unit).
 * Reactions run in this order: neutralisation, Fe(OH)3, Cu(OH)2, AgCl, BaSO4.
 */
export function react(c: Contents): Reaction {
  const V = totalVolume(c)
  const ion: Record<Ion, number> = { H: 0, OH: 0, Cu: 0, Fe: 0, Ag: 0, Cl: 0, Ba: 0, SO4: 0 }
  for (const k of CHEM_KEYS) {
    const ions = CHEM[k].ions
    for (const i of Object.keys(ions) as Ion[]) ion[i] += c[k] * 0.1 * (ions[i] ?? 0)
  }

  const neut = Math.min(ion.H, ion.OH)
  ion.H -= neut
  ion.OH -= neut
  const fe = Math.min(ion.Fe, ion.OH / 3)
  ion.Fe -= fe
  ion.OH -= 3 * fe
  const cu = Math.min(ion.Cu, ion.OH / 2)
  ion.Cu -= cu
  ion.OH -= 2 * cu
  const ag = Math.min(ion.Ag, ion.Cl)
  ion.Ag -= ag
  ion.Cl -= ag
  const ba = Math.min(ion.Ba, ion.SO4)
  ion.Ba -= ba
  ion.SO4 -= ba

  // acid attacks carbonate / metal (2 H+ each), then zinc displaces copper
  const nCaCO3 = c.CaCO3 * (CHEM.CaCO3.solid ?? 0)
  const co2 = Math.min(ion.H / 2, nCaCO3)
  ion.H -= 2 * co2
  const nZn = c.Zn * (CHEM.Zn.solid ?? 0)
  const h2 = Math.min(ion.H / 2, nZn)
  ion.H -= 2 * h2
  let znLeft = nZn - h2
  const cuDep = Math.min(znLeft, ion.Cu)
  ion.Cu -= cuDep
  znLeft -= cuDep
  const caLeft = nCaCO3 - co2

  const precip: Precip[] = (
    [['Fe', fe], ['Cu', cu], ['Ag', ag], ['Ba', ba]] as [PrecipId, number][]
  )
    .filter(([, m]) => m > 0.01)
    .map(([id, mmol]) => ({ id, mmol, color: PRECIP_COLOR[id] }))
  const pptTotal = precip.reduce((s, p) => s + p.mmol, 0)
  const pptColor = new THREE.Color('#ffffff')
  if (pptTotal > 0) {
    pptColor.setRGB(0, 0, 0)
    for (const p of precip) pptColor.add(new THREE.Color(p.color).multiplyScalar(p.mmol / pptTotal))
  }

  let pH: number | null = null
  if (V > 0.05) {
    if (ion.H > 0.02) pH = -Math.log10(ion.H / V)
    else if (ion.OH > 0.02) pH = 14 + Math.log10(ion.OH / V)
    else if (ion.Fe > 0.02) pH = 2.5
    else if (ion.Cu > 0.02) pH = 4.8
    else pH = 7
  }

  const color = WATER.clone()
  if (V > 0) {
    if (ion.Fe > 0.01) color.lerp(FE_YELLOW, 0.35 + 0.65 * Math.min(1, ion.Fe / V / 0.05))
    if (ion.Cu > 0.01) color.lerp(CU_BLUE, 0.35 + 0.65 * Math.min(1, ion.Cu / V / 0.05))
  }
  if (c.Litmus > 0.05 && pH !== null) color.lerp(litmusColor(pH), Math.min(1, c.Litmus / 0.6) * 0.9)
  if (c.Phph > 0.05 && pH !== null && pH > 8.2) color.lerp(PINK, Math.min(1, (pH - 8.2) / 0.8) * Math.min(1, c.Phph / 0.5) * 0.9)

  const temp = V > 0.5 ? 25 + (neut * 57) / (V * 4.18) : 25
  const layers: { color: string; w: number }[] = precip.map((p) => ({ color: p.color, w: p.mmol }))
  if (caLeft > 0.02) layers.push({ color: '#f2f0ea', w: caLeft * 0.1 })
  if (znLeft > 0.02) layers.push({ color: '#9aa4aa', w: znLeft * 0.1 })
  if (cuDep > 0.02) layers.push({ color: '#b5651d', w: cuDep })
  const layerTotal = layers.reduce((s, l) => s + l.w, 0)
  const layerColor = new THREE.Color('#ffffff')
  if (layerTotal > 0) {
    layerColor.setRGB(0, 0, 0)
    for (const l of layers) layerColor.add(new THREE.Color(l.color).multiplyScalar(l.w / layerTotal))
  }

  return {
    V, neut, precip, pptTotal, pptColor, pH, color, temp, left: ion,
    gas: { CO2: co2, H2: h2 },
    solids: { CaCO3: caLeft, Zn: znLeft, Cu: cuDep },
    layerTotal, layerColor,
  }
}

export function chemReport(c: Contents): { obs: string; eq: string } {
  const R = react(c)
  const obs: string[] = []
  const eq: string[] = []
  if (R.V <= 0.05) {
    obs.push('বিকার খালি। বোতল ধরে বিকারের দিকে নিয়ে যাও, বোতল কাত হয়ে ঢালা শুরু হবে।')
  } else {
    if (c.Litmus > 0.05 && R.pH !== null) obs.push('লিটমাসের রং: ' + (R.pH < 5 ? 'লাল' : R.pH > 8 ? 'নীল' : 'বেগুনি'))
    if (c.Phph > 0.05 && R.pH !== null) obs.push('ফেনলফথ্যালিনের রং: ' + (R.pH > 8.2 ? 'গোলাপি (ক্ষারীয়)' : 'বর্ণহীন'))
    const names: Record<PrecipId, string> = {
      Fe: 'লালচে-বাদামী অধঃক্ষেপ Fe(OH)₃',
      Cu: 'নীল অধঃক্ষেপ Cu(OH)₂',
      Ag: 'সাদা দইয়ের মতো অধঃক্ষেপ AgCl',
      Ba: 'সাদা অধঃক্ষেপ BaSO₄',
    }
    for (const p of R.precip) obs.push(names[p.id] + ' জমেছে।')
    if (R.gas.CO2 > 0.01) obs.push('CO₂ গ্যাসের বুদবুদ বের হচ্ছে (এই গ্যাস চুনের পানি ঘোলা করে)।')
    if (R.gas.H2 > 0.01) obs.push('H₂ গ্যাসের বুদবুদ বের হচ্ছে (গ্যাসটি দাহ্য ও বাতাসের চেয়ে হালকা)।')
    if (R.solids.Cu > 0.02) obs.push('জিংকের গায়ে লালচে-বাদামী তামা (Cu) জমেছে; নীল রং ফিকে হচ্ছে।')
    if (R.solids.CaCO3 > 0.05) obs.push('চকের টুকরো নিচে পড়ে আছে।')
    if (R.solids.Zn > 0.05) obs.push('জিংকের দানা নিচে পড়ে আছে।')
    if (R.left.Cu > 0.02) obs.push('দ্রবণ নীল (Cu²⁺ আয়ন আছে)।')
    if (R.left.Fe > 0.02) obs.push('দ্রবণ হলদেটে (Fe³⁺ আয়ন আছে)।')
    if (R.neut > 0.02) obs.push('বিক্রিয়ায় তাপ উৎপন্ন হয়েছে (' + R.temp.toFixed(1) + ' °C)।')
    if (R.pH !== null) obs.push('pH ≈ ' + R.pH.toFixed(1) + (R.pH < 6.5 ? ' · অম্লীয়' : R.pH > 7.5 ? ' · ক্ষারীয়' : ' · প্রায় নিরপেক্ষ'))
    if (R.V >= 249) obs.push('বিকার ভর্তি!')
    if (obs.length === 1 && R.V > 0.05 && R.precip.length === 0 && R.neut <= 0.02 && R.gas.CO2 + R.gas.H2 < 0.01 && R.solids.Cu < 0.02) obs.push('এখনো কোনো দৃশ্যমান বিক্রিয়া হয়নি।')
  }
  if (R.neut > 0.02) {
    if (c.HCl > 0 || c.HCl1 > 0) eq.push('HCl + NaOH → NaCl + H₂O')
    if (c.H2SO4 > 0) eq.push('H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O')
  }
  if (precipOf(R, 'Fe') > 0.01) eq.push('FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl')
  if (precipOf(R, 'Cu') > 0.01) eq.push('CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄')
  if (precipOf(R, 'Ag') > 0.01) {
    eq.push(c.NaCl > 0 ? 'AgNO₃ + NaCl → AgCl↓ + NaNO₃' : c.HCl > 0 ? 'AgNO₃ + HCl → AgCl↓ + HNO₃' : 'Ag⁺ + Cl⁻ → AgCl↓')
  }
  if (precipOf(R, 'Ba') > 0.01) {
    eq.push(c.Na2SO4 > 0 ? 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl' : c.H2SO4 > 0 ? 'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl' : 'Ba²⁺ + SO₄²⁻ → BaSO₄↓')
  }
  if (R.gas.CO2 > 0.01) eq.push(c.HCl > 0 || c.HCl1 > 0 ? 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑' : 'CaCO₃ + 2H⁺ → Ca²⁺ + H₂O + CO₂↑')
  if (R.gas.H2 > 0.01) eq.push(c.HCl > 0 || c.HCl1 > 0 ? 'Zn + 2HCl → ZnCl₂ + H₂↑' : c.H2SO4 > 0 ? 'Zn + H₂SO₄ → ZnSO₄ + H₂↑' : 'Zn + 2H⁺ → Zn²⁺ + H₂↑')
  if (R.solids.Cu > 0.02) eq.push('Zn + CuSO₄ → ZnSO₄ + Cu')
  return { obs: obs.join('\n'), eq: eq.length ? eq.join('\n') : 'যা মেশাবে, তার সমীকরণ এখানে আসবে।' }
}

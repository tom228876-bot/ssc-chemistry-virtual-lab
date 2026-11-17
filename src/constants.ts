export const BENCH_Y = 1.0

export type Ion = 'H' | 'OH' | 'Cu' | 'Fe' | 'Ag' | 'Cl' | 'Ba' | 'SO4'
export type ChemKey = 'HCl' | 'H2SO4' | 'NaOH' | 'Litmus' | 'Phph' | 'CuSO4' | 'FeCl3' | 'AgNO3' | 'NaCl' | 'BaCl2' | 'Na2SO4' | 'HCl1' | 'CaCO3' | 'Zn'

export const CHEM_KEYS: ChemKey[] = ['HCl', 'H2SO4', 'NaOH', 'Litmus', 'Phph', 'CuSO4', 'FeCl3', 'AgNO3', 'NaCl', 'BaCl2', 'Na2SO4', 'HCl1', 'CaCO3', 'Zn']

export interface ChemInfo {
  label: string
  sub: string
  color: string
  rate: number // mL per second while pouring
  ions: Partial<Record<Ion, number>> // ions released per formula unit (0.1 M solutions)
  solid?: number // set for solids: mmol per gram (the amount is then in grams, not mL)
}

export const CHEM: Record<ChemKey, ChemInfo> = {
  HCl: { label: 'HCl', sub: '0.1 M অ্যাসিড', color: '#d3e9f3', rate: 12, ions: { H: 1, Cl: 1 } },
  H2SO4: { label: 'H₂SO₄', sub: '0.1 M অ্যাসিড', color: '#e8e6cf', rate: 12, ions: { H: 2, SO4: 1 } },
  NaOH: { label: 'NaOH', sub: '0.1 M ক্ষার', color: '#dfe3f5', rate: 12, ions: { OH: 1 } },
  Litmus: { label: 'লিটমাস', sub: 'নির্দেশক', color: '#9b59d0', rate: 1.5, ions: {} },
  Phph: { label: 'ফেনলফথ্যালিন', sub: 'নির্দেশক', color: '#efd9e6', rate: 1.5, ions: {} },
  CuSO4: { label: 'CuSO₄', sub: '0.1 M দ্রবণ', color: '#3a98e6', rate: 12, ions: { Cu: 1, SO4: 1 } },
  FeCl3: { label: 'FeCl₃', sub: '0.1 M দ্রবণ', color: '#d9a441', rate: 12, ions: { Fe: 1, Cl: 3 } },
  AgNO3: { label: 'AgNO₃', sub: '0.1 M দ্রবণ', color: '#e3e8ea', rate: 12, ions: { Ag: 1 } },
  NaCl: { label: 'NaCl', sub: '0.1 M দ্রবণ', color: '#e6eef2', rate: 12, ions: { Cl: 1 } },
  BaCl2: { label: 'BaCl₂', sub: '0.1 M দ্রবণ', color: '#e6eef2', rate: 12, ions: { Ba: 1, Cl: 2 } },
  Na2SO4: { label: 'Na₂SO₄', sub: '0.1 M দ্রবণ', color: '#e6eef2', rate: 12, ions: { SO4: 1 } },
  HCl1: { label: 'HCl', sub: '1 M অ্যাসিড', color: '#cfe5f1', rate: 12, ions: { H: 10, Cl: 10 } },
  CaCO3: { label: 'CaCO₃', sub: 'চকের টুকরো', color: '#f2f0ea', rate: 1.2, ions: {}, solid: 9.99 },
  Zn: { label: 'Zn', sub: 'জিংক দানা', color: '#9aa4aa', rate: 0.8, ions: {}, solid: 15.3 },
}

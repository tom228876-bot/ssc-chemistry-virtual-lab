export const BENCH_Y = 1.0

export type ChemKey = 'HCl' | 'NaOH' | 'Litmus' | 'CuSO4'
export type ExpId = 'neutral' | 'precip' | 'cell'

export interface ChemInfo {
  label: string
  sub: string
  color: string
  rate: number // mL per second while pouring
}

export const CHEM: Record<ChemKey, ChemInfo> = {
  HCl: { label: 'HCl', sub: '0.1 M অ্যাসিড', color: '#d3e9f3', rate: 12 },
  NaOH: { label: 'NaOH', sub: '0.1 M ক্ষার', color: '#dfe3f5', rate: 12 },
  Litmus: { label: 'লিটমাস', sub: 'নির্দেশক', color: '#9b59d0', rate: 1.5 },
  CuSO4: { label: 'CuSO₄', sub: '0.1 M দ্রবণ', color: '#3a98e6', rate: 12 },
}

export interface ExpInfo {
  id: ExpId
  name: string
  task: string
  labels: [string, string, string]
  bottles: ChemKey[]
}

export const EXPS: ExpInfo[] = [
  {
    id: 'neutral',
    name: 'অম্ল-ক্ষার নিরপেক্ষীকরণ',
    task: '১) HCl বোতল মাউস চেপে ধরে বিকারের দিকে নাও, বোতল কাত হয়ে ঢালা শুরু হবে। প্রায় ২০ mL ঢালো। ২) লিটমাস ১-২ mL ঢালো, রং লাল হবে। ৩) ধীরে ধীরে NaOH ঢালো। রং বেগুনি হলে প্রায় নিরপেক্ষ, নীল হলে ক্ষার বেশি হয়ে গেছে।',
    labels: ['pH', 'তাপমাত্রা', 'আয়তন'],
    bottles: ['HCl', 'NaOH', 'Litmus'],
  },
  {
    id: 'precip',
    name: 'অধঃক্ষেপ: CuSO₄ + NaOH',
    task: '১) CuSO₄ বোতল থেকে প্রায় ২০ mL ঢালো, দ্রবণ নীল হবে। ২) এবার NaOH ঢালো, নীল অধঃক্ষেপ পড়বে। ৩) পরে HCl ঢাললে কী হয় দেখো।',
    labels: ['pH', 'তাপমাত্রা', 'আয়তন'],
    bottles: ['CuSO4', 'NaOH', 'HCl'],
  },
  {
    id: 'cell',
    name: 'Zn/Cu ব্যাটারি',
    task: '১) Zn পাত ZnSO₄ বিকারে, Cu পাত CuSO₄ বিকারে বসাও (পাত ধরে বিকারের ওপর ছাড়ো)। ২) ভোল্টমিটার দেখো, তখনো ০। ৩) সল্ট ব্রিজ ধরে দুই বিকারের ওপর ছাড়ো। ইলেকট্রন চলা শুরু হবে।',
    labels: ['ভোল্টেজ', 'সল্ট ব্রিজ', 'সার্কিট'],
    bottles: [],
  },
]

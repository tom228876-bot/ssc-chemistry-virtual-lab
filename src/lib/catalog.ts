import { CHEM, type ChemKey } from '../constants'
import type { Contents, Reaction } from './chemistry'
import { precipOf } from './chemistry'
import type { CellState } from '../store'

export interface Ctx {
  c: Contents
  cell: CellState
  R: Reaction
  secs: number // seconds the battery circuit has been running
  lime: number // mmol CO2 that has reached the limewater
  corked: boolean // flask closed with cork and delivery tube
}
export interface Step {
  text: string
  hint: string
  check: (x: Ctx) => boolean
}
export interface Quiz {
  q: string
  options: string[]
  answer: number
  why: string
}
export interface ExpDef {
  id: string
  name: string
  kind: 'chem' | 'cell'
  task: string
  labels: [string, string, string]
  bottles: ChemKey[]
  needs: string[]
  keywords: string[]
  steps: Step[]
  quiz: Quiz[]
  limewater?: boolean
}

const needsOf = (keys: ChemKey[]) => [...keys.map((k) => CHEM[k].label + ' (' + CHEM[k].sub + ')'), 'বিকার (250 mL)']
const CHEM_LABELS: [string, string, string] = ['pH', 'তাপমাত্রা', 'আয়তন']

export const EXPS: ExpDef[] = [
  {
    id: 'neutral',
    name: 'অম্ল-ক্ষার নিরপেক্ষীকরণ (লিটমাস)',
    kind: 'chem',
    task: 'HCl ও NaOH মিশিয়ে লিটমাসের রং দেখে নিরপেক্ষীকরণ বোঝা। বোতল মাউস চেপে ধরে বিকারের দিকে নাও, বোতল কাত হয়ে ঢালা শুরু হবে।',
    labels: CHEM_LABELS,
    bottles: ['HCl', 'NaOH', 'Litmus'],
    needs: needsOf(['HCl', 'NaOH', 'Litmus']),
    keywords: ['নিরপেক্ষ', 'neutral', 'টাইট্রেশন', 'titration', 'অম্লক্ষার', 'অ্যাসিডক্ষার', 'acidbase', 'লিটমাস'],
    steps: [
      { text: 'প্রায় ২০ mL HCl বিকারে ঢালো', hint: 'HCl বোতল মাউস চেপে ধরে বিকারের দিকে নাও। বোতল কাত হলে ঢালা শুরু হবে।', check: ({ c }) => c.HCl >= 18 },
      { text: 'লিটমাস ১-২ mL যোগ করো', hint: 'লিটমাস বোতল একইভাবে ধরে অল্প ঢালো। অম্লীয় দ্রবণে রং লাল হবে।', check: ({ c }) => c.Litmus >= 0.8 },
      { text: 'ধীরে ধীরে NaOH ঢালো', hint: 'ঢালার সময় pH আর রং লক্ষ করো। বোতল অল্প কাত রাখলে ঢালা ধীরে হয়।', check: ({ c }) => c.NaOH >= 5 },
      {
        text: 'দ্রবণ নিরপেক্ষ করো (বেগুনি রং)',
        hint: 'ঠিক ২০ mL NaOH লাগে। বেশি হয়ে গেলে রং নীল হবে। তখন HCl দিয়ে ফেরাও বা "আবার শুরু" চাপো।',
        check: ({ c, R }) => R.pH !== null && R.pH > 6 && R.pH < 8 && c.Litmus > 0.5,
      },
    ],
    quiz: [
      { q: 'অম্লীয় দ্রবণে লিটমাস কোন রং দেয়?', options: ['লাল', 'নীল', 'সবুজ'], answer: 0, why: 'অ্যাসিড নীল লিটমাসকে লাল করে। ক্ষার লাল লিটমাসকে নীল করে।' },
      { q: 'HCl + NaOH বিক্রিয়ায় কী কী তৈরি হয়?', options: ['NaCl + H₂O', 'NaCl + H₂', 'Na₂O + HCl'], answer: 0, why: 'অ্যাসিড ও ক্ষার বিক্রিয়া করে লবণ (NaCl) ও পানি তৈরি করে। একে নিরপেক্ষীকরণ বলে।' },
      { q: 'নিরপেক্ষীকরণে দ্রবণ কিছুটা গরম হয় কেন?', options: ['এটি তাপমোচী বিক্রিয়া', 'এটি তাপশোষী বিক্রিয়া', 'তাপের সাথে এর সম্পর্ক নেই'], answer: 0, why: 'H⁺ আর OH⁻ মিলে পানি তৈরির সময় তাপ বের হয়, তাই এটি তাপমোচী।' },
    ],
  },
  {
    id: 'phph',
    name: 'ফেনলফথ্যালিন দিয়ে ক্ষার শনাক্তকরণ',
    kind: 'chem',
    task: 'ক্ষারীয় দ্রবণে ফেনলফথ্যালিনের রং দেখে, তারপর অ্যাসিড দিয়ে রং মিলিয়ে যাওয়া পর্যবেক্ষণ করা।',
    labels: CHEM_LABELS,
    bottles: ['NaOH', 'Phph', 'HCl'],
    needs: needsOf(['NaOH', 'Phph', 'HCl']),
    keywords: ['ক্ষারশনাক্ত', 'ফেনল', 'phenol', 'phph', 'নির্দেশক', 'indicator', 'গোলাপি'],
    steps: [
      { text: 'প্রায় ১৫ mL NaOH ঢালো', hint: 'NaOH বোতল ধরে বিকারের দিকে নাও।', check: ({ c }) => c.NaOH >= 13 },
      { text: 'ফেনলফথ্যালিন ১-২ mL যোগ করো', hint: 'ক্ষারীয় দ্রবণে এর রং কী হয় লক্ষ করো।', check: ({ c }) => c.Phph >= 0.8 },
      { text: 'রং বর্ণহীন হওয়া পর্যন্ত HCl ঢালো', hint: 'ধীরে ঢালো। ক্ষার শেষ হলেই গোলাপি রং মিলিয়ে যাবে।', check: ({ c, R }) => c.HCl >= 5 && R.pH !== null && R.pH < 8.2 },
    ],
    quiz: [
      { q: 'ক্ষারীয় দ্রবণে ফেনলফথ্যালিন কী রং দেয়?', options: ['গোলাপি', 'হলুদ', 'বর্ণহীন'], answer: 0, why: 'pH প্রায় 8.2-এর ওপরে ফেনলফথ্যালিন গোলাপি হয়।' },
      { q: 'অম্লীয় দ্রবণে ফেনলফথ্যালিন কী রং দেয়?', options: ['লাল', 'বর্ণহীন', 'নীল'], answer: 1, why: 'অম্লীয় ও নিরপেক্ষ দ্রবণে ফেনলফথ্যালিন বর্ণহীন থাকে।' },
      { q: 'ফেনলফথ্যালিন কোন ধরনের নির্দেশক?', options: ['অ্যাসিড-ক্ষার নির্দেশক', 'তাপমাত্রা নির্দেশক', 'জারণ নির্দেশক'], answer: 0, why: 'এটি দ্রবণের pH অনুযায়ী রং বদলায়, তাই টাইট্রেশনে এন্ডপয়েন্ট বোঝার জন্য ব্যবহার হয়।' },
    ],
  },
  {
    id: 'h2so4',
    name: 'H₂SO₄ ও NaOH-এর টাইট্রেশন',
    kind: 'chem',
    task: 'দ্বিক্ষারীয় অ্যাসিড H₂SO₄-কে NaOH দিয়ে নিরপেক্ষ করে ফেনলফথ্যালিনের হালকা গোলাপি এন্ডপয়েন্ট ধরা।',
    labels: CHEM_LABELS,
    bottles: ['H2SO4', 'Phph', 'NaOH'],
    needs: needsOf(['H2SO4', 'Phph', 'NaOH']),
    keywords: ['সালফিউরিক', 'h2so4', 'এন্ডপয়েন্ট', 'endpoint', 'টাইট্রেশন', 'titration'],
    steps: [
      { text: 'প্রায় ১০ mL H₂SO₄ ঢালো', hint: 'H₂SO₄ বোতল ধরে বিকারের দিকে নাও।', check: ({ c }) => c.H2SO4 >= 9 },
      { text: 'ফেনলফথ্যালিন ১-২ mL যোগ করো', hint: 'অ্যাসিডে এটি বর্ণহীন থাকে।', check: ({ c }) => c.Phph >= 0.8 },
      {
        text: 'হালকা গোলাপি রং আসা পর্যন্ত NaOH ঢালো',
        hint: 'H₂SO₄-এর ১ অণুতে ২টি H⁺ আছে, তাই ১০ mL-এর জন্য প্রায় ২০ mL NaOH লাগে। অল্প করে ঢালো।',
        check: ({ c, R }) => c.Phph > 0.5 && c.NaOH >= 15 && R.pH !== null && R.pH > 8.2,
      },
    ],
    quiz: [
      { q: 'H₂SO₄ + 2NaOH বিক্রিয়ায় কী তৈরি হয়?', options: ['Na₂SO₄ + 2H₂O', 'NaSO₄ + H₂O', 'Na₂S + 2H₂O'], answer: 0, why: 'দুটি H⁺ দুটি OH⁻-এর সাথে মিলে ২টি পানি আর Na₂SO₄ লবণ তৈরি করে।' },
      { q: '১০ mL H₂SO₄-কে নিরপেক্ষ করতে (সমান ঘনমাত্রায়) কত NaOH লাগে?', options: ['১০ mL', '২০ mL', '৫ mL'], answer: 1, why: 'H₂SO₄ দ্বিক্ষারীয়, ১ মোল H₂SO₄-এর জন্য ২ মোল NaOH লাগে।' },
      { q: 'এন্ডপয়েন্টে ফেনলফথ্যালিনের রং কী?', options: ['হালকা স্থায়ী গোলাপি', 'গাঢ় নীল', 'লাল'], answer: 0, why: 'অ্যাসিড শেষ হয়ে সামান্য ক্ষার বেশি হলেই দ্রবণ হালকা গোলাপি হয়।' },
    ],
  },
  {
    id: 'cu',
    name: 'নীল অধঃক্ষেপ: CuSO₄ + NaOH',
    kind: 'chem',
    task: 'CuSO₄ দ্রবণে NaOH দিয়ে নীল Cu(OH)₂ অধঃক্ষেপ তৈরি করা, তারপর অ্যাসিড দিয়ে তার কী হয় দেখা।',
    labels: CHEM_LABELS,
    bottles: ['CuSO4', 'NaOH', 'HCl'],
    needs: needsOf(['CuSO4', 'NaOH', 'HCl']),
    keywords: ['নীলঅধক্ষেপ', 'কপারহাইড্রক্সাইড', 'cuoh2', 'অধক্ষেপ', 'precipitat'],
    steps: [
      { text: 'প্রায় ২০ mL CuSO₄ ঢালো', hint: 'CuSO₄ বোতল ধরে বিকারের দিকে নাও। দ্রবণ নীল হবে।', check: ({ c }) => c.CuSO4 >= 18 },
      { text: 'NaOH ঢেলে নীল অধঃক্ষেপ দেখো', hint: 'NaOH ঢাললে বিকারের নিচে নীল স্তর জমবে।', check: ({ R }) => precipOf(R, 'Cu') > 0.3 },
      { text: 'সব Cu²⁺ অধঃক্ষিপ্ত করো', hint: 'CuSO₄ : NaOH = ১ : ২ মোল, তাই মোট প্রায় ৪০ mL NaOH লাগবে।', check: ({ R }) => precipOf(R, 'Cu') > 1.5 },
      {
        text: 'HCl ঢেলে দেখো অধঃক্ষেপের কী হয়',
        hint: 'HCl বোতল ধরে কিছুটা ঢালো। অ্যাসিড NaOH-এর OH⁻ খেয়ে ফেলে, অধঃক্ষেপ কমতে থাকে।',
        check: ({ c, R }) => c.HCl >= 3 && precipOf(R, 'Cu') < Math.min(c.CuSO4 * 0.1, c.NaOH * 0.05) - 0.1,
      },
    ],
    quiz: [
      { q: 'CuSO₄ + NaOH বিক্রিয়ায় নীল অধঃক্ষেপটির নাম কী?', options: ['Cu(OH)₂', 'CuCl₂', 'Na₂SO₄'], answer: 0, why: 'কপার(II) হাইড্রক্সাইড Cu(OH)₂ পানিতে অদ্রবণীয়, তাই নীল অধঃক্ষেপ হয়ে থিতিয়ে পড়ে।' },
      { q: '১ মোল CuSO₄-এর সাথে কত মোল NaOH বিক্রিয়া করে?', options: ['১ মোল', '২ মোল', '৩ মোল'], answer: 1, why: 'CuSO₄ + 2NaOH → Cu(OH)₂ + Na₂SO₄। সমীকরণে NaOH-এর সহগ ২।' },
      { q: 'Cu(OH)₂-এর অধঃক্ষেপে অ্যাসিড দিলে কী হয়?', options: ['অধঃক্ষেপ বাড়ে', 'অধঃক্ষেপ গলে যায়', 'কিছুই হয় না'], answer: 1, why: 'অ্যাসিড Cu(OH)₂-এর সাথে বিক্রিয়া করে দ্রবণীয় কপার লবণ ও পানি তৈরি করে।' },
    ],
  },
  {
    id: 'fe',
    name: 'লালচে-বাদামী অধঃক্ষেপ: FeCl₃ + NaOH',
    kind: 'chem',
    task: 'FeCl₃ দ্রবণে NaOH দিয়ে লালচে-বাদামী Fe(OH)₃ অধঃক্ষেপ তৈরি করা (আয়রন(III) আয়ন শনাক্তকরণ)।',
    labels: CHEM_LABELS,
    bottles: ['FeCl3', 'NaOH', 'HCl'],
    needs: needsOf(['FeCl3', 'NaOH', 'HCl']),
    keywords: ['লালচে', 'বাদামী', 'আয়রনহাইড্রক্সাইড', 'feoh3', 'ferric', 'আয়রনশনাক্ত', 'অধক্ষেপ', 'precipitat'],
    steps: [
      { text: 'প্রায় ২০ mL FeCl₃ ঢালো', hint: 'FeCl₃ বোতল ধরে বিকারের দিকে নাও। দ্রবণ হলদেটে বাদামী হবে।', check: ({ c }) => c.FeCl3 >= 18 },
      { text: 'NaOH ঢেলে অধঃক্ষেপ দেখো', hint: 'NaOH ঢাললে লালচে-বাদামী অধঃক্ষেপ জমবে।', check: ({ R }) => precipOf(R, 'Fe') > 0.3 },
      { text: 'সব Fe³⁺ অধঃক্ষিপ্ত করো', hint: 'FeCl₃ : NaOH = ১ : ৩ মোল, তাই মোট প্রায় ৬০ mL NaOH লাগবে।', check: ({ R }) => precipOf(R, 'Fe') > 1.5 },
      {
        text: 'HCl ঢেলে দেখো অধঃক্ষেপের কী হয়',
        hint: 'প্রায় ৬-১০ mL HCl ঢালো। অ্যাসিড OH⁻ খেয়ে ফেলে, অধঃক্ষেপ কমে।',
        check: ({ c, R }) => c.HCl >= 6 && precipOf(R, 'Fe') < Math.min(c.FeCl3 * 0.1, (c.NaOH * 0.1) / 3) - 0.1,
      },
    ],
    quiz: [
      { q: 'Fe(OH)₃ অধঃক্ষেপের রং কী?', options: ['লালচে-বাদামী', 'নীল', 'সাদা'], answer: 0, why: 'আয়রন(III) হাইড্রক্সাইড লালচে-বাদামী, মরিচার মতো।' },
      { q: 'FeCl₃ + 3NaOH → ?', options: ['Fe(OH)₃ + 3NaCl', 'Fe(OH)₂ + 2NaCl', 'FeO + NaCl'], answer: 0, why: 'Fe³⁺ আয়নের জন্য ৩টি OH⁻ লাগে, তাই NaOH-এর সহগ ৩।' },
      { q: 'এটি কোন ধরনের বিক্রিয়া?', options: ['দ্বিবিনিময় (অধঃক্ষেপণ) বিক্রিয়া', 'দহন বিক্রিয়া', 'বিয়োজন বিক্রিয়া'], answer: 0, why: 'দুটি যৌগ আয়ন বিনিময় করে অদ্রবণীয় Fe(OH)₃ তৈরি করেছে।' },
    ],
  },
  {
    id: 'agcl',
    name: 'ক্লোরাইড আয়ন শনাক্তকরণ: AgNO₃ + NaCl',
    kind: 'chem',
    task: 'সিলভার নাইট্রেট দিয়ে ক্লোরাইড আয়নের উপস্থিতি পরীক্ষা: সাদা দইয়ের মতো AgCl অধঃক্ষেপ।',
    labels: CHEM_LABELS,
    bottles: ['AgNO3', 'NaCl', 'HCl'],
    needs: needsOf(['AgNO3', 'NaCl', 'HCl']),
    keywords: ['সাদা', 'দই', 'ক্লোরাইডশনাক্ত', 'ক্লোরাইডআয়ন', 'agcl', 'chloridetest', 'অধক্ষেপ', 'precipitat'],
    steps: [
      { text: 'প্রায় ১৫ mL AgNO₃ ঢালো', hint: 'AgNO₃ বোতল ধরে বিকারের দিকে নাও। দ্রবণ বর্ণহীন।', check: ({ c }) => c.AgNO3 >= 13 },
      { text: 'NaCl ঢেলে সাদা অধঃক্ষেপ দেখো', hint: 'NaCl ঢাললেই সাদা AgCl জমবে।', check: ({ R }) => precipOf(R, 'Ag') > 0.3 },
      { text: 'সব Ag⁺ অধঃক্ষিপ্ত করো', hint: 'AgNO₃ : NaCl = ১ : ১, তাই প্রায় ১৫ mL NaCl লাগবে।', check: ({ R }) => precipOf(R, 'Ag') > 1.4 },
    ],
    quiz: [
      { q: 'AgCl অধঃক্ষেপের রং কী?', options: ['সাদা', 'হলুদ', 'কালো'], answer: 0, why: 'সিলভার ক্লোরাইড সাদা, দইয়ের মতো অধঃক্ষেপ।' },
      { q: 'এই পরীক্ষায় কোন আয়ন শনাক্ত হয়?', options: ['Cl⁻', 'Na⁺', 'NO₃⁻'], answer: 0, why: 'Ag⁺ যুক্ত করলে সাদা অধঃক্ষেপ হলে বোঝা যায় দ্রবণে Cl⁻ আছে।' },
      { q: 'AgNO₃ + NaCl → ?', options: ['AgCl + NaNO₃', 'Ag + NaCl₂', 'AgNa + NO₃Cl'], answer: 0, why: 'আয়ন বিনিময় হয়ে অদ্রবণীয় AgCl ও দ্রবণীয় NaNO₃ তৈরি হয়।' },
    ],
  },
  {
    id: 'baso4',
    name: 'সালফেট আয়ন শনাক্তকরণ: BaCl₂ + Na₂SO₄',
    kind: 'chem',
    task: 'বেরিয়াম ক্লোরাইড দিয়ে সালফেট আয়ন পরীক্ষা: সাদা BaSO₄ অধঃক্ষেপ, যা অ্যাসিডে দ্রবীভূত হয় না।',
    labels: CHEM_LABELS,
    bottles: ['BaCl2', 'Na2SO4', 'H2SO4'],
    needs: needsOf(['BaCl2', 'Na2SO4', 'H2SO4']),
    keywords: ['সালফেটশনাক্ত', 'সালফেটআয়ন', 'baso4', 'sulfatetest', 'sulphatetest', 'সাদা', 'অধক্ষেপ', 'precipitat'],
    steps: [
      { text: 'প্রায় ১৫ mL BaCl₂ ঢালো', hint: 'BaCl₂ বোতল ধরে বিকারের দিকে নাও।', check: ({ c }) => c.BaCl2 >= 13 },
      { text: 'Na₂SO₄ ঢেলে সাদা অধঃক্ষেপ দেখো', hint: 'Na₂SO₄ ঢাললেই সাদা BaSO₄ জমবে।', check: ({ R }) => precipOf(R, 'Ba') > 0.3 },
      { text: 'সব Ba²⁺ অধঃক্ষিপ্ত করো', hint: 'BaCl₂ : Na₂SO₄ = ১ : ১, তাই প্রায় ১৫ mL Na₂SO₄ লাগবে।', check: ({ R }) => precipOf(R, 'Ba') > 1.4 },
    ],
    quiz: [
      { q: 'BaSO₄ অধঃক্ষেপের রং কী?', options: ['সাদা', 'নীল', 'বাদামী'], answer: 0, why: 'বেরিয়াম সালফেট সাদা অধঃক্ষেপ।' },
      { q: 'এই পরীক্ষায় কোন আয়ন শনাক্ত হয়?', options: ['SO₄²⁻', 'Cl⁻', 'Na⁺'], answer: 0, why: 'Ba²⁺ যোগ করলে সাদা অধঃক্ষেপ হলে বোঝা যায় দ্রবণে SO₄²⁻ আছে।' },
      { q: 'BaSO₄ লঘু অ্যাসিডে কী হয়?', options: ['দ্রবীভূত হয় না', 'পুরো গলে যায়', 'নীল হয়ে যায়'], answer: 0, why: 'BaSO₄ অ্যাসিডেও অদ্রবণীয়, তাই সালফেট শনাক্তকরণে এটি নির্ভরযোগ্য।' },
    ],
  },
  {
    id: 'co2',
    name: 'CO₂ প্রস্তুতি: চকের টুকরো + HCl',
    kind: 'chem',
    task: 'চুনাপাথর বা চকের (CaCO₃) টুকরোয় লঘু HCl দিয়ে CO₂ গ্যাস তৈরি করা। বুদবুদ দেখে বিক্রিয়া বোঝো।',
    labels: CHEM_LABELS,
    bottles: ['HCl1', 'CaCO3', 'Litmus'],
    needs: needsOf(['HCl1', 'CaCO3', 'Litmus']),
    keywords: ['co2', 'কার্বনডাইঅক্সাইড', 'কার্বনডাই', 'carbondioxide', 'গ্যাস', 'বুদবুদ', 'gas', 'bubble'],
    steps: [
      { text: 'প্রায় ২০ mL HCl (1 M) ঢালো', hint: 'HCl বোতল মাউস চেপে ধরে বিকারের দিকে নাও।', check: ({ c }) => c.HCl1 >= 18 },
      { text: 'লিটমাস ১ mL যোগ করো (অ্যাসিডে লাল)', hint: 'লিটমাস বোতল ধরে অল্প ঢালো।', check: ({ c }) => c.Litmus >= 0.8 },
      { text: 'চকের টুকরো ফেলে বুদবুদ দেখো', hint: 'CaCO₃ বোতল ধরে বিকারের দিকে নাও। বুদবুদই CO₂ গ্যাস।', check: ({ R }) => R.gas.CO2 > 1 },
      { text: 'অ্যাসিড শেষ না হওয়া পর্যন্ত চক ফেলো', hint: '২০ mL (1 M) HCl-এর জন্য প্রায় ১ g CaCO₃ লাগে। বুদবুদ থামলে অ্যাসিড শেষ।', check: ({ c, R }) => c.HCl1 >= 18 && R.left.H < 0.2 && c.CaCO3 > 0.5 },
    ],
    quiz: [
      { q: 'চক বা মার্বেলে অ্যাসিড দিলে কোন গ্যাস বের হয়?', options: ['CO₂', 'H₂', 'O₂'], answer: 0, why: 'কার্বনেট অ্যাসিডের সাথে বিক্রিয়া করে CO₂ গ্যাস, পানি ও লবণ তৈরি করে।' },
      { q: 'CO₂ গ্যাস কোন দ্রবণকে ঘোলা করে?', options: ['চুনের পানি', 'লবণের দ্রবণ', 'চিনির দ্রবণ'], answer: 0, why: 'CO₂ চুনের পানির Ca(OH)₂-এর সাথে বিক্রিয়া করে অদ্রবণীয় সাদা CaCO₃ তৈরি করে, তাই ঘোলা হয়।' },
      { q: 'CaCO₃ + 2HCl → ?', options: ['CaCl₂ + H₂O + CO₂', 'CaCl₂ + H₂', 'Ca + CO₂ + HCl'], answer: 0, why: 'কার্বনেট + অ্যাসিড → লবণ + পানি + CO₂।' },
    ],
  },
  {
    id: 'co2test',
    name: 'CO₂ শনাক্তকরণ: চুনের পানি ঘোলা',
    kind: 'chem',
    limewater: true,
    task: 'চকে HCl দিয়ে CO₂ তৈরি করে, ছিপি ও নল দিয়ে সেই গ্যাস চুনের পানিতে পাঠাও। চুনের পানি ঘোলা হওয়াই CO₂-এর পরীক্ষা। গ্যাস বেশি দিলে কী হয় তাও দেখো।',
    labels: ['pH', 'চুনের পানি', 'শোষিত CO₂'],
    bottles: ['HCl1', 'CaCO3'],
    needs: ['HCl (1 M অ্যাসিড)', 'CaCO₃ (চকের টুকরো)', 'চুনের পানির পাত্র', 'ছিপি ও গ্যাস-নল', 'বিকার (250 mL)'],
    keywords: ['চুনেরপানি', 'limewater', 'ঘোলা', 'co2', 'কার্বনডাইঅক্সাইড', 'কার্বনডাই', 'co2শনাক্ত', 'co2পরীক্ষা', 'কার্বনডাইঅক্সাইডশনাক্ত', 'কার্বনডাইঅক্সাইডপরীক্ষা', 'গ্যাসনল'],
    steps: [
      { text: 'প্রায় ২০ mL HCl (1 M) বিকারে ঢালো', hint: 'HCl বোতল মাউস চেপে ধরে বিকারের দিকে নাও।', check: ({ c }) => c.HCl1 >= 18 },
      {
        text: 'চকের টুকরো ফেলো, তারপর তাড়াতাড়ি "ছিপি লাগাও" চাপো',
        hint: 'চক ফেললেই বুদবুদ শুরু হবে। দেরি করলে গ্যাস বাইরে চলে যায়। (ছিপি লাগানো থাকলে বোতল থেকে ঢালা যায় না।)',
        check: ({ c, corked }) => corked && c.CaCO3 >= 0.3,
      },
      { text: 'গ্যাস নল দিয়ে যাচ্ছে, চুনের পানি ঘোলা হতে দেখো', hint: 'কিছুক্ষণ অপেক্ষা করো। CO₂ চুনের পানির সাথে বিক্রিয়া করছে।', check: ({ lime }) => lime > 2 },
      {
        text: 'আরও গ্যাস গেলে কী হয় দেখো (আবার স্বচ্ছ)',
        hint: 'ঘোলা ভাব ধীরে ধীরে কমবে। গ্যাস কম পড়লে "ছিপি খোলো", আরও চক ফেলে আবার ছিপি লাগাও।',
        check: ({ lime }) => lime > 6.5,
      },
    ],
    quiz: [
      { q: 'চুনের পানি ঘোলা হয় কেন?', options: ['অদ্রবণীয় CaCO₃ তৈরি হয় বলে', 'পানি গরম হয় বলে', 'HCl মিশে যায় বলে'], answer: 0, why: 'CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O। CaCO₃ পানিতে অদ্রবণীয়, তাই সাদা ঘোলা ভাব আসে।' },
      { q: 'চুনের পানিতে অনেকক্ষণ CO₂ দিলে কী হয়?', options: ['আবার স্বচ্ছ হয়ে যায়', 'আরও গাঢ় হয়', 'লাল হয়ে যায়'], answer: 0, why: 'অতিরিক্ত CO₂ ও পানির সাথে CaCO₃ বিক্রিয়া করে দ্রবণীয় Ca(HCO₃)₂ তৈরি করে।' },
      { q: 'CO₂ গ্যাস শনাক্ত করার সবচেয়ে সাধারণ পরীক্ষা কোনটি?', options: ['চুনের পানি ঘোলা হওয়া', 'জ্বলন্ত কাঠি "পট" শব্দ করা', 'লিটমাস কাগজ নীল হওয়া'], answer: 0, why: '"পট" শব্দ H₂-এর পরীক্ষা। CO₂ চুনের পানিকে ঘোলা করে।' },
    ],
  },
  {
    id: 'h2',
    name: 'H₂ প্রস্তুতি: জিংক + HCl',
    kind: 'chem',
    task: 'জিংকের দানায় লঘু HCl দিয়ে হাইড্রোজেন গ্যাস তৈরি করা। বুদবুদ দেখে বিক্রিয়া বোঝো।',
    labels: CHEM_LABELS,
    bottles: ['HCl1', 'Zn'],
    needs: needsOf(['HCl1', 'Zn']),
    keywords: ['হাইড্রোজেন', 'hydrogen', 'গ্যাস', 'বুদবুদ', 'gas', 'bubble', 'h2গ্যাস', 'h2gas'],
    steps: [
      { text: 'প্রায় ২০ mL HCl (1 M) ঢালো', hint: 'HCl বোতল মাউস চেপে ধরে বিকারের দিকে নাও।', check: ({ c }) => c.HCl1 >= 18 },
      { text: 'জিংকের দানা ফেলে H₂ বুদবুদ দেখো', hint: 'Zn বোতল ধরে বিকারের দিকে নাও।', check: ({ R }) => R.gas.H2 > 1 },
      { text: 'অ্যাসিড শেষ না হওয়া পর্যন্ত জিংক ফেলো', hint: '২০ mL (1 M) HCl-এর জন্য প্রায় ০.৭ g জিংক লাগে। বুদবুদ থামলে অ্যাসিড শেষ।', check: ({ c, R }) => c.HCl1 >= 18 && R.left.H < 0.2 && c.Zn > 0.5 },
    ],
    quiz: [
      { q: 'জিংকে অ্যাসিড দিলে কোন গ্যাস বের হয়?', options: ['H₂', 'CO₂', 'O₂'], answer: 0, why: 'সক্রিয় ধাতু অ্যাসিড থেকে হাইড্রোজেন সরিয়ে H₂ গ্যাস তৈরি করে।' },
      { q: 'হাইড্রোজেন গ্যাসের ধর্ম কী?', options: ['দাহ্য ও বাতাসের চেয়ে হালকা', 'অদাহ্য ও ভারী', 'আগুন নেভায়'], answer: 0, why: 'H₂ খুব হালকা ও দাহ্য, জ্বলন্ত কাঠি কাছে নিলে "পট" শব্দ করে জ্বলে।' },
      { q: 'Zn + 2HCl → ZnCl₂ + H₂ কোন ধরনের বিক্রিয়া?', options: ['প্রতিস্থাপন (বিস্থাপন) বিক্রিয়া', 'বিয়োজন বিক্রিয়া', 'দহন বিক্রিয়া'], answer: 0, why: 'Zn অ্যাসিডের H-কে সরিয়ে নিজে তার জায়গা নিয়েছে।' },
    ],
  },
  {
    id: 'displace',
    name: 'প্রতিস্থাপন: জিংক + CuSO₄ (তামা জমে)',
    kind: 'chem',
    task: 'জিংকের দানা CuSO₄ দ্রবণে ফেলে দেখো: তামা জমে, নীল রং ফিকে হয়। সক্রিয় ধাতু কম সক্রিয় ধাতুকে সরিয়ে দেয়।',
    labels: CHEM_LABELS,
    bottles: ['CuSO4', 'Zn'],
    needs: needsOf(['CuSO4', 'Zn']),
    keywords: ['প্রতিস্থাপন', 'বিস্থাপন', 'displacement', 'তামাজমে', 'সক্রিয়তা', 'reactivity'],
    steps: [
      { text: 'প্রায় ২০ mL CuSO₄ ঢালো', hint: 'CuSO₄ বোতল ধরে বিকারের দিকে নাও। দ্রবণ নীল।', check: ({ c }) => c.CuSO4 >= 18 },
      { text: 'জিংকের দানা ফেলে তামা জমতে দেখো', hint: 'Zn বোতল ধরে বিকারের দিকে নাও। লালচে-বাদামী তামা জমবে।', check: ({ R }) => R.solids.Cu > 0.3 },
      { text: 'নীল রং ফিকে হওয়া পর্যন্ত জিংক ফেলো', hint: '২ মিলিমোল Cu²⁺-এর জন্য মাত্র প্রায় ০.১৩ g জিংক লাগে। একটু বেশি ফেললে ক্ষতি নেই।', check: ({ R }) => R.left.Cu < 0.1 && R.solids.Cu > 1.5 },
    ],
    quiz: [
      { q: 'Zn + CuSO₄ → ?', options: ['ZnSO₄ + Cu', 'ZnCu + SO₄', 'Zn + Cu + SO₄'], answer: 0, why: 'Zn Cu²⁺-কে সরিয়ে Zn²⁺ হয়ে দ্রবণে যায়, আর Cu ধাতু হিসেবে জমে।' },
      { q: 'কেন Zn কপারকে CuSO₄ থেকে সরাতে পারে?', options: ['Zn বেশি সক্রিয় ধাতু', 'Zn ভারী বলে', 'Zn নীল বলে'], answer: 0, why: 'সক্রিয়তা সিরিজে Zn, Cu-এর ওপরে, তাই Zn কপারকে প্রতিস্থাপন করে।' },
      { q: 'দ্রবণের নীল রং ফিকে হয় কেন?', options: ['Cu²⁺ আয়ন কমে যায়', 'পানি বেড়ে যায়', 'জিংক রং শুষে নেয়'], answer: 0, why: 'নীল রং Cu²⁺ আয়নের। আয়ন তামা হয়ে জমে গেলে রং ফিকে হয়।' },
    ],
  },
  {
    id: 'cell',
    name: 'Zn/Cu ব্যাটারি (গ্যালভানিক কোষ)',
    kind: 'cell',
    task: 'জিংক ও কপার পাত, দুটি দ্রবণ ও সল্ট ব্রিজ দিয়ে বিদ্যুৎ কোষ বানিয়ে ভোল্টমিটারে বিভব মাপা।',
    labels: ['ভোল্টেজ', 'সল্ট ব্রিজ', 'সার্কিট'],
    bottles: [],
    needs: ['Zn পাত', 'Cu পাত', 'ZnSO₄ ও CuSO₄ দ্রবণের দুটি বিকার', 'সল্ট ব্রিজ', 'ভোল্টমিটার'],
    keywords: ['ব্যাটারি', 'battery', 'কোষ', 'তড়িৎ', 'ডেনিয়েল', 'daniell', 'galvanic', 'zncu', 'সল্টব্রিজ', 'saltbridge', 'বিদ্যুৎ'],
    steps: [
      { text: 'Zn পাত ZnSO₄ বিকারে বসাও', hint: 'Zn পাত ধরে বাঁ দিকের বিকারের ওপর ছাড়ো।', check: ({ cell }) => cell.zn === 'Zn' },
      { text: 'Cu পাত CuSO₄ বিকারে বসাও', hint: 'Cu পাত ধরে ডান দিকের (নীল) বিকারের ওপর ছাড়ো।', check: ({ cell }) => cell.cu === 'Cu' },
      { text: 'সল্ট ব্রিজ বসিয়ে সার্কিট সম্পূর্ণ করো', hint: 'সল্ট ব্রিজ ধরে দুই বিকারের ওপর ছাড়ো। ভোল্টমিটারে মান আসবে।', check: ({ cell }) => cell.bridge && cell.zn === 'Zn' && cell.cu === 'Cu' },
      { text: 'সার্কিট চালু রেখে ১০ সেকেন্ড পর্যবেক্ষণ করো', hint: 'ইলেকট্রনের প্রবাহ দেখো। Zn পাত সরু আর Cu পাত মোটা হতে থাকবে।', check: ({ secs }) => secs >= 10 },
    ],
    quiz: [
      { q: 'Zn/Cu কোষে অ্যানোড কোনটি?', options: ['Zn', 'Cu', 'সল্ট ব্রিজ'], answer: 0, why: 'অ্যানোডে জারণ হয়। Zn → Zn²⁺ + 2e⁻, তাই Zn পাত অ্যানোড।' },
      { q: 'সল্ট ব্রিজের কাজ কী?', options: ['আয়ন চলাচলের মাধ্যমে সার্কিট সম্পূর্ণ করা', 'ইলেকট্রন সরবরাহ করা', 'দ্রবণ ঠান্ডা রাখা'], answer: 0, why: 'সল্ট ব্রিজ ছাড়া দুই অর্ধকোষে আধান জমে বিক্রিয়া থেমে যায়। এটি আয়ন চলতে দিয়ে সার্কিট সম্পূর্ণ করে।' },
      { q: 'Zn/Cu কোষের আদর্শ বিভব কত?', options: ['0.34 V', '1.10 V', '0.76 V'], answer: 1, why: 'E° = 0.34 − (−0.76) = 1.10 V।' },
    ],
  },
]

/** A mix-it-yourself experiment built from whichever chemicals the student named. */
export function freeMix(keys: ChemKey[], text: string): ExpDef {
  const hasSolid = keys.some((k) => CHEM[k].solid)
  const list = keys.slice(0, 4).map((k) => (k === 'HCl' && hasSolid ? 'HCl1' : k) as ChemKey)
  const names = list.map((k) => CHEM[k].label).join(' + ')
  return {
    id: 'free-' + list.join('-'),
    name: 'মুক্ত পরীক্ষা: ' + names,
    kind: 'chem',
    task: 'তুমি লিখেছ: "' + text + '"। এই নামের রাসায়নিকগুলো বেঞ্চে রাখা আছে। একটা একটা করে বিকারে ঢালো আর কী ঘটে নিচের পর্যবেক্ষণ ও সমীকরণে দেখো।',
    labels: CHEM_LABELS,
    bottles: list,
    needs: needsOf(list),
    keywords: [],
    steps: list.map((k) => {
      const solid = !!CHEM[k].solid
      const ind = !solid && CHEM[k].rate < 5
      return {
        text: CHEM[k].label + (solid ? ' প্রায় ১ g ফেলো' : ' প্রায় ' + (ind ? '১-২' : '১০') + ' mL ঢালো'),
        hint: CHEM[k].label + ' বোতল মাউস চেপে ধরে বিকারের দিকে নাও।',
        check: ({ c }: Ctx) => c[k] >= (solid ? 0.5 : ind ? 0.8 : 8),
      }
    }),
    quiz: [],
  }
}

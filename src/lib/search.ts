import { CHEM_KEYS, type ChemKey } from '../constants'
import { EXPS, freeMix, type ExpDef } from './catalog'

const SUBS = /[₀-₉]/g
const STRIP = /[\u200c\u200d\s\-_.,;:!?()[\]'"“”‘’।/+&⁺⁻²³ঃ]/g

/** lower-case, subscripts to digits, drop spaces/punctuation so "H₂SO₄" and "h2so4" match */
export function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(SUBS, (ch) => String(ch.charCodeAt(0) - 0x2080))
    .replace(STRIP, '')
}

const ALIASES: Record<ChemKey, string[]> = {
  HCl: ['hcl', 'হাইড্রোক্লোরিক', 'হাইড্রোক্লোরাইড'],
  H2SO4: ['h2so4', 'সালফিউরিক', 'গন্ধকাম্ল'],
  NaOH: ['naoh', 'সোডিয়ামহাইড্রক্সাইড', 'কস্টিক', 'কষ্টিক'],
  Litmus: ['litmus', 'লিটমাস'],
  Phph: ['phenolphthalein', 'phph', 'ফেনলফথ্যালিন', 'ফেনফথ্যালিন', 'ফেনোলফথ্যালিন', 'ফেনল্ফথ্যালিন'],
  CuSO4: ['cuso4', 'কপারসালফেট', 'কপারসালফেট', 'তুঁতে', 'তুতে', 'coppersulfate', 'coppersulphate'],
  FeCl3: ['fecl3', 'আয়রনক্লোরাইড', 'ফেরিকক্লোরাইড', 'ferricchloride', 'ironchloride'],
  AgNO3: ['agno3', 'সিলভারনাইট্রেট', 'silvernitrate'],
  NaCl: ['nacl', 'সোডিয়ামক্লোরাইড', 'খাবারলবণ', 'tablesalt'],
  BaCl2: ['bacl2', 'বেরিয়ামক্লোরাইড', 'bariumchloride'],
  Na2SO4: ['na2so4', 'সোডিয়ামসালফেট', 'sodiumsulfate', 'sodiumsulphate'],
  HCl1: [],
  CaCO3: ['caco3', 'ক্যালসিয়ামকার্বনেট', 'চুনাপাথর', 'মার্বেল', 'marble', 'chalk', 'limestone', 'চক'],
  Zn: ['জিংক', 'দস্তা', 'zinc'],
}
// only used when no specific acid / base was named
const GENERIC_ACID = ['অ্যাসিড', 'এসিড', 'অম্ল', 'acid']
const GENERIC_BASE = ['ক্ষার', 'base', 'alkali']

const ALIAS_N = Object.fromEntries(CHEM_KEYS.map((k) => [k, ALIASES[k].map(norm)])) as Record<ChemKey, string[]>
const KEYWORDS_N = new Map<string, string[]>(EXPS.map((e) => [e.id, e.keywords.map(norm)]))

export function detectChemicals(text: string): ChemKey[] {
  const t = norm(text)
  const found = CHEM_KEYS.filter((k) => ALIAS_N[k].some((a) => t.includes(a)))
  const hasAcid = found.includes('HCl') || found.includes('H2SO4')
  const hasBase = found.includes('NaOH')
  if (!hasAcid && GENERIC_ACID.map(norm).some((a) => t.includes(a))) found.push('HCl')
  if (!hasBase && GENERIC_BASE.map(norm).some((a) => t.includes(a))) found.push('NaOH')
  return found
}

export interface Match {
  def: ExpDef
  note: string
}

export function search(text: string): Match[] {
  const t = norm(text)
  if (!t) return EXPS.map((def) => ({ def, note: '' }))
  const mentioned = detectChemicals(text)

  const scored = EXPS.map((def) => {
    const kw = (KEYWORDS_N.get(def.id) ?? []).filter((k) => t.includes(k)).length
    const have = def.bottles.map((b): ChemKey => (b === 'HCl1' ? 'HCl' : b))
    const inter = mentioned.filter((m) => have.includes(m)).length
    const extra = def.kind === 'cell' ? 0 : mentioned.length - inter
    const score = 4 * inter - 2 * extra + 5 * kw
    return { def, score, valid: inter > 0 || kw > 0, extra }
  })
    .filter((s) => s.valid && s.score > 0)
    .sort((a, b) => b.score - a.score)

  // if some experiment uses every chemical the student named, hide the ones that don't
  const pool = scored.length > 0 && scored[0].extra === 0 ? scored.filter((s) => s.extra === 0) : scored
  const out: Match[] = pool.slice(0, 3).map((s) => ({ def: s.def, note: '' }))

  if (mentioned.length >= 2) {
    const free: Match = { def: freeMix(mentioned, text.trim()), note: 'শুধু তোমার লেখা রাসায়নিকগুলো নিয়ে' }
    const covered = scored.length > 0 && scored[0].extra === 0
    if (covered) out.push(free)
    else out.unshift(free)
  }
  return out.slice(0, 4)
}

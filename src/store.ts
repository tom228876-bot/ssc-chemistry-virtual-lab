import { create } from 'zustand'
import type { ChemKey } from './constants'
import { emptyContents, type Contents } from './lib/chemistry'
import { EXPS, type ExpDef } from './lib/catalog'

export type Side = 'Zn' | 'Cu'
export interface CellState {
  zn: Side | null
  cu: Side | null
  bridge: boolean
}

interface LabState {
  exp: ExpDef
  userText: string
  resetKey: number
  viewKey: number
  contents: Contents
  cell: CellState
  corked: boolean
  lime: number
  setCorked: (v: boolean) => void
  setLime: (x: number) => void
  setExp: (e: ExpDef, text?: string) => void
  reset: () => void
  resetView: () => void
  addChem: (k: ChemKey, ml: number) => void
  setCell: (p: Partial<CellState>) => void
}

const freshCell = (): CellState => ({ zn: null, cu: null, bridge: false })

export const useLab = create<LabState>((set) => ({
  exp: EXPS[0],
  userText: '',
  resetKey: 0,
  viewKey: 0,
  contents: emptyContents(),
  cell: freshCell(),
  corked: false,
  lime: 0,
  setExp: (exp, text = '') =>
    set((s) => ({ exp, userText: text, contents: emptyContents(), cell: freshCell(), corked: false, lime: 0, resetKey: s.resetKey + 1, viewKey: s.viewKey + 1 })),
  reset: () => set((s) => ({ contents: emptyContents(), cell: freshCell(), corked: false, lime: 0, resetKey: s.resetKey + 1 })),
  resetView: () => set((s) => ({ viewKey: s.viewKey + 1 })),
  addChem: (k, ml) => set((s) => ({ contents: { ...s.contents, [k]: s.contents[k] + ml } })),
  setCell: (p) => set((s) => ({ cell: { ...s.cell, ...p } })),
  setCorked: (corked) => set({ corked }),
  setLime: (lime) => set({ lime }),
}))

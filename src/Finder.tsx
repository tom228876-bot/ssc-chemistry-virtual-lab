import { useMemo, useState } from 'react'
import { search } from './lib/search'
import type { ExpDef } from './lib/catalog'
import { EXPS } from './lib/catalog'
import { useLab } from './store'

export default function Finder() {
  const [text, setText] = useState('')
  const [open, setOpen] = useState(false)
  const exp = useLab((s) => s.exp)
  const results = useMemo(() => search(text), [text])
  const nothing = text.trim() !== '' && results.length === 0
  const list = nothing ? EXPS.map((def) => ({ def, note: '' })) : results

  const pick = (def: ExpDef) => {
    useLab.getState().setExp(def, text.trim())
    setOpen(false)
  }

  return (
    <div className="finder">
      {open && <div className="fback" onClick={() => setOpen(false)} />}
      <input
        value={text}
        placeholder="কী পরীক্ষা করতে চাও? যেমন: HCl আর NaOH মিশিয়ে নিরপেক্ষ করব"
        onChange={(e) => {
          setText(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && list[0]) pick(list[0].def)
          if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && (
        <div className="fdrop">
          {nothing && <div className="fnone">এই নামে পরীক্ষা মেলেনি। রাসায়নিকের নাম লিখে দেখো (যেমন NaOH, CuSO₄), অথবা নিচের একটা বেছে নাও:</div>}
          {!nothing && text.trim() === '' && <div className="fnone">সব পরীক্ষা (বা উপরে নিজের পরীক্ষা লেখো):</div>}
          {list.map(({ def, note }) => (
            <button key={def.id} className={def.id === exp.id ? 'on' : ''} onClick={() => pick(def)}>
              <b>{def.name}</b>
              <small>{note ? note + ' · ' : ''}দরকার: {def.needs.slice(0, -1).map((n) => n.split(' ')[0]).join(', ') || def.needs.join(', ')}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

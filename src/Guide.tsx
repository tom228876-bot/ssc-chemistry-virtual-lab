import { useEffect, useState } from 'react'
import { useLab } from './store'
import { react } from './lib/chemistry'

export default function Guide() {
  const exp = useLab((s) => s.exp)
  const userText = useLab((s) => s.userText)
  const resetKey = useLab((s) => s.resetKey)
  const contents = useLab((s) => s.contents)
  const cell = useLab((s) => s.cell)
  const lime = useLab((s) => s.lime)
  const corked = useLab((s) => s.corked)
  const { steps, quiz } = exp

  const [done, setDone] = useState<boolean[]>([])
  const [secs, setSecs] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [open, setOpen] = useState(() => window.innerWidth > 760)
  const active = cell.zn === 'Zn' && cell.cu === 'Cu' && cell.bridge

  useEffect(() => {
    setDone([])
    setSecs(0)
    setAnswers({})
  }, [exp, resetKey])

  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setSecs((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    const ctx = { c: contents, cell, R: react(contents), secs, lime, corked }
    setDone((prev) => {
      let ok = true
      const next = steps.map((st, i) => {
        const v = !!prev[i] || (ok && st.check(ctx))
        ok = ok && v
        return v
      })
      return next.length === prev.length && next.every((v, i) => v === prev[i]) ? prev : next
    })
  }, [contents, cell, secs, steps, lime, corked])

  if (!open) {
    return (
      <button className="gpill" onClick={() => setOpen(true)}>
        📋 কাজের ধাপ
      </button>
    )
  }

  const count = steps.filter((_, i) => done[i]).length
  const current = steps.findIndex((_, i) => !done[i])
  const finished = count === steps.length
  const score = quiz.filter((q, i) => answers[i] === q.answer).length

  return (
    <div className="guide">
      <div className="ghead">
        <h3>{exp.name}</h3>
        <button className="gclose" onClick={() => setOpen(false)} aria-label="বন্ধ করো">✕</button>
      </div>
      {userText && <div className="gyou">তুমি লিখেছ: “{userText}”</div>}
      <div className="gneeds">
        <h4>প্রয়োজন</h4>
        {exp.needs.map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
      <div className="gbar"><span style={{ width: (count / steps.length) * 100 + '%' }} /></div>
      <ol className="gsteps">
        {steps.map((st, i) => (
          <li key={st.text} className={done[i] ? 'done' : i === current ? 'now' : ''}>
            <b>{done[i] ? '✓' : i + 1}</b>
            <span>{st.text}</span>
          </li>
        ))}
      </ol>
      {!finished && current >= 0 && <div className="ghint">💡 {steps[current].hint}</div>}
      {finished && quiz.length === 0 && (
        <div className="ghint">🎉 সব জিনিস মেশানো হয়েছে। নিচের পর্যবেক্ষণ ও সমীকরণ দেখো, তারপর "আবার শুরু" চেপে অন্য পরিমাণ চেষ্টা করো।</div>
      )}
      {finished && quiz.length > 0 && (
        <div className="gquiz">
          <h3>🎉 পরীক্ষা সম্পন্ন! এবার ভাইভা</h3>
          {quiz.map((q, qi) => {
            const a = answers[qi]
            return (
              <div key={q.q} className="gq">
                <div>{qi + 1}. {q.q}</div>
                {q.options.map((o, oi) => (
                  <button
                    key={o}
                    disabled={a !== undefined}
                    className={a === undefined ? '' : oi === q.answer ? 'ok' : oi === a ? 'bad' : ''}
                    onClick={() => setAnswers((s) => ({ ...s, [qi]: oi }))}
                  >
                    {o}
                  </button>
                ))}
                {a !== undefined && <div className="gwhy">{a === q.answer ? '✓ সঠিক। ' : '✗ ভুল। '}{q.why}</div>}
              </div>
            )
          })}
          {Object.keys(answers).length === quiz.length && (
            <div className="gscore">
              স্কোর: {score} / {quiz.length}
              <button onClick={() => setAnswers({})}>আবার চেষ্টা</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

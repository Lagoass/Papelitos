import { useEffect, useRef, useState } from 'react'
import { TEAM_SYMBOLS } from '../../utils/teams.js'

// Placar-show — UserInterface.md §6.2: "placar é show, não tabela".
// Linhas reveladas do ÚLTIMO para o PRIMEIRO lugar com stagger; pontos sobem
// com count-up sincronizado ao reveal de cada linha. Puro presentation —
// recebe [{ id, score }] já ordenado por score desc.
const STEP_MS = 450
const COUNT_MS = 700

const ScoreReveal = ({ ranked, highlightFirst = true }) => {
  // displayed[i] = valor atual do count-up da linha i
  const [displayed, setDisplayed] = useState(() => ranked.map(() => 0))
  const [revealed, setRevealed] = useState(() => ranked.map(() => false))
  const timersRef = useRef([])

  useEffect(() => {
    const timers = timersRef.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

    ranked.forEach((team, i) => {
      // último lugar (índice maior) revela primeiro
      const order = ranked.length - 1 - i
      const delay = reduced ? 0 : order * STEP_MS

      timers.push(setTimeout(() => {
        setRevealed(prev => prev.map((r, j) => (j === i ? true : r)))

        if (reduced) {
          setDisplayed(prev => prev.map((v, j) => (j === i ? team.score : v)))
          return
        }
        // count-up com desaceleração (easeOutCubic)
        const t0 = performance.now()
        const step = (t) => {
          const k = Math.min(1, (t - t0) / COUNT_MS)
          const eased = 1 - Math.pow(1 - k, 3)
          setDisplayed(prev =>
            prev.map((v, j) => (j === i ? Math.round(team.score * eased) : v))
          )
          if (k < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      }, delay))

      // Fallback: se o rAF for suprimido (aba em background/tela travada),
      // crava o valor final — o placar nunca pode ficar errado.
      timers.push(setTimeout(() => {
        setDisplayed(prev => prev.map((v, j) => (j === i ? team.score : v)))
      }, delay + COUNT_MS + 600))
    })

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="w-full space-y-2">
      {ranked.map((team, i) => (
        <div
          key={team.id}
          className={`flex items-center justify-between rounded-2xl py-3 px-5 border-2 bg-zinc-900 ${
            revealed[i] ? 'anim-fade-up' : 'opacity-0'
          } ${highlightFirst && i === 0 ? 'border-white' : 'border-zinc-700'}`}
        >
          <div className="flex items-center gap-4">
            <span className="text-zinc-500 text-sm w-5">{i + 1}º</span>
            <span className="text-2xl">{TEAM_SYMBOLS[team.id]}</span>
          </div>
          <p className="text-3xl font-black tabular-nums">{displayed[i]}</p>
        </div>
      ))}
    </div>
  )
}

export default ScoreReveal

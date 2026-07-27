import { useEffect, useRef, useState } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { TEAM_SYMBOLS, teamIdsFor } from '../../utils/teams.js'
import Button from '../../components/Button/index.jsx'
import { confettiRain } from '../../utils/confetti.js'
import { pick, CELEBRATIONS } from '../../data/copy.js'

// Pódio revelado em etapas (3º → 2º → 1º) + confete no campeão —
// UserInterface.md §6.2/§8.1. Clímax de vitória: única chuva da partida.
const PODIUM_STEP_MS = 750

const PODIUM_STYLE = {
  1: { height: 120, extra: 'bg-gradient-to-b from-amber-600 to-amber-800 border-amber-400' },
  2: { height: 86, extra: 'bg-zinc-800 border-zinc-600' },
  3: { height: 60, extra: 'bg-zinc-800 border-zinc-700' },
}

const PodiumCol = ({ place, team, visible }) => {
  const { height, extra } = PODIUM_STYLE[place]
  return (
    <div className={`flex flex-col items-center gap-2 w-24 ${visible ? 'anim-podium-rise' : 'opacity-0'}`}>
      <span className="text-3xl">{TEAM_SYMBOLS[team.id]}</span>
      <div
        className={`w-full rounded-t-2xl border border-b-0 flex flex-col items-center justify-center gap-0.5 ${extra}`}
        style={{ height }}
      >
        <span className="text-xl font-black">{place}º</span>
        <span className="text-xs opacity-80 tabular-nums">{team.score} pts</span>
      </div>
    </div>
  )
}

const ResultsScreen = () => {
  const { state, dispatch } = useGame()
  const { teams, numTeams } = state
  const ids = teamIdsFor(numTeams)

  const ranked = ids
    .map(id => ({ id, score: teams[id].score }))
    .sort((a, b) => b.score - a.score)

  const maxScore = ranked[0].score
  const winners = ranked.filter(t => t.score === maxScore).map(t => t.id)
  const tie = winners.length > 1

  // Pódio: top 3 (ou top 2 com 2 times). Revelação do pior pro melhor.
  const podium = ranked.slice(0, Math.min(3, ranked.length))
  const [revealStep, setRevealStep] = useState(0) // nº de colunas visíveis
  const [showRest, setShowRest] = useState(tie)
  const phrase = useRef(pick(CELEBRATIONS)).current

  useEffect(() => {
    if (tie) return
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
    const stepMs = reduced ? 0 : PODIUM_STEP_MS
    const timers = []

    podium.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setRevealStep(i + 1)
        try { navigator.vibrate?.(20) } catch { /* sem suporte */ }
        if (i === podium.length - 1) {
          confettiRain()
          try { navigator.vibrate?.([60, 40, 60, 40, 120]) } catch { /* sem suporte */ }
          setShowRest(true)
        }
      }, (i + 1) * stepMs))
    })

    return () => timers.forEach(clearTimeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Colunas na ordem visual [2º, 1º, 3º]; visibilidade segue a ordem 3º → 2º → 1º
  const visibleFor = (place) => revealStep >= podium.length - place + 1
  const cols = podium.length === 3
    ? [[2, podium[1]], [1, podium[0]], [3, podium[2]]]
    : [[2, podium[1]], [1, podium[0]]]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-7">
      {/* Resultado */}
      {tie ? (
        <div className="text-center">
          <p className="text-5xl font-black mb-2">🤝</p>
          <p className="text-3xl font-black">Empate!</p>
          <p className="text-zinc-400 mt-2">
            {winners.map(id => TEAM_SYMBOLS[id]).join(' e ')} · {maxScore} pontos
          </p>
        </div>
      ) : (
        <>
          <div className={`text-center ${showRest ? 'anim-fade-up' : 'opacity-0'}`}>
            <p className="text-4xl font-black">{phrase}</p>
            <p className="text-zinc-400 text-sm mt-1">Time {TEAM_SYMBOLS[winners[0]]} venceu</p>
          </div>

          {/* Pódio em etapas */}
          <div className="flex items-end justify-center gap-3 pt-2">
            {cols.map(([place, team]) => (
              <PodiumCol key={place} place={place} team={team} visible={visibleFor(place)} />
            ))}
          </div>
        </>
      )}

      {/* Ranking completo — só aparece com 4 times (o pódio não cobre todos) */}
      {ranked.length > 3 && (
        <div className={`w-full space-y-2 ${showRest ? 'anim-fade-up' : 'opacity-0'}`}>
          {ranked.slice(3).map((t, i) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-2xl py-3 px-5 border-2 border-zinc-700 bg-zinc-900"
            >
              <div className="flex items-center gap-4">
                <span className="text-zinc-500 text-sm w-5">{i + 4}º</span>
                <span className="text-2xl">{TEAM_SYMBOLS[t.id]}</span>
              </div>
              <p className="text-3xl font-black tabular-nums">{t.score}</p>
            </div>
          ))}
        </div>
      )}

      {/* localStorage já limpo pelo GameContext ao entrar em gameOver — seção 12 */}
      <div className={`w-full ${showRest ? 'anim-fade-up' : 'opacity-0'}`}>
        <Button variant="secondary" onClick={() => dispatch({ type: 'RESET_GAME' })}>
          Nova Partida
        </Button>
      </div>
    </div>
  )
}

export default ResultsScreen

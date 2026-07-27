import { useRef } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { ROUNDS } from '../../components/RoundBadge/index.jsx'
import ScoreReveal from '../../components/ScoreReveal/index.jsx'
import Button from '../../components/Button/index.jsx'
import { teamIdsFor } from '../../utils/teams.js'
import { pick, ROUND_DONE } from '../../data/copy.js'

const RoundTransitionScreen = () => {
  const { state, dispatch } = useGame()
  const { round, teams, numTeams } = state

  // round ainda tem o valor da rodada que terminou — seção 9
  const nextRound = ROUNDS[round + 1]

  // Frase sorteada uma vez por montagem (não a cada render)
  const doneLine = useRef(pick(ROUND_DONE)).current

  const ranked = teamIdsFor(numTeams)
    .map(id => ({ id, score: teams[id].score }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-6">
      <div className="pt-4 text-center">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Rodada {round} concluída</p>
        <p className="text-2xl font-bold">{doneLine}</p>
      </div>

      {/* Placar-show: reveal escalonado + count-up — UserInterface.md §6.2 */}
      <ScoreReveal ranked={ranked} highlightFirst={false} />

      {/* Próxima rodada */}
      {nextRound && (
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
            Próxima — Rodada {round + 1}
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{nextRound.icon}</span>
            <p className="text-xl font-bold">{nextRound.label}</p>
          </div>
          <p className="text-sm text-zinc-300 leading-snug">{nextRound.rule}</p>
        </div>
      )}

      <div className="mt-auto">
        <Button onClick={() => dispatch({ type: 'ADVANCE_ROUND' })}>
          Continuar
        </Button>
      </div>
    </div>
  )
}

export default RoundTransitionScreen

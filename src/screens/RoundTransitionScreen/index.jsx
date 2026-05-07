import { useGame } from '../../store/GameContext.jsx'
import { ROUNDS } from '../../components/RoundBadge/index.jsx'
import ScoreBoard from '../../components/ScoreBoard/index.jsx'
import Button from '../../components/Button/index.jsx'

const RoundTransitionScreen = () => {
  const { state, dispatch } = useGame()
  const { round } = state

  // round ainda tem o valor da rodada que terminou — seção 9
  const nextRound = ROUNDS[round + 1]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-6">
      <div className="pt-4 text-center">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Rodada {round} concluída</p>
        <p className="text-2xl font-bold">Todas as palavras foram adivinhadas!</p>
      </div>

      {/* Placar atual */}
      <ScoreBoard />

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

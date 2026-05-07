import { useGame } from '../../store/GameContext.jsx'
import { ROUNDS } from '../../components/RoundBadge/index.jsx'
import ScoreBoard from '../../components/ScoreBoard/index.jsx'
import Button from '../../components/Button/index.jsx'

const TiebreakerScreen = () => {
  const { state, dispatch } = useGame()
  const { teams } = state

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-5">
      <div className="pt-4 text-center">
        <p className="text-3xl font-black mb-1">Empate!</p>
        <p className="text-zinc-400 text-sm">
          Ambos os times terminaram com {teams.A.score} pontos.
        </p>
      </div>

      <ScoreBoard />

      {/* Sortear formato */}
      <Button onClick={() => dispatch({ type: 'RANDOMIZE_TIEBREAKER_FORMAT' })}>
        🎲 Sortear formato
      </Button>

      {/* Escolher formato manualmente */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
          Ou escolha o formato
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(fmt => (
            <button
              key={fmt}
              onClick={() => dispatch({ type: 'SELECT_TIEBREAKER_FORMAT', payload: fmt })}
              className="bg-zinc-800 rounded-xl py-4 px-3 text-center active:scale-95 transition-transform"
            >
              <span className="text-2xl block mb-1">{ROUNDS[fmt].icon}</span>
              <span className="text-sm font-semibold">{ROUNDS[fmt].label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto">
        <Button variant="ghost" onClick={() => dispatch({ type: 'GAME_OVER' })}>
          Aceitar Empate
        </Button>
      </div>
    </div>
  )
}

export default TiebreakerScreen

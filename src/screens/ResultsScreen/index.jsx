import { useGame } from '../../store/GameContext.jsx'
import { TEAM_COLORS } from '../../components/ScoreBoard/index.jsx'
import CountdownLock from '../../components/CountdownLock/index.jsx'

const ResultsScreen = () => {
  const { state, dispatch } = useGame()
  const { teams } = state

  const scoreA = teams.A.score
  const scoreB = teams.B.score
  const tie = scoreA === scoreB
  const winner = tie ? null : (scoreA > scoreB ? 'A' : 'B')

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-8">
      {/* Resultado */}
      <div className="text-center">
        {tie ? (
          <>
            <p className="text-5xl font-black mb-2">🤝</p>
            <p className="text-3xl font-black">Empate!</p>
            <p className="text-zinc-400 mt-2">{scoreA} pontos cada</p>
          </>
        ) : (
          <>
            <p className="text-5xl font-black mb-2">🏆</p>
            <p className="text-xl text-zinc-400 mb-1">Vencedor</p>
            <p
              className="text-5xl font-black"
              style={{ color: TEAM_COLORS[winner] }}
            >
              Time {winner}
            </p>
          </>
        )}
      </div>

      {/* Placar final */}
      <div className="w-full flex gap-4">
        {['A', 'B'].map(id => (
          <div
            key={id}
            className={`flex-1 rounded-2xl py-5 px-4 text-center border-2 transition-colors ${
              winner === id ? 'border-white' : 'border-zinc-700'
            } bg-zinc-900`}
          >
            <p
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: TEAM_COLORS[id] }}
            >
              Time {id}
            </p>
            <p className="text-5xl font-black" style={{ color: TEAM_COLORS[id] }}>
              {teams[id].score}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {teams[id].score === 1 ? 'ponto' : 'pontos'}
            </p>
          </div>
        ))}
      </div>

      {/* localStorage já limpo pelo GameContext ao entrar em gameOver — seção 12 */}
      <div className="w-full">
        <CountdownLock
          seconds={5}
          onConfirm={() => dispatch({ type: 'RESET_GAME' })}
          variant="secondary"
        >
          Nova Partida
        </CountdownLock>
      </div>
    </div>
  )
}

export default ResultsScreen

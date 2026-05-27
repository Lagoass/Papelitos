import { useGame } from '../../store/GameContext.jsx'
import { TEAM_SYMBOLS, teamIdsFor } from '../../utils/teams.js'
import Button from '../../components/Button/index.jsx'

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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 gap-8">
      {/* Resultado */}
      <div className="text-center">
        {tie ? (
          <>
            <p className="text-5xl font-black mb-2">🤝</p>
            <p className="text-3xl font-black">Empate!</p>
            <p className="text-zinc-400 mt-2">
              {winners.map(id => TEAM_SYMBOLS[id]).join(' e ')} · {maxScore} pontos
            </p>
          </>
        ) : (
          <>
            <p className="text-5xl font-black mb-2">🏆</p>
            <p className="text-xl text-zinc-400 mb-1">Vencedor</p>
            <p className="text-7xl font-black">{TEAM_SYMBOLS[winners[0]]}</p>
          </>
        )}
      </div>

      {/* Ranking final */}
      <div className="w-full space-y-2">
        {ranked.map((t, i) => {
          const isWinner = !tie && i === 0
          return (
            <div
              key={t.id}
              className={`flex items-center justify-between rounded-2xl py-4 px-5 border-2 transition-colors ${
                isWinner ? 'border-white bg-zinc-900' : 'border-zinc-700 bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="text-zinc-500 text-sm w-5">{i + 1}º</span>
                <span className="text-3xl">{TEAM_SYMBOLS[t.id]}</span>
              </div>
              <div className="text-right">
                <p className="text-4xl font-black">{t.score}</p>
                <p className="text-xs text-zinc-500">
                  {t.score === 1 ? 'ponto' : 'pontos'}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* localStorage já limpo pelo GameContext ao entrar em gameOver — seção 12 */}
      <div className="w-full">
        <Button variant="secondary" onClick={() => dispatch({ type: 'RESET_GAME' })}>
          Nova Partida
        </Button>
      </div>
    </div>
  )
}

export default ResultsScreen

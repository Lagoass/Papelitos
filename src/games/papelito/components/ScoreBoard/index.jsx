import { useGame } from '../../store/GameContext.jsx'
import { TEAM_SYMBOLS, teamIdsFor } from '../../utils/teams.js'

// Mantido como export para compatibilidade — agora todas as cores são neutras (símbolos diferenciam os times)
export const TEAM_COLORS = { A: '#ffffff', B: '#ffffff', C: '#ffffff', D: '#ffffff' }

const TeamCard = ({ id, score, highlight }) => (
  <div
    className={`rounded-xl py-3 px-4 text-center transition-colors ${
      highlight ? 'bg-zinc-700' : 'bg-zinc-800'
    }`}
  >
    <p className="text-2xl mb-1">{TEAM_SYMBOLS[id]}</p>
    <p className="text-3xl font-black">{score}</p>
  </div>
)

const ScoreBoard = ({ highlight }) => {
  const { state } = useGame()
  const { teams, numTeams, teamOrder } = state

  // Usa teamOrder definido pela roleta. Fallback para ordem natural enquanto não há sorteio.
  const ids = teamOrder.length === numTeams ? teamOrder : teamIdsFor(numTeams)

  if (numTeams === 3) {
    // 3 times: dois primeiros em cima, terceiro centralizado embaixo
    const [first, second, third] = ids
    return (
      <div className="w-full space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TeamCard id={first} score={teams[first].score} highlight={highlight === first} />
          <TeamCard id={second} score={teams[second].score} highlight={highlight === second} />
        </div>
        <div className="flex justify-center">
          <div className="w-1/2">
            <TeamCard id={third} score={teams[third].score} highlight={highlight === third} />
          </div>
        </div>
      </div>
    )
  }

  // 2 times: 1 linha de 2; 4 times: grid 2x2 — em ambos basta mapear ids na ordem
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {ids.map(id => (
        <TeamCard key={id} id={id} score={teams[id].score} highlight={highlight === id} />
      ))}
    </div>
  )
}

export default ScoreBoard

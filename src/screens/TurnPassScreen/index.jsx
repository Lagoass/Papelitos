import { useGame } from '../../store/GameContext.jsx'
import { getColor } from '../../utils/colors.js'
import { TEAM_COLORS } from '../../components/ScoreBoard/index.jsx'
import ScoreBoard from '../../components/ScoreBoard/index.jsx'
import RoundBadge from '../../components/RoundBadge/index.jsx'
import Button from '../../components/Button/index.jsx'

const TurnPassScreen = () => {
  const { state, dispatch } = useGame()
  const { currentTeamId, teams, round, tiebreakerFormat } = state

  const team = teams[currentTeamId]
  const currentPlayerIndex = team.playerIndices[team.queuePos % team.playerIndices.length]
  const teamColor = TEAM_COLORS[currentTeamId]
  const playerColor = getColor(currentPlayerIndex)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-5">
      {/* Indicador de time e jogador */}
      <div className="text-center pt-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Próximo turno</p>
        <p className="text-4xl font-black" style={{ color: teamColor }}>
          Time {currentTeamId}
        </p>
        <p className="text-sm mt-2" style={{ color: playerColor }}>
          Jogador {currentPlayerIndex + 1}
        </p>
      </div>

      {/* Placar */}
      <ScoreBoard highlight={currentTeamId} />

      {/* Regra da rodada atual */}
      <RoundBadge round={round} tiebreakerFormat={tiebreakerFormat} />

      <div className="mt-auto">
        <Button onClick={() => dispatch({ type: 'TURN_CONFIRMED' })}>
          Estou pronto
        </Button>
      </div>
    </div>
  )
}

export default TurnPassScreen

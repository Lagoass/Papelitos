import { useGame } from '../../store/GameContext.jsx'
import { getColor } from '../../utils/colors.js'
import { TEAM_SYMBOLS } from '../../utils/teams.js'
import ScoreBoard from '../../components/ScoreBoard/index.jsx'
import RoundBadge from '../../components/RoundBadge/index.jsx'
import Button from '../../components/Button/index.jsx'

const TurnPassScreen = () => {
  const { state, dispatch } = useGame()
  const { currentTeamId, teams, round, tiebreakerFormat, players } = state

  const team = teams[currentTeamId]
  const currentPlayerIndex = team.playerIndices[team.queuePos % team.playerIndices.length]
  const playerColor = getColor(currentPlayerIndex)
  const playerName = players[currentPlayerIndex]?.name?.trim() || `Jogador ${currentPlayerIndex + 1}`

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-5">
      {/* Indicador de time e jogador */}
      <div className="text-center pt-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Próximo turno</p>
        <p className="text-7xl font-black leading-none">
          {TEAM_SYMBOLS[currentTeamId]}
        </p>
        <p className="text-sm mt-3" style={{ color: playerColor }}>
          {playerName}
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

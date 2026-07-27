import { useEffect, useState } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { getColor } from '../../utils/colors.js'
import { TEAM_SYMBOLS } from '../../utils/teams.js'
import ScoreBoard from '../../components/ScoreBoard/index.jsx'
import RoundBadge from '../../components/RoundBadge/index.jsx'
import Button from '../../components/Button/index.jsx'
import { IDLE_CALL, IDLE_SUBTEXT, pick } from '../../data/copy.js'

// Reação à inação (princípio Jackbox) — UserInterface.md §5: se ninguém
// confirma em IDLE_MS, a interface cobra o jogador pelo nome.
const IDLE_MS = 10000

const TurnPassScreen = () => {
  const { state, dispatch } = useGame()
  const { currentTeamId, round, tiebreakerFormat, players, currentPlayerIndex } = state

  const playerColor = getColor(currentPlayerIndex)
  const playerName = players[currentPlayerIndex]?.name?.trim() || `Jogador ${currentPlayerIndex + 1}`

  const [idle, setIdle] = useState(null) // { call, sub } quando dispara

  useEffect(() => {
    const t = setTimeout(() => {
      setIdle({ call: IDLE_CALL(playerName), sub: pick(IDLE_SUBTEXT) })
      try { navigator.vibrate?.(40) } catch { /* sem suporte */ }
    }, IDLE_MS)
    return () => clearTimeout(t)
  }, [playerName])

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-5">
      {/* Indicador de time e jogador */}
      <div className="text-center pt-4">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Próximo turno</p>
        <p className="text-7xl font-black leading-none">
          {TEAM_SYMBOLS[currentTeamId]}
        </p>
        <p
          className={`text-sm mt-3 ${idle ? 'anim-wiggle font-bold' : ''}`}
          style={{ color: playerColor }}
        >
          {idle ? idle.call : playerName}
        </p>
        {idle && (
          <p className="text-xs text-zinc-500 mt-1">{idle.sub}</p>
        )}
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

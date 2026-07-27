import { useEffect, useMemo, useState } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { getColor, shade } from '../../utils/colors.js'
import { TEAM_SYMBOLS, teamIdsFor } from '../../utils/teams.js'
import { ROUNDS } from '../../components/RoundBadge/index.jsx'
import Button from '@shell/components/Button/index.jsx'
import { haptics } from '@shell/utils/haptics.js'
import { IDLE_CALL, IDLE_SUBTEXT, TAUNT_AHEAD, TAUNT_BEHIND, TAUNT_TIED, pick } from '../../data/copy.js'

// O PALCO — UserInterface.md §6.2: a tela de passagem é o momento de pressão
// social. Fundo inteiro na cor de quem joga, nome GIGANTE, provocação
// competitiva e UMA decisão. Reage à inação (princípio Jackbox).
const IDLE_MS = 10000

const TurnPassScreen = () => {
  const { state, dispatch } = useGame()
  const { currentTeamId, round, tiebreakerFormat, players, currentPlayerIndex, teams, numTeams } = state

  const playerColor = getColor(currentPlayerIndex)
  const playerName = players[currentPlayerIndex]?.name?.trim() || `Jogador ${currentPlayerIndex + 1}`
  const roundInfo = ROUNDS[tiebreakerFormat !== null ? tiebreakerFormat : round]
  const roundLabel = tiebreakerFormat !== null ? 'Desempate' : `Rodada ${round}`

  const [idle, setIdle] = useState(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setIdle({ call: IDLE_CALL(playerName), sub: pick(IDLE_SUBTEXT) })
      haptics.attention()
    }, IDLE_MS)
    return () => clearTimeout(t)
  }, [playerName])

  // Provocação competitiva: posição do time da vez em relação ao melhor rival.
  // Sorteada uma vez por montagem para não trocar a cada render.
  const taunt = useMemo(() => {
    const ids = teamIdsFor(numTeams)
    const myScore = teams[currentTeamId].score
    const bestOther = Math.max(...ids.filter(id => id !== currentTeamId).map(id => teams[id].score))
    if (myScore === 0 && bestOther === 0) return null // início de jogo: sem provocação vazia
    const diff = myScore - bestOther
    if (diff > 0) return TAUNT_AHEAD(diff)
    if (diff < 0) return TAUNT_BEHIND(-diff)
    return TAUNT_TIED()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Placar compacto ordenado pela teamOrder (fallback: ordem natural)
  const ids = state.teamOrder.length === numTeams ? state.teamOrder : teamIdsFor(numTeams)

  return (
    <div
      className="min-h-screen text-white flex flex-col p-6 transition-colors duration-700"
      style={{ background: `linear-gradient(165deg, ${shade(playerColor, 0.55)}, ${shade(playerColor, 0.22)})` }}
    >
      {/* Rodada — chip compacto no topo */}
      <div className="anim-fade-up flex items-center justify-center pt-2">
        <span className="bg-black/30 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
          {roundInfo.icon} {roundLabel} — {roundInfo.label}
        </span>
      </div>

      {/* O jogador — protagonista absoluto */}
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
          Próximo turno · Time {TEAM_SYMBOLS[currentTeamId]}
        </p>
        <p className={`font-display font-bold leading-none text-[clamp(3rem,16vw,4.5rem)] break-words max-w-full ${idle ? 'anim-wiggle' : ''}`}>
          {idle ? idle.call : playerName}
        </p>
        <p className="text-sm text-white/75 min-h-[1.25rem] max-w-[36ch]">
          {idle ? idle.sub : (taunt ?? roundInfo.rule)}
        </p>
      </div>

      {/* Placar compacto — rivalidade sempre visível */}
      <div className="anim-fade-up flex justify-center gap-2 mb-5" style={{ animationDelay: '120ms' }}>
        {ids.map(id => (
          <div
            key={id}
            className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              id === currentTeamId ? 'bg-white text-black' : 'bg-black/30 text-white'
            }`}
          >
            <span className="text-base leading-none">{TEAM_SYMBOLS[id]}</span>
            <span className="font-display font-bold text-lg leading-none tabular-nums">{teams[id].score}</span>
          </div>
        ))}
      </div>

      {/* Uma decisão */}
      <Button
        onClick={() => dispatch({ type: 'TURN_CONFIRMED' })}
        className="min-h-16 text-xl font-display shadow-[0_12px_32px_rgba(0,0,0,0.35)]"
      >
        Sou eu, bora! 🎬
      </Button>
    </div>
  )
}

export default TurnPassScreen

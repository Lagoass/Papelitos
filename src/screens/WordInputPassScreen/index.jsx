import { useState } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import Button from '../../components/Button/index.jsx'
import { TEAM_SYMBOLS, teamIdsFor } from '../../utils/teams.js'

const WordInputPassScreen = () => {
  const { state, dispatch } = useGame()
  const { players, teams, numTeams } = state
  const [showConfirm, setShowConfirm] = useState(false)
  const teamIds = teamIdsFor(numTeams)

  const canStart =
    players.length >= 2 * numTeams &&
    teamIds.every(id => teams[id].playerIndices.length >= 2)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <p className="text-2xl font-semibold mb-3">
          Passe o celular para o próximo jogador.
        </p>
        <p className="text-zinc-400 text-sm">
          {players.length} {players.length === 1 ? 'jogador' : 'jogadores'} cadastrado{players.length === 1 ? '' : 's'}
        </p>
        <p className="text-zinc-400 text-sm mt-1">
          {teamIds.map(id => `${TEAM_SYMBOLS[id]} ${teams[id].playerIndices.length}`).join('  ·  ')}
        </p>
      </div>

      <div className="w-full space-y-4">
        <Button onClick={() => dispatch({ type: 'NEXT_PLAYER' })}>
          Próximo Jogador
        </Button>

        {canStart && (
          <Button variant="secondary" onClick={() => setShowConfirm(true)}>
            Iniciar Jogo
          </Button>
        )}
      </div>

      {/* Overlay de confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-50">
          <p className="text-xl font-semibold text-center mb-2">
            Tem certeza que deseja iniciar o jogo?
          </p>
          <p className="text-zinc-400 text-sm text-center mb-10">
            {players.length} jogadores · {state.pool.length} palavras no pool
          </p>
          <div className="w-full space-y-4">
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Não
            </Button>
            <Button onClick={() => dispatch({ type: 'START_GAME' })}>
              Sim, iniciar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WordInputPassScreen

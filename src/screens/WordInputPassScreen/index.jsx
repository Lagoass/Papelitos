import { useState } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import Button from '../../components/Button/index.jsx'
import CountdownLock from '../../components/CountdownLock/index.jsx'

const WordInputPassScreen = () => {
  const { state, dispatch } = useGame()
  const { players, teams } = state
  const [showConfirm, setShowConfirm] = useState(false)

  const canStart =
    players.length >= 4 &&
    teams.A.playerIndices.length >= 2 &&
    teams.B.playerIndices.length >= 2

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10">
        <p className="text-2xl font-semibold mb-3">
          Passe o celular para o próximo jogador.
        </p>
        <p className="text-zinc-400 text-sm">
          {players.length} {players.length === 1 ? 'jogador' : 'jogadores'} cadastrado{players.length === 1 ? '' : 's'}
          {' · '}Time A: {teams.A.playerIndices.length}
          {' · '}Time B: {teams.B.playerIndices.length}
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
            <CountdownLock seconds={5} onConfirm={() => dispatch({ type: 'START_GAME' })}>
              Sim, iniciar
            </CountdownLock>
          </div>
        </div>
      )}
    </div>
  )
}

export default WordInputPassScreen

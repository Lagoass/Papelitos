import { useEffect } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import useTimer from '../../hooks/useTimer.js'
import useWakeLock from '../../hooks/useWakeLock.js'
import WordCard from '../../components/WordCard/index.jsx'
import Timer from '../../components/Timer/index.jsx'
import RoundBadge from '../../components/RoundBadge/index.jsx'
import Button from '../../components/Button/index.jsx'

const TurnScreen = () => {
  const { state, dispatch } = useGame()
  const { currentWord, turnDuration, round, tiebreakerFormat, turnHits } = state

  const timer = useTimer({
    duration: turnDuration,
    onEnd: () => dispatch({ type: 'END_TURN' }),
  })

  // Inicia o timer na montagem; reseta na desmontagem — seção 8.7
  useEffect(() => {
    timer.start()
    return () => timer.reset()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Wake Lock ativo enquanto TurnScreen está montada — seção 9
  useWakeLock(true)

  if (!currentWord) return null

  return (
    <div className="min-h-screen bg-black text-white flex flex-col p-6 gap-4">
      {/* Timer + acertos */}
      <div className="flex items-center justify-between pt-2">
        <Timer timeLeft={timer.timeLeft} duration={turnDuration} />
        <div className="text-right">
          <p className="text-4xl font-black">{turnHits}</p>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            {turnHits === 1 ? 'acerto' : 'acertos'}
          </p>
        </div>
      </div>

      {/* Palavra */}
      <WordCard word={currentWord} />

      {/* Regra da rodada */}
      <RoundBadge round={round} tiebreakerFormat={tiebreakerFormat} />

      {/* Ações */}
      <div className="mt-auto flex flex-col gap-3">
        <Button onClick={() => dispatch({ type: 'HIT' })}>
          ✅ Acertou
        </Button>
        <Button variant="secondary" onClick={() => dispatch({ type: 'SKIP' })}>
          ⏭️ Pular
        </Button>
      </div>
    </div>
  )
}

export default TurnScreen

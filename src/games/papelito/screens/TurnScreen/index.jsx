import { useEffect } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import useTimer from '../../hooks/useTimer.js'
import useWakeLock from '../../hooks/useWakeLock.js'
import { getColor } from '../../utils/colors.js'
import { ROUNDS } from '../../components/RoundBadge/index.jsx'
import WordCard from '../../components/WordCard/index.jsx'
import Timer from '../../components/Timer/index.jsx'
import Button from '@shell/components/Button/index.jsx'
import { confettiBurst } from '@shell/utils/confetti.js'
import { haptics } from '@shell/utils/haptics.js'

// A ARENA — UserInterface.md §6.2 "zero cromo": durante o turno só existem
// a palavra, o tempo e os acertos. A regra completa ficou no palco; aqui só
// um lembrete de uma linha. Cada acerto é recompensado (bump + burst + haptic).
const TurnScreen = () => {
  const { state, dispatch } = useGame()
  const { currentWord, turnDuration, round, tiebreakerFormat, turnHits, currentPlayerIndex } = state

  const timer = useTimer({
    duration: turnDuration,
    onEnd: () => dispatch({ type: 'END_TURN' }),
  })

  // Inicia o timer na montagem; reseta na desmontagem — spec §8.7
  useEffect(() => {
    timer.start()
    return () => timer.reset()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Wake Lock ativo enquanto TurnScreen está montada
  useWakeLock(true)

  if (!currentWord) return null

  const { turnSkips } = state
  const playerColor = getColor(currentPlayerIndex)
  const roundInfo = ROUNDS[tiebreakerFormat !== null ? tiebreakerFormat : round]
  const roundLabel = tiebreakerFormat !== null ? 'Desempate' : `Rodada ${round}`

  const handleHit = (e) => {
    haptics.hit()
    confettiBurst(e.clientX || window.innerWidth / 2, e.clientY || window.innerHeight * 0.8)
    dispatch({ type: 'HIT' })
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col p-6 gap-4 overflow-hidden">
      {/* Tinta sutil da cor de quem descreve — a arena é dele */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% -10%, ${playerColor}2e, transparent 55%)` }}
        aria-hidden="true"
      />

      {/* Timer + acertos */}
      <div className="relative flex items-center justify-between pt-2">
        <Timer timeLeft={timer.timeLeft} duration={turnDuration} />
        <div className="text-right">
          {/* key={turnHits}: remonta a cada acerto → o número PIPOCA */}
          <p key={turnHits} className="font-display text-5xl font-bold tabular-nums anim-score-bump">
            {turnHits}
          </p>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">
            {turnHits === 1 ? 'acerto' : 'acertos'}
          </p>
        </div>
      </div>

      {/* A palavra domina a tela */}
      <div className="relative flex-1 flex flex-col min-h-0">
        <WordCard word={currentWord} />
      </div>

      {/* Lembrete de uma linha — a regra completa ficou no palco */}
      <p className="relative text-center text-xs text-zinc-500 uppercase tracking-widest">
        {roundInfo.icon} {roundLabel} — {roundInfo.label}
      </p>

      {/* Ações — herói embaixo, zona do polegar */}
      <div className="relative flex flex-col gap-3">
        <Button variant="success" onClick={handleHit} className="min-h-16 text-xl font-display">
          ✅ Acertou!
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'BACK' })}
            disabled={turnSkips === 0}
            className="py-3 text-base"
          >
            ↩️ Voltar
          </Button>
          <Button
            variant="secondary"
            onClick={() => dispatch({ type: 'SKIP' })}
            className="py-3 text-base"
          >
            ⏭️ Pular
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TurnScreen

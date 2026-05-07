import { useState, useEffect, useRef } from 'react'
import { useGame } from '../../store/GameContext.jsx'

// Delays em ms — começa rápido e vai desacelerando (efeito slot machine)
const SPIN_DELAYS = [70, 70, 80, 80, 90, 100, 120, 150, 180, 220, 270, 330, 400, 480, 560]

const RouletteScreen = () => {
  const { dispatch } = useGame()
  // Time determinado uma única vez antes da animação — seção 9
  const winner = useRef(Math.random() < 0.5 ? 'A' : 'B').current

  const [current, setCurrent] = useState('A')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let step = 0
    let timeout

    const tick = () => {
      setCurrent(prev => (prev === 'A' ? 'B' : 'A'))
      step++
      if (step < SPIN_DELAYS.length) {
        timeout = setTimeout(tick, SPIN_DELAYS[step])
      } else {
        // Força o winner e aguarda antes de disparar ROULETTE_DONE
        setCurrent(winner)
        setDone(true)
        timeout = setTimeout(() => {
          dispatch({ type: 'ROULETTE_DONE', payload: winner })
        }, 1400)
      }
    }

    timeout = setTimeout(tick, SPIN_DELAYS[0])
    return () => clearTimeout(timeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-6">
      <p className="text-zinc-400 text-lg">Sorteando o time inicial...</p>

      <div
        className={`w-44 h-44 rounded-full flex items-center justify-center border-4 transition-colors duration-200 ${
          done ? 'border-white' : 'border-zinc-700'
        }`}
      >
        <span className="text-8xl font-black">{current}</span>
      </div>

      <div className="h-8">
        {done && (
          <p className="text-2xl font-bold text-center animate-pulse">
            Time {winner} começa!
          </p>
        )}
      </div>
    </div>
  )
}

export default RouletteScreen

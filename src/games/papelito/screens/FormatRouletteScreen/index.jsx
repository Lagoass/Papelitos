import { useState, useEffect, useRef } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { ROUNDS } from '../../components/RoundBadge/index.jsx'

const SPIN_DELAYS = [70, 70, 80, 80, 90, 100, 120, 150, 180, 220, 270, 330, 400, 480, 560]
const FORMAT_KEYS = [1, 2, 3, 4]

const FormatRouletteScreen = () => {
  const { dispatch } = useGame()
  const winner = useRef(FORMAT_KEYS[Math.floor(Math.random() * FORMAT_KEYS.length)]).current

  const [current, setCurrent] = useState(1)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let step = 0
    let timeout

    const tick = () => {
      setCurrent(prev => FORMAT_KEYS[(FORMAT_KEYS.indexOf(prev) + 1) % FORMAT_KEYS.length])
      step++
      if (step < SPIN_DELAYS.length) {
        timeout = setTimeout(tick, SPIN_DELAYS[step])
      } else {
        setCurrent(winner)
        setDone(true)
        timeout = setTimeout(() => {
          dispatch({ type: 'FORMAT_ROULETTE_DONE', payload: winner })
        }, 1600)
      }
    }

    timeout = setTimeout(tick, SPIN_DELAYS[0])
    return () => clearTimeout(timeout)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const round = ROUNDS[current]

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-8 p-6">
      <p className="text-zinc-400 text-lg">Sorteando o formato...</p>

      <div
        className={`w-52 h-52 rounded-3xl flex flex-col items-center justify-center border-4 transition-colors duration-200 gap-2 ${
          done ? 'border-white' : 'border-zinc-700'
        }`}
      >
        <span className="text-7xl">{round.icon}</span>
        <span className="text-lg font-bold">{round.label}</span>
      </div>

      <div className="h-12 text-center">
        {done && (
          <>
            <p className="text-2xl font-bold animate-pulse">{round.label}!</p>
            <p className="text-zinc-500 text-sm mt-1">{round.rule}</p>
          </>
        )}
      </div>
    </div>
  )
}

export default FormatRouletteScreen

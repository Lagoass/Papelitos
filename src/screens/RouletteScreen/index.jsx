import { useState, useEffect, useRef } from 'react'
import { useGame } from '../../store/GameContext.jsx'
import { TEAM_SYMBOLS, teamIdsFor } from '../../utils/teams.js'
import { shuffle } from '../../utils/shuffle.js'

// Delays em ms — começa rápido e vai desacelerando (efeito slot machine)
const SPIN_DELAYS = [70, 70, 80, 80, 90, 100, 120, 150, 180, 220, 270, 330, 400, 480, 560]

const RouletteScreen = () => {
  const { state, dispatch } = useGame()
  const { numTeams, tiebreakerFormat, tiebreakerTeams } = state

  // Define quais times participam: desempate filtra para os empatados
  const isTiebreaker = tiebreakerFormat !== null && tiebreakerTeams.length > 0
  const eligibleIds = isTiebreaker ? tiebreakerTeams : teamIdsFor(numTeams)

  // teamOrder embaralhada uma única vez antes da animação
  const teamOrder = useRef(shuffle([...eligibleIds])).current
  const firstTeam = teamOrder[0]

  const [current, setCurrent] = useState(eligibleIds[0])
  const [done, setDone] = useState(false)

  useEffect(() => {
    let step = 0
    let timeout

    const tick = () => {
      setCurrent(prev => {
        const idx = eligibleIds.indexOf(prev)
        return eligibleIds[(idx + 1) % eligibleIds.length]
      })
      step++
      if (step < SPIN_DELAYS.length) {
        timeout = setTimeout(tick, SPIN_DELAYS[step])
      } else {
        setCurrent(firstTeam)
        setDone(true)
        timeout = setTimeout(() => {
          dispatch({ type: 'ROULETTE_DONE', payload: { teamOrder, firstTeam } })
        }, 2200)
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
        <span className="text-8xl">{TEAM_SYMBOLS[current]}</span>
      </div>

      <div className="min-h-[5rem] text-center">
        {done && (
          <>
            <p className="text-2xl font-bold animate-pulse mb-3">
              {TEAM_SYMBOLS[firstTeam]} começa!
            </p>
            {teamOrder.length > 1 && (
              <p className="text-zinc-500 text-sm">
                Ordem: {teamOrder.map(id => TEAM_SYMBOLS[id]).join('  →  ')}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default RouletteScreen

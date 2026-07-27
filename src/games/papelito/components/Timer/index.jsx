import { useEffect } from 'react'
import { haptics } from '@shell/utils/haptics.js'

const R = 54
const CIRCUMFERENCE = 2 * Math.PI * R

// Faixas de urgência — UserInterface.md §6.2: neutro → âmbar → vermelho.
// Limiares em segundos com teto proporcional para durações curtas.
const warnAt = (duration) => Math.min(20, Math.floor(duration * 0.5))
const dangerAt = (duration) => Math.min(10, Math.floor(duration * 0.25))

const Timer = ({ timeLeft, duration }) => {
  const progress = duration > 0 ? timeLeft / duration : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  const danger = timeLeft <= dangerAt(duration)
  const warn = !danger && timeLeft <= warnAt(duration)

  // Vibração como sinal de urgência (Android; no-op em iOS) — §3.5
  useEffect(() => {
    if (timeLeft === 0) haptics.timeUp()
    else if (danger) haptics.warn()
  }, [timeLeft, danger])

  // Neutro herda do tema (text-white é sobrescrito pelos temas claros);
  // âmbar/vermelho são fixos — legíveis em qualquer tema.
  const bandColor = danger ? '#ef4444' : warn ? '#f59e0b' : 'currentColor'

  return (
    <div className="relative flex items-center justify-center text-white">
      <svg width="136" height="136" className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle cx="68" cy="68" r={R} fill="none" stroke="#27272a" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          cx="68" cy="68" r={R}
          fill="none"
          stroke={bandColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
        />
      </svg>
      <span
        className={`absolute font-display text-4xl font-bold tabular-nums select-none transition-colors duration-500 ${
          danger ? 'anim-timer-urgency' : ''
        }`}
        style={{ color: bandColor }}
      >
        {timeLeft}
      </span>
    </div>
  )
}

export default Timer

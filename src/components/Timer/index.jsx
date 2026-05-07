const R = 54
const CIRCUMFERENCE = 2 * Math.PI * R

const timerColor = (progress) => {
  if (progress > 0.35) return '#22c55e'
  if (progress > 0.15) return '#eab308'
  return '#ef4444'
}

const Timer = ({ timeLeft, duration }) => {
  const progress = duration > 0 ? timeLeft / duration : 0
  const dashOffset = CIRCUMFERENCE * (1 - progress)
  const color = timerColor(progress)

  return (
    <div className="relative flex items-center justify-center">
      <svg width="136" height="136" className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle cx="68" cy="68" r={R} fill="none" stroke="#27272a" strokeWidth="10" />
        {/* Progress arc */}
        <circle
          cx="68" cy="68" r={R}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 0.95s linear, stroke 0.4s ease' }}
        />
      </svg>
      <span
        className="absolute text-4xl font-black tabular-nums select-none"
        style={{ color }}
      >
        {timeLeft}
      </span>
    </div>
  )
}

export default Timer

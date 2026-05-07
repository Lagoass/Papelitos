import { useGame } from '../../store/GameContext.jsx'

export const TEAM_COLORS = { A: '#60a5fa', B: '#fb923c' }

const ScoreBoard = ({ highlight }) => {
  const { state } = useGame()
  const { teams } = state

  return (
    <div className="flex gap-3 w-full">
      {['A', 'B'].map(id => (
        <div
          key={id}
          className={`flex-1 rounded-xl py-3 px-4 text-center transition-colors ${
            highlight === id ? 'bg-zinc-700' : 'bg-zinc-800'
          }`}
        >
          <p className="text-xs text-zinc-400 mb-1 uppercase tracking-widest">Time {id}</p>
          <p className="text-3xl font-black" style={{ color: TEAM_COLORS[id] }}>
            {teams[id].score}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ScoreBoard

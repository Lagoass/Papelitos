import { getColor } from '../../utils/colors.js'

const WordCard = ({ word }) => {
  const color = getColor(word.playerIndex)

  return (
    <div
      className="w-full rounded-3xl border-2 flex items-center justify-center py-14 px-6"
      style={{ borderColor: color, backgroundColor: `${color}18` }}
    >
      <span
        className="text-4xl font-black text-center leading-tight break-words"
        style={{ color }}
      >
        {word.text}
      </span>
    </div>
  )
}

export default WordCard

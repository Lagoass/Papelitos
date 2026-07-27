import { getColor } from '../../utils/colors.js'

// A palavra é a protagonista da arena — ocupa todo o espaço disponível,
// tipografia display gigante, na cor de quem a criou (identidade do pool).
const WordCard = ({ word }) => {
  const color = getColor(word.playerIndex)

  return (
    <div
      className="flex-1 w-full rounded-3xl border-2 flex items-center justify-center px-6 py-10"
      style={{ borderColor: color, backgroundColor: `${color}18` }}
    >
      <span
        className="font-display font-bold text-center leading-tight break-words max-w-full text-[clamp(2.5rem,11vw,4rem)]"
        style={{ color }}
      >
        {word.text}
      </span>
    </div>
  )
}

export default WordCard

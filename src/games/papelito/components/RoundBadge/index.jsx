export const ROUNDS = {
  1: {
    label: 'Livre',
    icon:  '🗣️',
    rule:  'Use qualquer descrição. Proibido dizer a palavra, traduções ou derivações.',
  },
  2: {
    label: 'Uma Palavra',
    icon:  '☝️',
    rule:  'Diga exatamente uma palavra como dica. Proibido gestos ou sons.',
  },
  3: {
    label: 'Mímica',
    icon:  '🤹',
    rule:  'Apenas gestos e expressões. Proibido qualquer som.',
  },
  4: {
    label: 'Som',
    icon:  '🔊',
    rule:  'Apenas sons, barulhos e onomatopeias. Proibido palavras e gestos explicativos.',
  },
}

// tiebreakerFormat overrides round when not null — seção 9 (TurnPassScreen + TurnScreen)
const RoundBadge = ({ round, tiebreakerFormat }) => {
  const key = tiebreakerFormat !== null ? tiebreakerFormat : round
  const info = ROUNDS[key]
  if (!info) return null

  const label = tiebreakerFormat !== null ? 'Desempate' : `Rodada ${key}`

  return (
    <div className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
      <div className="flex items-center gap-3 mb-1">
        <span className="text-2xl leading-none">{info.icon}</span>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">{label}</p>
          <p className="font-bold text-sm">{info.label}</p>
        </div>
      </div>
      <p className="text-xs text-zinc-400 leading-snug mt-2">{info.rule}</p>
    </div>
  )
}

export default RoundBadge

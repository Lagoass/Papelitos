// Voz do app — UserInterface.md §5.
// Regra: humor de UMA linha; clareza vence a piada. Teste de cada string:
// "isso atrasa a leitura de alguém distraído numa festa?"
// Variação aleatória (nunca a mesma frase duas vezes seguidas) via pick().

let lastPick = null

export const pick = (arr) => {
  if (arr.length === 1) return arr[0]
  let chosen
  do {
    chosen = arr[Math.floor(Math.random() * arr.length)]
  } while (chosen === lastPick)
  lastPick = chosen
  return chosen
}

// Vitória — ResultsScreen
export const CELEBRATIONS = [
  'LAVOU! 🧼',
  'Massacre. 💀',
  'Que time! 🔥',
  'Absurdo. 🤯',
  'Lenda viva. 🏆',
  'Deu aula. 📚',
]

// Fim de rodada — RoundTransitionScreen
export const ROUND_DONE = [
  'Limparam tudo!',
  'Pool zerado! 🧹',
  'Todas adivinhadas!',
  'Acabaram os papelitos!',
]

// Provocação competitiva — TurnPassScreen (rivalidade é o motor da festa).
// Recebe a diferença de pontos do time da vez para o líder.
export const TAUNT_BEHIND = (diff) => pick([
  `${diff} atrás. Hora de virar! 🔥`,
  `Faltam ${diff} pra alcançar. Bora!`,
  `Tão perdendo por ${diff}… por enquanto. 😏`,
])
export const TAUNT_AHEAD = (diff) => pick([
  `Na frente por ${diff}. Segura! 🛡️`,
  `+${diff} de vantagem. Não vacila.`,
  `Liderando por ${diff}. Mantém! 👑`,
])
export const TAUNT_TIED = () => pick([
  'Tudo empatado. Agora vale. 😬',
  'Empate técnico — decide no grito.',
  'Zero folga. Cada palavra conta.',
])

// Reação à inação — TurnPassScreen (princípio Jackbox: reagir a quem some)
export const IDLE_CALL = (name) => pick([
  `Cadê você, ${name}?`,
  `${name}, é você mesmo!`,
  `Alô, ${name}? 👀`,
])

export const IDLE_SUBTEXT = [
  'A galera tá esperando… 👀',
  'O celular não vai se passar sozinho.',
  'Bora, a rodada não anda sem você.',
]

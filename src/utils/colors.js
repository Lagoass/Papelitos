// 12 cores distintas — suporta até 4 times de 3 jogadores sem repetição.
// Ordem alternada por matiz para reduzir colisão visual entre jogadores consecutivos.
const PLAYER_COLORS = [
  '#22c55e',  // 0  verde
  '#3b82f6',  // 1  azul
  '#f97316',  // 2  laranja
  '#a855f7',  // 3  roxo
  '#ec4899',  // 4  rosa
  '#eab308',  // 5  amarelo
  '#06b6d4',  // 6  ciano
  '#ef4444',  // 7  vermelho
  '#84cc16',  // 8  lima
  '#6366f1',  // 9  índigo
  '#14b8a6',  // 10 teal
  '#d97706',  // 11 âmbar
]

export const getColor = (playerIndex) =>
  PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]

export default PLAYER_COLORS

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

// Escurece/clareia uma cor hex por um fator (0..1 escurece; >1 clareia).
// Usado para tingir telas inteiras com a cor do jogador mantendo contraste
// com texto branco (palco da TurnPass, fundo da arena).
export const shade = (hex, factor) => {
  const n = parseInt(hex.slice(1), 16)
  const ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * factor)))
  return `rgb(${ch(16)}, ${ch(8)}, ${ch(0)})`
}

export default PLAYER_COLORS

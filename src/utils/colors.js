const PLAYER_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f97316',
  '#a855f7',
  '#ec4899',
  '#eab308',
  '#06b6d4',
  '#ef4444',
]

export const getColor = (playerIndex) =>
  PLAYER_COLORS[playerIndex % PLAYER_COLORS.length]

export default PLAYER_COLORS

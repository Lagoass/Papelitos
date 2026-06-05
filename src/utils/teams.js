// IDs internos seguem A..D para preservar consistência de dados.
// A exibição usa o símbolo correspondente.
export const TEAM_IDS = ['A', 'B', 'C', 'D']

export const TEAM_SYMBOLS = {
  A: '■',
  B: '●',
  C: '▲',
  D: '★',
}

// Lista de IDs ativos dado o número de times.
export const teamIdsFor = (numTeams) => TEAM_IDS.slice(0, numTeams)

// Objeto teams inicial para N times.
export const buildTeams = (numTeams) => {
  const result = {}
  for (const id of teamIdsFor(numTeams)) {
    result[id] = { score: 0, playerIndices: [] }
  }
  return result
}

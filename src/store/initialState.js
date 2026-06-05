const initialState = {
  phase: 'setup',

  mode:           'normal',
  turnDuration:   60,
  wordsPerPlayer: 5,
  themes:         [],

  players:              [],
  wordInputCurrentIndex: 0,

  numTeams: 2,
  teams: {
    A: { score: 0, playerIndices: [] },
    B: { score: 0, playerIndices: [] },
  },

  teamOrder:      [],          // ordem ciclica, preenchida no ROULETTE_DONE
  currentTeamId:  null,
  roundStartTeam: null,

  // Rotação justa por prioridade (least-turns): o descritor do time é sempre
  // o jogador que jogou menos vezes. Ver seção 8.6.
  currentPlayerIndex: null,    // índice do descritor do turno atual (escolhido ao entrar em turnPass)
  turnSeq:            0,        // relógio global de turnos — desempate de "quem jogou há mais tempo"

  pool:  [],
  queue: [],

  round:            1,
  currentWord:      null,
  turnHits:         0,
  turnSkips:        0,

  tiebreakerFormat: null,
  tiebreakerTeams:  [],        // IDs dos times empatados que disputam o desempate
}

export default initialState

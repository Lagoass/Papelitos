const initialState = {
  phase: 'setup',

  mode:           'normal',
  turnDuration:   60,
  wordsPerPlayer: 5,
  themes:         [],

  players:              [],
  wordInputCurrentIndex: 0,

  teams: {
    A: { score: 0, playerIndices: [], queuePos: 0 },
    B: { score: 0, playerIndices: [], queuePos: 0 },
  },

  currentTeamId:  null,
  roundStartTeam: null,

  pool:  [],
  queue: [],

  round:            1,
  currentWord:      null,
  turnHits:         0,

  tiebreakerFormat: null,
}

export default initialState

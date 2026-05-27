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
    A: { score: 0, playerIndices: [], queuePos: 0 },
    B: { score: 0, playerIndices: [], queuePos: 0 },
  },

  teamOrder:      [],          // ordem ciclica, preenchida no ROULETTE_DONE
  currentTeamId:  null,
  roundStartTeam: null,

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

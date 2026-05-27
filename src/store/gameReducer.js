import initialState from './initialState.js'
import { shuffle } from '../utils/shuffle.js'
import { buildTeams, teamIdsFor } from '../utils/teams.js'
import { FAKE_WORDS } from '../utils/dev.js'

const gameReducer = (state, action) => {
  switch (action.type) {

    // ── Setup ──────────────────────────────────────────────────────────────

    case 'SET_MODE': {
      if (action.payload === 'normal') {
        return { ...state, mode: 'normal', themes: [], wordsPerPlayer: 5 }
      }
      return { ...state, mode: 'themed', themes: [], wordsPerPlayer: 0 }
    }

    case 'SET_TURN_DURATION':
      return { ...state, turnDuration: action.payload }

    case 'SET_WORDS_PER_PLAYER':
      return { ...state, wordsPerPlayer: action.payload }

    case 'SET_NUM_TEAMS': {
      const n = action.payload
      return { ...state, numTeams: n, teams: buildTeams(n) }
    }

    case 'ADD_THEME': {
      const newThemes = [...state.themes, action.payload]
      return { ...state, themes: newThemes, wordsPerPlayer: newThemes.length }
    }

    case 'REMOVE_THEME': {
      const newThemes = state.themes.filter(t => t !== action.payload)
      return { ...state, themes: newThemes, wordsPerPlayer: newThemes.length }
    }

    case 'SETUP_COMPLETE':
      return {
        ...state,
        players: [{ index: 0, teamId: null, name: '' }],
        teams: buildTeams(state.numTeams),
        phase: 'wordInput',
      }

    case 'TEST_QUICK_START': {
      const { numTeams, wordsPerPlayer } = state
      const wpp = wordsPerPlayer > 0 ? wordsPerPlayer : 5
      const totalPlayers = 2 * numTeams
      const teamIds = teamIdsFor(numTeams)

      const players = []
      const teams = buildTeams(numTeams)
      const wordBank = shuffle([...FAKE_WORDS])
      let cursor = 0
      const pool = []

      for (let i = 0; i < totalPlayers; i++) {
        const teamId = teamIds[i % numTeams]
        players.push({ index: i, teamId, name: `Teste ${i + 1}` })
        teams[teamId].playerIndices.push(i)

        for (let w = 0; w < wpp; w++) {
          const word = wordBank[cursor % wordBank.length]
          const dup = Math.floor(cursor / wordBank.length)
          cursor++
          pool.push({
            id: crypto.randomUUID(),
            text: dup > 0 ? `${word} ${dup + 1}` : word,
            theme: null,
            playerIndex: i,
          })
        }
      }

      return {
        ...state,
        mode: 'normal',
        themes: [],
        players,
        wordInputCurrentIndex: totalPlayers - 1,
        teams,
        pool,
        phase: 'roulette',
      }
    }

    // ── Inserção de palavras ───────────────────────────────────────────────

    case 'SET_PLAYER_NAME': {
      const newPlayers = state.players.map((p, i) =>
        i === state.wordInputCurrentIndex ? { ...p, name: action.payload } : p
      )
      return { ...state, players: newPlayers }
    }

    case 'SET_PLAYER_TEAM': {
      const newPlayers = state.players.map((p, i) =>
        i === state.wordInputCurrentIndex ? { ...p, teamId: action.payload } : p
      )
      return { ...state, players: newPlayers }
    }

    case 'PLAYER_CONFIRMED': {
      const { wordInputCurrentIndex, players, teams } = state
      const teamId = players[wordInputCurrentIndex].teamId

      const newWords = action.payload.words.map(({ text, theme = null }) => ({
        id: crypto.randomUUID(),
        text,
        theme,
        playerIndex: wordInputCurrentIndex,
      }))

      return {
        ...state,
        pool: [...state.pool, ...newWords],
        teams: {
          ...teams,
          [teamId]: {
            ...teams[teamId],
            playerIndices: [...teams[teamId].playerIndices, wordInputCurrentIndex],
          },
        },
        phase: 'wordInputPass',
      }
    }

    case 'NEXT_PLAYER': {
      const nextIndex = state.wordInputCurrentIndex + 1
      return {
        ...state,
        wordInputCurrentIndex: nextIndex,
        players: [...state.players, { index: nextIndex, teamId: null, name: '' }],
        phase: 'wordInput',
      }
    }

    case 'START_GAME': {
      const { players, teams, numTeams } = state
      const ids = teamIdsFor(numTeams)
      const valid =
        players.length >= 2 * numTeams &&
        ids.every(id => teams[id].playerIndices.length >= 2)
      if (!valid) return state
      return { ...state, phase: 'roulette' }
    }

    // ── Roulette e início ──────────────────────────────────────────────────

    case 'ROULETTE_DONE': {
      // payload: { teamOrder, firstTeam }
      // queuePos nunca alterado aqui — seção 8.6
      const { teamOrder, firstTeam } = action.payload
      return {
        ...state,
        teamOrder,
        currentTeamId: firstTeam,
        roundStartTeam: firstTeam,
        queue: shuffle([...state.pool]),
        phase: 'turnPass',
      }
    }

    // ── Turno ──────────────────────────────────────────────────────────────

    case 'TURN_CONFIRMED':
      return {
        ...state,
        currentWord: state.queue[0],
        turnSkips: 0,
        phase: 'playing',
      }

    case 'HIT': {
      const { currentTeamId, currentWord, queue, teams, turnHits, round, numTeams } = state

      const newTeams = {
        ...teams,
        [currentTeamId]: {
          ...teams[currentTeamId],
          score: teams[currentTeamId].score + 1,
        },
      }

      const newQueue = queue.filter(w => w.id !== currentWord.id)
      const newTurnHits = turnHits + 1

      if (newQueue.length === 0) {
        if (round === 4) {
          // determina vencedor / empate entre N times
          const ids = teamIdsFor(numTeams)
          const scores = ids.map(id => newTeams[id].score)
          const maxScore = Math.max(...scores)
          const tied = ids.filter(id => newTeams[id].score === maxScore)

          if (tied.length > 1) {
            return {
              ...state,
              teams: newTeams,
              queue: newQueue,
              turnHits: newTurnHits,
              phase: 'tiebreaker',
              currentWord: null,
              tiebreakerFormat: null,
              tiebreakerTeams: tied,
            }
          }
          return {
            ...state,
            teams: newTeams,
            queue: newQueue,
            turnHits: newTurnHits,
            phase: 'gameOver',
            currentWord: null,
          }
        }
        return {
          ...state,
          teams: newTeams,
          queue: newQueue,
          turnHits: newTurnHits,
          phase: 'roundTransition',
          currentWord: null,
        }
      }

      return {
        ...state,
        teams: newTeams,
        queue: newQueue,
        turnHits: newTurnHits,
        currentWord: newQueue[0],
      }
    }

    case 'SKIP': {
      // move currentWord do início para o fim da queue
      const rest = state.queue.filter(w => w.id !== state.currentWord.id)
      const newQueue = [...rest, state.currentWord]
      return { ...state, queue: newQueue, currentWord: newQueue[0], turnSkips: state.turnSkips + 1 }
    }

    case 'BACK': {
      if (state.turnSkips === 0 || state.queue.length <= 1) return state
      const prev = state.queue[state.queue.length - 1]
      const middle = state.queue.slice(1, -1)
      const newQueue = [prev, state.queue[0], ...middle]
      return { ...state, queue: newQueue, currentWord: prev, turnSkips: state.turnSkips - 1 }
    }

    case 'END_TURN': {
      const { currentTeamId, currentWord, queue, teams, teamOrder } = state
      // guard: END_TURN só faz sentido durante 'playing' com currentWord válido
      if (!currentWord || state.phase !== 'playing') return state
      const idx = teamOrder.indexOf(currentTeamId)
      const nextTeamId = teamOrder[(idx + 1) % teamOrder.length]

      // reinserir currentWord no final antes do shuffle — seção 8.4
      const withoutCurrent = queue.filter(w => w.id !== currentWord.id)
      const newQueue = shuffle([...withoutCurrent, currentWord])

      return {
        ...state,
        queue: newQueue,
        currentWord: null,
        teams: {
          ...teams,
          [currentTeamId]: {
            ...teams[currentTeamId],
            queuePos: teams[currentTeamId].queuePos + 1,
          },
        },
        currentTeamId: nextTeamId,
        turnHits: 0,
        turnSkips: 0,
        phase: 'turnPass',
      }
    }

    // ── Rodada ────────────────────────────────────────────────────────────

    case 'ADVANCE_ROUND': {
      const { teamOrder, roundStartTeam } = state
      const idx = teamOrder.indexOf(roundStartTeam)
      const newRoundStartTeam = teamOrder[(idx + 1) % teamOrder.length]

      return {
        ...state,
        round: state.round + 1,
        roundStartTeam: newRoundStartTeam,
        currentTeamId: newRoundStartTeam,
        queue: shuffle([...state.pool]),
        teams: {
          ...state.teams,
          [newRoundStartTeam]: {
            ...state.teams[newRoundStartTeam],
            queuePos: state.teams[newRoundStartTeam].queuePos + 1,
          },
        },
        turnHits: 0,
        turnSkips: 0,
        phase: 'turnPass',
      }
    }

    case 'GAME_OVER':
      return { ...state, phase: 'gameOver' }

    case 'RESET_GAME':
      return initialState

    case 'LOAD_GAME':
      return action.payload

    // ── Desempate ─────────────────────────────────────────────────────────

    case 'SELECT_TIEBREAKER_FORMAT':
      return { ...state, tiebreakerFormat: action.payload, phase: 'roulette' }

    case 'RANDOMIZE_TIEBREAKER_FORMAT':
      return { ...state, phase: 'formatRoulette' }

    case 'FORMAT_ROULETTE_DONE':
      return { ...state, tiebreakerFormat: action.payload, phase: 'roulette' }

    default:
      return state
  }
}

export default gameReducer

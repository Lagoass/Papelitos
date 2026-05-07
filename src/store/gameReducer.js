import initialState from './initialState.js'
import { shuffle } from '../utils/shuffle.js'

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
        players: [{ index: 0, teamId: null }],
        phase: 'wordInput',
      }

    // ── Inserção de palavras ───────────────────────────────────────────────

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
        players: [...state.players, { index: nextIndex, teamId: null }],
        phase: 'wordInput',
      }
    }

    case 'START_GAME': {
      const { players, teams } = state
      const valid =
        players.length >= 4 &&
        teams.A.playerIndices.length >= 2 &&
        teams.B.playerIndices.length >= 2
      if (!valid) return state
      return { ...state, phase: 'roulette' }
    }

    // ── Roulette e início ──────────────────────────────────────────────────

    case 'ROULETTE_DONE':
      // queuePos nunca alterado aqui — seção 8.6
      return {
        ...state,
        currentTeamId: action.payload,
        roundStartTeam: action.payload,
        queue: shuffle([...state.pool]),
        phase: 'turnPass',
      }

    // ── Turno ──────────────────────────────────────────────────────────────

    case 'TURN_CONFIRMED':
      return {
        ...state,
        currentWord: state.queue[0],
        phase: 'playing',
      }

    case 'HIT': {
      const { currentTeamId, currentWord, queue, teams, turnHits, round } = state

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
          // usa newTeams para checar empate com o placar já incrementado
          if (newTeams.A.score === newTeams.B.score) {
            return {
              ...state,
              teams: newTeams,
              queue: newQueue,
              turnHits: newTurnHits,
              phase: 'tiebreaker',
              currentWord: null,
              tiebreakerFormat: null,
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
      // se queue.length === 1, rest é vazio e newQueue[0] === currentWord (esperado)
      return { ...state, queue: newQueue, currentWord: newQueue[0] }
    }

    case 'END_TURN': {
      const { currentTeamId, currentWord, queue, teams } = state
      const nextTeamId = currentTeamId === 'A' ? 'B' : 'A'

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
        phase: 'turnPass',
      }
    }

    // ── Rodada ────────────────────────────────────────────────────────────

    case 'ADVANCE_ROUND': {
      const newRoundStartTeam = state.roundStartTeam === 'A' ? 'B' : 'A'

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
      return {
        ...state,
        tiebreakerFormat: Math.floor(Math.random() * 4) + 1,
        phase: 'roulette',
      }

    default:
      return state
  }
}

export default gameReducer

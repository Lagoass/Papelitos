import initialState from './initialState.js'
import { shuffle } from '../utils/shuffle.js'

const gameReducer = (state, action) => {
  switch (action.type) {

    // ── Setup ──────────────────────────────────────────────────────────────
    case 'SET_MODE':
      return state

    case 'SET_TURN_DURATION':
      return state

    case 'SET_WORDS_PER_PLAYER':
      return state

    case 'ADD_THEME':
      return state

    case 'REMOVE_THEME':
      return state

    case 'SETUP_COMPLETE':
      return state

    // ── Inserção de palavras ───────────────────────────────────────────────
    case 'SET_PLAYER_TEAM':
      return state

    case 'PLAYER_CONFIRMED':
      return state

    case 'NEXT_PLAYER':
      return state

    case 'START_GAME':
      return state

    // ── Roulette e início ──────────────────────────────────────────────────
    case 'ROULETTE_DONE':
      return state

    // ── Turno ──────────────────────────────────────────────────────────────
    case 'TURN_CONFIRMED':
      return state

    case 'HIT':
      return state

    case 'SKIP':
      return state

    case 'END_TURN':
      return state

    // ── Rodada ────────────────────────────────────────────────────────────
    case 'ADVANCE_ROUND':
      return state

    case 'GAME_OVER':
      return state

    case 'RESET_GAME':
      return initialState

    case 'LOAD_GAME':
      return action.payload

    // ── Desempate ─────────────────────────────────────────────────────────
    case 'SELECT_TIEBREAKER_FORMAT':
      return state

    case 'RANDOMIZE_TIEBREAKER_FORMAT':
      return state

    default:
      return state
  }
}

export default gameReducer

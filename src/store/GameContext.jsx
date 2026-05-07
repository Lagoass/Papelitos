import { createContext, useContext, useReducer, useEffect } from 'react'
import gameReducer from './gameReducer.js'
import initialState from './initialState.js'
import useLocalStorage from '../hooks/useLocalStorage.js'
import { STORAGE_KEY } from '../utils/storage.js'

const GameContext = createContext(null)

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  const { save, load, clear } = useLocalStorage(STORAGE_KEY)

  // salva após cada mudança de estado; limpa ao encerrar — seção 12
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (state.phase === 'gameOver') {
      clear()
    } else if (state.phase !== 'setup') {
      save(state)
    }
  }, [state])

  return (
    <GameContext.Provider value={{ state, dispatch, load, clear }}>
      {children}
    </GameContext.Provider>
  )
}

export const useGame = () => {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

export default GameContext

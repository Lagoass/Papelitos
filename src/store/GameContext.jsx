import { createContext, useContext, useReducer } from 'react'
import gameReducer from './gameReducer.js'
import initialState from './initialState.js'

const GameContext = createContext(null)

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
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

import { useGame } from './store/GameContext.jsx'

const SetupScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-black text-white">
    <p className="text-2xl font-bold">SetupScreen — placeholder</p>
  </div>
)

const App = () => {
  const { state } = useGame()

  // Será expandido nas próximas fases para rotear por state.phase
  return <SetupScreen />
}

export default App

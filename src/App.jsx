import { useState, useEffect } from 'react'
import { useGame } from './store/GameContext.jsx'
import SetupScreen from './screens/SetupScreen/index.jsx'
import WordInputScreen from './screens/WordInputScreen/index.jsx'
import WordInputPassScreen from './screens/WordInputPassScreen/index.jsx'
import RouletteScreen from './screens/RouletteScreen/index.jsx'
import TurnPassScreen from './screens/TurnPassScreen/index.jsx'
import TurnScreen from './screens/TurnScreen/index.jsx'
import RoundTransitionScreen from './screens/RoundTransitionScreen/index.jsx'
import TiebreakerScreen from './screens/TiebreakerScreen/index.jsx'
import FormatRouletteScreen from './screens/FormatRouletteScreen/index.jsx'
import ResultsScreen from './screens/ResultsScreen/index.jsx'
import SplashScreen from './screens/SplashScreen/index.jsx'
import Button from './components/Button/index.jsx'

const ResumeModal = ({ savedPhase, onResume, onNew }) => (
  <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center p-6 z-50">
    <p className="text-xl font-semibold text-center mb-2">Partida em andamento</p>
    <p className="text-zinc-400 text-sm text-center mb-10">
      Existe uma partida salva (fase: {savedPhase}). Deseja retomá-la?
    </p>
    <div className="w-full space-y-4">
      <Button onClick={onResume}>Retomar partida</Button>
      <Button variant="secondary" onClick={onNew}>Nova partida</Button>
    </div>
  </div>
)

const PHASE_SCREENS = {
  setup:           SetupScreen,
  wordInput:       WordInputScreen,
  wordInputPass:   WordInputPassScreen,
  roulette:        RouletteScreen,
  turnPass:        TurnPassScreen,
  playing:         TurnScreen,
  roundTransition: RoundTransitionScreen,
  tiebreaker:      TiebreakerScreen,
  formatRoulette:  FormatRouletteScreen,
  gameOver:        ResultsScreen,
}

const App = () => {
  const { state, dispatch, load, clear } = useGame()
  const [savedState, setSavedState] = useState(null)
  const [splashing, setSplashing] = useState(true)

  // Load único na montagem — seção 12
  useEffect(() => {
    const saved = load()
    if (saved && saved.phase !== 'setup' && saved.phase !== 'gameOver') {
      setSavedState(saved)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResume = () => {
    dispatch({ type: 'LOAD_GAME', payload: savedState })
    setSavedState(null)
  }

  const handleNewGame = () => {
    clear()
    setSavedState(null)
  }

  const Screen = PHASE_SCREENS[state.phase] ?? SetupScreen

  return (
    <>
      <Screen />
      {savedState && (
        <ResumeModal
          savedPhase={savedState.phase}
          onResume={handleResume}
          onNew={handleNewGame}
        />
      )}
      {splashing && <SplashScreen onDone={() => setSplashing(false)} />}
    </>
  )
}

export default App

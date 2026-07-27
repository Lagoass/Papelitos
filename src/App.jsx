import { useState, lazy, Suspense } from 'react'
import HomeScreen from '@shell/screens/HomeScreen/index.jsx'
import SplashScreen from '@shell/screens/SplashScreen/index.jsx'
import { hasAnyOngoingGame } from '@shell/games.js'

// Módulos de jogo carregados sob demanda — o bundle inicial é só o hub.
const GAME_COMPONENTS = {
  papelito: lazy(() => import('./games/papelito/index.jsx')),
  mural: lazy(() => import('./games/mural/index.jsx')),
}

const App = () => {
  // Splash só em abertura "limpa" — com partida em andamento o usuário
  // quer voltar rápido (o card "Continuar" está a 1 toque na home).
  const [splashing, setSplashing] = useState(() => !hasAnyOngoingGame())
  const [active, setActive] = useState(null) // { id, resume } | null

  const handlePlay = (id, { resume = false } = {}) => setActive({ id, resume })
  const handleExit = () => setActive(null)

  const ActiveGame = active ? GAME_COMPONENTS[active.id] : null

  return (
    <>
      {ActiveGame ? (
        <Suspense fallback={<div className="min-h-screen bg-black" />}>
          <ActiveGame onExit={handleExit} autoResume={active.resume} />
        </Suspense>
      ) : (
        <HomeScreen onPlay={handlePlay} />
      )}
      {splashing && <SplashScreen onDone={() => setSplashing(false)} />}
    </>
  )
}

export default App

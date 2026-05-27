import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { GameProvider } from './store/GameContext.jsx'
import App from './App.jsx'
import { applyTheme, getTheme } from './utils/themes.js'

// Aplica tema salvo (ou default) no body antes do render
applyTheme(getTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </StrictMode>,
)

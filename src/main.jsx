import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import './index.css'
import App from './App.jsx'
import { applyTheme, getTheme } from '@shell/utils/themes.js'

// Aplica tema salvo (ou default) no body antes do render.
// O GameProvider vive dentro de cada módulo de jogo — o shell não tem estado de jogo.
applyTheme(getTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

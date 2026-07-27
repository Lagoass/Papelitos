// Registry de jogos do hub — a costura entre shell e módulos.
// Cada jogo declara identidade visual (--game-accent, gradiente, emoji),
// categoria, metadados do card e a chave de save (para o card "Continuar").
// UserInterface.md §8.2: todo jogo novo preenche este template.
import { RULES as PAPELITO_RULES } from '../games/papelito/data/rules.js'

export const CATEGORIES = {
  pass:      { id: 'pass',      label: '📱 Um celular' },
  connected: { id: 'connected', label: '📶 Cada um no seu' },
}

export const GAMES = [
  {
    id: 'papelito',
    name: 'Papelito',
    emoji: '📜',
    category: 'pass',
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #b45309, #f59e0b 55%, #fbbf24)',
    meta: '👥 4+ · ⏱ ~20 min',
    saveKey: 'papelito_game_state',
    rules: PAPELITO_RULES,
  },
  {
    // Bancada de teste da categoria conectada (Change.md fase 3) —
    // descartável por design; valida salas/latência/reconexão do DO.
    id: 'mural',
    name: 'Mural',
    emoji: '📌',
    category: 'connected',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #155e75, #0891b2 55%, #22d3ee)',
    meta: '🧪 Bancada de teste · tempo real',
    saveKey: null,
    rules: null,
  },
]

// Lê o save de um jogo direto do localStorage (acoplamento documentado:
// o shell conhece só { phase, round } para montar o card "Continuar").
export const getSavedGame = (game) => {
  try {
    if (!game.saveKey) return null
    const raw = localStorage.getItem(game.saveKey)
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved || saved.phase === 'setup' || saved.phase === 'gameOver') return null
    return saved
  } catch {
    return null
  }
}

export const hasAnyOngoingGame = () => GAMES.some(g => getSavedGame(g) !== null)
